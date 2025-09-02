// WPlace+ 리사이즈 기능

// 리사이즈 상태 관리
let isResizing = false;
let resizeStart = { x: 0, y: 0, width: 0, height: 0, left: 0 };
let resizeDirection = '';

// 리사이즈 시작
function startResize(e) {
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
function handleResizeMove(e) {
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
function handleResizeEnd() {
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
  console.log('[WPlace+] 리사이즈 완료, 크기/위치 저장:', {
    size: { width: rect.width, height: rect.height },
    position: { x: rect.left + 'px', y: rect.top + 'px' }
  });
}

// 리사이즈 이벤트 리스너 설정
function setupResizeListeners() {
  const modal = WPlacePlusModal.getModal();
  if (!modal) return;

  // 리사이즈 핸들
  const resizeHandles = modal.querySelectorAll('.resize-handle');
  resizeHandles.forEach(handle => {
    handle.addEventListener('mousedown', startResize);
  });

  // 전역 마우스 이벤트
  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeEnd);
}

// 리사이즈 이벤트 리스너 제거
function removeResizeListeners() {
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeEnd);
}

// 전역에서 접근 가능하도록 설정
window.WPlacePlusResize = {
  setupResizeListeners,
  removeResizeListeners,
  startResize
};
