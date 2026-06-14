import sqlite3
import random
import os

DB_PATH = "backend/data/capt_data.db"

def calculate_score(cog, target_word):
    if cog is None:
        return None
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
    if cog is None:
        return "無法分析聲音頻率，請重新錄製"
    target_type = 'ch' if 'ch' in target_word.lower() else 'c'
    cog = float(cog)
    if target_type == 'c':
        if cog > 3500:
            return "完美命中「c」的標準頻率區間，舌尖位置很準確。"
        else:
            return "聽起來比較像捲舌的 ch。請嘗試把舌尖再往前抵住下門牙背，不要往後捲縮。"
    else:
        if 2500 < cog < 5500:
            return "完美命中「ch」的標準頻率區間，捲舌位置恰到好處。"
        else:
            return "聽起來比較像平舌的 c。嘗試將舌尖向後捲曲，保留縫隙，發音會更準確喔！"

def main():
    if not os.path.exists(DB_PATH):
        print("DB not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Add columns if not exist
    try:
        c.execute("ALTER TABLE speaking_logs ADD COLUMN score INTEGER")
    except sqlite3.OperationalError:
        pass # Column already exists
        
    try:
        c.execute("ALTER TABLE speaking_logs ADD COLUMN feedback_text TEXT")
    except sqlite3.OperationalError:
        pass # Column already exists

    # Fetch existing records
    c.execute("SELECT id, cog, target_word FROM speaking_logs")
    rows = c.fetchall()

    updates = []
    for row in rows:
        score = calculate_score(row['cog'], row['target_word'])
        feedback = get_feedback(row['cog'], row['target_word'])
        updates.append((score, feedback, row['id']))

    # Update records
    c.executemany("UPDATE speaking_logs SET score = ?, feedback_text = ? WHERE id = ?", updates)
    conn.commit()
    conn.close()
    print(f"Migrated {len(updates)} records.")

if __name__ == "__main__":
    main()
