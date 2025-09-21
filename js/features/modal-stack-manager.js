// 모달 스택 관리자
// Version: 0.0.1

class ModalStackManager {
  constructor() {
    this.modalStack = []; // 모달 ID들의 순서를 관리하는 배열
    this.baseZIndex = 10000; // 기본 z-index 값
    this.zIndexIncrement = 10; // 각 모달 간 z-index 차이
  }

  // 모달을 스택에 추가하고 최상단으로 이동
  addModal(modalId) {
    // 이미 스택에 있다면 제거
    this.removeModal(modalId);
    
    // 최상단에 추가
    this.modalStack.push(modalId);
    
    // z-index 업데이트
    this.updateZIndexes();
    
    console.log('Wplace Plus: 모달 추가됨:', modalId, '현재 스택:', this.modalStack);
  }

  // 모달을 스택에서 제거
  removeModal(modalId) {
    const index = this.modalStack.indexOf(modalId);
    if (index > -1) {
      this.modalStack.splice(index, 1);
      this.updateZIndexes();
      console.log('Wplace Plus: 모달 제거됨:', modalId, '현재 스택:', this.modalStack);
    }
  }

  // 모달을 최상단으로 이동
  bringToFront(modalId) {
    const index = this.modalStack.indexOf(modalId);
    if (index > -1) {
      // 스택에서 제거하고 최상단에 추가
      this.modalStack.splice(index, 1);
      this.modalStack.push(modalId);
      
      // z-index 업데이트
      this.updateZIndexes();
      
      console.log('Wplace Plus: 모달을 최상단으로 이동:', modalId, '현재 스택:', this.modalStack);
    }
  }

  // 모든 모달의 z-index 업데이트
  updateZIndexes() {
    this.modalStack.forEach((modalId, index) => {
      const modal = document.querySelector(`[data-project-id="${modalId}"]`);
      if (modal) {
        const zIndex = this.baseZIndex + (index * this.zIndexIncrement);
        modal.style.zIndex = zIndex.toString();
        console.log(`Wplace Plus: 모달 ${modalId} z-index 업데이트: ${zIndex}`);
      }
    });
  }

  // 모달이 스택에 있는지 확인
  hasModal(modalId) {
    return this.modalStack.includes(modalId);
  }

  // 현재 최상단 모달 ID 반환
  getTopModal() {
    return this.modalStack.length > 0 ? this.modalStack[this.modalStack.length - 1] : null;
  }

  // 스택 초기화
  clear() {
    this.modalStack = [];
    console.log('Wplace Plus: 모달 스택 초기화됨');
  }

  // 스택 상태 반환 (디버깅용)
  getStackState() {
    return {
      stack: [...this.modalStack],
      topModal: this.getTopModal(),
      count: this.modalStack.length
    };
  }
}

// 전역 모달 스택 매니저 인스턴스
const modalStackManager = new ModalStackManager();

// 모달 클릭 시 최상단으로 이동하는 이벤트 리스너
document.addEventListener('mousedown', (e) => {
  // 클릭된 요소가 모달 내부인지 확인
  const modal = e.target.closest('.wplace_plus_project_modal');
  if (modal) {
    const modalId = modal.dataset.projectId;
    if (modalId) {
      // 모달을 최상단으로 이동
      modalStackManager.bringToFront(modalId);
    }
  }
});

// 드래그 이벤트는 project-manager.js에서 처리

// 전역으로 내보내기
window.modalStackManager = modalStackManager;
