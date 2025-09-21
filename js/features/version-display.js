// 버전 표시 관리
// Version: 0.0.2

let versionDisplayAdded = false;

// 버전 표시 생성 함수
function createVersionDisplay() {
  // 이미 버전 표시가 있다면 제거
  const existingVersion = document.querySelector('.wplace_plus_version');
  if (existingVersion) {
    existingVersion.remove();
  }

  // 버전 표시 요소 생성
  const versionDisplay = document.createElement('div');
  versionDisplay.className = 'wplace_plus_version';
  versionDisplay.textContent = 'v0.0.3';
  versionDisplay.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    pointer-events: auto;
    user-select: none;
    cursor: pointer;
    transition: background-color 0.2s ease;
  `;

  // 호버 효과 추가
  versionDisplay.addEventListener('mouseenter', () => {
    versionDisplay.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
  });

  versionDisplay.addEventListener('mouseleave', () => {
    versionDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  });

  // 클릭 이벤트 추가 - 데이터 초기화
  versionDisplay.addEventListener('click', async () => {
    const confirmed = confirm(
      '⚠️ 경고: 모든 프로젝트 데이터가 영구적으로 삭제됩니다!\n\n' +
      '이 작업은 되돌릴 수 없습니다.\n' +
      '정말로 모든 데이터를 초기화하시겠습니까?'
    );

    if (confirmed) {
      try {
        // Chrome Storage API의 clear() 메서드로 모든 데이터 완전 삭제
        await chrome.storage.local.clear();
        console.log('Wplace Plus: 모든 데이터 완전 삭제 완료');
        alert('✅ 모든 데이터가 성공적으로 초기화되었습니다.\n페이지를 새로고침합니다.');
        // 페이지 새로고침
        window.location.reload();
      } catch (error) {
        console.error('Wplace Plus: 데이터 초기화 실패:', error);
        alert('❌ 데이터 초기화 중 오류가 발생했습니다: ' + error.message);
      }
    }
  });

  document.body.appendChild(versionDisplay);
  versionDisplayAdded = true;
  console.log('Wplace Plus: 버전 표시가 추가되었습니다.');
}

// 버전 표시 제거 함수
function removeVersionDisplay() {
  const existingVersion = document.querySelector('.wplace_plus_version');
  if (existingVersion) {
    existingVersion.remove();
    versionDisplayAdded = false;
    console.log('Wplace Plus: 버전 표시가 제거되었습니다.');
  }
}

// 전역으로 내보내기
window.createVersionDisplay = createVersionDisplay;
window.removeVersionDisplay = removeVersionDisplay;
