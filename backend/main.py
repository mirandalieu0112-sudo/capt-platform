import os
import io
import shutil
import tempfile
import urllib.request
import urllib.parse
from datetime import datetime
import numpy as np
import pandas as pd
import random
import subprocess
import zipfile
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, Body
from fastapi.responses import StreamingResponse, FileResponse
from starlette.background import BackgroundTask
from fastapi.middleware.cors import CORSMiddleware
import parselmouth

import database
import baseline_manager
from feedback_i18n import FEEDBACK_I18N
import edge_tts
import edge_tts.communicate

original_mkssml = edge_tts.communicate.mkssml

def custom_mkssml(tc, text):
    if isinstance(text, bytes):
        text = text.decode("utf-8")
    escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    
    escaped = escaped.replace("儲藏", "###CHUCANG###")
    escaped = escaped.replace("儲存", "###CHUCUN###")
    escaped = escaped.replace("藏", "<phoneme alphabet='bopomofo' ph='ㄘㄤˊ'>藏</phoneme>")
    
    escaped = escaped.replace("###CHUCANG###", "<phoneme alphabet='bopomofo' ph='ㄔㄨˇ ㄘㄤˊ'>儲藏</phoneme>")
    escaped = escaped.replace("###CHUCUN###", "<phoneme alphabet='bopomofo' ph='ㄔㄨˊ ㄘㄨㄣˊ'>儲存</phoneme>")

    return (
        "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-TW'>"
        f"<voice name='{tc.voice}'>"
        f"<prosody pitch='{tc.pitch}' rate='{tc.rate}' volume='{tc.volume}'>"
        f"{escaped}"
        "</prosody>"
        "</voice>"
        "</speak>"
    )

edge_tts.communicate.mkssml = custom_mkssml

def calculate_score(cog, f2, f3, vot_estimate, target_word):
    if cog is None: return None
    target_type = 'ch' if 'ch' in target_word.lower() else 'c'
    cog = float(cog)
    f3_f2_dist = (f3 - f2) if (f3 is not None and f2 is not None) else None
    
    baseline = baseline_manager.get_baseline_for_word(target_word)
    if not baseline:
        baseline = baseline_manager.get_fallback_baseline(target_type == 'ch')
        
    score = 0
    
    if target_type == 'c': # 舌尖前音 (c)
        # c usually has higher COG (6000-9000 Hz)
        cog_target = baseline.get('cog', 7500)
        # 評分依據: COG 是否夠高，越接近或高於常模越好
        if cog >= cog_target * 0.8 or cog >= 6000: 
            score = random.uniform(90, 100)
        elif cog >= cog_target * 0.6 or cog >= 4500:
            score = random.uniform(75, 89)
        else:
            score = random.uniform(60, 74)
    else: # 舌尖後音 (ch)
        f3_f2_target = baseline.get('f3_f2_diff', 1000)
        
        # ch 應該有明顯的 F3 下降，使得 F3-F2 距離縮小
        if f3_f2_dist is not None:
            # 如果 F3-F2 距離小於等於常模的 1.2 倍，或是絕對值低於 1200，視為發音良好
            if f3_f2_dist <= f3_f2_target * 1.2 or f3_f2_dist <= 1200:
                score = random.uniform(90, 100)
            elif f3_f2_dist <= f3_f2_target * 1.6 or f3_f2_dist <= 1800:
                score = random.uniform(75, 89)
            else:
                score = random.uniform(60, 74)
        else:
            # 容錯處理：如果抓不到 F3，暫時依賴 COG 判斷 (ch 的 COG 較低)
            cog_target = baseline.get('cog', 4000)
            if cog <= cog_target * 1.2 or cog <= 5000:
                score = random.uniform(90, 100)
            elif cog <= cog_target * 1.5 or cog <= 6000:
                score = random.uniform(75, 89)
            else:
                score = random.uniform(60, 74)
            
    # Penalty for missing aspiration (送氣不足)
    vot_target = baseline.get('vot_estimate', 100)
    if vot_estimate is not None and (vot_estimate < 30 or vot_estimate < vot_target * 0.4):
        score -= random.uniform(5, 10)
        
    return max(0, min(100, round(score)))

