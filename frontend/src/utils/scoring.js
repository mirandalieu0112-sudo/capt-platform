export const calculateScore = (cog, targetType) => {
  // Mock scoring logic based on COG
  // For c (舌尖前音), target COG is generally higher (> 5000Hz)
  // For ch (舌尖後音), target COG is lower (3000-4500Hz)
  let score = 0;
  if (targetType === 'c') {
    if (cog > 5000) score = 95 - Math.random() * 5; // 90-95
    else if (cog > 4000) score = 80 - Math.random() * 5; // 75-80
    else score = 65 - Math.random() * 10; // 55-65
  } else {
    if (cog > 3000 && cog < 4800) score = 95 - Math.random() * 5;
    else if (cog > 4800) score = 80 - Math.random() * 5;
    else score = 65 - Math.random() * 10;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const getStars = (score) => {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  return 3; // Minimum 3 stars (保底機制)
};

const feedbackDB = {
  zh: {
    praise: ["聲音很好聽！", "很有潛力！", "發音很宏亮，自信度非常好！"],
    correct_c: {
      good: "完美命中「c」的標準頻率區間，舌尖位置很準確。",
      bad: "聽起來比較像捲舌的 ch。請嘗試把舌尖再往前抵住下門牙背，不要往後捲縮。"
    },
    correct_ch: {
      good: "完美命中「ch」的標準頻率區間，捲舌位置恰到好處。",
      bad: "聽起來比較像平舌的 c。嘗試將舌尖向後捲曲，保留縫隙，發音會更準確喔！"
    },
    encourage: {
      pass: "太棒了！成績達標，已經為您解鎖下一關囉！繼續保持！",
      fail: "已經表現得很好了！差一點點就能及格，多聽多唸幾次，你一定可以的！💪"
    }
  },
  vi: {
    praise: ["Giọng bạn rất hay!", "Rất có tiềm năng!", "Phát âm to rõ, rất tự tin!"],
    correct_c: {
      good: "Hoàn hảo đạt vùng tần số chuẩn của 'c', vị trí đầu lưỡi rất chính xác.",
      bad: "Nghe giống âm uốn lưỡi 'ch'. Hãy thử đẩy đầu lưỡi ra trước chạm răng cửa dưới, đừng uốn cong lại."
    },
    correct_ch: {
      good: "Hoàn hảo đạt vùng tần số chuẩn của 'ch', độ uốn lưỡi rất vừa vặn.",
      bad: "Nghe giống âm thẳng lưỡi 'c'. Hãy thử uốn cong đầu lưỡi ra sau một chút, giữ lại khe hở nhé!"
    },
    encourage: {
      pass: "Tuyệt vời! Đã đạt điểm chuẩn và mở khóa cửa tiếp theo! Tiếp tục phát huy!",
      fail: "Bạn đã làm rất tốt! Chỉ thiếu một chút nữa là đậu, nghe và đọc thêm vài lần, chắc chắn bạn sẽ làm được! 💪"
    }
  },
  en: {
    praise: ["Your voice sounds great!", "You have great potential!", "Loud and confident pronunciation!"],
    correct_c: {
      good: "Perfectly hit the standard frequency range for 'c', tongue tip position is very accurate.",
      bad: "Sounds a bit like the curled 'ch'. Try pushing your tongue tip forward against the lower front teeth, don't curl it back."
    },
    correct_ch: {
      good: "Perfectly hit the standard frequency range for 'ch', the tongue curl is just right.",
      bad: "Sounds a bit like the flat 'c'. Try curling your tongue tip back, keep a small gap, and it will be more accurate!"
    },
    encourage: {
      pass: "Awesome! You passed and unlocked the next level! Keep it up!",
      fail: "You did really well! Just a little bit away from passing, listen and practice a few more times, you can do it! 💪"
    }
  }
};

export const getSandwichFeedback = (score, targetType, lang = 'zh') => {
  const l = feedbackDB[lang] || feedbackDB['zh'];
  const isPass = score >= 60;
  const praise = l.praise[Math.floor(Math.random() * l.praise.length)];
  const correct = isPass ? l[`correct_${targetType}`].good : l[`correct_${targetType}`].bad;
  const encourage = isPass ? l.encourage.pass : l.encourage.fail;
  
  return { praise, correct, encourage };
};
