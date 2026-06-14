import sqlite3
import os

OLD_DB = "backend/capt_data.db"
NEW_DB = "backend/data/capt_data.db"

if not os.path.exists(OLD_DB):
    print("Old DB not found.")
    exit(1)

conn_new = sqlite3.connect(NEW_DB)
conn_new.row_factory = sqlite3.Row
c_new = conn_new.cursor()

# Attach old db
c_new.execute(f"ATTACH DATABASE '{OLD_DB}' AS old_db")

# Migrate users
c_new.execute("INSERT OR IGNORE INTO main.users SELECT * FROM old_db.users")

# Migrate listening_logs
c_new.execute("INSERT OR IGNORE INTO main.listening_logs SELECT * FROM old_db.listening_logs")

# Migrate speaking_logs (handle new columns)
# Select only the columns that existed in old DB
c_new.execute("""
    INSERT OR IGNORE INTO main.speaking_logs (id, user_id, target_word, attempt_number, audio_filename, created_at)
    SELECT id, user_id, target_word, attempt_number, audio_filename, created_at FROM old_db.speaking_logs
""")

# Migrate forum posts
c_new.execute("INSERT OR IGNORE INTO main.forum_posts SELECT * FROM old_db.forum_posts")

conn_new.commit()
conn_new.close()
print("Migration successful.")
