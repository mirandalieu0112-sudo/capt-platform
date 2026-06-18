import React from 'react';
import { ChevronLeft, Database, PlayCircle, Headphones } from 'lucide-react';
import AnalyticsTab from './AnalyticsTab';

const AdminDashboard = ({ onBack, onQuickTest }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-3xl font-bold text-white tracking-tight">後台數據管理中心</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 快速通道按鈕 */}
          <div className="flex gap-2">
            <button 
              onClick={() => onQuickTest && onQuickTest('student')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-purple-500 font-bold"
              title="以預設身分(阮欣妤)直接進入學生練習區"
            >
              <PlayCircle className="w-4 h-4" />
              快速進入：學生練習
            </button>
            <button 
              onClick={() => onQuickTest && onQuickTest('teacher')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-cyan-500 font-bold"
              title="以預設身分(阮欣妤)直接進入老師審聽區"
            >
              <Headphones className="w-4 h-4" />
              快速進入：老師審聽
            </button>
          </div>

          <div className="h-8 w-px bg-slate-800 mx-2"></div>

          <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold bg-purple-600 text-white shadow-lg">
              <Database className="w-5 h-5" /> 學生紀錄追蹤與匯出
            </div>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AnalyticsTab />
      </div>
    </div>
  );
};

export default AdminDashboard;
