// WPlace+ 모달 생성 및 관리

let modal = null;

// 모달 생성
function createModal() {
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'wplace-plus-modal';
  modal.id = 'wplace-plus-modal';

  // 저장된 설정 복원 (안전장치 포함)
  const savedPosition = WPlacePlusCore.storage.get('modalPosition', { x: '50%', y: '50%' });
  const savedSize = WPlacePlusCore.storage.get('modalSize', { width: 400, height: 500 });
  const isMinimized = WPlacePlusCore.storage.get('isMinimized', false);

  
  // 데이터 검증 및 수정
  const safePosition = WPlacePlusHelpers.validatePosition(savedPosition);
  const safeSize = WPlacePlusHelpers.validateSize(savedSize);
  
  // 검증된 값이 다르면 스토리지 업데이트
  if (safePosition !== savedPosition) {
    WPlacePlusCore.storage.set('modalPosition', safePosition);
  }
  if (safeSize !== savedSize) {
    WPlacePlusCore.storage.set('modalSize', safeSize);
  }
  
  console.log('[WPlace+] 모달 생성 - 검증된 설정:', {
    original: { position: savedPosition, size: savedSize, isMinimized },
    safe: { position: safePosition, size: safeSize, isMinimized }
  });

  // 클래스 적용
  if (isMinimized) {
    modal.classList.add('minimized');
  }

  // 크기 및 위치 설정 (검증된 안전한 값 사용)
  if (!isMinimized) {
    modal.style.width = safeSize.width + 'px';
    modal.style.height = safeSize.height + 'px';
    
    // 위치 설정 (퍼센트인지 픽셀인지 확인)
    if (safePosition.x.includes('%')) {
      modal.style.left = safePosition.x;
      modal.style.top = safePosition.y;
      modal.style.transform = 'translate(-50%, -50%)';
    } else {
      modal.style.left = safePosition.x;
      modal.style.top = safePosition.y;
      modal.style.transform = 'none';
    }
    
    // 최대화 시 opacity 보장
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    
    console.log('[WPlace+] 모달 위치 설정 완료:', {
      left: modal.style.left,
      top: modal.style.top,
      width: modal.style.width,
      height: modal.style.height,
      opacity: modal.style.opacity,
      visibility: modal.style.visibility
    });
  }

  // 모달 HTML 구조 생성
  modal.innerHTML = `
    <div class="modal-header">
      <div class="header-left">
        <span class="header-title">WPlace+</span>
        <span class="header-version">v${WPlacePlusCore.VERSION}</span>
      </div>
      <div class="header-controls">
        <button class="header-btn minimize-btn" title="최소화">−</button>
      </div>
    </div>
    <div class="modal-content">
      ${WPlacePlusHelpers.generateUIContent()}
    </div>
    <div class="resize-handle left"></div>
    <div class="resize-handle right"></div>
    <div class="resize-handle bottom"></div>
    <div class="resize-handle corner"></div>
    <div class="resize-handle corner-left"></div>
  `;

  document.body.appendChild(modal);
  
  // 모달이 제대로 표시되었는지 확인 (안전장치)
  setTimeout(() => {
    if (!WPlacePlusHelpers.isModalVisible(modal) && !modal.classList.contains('minimized')) {
      const rect = modal.getBoundingClientRect();
      console.warn('[WPlace+] 모달이 화면 밖에 있음, 중앙으로 이동:', {
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        window: { width: window.innerWidth, height: window.innerHeight }
      });
      
      // 강제로 중앙으로 이동
      modal.style.left = '50%';
      modal.style.top = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
      
      // 스토리지도 업데이트
      WPlacePlusCore.storage.set('modalPosition', { x: '50%', y: '50%' });
    }
  }, 100);
  
  return modal;
}

// 모달 제거
function removeModal() {
  if (modal) {
    modal.remove();
    modal = null;
  }
}

// 모달 인스턴스 반환
function getModal() {
  return modal;
}

// 모달 존재 여부 확인
function isModalCreated() {
  return modal !== null;
}

// 전역에서 접근 가능하도록 설정
window.WPlacePlusModal = {
  createModal,
  removeModal,
  getModal,
  isModalCreated
};
