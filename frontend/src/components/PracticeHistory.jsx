import React, { useEffect, useState } from 'react';
import { X, Ear, Mic, Clock, CheckCircle2, XCircle, ChevronRight, Activity, CalendarClock, Star } from 'lucide-react';
import { calculateScore, getStars, getSandwichFeedback } from '../utils/scoring';
import { API_BASE_URL } from '../config';

const i18n = {
  zh: {
    title: "今日練習紀錄",
    listening: "聽力測試紀錄",
    speaking: "口說練習紀錄",
    no_data: "今日尚未有練習紀錄，快去闖關吧！",
    target_word: "目標詞",
    selected_word: "你的選擇",
    time_ms: "反應時間",
    duration: "錄音長度",
    f1_f2: "F1 / F2",
    cog: "重心 (COG)",
    intensity: "最大音量",
    pass: "正確",
    fail: "錯誤",
    attempt: "嘗試次數",
    score: "發音分數",
    feedback: "AI 回饋與建議",
  },
  vi: {
    title: "Lịch sử luyện tập hôm nay",
    listening: "Lịch sử kiểm tra nghe",
    speaking: "Lịch sử luyện nói",
    no_data: "Hôm nay chưa có lịch sử luyện tập, hãy bắt đầu thử thách ngay!",
    target_word: "Từ mục tiêu",
    selected_word: "Lựa chọn của bạn",
    time_ms: "Thời gian phản hồi",
    duration: "Độ dài",
    f1_f2: "F1 / F2",
    cog: "Trọng tâm (COG)",
    intensity: "Âm lượng",
    pass: "Đúng",
    fail: "Sai",
    attempt: "Lần thử",
    score: "Điểm phát âm",
    feedback: "Phản hồi AI",
  },
  en: {
    title: "Today's Practice History",
    listening: "Listening Test History",
    speaking: "Speaking Practice History",
    no_data: "No practice history for today yet. Start a challenge!",
    target_word: "Target Word",
    selected_word: "Your Choice",
    time_ms: "Reaction Time",
    duration: "Duration",
    f1_f2: "F1 / F2",
    cog: "Center of Gravity",
    intensity: "Max Intensity",
    pass: "Correct",
    fail: "Incorrect",
    attempt: "Attempt",
    score: "Score",
    feedback: "AI Feedback",
  }
};

const PracticeHistory = ({ userId, lang, onClose }) => {
  const [history, setHistory] = useState({ listening: [], speaking: [] });
  const [loading, setLoading] = useState(true);
  const t = i18n[lang] || i18n['zh'];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/${userId}/history?lang=${lang}`);
        const data = await res.json();
        if (data.status === 'success') {
          setHistory({
            listening: data.listening || [],
            speaking: data.speaking || []
          });
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      fetchHistory();
    }
  }, [userId, lang]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Modal Box */}
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-3">
            <CalendarClock className="w-7 h-7" />
            {t.title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-500 border-t-transparent"></div>
            </div>
          ) : history.listening.length === 0 && history.speaking.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <Activity className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">{t.no_data}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Listening History */}
              <div>
                <h3 className="text-xl font-semibold text-emerald-400 flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                  <Ear className="w-5 h-5" />
                  {t.listening}
                </h3>
                {history.listening.length === 0 ? (
                  <p className="text-slate-500 text-sm">--</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {history.listening.map((log) => (
                      <div key={log.id} className={`flex items-center justify-between p-4 rounded-xl border ${log.is_correct ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-rose-900/10 border-rose-500/20'}`}>
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-slate-200">{log.target_word}</span>
                          <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {log.reaction_time_ms} ms
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-slate-500">{t.selected_word}</span>
                            <span className="text-sm font-medium text-slate-300">{log.selected_word}</span>
                          </div>
                          {log.is_correct ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                          ) : (
                            <XCircle className="w-6 h-6 text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Speaking History */}
              <div>
                <h3 className="text-xl font-semibold text-purple-400 flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                  <Mic className="w-5 h-5" />
                  {t.speaking}
                </h3>
                {history.speaking.length === 0 ? (
                  <p className="text-slate-500 text-sm">--</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {history.speaking.map((log) => {
                      const score = log.score !== null ? log.score : 0;
                      const stars = getStars(score);
                      const feedbackText = log.feedback_text || t.no_data;

                      return (
                        <div key={log.id} className="bg-slate-800/40 border border-slate-700 p-5 rounded-xl flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-bold text-cyan-300">{log.target_word}</span>
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${i < stars ? 'fill-current' : 'text-slate-600'}`} />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs font-mono px-2 py-1 bg-slate-800 rounded border border-slate-600 text-slate-400">
                              {t.attempt}: {log.attempt_number}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 text-center bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 min-w-[80px]">
                              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">{t.score}</p>
                              <p className={`text-2xl font-bold ${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-rose-400'}`}>
                                {score}
                              </p>
                            </div>
                            
                            <div className="flex-1 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 text-sm text-slate-300 leading-relaxed">
                              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">{t.feedback}</p>
                              <div className="flex flex-col gap-1">
                                <span className="text-slate-200">{feedbackText}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeHistory;