def get_feedback(cog, f2, f3, duration, intensity_max, vot_estimate, target_word, lang="zh"):
    t = FEEDBACK_I18N.get(lang, FEEDBACK_I18N["zh"])
    if cog is None: return t["error"]
    
    target_type = 'ch' if 'ch' in target_word.lower() else 'c'
    cog = float(cog)
    f3_f2_dist = (f3 - f2) if (f3 is not None and f2 is not None) else None
    
    baseline = baseline_manager.get_baseline_for_word(target_word)
    if not baseline:
        baseline = baseline_manager.get_fallback_baseline(target_type == 'ch')
        
    feedback_parts = []
    
    if target_type == 'c':
        cog_target = baseline.get('cog', 7500)
        if cog >= cog_target * 0.8 or cog >= 6000:
            feedback_parts.append(t["c_perfect"])
        elif cog >= cog_target * 0.6 or cog >= 4500:
            feedback_parts.append(t["c_good"])
        else:
            feedback_parts.append(t["c_bad"])
    else:
        f3_f2_target = baseline.get('f3_f2_diff', 1000)
        if f3_f2_dist is not None:
            if f3_f2_dist <= f3_f2_target * 1.2 or f3_f2_dist <= 1200:
                feedback_parts.append(t["ch_perfect"])
            elif f3_f2_dist <= f3_f2_target * 1.6 or f3_f2_dist <= 1800:
                feedback_parts.append(t["ch_good"])
            else:
                feedback_parts.append(t["ch_bad"])
        else:
            cog_target = baseline.get('cog', 4000)
            if cog <= cog_target * 1.2 or cog <= 5000:
                feedback_parts.append(t["ch_perfect"])
            elif cog <= cog_target * 1.5 or cog <= 6000:
                feedback_parts.append(t["ch_good"])
            else:
                feedback_parts.append(t["ch_bad"])
            
    vot_target = baseline.get('vot_estimate', 100)
    if vot_estimate is not None and (vot_estimate < 30 or vot_estimate < vot_target * 0.4):
        feedback_parts.append(t["vot"])
        
    if duration is not None and duration < 0.2:
        feedback_parts.append(t["duration"])
        
    intensity_target = baseline.get('intensity_max', 80)
    if intensity_max is not None and (intensity_max < 55 or intensity_max < intensity_target * 0.7):
        feedback_parts.append(t["intensity"])
        
    return " ".join(feedback_parts)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    database.init_db()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "CAPT Backend with Database is running"}

@app.get("/api/standard_audio")
async def get_standard_audio(word: str):
    # The user requested to use the most standard Taiwanese AI female voice for listening
    # We will bypass the teacher's recording and use edge-tts (HsiaoChenNeural) directly
    import re
    import edge_tts
    
    clean_word = re.sub(r'\s*\(.*?\)', '', word).strip()
    
    try:
        communicate = edge_tts.Communicate(clean_word, "zh-TW-HsiaoChenNeural")
        
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            temp_path = f.name
            
        await communicate.save(temp_path)
        
        return FileResponse(temp_path, media_type="audio/mpeg", background=BackgroundTask(os.remove, temp_path))
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/tts")
async def get_tts(text: str):
    return await get_standard_audio(text)

