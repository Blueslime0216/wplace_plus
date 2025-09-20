// wplace.live에 Wplace Plus 메뉴를 추가하는 컨텐츠 스크립트
// Version: 0.0.2

console.log('Wplace Plus: 컨텐츠 스크립트가 로드되었습니다.');

let menuAdded = false;
let versionDisplayAdded = false;
let isInitialized = false; // 초기화 플래그 추가
let retryCount = 0;
const maxRetries = 50; // 최대 50번 시도 (약 25초)
let currentProjectDropdown = null;
let dropdownHoverTimeout = null;

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
  versionDisplay.textContent = 'v0.0.3';
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
async function restoreOpenModals() {
  await projectManager.loadProjects(); // 먼저 프로젝트를 로드
  const projects = projectManager.projects; // 로드된 프로젝트 배열 사용
  
  projects.forEach(project => {
    const ui = project.ui || {};
    const panels = ui.panels || {};
    const overlay = panels.overlay || {};
    
    // 오버레이 패널이 열려있었다면 복원 (최소화 상태 포함)
    if (overlay.visible) {
      console.log(`Wplace Plus: 프로젝트 "${project.name}" 모달 복원 (최소화 상태: ${overlay.collapsed})`);
      projectManager.openProject(project.id);
    }
  });
}

// 프로젝트 드롭다운 생성
async function createProjectDropdown(menuItem) {
  console.log('Wplace Plus: createProjectDropdown 호출됨', menuItem);
  
  // projectManager가 아직 로드되지 않았을 수 있으므로 확인
  if (typeof projectManager === 'undefined') {
    console.error('Wplace Plus: projectManager가 아직 로드되지 않았습니다');
    return;
  }

  // 기존 드롭다운 제거
  if (currentProjectDropdown) {
    console.log('Wplace Plus: 기존 드롭다운 제거');
    currentProjectDropdown.remove();
    currentProjectDropdown = null;
  }
  
  // 기존 타이머 클리어
  if (dropdownHoverTimeout) {
    clearTimeout(dropdownHoverTimeout);
    dropdownHoverTimeout = null;
  }

  await projectManager.loadProjects(); // 프로젝트 로드 대기
  const projects = projectManager.projects; // 로드된 프로젝트 배열 사용
  console.log('Wplace Plus: 로드된 프로젝트 수:', projects.length, projects);
  
  const dropdown = document.createElement('div');
  dropdown.className = 'wplace_plus_project_dropdown';
  
  // 인라인 스타일 추가 (CSS가 로드되지 않을 경우 대비)
  dropdown.style.cssText = `
    position: fixed;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    min-width: 200px;
    max-width: 300px;
    z-index: 10000;
    overflow: hidden;
    opacity: 1 !important;
    visibility: visible !important;
    transform: translateX(0) !important;
  `;
  
  if (projects.length === 0) {
    dropdown.innerHTML = `
      <div class="wplace_plus_project_dropdown_item" style="display: flex; align-items: center; padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #e5e7eb;">
        <span class="wplace_plus_project_dropdown_text" style="flex: 1; font-size: 14px; color: #374151;">프로젝트가 없습니다</span>
      </div>
      <div class="wplace_plus_project_dropdown_item" data-action="create-project" style="display: flex; align-items: center; padding: 8px 12px; cursor: pointer;">
        <span class="wplace_plus_project_dropdown_icon" style="margin-right: 8px; font-size: 14px; width: 16px; text-align: center;">➕</span>
        <span class="wplace_plus_project_dropdown_text" style="flex: 1; font-size: 14px; color: #374151;">새 프로젝트</span>
      </div>
    `;
  } else {
    dropdown.innerHTML = `
      <div class="wplace_plus_project_dropdown_item" data-action="create-project" style="display: flex; align-items: center; padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #e5e7eb;">
        <span class="wplace_plus_project_dropdown_icon" style="margin-right: 8px; font-size: 14px; width: 16px; text-align: center;">➕</span>
        <span class="wplace_plus_project_dropdown_text" style="flex: 1; font-size: 14px; color: #374151;">새 프로젝트</span>
      </div>
      <div class="wplace_plus_project_dropdown_divider" style="height: 1px; background: #e5e7eb; margin: 4px 0;"></div>
      ${projects.map(project => `
        <div class="wplace_plus_project_dropdown_item" data-project-id="${project.id}" style="display: flex; align-items: center; padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #e5e7eb;">
          <span class="wplace_plus_project_dropdown_icon" style="margin-right: 8px; font-size: 14px; width: 16px; text-align: center;">📁</span>
          <span class="wplace_plus_project_dropdown_text" style="flex: 1; font-size: 14px; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${project.name}</span>
          <span class="wplace_plus_project_dropdown_actions" style="display: flex; gap: 4px; margin-left: 8px;">
            <button class="wplace_plus_project_dropdown_btn" data-action="open-project" data-project-id="${project.id}" title="열기" style="width: 20px; height: 20px; border: none; background: transparent; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px;">👁️</button>
            <button class="wplace_plus_project_dropdown_btn" data-action="delete-project" data-project-id="${project.id}" title="삭제" style="width: 20px; height: 20px; border: none; background: transparent; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px;">🗑️</button>
          </span>
        </div>
      `).join('')}
    `;
  }
  
  // 드롭다운 위치 설정
  const rect = menuItem.getBoundingClientRect();
  dropdown.style.position = 'fixed';
  dropdown.style.left = (rect.right + 10) + 'px';
  dropdown.style.top = rect.top + 'px';
  dropdown.style.zIndex = '10000';
  
  document.body.appendChild(dropdown);
  currentProjectDropdown = dropdown; // 전역 변수에 저장
  
  console.log('Wplace Plus: 프로젝트 드롭다운 생성 완료', dropdown);
  console.log('Wplace Plus: 드롭다운 위치:', {
    left: dropdown.style.left,
    top: dropdown.style.top,
    zIndex: dropdown.style.zIndex
  });
  
  // 드롭다운 자체에 호버 이벤트 추가
  dropdown.addEventListener('mouseenter', () => {
    console.log('Wplace Plus: 드롭다운 호버됨');
    // 기존 타이머 클리어
    if (dropdownHoverTimeout) {
      clearTimeout(dropdownHoverTimeout);
      dropdownHoverTimeout = null;
    }
  });
  
  dropdown.addEventListener('mouseleave', () => {
    console.log('Wplace Plus: 드롭다운 호버 아웃');
    // 드롭다운에서 마우스가 나가면 제거
    dropdownHoverTimeout = setTimeout(() => {
      console.log('Wplace Plus: 드롭다운 자체에서 제거');
      if (currentProjectDropdown) {
        currentProjectDropdown.remove();
        currentProjectDropdown = null;
      }
    }, 200);
  });

  // 호버 효과 추가
  const items = dropdown.querySelectorAll('.wplace_plus_project_dropdown_item');
  items.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = '#f9fafb';
    });
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });
  });

  // 드롭다운 이벤트 설정
  dropdown.addEventListener('click', async (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    const projectId = e.target.closest('[data-project-id]')?.dataset.projectId;
    
    if (action === 'create-project') {
      await projectManager.loadProjects(); // 프로젝트 로드 대기
      const currentProjects = projectManager.projects; // 로드된 프로젝트 배열 사용
      const name = prompt('프로젝트 이름을 입력하세요:', `프로젝트 ${currentProjects.length + 1}`);
      if (name) {
        const project = projectManager.addProject(name);
        projectManager.openProject(project.id);
        if (currentProjectDropdown) {
          currentProjectDropdown.remove();
          currentProjectDropdown = null;
        }
      }
    } else if (action === 'open-project' && projectId) {
      projectManager.openProject(projectId);
      if (currentProjectDropdown) {
        currentProjectDropdown.remove();
        currentProjectDropdown = null;
      }
    } else if (action === 'delete-project' && projectId) {
      if (confirm('프로젝트를 삭제하시겠습니까?')) {
        projectManager.deleteProject(projectId);
        if (currentProjectDropdown) {
          currentProjectDropdown.remove();
          currentProjectDropdown = null;
        }
        // 드롭다운 다시 생성
        await createProjectDropdown(menuItem);
      }
    }
  });
  
  // 외부 클릭 시 드롭다운 닫기
  const closeDropdown = (e) => {
    if (!dropdown.contains(e.target) && !menuItem.contains(e.target)) {
      if (currentProjectDropdown) {
        currentProjectDropdown.remove();
        currentProjectDropdown = null;
      }
      document.removeEventListener('click', closeDropdown);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeDropdown);
  }, 100);
}

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

