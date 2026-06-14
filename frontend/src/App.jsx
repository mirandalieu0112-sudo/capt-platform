import { useState, useRef, useEffect, useMemo } from 'react';
import RecordRTC from 'recordrtc';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Mic, Square, Loader2, Play, Lock, Star, ChevronLeft, ChevronRight, Volume2, Unlock, Sparkles, Target, Activity, Award, Info, CheckCircle2, Eye, EyeOff, PlayCircle, DownloadCloud, UploadCloud } from 'lucide-react';
import FormP3 from './components/FormP3';
import InstructionModal from './components/InstructionModal';
import PlatformManualModal from './components/PlatformManualModal';
import AdminDashboard from './components/AdminDashboard';
import Forum from './components/Forum';
import PracticeHistory from './components/PracticeHistory';
import { levels } from './data/levels';
import { calculateScore, getStars, getSandwichFeedback } from './utils/scoring';
import { audioBufferToWav } from './utils/audioBufferToWav';
import { API_BASE_URL } from './config';

const i18n = {
  zh: {
    welcome: "歡迎來到 AI 中文發音練習平台",
    select_role: "請選擇您的身分",
    student: "我是學生",
    teacher: "我是老師",
    title: "中文發音練習：舌尖前音與舌尖後音 (c/ch)",
    basic_info: "基本資料填寫",
    map_title: "語音特訓艙闖關地圖",
    map_subtitle: "完成 60 分即可解鎖下一關",
    learner: "Learner",
    back_to_map: "返回地圖",
    back_to_prev: "返回前頁",
    listening_test: "聽力測試",
    speaking_test: "口說練習",
    listen_desc: "聽力變音測試 (點擊發音)",
    tts_note: "此為 TTS 模擬發音，未來可整合專業錄音檔。",
    btn_start_speak: "開始口說跟讀",
    btn_stop_record: "停止錄音",
    record_status_ready: "準備就緒",
    record_status_recording: "錄音中...",
    record_status_processing: "分析中...",
    record_status_complete: "分析完成！",
    record_status_error: "網路連線錯誤",
    score_label: "分數:",
    pass_text: "過關解鎖！",
    fail_text: "未達 60 分",
    record_hint_1: "錄製您的發音以取得",
    record_hint_2: "AI 星級評等與夾心餅乾診斷",
    analysis_chart: "發音落點分析",
    zone_c: "標準 c 區",
    zone_ch: "標準 ch 區",
    zone_you: "你的發音",
    select_word_to_speak: "請選擇要跟讀的詞彙",
    btn_replay: "聆聽錄製",
    btn_download: "下載錄音",
    btn_upload: "上傳音檔",
    btn_history: "今日練習紀錄",
    manual_btn: "📖 平台說明書",
    manual_title: "平台使用說明書",
    manual_audience_title: "平台對象與理念",
    manual_audience_content: "針對想要改善中文發音的非母語學習者（特別是越南語母語者）。透過遊戲化的闖關地圖，結合 AI 即時檢測與夾心餅乾式回饋，讓您在無壓力情境下精準校正發音位置。",
    manual_listen_title: "1. 如何練習聽力",
    manual_listen_content: "進入關卡後，點擊「喇叭圖示」聆聽標準發音，選擇您認為正確的拼音或字詞。必須完成聽力測驗，才能解鎖口說練習！",
    manual_speak_title: "2. 如何練習口說",
    manual_speak_content: "聽力過關解鎖後，長按畫面下方的「麥克風按鈕」開始錄音，對著麥克風清楚唸出目標詞彙，鬆開按鈕即會自動送出並開始分析。",
    manual_score_title: "3. 發音分數與學習紀錄",
    manual_score_content: "每次錄音系統會給予 0~100 分及 1~3 顆星，並搭配「夾心餅乾回饋」給予具體發音建議。您可以點擊「今日練習紀錄」隨時查看學習成效。",
    close: "關閉"
  },
  vi: {
    welcome: "Chào mừng đến với Nền tảng Luyện phát âm tiếng Trung AI",
    select_role: "Vui lòng chọn vai trò của bạn",
    student: "Tôi là học sinh",
    teacher: "Tôi là giáo viên",
    title: "Luyện phát âm: Âm đầu lưỡi trước và sau (c/ch)",
    basic_info: "Điền thông tin cơ bản",
    map_title: "Bản đồ thử thách VR",
    map_subtitle: "Đạt 60 điểm để mở khóa cửa tiếp theo",
    learner: "Học viên",
    back_to_map: "Quay lại bản đồ",
    back_to_prev: "Quay lại trang trước",
    listening_test: "Kiểm tra nghe",
    speaking_test: "Luyện nói",
    listen_desc: "Kiểm tra phân biệt âm (Bấm để nghe)",
    tts_note: "Sử dụng TTS mô phỏng, sẽ tích hợp giọng đọc chuẩn sau.",
    btn_start_speak: "Bắt đầu luyện nói",
    btn_stop_record: "Dừng ghi âm",
    record_status_ready: "Sẵn sàng",
    record_status_recording: "Đang ghi âm...",
    record_status_processing: "Đang phân tích...",
    record_status_complete: "Phân tích hoàn tất!",
    record_status_error: "Lỗi kết nối",
    score_label: "Điểm:",
    pass_text: "Đã mở khóa!",
    fail_text: "Chưa đạt 60 điểm",
    record_hint_1: "Ghi âm giọng nói của bạn để nhận",
    record_hint_2: "Đánh giá sao AI và chẩn đoán kẹp chả",
    analysis_chart: "Phân tích vị trí phát âm",
    zone_c: "Vùng chuẩn c",
    zone_ch: "Vùng chuẩn ch",
    zone_you: "Phát âm của bạn",
    select_word_to_speak: "Chọn từ để luyện đọc theo",
    btn_replay: "Nghe lại bản thu",
    btn_download: "Tải xuống",
    btn_upload: "Tải lên tệp âm thanh",
    btn_history: "Lịch sử luyện tập",
    manual_btn: "📖 Hướng dẫn sử dụng",
    manual_title: "Hướng dẫn sử dụng nền tảng",
    manual_audience_title: "Đối tượng & Mục tiêu",
    manual_audience_content: "Dành cho người học tiếng Trung không phải tiếng mẹ đẻ (đặc biệt là người Việt) muốn cải thiện phát âm. Thông qua bản đồ trò chơi, kết hợp đánh giá AI và phản hồi kẹp chả, giúp bạn chỉnh sửa vị trí phát âm một cách tự nhiên.",
    manual_listen_title: "1. Cách luyện nghe",
    manual_listen_content: "Khi vào màn chơi, bấm vào 'biểu tượng loa' để nghe phát âm chuẩn, chọn từ hoặc pinyin bạn cho là đúng. Bạn phải hoàn thành phần nghe để mở khóa phần luyện nói!",
    manual_speak_title: "2. Cách luyện nói",
    manual_speak_content: "Sau khi mở khóa, nhấn giữ 'biểu tượng Micro' ở dưới cùng để ghi âm, đọc rõ từ khóa và thả tay để hệ thống tự động phân tích.",
    manual_score_title: "3. Điểm số & Lịch sử học",
    manual_score_content: "Mỗi lần ghi âm sẽ nhận điểm từ 0~100, 1~3 sao và 'phản hồi kẹp chả' chỉ dẫn cụ thể. Bạn có thể bấm 'Lịch sử luyện tập' để theo dõi tiến độ.",
    close: "Đóng"
  },
  en: {
    welcome: "Welcome to AI Chinese Pronunciation Platform",
    select_role: "Please select your role",
    student: "I am a Student",
    teacher: "I am a Teacher",
    title: "Pronunciation Practice: Apical Consonants (c/ch)",
    basic_info: "Basic Information",
    map_title: "VR Challenge Map",
    map_subtitle: "Score 60 points to unlock the next level",
    learner: "Learner",
    back_to_map: "Back to Map",
    back_to_prev: "Go Back",
    listening_test: "Listening Test",
    speaking_test: "Speaking Practice",
    listen_desc: "Listening differentiation test (Click to play)",
    tts_note: "This uses TTS simulation. Professional audio will be integrated later.",
    btn_start_speak: "Start Speaking",
    btn_stop_record: "Stop Recording",
    record_status_ready: "Ready",
    record_status_recording: "Recording...",
    record_status_processing: "Processing...",
    record_status_complete: "Analysis Complete!",
    record_status_error: "Network Error",
    score_label: "Score:",
    pass_text: "Unlocked!",
    fail_text: "Under 60 points",
    record_hint_1: "Record your voice to get",
    record_hint_2: "AI Star Rating and Sandwich Diagnostics",
    analysis_chart: "Pronunciation Position Analysis",
    zone_c: "Target c zone",
    zone_ch: "Target ch zone",
    zone_you: "Your pronunciation",
    select_word_to_speak: "Select a word to shadow",
    btn_replay: "Play Recording",
    btn_download: "Download",
    btn_upload: "Upload Audio",
    btn_history: "Practice History",
    manual_btn: "📖 Platform Guide",
    manual_title: "Platform Instruction Manual",
    manual_audience_title: "Target Audience & Philosophy",
    manual_audience_content: "Designed for non-native learners (especially Vietnamese) to improve Chinese pronunciation. Through a gamified map, AI assessment, and sandwich feedback, it helps correct your pronunciation naturally.",
    manual_listen_title: "1. Listening Practice",
    manual_listen_content: "In a level, click the 'speaker icon' to listen to standard pronunciation, and select the correct pinyin/word. You must pass the listening test to unlock speaking!",
    manual_speak_title: "2. Speaking Practice",
    manual_speak_content: "Once unlocked, press and hold the 'Microphone' button to record. Read the target word clearly, and release the button to analyze.",
    manual_score_title: "3. Scores & Records",
    manual_score_content: "Each recording receives a 0-100 score, 1-3 stars, and 'sandwich feedback' for specific guidance. Check your 'Practice History' anytime to track progress.",
    close: "Close"
  }
};

