// 메뉴 관리
// Version: 0.0.2

let menuAdded = false;

// 메뉴 DOM 요소를 생성하는 함수
function createMenuElement() {
  const menu = document.createElement('div');
  menu.className = 'wplace_plus_menu';
  menu.innerHTML = `
    <button class="wplace_plus_main_btn" id="wplace-plus-toggle">
      <span class="wplace_plus_btn_text">W+</span>
    </button>
    <div class="wplace_plus_dropdown" id="wplace-plus-dropdown">
      <div class="wplace_plus_menu_item" data-action="projects">
        <span class="wplace_plus_menu_icon">📁</span>
        <span class="wplace_plus_menu_text">프로젝트 관리</span>
      </div>
      <div class="wplace_plus_menu_item" data-action="autotool">
        <span class="wplace_plus_menu_icon">🔧</span>
        <span class="wplace_plus_menu_text">반자동 도구</span>
      </div>
    </div>
  `;
  return menu;
}

// 메뉴 이벤트 설정
function setupMenuEvents(menu) {
  console.log('Wplace Plus: setupMenuEvents 호출됨', menu);
  const toggleBtn = menu.querySelector('#wplace-plus-toggle');
  const dropdown = menu.querySelector('#wplace-plus-dropdown');
  const menuItems = menu.querySelectorAll('.wplace_plus_menu_item');
  
  console.log('Wplace Plus: 찾은 요소들:', {
    toggleBtn: !!toggleBtn,
    dropdown: !!dropdown,
    menuItemsCount: menuItems.length
  });
  
  // W+ 버튼 클릭 이벤트
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
  }
  
  // 외부 클릭 시 드롭다운 닫기
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
  
  // 메뉴 아이템 이벤트
  menuItems.forEach(item => {
    const action = item.dataset.action;
    console.log('Wplace Plus: 메뉴 아이템 설정 중:', action);
    
    if (action === 'projects') {
      console.log('Wplace Plus: 프로젝트 관리 메뉴 이벤트 설정');
      let hoverTimeout = null;
      let leaveTimeout = null;
      
      // 프로젝트 관리 메뉴 - 호버 이벤트
      item.addEventListener('mouseenter', (e) => {
        console.log('Wplace Plus: 프로젝트 관리 메뉴 호버됨', e);
        e.stopPropagation();
        
        // 기존 타이머들 클리어
        if (hoverTimeout) clearTimeout(hoverTimeout);
        if (leaveTimeout) clearTimeout(leaveTimeout);
        if (window.dropdownHoverTimeout) clearTimeout(window.dropdownHoverTimeout);
        
        // 약간의 지연 후 드롭다운 생성
        hoverTimeout = setTimeout(async () => {
          if (window.createProjectDropdown) {
            await window.createProjectDropdown(item);
          }
        }, 100);
      });
      
      item.addEventListener('mouseleave', (e) => {
        console.log('Wplace Plus: 프로젝트 관리 메뉴 호버 아웃');
        
        // 기존 타이머들 클리어
        if (hoverTimeout) clearTimeout(hoverTimeout);
        
        // 더 긴 지연을 두어 드롭다운으로 마우스가 이동할 시간을 줍니다
        leaveTimeout = setTimeout(() => {
          if (window.currentProjectDropdown && !window.currentProjectDropdown.matches(':hover')) {
            console.log('Wplace Plus: 프로젝트 드롭다운 제거 (메뉴에서)');
            window.currentProjectDropdown.remove();
            window.currentProjectDropdown = null;
          }
        }, 300);
      });
    } else {
      // 다른 메뉴 아이템들 - 클릭 이벤트
      item.addEventListener('click', () => {
        console.log(`Wplace Plus: ${action} 메뉴 클릭됨`);
        // 드롭다운 닫기
        dropdown.classList.remove('show');
        // 여기에 각 기능별 처리 로직을 추가할 수 있습니다
      });
    }
  });
}

// 메뉴 추가 함수
function addMenu() {
  // 이미 메뉴가 추가되었는지 확인
  const existingMenuCheck = document.querySelector('.wplace_plus_menu');
  if (existingMenuCheck) {
    console.log('Wplace Plus: 메뉴가 이미 존재합니다.');
    menuAdded = true;
    return;
  }

  // wplace.live의 특정 클래스를 가진 div를 찾습니다
  let targetDiv = document.querySelector('.absolute.left-2.top-2.z-30.flex.flex-col.gap-3');
  
  // 대안 선택자들 시도
  if (!targetDiv) {
    targetDiv = document.querySelector('.absolute.left-2.top-2.z-30');
  }
  if (!targetDiv) {
    targetDiv = document.querySelector('[class*="absolute"][class*="left-2"][class*="top-2"]');
  }
  if (!targetDiv) {
    targetDiv = document.querySelector('.flex.flex-col.gap-3');
  }
  if (!targetDiv) {
    // 마지막 수단: body에 직접 추가
    targetDiv = document.body;
    console.log('Wplace Plus: 대안 선택자를 사용하여 body에 메뉴를 추가합니다.');
  }
  
  if (!targetDiv) {
    console.error('Wplace Plus: 대상 div를 찾을 수 없습니다.');
    return;
  }
  
  console.log('Wplace Plus: 대상 div를 찾았습니다:', targetDiv);

  // 기존 메뉴가 있다면 제거
  const existingMenu = document.querySelector('.wplace_plus_menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  // Wplace Plus 메뉴 생성 (W+ 버튼 + 드롭다운)
  const menu = createMenuElement();

  // 메뉴를 대상 div에 추가
  targetDiv.appendChild(menu);
  menuAdded = true;
  console.log('Wplace Plus: 메뉴가 추가되었습니다.', menu);
  
  // 메뉴 아이템들 확인
  const menuItems = menu.querySelectorAll('.wplace_plus_menu_item');
  console.log('Wplace Plus: 메뉴 아이템 수:', menuItems.length);
  menuItems.forEach((item, index) => {
    console.log(`Wplace Plus: 메뉴 아이템 ${index}:`, item.dataset.action, item);
  });
  
  // body에 직접 추가된 경우 스타일 조정
  if (targetDiv === document.body) {
    menu.style.position = 'fixed';
    menu.style.top = '20px';
    menu.style.left = '20px';
    menu.style.zIndex = '9999';
    console.log('Wplace Plus: body에 고정 위치로 메뉴를 추가했습니다.');
  }

  // 메뉴 이벤트 리스너 설정
  setupMenuEvents(menu);
}

// 메뉴 존재 확인 및 재추가 함수
function checkAndRestoreMenu() {
  const existingMenu = document.querySelector('.wplace_plus_menu');
  const targetDiv = document.querySelector('.absolute.left-2.top-2.z-30.flex.flex-col.gap-3');
  
  if (!existingMenu && targetDiv && window.isInitialized) {
    console.log('Wplace Plus: 메뉴가 사라진 것을 감지, 재추가합니다.');
    // initWplacePlus() 대신 메뉴만 다시 생성하도록 수정
    const menu = createMenuElement();
    targetDiv.appendChild(menu);
    setupMenuEvents(menu);
  }
}

// 전역으로 내보내기
window.addMenu = addMenu;
window.checkAndRestoreMenu = checkAndRestoreMenu;
window.menuAdded = menuAdded;
