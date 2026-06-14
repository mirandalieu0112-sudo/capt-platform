import { X } from 'lucide-react';

const modalI18n = {
  zh: {
    btn: "我了解了，開始測驗！"
  },
  vi: {
    btn: "Tôi hiểu rồi, bắt đầu kiểm tra!"
  },
  en: {
    btn: "I got it, start the test!"
  }
};

export default function InstructionModal({ isOpen, onClose, lang = 'zh' }) {
  if (!isOpen) return null;

  const btnText = modalI18n[lang]?.btn || modalI18n['zh'].btn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700 transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">口說發音教學引導 / Hướng dẫn phát âm</h2>
          
          <div className="space-y-8">
            {/* c */}
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-1 flex items-center gap-2">
                c <span className="text-lg text-cyan-200/70 font-normal">舌尖前音 / Âm đầu lưỡi trước</span>
              </h3>
              
              <div className="space-y-4 mt-6 relative z-10">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="text-slate-200 font-medium leading-relaxed">發音時，舌頭水平前伸，輕抵或靠近上齒背，氣流從窄縫中擠出。</p>
                    <p className="text-cyan-300/80 text-sm mt-1">Cách phát âm phụ âm /c/: Đầu lưỡi đặt phẳng thẳng hướng ra ngoài, chạm nhẹ răng cửa trên.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="text-slate-200 font-medium leading-relaxed">舌尖請完全放平，切勿往後捲縮。</p>
                    <p className="text-cyan-300/80 text-sm mt-1">Đầu lưỡi duỗi phẳng tuyệt đối, KHÔNG uốn cong.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="text-slate-200 font-medium leading-relaxed">發音時雙唇微張，嘴角微微向兩側拉開。</p>
                    <p className="text-cyan-300/80 text-sm mt-1">Khóe miệng hơi kéo nhẹ sang hai bên - cười nhẹ.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div>
                    <p className="text-slate-200 font-medium leading-relaxed">發 /c/ 聲母時需用力吹氣（送氣音）。</p>
                    <p className="text-cyan-300/80 text-sm mt-1">Khi phát âm âm /c/ cần bật hơi thật mạnh.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ch */}
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
              <h3 className="text-2xl font-bold text-emerald-400 mb-1 flex items-center gap-2">
                ch <span className="text-lg text-emerald-200/70 font-normal">舌尖後音 / Âm đầu lưỡi sau</span>
              </h3>
              
              <div className="space-y-4 mt-6 relative z-10">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="text-slate-200 font-medium leading-relaxed">發音時，舌尖向上翹起，靠近或抵住硬腭前部，氣流自舌尖縫摩擦而出。</p>
                    <p className="text-emerald-300/80 text-sm mt-1">Cách phát âm phụ âm /ch/ : Đầu lưỡi cong hướng lên trên, áp sát vòm họng cứng phía trước.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="text-slate-200 font-medium leading-relaxed">舌尖請往上後方捲起，不要頂死，保留縫隙。</p>
                    <p className="text-emerald-300/80 text-sm mt-1">Đầu lưỡi uốn cong về phía vòm trên, chừa khe hở.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="text-slate-200 font-medium leading-relaxed">嘴巴稍微張圓，有空間讓聲音產生共鳴。</p>
                    <p className="text-emerald-300/80 text-sm mt-1">Khuôn miệng hơi tròn nhẹ để âm thanh cộng hưởng tròn trịa.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div>
                    <p className="text-slate-200 font-medium leading-relaxed">發 ch 聲母時需用力吹出氣流。</p>
                    <p className="text-emerald-300/80 text-sm mt-1">Khi phát âm âm /ch/ cần bật hơi đẩy khí mạnh ra.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="mt-8 w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-lg transition-colors">
            {btnText}
          </button>
        </div>
      </div>
    </div>
  );
}
