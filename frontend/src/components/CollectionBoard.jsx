import React from 'react';
import { levels } from '../data/levels';

const CollectionBoard = ({ collectedBadges, onClose, lang = 'zh' }) => {
  const t = {
    zh: { title: "📖 專屬貼紙收集冊", desc: "發音達到 80 分以上即可解鎖關卡專屬貼紙！目前收集進度：", locked: "尚未解鎖", download: "下載貼紙" },
    en: { title: "📖 Sticker Collection", desc: "Score 80+ in pronunciation to unlock level stickers! Progress:", locked: "Locked", download: "Download Sticker" },
    vi: { title: "📖 Bộ sưu tập nhãn dán", desc: "Đạt 80+ điểm phát âm để mở khóa nhãn dán! Tiến độ:", locked: "Chưa mở khóa", download: "Tải nhãn dán" }
  };
  const txt = t[lang] || t.zh;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-800 rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl border border-slate-700 relative flex flex-col h-[80vh] md:h-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-2">
            {txt.title}
          </h2>
          <p className="text-slate-400">
            {txt.desc}
            <span className="text-yellow-400 font-bold ml-2 text-xl">{collectedBadges.length} / {levels.length}</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {levels.map(level => {
              const isUnlocked = collectedBadges.includes(level.id);
              
              return (
                <div 
                  key={level.id} 
                  className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                    isUnlocked 
                      ? 'bg-slate-700/50 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                      : 'bg-slate-800 border-slate-700 opacity-60 grayscale'
                  }`}
                >
                  <div className="w-24 h-24 mb-4 relative">
                    {isUnlocked ? (
                      <img src={level.badgeImage} alt={level.speakingTitle.zh} className="w-full h-full object-contain drop-shadow-lg transform hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-full h-full bg-slate-700 rounded-full flex items-center justify-center text-slate-500">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center w-full">
                    <div className="text-xs text-slate-400 mb-1">Level {level.id}</div>
                    <div className={`text-sm font-bold truncate ${isUnlocked ? 'text-yellow-400' : 'text-slate-500'}`} title={level.speakingTitle[lang] || level.speakingTitle.zh}>
                      {isUnlocked ? (level.speakingTitle[lang] || level.speakingTitle.zh) : txt.locked}
                    </div>
                  </div>

                  {isUnlocked && (
                    <a 
                      href={level.badgeImage} 
                      download={`Sticker_Level_${level.id}.png`}
                      className="mt-3 px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      {txt.download}
                    </a>
                  )}

                  {isUnlocked && (
                    <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-slate-800">
                      GET!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CollectionBoard;
