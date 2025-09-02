// WPlace+ 드래그 기능

// 드래그 상태 관리
let isDragging = false;
let dragStart = { x: 0, y: 0, left: 0, top: 0 };

// 드래그 시작
function startDrag(e) {
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
function handleDragMove(e) {
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
function handleDragEnd() {
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
  console.log('[WPlace+] 드래그 완료, 위치 저장:', { x: rect.left + 'px', y: rect.top + 'px' });
}

// 드래그 이벤트 리스너 설정
function setupDragListeners() {
  const modal = WPlacePlusModal.getModal();
  if (!modal) return;

  // 헤더 드래그 (최소화된 상태에서도 작동)
  const header = modal.querySelector('.modal-header');
  if (header) {
    header.addEventListener('mousedown', startDrag);
  }
  
  // 최소화된 상태에서 전체 모달 드래그 가능
  modal.addEventListener('mousedown', (e) => {
    if (modal.classList.contains('minimized') && e.target === modal) {
      startDrag(e);
    }
  });

  // 전역 마우스 이벤트
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
}

// 드래그 이벤트 리스너 제거
function removeDragListeners() {
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
}

// 전역에서 접근 가능하도록 설정
window.WPlacePlusDrag = {
  setupDragListeners,
  removeDragListeners,
  startDrag
};