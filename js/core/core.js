// WPlace+ 핵심 모듈 - 상수, 스토리지, 키보드 이벤트

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

// 키보드 이벤트 관리
class KeyboardManager {
  constructor() {
    this.rKeyPressCount = 0;
    this.rKeyTimeout = null;
  }

  // 키보드 이벤트 처리
  handleKeyDown(e) {
    // R키 더블클릭으로 초기화
    if (e.key === 'r' || e.key === 'R') {
      this.rKeyPressCount++;
      
      // 기존 타이머 클리어
      if (this.rKeyTimeout) {
        clearTimeout(this.rKeyTimeout);
      }
      
      if (this.rKeyPressCount === 2) {
        // R키 더블클릭 감지
        if (window.WPlacePlusControls && window.WPlacePlusControls.resetModalPosition) {
          window.WPlacePlusControls.resetModalPosition();
        }
        this.rKeyPressCount = 0;
      } else {
        // 0.5초 후 카운터 리셋
        this.rKeyTimeout = setTimeout(() => {
          this.rKeyPressCount = 0;
        }, 500);
      }
    }
  }

  // 키보드 이벤트 리스너 설정
  setupListeners() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  // 키보드 이벤트 리스너 제거
  removeListeners() {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
}

// 키보드 매니저 인스턴스
const keyboardManager = new KeyboardManager();

// 전역에서 접근 가능하도록 설정
window.WPlacePlusCore = {
  VERSION,
  STORAGE_PREFIX,
  storage,
  keyboard: keyboardManager
};
