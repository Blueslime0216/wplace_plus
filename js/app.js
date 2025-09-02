// WPlace+ 메인 애플리케이션

(function() {
  'use strict';

  // 애플리케이션 초기화
  function init() {
    // 페이지 로드 완료 후 모달 생성
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createModal);
    } else {
      createModal();
    }
  }

  // 모달 생성 및 모든 이벤트 설정
  function createModal() {
    // 모달 생성
    const modal = WPlacePlusModal.createModal();
    if (!modal) {
      console.error('[WPlace+] 모달 생성 실패');
      return;
    }
    
    // 모든 이벤트 리스너 설정
    WPlacePlusDrag.setupDragListeners();
    WPlacePlusResize.setupResizeListeners();
    WPlacePlusControls.setupControlListeners();
    WPlacePlusCore.keyboard.setupListeners();
    
    // 최소화 상태 복원
    WPlacePlusControls.restoreMinimizeState();
    
    // UI 초기화 (모달 생성 후 약간의 지연을 두고 실행)
    setTimeout(() => {
      WPlacePlusUI.initializeUI();
      // 언어 관리자 초기화
      if (window.WPlacePlusLanguage) {
        WPlacePlusLanguage.initialize();
      }
    }, 100);
    return modal;
  }

  // 애플리케이션 정리
  function cleanup() {
    // 모든 이벤트 리스너 제거
    WPlacePlusDrag.removeDragListeners();
    WPlacePlusResize.removeResizeListeners();
    WPlacePlusCore.keyboard.removeListeners();
    
    // 모달 제거
    WPlacePlusModal.removeModal();
  }

  // 전역 API 노출
  window.WPlacePlus = {
    // 모달 관련
    modal: () => WPlacePlusModal.getModal(),
    isModalCreated: () => WPlacePlusModal.isModalCreated(),
    
    // 컨트롤 관련
    toggleMinimize: WPlacePlusControls.toggleMinimize,
    
    // 앱 관리
    init,
    cleanup,
    
    // 정보
    version: WPlacePlusCore.VERSION,
    storage: WPlacePlusCore.storage,
    
    // 디버깅용 함수들
    debug: {
      showStorage: () => WPlacePlusCore.storage.getAll(),
      clearStorage: () => {
        const keys = Object.keys(localStorage).filter(key => key.startsWith(WPlacePlusCore.STORAGE_PREFIX));
        keys.forEach(key => localStorage.removeItem(key));
        console.log('[WPlace+] Storage cleared');
      },
      showModalInfo: () => {
        const modal = WPlacePlusModal.getModal();
        if (!modal) return null;
        
        const rect = modal.getBoundingClientRect();
        return {
          position: { left: rect.left, top: rect.top },
          size: { width: rect.width, height: rect.height },
          classes: Array.from(modal.classList),
          styles: {
            left: modal.style.left,
            top: modal.style.top,
            width: modal.style.width,
            height: modal.style.height,
            opacity: modal.style.opacity,
            visibility: modal.style.visibility
          }
        };
      }
    }
  };

  // 초기화 실행
  init();

})();
