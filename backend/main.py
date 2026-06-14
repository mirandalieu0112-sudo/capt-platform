import os
import io
import shutil
import tempfile
import urllib.request
import urllib.parse
from datetime import datetime
import numpy as np
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import parselmouth

import database

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
    target_word: str = Form("unknown"),
    attempt_number: str = Form("1_1")
):
    try:
        # Fetch user info for naming convention
        conn = database.get_db_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        user = c.fetchone()
        
        # Audio formatting uses S1 instead of the real name
        # "學生名字_國籍... -> 這裡的學生名字我們沿用 S1 / T1 來當作匿名學術代號"
        name = user['user_id'] if user else user_id
        nationality = user['nationality'] if user and user['nationality'] else "未知"
        native_language = user['native_language'] if user and user['native_language'] else "未知"
        birthplace = user['birthplace'] if user and user['birthplace'] else "未知"
        chinese_level = user['chinese_level'] if user and user['chinese_level'] else "未知"
        gender = user['gender'] if user and user['gender'] else "未知"
        
        # Format: 學生名字_國籍_學生母語_學生出生地_錄製號碼_錄製的字詞_中文程度_性別.wav
        clean_word = target_word.split(" ")[0].replace("/", "_")
        final_filename = f"{name}_{nationality}_{native_language}_{birthplace}_{attempt_number}_{clean_word}_{chinese_level}_{gender}.wav"
        final_path = os.path.join(database.AUDIO_DIR, final_filename)
        
        # Save audio permanently
        with open(final_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

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

        c.execute('''
            INSERT INTO speaking_logs (user_id, level_id, target_word, attempt_number, audio_filename, duration, f0, f1, f2, f3, cog, vot_estimate, intensity_max, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, level_id, target_word, attempt_number, final_filename, duration, f0, f1, f2, f3, cog, vot_estimate, intensity_max, datetime.now().isoformat()))
        conn.commit()
        conn.close()

        return {
            "status": "success", 
            "filename": final_filename,
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
    conn.close()
    
    # Save to Excel
    export_path = "data/capt_data_export.xlsx"
    with pd.ExcelWriter(export_path, engine='openpyxl') as writer:
        users_df.to_excel(writer, sheet_name="Users", index=False)
        listening_df.to_excel(writer, sheet_name="Listening Logs", index=False)
        speaking_df.to_excel(writer, sheet_name="Speaking Logs", index=False)
        
    return FileResponse(export_path, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename='CAPT_Research_Data.xlsx')

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
