import sqlite3
import pandas as pd
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "capt_data.db")
BASELINE_CACHE_PATH = os.path.join(os.path.dirname(__file__), "data", "teacher_baseline.json")

# Global cache
_baseline_data = {}

def update_baseline_cache():
    """Fetches teacher data from DB, calculates averages, and updates the cache."""
    global _baseline_data
    if not os.path.exists(DB_PATH):
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        query = """
            SELECT s.target_word, s.score, s.f1, s.f2, s.f3, s.cog, s.vot_estimate, s.intensity_max 
            FROM speaking_logs s 
            LEFT JOIN users u ON s.user_id = u.user_id 
            WHERE u.role = 'teacher' OR s.user_id = '阮欣妤'
        """
        df = pd.read_sql_query(query, conn)
        conn.close()

        if df.empty:
            return

        # Select the row with the maximum score for each word
        # Handle cases where score might be NaN
        df['score'] = df['score'].fillna(0)
        idx = df.groupby('target_word')['score'].idxmax()
        best_df = df.loc[idx]
        
        # Clean up dataframe for dictionary conversion
        summary = best_df.drop(columns=['score']).set_index('target_word').round(2)
        _baseline_data = summary.to_dict(orient='index')

        # Save to JSON for persistence
        with open(BASELINE_CACHE_PATH, 'w', encoding='utf-8') as f:
            json.dump(_baseline_data, f, ensure_ascii=False, indent=4)
            
    except Exception as e:
        print(f"Error updating baseline cache: {e}")

def get_baseline_for_word(target_word):
    """Retrieves the baseline metrics for a specific word."""
    global _baseline_data
    
    # If memory cache is empty, try loading from file
    if not _baseline_data and os.path.exists(BASELINE_CACHE_PATH):
        try:
            with open(BASELINE_CACHE_PATH, 'r', encoding='utf-8') as f:
                _baseline_data = json.load(f)
        except:
            pass

    # If still empty, try updating from DB
    if not _baseline_data:
        update_baseline_cache()

    baseline = _baseline_data.get(target_word)
    
    if baseline:
        # F3-F2 derived metric
        if baseline.get('f3') and baseline.get('f2'):
            baseline['f3_f2_diff'] = baseline['f3'] - baseline['f2']
        return baseline
        
    return None

# Fallback generalized baselines if a specific word is missing
def get_fallback_baseline(is_retroflex):
    if is_retroflex: # ch
        return {
            'f3_f2_diff': 1000, # Approximate F3-F2 for ch (明顯下降)
            'cog': 4000,        # 中位數 約 3000-5000
            'vot_estimate': 115, # 約 80-150
            'intensity_max': 80
        }
    else: # c
        return {
            'f3_f2_diff': 2500, # Approximate F3-F2 for c (無明顯下降)
            'cog': 7500,        # 中位數 約 6000-9000
            'vot_estimate': 100, # 約 80-120
            'intensity_max': 80
        }

if __name__ == "__main__":
    # Test script execution
    update_baseline_cache()
    print("Baseline updated.")
    print("Sample for 擦 (cā):", get_baseline_for_word("擦 (cā)"))
    print("Sample for 拆 (chāi):", get_baseline_for_word("拆 (chāi)"))
