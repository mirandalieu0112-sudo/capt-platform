import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

const RewardModal = ({ level, onClose, lang = 'zh' }) => {
  const t = {
    zh: { title: "恭喜通關！", desc: "發音分數達到 80 分以上", sticker: "獲得專屬貼紙：", btn: "太棒了！收下貼紙" },
    en: { title: "Level Cleared!", desc: "Pronunciation score reached 80+", sticker: "Obtained exclusive sticker:", btn: "Awesome! Claim sticker" },
    vi: { title: "Chúc mừng!", desc: "Điểm phát âm đạt 80+", sticker: "Nhận nhãn dán độc quyền:", btn: "Tuyệt vời! Nhận ngay" }
  };
  const txt = t[lang] || t.zh;
  useEffect(() => {
    // Fire confetti when modal opens
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-yellow-400 relative flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300">
        
        {/* Sparkle effects behind the badge */}
        <div className="absolute inset-0 bg-yellow-400/20 rounded-3xl animate-pulse pointer-events-none"></div>

        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-2">
          {txt.title}
        </h2>
        <p className="text-emerald-400 font-medium mb-6">{txt.desc}</p>

        <div className="relative w-48 h-48 mb-6 drop-shadow-[0_0_25px_rgba(250,204,21,0.5)]">
          <img 
            src={level.badgeImage} 
            alt={level.speakingTitle.zh} 
            className="w-full h-full object-contain animate-bounce"
            style={{ animationDuration: '2s' }}
          />
        </div>

        <p className="text-white text-lg mb-1">{txt.sticker}</p>
        <p className="text-2xl font-bold text-yellow-400 mb-8">
          【{level.speakingTitle[lang] || level.speakingTitle.zh}】
        </p>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-4 rounded-xl text-xl hover:from-yellow-400 hover:to-orange-400 transition-all shadow-lg active:scale-95"
        >
          {txt.btn}
        </button>
      </div>
    </div>
  );
};

export default RewardModal;
