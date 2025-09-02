// WPlace+ 상호작용 기능 - 드래그, 리사이즈

// 드래그 상태 관리
let isDragging = false;
let dragStart = { x: 0, y: 0, left: 0, top: 0 };

// 리사이즈 상태 관리
let isResizing = false;
let resizeStart = { x: 0, y: 0, width: 0, height: 0, left: 0 };
let resizeDirection = '';

// 드래그 기능
class DragManager {
  // 드래그 시작
  startDrag(e) {
    const modal = WPlacePlusModal.getModal();
    if (!modal) return;
    
    isDragging = true;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
    
    const rect = modal.getBoundingClientRect();
    dragStart.left = rect.left;
    dragStart.top = rect.top;
    
    modal.classList.add('dragging');
    modal.style.cursor = 'grabbing';
    e.preventDefault();
  }

  // 드래그 중 마우스 이동 처리
  handleDragMove(e) {
    const modal = WPlacePlusModal.getModal();
    if (!modal || !isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const newLeft = dragStart.left + deltaX;
    const newTop = dragStart.top + deltaY;
    
    modal.style.left = newLeft + 'px';
    modal.style.top = newTop + 'px';
    modal.style.transform = 'none';
  }

  // 드래그 종료
  handleDragEnd() {
    const modal = WPlacePlusModal.getModal();
    if (!modal || !isDragging) return;

    isDragging = false;
    modal.classList.remove('dragging');
    modal.style.cursor = modal.classList.contains('minimized') ? 'move' : 'move';
    
    // 위치 저장 (transform이 적용되지 않은 실제 위치)
    const rect = modal.getBoundingClientRect();
    WPlacePlusCore.storage.set('modalPosition', {
      x: rect.left + 'px',
      y: rect.top + 'px'
    });
  }

  // 드래그 이벤트 리스너 설정
  setupDragListeners() {
    const modal = WPlacePlusModal.getModal();
    if (!modal) return;

    // 헤더 드래그 (최소화된 상태에서도 작동)
    const header = modal.querySelector('.modal-header');
    if (header) {
      header.addEventListener('mousedown', this.startDrag.bind(this));
    }
    
    // 최소화된 상태에서 전체 모달 드래그 가능
    modal.addEventListener('mousedown', (e) => {
      if (modal.classList.contains('minimized') && e.target === modal) {
        this.startDrag(e);
      }
    });

    // 전역 마우스 이벤트
    document.addEventListener('mousemove', this.handleDragMove.bind(this));
    document.addEventListener('mouseup', this.handleDragEnd.bind(this));
  }

  // 드래그 이벤트 리스너 제거
  removeDragListeners() {
    document.removeEventListener('mousemove', this.handleDragMove.bind(this));
    document.removeEventListener('mouseup', this.handleDragEnd.bind(this));
  }
}

// 리사이즈 기능
class ResizeManager {
  // 리사이즈 시작
  startResize(e) {
    const modal = WPlacePlusModal.getModal();
    if (!modal || modal.classList.contains('minimized')) return;
    
    isResizing = true;
    resizeStart.x = e.clientX;
    resizeStart.y = e.clientY;
    
    const rect = modal.getBoundingClientRect();
    resizeStart.width = rect.width;
    resizeStart.height = rect.height;
    resizeStart.left = rect.left;
    
    resizeDirection = e.target.classList.contains('left') ? 'left' :
                     e.target.classList.contains('right') ? 'right' :
                     e.target.classList.contains('bottom') ? 'bottom' :
                     e.target.classList.contains('corner') ? 'corner' :
                     e.target.classList.contains('corner-left') ? 'corner-left' : '';
    
    modal.classList.add('resizing');
    e.preventDefault();
    e.stopPropagation();
  }

  // 리사이즈 중 마우스 이동 처리
  handleResizeMove(e) {
    const modal = WPlacePlusModal.getModal();
    if (!modal || !isResizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    let newLeft = modal.style.left;
    
    if (resizeDirection === 'left') {
      // 왼쪽 리사이즈: 너비는 줄어들고, 위치는 오른쪽으로 이동
      const widthChange = -deltaX;
      newWidth = Math.max(300, resizeStart.width + widthChange);
      const leftChange = resizeStart.width - newWidth;
      newLeft = (resizeStart.left + leftChange) + 'px';
    } else if (resizeDirection === 'right' || resizeDirection === 'corner') {
      // 오른쪽 리사이즈: 너비만 변경
      newWidth = Math.max(300, resizeStart.width + deltaX);
    } else if (resizeDirection === 'corner-left') {
      // 왼쪽 하단 대각선 리사이즈: 너비는 줄어들고, 높이는 증가, 위치는 오른쪽으로 이동
      const widthChange = -deltaX;
      newWidth = Math.max(300, resizeStart.width + widthChange);
      const leftChange = resizeStart.width - newWidth;
      newLeft = (resizeStart.left + leftChange) + 'px';
      newHeight = Math.max(200, resizeStart.height + deltaY);
    }
    
    if (resizeDirection === 'bottom' || resizeDirection === 'corner' || resizeDirection === 'corner-left') {
      newHeight = Math.max(200, resizeStart.height + deltaY);
    }
    
    modal.style.width = newWidth + 'px';
    modal.style.height = newHeight + 'px';
    if (newLeft !== modal.style.left) {
      modal.style.left = newLeft;
    }
  }

  // 리사이즈 종료
  handleResizeEnd() {
    const modal = WPlacePlusModal.getModal();
    if (!modal || !isResizing) return;

    isResizing = false;
    modal.classList.remove('resizing');
    
    // 크기와 위치 저장 (리사이즈로 인한 위치 변경도 포함)
    const rect = modal.getBoundingClientRect();
    WPlacePlusCore.storage.set('modalSize', {
      width: rect.width,
      height: rect.height
    });
    WPlacePlusCore.storage.set('modalPosition', {
      x: rect.left + 'px',
      y: rect.top + 'px'
    });
  }

  // 리사이즈 이벤트 리스너 설정
  setupResizeListeners() {
    const modal = WPlacePlusModal.getModal();
    if (!modal) return;

    // 리사이즈 핸들
    const resizeHandles = modal.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => {
      handle.addEventListener('mousedown', this.startResize.bind(this));
    });

    // 전역 마우스 이벤트
    document.addEventListener('mousemove', this.handleResizeMove.bind(this));
    document.addEventListener('mouseup', this.handleResizeEnd.bind(this));
  }

  // 리사이즈 이벤트 리스너 제거
  removeResizeListeners() {
    document.removeEventListener('mousemove', this.handleResizeMove.bind(this));
    document.removeEventListener('mouseup', this.handleResizeEnd.bind(this));
  }
}

// 매니저 인스턴스 생성
const dragManager = new DragManager();
const resizeManager = new ResizeManager();

// 전역에서 접근 가능하도록 설정
window.WPlacePlusDrag = {
  setupDragListeners: () => dragManager.setupDragListeners(),
  removeDragListeners: () => dragManager.removeDragListeners(),
  startDrag: (e) => dragManager.startDrag(e)
};

window.WPlacePlusResize = {
  setupResizeListeners: () => resizeManager.setupResizeListeners(),
  removeResizeListeners: () => resizeManager.removeResizeListeners(),
  startResize: (e) => resizeManager.startResize(e)
};
