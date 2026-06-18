import React, { useState, useEffect, useRef } from 'react';
import { Play, Mic, Square, CheckCircle, XCircle, Send, Star, Volume2 } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { API_BASE_URL } from '../config';
import { levels } from '../data/levels';

const allLevelWords = Array.from(new Set(
  levels.flatMap(lvl => 
    lvl.listeningQuestions.flatMap(q => q.pair ? q.pair : [q.word])
  ).map(w => w.split(' ')[0]) // Extract just the Chinese characters
));

const DataReviewTab = ({ adminName }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState("草");
  const [activeAudio, setActiveAudio] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [selectedLogs, setSelectedLogs] = useState(new Set());
  
  // Review Form State
  const [isCorrect, setIsCorrect] = useState(true);
  const [confidence, setConfidence] = useState(100);
  const [teacherScore, setTeacherScore] = useState('');
  const [feedbackDuration, setFeedbackDuration] = useState("");
  const [feedbackVolume, setFeedbackVolume] = useState("");
  const [feedbackComfort, setFeedbackComfort] = useState("");
  const [feedbackAspiration, setFeedbackAspiration] = useState("");

  const words = allLevelWords;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/audio_logs`);
      const data = await res.json();
      if (data.status === 'success') {
        setLogs(data.logs);
        setSelectedLogs(new Set()); // Reset selections when fetching new logs
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
      teacher_score: teacherScore === '' ? null : parseInt(teacherScore),
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
        setTeacherScore('');
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

  const toggleLogSelection = (id) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedLogs(newSelected);
  };

  const toggleAllSelections = () => {
    if (selectedLogs.size === filteredLogs.length && filteredLogs.length > 0) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(filteredLogs.map(log => log.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLogs.size === 0) return;
    if (!window.confirm(`確定要刪除這 ${selectedLogs.size} 筆資料嗎？刪除後無法復原。`)) return;

    setLoading(true);
    let successCount = 0;
    for (const id of selectedLogs) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/audio/${id}`, { method: 'DELETE' });
        if (res.ok) successCount++;
      } catch (err) {
        console.error(`Failed to delete log ${id}:`, err);
      }
    }
    alert(`成功刪除 ${successCount} 筆資料`);
    setSelectedLogs(new Set());
    fetchLogs(); // refresh the list
  };

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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-slate-400 font-bold uppercase tracking-wider">學生與教師錄音檔 ({filteredLogs.length})</h3>
              {filteredLogs.length > 0 && (
                <button 
                  onClick={handleDeleteSelected}
                  disabled={selectedLogs.size === 0}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${selectedLogs.size > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500 hover:text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                >
                  刪除已選 ({selectedLogs.size})
                </button>
              )}
            </div>
            {loading ? <p className="text-slate-500">載入中...</p> : (
              filteredLogs.length === 0 ? <p className="text-slate-500">尚無錄音資料</p> :
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-700/50 mb-2">
                  <input 
                    type="checkbox" 
                    checked={selectedLogs.size === filteredLogs.length && filteredLogs.length > 0}
                    onChange={toggleAllSelections}
                    className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 bg-slate-800"
                  />
                  <span className="text-xs text-slate-400">全選</span>
                </div>
                {filteredLogs.map(log => (
                  <div key={log.id} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors border ${activeAudio === log.audio_filename ? 'bg-indigo-600/30 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300'}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedLogs.has(log.id)}
                      onChange={() => toggleLogSelection(log.id)}
                      className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 bg-slate-800 shrink-0"
                    />
                    <button 
                      onClick={() => playAudio(log.audio_filename)}
                      className="flex-1 flex flex-col text-left overflow-hidden"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-bold truncate pr-2">{log.user_id}</span>
                        <Play className="w-4 h-4 flex-shrink-0 text-cyan-400" />
                      </div>
                      <span className="text-xs text-slate-500 truncate" title={log.audio_filename}>{log.audio_filename}</span>
                      <span className="text-xs text-slate-600 mt-1">{new Date(log.created_at).toLocaleString()}</span>
                    </button>
                  </div>
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

        {/* Acoustic Features Display */}
        {activeAudio && !activeAudio.startsWith('AI_') && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">聲學參數分析 (Acoustic Features)</h3>
            {(() => {
              const log = logs.find(l => l.audio_filename === activeAudio);
              if (log) {
                return (
                  <>
                    <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1 font-bold">VOT (嗓音起始時間)</p>
                      <p className="text-lg font-mono text-emerald-400">{log.vot_estimate ? (log.vot_estimate * 1000).toFixed(1) : '--'} <span className="text-xs text-slate-500">ms</span></p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1 font-bold">COG (頻譜重心)</p>
                      <p className="text-lg font-mono text-purple-400">{log.cog ? Math.round(log.cog) : '--'} <span className="text-xs text-slate-500">Hz</span></p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1 font-bold">F3-F2 (距離)</p>
                      <p className="text-lg font-mono text-sky-400">{(log.f3 && log.f2) ? Math.round(log.f3 - log.f2) : '--'} <span className="text-xs text-slate-500">Hz</span></p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1 font-bold">DURATION (音長)</p>
                      <p className="text-lg font-mono text-yellow-400">{log.duration ? log.duration.toFixed(3) : '--'} <span className="text-xs text-slate-500">s</span></p>
                    </div>
                  </div>
                  
                  {/* F1/F2 Scatter Chart */}
                  <div className="mt-6 pt-6 border-t border-slate-700/50">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">發音落點分析 (F1/F2 Space)</h3>
                    <div className="h-64 w-full bg-slate-950/50 rounded-xl p-2 border border-slate-800">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis type="number" dataKey="f2" name="F2" domain={[500, 3000]} reversed stroke="#94a3b8" />
                          <YAxis type="number" dataKey="f1" name="F1" domain={[200, 1000]} reversed stroke="#94a3b8" />
                          <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                          <ReferenceArea x1={2000} x2={2600} y1={200} y2={400} fill="#06b6d4" fillOpacity={0.2} stroke="#06b6d4" strokeOpacity={0.5} />
                          <ReferenceArea x1={1200} x2={1800} y1={400} y2={600} fill="#a855f7" fillOpacity={0.2} stroke="#a855f7" strokeOpacity={0.5} />
                          {log.f1 && log.f2 && (
                            <Scatter name="發音落點" data={[{ f2: log.f2, f1: log.f1 }]} fill="#fbbf24" shape="star" />
                          )}
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 justify-center text-xs mt-3">
                      <span className="flex items-center gap-1 text-cyan-400"><div className="w-3 h-3 bg-cyan-500/50"></div> 標準 c 區</span>
                      <span className="flex items-center gap-1 text-purple-400"><div className="w-3 h-3 bg-purple-500/50"></div> 標準 ch 區</span>
                      <span className="flex items-center gap-1 text-amber-400"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 該筆發音</span>
                    </div>
                  </div>
                  </>
                );
              }
              return <p className="text-sm text-slate-500">無聲學資料</p>;
            })()}
          </div>
        )}

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

          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">綜合評分 (滿分 100)</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={teacherScore} 
              onChange={e => setTeacherScore(e.target.value)} 
              placeholder="請輸入 0-100 的分數" 
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 transition-all font-mono text-lg" 
            />
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
