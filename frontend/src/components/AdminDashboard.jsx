import React, { useState } from 'react';
import { Download, Users, Mic, Activity, ChevronLeft, Search, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const AdminDashboard = ({ onBack }) => {
  const [isExporting, setIsExporting] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-white">教師管理專區 (Teacher Dashboard)</h1>
          </div>
          
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all disabled:opacity-50"
          >
            {isExporting ? <Activity className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isExporting ? "打包下載中..." : "一鍵匯出 Excel 統計總表"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-300">資料收集區塊 1</h2>
              <Users className="text-cyan-500 w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-white">學生名單與身分紀錄</p>
            <p className="text-sm text-slate-500 mt-2">包含國籍、母語、程度等統計</p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-300">資料收集區塊 2</h2>
              <Mic className="text-emerald-500 w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-white">聽力測驗日誌</p>
            <p className="text-sm text-slate-500 mt-2">點擊歷程與作答正確率</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-300">資料收集區塊 3</h2>
              <Activity className="text-purple-500 w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-white">Parselmouth 聲學特徵</p>
            <p className="text-sm text-slate-500 mt-2">F0, F1~F3, COG, VOT_est</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6">錄音檔後台位置 (Audio Files Location)</h2>
          <p className="text-slate-400 mb-4">
            所有學生上傳的原始音檔 (.wav) 將永久保存在後端伺服器的 <code>data/audio/</code> 資料夾中。
            這些音檔已完全相容於 Praat 軟體，你可以隨時取用進行深度人工標記與研究。
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-sm text-emerald-400">
            自動命名規則：<br/>
            [名字]_[國籍]_[母語]_[出生地]_[作答次數]_[字詞]_[程度]_[性別].wav<br/>
            範例：S1_越南_越南語_河內_1_3_草_初級_女.wav
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
