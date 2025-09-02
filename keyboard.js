// WPlace+ 키보드 이벤트 처리

// R키 더블클릭 감지를 위한 변수
let rKeyPressCount = 0;
let rKeyTimeout = null;

// 키보드 이벤트 처리
function handleKeyDown(e) {
  // R키 더블클릭으로 초기화
  if (e.key === 'r' || e.key === 'R') {
    rKeyPressCount++;
    
    // 기존 타이머 클리어
    if (rKeyTimeout) {
      clearTimeout(rKeyTimeout);
    }
    
    if (rKeyPressCount === 2) {
      // R키 더블클릭 감지
      WPlacePlusControls.resetModalPosition();
      rKeyPressCount = 0;
    } else {
      // 0.5초 후 카운터 리셋
      rKeyTimeout = setTimeout(() => {
        rKeyPressCount = 0;
      }, 500);
    }
  }
}

// 키보드 이벤트 리스너 설정
function setupKeyboardListeners() {
  document.addEventListener('keydown', handleKeyDown);
}

// 키보드 이벤트 리스너 제거
function removeKeyboardListeners() {
  document.removeEventListener('keydown', handleKeyDown);
}

// 전역에서 접근 가능하도록 설정
window.WPlacePlusKeyboard = {
  setupKeyboardListeners,
  removeKeyboardListeners
};