// DOM이 완전히 로드된 후 실행
async function initWplacePlus() {
  if (isInitialized) {
    console.log('Wplace Plus: 이미 초기화되었습니다.');
    return;
  }
  isInitialized = true;
  console.log('Wplace Plus: 초기화 시작...');

  // 버전 표시 추가
  if (!versionDisplayAdded) {
    createVersionDisplay();
  }

  // 열려있던 모달들 복원
  await restoreOpenModals();

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
        if (dropdownHoverTimeout) clearTimeout(dropdownHoverTimeout);
        
        // 약간의 지연 후 드롭다운 생성
        hoverTimeout = setTimeout(async () => {
          await createProjectDropdown(item);
        }, 100);
      });
      
      item.addEventListener('mouseleave', (e) => {
        console.log('Wplace Plus: 프로젝트 관리 메뉴 호버 아웃');
        
        // 기존 타이머들 클리어
        if (hoverTimeout) clearTimeout(hoverTimeout);
        
        // 더 긴 지연을 두어 드롭다운으로 마우스가 이동할 시간을 줍니다
        leaveTimeout = setTimeout(() => {
          if (currentProjectDropdown && !currentProjectDropdown.matches(':hover')) {
            console.log('Wplace Plus: 프로젝트 드롭다운 제거 (메뉴에서)');
            currentProjectDropdown.remove();
            currentProjectDropdown = null;
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
  
  if (!existingMenu && targetDiv && isInitialized) {
    console.log('Wplace Plus: 메뉴가 사라진 것을 감지, 재추가합니다.');
    // initWplacePlus() 대신 메뉴만 다시 생성하도록 수정
    const menu = createMenuElement();
    targetDiv.appendChild(menu);
    setupMenuEvents(menu);
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
    isInitialized = false; // URL이 변경되면 재초기화 허용
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
