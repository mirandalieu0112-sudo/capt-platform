import React, { useState, useEffect, useRef } from 'react';
import { Play, Mic, Square, CheckCircle, XCircle, Send, Star, Volume2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const DataReviewTab = ({ adminName }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState("草");
  const [activeAudio, setActiveAudio] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  
  // Review Form State
  const [isCorrect, setIsCorrect] = useState(true);
  const [confidence, setConfidence] = useState(100);
  const [feedbackDuration, setFeedbackDuration] = useState("");
  const [feedbackVolume, setFeedbackVolume] = useState("");
  const [feedbackComfort, setFeedbackComfort] = useState("");
  const [feedbackAspiration, setFeedbackAspiration] = useState("");

  const words = ["草", "茶", "從", "蟲", "菜", "柴", "粗", "出", "租", "豬"];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/audio_logs`);
      const data = await res.json();
      if (data.status === 'success') {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const playAudio = (filename) => {
    const url = `${API_BASE_URL}/api/audio/${filename}`;
    setAudioUrl(url);
    setActiveAudio(filename);
    new Audio(url).play();
  };

  const playTTS = (word) => {
    const url = `${API_BASE_URL}/api/tts?text=${encodeURIComponent(word)}`;
    setActiveAudio('AI_' + word);
    new Audio(url).play();
  };

  const submitReview = async () => {
    if (!activeAudio) {
      alert("請先選擇一個音檔或 AI 發音來評分！");
      return;
    }

    const reviewData = {
      teacher_name: adminName || "Teacher",
      target_word: selectedWord,
      audio_type: activeAudio.startsWith('AI_') ? 'AI' : 'STUDENT',
      audio_filename: activeAudio,
      is_correct: isCorrect,
      confidence_score: confidence,
      feedback_duration: feedbackDuration,
      feedback_volume: feedbackVolume,
      feedback_comfort: feedbackComfort,
      feedback_aspiration: feedbackAspiration
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/teacher/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData)
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("審聽回饋已成功送出！");
        // Reset form
        setFeedbackDuration("");
        setFeedbackVolume("");
        setFeedbackComfort("");
        setFeedbackAspiration("");
        setConfidence(100);
        setIsCorrect(true);
      } else {
        alert("送出失敗");
      }
    } catch (err) {
      console.error(err);
      alert("網路錯誤");
    }
  };

  const filteredLogs = logs.filter(log => log.target_word.includes(selectedWord));

  return (
    <div className="flex gap-6 h-[80vh]">
      {/* Left Column: Audio Selection */}
      <div className="w-1/3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">1. 選擇字詞與音檔</h2>
          <select 
            value={selectedWord} 
            onChange={(e) => setSelectedWord(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all"
          >
            {words.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <h3 className="text-sm text-slate-400 mb-2 font-bold uppercase tracking-wider">AI 標準音</h3>
            <button 
              onClick={() => playTTS(selectedWord)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${activeAudio === 'AI_' + selectedWord ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" /> 聆聽 {selectedWord} 的 AI 發音
              </div>
            </button>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <h3 className="text-sm text-slate-400 mb-2 font-bold uppercase tracking-wider">學生與教師錄音檔 ({filteredLogs.length})</h3>
            {loading ? <p className="text-slate-500">載入中...</p> : (
              filteredLogs.length === 0 ? <p className="text-slate-500">尚無錄音資料</p> :
              <div className="space-y-2">
                {filteredLogs.map(log => (
                  <button 
                    key={log.id}
                    onClick={() => playAudio(log.audio_filename)}
                    className={`w-full flex flex-col text-left px-4 py-3 rounded-lg transition-colors border ${activeAudio === log.audio_filename ? 'bg-indigo-600/30 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300'}`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold truncate pr-2">{log.user_id}</span>
                      <Play className="w-4 h-4 flex-shrink-0 text-cyan-400" />
                    </div>
                    <span className="text-xs text-slate-500 truncate" title={log.audio_filename}>{log.audio_filename}</span>
                    <span className="text-xs text-slate-600 mt-1">{new Date(log.created_at).toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Review Form */}
      <div className="w-2/3 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-2">2. 語音審聽與質性回饋</h2>
        <p className="text-slate-400 mb-6 pb-6 border-b border-slate-800">
          目前正在評估: <strong className="text-cyan-400 font-mono bg-slate-950 px-2 py-1 rounded">{activeAudio || "尚未選擇"}</strong>
        </p>

        <div className="space-y-6">
          <div className="flex gap-6">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-400 mb-2">發音是否正確？</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsCorrect(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                >
                  <CheckCircle className="w-5 h-5" /> 正確
                </button>
                <button 
                  onClick={() => setIsCorrect(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${!isCorrect ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                >
                  <XCircle className="w-5 h-5" /> 錯誤
                </button>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-400 mb-2">信心百分比: <span className="text-cyan-400">{confidence}%</span></label>
              <input 
                type="range" min="0" max="100" step="10" 
                value={confidence} 
                onChange={(e) => setConfidence(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 mt-4"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">音長回饋</label>
              <input type="text" value={feedbackDuration} onChange={e => setFeedbackDuration(e.target.value)} placeholder="例如：元音不夠長" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">音量回饋</label>
              <input type="text" value={feedbackVolume} onChange={e => setFeedbackVolume(e.target.value)} placeholder="例如：聲音太小" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">舒服度回饋</label>
              <input type="text" value={feedbackComfort} onChange={e => setFeedbackComfort(e.target.value)} placeholder="例如：聽起來很自然" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">送氣回饋</label>
              <input type="text" value={feedbackAspiration} onChange={e => setFeedbackAspiration(e.target.value)} placeholder="例如：/c/ 送氣不足" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 transition-all" />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800">
            <button 
              onClick={submitReview}
              disabled={!activeAudio}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-4 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" /> 送出審聽回饋 (Save Review)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataReviewTab;