@app.post("/api/login")
async def login(
    name: str = Form(...),
    nationality: str = Form(""),
    native_language: str = Form(""),
    birthplace: str = Form(""),
    chinese_level: str = Form(""),
    gender: str = Form(""),
    role: str = Form("student"),
    class_name: str = Form("")
):
    conn = database.get_db_connection()
    c = conn.cursor()
    
    # Check if user with this name already exists
    c.execute("SELECT * FROM users WHERE name = ? AND role = ?", (name, role))
    user = c.fetchone()
    
    if not user:
        # Auto-generate user_id based on count
        c.execute("SELECT COUNT(*) FROM users WHERE role = ?", (role,))
        count = c.fetchone()[0]
        prefix = 'S' if role == 'student' else 'T'
        user_id = f"{prefix}{count + 1}"
        
        c.execute('''
            INSERT INTO users (user_id, name, role, class_name, nationality, native_language, birthplace, chinese_level, gender, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, name, role, class_name, nationality, native_language, birthplace, chinese_level, gender, datetime.now().isoformat()))
    else:
        user_id = user['user_id']
        # Update if they provided new data
        if nationality:
            c.execute('''
                UPDATE users SET role=?, class_name=?, nationality=?, native_language=?, birthplace=?, chinese_level=?, gender=?
                WHERE user_id=?
            ''', (role, class_name, nationality, native_language, birthplace, chinese_level, gender, user_id))
    
    conn.commit()
    conn.close()
    return {"status": "success", "user_id": user_id, "name": name}

@app.post("/api/log/listening")
async def log_listening(
    user_id: str = Form(...),
    level_id: int = Form(...),
    target_word: str = Form(...),
    selected_word: str = Form(...),
    is_correct: str = Form(...), # Form parsing gets string
    reaction_time_ms: int = Form(0)
):
    is_correct_bool = is_correct.lower() == 'true'
    conn = database.get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO listening_logs (user_id, level_id, target_word, selected_word, is_correct, reaction_time_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, level_id, target_word, selected_word, is_correct_bool, reaction_time_ms, datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post("/api/upload")
async def upload_audio(
    audio: UploadFile = File(...),
    user_id: str = Form("unknown"),
    level_id: int = Form(1),
    target_word: str = Form("unknown"),
    lang: str = Form("zh")
):
    try:
        # Fetch user info for naming convention
        conn = database.get_db_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        user = c.fetchone()
        
        # Calculate attempt number
        c.execute("SELECT COUNT(*) FROM speaking_logs WHERE user_id = ? AND target_word = ?", (user_id, target_word))
        count = c.fetchone()[0]
        attempt_number = f"{count + 1}_3"
        
        nationality = user['nationality'] if user and user['nationality'] else "未知"
        native_language = user['native_language'] if user and user['native_language'] else "未知"
        birthplace = user['birthplace'] if user and user['birthplace'] else "未知"
        chinese_level = user['chinese_level'] if user and user['chinese_level'] else "未知"
        gender = user['gender'] if user and user['gender'] else "未知"
        
        # Format Mappings
        nat_mapped = "越南" if nationality == "vn" else nationality
        lang_mapped = "越南語" if native_language == "vn" else native_language
        
        if chinese_level == "A0":
            level_mapped = "準備級"
        elif chinese_level == "Native":
            level_mapped = "母語"
        else:
            level_mapped = chinese_level
            
        if gender.lower() in ['female', 'f', '女']:
            gender_mapped = "F"
        elif gender.lower() in ['male', 'm', '男']:
            gender_mapped = "M"
        else:
            gender_mapped = gender
        
        # Format: UserID_Nationality_Birthplace_AttemptNumber_Word_NativeLanguage_ChineseLevel_Gender.wav
        clean_word = target_word.split(" ")[0].replace("/", "_")
        final_filename = f"{user_id}_{nat_mapped}_{birthplace}_{attempt_number}_{clean_word}_{lang_mapped}_{level_mapped}_{gender_mapped}.wav"
        final_path = os.path.join(database.AUDIO_DIR, final_filename)
        
        # Save audio permanently (temp first)
        temp_audio_path = os.path.join(database.AUDIO_DIR, "temp_" + final_filename)
        with open(temp_audio_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        # Convert to standard WAV using ffmpeg to ensure Parselmouth can read it
        try:
            subprocess.run([
                "ffmpeg", "-y", "-i", temp_audio_path, 
                "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "1", 
                final_path
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            os.remove(temp_audio_path)
        except Exception as e:
            print(f"FFmpeg conversion error: {e}")
            # Fallback to just renaming if ffmpeg fails
            if os.path.exists(temp_audio_path):
                os.rename(temp_audio_path, final_path)

        # Acoustic Analysis
        snd = parselmouth.Sound(final_path)
        duration = snd.get_total_duration()

        # F1, F2, F3
        formant = snd.to_formant_burg()
        midpoint = duration / 2.0
        f1 = formant.get_value_at_time(1, midpoint)
        f2 = formant.get_value_at_time(2, midpoint)
        f3 = formant.get_value_at_time(3, midpoint)
        
        f1 = round(f1, 2) if not np.isnan(f1) else None
        f2 = round(f2, 2) if not np.isnan(f2) else None
        f3 = round(f3, 2) if not np.isnan(f3) else None

        # F0 (Pitch)
        pitch = snd.to_pitch()
        f0 = pitch.get_value_at_time(midpoint)
        f0 = round(f0, 2) if not np.isnan(f0) else None

        # Intensity Max (for Burst/Rise Time estimation)
        intensity = snd.to_intensity()
        intensity_max = intensity.get_maximum()
        intensity_max = round(intensity_max, 2) if not np.isnan(intensity_max) else None

        # COG
        spectrum = snd.to_spectrum()
        cog = spectrum.get_center_of_gravity()
        cog = round(cog, 2) if not np.isnan(cog) else None
        
        # VOT (Very rough estimate: time from start to peak intensity)
        try:
            values = intensity.values[0]
            if len(values) > 0:
                max_frame = np.argmax(values)
                time_of_max = intensity.xs()[max_frame]
                vot_estimate = round(time_of_max * 1000, 2) # in ms
            else:
                vot_estimate = 0.0
        except Exception:
            vot_estimate = 0.0

        score = calculate_score(cog, f2, f3, vot_estimate, target_word)
        feedback_text = get_feedback(cog, f2, f3, duration, intensity_max, vot_estimate, target_word, lang=lang)

        c.execute('''
            INSERT INTO speaking_logs (user_id, level_id, target_word, attempt_number, audio_filename, duration, f0, f1, f2, f3, cog, vot_estimate, intensity_max, created_at, score, feedback_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, level_id, target_word, attempt_number, final_filename, duration, f0, f1, f2, f3, cog, vot_estimate, intensity_max, datetime.now().isoformat(), score, feedback_text))
        conn.commit()
        conn.close()

        return {
            "status": "success", 
            "filename": final_filename,
            "score": score,
            "feedback": feedback_text,
            "acoustic_features": {
                "duration": duration,
                "F0": f0,
                "F1": f1,
                "F2": f2,
                "F3": f3,
                "COG": cog,
                "VOT_estimate_ms": vot_estimate,
                "Intensity_max": intensity_max
            }
        }
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@app.get("/api/user/{user_id}/history")
def get_user_history(user_id: str, lang: str = "zh"):
    conn = database.get_db_connection()
    c = conn.cursor()
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        
        c.execute("SELECT * FROM listening_logs WHERE user_id = ? AND created_at LIKE ? ORDER BY created_at DESC", (user_id, f"{today}%"))
        listening = [dict(row) for row in c.fetchall()]
        
        c.execute("SELECT * FROM speaking_logs WHERE user_id = ? AND created_at LIKE ? ORDER BY created_at DESC", (user_id, f"{today}%"))
        speaking = []
        for row in c.fetchall():
            d = dict(row)
            # Reconstruct localized feedback dynamically
            d["feedback_text"] = get_feedback(d["cog"], d["f2"], d["f3"], d["duration"], d["intensity_max"], d["vot_estimate"], d["target_word"], lang=lang)
            speaking.append(d)
        
        return {
            "status": "success",
            "date": today,
            "listening": listening,
            "speaking": speaking
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

@app.get("/api/admin/export")
def export_data():
    conn = database.get_db_connection()
    # Read tables into Pandas DataFrames
    users_df = pd.read_sql_query("SELECT * FROM users", conn)
    listening_df = pd.read_sql_query("SELECT * FROM listening_logs", conn)
    speaking_df = pd.read_sql_query("SELECT * FROM speaking_logs", conn)
    
    try:
        reviews_df = pd.read_sql_query("SELECT * FROM teacher_reviews", conn)
    except:
        reviews_df = pd.DataFrame()
        
    conn.close()
    
    # Add Advanced Acoustic Features to Speaking Logs
    if not speaking_df.empty:
        if 'f3' in speaking_df.columns and 'f2' in speaking_df.columns:
            speaking_df['f3_minus_f2'] = speaking_df['f3'] - speaking_df['f2']
        
        # Add empty columns for manual PRAAT analysis later
        speaking_df['單元音聲學特性(Vowel)'] = ""
        speaking_df['輔音聲學特性(Consonant)'] = ""
        speaking_df['COT'] = ""
        
    # Convert reaction time to seconds for Listening Logs
    if not listening_df.empty and 'reaction_time_ms' in listening_df.columns:
        listening_df['reaction_time_s'] = listening_df['reaction_time_ms'] / 1000.0
    
    # Save to Excel
    export_path = "data/capt_data_export.xlsx"
    with pd.ExcelWriter(export_path, engine='openpyxl') as writer:
        users_df.to_excel(writer, sheet_name="Users", index=False)
        listening_df.to_excel(writer, sheet_name="Listening Logs", index=False)
        speaking_df.to_excel(writer, sheet_name="Speaking Logs", index=False)
        reviews_df.to_excel(writer, sheet_name="Teacher Reviews", index=False)
        
    return FileResponse(export_path, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename='CAPT_Research_Data.xlsx')

class ZipExportRequest(BaseModel):
    logs: List[Dict[str, Any]]

@app.post("/api/admin/export_audio_zip")
async def export_audio_zip(req: ZipExportRequest):
    df = pd.DataFrame(req.logs)
    
    filenames = []
    if 'audio_filename' in df.columns:
        filenames = df['audio_filename'].dropna().unique().tolist()
        filenames = [f for f in filenames if f and str(f).strip()]
        
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False, encoding='utf-8-sig')
        zip_file.writestr("selected_data.csv", csv_buffer.getvalue())
        
        for fname in filenames:
            file_path = os.path.join(database.AUDIO_DIR, fname)
            if os.path.exists(file_path):
                zip_file.write(file_path, arcname=f"audio/{fname}")
                
    zip_buffer.seek(0)
    
    return StreamingResponse(
        zip_buffer, 
        media_type="application/zip", 
        headers={"Content-Disposition": f"attachment; filename=CAPT_Selected_Audio.zip"}
    )

