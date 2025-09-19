// wplace.live에 Wplace Plus 메뉴를 추가하는 컨텐츠 스크립트
// Version: 0.0.2

console.log('Wplace Plus: 컨텐츠 스크립트가 로드되었습니다.');

let menuAdded = false;
let versionDisplayAdded = false;
let retryCount = 0;
const maxRetries = 50; // 최대 50번 시도 (약 25초)

// 버전 표시 생성 함수
function createVersionDisplay() {
  // 이미 버전 표시가 있다면 제거
  const existingVersion = document.querySelector('.wplace_plus_version');
  if (existingVersion) {
    existingVersion.remove();
  }

  // 버전 표시 요소 생성
  const versionDisplay = document.createElement('div');
  versionDisplay.className = 'wplace_plus_version';
  versionDisplay.textContent = 'v0.0.2';
  versionDisplay.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    pointer-events: none;
    user-select: none;
  `;

  document.body.appendChild(versionDisplay);
  versionDisplayAdded = true;
  console.log('Wplace Plus: 버전 표시가 추가되었습니다.');
}

// 열려있던 모달들 복원
function restoreOpenModals() {
  const projects = projectManager.loadProjects();
  
  projects.forEach(project => {
    const ui = project.ui || {};
    const panels = ui.panels || {};
    const overlay = panels.overlay || {};
    
    // 오버레이 패널이 열려있었고 최소화되지 않았다면 복원
    if (overlay.visible && !overlay.collapsed) {
      console.log(`Wplace Plus: 프로젝트 "${project.name}" 모달 복원`);
      projectManager.openProject(project.id);
    }
  });
}

// DOM이 완전히 로드된 후 실행
function initWplacePlus() {
  // 버전 표시 추가
  if (!versionDisplayAdded) {
    createVersionDisplay();
  }

  // 열려있던 모달들 복원
  restoreOpenModals();

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
    retryCount++;
    if (retryCount < maxRetries) {
      console.log(`Wplace Plus: 대상 div를 찾을 수 없습니다. 재시도 중... (${retryCount}/${maxRetries})`);
      console.log('Wplace Plus: 현재 페이지 URL:', window.location.href);
      console.log('Wplace Plus: 찾고 있는 선택자:', '.absolute.left-2.top-2.z-30.flex.flex-col.gap-3');
      setTimeout(initWplacePlus, 500);
    } else {
      console.error('Wplace Plus: 대상 div를 찾을 수 없습니다. 최대 재시도 횟수를 초과했습니다.');
      console.error('Wplace Plus: 페이지 구조를 확인해주세요.');
    }
    return;
  }
  
  console.log('Wplace Plus: 대상 div를 찾았습니다:', targetDiv);

  // 기존 메뉴가 있다면 제거
  const existingMenu = document.querySelector('.wplace_plus_menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  // Wplace Plus 메뉴 생성 (W+ 버튼 + 드롭다운)
  const menu = document.createElement('div');
  menu.className = 'wplace_plus_menu';
  menu.innerHTML = `
    <button class="wplace_plus_main_btn" id="wplace-plus-toggle">
      <span class="wplace_plus_btn_text">W+</span>
    </button>
    <div class="wplace_plus_dropdown" id="wplace-plus-dropdown">
      <div class="wplace_plus_menu_item" data-action="overlay">
        <span class="wplace_plus_menu_icon">🖼️</span>
        <span class="wplace_plus_menu_text">오버레이</span>
      </div>
      <div class="wplace_plus_menu_item" data-action="completed">
        <span class="wplace_plus_menu_icon">✅</span>
        <span class="wplace_plus_menu_text">완료 표시</span>
      </div>
      <div class="wplace_plus_menu_item" data-action="filter">
        <span class="wplace_plus_menu_icon">🎨</span>
        <span class="wplace_plus_menu_text">단색 필터</span>
      </div>
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

  // 메뉴를 대상 div에 추가
  targetDiv.appendChild(menu);
  menuAdded = true;
  console.log('Wplace Plus: 메뉴가 추가되었습니다.');
  
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

// 메뉴 이벤트 설정
function setupMenuEvents(menu) {
  const toggleBtn = menu.querySelector('#wplace-plus-toggle');
  const dropdown = menu.querySelector('#wplace-plus-dropdown');
  const menuItems = menu.querySelectorAll('.wplace_plus_menu_item');
  
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
    
    if (action === 'projects') {
      // 프로젝트 관리 메뉴 - 호버 이벤트
      item.addEventListener('mouseenter', () => {
        createProjectDropdown(item);
      });
      
      item.addEventListener('mouseleave', () => {
        // 약간의 지연을 두어 드롭다운으로 마우스가 이동할 시간을 줍니다
        setTimeout(() => {
          const projectDropdown = document.querySelector('.wplace_plus_project_dropdown');
          if (projectDropdown && !projectDropdown.matches(':hover')) {
            projectDropdown.remove();
          }
        }, 100);
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

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWplacePlus);
} else {
  initWplacePlus();
}

// DOM 변경 감지 및 메뉴 재추가
let currentUrl = location.href;
let menuCheckInterval = null;

// 메뉴 존재 확인 및 재추가 함수
function checkAndRestoreMenu() {
  const existingMenu = document.querySelector('.wplace_plus_menu');
  const targetDiv = document.querySelector('.absolute.left-2.top-2.z-30.flex.flex-col.gap-3');
  
  if (!existingMenu && targetDiv) {
    console.log('Wplace Plus: 메뉴가 사라진 것을 감지, 재추가합니다.');
    initWplacePlus();
  }
}

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
    setTimeout(checkAndRestoreMenu, 100);
  }
  
  // URL 변경 감지
  const url = location.href;
  if (url !== currentUrl) {
    currentUrl = url;
    console.log('Wplace Plus: URL 변경 감지, 재초기화');
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
menuCheckInterval = setInterval(checkAndRestoreMenu, 2000);

// 페이지 언로드 시 인터벌 정리
window.addEventListener('beforeunload', () => {
  if (menuCheckInterval) {
    clearInterval(menuCheckInterval);
  }
});
