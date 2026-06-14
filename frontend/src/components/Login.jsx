import React, { useState } from 'react';
import { ChevronRight, User, Globe, MessageSquare, MapPin, GraduationCap } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    nationality: '',
    native_language: '',
    birthplace: '',
    chinese_level: '',
    gender: '',
    role: 'student'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user_id.trim()) {
      setError("請輸入代號 (Please enter ID)");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = new FormData();
      for (const key in formData) {
        data.append(key, formData[key]);
      }

      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        body: data,
      });

      const result = await response.json();
      if (result.status === "success") {
        onLogin(formData); // pass data back to App
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError("無法連線到伺服器 (Server connection error)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl w-full max-w-md relative z-10 shadow-2xl">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
          歡迎來到華語發音訓練
        </h1>
        <p className="text-slate-400 mb-8 text-sm">Welcome to Mandarin Pronunciation Training</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              身分代號 (Student/Teacher ID) *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="text" 
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                placeholder="e.g., S1, T1"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">例如：S1 (學生1), T1 (老師1)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">國籍 (Nationality)</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="text" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="e.g., Vietnam"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">母語 (Native Language)</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="text" name="native_language" value={formData.native_language} onChange={handleChange} placeholder="e.g., Vietnamese"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">出生地 (Birthplace)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  type="text" name="birthplace" value={formData.birthplace} onChange={handleChange} placeholder="e.g., Hanoi"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">性別 (Gender)</label>
              <select 
                name="gender" value={formData.gender} onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="">選擇 (Select)</option>
                <option value="男">男 (Male)</option>
                <option value="女">女 (Female)</option>
                <option value="其他">其他 (Other)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">中文程度 (Chinese Level)</label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <select 
                name="chinese_level" value={formData.chinese_level} onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="">選擇程度 (Select Level)</option>
                <option value="初級">初級 (Beginner)</option>
                <option value="中級">中級 (Intermediate)</option>
                <option value="高級">高級 (Advanced)</option>
              </select>
            </div>
          </div>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? "登入中..." : "進入系統 (Enter)"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
