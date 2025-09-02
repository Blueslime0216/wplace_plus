// WPlace+ 핵심 상수 및 스토리지 관리

const VERSION = '0.0.1';
const STORAGE_PREFIX = 'wplace_plus_';

// 스토리지 헬퍼 함수
const storage = {
  get: (key, defaultValue) => {
    try {
      const value = localStorage.getItem(STORAGE_PREFIX + key);
      const result = value !== null ? JSON.parse(value) : defaultValue;
      console.log(`[WPlace+] Storage GET: ${key} =`, result);
      return result;
    } catch (e) {
      console.error(`[WPlace+] Storage GET error for ${key}:`, e);
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      console.log(`[WPlace+] Storage SET: ${key} =`, value);
    } catch (e) {
      console.error(`[WPlace+] Storage SET error for ${key}:`, e);
    }
  },
  // 모든 저장된 데이터 확인
  getAll: () => {
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const shortKey = key.replace(STORAGE_PREFIX, '');
        try {
          allData[shortKey] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          allData[shortKey] = localStorage.getItem(key);
        }
      }
    }
    console.log('[WPlace+] All stored data:', allData);
    return allData;
  }
};

// 전역에서 접근 가능하도록 설정
window.WPlacePlusCore = {
  VERSION,
  STORAGE_PREFIX,
  storage
};