class TeacherReview(BaseModel):
    teacher_name: str
    target_word: str
    audio_type: str
    audio_filename: str
    is_correct: bool
    confidence_score: int
    teacher_score: Optional[int] = None
    feedback_duration: Optional[str] = ""
    feedback_volume: Optional[str] = ""
    feedback_comfort: Optional[str] = ""
    feedback_aspiration: Optional[str] = ""

@app.post("/api/teacher/review")
async def post_teacher_review(review: TeacherReview):
    conn = database.get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO teacher_reviews (teacher_name, target_word, audio_type, audio_filename, is_correct, confidence_score, teacher_score, feedback_duration, feedback_volume, feedback_comfort, feedback_aspiration, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (review.teacher_name, review.target_word, review.audio_type, review.audio_filename, review.is_correct, review.confidence_score, review.teacher_score, review.feedback_duration, review.feedback_volume, review.feedback_comfort, review.feedback_aspiration, datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/api/admin/audio_logs")
def get_all_audio_logs():
    conn = database.get_db_connection()
    c = conn.cursor()
    
    # Speaking Logs
    c.execute('''
        SELECT 
            'speaking_' || s.id as id, 
            s.id as raw_id,
            s.created_at, 
            s.user_id, 
            u.name,
            u.class_name,
            u.nationality, 
            u.birthplace, 
            '口說' as type, 
            '' as result, 
            s.target_word, 
            u.chinese_level, 
            u.gender, 
            s.audio_filename, 
            s.attempt_number,
            s.f0, s.f1, s.f2, s.f3, s.cog, s.vot_estimate, s.duration,
            s.score, s.feedback_text
        FROM speaking_logs s
        LEFT JOIN users u ON s.user_id = u.user_id
    ''')
    speaking = [dict(row) for row in c.fetchall()]
    
    # Listening Logs
    c.execute('''
        SELECT 
            'listening_' || l.id as id, 
            l.id as raw_id,
            l.created_at, 
            l.user_id, 
            u.name,
            u.class_name,
            u.nationality, 
            u.birthplace, 
            '聽力' as type, 
            CASE WHEN l.is_correct = 1 THEN '答對' ELSE '答錯' END as result, 
            l.target_word, 
            u.chinese_level, 
            u.gender, 
            '' as audio_filename, 
            '' as attempt_number,
            null as f0, null as f1, null as f2, null as f3, null as cog, null as vot_estimate, null as duration,
            null as score, null as feedback_text
        FROM listening_logs l
        LEFT JOIN users u ON l.user_id = u.user_id
    ''')
    listening = [dict(row) for row in c.fetchall()]
    
    conn.close()
    
    all_logs = speaking + listening
    all_logs.sort(key=lambda x: x['created_at'], reverse=True)
    
    return {"status": "success", "logs": all_logs}

@app.get("/api/admin/teacher_reviews")
def get_all_teacher_reviews():
    conn = database.get_db_connection()
    c = conn.cursor()
    c.execute('''
        SELECT 
            'review_' || id as id, 
            id as raw_id,
            teacher_name,
            target_word,
            audio_type,
            audio_filename,
            is_correct,
            confidence_score,
            teacher_score,
            feedback_duration,
            feedback_volume,
            feedback_comfort,
            feedback_aspiration,
            created_at
        FROM teacher_reviews
        ORDER BY created_at DESC
    ''')
    reviews = [dict(row) for row in c.fetchall()]
    conn.close()
    return {"status": "success", "reviews": reviews}

@app.get("/api/audio/{filename}")
def get_audio_file(filename: str):
    file_path = os.path.join(database.AUDIO_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/wav")
    return {"status": "error", "message": "File not found"}

@app.delete("/api/admin/audio/{log_id}")
def delete_audio_log(log_id: str):
    conn = database.get_db_connection()
    c = conn.cursor()
    
    if log_id.startswith('speaking_'):
        real_id = int(log_id.replace('speaking_', ''))
        c.execute("SELECT audio_filename FROM speaking_logs WHERE id = ?", (real_id,))
        row = c.fetchone()
        if row:
            filename = row['audio_filename']
            file_path = os.path.join(database.AUDIO_DIR, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
            c.execute("DELETE FROM speaking_logs WHERE id = ?", (real_id,))
            conn.commit()
            conn.close()
            return {"status": "success"}
    elif log_id.startswith('listening_'):
        real_id = int(log_id.replace('listening_', ''))
        c.execute("DELETE FROM listening_logs WHERE id = ?", (real_id,))
        conn.commit()
        conn.close()
        return {"status": "success"}
        
    conn.close()
    return {"status": "error", "message": "Log not found"}

@app.get("/api/forum/posts")
def get_forum_posts(user_id: str = None):
    conn = database.get_db_connection()
    c = conn.cursor()
    
    if user_id:
        c.execute("SELECT * FROM banned_users WHERE user_id = ?", (user_id,))
        if c.fetchone():
            conn.close()
            return {"status": "banned"}

    c.execute("SELECT * FROM forum_posts ORDER BY created_at DESC")
    posts = [dict(row) for row in c.fetchall()]
    
    c.execute("SELECT * FROM forum_reactions")
    reactions = [dict(row) for row in c.fetchall()]
    conn.close()
    
    from collections import defaultdict
    reaction_map = defaultdict(list)
    for r in reactions:
        reaction_map[r['post_id']].append(r)
        
    for post in posts:
        post['reactions'] = reaction_map[post['id']]
        
    return {"status": "success", "posts": posts}

@app.post("/api/forum/posts")
async def create_forum_post(
    user_id: str = Form(...),
    name: str = Form(...),
    role: str = Form(...),
    content: str = Form(...),
    media_url: str = Form(None),
    media_type: str = Form(None)
):
    conn = database.get_db_connection()
    c = conn.cursor()
    
    c.execute("SELECT * FROM banned_users WHERE user_id = ?", (user_id,))
    if c.fetchone():
        conn.close()
        return {"status": "banned"}

    bad_words = ["fuck", "shit", "bitch", "damn", "cunt", "asshole", 
                 "幹", "靠", "媽的", "操", "婊子", "傻逼", "屌", 
                 "đụ", "má", "cặc", "lồn", "chó đẻ", "đĩ"]
                 
    content_lower = content.lower()
    for word in bad_words:
        if word in content_lower:
            conn.close()
            return {"status": "error", "message": "Profanity detected"}

    c.execute('''
        INSERT INTO forum_posts (user_id, name, role, content, media_url, media_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, name, role, content, media_url, media_type, datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post("/api/forum/media")
async def upload_forum_media(file: UploadFile = File(...)):
    media_dir = os.path.join(database.DATA_DIR, "forum_media")
    os.makedirs(media_dir, exist_ok=True)
    
    import uuid
    ext = file.filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(media_dir, filename)
    
    with open(file_path, "wb") as buffer:
        import shutil
        shutil.copyfileobj(file.file, buffer)
        
    return {"status": "success", "url": f"/api/forum/media/{filename}"}

@app.get("/api/forum/media/{filename}")
def get_forum_media(filename: str):
    media_dir = os.path.join(database.DATA_DIR, "forum_media")
    file_path = os.path.join(media_dir, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"status": "error", "message": "File not found"}

class ReactionRequest(BaseModel):
    post_id: int
    user_id: str
    name: str
    reaction_type: str

@app.post("/api/forum/reactions")
def toggle_forum_reaction(req: ReactionRequest):
    conn = database.get_db_connection()
    c = conn.cursor()
    
    c.execute("SELECT id FROM forum_reactions WHERE post_id=? AND user_id=? AND reaction_type=?", 
              (req.post_id, req.user_id, req.reaction_type))
    row = c.fetchone()
    
    if row:
        c.execute("DELETE FROM forum_reactions WHERE id=?", (row['id'],))
        action = "removed"
    else:
        c.execute("INSERT INTO forum_reactions (post_id, user_id, name, reaction_type, created_at) VALUES (?, ?, ?, ?, ?)",
                  (req.post_id, req.user_id, req.name, req.reaction_type, datetime.now().isoformat()))
        action = "added"
        
    conn.commit()
    conn.close()
    
    return {"status": "success", "action": action}

@app.delete("/api/forum/posts/{post_id}")
def delete_forum_post(post_id: int):
    conn = database.get_db_connection()
    c = conn.cursor()
    c.execute("DELETE FROM forum_posts WHERE id=?", (post_id,))
    c.execute("DELETE FROM forum_reactions WHERE post_id=?", (post_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

class BanRequest(BaseModel):
    user_id: str
    banned_by: str

@app.post("/api/forum/ban")
def ban_forum_user(req: BanRequest):
    conn = database.get_db_connection()
    c = conn.cursor()
    try:
        c.execute("INSERT INTO banned_users (user_id, banned_by, created_at) VALUES (?, ?, ?)",
                  (req.user_id, req.banned_by, datetime.now().isoformat()))
        conn.commit()
    except sqlite3.IntegrityError:
        pass # Already banned
    finally:
        conn.close()
    return {"status": "success"}
