import React, { useState, useEffect } from 'react';
import { Download, Activity, Search, Trash2, Mic, Play, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

const AnalyticsTab = () => {
  const [logs, setLogs] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/export`);
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "CAPT_Research_Data.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      alert("下載失敗 (Download failed)");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("確定要永久刪除這筆錄音紀錄與檔案嗎？")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/audio/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'success') {
        setLogs(logs.filter(l => l.id !== id));
      } else {
        alert("刪除失敗: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("網路錯誤");
    }
  };

  const playAudio = (filename) => {
    const url = `${API_BASE_URL}/api/audio/${filename}`;
    new Audio(url).play();
  };

  const filteredLogs = logs.filter(log => 
    log.user_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.target_word.includes(searchTerm) ||
    log.audio_filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="搜尋學生代號、字詞或檔名..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all shadow-inner"
          />
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={fetchLogs}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-xl font-bold transition-all border border-slate-700"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </button>
          
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all disabled:opacity-50"
          >
            {isExporting ? <Activity className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isExporting ? "打包下載中..." : "一鍵匯出研究數據 Excel"}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[1500px]">
            <div className="grid grid-cols-12 gap-2 p-4 border-b border-slate-800 bg-slate-950 font-bold text-slate-400 text-xs">
              <div className="col-span-1">錄製時間</div>
              <div className="col-span-1">學生ID</div>
              <div className="col-span-1">國籍 / 出生地</div>
              <div className="col-span-1">程度 / 性別</div>
              <div className="col-span-1">練習項目</div>
              <div className="col-span-1">字詞 / 答對錯</div>
              <div className="col-span-2">錄製檔案 (.wav)</div>
              <div className="col-span-3">物理數據 (F0, F1~F3, VOT...)</div>
              <div className="col-span-1 text-right">操作</div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-64 text-slate-500">載入中...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex justify-center items-center h-64 text-slate-500">沒有找到符合的紀錄</div>
              ) : (
                filteredLogs.map((log, i) => (
                  <div key={log.id} className={`grid grid-cols-12 gap-2 p-4 items-center border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors text-xs ${i % 2 === 0 ? 'bg-slate-900/30' : ''}`}>
                    <div className="col-span-1 text-slate-400">{new Date(log.created_at).toLocaleString()}</div>
                    <div className="col-span-1 font-mono text-cyan-400 font-bold">{log.user_id}</div>
                    <div className="col-span-1 text-slate-300">
                      <div>{log.nationality}</div>
                      <div className="text-slate-500">{log.birthplace}</div>
                    </div>
                    <div className="col-span-1 text-slate-300">
                      <div>{log.chinese_level}</div>
                      <div className="text-slate-500">{log.gender}</div>
                    </div>
                    <div className="col-span-1 font-bold">
                      <span className={`px-2 py-1 rounded-full ${log.type === '聽力' ? 'bg-purple-900/50 text-purple-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                        {log.type}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <div className="font-bold text-slate-200 text-sm">{log.target_word}</div>
                      {log.type === '聽力' && (
                        <div className={`mt-1 font-bold ${log.result === '答對' ? 'text-emerald-400' : 'text-rose-400'}`}>{log.result}</div>
                      )}
                      {log.type === '口說' && (
                        <div className="text-slate-500 mt-1">第 {log.attempt_number} 次</div>
                      )}
                    </div>
                    <div className="col-span-2 font-mono text-slate-500 truncate" title={log.audio_filename}>
                      {log.audio_filename || '-'}
                    </div>
                    <div className="col-span-3 text-slate-400 font-mono text-[10px] leading-tight break-all">
                      {log.type === '口說' ? (
                        <>
                          F0: {log.f0 ? parseFloat(log.f0).toFixed(1) : 'N/A'}, F1: {log.f1 ? parseFloat(log.f1).toFixed(1) : 'N/A'}<br/>
                          F2: {log.f2 ? parseFloat(log.f2).toFixed(1) : 'N/A'}, F3: {log.f3 ? parseFloat(log.f3).toFixed(1) : 'N/A'}<br/>
                          F3-F2: {(log.f3 && log.f2) ? (parseFloat(log.f3) - parseFloat(log.f2)).toFixed(1) : 'N/A'}<br/>
                          COG: {log.cog ? parseFloat(log.cog).toFixed(1) : 'N/A'}, VOT: {log.vot_estimate ? parseFloat(log.vot_estimate).toFixed(3) : 'N/A'}
                        </>
                      ) : '-'}
                    </div>
                    <div className="col-span-1 flex justify-end gap-1">
                      {log.type === '口說' && log.audio_filename && (
                        <>
                          <button onClick={() => playAudio(log.audio_filename)} className="p-1.5 bg-slate-800 hover:bg-cyan-600 text-cyan-400 hover:text-white rounded-lg transition-colors border border-slate-700" title="播放音檔"><Play className="w-4 h-4" /></button>
                          <a href={`${API_BASE_URL}/api/audio/${log.audio_filename}`} download={log.audio_filename} className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-colors border border-slate-700 flex items-center justify-center" title="下載單筆音檔"><Download className="w-4 h-4" /></a>
                        </>
                      )}
                      <button onClick={() => handleDelete(log.id)} className="p-1.5 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-colors border border-slate-700" title="刪除"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
