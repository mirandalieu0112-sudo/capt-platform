import sqlite3
import os
import json
from datetime import datetime

DB_FILE = "capt_data.db"
AUDIO_DIR = "data/audio"

def init_db():
    if not os.path.exists("data"):
        os.makedirs("data")
    if not os.path.exists(AUDIO_DIR):
        os.makedirs(AUDIO_DIR)

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    # Users Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE,
            name TEXT,
            role TEXT,
            class_name TEXT,
            nationality TEXT,
            native_language TEXT,
            birthplace TEXT,
            chinese_level TEXT,
            gender TEXT,
            created_at TEXT
        )
    ''')

    # Listening Logs Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS listening_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            level_id INTEGER,
            target_word TEXT,
            selected_word TEXT,
            is_correct BOOLEAN,
            reaction_time_ms INTEGER,
            created_at TEXT
        )
    ''')

    # Speaking Logs Table (Stores detailed acoustic analysis)
    c.execute('''
        CREATE TABLE IF NOT EXISTS speaking_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            level_id INTEGER,
            target_word TEXT,
            attempt_number TEXT,
            audio_filename TEXT,
            duration REAL,
            f0 REAL,
            f1 REAL,
            f2 REAL,
            f3 REAL,
            cog REAL,
            vot_estimate REAL,
            intensity_max REAL,
            created_at TEXT
        )
    ''')

    # Forum Posts Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS forum_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            name TEXT,
            role TEXT,
            content TEXT,
            created_at TEXT
        )
    ''')

    # Forum Replies Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS forum_replies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER,
            user_id TEXT,
            name TEXT,
            role TEXT,
            content TEXT,
            created_at TEXT
        )
    ''')

    # Teacher Reviews Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS teacher_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id TEXT,
            speaking_log_id INTEGER,
            is_correct BOOLEAN,
            confidence_score INTEGER,
            duration_feedback TEXT,
            volume_feedback TEXT,
            comfort_feedback TEXT,
            aspiration_feedback TEXT,
            created_at TEXT
        )
    ''')
    
    # Forum Tables
    c.execute('''
        CREATE TABLE IF NOT EXISTS forum_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author_id TEXT,
            content TEXT,
            audio_filename TEXT,
            is_private BOOLEAN,
            target_user_id TEXT,
            created_at TEXT
        )
    ''')

    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn
