import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { vnProvinces } from '../data/provinces';

const formI18n = {
  zh: {
    back: '返回重選身分',
    titleStudent: "學生基本資料",
    titleTeacher: "教師基本資料",
    nameLabel: "姓名 (與身分證或護照一致) *",
    namePlaceholder: "例如: NGUYEN VAN A",
    classLabel: "班級 *",
    classPlaceholder: "若未修過欣妤老師的課請填寫「其他」",
    genderLabel: "生理性別 *",
    selectDefault: "-- 請選擇 --",
    genderMale: "男",
    genderFemale: "女",
    genderOther: "其他",
    nationalityLabel: "國籍 *",
    natVn: "越南",
    natTw: "臺灣",
    natOther: "其他",
    natOtherPlaceholder: "請填寫國籍",
    birthplaceLabel: "出生地 (省/市) *",
    birthplaceSelect: "-- 請選擇省/市 --",
    systemMap: "系統歸類:",
    nativeLangLabel: "母語 *",
    langVn: "越南語",
    langZh: "中文",
    langOther: "其他",
    langOtherPlaceholder: "請填寫母語",
    levelLabel: "中文程度 *",
    levelSelect: "-- 請選擇程度 --",
    submitStudent: "確認登入並開始練習",
    submitTeacher: "確認登入並開始使用平台",
    userIdLabel: "登入代號 (ID) *",
    userIdPlaceholder: "例如: S1 (學生1), T1 (老師1)"
  },
  vi: {
    back: 'Quay lại chọn vai trò',
    titleStudent: "Thông tin cơ bản học sinh",
    titleTeacher: "Thông tin cơ bản giáo viên",
    nameLabel: "Họ và tên (Trùng khớp CCCD/Hộ chiếu) *",
    namePlaceholder: "VD: NGUYEN VAN A",
    classLabel: "Lớp học *",
    classPlaceholder: "Nếu chưa từng học lớp cô Hân Dư vui lòng điền 'Khác'",
    genderLabel: "Giới tính *",
    selectDefault: "-- Chọn --",
    genderMale: "Nam",
    genderFemale: "Nữ",
    genderOther: "Khác",
    nationalityLabel: "Quốc tịch *",
    natVn: "Việt Nam",
    natTw: "Đài Loan",
    natOther: "Khác",
    natOtherPlaceholder: "Vui lòng điền quốc tịch",
    birthplaceLabel: "Nơi sinh (Tỉnh/Thành phố) *",
    birthplaceSelect: "-- Chọn Tỉnh/Thành phố --",
    systemMap: "Phân vùng hệ thống:",
    nativeLangLabel: "Ngôn ngữ mẹ đẻ *",
    langVn: "Tiếng Việt",
    langZh: "Tiếng Trung",
    langOther: "Khác",
    langOtherPlaceholder: "Vui lòng điền ngôn ngữ mẹ đẻ",
    levelLabel: "Trình độ tiếng Trung *",
    levelSelect: "-- Chọn trình độ --",
    submitStudent: "Xác nhận đăng nhập & bắt đầu luyện tập",
    submitTeacher: "Xác nhận đăng nhập & sử dụng nền tảng",
    userIdLabel: "Mã số đăng nhập (ID) *",
    userIdPlaceholder: "VD: S1 (Học sinh 1), T1 (Giáo viên 1)"
  },
  en: {
    back: 'Back to select role',
    titleStudent: "Student Basic Info",
    titleTeacher: "Teacher Basic Info",
    nameLabel: "Full Name (Match ID/Passport) *",
    namePlaceholder: "e.g., NGUYEN VAN A",
    classLabel: "Class *",
    classPlaceholder: "If not Xinyu's student, fill 'Other'",
    genderLabel: "Biological Gender *",
    selectDefault: "-- Select --",
    genderMale: "Male",
    genderFemale: "Female",
    genderOther: "Other",
    nationalityLabel: "Nationality *",
    natVn: "Vietnam",
    natTw: "Taiwan",
    natOther: "Other",
    natOtherPlaceholder: "Please specify nationality",
    birthplaceLabel: "Birthplace (Province/City) *",
    birthplaceSelect: "-- Select Province/City --",
    systemMap: "System mapping:",
    nativeLangLabel: "Native Language *",
    langVn: "Vietnamese",
    langZh: "Chinese",
    langOther: "Other",
    langOtherPlaceholder: "Please specify native language",
    levelLabel: "Chinese Proficiency Level *",
    levelSelect: "-- Select Level --",
    submitStudent: "Login & Start Practice",
    submitTeacher: "Login & Enter Platform",
    userIdLabel: "Login ID *",
    userIdPlaceholder: "e.g., S1 (Student 1), T1 (Teacher 1)"
  }
};

