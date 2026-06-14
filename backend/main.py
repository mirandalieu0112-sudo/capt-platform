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
from pydantic import BaseModel
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import parselmouth

import database

def calculate_score(cog, target_word):
    if cog is None: return None
    target_type = 'ch' if 'ch' in target_word.lower() else 'c'
    cog = float(cog)
    score = 0
    if target_type == 'c':
        if cog > 4500: score = 100 - random.uniform(0, 8)
        elif cog > 3500: score = 92 - random.uniform(0, 10)
        else: score = 82 - random.uniform(0, 12)
    else:
        if 2500 < cog < 5500: score = 100 - random.uniform(0, 8)
        elif cog > 5500: score = 92 - random.uniform(0, 10)
        else: score = 82 - random.uniform(0, 12)
    return max(0, min(100, round(score)))

def get_feedback(cog, target_word):
    if cog is None: return "無法分析聲音頻率，請確保麥克風收音清晰且周圍安靜。"
    target_type = 'ch' if 'ch' in target_word.lower() else 'c'
    cog = float(cog)
    if target_type == 'c':
        if cog > 3500: return "完美命中「c」的標準頻率區間，舌尖位置很準確。"
        else: return "聽起來比較像捲舌的 ch。請嘗試把舌尖再往前抵住下門牙背，不要往後捲縮。"
    else:
        if 2500 < cog < 5500: return "完美命中「ch」的標準頻率區間，捲舌位置恰到好處。"
        else: return "聽起來比較像平舌的 c。嘗試將舌尖向後捲曲，保留縫隙，發音會更準確喔！"

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

@app.get("/api/tts")
def get_tts(text: str):
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-TW&q={urllib.parse.quote(text)}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
        response = urllib.request.urlopen(req)
        def iterfile():
            yield from response
        return StreamingResponse(iterfile(), media_type="audio/mpeg")
    except Exception as e:
        return {"status": "error", "message": str(e)}

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
    target_word: str = Form("unknown")
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
        
        # Format: 學生名字_國籍_學生母語_學生出生地_錄製號碼_錄製的字詞_中文程度_性別.wav
        clean_word = target_word.split(" ")[0].replace("/", "_")
        name_for_file = user['name'] if user and user['name'] else user_id
        final_filename = f"{name_for_file}_{nationality}_{native_language}_{birthplace}_{attempt_number}_{clean_word}_{chinese_level}_{gender}.wav"
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

        score = calculate_score(cog, target_word)
        feedback_text = get_feedback(cog, target_word)

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
def get_user_history(user_id: str):
    conn = database.get_db_connection()
    c = conn.cursor()
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        
        c.execute("SELECT * FROM listening_logs WHERE user_id = ? AND created_at LIKE ? ORDER BY created_at DESC", (user_id, f"{today}%"))
        listening = [dict(row) for row in c.fetchall()]
        
        c.execute("SELECT * FROM speaking_logs WHERE user_id = ? AND created_at LIKE ? ORDER BY created_at DESC", (user_id, f"{today}%"))
        speaking = [dict(row) for row in c.fetchall()]
        
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

class TeacherReview(BaseModel):
    teacher_name: str
    target_word: str
    audio_type: str
    audio_filename: str
    is_correct: bool
    confidence_score: int
    feedback_duration: Optional[str] = ""
    feedback_volume: Optional[str] = ""
    feedback_comfort: Optional[str] = ""
    feedback_aspiration: Optional[str] = ""

@app.post("/api/teacher/review")
async def post_teacher_review(review: TeacherReview):
    conn = database.get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO teacher_reviews (teacher_name, target_word, audio_type, audio_filename, is_correct, confidence_score, feedback_duration, feedback_volume, feedback_comfort, feedback_aspiration, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (review.teacher_name, review.target_word, review.audio_type, review.audio_filename, review.is_correct, review.confidence_score, review.feedback_duration, review.feedback_volume, review.feedback_comfort, review.feedback_aspiration, datetime.now().isoformat()))
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
            u.nationality, 
            u.birthplace, 
            '口說' as type, 
            '' as result, 
            s.target_word, 
            u.chinese_level, 
            u.gender, 
            s.audio_filename, 
            s.attempt_number,
            s.f0, s.f1, s.f2, s.f3, s.cog, s.vot_estimate,
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
            u.nationality, 
            u.birthplace, 
            '聽力' as type, 
            CASE WHEN l.is_correct = 1 THEN '答對' ELSE '答錯' END as result, 
            l.target_word, 
            u.chinese_level, 
            u.gender, 
            '' as audio_filename, 
            '' as attempt_number,
            null as f0, null as f1, null as f2, null as f3, null as cog, null as vot_estimate,
            null as score, null as feedback_text
        FROM listening_logs l
        LEFT JOIN users u ON l.user_id = u.user_id
    ''')
    listening = [dict(row) for row in c.fetchall()]
    
    conn.close()
    
    all_logs = speaking + listening
    all_logs.sort(key=lambda x: x['created_at'], reverse=True)
    
    return {"status": "success", "logs": all_logs}

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
def get_forum_posts():
    conn = database.get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM forum_posts ORDER BY created_at DESC")
    posts = [dict(row) for row in c.fetchall()]
    conn.close()
    return {"status": "success", "posts": posts}

@app.post("/api/forum/posts")
async def create_forum_post(
    user_id: str = Form(...),
    name: str = Form(...),
    role: str = Form(...),
    content: str = Form(...)
):
    conn = database.get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO forum_posts (user_id, name, role, content, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, name, role, content, datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return {"status": "success"}
