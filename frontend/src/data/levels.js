export const levels = [
  {
    id: 1,
    listeningTitle: {
      zh: "絕頂小籠包",
      vi: "Tuyệt Đỉnh Tiểu Long Bao",
      en: "Supreme Xiaolongbao"
    },
    speakingTitle: {
      zh: "絕頂小籠包",
      vi: "Tuyệt Đỉnh Tiểu Long Bao",
      en: "Supreme Xiaolongbao"
    },
    listeningImage: "https://i.postimg.cc/QCVDZDg1/xiao-long-bao.jpg",
    speakingImage: "https://i.postimg.cc/QCVDZDg1/xiao-long-bao.jpg",
    badgeImage: "/images/badges/xiaolongbao.png",
    description: {
      zh: "輔音 + 單元音對比",
      vi: "Đối chiếu phụ âm + nguyên âm đơn",
      en: "Consonant + Monophthong contrast"
    },
    listeningQuestions: [
      { pair: ["擦 (cā)", "茶 (chá)"], correct: "擦" },
      { pair: ["廁 (cè)", "車 (chē)"], correct: "廁" },
      { pair: ["測 (cè)", "徹 (chè)"], correct: "測" },
      { pair: ["次 (cì)", "吃 (chī)"], correct: "次" },
      { pair: ["詞 (cí)", "遲 (chí)"], correct: "詞" },
      { pair: ["粗 (cū)", "出 (chū)"], correct: "粗" },
      { pair: ["促 (cù)", "廚 (chú)"], correct: "促" }
    ],
    speakingTarget: "單元音",
    rewardEmojis: ["🥟", "🍠", "🥢", "😋"]
  },
  {
    id: 2,
    listeningTitle: {
      zh: "珍奶信徒",
      vi: "Tín Đồ Trà Sữa",
      en: "Boba Fanatic"
    },
    speakingTitle: {
      zh: "珍奶信徒",
      vi: "Tín Đồ Trà Sữa",
      en: "Boba Fanatic"
    },
    listeningImage: "https://i.postimg.cc/5NCcBns4/zhen-zhu-nai-cha.jpg",
    speakingImage: "https://i.postimg.cc/5NCcBns4/zhen-zhu-nai-cha.jpg",
    badgeImage: "/images/badges/boba.png",
    description: {
      zh: "輔音 + 雙元音、鼻音韻母對比",
      vi: "Đối chiếu phụ âm + nguyên âm đôi/âm mũi",
      en: "Consonant + Diphthong/Nasal contrast"
    },
    listeningQuestions: [
      { pair: ["菜 (cài)", "拆 (chāi)"], correct: "菜" },
      { pair: ["才 (cái)", "柴 (chái)"], correct: "才" },
      { pair: ["猜 (cāi)", "拆 (chāi)"], correct: "猜" },
      { pair: ["餐 (cān)", "產 (chǎn)"], correct: "餐" },
      { pair: ["參 (cān)", "產 (chǎn)"], correct: "參" },

      { pair: ["蒼 (cāng)", "常 (cháng)"], correct: "蒼" },
      { pair: ["草 (cǎo)", "吵 (chǎo)"], correct: "草" },
      { pair: ["操 (cāo)", "超 (chāo)"], correct: "操" },
      { pair: ["參 (cān)", "趁 (chèn)"], correct: "參" },
      { pair: ["曾 (céng)", "成 (chéng)"], correct: "曾" },
      { pair: ["層 (céng)", "城 (chéng)"], correct: "層" },
      { pair: ["從 (cóng)", "充 (chōng)"], correct: "從" },
      { pair: ["聰 (cōng)", "蟲 (chóng)"], correct: "聰" },
      { pair: ["湊 (còu)", "抽 (chōu)"], correct: "湊" }
    ],
    speakingTarget: "雙元音與鼻音"
  },
  {
    id: 3,
    listeningTitle: {
      zh: "天燈心願",
      vi: "Nguyện Ước Đèn Trời",
      en: "Sky Lantern Wishes"
    },
    speakingTitle: {
      zh: "天燈心願",
      vi: "Nguyện Ước Đèn Trời",
      en: "Sky Lantern Wishes"
    },
    listeningImage: "https://i.postimg.cc/g23WWNRm/tian-deng.jpg",
    speakingImage: "https://i.postimg.cc/g23WWNRm/tian-deng.jpg",
    badgeImage: "/images/badges/skylantern.png",
    description: {
      zh: "輔音 + 介音 + 韻母對比",
      vi: "Đối chiếu phụ âm + âm đệm + vần",
      en: "Consonant + Medial + Rhyme contrast"
    },
    listeningQuestions: [
      { pair: ["竄 (cuàn)", "穿 (chuān)"], correct: "竄" },
      { pair: ["竄 (cuàn)", "傳 (chuán)"], correct: "竄" },
      { pair: ["脆 (cuì)", "吹 (chuī)"], correct: "脆" },
      { pair: ["催 (cuī)", "垂 (chuí)"], correct: "催" },
      { pair: ["存 (cún)", "春 (chūn)"], correct: "存" },
      { pair: ["村 (cūn)", "純 (chún)"], correct: "村" },
      { pair: ["錯 (cuò)", "戳 (chuō)"], correct: "錯" },
      { pair: ["挫 (cuò)", "輟 (chuò)"], correct: "挫" }
    ],
    speakingTarget: "含介音韻母"
  },
  {
    id: 4,
    listeningTitle: {
      zh: "海芋仙子",
      vi: "Tiên nữ hoa rum",
      en: "Calla Lily Fairy"
    },
    speakingTitle: {
      zh: "海芋仙子",
      vi: "Tiên nữ hoa rum",
      en: "Calla Lily Fairy"
    },
    listeningImage: "https://i.postimg.cc/nLkfsr0v/hai-yu.jpg",
    speakingImage: "https://i.postimg.cc/nLkfsr0v/hai-yu.jpg",
    badgeImage: "/images/badges/callalily.png",
    description: {
      zh: "混合雙音節 (先平後翹 c + ch)",
      vi: "Âm tiết đôi hỗn hợp (trước thẳng sau cong c + ch)",
      en: "Mixed double syllables (c + ch)"
    },
    listeningQuestions: [
      { word: "財產 (cái chǎn)", type: "c_ch", correct: true },
      { word: "操場 (cāo chǎng)", type: "c_ch", correct: true },
      { word: "草創 (cǎo chuàng)", type: "c_ch", correct: true },
      { word: "刺穿 (cì chuān)", type: "c_ch", correct: true },
      { word: "促成 (cù chéng)", type: "c_ch", correct: true }
    ],
    speakingTarget: "先平後翹",
    rewardEmojis: ["🐷", "🌸", "🏔️", "🌺"]
  },
  {
    id: 5,
    listeningTitle: {
      zh: "捷運探險家",
      vi: "Nhà Thám Hiểm MRT",
      en: "MRT Explorer"
    },
    speakingTitle: {
      zh: "捷運探險家",
      vi: "Nhà Thám Hiểm MRT",
      en: "MRT Explorer"
    },
    listeningImage: "https://i.postimg.cc/W31L0Vy4/jie-yun.jpg",
    speakingImage: "https://i.postimg.cc/W31L0Vy4/jie-yun.jpg",
    badgeImage: "/images/badges/mrt.png",
    description: {
      zh: "混合雙音節 (先翹後平 ch + c)",
      vi: "Âm tiết đôi hỗn hợp (trước cong sau thẳng ch + c)",
      en: "Mixed double syllables (ch + c)"
    },
    listeningQuestions: [
      { word: "差錯 (chā cuò)", type: "ch_c", correct: true },
      { word: "場次 (chǎng cì)", type: "ch_c", correct: true },
      { word: "長存 (cháng cún)", type: "ch_c", correct: true },
      { word: "尺寸 (chǐ cùn)", type: "ch_c", correct: true },
      { word: "衝刺 (chōng cì)", type: "ch_c", correct: true },
      { word: "籌措 (chóu cuò)", type: "ch_c", correct: true },
      { word: "出錯 (chū cuò)", type: "ch_c", correct: true },
      { word: "初次 (chū cì)", type: "ch_c", correct: true },
      { word: "船艙 (chuán cāng)", type: "ch_c", correct: true },

      { word: "儲存 (chú cún)", type: "ch_c", correct: true },
      { word: "揣測 (chuǎi cè)", type: "ch_c", correct: true },
      { word: "純粹 (chún cuì)", type: "ch_c", correct: true }
    ],
    speakingTarget: "先翹後平",
    rewardEmojis: ["🚉", "🎫", "🥠", "⛩️"]
  }
];
