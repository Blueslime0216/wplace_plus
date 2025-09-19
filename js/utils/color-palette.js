// Wplace 색상 팔레트 상수
// 참고: Wplace Overlay Pro.user.js와 WplacePro-VoX.user.js에서 추출

// 무료 색상 (기본 팔레트)
const WPLACE_FREE = [
  [0, 0, 0], [60, 60, 60], [120, 120, 120], [210, 210, 210], [255, 255, 255],
  [96, 0, 24], [237, 28, 36], [255, 127, 39], [246, 170, 9], [249, 221, 59], [255, 250, 188],
  [14, 185, 104], [19, 230, 123], [135, 255, 94],
  [12, 129, 110], [16, 174, 166], [19, 225, 190], [96, 247, 242],
  [40, 80, 158], [64, 147, 228],
  [107, 80, 246], [153, 177, 251],
  [120, 12, 153], [170, 56, 185], [224, 159, 249],
  [203, 0, 122], [236, 31, 128], [243, 141, 169],
  [104, 70, 52], [149, 104, 42], [248, 178, 119]
];

// 유료 색상 (확장 팔레트)
const WPLACE_PAID = [
  [170, 170, 170],
  [165, 14, 30], [250, 128, 114],
  [228, 92, 26], [156, 132, 49], [197, 173, 49], [232, 212, 95],
  [74, 107, 58], [90, 148, 74], [132, 197, 115],
  [15, 121, 159], [187, 250, 242], [125, 199, 255],
  [77, 49, 184], [122, 113, 196], [181, 174, 241],
  [74, 66, 132], [51, 57, 65], [109, 117, 141], [179, 185, 209],
  [155, 82, 73], [209, 128, 120], [250, 182, 164],
  [219, 164, 99], [123, 99, 82], [156, 132, 107], [214, 181, 148],
  [209, 128, 81], [255, 197, 165],
  [109, 100, 63], [148, 140, 107], [205, 197, 158]
];

// 색상 이름 매핑
const WPLACE_NAMES = {
  "0,0,0": "Black",
  "60,60,60": "Dark Gray",
  "120,120,120": "Gray",
  "170,170,170": "Medium Gray",
  "210,210,210": "Light Gray",
  "255,255,255": "White",
  "96,0,24": "Deep Red",
  "165,14,30": "Dark Red",
  "237,28,36": "Red",
  "250,128,114": "Light Red",
  "228,92,26": "Dark Orange",
  "255,127,39": "Orange",
  "246,170,9": "Gold",
  "249,221,59": "Yellow",
  "255,250,188": "Light Yellow",
  "156,132,49": "Dark Goldenrod",
  "197,173,49": "Goldenrod",
  "232,212,95": "Light Goldenrod",
  "74,107,58": "Dark Olive",
  "90,148,74": "Olive",
  "132,197,115": "Light Olive",
  "14,185,104": "Dark Green",
  "19,230,123": "Green",
  "135,255,94": "Light Green",
  "12,129,110": "Dark Teal",
  "16,174,166": "Teal",
  "19,225,190": "Light Teal",
  "15,121,159": "Dark Cyan",
  "96,247,242": "Cyan",
  "187,250,242": "Light Cyan",
  "40,80,158": "Dark Blue",
  "64,147,228": "Blue",
  "125,199,255": "Light Blue",
  "77,49,184": "Dark Indigo",
  "107,80,246": "Indigo",
  "153,177,251": "Light Indigo",
  "74,66,132": "Dark Slate Blue",
  "122,113,196": "Slate Blue",
  "181,174,241": "Light Slate Blue",
  "120,12,153": "Dark Purple",
  "170,56,185": "Purple",
  "224,159,249": "Light Purple",
  "203,0,122": "Dark Pink",
  "236,31,128": "Pink",
  "243,141,169": "Light Pink",
  "155,82,73": "Dark Peach",
  "209,128,120": "Peach",
  "250,182,164": "Light Peach",
  "104,70,52": "Dark Brown",
  "149,104,42": "Brown",
  "219,164,99": "Light Brown",
  "123,99,82": "Dark Tan",
  "156,132,107": "Tan",
  "214,181,148": "Light Tan",
  "209,128,81": "Dark Beige",
  "248,178,119": "Beige",
  "255,197,165": "Light Beige",
  "109,100,63": "Dark Stone",
  "148,140,107": "Stone",
  "205,197,158": "Light Stone",
  "51,57,65": "Dark Slate",
  "109,117,141": "Slate",
  "179,185,209": "Light Slate"
};

// 기본 선택된 색상 키
const DEFAULT_FREE_KEYS = WPLACE_FREE.map(([r, g, b]) => `${r},${g},${b}`);
const DEFAULT_PAID_KEYS = WPLACE_PAID.map(([r, g, b]) => `${r},${g},${b}`);

// 모든 색상 (무료 + 유료)
const ALL_COLORS = [...WPLACE_FREE, ...WPLACE_PAID];

// 색상 키를 RGB 배열로 변환
function colorKeyToRgb(colorKey) {
  return colorKey.split(',').map(Number);
}

// RGB 배열을 색상 키로 변환
function rgbToColorKey(rgb) {
  return rgb.join(',');
}

// RGB 값을 hex로 변환
function rgbToHex(r, g, b) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// 색상 키를 hex로 변환
function colorKeyToHex(colorKey) {
  const [r, g, b] = colorKeyToRgb(colorKey);
  return rgbToHex(r, g, b);
}
