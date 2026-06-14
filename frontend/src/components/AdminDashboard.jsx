import React, { useState } from 'react';
import { ChevronLeft, Database, Mic2 } from 'lucide-react';
import DataReviewTab from './DataReviewTab';
import AnalyticsTab from './AnalyticsTab';

const AdminDashboard = ({ onBack, adminName }) => {
  const [activeTab, setActiveTab] = useState('review'); // 'review' or 'analytics'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-white tracking-tight">專業語音審查與數據分析中心</h1>
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'review' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            <Mic2 className="w-5 h-5" /> 語音審聽與錄製區
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'analytics' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            <Database className="w-5 h-5" /> 學生紀錄追蹤與匯出
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'review' ? <DataReviewTab adminName={adminName} /> : <AnalyticsTab />}
      </div>
    </div>
  );
};

export default AdminDashboard;
