// WPlace+ 모달 관리 - 생성, 컨트롤, 최소화/복원

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
  }

  // 모달 HTML 구조 생성
  modal.innerHTML = `
    <div class="modal-header">
      <div class="header-left">
        <span class="header-title">WPlace+</span>
        <span class="header-version">v${WPlacePlusCore.VERSION}</span>
      </div>
      <div class="header-controls">
        <div class="language-dropdown">
          <button class="language-btn" id="language-btn">
            <span class="language-flag">🇰🇷</span>
            <span class="language-text">한국어</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          <div class="language-menu" id="language-menu">
            <div class="language-option" data-lang="ko">
              <span class="language-flag">🇰🇷</span>
              <span class="language-text">한국어</span>
            </div>
            <div class="language-option" data-lang="en">
              <span class="language-flag">🇺🇸</span>
              <span class="language-text">English</span>
            </div>
          </div>
        </div>
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

// 모달 컨트롤 관리
class ModalControls {
  constructor() {
    this.originalPosition = { left: null, top: null };
  }

  // 최소화 상태 복원
  restoreMinimizeState() {
    const isMinimized = WPlacePlusCore.storage.get('modalMinimized', false);
    if (isMinimized) {
      this.minimizeModal();
    }
  }

  // 모달 최소화
  minimizeModal() {
    // 현재 위치 저장 (최소화되지 않은 상태에서만)
    if (!modal.classList.contains('minimized')) {
      const rect = modal.getBoundingClientRect();
      this.originalPosition.left = modal.style.left || rect.left + 'px';
      this.originalPosition.top = modal.style.top || rect.top + 'px';
    }

    modal.classList.add('minimized');
    WPlacePlusCore.storage.set('modalMinimized', true);

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
    const newLeft = (parseFloat(this.originalPosition.left) || rect.left) + originalWidth - minimizedSize;
    const newTop = parseFloat(this.originalPosition.top) || rect.top;
    
    modal.style.left = newLeft + 'px';
    modal.style.top = newTop + 'px';
  }

  // 모달 복원 (최대화)
  restoreModal() {
    modal.classList.remove('minimized');
    WPlacePlusCore.storage.set('modalMinimized', false);

    // 모달 복원 시 리사이즈 핸들 다시 활성화
    const resizeHandles = modal.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => handle.style.display = '');

    // 원래 위치로 복원 (저장된 위치가 있는 경우)
    if (this.originalPosition.left !== null && this.originalPosition.top !== null) {
      modal.style.left = this.originalPosition.left;
      modal.style.top = this.originalPosition.top;
    }
  }

  // 최소화/복원 토글
  toggleMinimize() {
    if (modal.classList.contains('minimized')) {
      this.restoreModal();
    } else {
      this.minimizeModal();
    }
  }

  // 컨트롤 버튼 이벤트 리스너 설정
  setupControlListeners() {
    const header = modal.querySelector('.modal-header');
    
    const minimizeBtn = modal.querySelector('.minimize-btn');

    // 최소화 버튼 클릭 이벤트
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 이벤트 버블링 방지
        this.toggleMinimize();
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
        this.restoreModal();
      } else {
        // 최대화 상태에서는 최소화
        this.minimizeModal();
      }
    });

    // 윈도우 리사이즈 시 최소화된 모달 위치 조정
    window.addEventListener('resize', () => {
      if (modal && modal.classList.contains('minimized')) {
        const originalWidth = 400; // 원래 모달 너비
        const minimizedSize = 60; // 최소화된 원 크기
        
        // 오른쪽 상단 기준으로 위치 재계산
        const newLeft = (parseFloat(this.originalPosition.left) || 0) + originalWidth - minimizedSize;
        const newTop = parseFloat(this.originalPosition.top) || 0;
        
        modal.style.left = newLeft + 'px';
        modal.style.top = newTop + 'px';
      }
    });
  }
}

// 모달 컨트롤 인스턴스
const modalControls = new ModalControls();

// 전역에서 접근 가능하도록 설정
window.WPlacePlusModal = {
  createModal,
  removeModal,
  getModal,
  isModalCreated
};

window.WPlacePlusControls = {
  setupControlListeners: () => modalControls.setupControlListeners(),
  restoreMinimizeState: () => modalControls.restoreMinimizeState(),
  toggleMinimize: () => modalControls.toggleMinimize()
};
