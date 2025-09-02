// WPlace+ 모달 컨트롤(최소화, 닫기 등) 관리
const WPlacePlusControls = (() => {
  let modal;
  let header;
  let originalPosition = { left: null, top: null };

  // 최소화 상태 복원
  function restoreMinimizeState() {
    const isMinimized = WPlacePlusCore.storage.get('modalMinimized', false);
    if (isMinimized) {
      minimizeModal();
    }
  }

  // 모달 최소화
  function minimizeModal() {
    // 현재 위치 저장 (최소화되지 않은 상태에서만)
    if (!modal.classList.contains('minimized')) {
      const rect = modal.getBoundingClientRect();
      originalPosition.left = modal.style.left || rect.left + 'px';
      originalPosition.top = modal.style.top || rect.top + 'px';
    }

    modal.classList.add('minimized');
    WPlacePlusCore.storage.set('modalMinimized', true);
    console.log('[WPlace+] 모달 최소화');

    // 최소화 시 드래그만 가능하도록 리사이즈 핸들 비활성화
    const resizeHandles = modal.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => handle.style.display = 'none');

    // 오른쪽 상단을 기준으로 위치 조정
    // 원래 모달의 오른쪽 상단 위치를 계산하여 최소화된 원이 그 위치에 오도록 함
    const rect = modal.getBoundingClientRect();
    const originalWidth = 400; // 원래 모달 너비
    const originalHeight = 500; // 원래 모달 높이
    const minimizedSize = 60; // 최소화된 원 크기
    
    // 오른쪽 상단 기준으로 위치 계산
    const newLeft = (parseFloat(originalPosition.left) || rect.left) + originalWidth - minimizedSize;
    const newTop = parseFloat(originalPosition.top) || rect.top;
    
    modal.style.left = newLeft + 'px';
    modal.style.top = newTop + 'px';
  }

  // 모달 복원 (최대화)
  function restoreModal() {
    modal.classList.remove('minimized');
    WPlacePlusCore.storage.set('modalMinimized', false);
    console.log('[WPlace+] 모달 복원');

    // 모달 복원 시 리사이즈 핸들 다시 활성화
    const resizeHandles = modal.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => handle.style.display = '');

    // 원래 위치로 복원 (저장된 위치가 있는 경우)
    if (originalPosition.left !== null && originalPosition.top !== null) {
      modal.style.left = originalPosition.left;
      modal.style.top = originalPosition.top;
    }
  }

  // 최소화/복원 토글
  function toggleMinimize() {
    if (modal.classList.contains('minimized')) {
      restoreModal();
    } else {
      minimizeModal();
    }
  }

  // 컨트롤 버튼 이벤트 리스너 설정
  function setupControlListeners() {
    modal = WPlacePlusModal.getModal();
    header = modal.querySelector('.modal-header');
    
    const minimizeBtn = modal.querySelector('.minimize-btn');

    // 최소화 버튼 클릭 이벤트
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 이벤트 버블링 방지
        toggleMinimize();
      });
    }

    // 헤더 더블클릭으로 최소화/복원
    header.addEventListener('dblclick', (e) => {
      // 컨트롤 버튼에서 발생한 이벤트는 무시
      if (e.target.closest('.header-controls')) {
        return;
      }
      
      if (modal.classList.contains('minimized')) {
        // 최소화 상태에서는 복원
        restoreModal();
      } else {
        // 최대화 상태에서는 최소화
        minimizeModal();
      }
    });



    // 윈도우 리사이즈 시 최소화된 모달 위치 조정
    window.addEventListener('resize', () => {
      if (modal && modal.classList.contains('minimized')) {
        const originalWidth = 400; // 원래 모달 너비
        const minimizedSize = 60; // 최소화된 원 크기
        
        // 오른쪽 상단 기준으로 위치 재계산
        const newLeft = (parseFloat(originalPosition.left) || 0) + originalWidth - minimizedSize;
        const newTop = parseFloat(originalPosition.top) || 0;
        
        modal.style.left = newLeft + 'px';
        modal.style.top = newTop + 'px';
      }
    });
  }
  
  return {
    setupControlListeners,
    restoreMinimizeState,
    toggleMinimize
  };
})();