function App() {
  const [lang, setLang] = useState('zh');
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [userData, setUserData] = useState(null);
  
  // Game State
  const [unlockedLevels, setUnlockedLevels] = useState([1]); // Array of unlocked level IDs
  const [currentLevel, setCurrentLevel] = useState(null);
  const [showInstruction, setShowInstruction] = useState(false);
  const [showPlatformManual, setShowPlatformManual] = useState(false);
  const [mode, setMode] = useState('listening'); // default to listening
  const [activeWord, setActiveWord] = useState('');
  const [seenInstructionLevels, setSeenInstructionLevels] = useState([]);
  const [completedListeningLevels, setCompletedListeningLevels] = useState([]);

  // Listening Quiz State
  const [listenIdx, setListenIdx] = useState(0);
  const [listenStatus, setListenStatus] = useState('idle'); // 'idle', 'answered'
  const [listenResult, setListenResult] = useState(null); // true/false
  const [listenScore, setListenScore] = useState(0);

  // Randomize options so the correct answer isn't always on the left
  const shuffledOptions = useMemo(() => {
    if (!currentLevel || mode !== 'listening' || !currentLevel.listeningQuestions || !currentLevel.listeningQuestions[listenIdx]) return [];
    const q = currentLevel.listeningQuestions[listenIdx];
    if (!q.pair) return [];
    // Randomly sort the pair
    return [...q.pair].sort(() => Math.random() - 0.5);
  }, [currentLevel, listenIdx, mode]);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState('map'); // 'map' or 'forum'
  const [status, setStatus] = useState('record_status_ready');
  const [result, setResult] = useState(null);
  const [recordCounts, setRecordCounts] = useState({}); // { '草': 1, '茶': 3 }
  const [audioUrl, setAudioUrl] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const utteranceRef = useRef(null); // Ref to prevent Chrome TTS garbage collection

  const t = i18n[lang] || i18n['zh'];

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleFormSubmit = (data) => {
    setUserData(data);
    setStep(3); // Go to Level Map
  };

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminError, setAdminError] = useState('');

  const handleLevelSelect = (levelId) => {
    if (!unlockedLevels.includes(levelId)) return;
    const lvl = levels.find(l => l.id === levelId);
    setCurrentLevel(lvl);
    
    // Set default word for speaking practice
    if (lvl && lvl.listeningQuestions.length > 0) {
      const q = lvl.listeningQuestions[0];
      setActiveWord(q.pair ? q.pair[0] : q.word);
    }
    
    setResult(null);
    setListenIdx(0);
    setListenStatus('idle');
    setListenScore(0);
    setMode('listening'); // FORCE LISTENING FIRST
    setShowInstruction(false); // DO NOT SHOW INSTRUCTION YET
    setStep(4);
  };

  const switchToSpeaking = () => {
    setMode('speaking');
    if (currentLevel && !seenInstructionLevels.includes(currentLevel.id)) {
      setShowInstruction(true);
      setSeenInstructionLevels(prev => [...prev, currentLevel.id]);
    }
  };

  // Trigger voice loading in the background on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const playTTS = (text) => {
    const cleanText = text.replace(/\s*\(.*?\)/g, '').trim(); 
    
    // 🔥 終極殺手鐧：透過我們自己的 Python 後台當作跳板 (Proxy)
    // 這樣 Google Chrome 就不會發現是網頁在偷抓音檔，完全避開 403 Forbidden 的安全封鎖！
    const url = `${API_BASE_URL}/api/tts?text=${encodeURIComponent(cleanText)}`;
    const audio = new Audio(url);
    
    audio.play().catch(err => {
      console.warn("後台 Proxy 語音播放失敗，使用本地備用語音", err);
      // Fallback: 如果後台沒開，退回使用系統內建語音
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'zh-TW';
        utterance.rate = 0.8;
        
        const voices = window.speechSynthesis.getVoices();
        const googleTwVoice = voices.find(v => (v.lang === 'zh-TW' || v.lang === 'zh_TW' || v.lang === 'cmn-TW') && v.name.includes('Google'));
        const sysTwVoice = voices.find(v => v.lang === 'zh-TW' || v.lang === 'zh_TW' || v.lang === 'cmn-TW');
        const fallbackZhVoice = voices.find(v => v.lang.includes('zh'));
        
        const selectedVoice = googleTwVoice || sysTwVoice || fallbackZhVoice;
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        
        utteranceRef.current = utterance; 
        window.speechSynthesis.speak(utterance);
      }
    });
  };

  // Removed the unused onvoiceschanged useEffect as we are primarily using HTTP Audio now

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        desiredSampRate: 16000
      });
      recorderRef.current.startRecording();
      setIsRecording(true);
      setStatus('record_status_recording');
      setResult(null);
    } catch (err) {
      console.error(err);
      setStatus('record_status_error');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        setIsRecording(false);
        setStatus('record_status_processing');
        const blob = recorderRef.current.getBlob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        streamRef.current.getTracks().forEach(track => track.stop());
        uploadAudio(blob);
      });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setStatus('record_status_processing');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const wavBlob = audioBufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
      uploadAudio(wavBlob);
    } catch (err) {
      console.error("Audio decoding error:", err);
      setStatus('record_status_error');
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadAudio = async (audioBlob) => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      formData.append("user_id", userData?.userId || 'unknown');
      formData.append("level_id", currentLevel.id);
      formData.append("target_word", activeWord);
      
      const currentCount = recordCounts[activeWord] || 0;
      formData.append("attempt_number", `${currentCount + 1}_3`);

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.status === 'success') {
        const cog = data.acoustic_features.COG;
        const targetType = cog > 4500 ? 'c' : 'ch'; 
        const score = calculateScore(cog, targetType);
        const stars = getStars(score);
        const feedback = getSandwichFeedback(score, targetType, lang);
        
        data.score = score;
        data.stars = stars;
        data.feedback = feedback;

        if (score >= 60 && currentLevel) {
          if (!unlockedLevels.includes(currentLevel.id + 1) && currentLevel.id < 5) {
              setUnlockedLevels(prev => [...prev, currentLevel.id + 1]);
          }
        }

        setResult(data);
        setStatus('record_status_complete');
        setRecordCounts(prev => ({
          ...prev,
          [activeWord]: (prev[activeWord] || 0) + 1
        }));
      } else {
        setStatus('record_status_error');
        console.error("Backend Error:", data.message);
      }
  };

  const renderLevelMap = () => (
    <div className="w-full max-w-4xl animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <button 
            onClick={() => setStep(2)} 
            className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors mb-4 text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> {t.back_to_prev}
          </button>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">{t.map_title}</h2>
          <p className="text-slate-400 mt-2">{t.map_subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">{t.learner}</p>
          <p className="text-xl text-cyan-400 font-mono">{userData?.userId || userData?.name}</p>
        </div>
      </div>

      <div className="grid gap-4">
        {levels.map(lvl => {
          const isUnlocked = unlockedLevels.includes(lvl.id);
          return (
            <div 
              key={lvl.id}
              onClick={() => handleLevelSelect(lvl.id)}
              className={`p-6 rounded-2xl border transition-all ${
                isUnlocked 
                  ? 'bg-slate-800/80 border-cyan-500/50 hover:border-cyan-400 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:-translate-y-1' 
                  : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-6 items-center flex-1">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <img src={lvl.listeningImage} alt="listening theme" className="w-12 h-12 rounded-full object-cover border-2 border-slate-800 absolute top-0 left-0 shadow-lg" />
                    <img src={lvl.speakingImage} alt="speaking theme" className="w-12 h-12 rounded-full object-cover border-2 border-slate-800 absolute bottom-0 right-0 shadow-lg" />
                    {!isUnlocked && <div className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center backdrop-blur-sm"><Lock className="w-6 h-6 text-slate-400" /></div>}
                  </div>
                  <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-200 mb-2 group-hover:text-cyan-400 transition-colors">
                    {lvl.speakingTitle[lang] || lvl.speakingTitle['zh']}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    {lvl.listeningTitle[lang] || lvl.listeningTitle['zh']}
                  </p>
                  <p className="text-slate-500 text-sm">{lvl.description[lang] || lvl.description['zh']}</p>
                </div>
                </div>
                <div>
                  {isUnlocked ? <Play className="w-8 h-8 text-cyan-400" /> : <Lock className="w-8 h-8 text-slate-600" />}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );

  const renderPracticeArea = () => {
    if (!currentLevel) return null;
    return (
      <div className="w-full max-w-5xl animate-in slide-in-from-bottom-8 duration-500">
        <button onClick={() => setStep(3)} className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-6">
          <ChevronLeft className="w-5 h-5" /> {t.back_to_map}
        </button>
        
        <div className="flex items-center justify-between bg-slate-800/50 p-6 rounded-3xl border border-slate-700 mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full opacity-10 pointer-events-none">
             <img src={mode === 'listening' ? currentLevel.listeningImage : currentLevel.speakingImage} alt="bg" className="w-full h-full object-cover blur-sm" />
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <img 
              src={mode === 'listening' ? currentLevel.listeningImage : currentLevel.speakingImage} 
              alt="theme" 
              className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            />
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                {mode === 'listening' 
                  ? (currentLevel.listeningTitle[lang] || currentLevel.listeningTitle['zh']) 
                  : (currentLevel.speakingTitle[lang] || currentLevel.speakingTitle['zh'])}
                {mode === 'speaking' && (
                  <button onClick={() => setShowInstruction(true)} className="p-1.5 text-cyan-500/70 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full transition-colors">
                    <Info className="w-5 h-5" />
                  </button>
                )}
              </h2>
              <p className="text-slate-400 mt-1">{currentLevel.description[lang] || currentLevel.description['zh']}</p>
            </div>
          </div>
          <div className="flex gap-2 p-1 bg-slate-900 rounded-xl relative z-10">
            <button 
              onClick={() => { setMode('listening'); }} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'listening' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t.listening_test}
            </button>
            <button 
              onClick={() => {
                if (completedListeningLevels.includes(currentLevel.id)) {
                  switchToSpeaking();
                }
              }} 
              disabled={!completedListeningLevels.includes(currentLevel.id)}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'speaking' ? 'bg-cyan-600 text-white' : !completedListeningLevels.includes(currentLevel.id) ? 'text-slate-600 cursor-not-allowed opacity-50' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {!completedListeningLevels.includes(currentLevel.id) && <Lock className="w-4 h-4" />}
              {t.speaking_test}
            </button>
          </div>
        </div>

        {mode === 'listening' ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center max-w-3xl mx-auto shadow-2xl">
            <h3 className="text-2xl mb-8 font-bold text-slate-200">{t.listen_desc}</h3>
            
            {currentLevel.listeningQuestions.length > 0 && currentLevel.listeningQuestions[0].pair ? (
              // Quiz Mode (for levels with pairs)
              listenIdx < currentLevel.listeningQuestions.length ? (
                <div className="flex flex-col items-center">
                  <div className="text-slate-400 mb-6 font-mono text-lg">Question {listenIdx + 1} / {currentLevel.listeningQuestions.length}</div>
                  
                  <button 
                    onClick={() => playTTS(currentLevel.listeningQuestions[listenIdx].correct)} 
                    className="p-8 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 rounded-full text-cyan-400 transition-all transform hover:scale-110 mb-10 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                  >
                    <Volume2 className="w-12 h-12" />
                  </button>

                  <div className="flex gap-6 w-full justify-center">
                    {shuffledOptions.map((option, idx) => (
                      <button
                        key={idx}
                        disabled={listenStatus === 'answered'}
                        onClick={() => {
                          const targetWordObj = currentLevel.listeningQuestions[listenIdx];
                          const target_word = targetWordObj.word || "Unknown";
                          const isCorrect = option.startsWith(targetWordObj.correct);
                          
                          setListenResult(isCorrect);
                          setListenStatus('answered');
                          if (isCorrect) setListenScore(s => s + 1);

                          // Log to backend
                          const formData = new FormData();
                          formData.append("user_id", userData?.userId || 'unknown');
                          formData.append("level_id", currentLevel.id);
                          formData.append("target_word", target_word);
                          formData.append("selected_word", option);
                          formData.append("is_correct", isCorrect.toString());
                          formData.append("reaction_time_ms", "0");
                          
                          fetch(`${API_BASE_URL}/api/log/listening`, {
                            method: "POST",
                            body: formData
                          }).catch(err => console.error("Failed to log listening:", err));
                        }}
                        className={`px-8 py-4 rounded-2xl text-2xl font-bold transition-all border-2 w-48 ${
                          listenStatus === 'answered'
                            ? option.startsWith(currentLevel.listeningQuestions[listenIdx].correct)
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/50 text-slate-500 opacity-50'
                            : 'bg-slate-800 border-slate-600 hover:border-cyan-400 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {listenStatus === 'answered' && (
                    <div className="mt-10 animate-in fade-in slide-in-from-bottom-4">
                      <p className={`text-2xl font-bold mb-6 ${listenResult ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {listenResult ? '✅ 正確 (Correct)!' : '❌ 錯誤 (Incorrect)'}
                      </p>
                      <button
                        onClick={() => {
                          setListenStatus('idle');
                          setListenResult(null);
                          setListenIdx(i => i + 1);
                        }}
                        className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-white transition-colors"
                      >
                        下一題 (Next)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative w-40 h-40 mb-8 animate-in zoom-in duration-700">
                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl animate-pulse"></div>
                    <img src={currentLevel.listeningImage} alt="reward" className="w-full h-full rounded-full object-cover border-4 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)] relative z-10" />
                  </div>
                  <h3 className="text-3xl font-bold text-cyan-400 mb-4">聽力測驗完成！</h3>
                  <p className="text-xl text-slate-300 mb-8">您的得分: <span className="text-3xl font-bold text-emerald-400">{listenScore}</span> / {currentLevel.listeningQuestions.length}</p>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => { setListenIdx(0); setListenScore(0); setListenStatus('idle'); }}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-white transition-colors"
                    >
                      重新測驗 (Retry)
                    </button>
                    <button 
                      onClick={() => {
                        setCompletedListeningLevels(prev => [...new Set([...prev, currentLevel.id])]);
                        switchToSpeaking();
                      }}
                      className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-white transition-colors flex items-center gap-2"
                    >
                      前往口說任務 (Go to Speaking) <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            ) : (
              // Display Mode (for levels without pairs)
              <div className="flex flex-col items-center">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {currentLevel.listeningQuestions.map((q, idx) => (
                    <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center gap-3">
                      <p className="text-lg text-cyan-300">{q.word}</p>
                      <button onClick={() => playTTS(q.word)} className="p-3 bg-cyan-500/20 hover:bg-cyan-500/40 rounded-full text-cyan-400 transition-colors">
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-12">
                   <button 
                     onClick={() => {
                       setCompletedListeningLevels(prev => [...new Set([...prev, currentLevel.id])]);
                       switchToSpeaking();
                     }}
                     className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-white transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                   >
                     聽力練習完成，前往口說任務 <ChevronRight className="w-5 h-5" />
                   </button>
                </div>
              </div>
            )}
            
            <p className="text-slate-500 mt-12 text-sm">{t.tts_note}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
                
                {/* Word Selection */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6">
                  <h3 className="text-slate-400 mb-3 text-sm">{t.select_word_to_speak}</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(currentLevel.listeningQuestions.flatMap(q => q.pair ? q.pair : [q.word]))).map((word, idx) => {
                      const isComplete = recordCounts[word] >= 3;
                      return (
                        <button 
                          key={idx}
                          onClick={() => setActiveWord(word)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                            activeWord === word 
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                              : isComplete 
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {word.split(' ')[0]} 
                          {isComplete && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center flex flex-col items-center shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl"></div>
                    <div 
                      className="group flex items-center justify-center gap-3 cursor-pointer mb-2"
                      onClick={() => playTTS(activeWord)}
                      title="聆聽發音 (Play Audio)"
                    >
                      <p className="text-4xl font-bold text-white tracking-wider group-hover:text-cyan-400 transition-colors">{activeWord}</p>
                      <button className="p-2 bg-slate-800 rounded-full text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-lg hover:scale-110">
                        <Volume2 className="w-6 h-6" />
                      </button>
                    </div>
                    {activeWord && (
                      <div className="mb-6 px-4 py-1 bg-slate-800 rounded-full text-sm text-cyan-400 border border-cyan-500/30">
                        已錄製: {recordCounts[activeWord] || 0} / 3 次
                      </div>
                    )}
                    <div className="text-6xl mb-8">{isRecording ? '🔥' : '🗣️'}</div>
                    <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`relative flex items-center gap-3 px-10 py-5 rounded-full font-bold text-xl transition-all overflow-hidden group ${
                        isRecording 
                            ? 'bg-rose-500 hover:bg-rose-600 shadow-[0_0_40px_rgba(244,63,94,0.6)]' 
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]'
                        }`}
                    >
                        {isRecording ? <Square className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                        <span className="relative z-10">{isRecording ? t.btn_stop_record : t.btn_start_speak}</span>
                    </button>
                    
                    {/* Extra Features: Replay, Download, Upload */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                      {audioUrl && (
                        <>
                          <button 
                            onClick={() => new Audio(audioUrl).play()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors border border-slate-700 hover:border-cyan-500/50 text-sm font-medium"
                            title={t.btn_replay}
                          >
                            <PlayCircle className="w-4 h-4" /> {t.btn_replay}
                          </button>
                          
                          <a 
                            href={audioUrl}
                            download={`${activeWord.split(' ')[0]}_recording.wav`}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors border border-slate-700 hover:border-cyan-500/50 text-sm font-medium"
                            title={`${t.btn_download} (wav)`}
                          >
                            <DownloadCloud className="w-4 h-4" /> {t.btn_download}
                          </a>
                        </>
                      )}
                      
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded-lg transition-colors border border-slate-700 hover:border-purple-500/50 text-sm font-medium"
                        title={`${t.btn_upload} (mp3, mp4, wav)`}
                      >
                        <UploadCloud className="w-4 h-4" /> {t.btn_upload}
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept="audio/*,video/mp4" 
                        className="hidden" 
                      />
                    </div>

                    <p className="mt-8 text-cyan-300 font-mono text-sm tracking-widest uppercase">{t[status] || status}</p>
                </div>

                {result && result.acoustic_features && (
                    <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700 rounded-3xl p-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                              <p className="text-slate-500 text-xs mb-1 uppercase font-semibold tracking-wider">F1 Formant</p>
                              <p className="text-2xl font-mono text-emerald-400">{Math.round(result.acoustic_features.F1)} <span className="text-sm text-slate-500">Hz</span></p>
                          </div>
                          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                              <p className="text-slate-500 text-xs mb-1 uppercase font-semibold tracking-wider">F2 Formant</p>
                              <p className="text-2xl font-mono text-emerald-400">{Math.round(result.acoustic_features.F2)} <span className="text-sm text-slate-500">Hz</span></p>
                          </div>
                          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                              <p className="text-slate-500 text-xs mb-1 uppercase font-semibold tracking-wider">Center of Gravity</p>
                              <p className="text-2xl font-mono text-purple-400">{Math.round(result.acoustic_features.COG)} <span className="text-sm text-slate-500">Hz</span></p>
                          </div>
                          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                              <p className="text-slate-500 text-xs mb-1 uppercase font-semibold tracking-wider">Duration</p>
                              <p className="text-2xl font-mono text-yellow-400">{result.acoustic_features.duration ? result.acoustic_features.duration.toFixed(2) : '0.00'} <span className="text-sm text-slate-500">s</span></p>
                          </div>
                        </div>
                    </div>
                )}
            </div>

            {result ? (
                <div className="flex flex-col gap-6 animate-in slide-in-from-right-8 duration-700">
                    
                    {/* Scatter Chart */}
                    <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700 rounded-3xl p-6">
                      <h3 className="text-lg font-bold text-cyan-300 mb-4">{t.analysis_chart} (F1/F2 Space)</h3>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis type="number" dataKey="f2" name="F2" domain={[500, 3000]} reversed stroke="#94a3b8" />
                            <YAxis type="number" dataKey="f1" name="F1" domain={[200, 1000]} reversed stroke="#94a3b8" />
                            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                            <ReferenceArea x1={2000} x2={2600} y1={200} y2={400} fill="#06b6d4" fillOpacity={0.2} stroke="#06b6d4" strokeOpacity={0.5} />
                            <ReferenceArea x1={1200} x2={1800} y1={400} y2={600} fill="#a855f7" fillOpacity={0.2} stroke="#a855f7" strokeOpacity={0.5} />
                            {result.acoustic_features && (
                              <Scatter name="You" data={[{ f2: result.acoustic_features.F2, f1: result.acoustic_features.F1 }]} fill="#fbbf24" shape="star" />
                            )}
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex gap-4 justify-center text-xs mt-2">
                        <span className="flex items-center gap-1 text-cyan-400"><div className="w-3 h-3 bg-cyan-500/50"></div> {t.zone_c}</span>
                        <span className="flex items-center gap-1 text-purple-400"><div className="w-3 h-3 bg-purple-500/50"></div> {t.zone_ch}</span>
                        <span className="flex items-center gap-1 text-amber-400"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {t.zone_you}</span>
                      </div>
                    </div>

                    {/* Star Rating & Sandwich Feedback */}
                    {result.feedback && (
                        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-6">
                              <div>
                                <h3 className="text-2xl font-bold text-white mb-2">{t.score_label} {result.score}</h3>
                                <div className="flex gap-1">
                                  {[1,2,3,4,5].map(star => (
                                    <Star key={star} className={`w-6 h-6 ${star <= result.stars ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                                  ))}
                                </div>
                              </div>
                              <div className="text-right">
                                {result.score >= 60 ? (
                                  <span className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full font-bold">{t.pass_text}</span>
                                ) : (
                                  <span className="bg-rose-500/20 text-rose-400 px-4 py-2 rounded-full font-bold">{t.fail_text}</span>
                                )}
                              </div>
                            </div>
                            
                            {result.score >= 60 ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 mb-6 animate-in zoom-in duration-500">
                        <div className="flex items-center gap-6 mb-2">
                          <div className="relative w-24 h-24 flex-shrink-0">
                            <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl animate-pulse"></div>
                            <img src={currentLevel.speakingImage} alt="reward" className="w-full h-full rounded-full object-cover border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] relative z-10" />
                          </div>
                          <div>
                            <h3 className="font-bold text-emerald-400 text-xl mb-2 flex items-center gap-2">
                              <Unlock className="w-5 h-5" /> {t.pass_text}
                            </h3>
                            {currentLevel.rewardEmojis && (
                              <p className="text-2xl mt-1 tracking-widest animate-bounce">
                                {currentLevel.rewardEmojis.join(' ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}

                            <div className="flex flex-col gap-4 relative z-10">
                                {/* Sandwich Feedback */}
                                <div className="flex gap-4 items-start bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                                    <div className="text-2xl">👍</div>
                                    <p className="text-emerald-300 font-medium">{result.feedback.praise}</p>
                                </div>
                                
                                <div className="flex gap-4 items-start bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                                    <div className="text-2xl">💡</div>
                                    <p className="text-amber-300 font-medium leading-relaxed">{result.feedback.correct}</p>
                                </div>

                                <div className="flex gap-4 items-start bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
                                    <div className="text-2xl"><Award className="w-6 h-6 text-blue-400" /></div>
                                    <p className="text-blue-300 font-medium">{result.feedback.encourage}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 border-dashed rounded-3xl p-10 text-slate-500 h-full">
                    <Activity className="w-16 h-16 mb-4 opacity-50" />
                    <p>{t.record_hint_1}</p>
                    <p>{t.record_hint_2}</p>
                </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const [adminClicks, setAdminClicks] = useState(0);

  const handleTitleClick = () => {
    setAdminClicks(prev => prev + 1);
    if (adminClicks + 1 >= 2) {
      setShowAdminModal(true);
      setAdminClicks(0);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === "xinyu99vn888") {
      setShowAdminModal(false);
      setAdminPassword('');
      setAdminError('');
      setStep(999);
    } else {
      setAdminError('密碼錯誤');
    }
  };

  if (step === 999) {
    return <AdminDashboard onBack={() => setStep(1)} adminName={userData?.name || "Teacher"} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 pb-20 flex flex-col items-center">
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 w-full">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 select-none" 
            onClick={handleTitleClick} 
            style={{ cursor: 'pointer' }}
          >
            <img 
              src="https://i.ibb.co/vxgG8XFW/Q2.png" 
              alt="Teacher Avatar" 
              className="w-10 h-10 rounded-full object-cover border-2 border-slate-700/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            />
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              教師管理專區 (Teacher Dashboard)
            </h1>
          </div>
          
          <div className="flex gap-2 z-50 items-center">
            <button 
              onClick={() => setShowPlatformManual(true)}
              className="px-4 py-1.5 mr-2 rounded-full text-sm font-medium backdrop-blur-md bg-indigo-500/80 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2 border border-indigo-400/50"
            >
              <Info className="w-4 h-4" /> {t.manual_btn}
            </button>
            {['zh', 'vi', 'en'].map(l => (
              <button 
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-full text-sm backdrop-blur-md transition-all ${lang === l ? 'bg-cyan-500/80 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-5xl flex flex-col items-center mt-12 px-6">
        {step === 1 && (
          <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-8">
              {t.welcome}
            </h1>
            <p className="text-slate-400 mb-8 text-lg">{t.select_role}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => handleRoleSelect('student')} className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-cyan-500/20 border border-transparent hover:border-cyan-500/50 transition-all text-xl font-medium">
                🎓 {t.student}
              </button>
              <button onClick={() => handleRoleSelect('teacher')} className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-purple-500/20 border border-transparent hover:border-purple-500/50 transition-all text-xl font-medium">
                👨‍🏫 {t.teacher}
              </button>
            </div>
          </div>
        )}

        {step === 2 && <FormP3 role={role} lang={lang} t={t} onSubmit={handleFormSubmit} onBack={() => setStep(1)} />}
        {step === 3 && (
          <div className="w-full flex flex-col items-center">
            {/* Tabs */}
            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => setActiveTab('map')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'map' ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'}`}
              >
                {t.map_title}
              </button>
              <button 
                onClick={() => setActiveTab('forum')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'forum' ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'}`}
              >
                {lang === 'zh' ? '討論區 (Forum)' : lang === 'vi' ? 'Diễn đàn (Forum)' : 'Discussion Forum'}
              </button>
            </div>
            
            {activeTab === 'map' ? renderLevelMap() : <Forum user={userData} lang={lang} />}
          </div>
        )}
        {step === 4 && renderPracticeArea()}
      </div>

      <InstructionModal isOpen={showInstruction} onClose={() => setShowInstruction(false)} lang={lang} />
      {showPlatformManual && <PlatformManualModal onClose={() => setShowPlatformManual(false)} t={t} />}

      <footer className="mt-auto pt-20 pb-6 w-full flex justify-center text-center">
        <span className="text-sm text-slate-500">
          Designed & Developed by Miranda Nguyen
        </span>
      </footer>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">教師管理專區登入</h3>
            
            <div className="relative mb-6">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="請輸入密碼"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all pr-12"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {adminError && (
              <p className="text-red-400 text-sm mb-4 text-center">{adminError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  setAdminPassword('');
                  setAdminError('');
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdminLogin}
                className="flex-1 px-4 py-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 transition-colors font-medium shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                登入
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating History Button */}
      {userData && (
        <button 
          onClick={() => setShowHistory(true)}
          className="fixed bottom-6 left-6 z-40 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-3 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-105"
        >
          <Activity className="w-5 h-5" />
          <span className="font-medium">{t.btn_history}</span>
        </button>
      )}

      {/* Practice History Modal */}
      {showHistory && userData && (
        <PracticeHistory 
          userId={userData.userId} 
          lang={lang} 
          onClose={() => setShowHistory(false)} 
        />
      )}
    </div>
  );
}

export default App;