export default function FormP3({ role, lang, t, onSubmit, onBack }) {
  const f = formI18n[lang] || formI18n['zh'];
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    className: '',
    classNameOther: '',
    gender: '',
    nationality: '',
    nationalityOther: '',
    province: '',
    region: '',
    nativeLanguage: '',
    nativeLanguageOther: '',
    chineseLevel: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleNameChange = (e) => {
    setFormData({ ...formData, name: e.target.value.toUpperCase() });
  };

  const handleProvinceChange = (e) => {
    const p = e.target.value;
    let r = '';
    if (vnProvinces.north.provinces.includes(p)) r = 'Miền Bắc (北部)';
    else if (vnProvinces.central.provinces.includes(p)) r = 'Miền Trung (中部)';
    else if (vnProvinces.south.provinces.includes(p)) r = 'Miền Nam (南部)';
    
    setFormData({ ...formData, province: p, region: r });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('role', role);
      data.append('class_name', formData.className === 'other' ? formData.classNameOther : formData.className);
      data.append('nationality', formData.nationality === 'other' ? formData.nationalityOther : formData.nationality);
      data.append('native_language', formData.nativeLanguage === 'other' ? formData.nativeLanguageOther : formData.nativeLanguage);
      data.append('birthplace', formData.province);
      data.append('chinese_level', formData.chineseLevel);
      data.append('gender', formData.gender);

      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        body: data,
      });
      const result = await response.json();
      if (result.status === "success") {
        onSubmit({ ...formData, userId: result.user_id });
      } else {
        alert("Login failed: " + result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Make sure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500 relative">
      {onBack && (
        <button 
          type="button"
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          {f.back}
        </button>
      )}
      <h2 className="text-2xl font-semibold mb-6 text-cyan-400 text-center">{role === 'teacher' ? f.titleTeacher : f.titleStudent}</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-md mx-auto">

        {/* Name */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">{f.nameLabel}</label>
          <input 
            required
            type="text" 
            placeholder={f.namePlaceholder}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all uppercase"
            value={formData.name}
            onChange={handleNameChange}
          />
        </div>

        {/* Class */}
        {role === 'student' && (
          <div>
            <label className="block text-sm text-slate-400 mb-1">{f.classLabel}</label>
            <select 
              required
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              value={formData.className}
              onChange={e => setFormData({...formData, className: e.target.value})}
            >
              <option value="">{f.selectDefault}</option>
              <option value="XYM1">XYM1</option>
              <option value="XYM2">XYM2</option>
              <option value="XYM3">XYM3</option>
              <option value="IMC1">IMC1</option>
              <option value="other">{lang === 'zh' ? '其他 (Other)' : 'Khác (Other)'}</option>
            </select>
            {formData.className === 'other' && (
              <input 
                required
                type="text" 
                placeholder={f.classPlaceholder}
                className="w-full mt-2 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all uppercase"
                value={formData.classNameOther}
                onChange={e => setFormData({...formData, classNameOther: e.target.value.toUpperCase()})}
              />
            )}
          </div>
        )}

        {/* Gender */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">{f.genderLabel}</label>
          <select 
            required
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            value={formData.gender}
            onChange={e => setFormData({...formData, gender: e.target.value})}
          >
            <option value="">{f.selectDefault}</option>
            <option value="male">{f.genderMale}</option>
            <option value="female">{f.genderFemale}</option>
            <option value="other">{f.genderOther}</option>
          </select>
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">{f.nationalityLabel}</label>
          <select 
            required
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            value={formData.nationality}
            onChange={e => setFormData({...formData, nationality: e.target.value})}
          >
            <option value="">{f.selectDefault}</option>
            <option value="vn">{f.natVn}</option>
            <option value="tw">{f.natTw}</option>
            <option value="other">{f.natOther}</option>
          </select>
          {formData.nationality === 'other' && (
            <input 
              required
              type="text" 
              placeholder={f.natOtherPlaceholder}
              className="w-full mt-2 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              value={formData.nationalityOther}
              onChange={e => setFormData({...formData, nationalityOther: e.target.value})}
            />
          )}
        </div>

        {/* Birthplace (Only if VN) */}
        {formData.nationality === 'vn' && (
          <div>
            <label className="block text-sm text-slate-400 mb-1">{f.birthplaceLabel}</label>
            <select 
              required
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              value={formData.province}
              onChange={handleProvinceChange}
            >
              <option value="">{f.birthplaceSelect}</option>
              <optgroup label={vnProvinces.north.label}>
                {vnProvinces.north.provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </optgroup>
              <optgroup label={vnProvinces.central.label}>
                {vnProvinces.central.provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </optgroup>
              <optgroup label={vnProvinces.south.label}>
                {vnProvinces.south.provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </optgroup>
            </select>
            {formData.region && <p className="text-xs text-cyan-400 mt-1 pl-1">{f.systemMap} {formData.region}</p>}
          </div>
        )}

        {/* Native Language */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">{f.nativeLangLabel}</label>
          <select 
            required
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            value={formData.nativeLanguage}
            onChange={e => setFormData({...formData, nativeLanguage: e.target.value})}
          >
            <option value="">{f.selectDefault}</option>
            <option value="vn">{f.langVn}</option>
            <option value="zh">{f.langZh}</option>
            <option value="other">{f.langOther}</option>
          </select>
          {formData.nativeLanguage === 'other' && (
            <input 
              required
              type="text" 
              placeholder={f.langOtherPlaceholder}
              className="w-full mt-2 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              value={formData.nativeLanguageOther}
              onChange={e => setFormData({...formData, nativeLanguageOther: e.target.value})}
            />
          )}
        </div>

        {/* Chinese Level */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">{f.levelLabel}</label>
          <select 
            required
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            value={formData.chineseLevel}
            onChange={e => setFormData({...formData, chineseLevel: e.target.value})}
          >
            <option value="">{f.levelSelect}</option>
            <option value="A0">準備級 / Cấp độ chuẩn bị (TOCFL under A1 / HSK 1-2) [300字以下]</option>
            <option value="A1">入門級 / Cấp độ A1 (TOCFL Level 1 / HSK 3) [500-600字]</option>
            <option value="A2">基礎級 / Cấp độ A2 (TOCFL Level 2 / HSK 4) [1000-1200字]</option>
            <option value="B1B2">中級 / Cấp độ B1-B2 (TOCFL Level 3-4 / HSK 5-6) [2500-5000字]</option>
            <option value="C1C2">高級 / Cấp độ C1-C2 (TOCFL Level 5-6) [8000字以上]</option>
          </select>
        </div>

        <button type="submit" disabled={isLoading} className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 text-white disabled:opacity-50">
          {isLoading ? "處理中..." : (role === 'student' ? f.submitStudent : f.submitTeacher)}
        </button>
      </form>
    </div>
  );
}
