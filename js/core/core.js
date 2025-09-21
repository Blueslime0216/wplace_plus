// wplace.live에 Wplace Plus 메뉴를 추가하는 컨텐츠 스크립트
// Version: 0.0.2

console.log('Wplace Plus: 컨텐츠 스크립트가 로드되었습니다.');

let isInitialized = false; // 초기화 플래그 추가
let retryCount = 0;
const maxRetries = 50; // 최대 50번 시도 (약 25초)

// DOM이 완전히 로드된 후 실행
async function initWplacePlus() {
  if (isInitialized) {
    console.log('Wplace Plus: 이미 초기화되었습니다.');
    return;
  }
  isInitialized = true;
  console.log('Wplace Plus: 초기화 시작...');

  // 버전 표시 추가
  if (window.createVersionDisplay && !window.versionDisplayAdded) {
    window.createVersionDisplay();
  }

  // 열려있던 모달들 복원
  if (window.restoreOpenModals) {
    await window.restoreOpenModals();
  }

  // 메뉴 추가
  if (window.addMenu) {
    window.addMenu();
  }
}

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWplacePlus);
} else {
  initWplacePlus();
}

// DOM 변경 감지 및 메뉴 재추가
let currentUrl = location.href;
let menuCheckInterval = null;

// DOM 변경 감지 (SPA 환경에서 메뉴가 사라지는 것을 방지)
const domObserver = new MutationObserver((mutations) => {
  let shouldCheckMenu = false;
  
  mutations.forEach((mutation) => {
    // 타겟 div가 변경되었거나 제거되었는지 확인
    if (mutation.type === 'childList') {
      const targetDiv = document.querySelector('.absolute.left-2.top-2.z-30.flex.flex-col.gap-3');
      const existingMenu = document.querySelector('.wplace_plus_menu');
      
      // 타겟 div가 있고 메뉴가 없다면 재추가 필요
      if (targetDiv && !existingMenu) {
        shouldCheckMenu = true;
      }
      
      // 타겟 div가 변경되었는지 확인
      if (mutation.target === targetDiv || 
          (mutation.addedNodes.length > 0 && Array.from(mutation.addedNodes).some(node => 
            node.nodeType === 1 && node.classList && node.classList.contains('absolute')
          ))) {
        shouldCheckMenu = true;
      }
    }
  });
  
  if (shouldCheckMenu) {
    console.log('Wplace Plus: DOM 변경 감지, 메뉴 상태 확인');
    setTimeout(() => {
      if (window.checkAndRestoreMenu) {
        window.checkAndRestoreMenu();
      }
    }, 100);
  }
  
  // URL 변경 감지
  const url = location.href;
  if (url !== currentUrl) {
    currentUrl = url;
    console.log('Wplace Plus: URL 변경 감지, 재초기화');
    isInitialized = false; // URL이 변경되면 재초기화 허용
    setTimeout(initWplacePlus, 1000);
  }
});

domObserver.observe(document, { 
  subtree: true, 
  childList: true, 
  attributes: true,
  attributeFilter: ['class']
});

// 주기적으로 메뉴 존재 확인 (SPA에서 DOM이 자주 변경되는 경우 대비)
menuCheckInterval = setInterval(() => {
  if (window.checkAndRestoreMenu) {
    window.checkAndRestoreMenu();
  }
}, 2000);

// 페이지 언로드 시 인터벌 정리
window.addEventListener('beforeunload', () => {
  if (menuCheckInterval) {
    clearInterval(menuCheckInterval);
  }
});

// 전역 변수로 내보내기
window.isInitialized = isInitialized;