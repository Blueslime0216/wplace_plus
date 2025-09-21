// 프로젝트 드롭다운 관리
// Version: 0.0.2

let currentProjectDropdown = null;
let dropdownHoverTimeout = null;

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
      <div class="wplace_plus_project_dropdown_item" data-action="import-project" style="display: flex; align-items: center; padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #e5e7eb;">
        <span class="wplace_plus_project_dropdown_icon" style="margin-right: 8px; font-size: 14px; width: 16px; text-align: center;">📥</span>
        <span class="wplace_plus_project_dropdown_text" style="flex: 1; font-size: 14px; color: #374151;">불러오기</span>
      </div>
      <div class="wplace_plus_project_dropdown_item" data-action="create-project" style="display: flex; align-items: center; padding: 8px 12px; cursor: pointer;">
        <span class="wplace_plus_project_dropdown_icon" style="margin-right: 8px; font-size: 14px; width: 16px; text-align: center;">➕</span>
        <span class="wplace_plus_project_dropdown_text" style="flex: 1; font-size: 14px; color: #374151;">새 프로젝트</span>
      </div>
    `;
  } else {
    dropdown.innerHTML = `
      <div class="wplace_plus_project_dropdown_item" data-action="import-project" style="display: flex; align-items: center; padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #e5e7eb;">
        <span class="wplace_plus_project_dropdown_icon" style="margin-right: 8px; font-size: 14px; width: 16px; text-align: center;">📥</span>
        <span class="wplace_plus_project_dropdown_text" style="flex: 1; font-size: 14px; color: #374151;">불러오기</span>
      </div>
      <div class="wplace_plus_project_dropdown_item" data-action="create-project" style="display: flex; align-items: center; padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #e5e7eb;">
        <span class="wplace_plus_project_dropdown_icon" style="margin-right: 8px; font-size: 14px; width: 16px; text-align: center;">➕</span>
        <span class="wplace_plus_project_dropdown_text" style="flex: 1; font-size: 14px; color: #374151;">새 프로젝트</span>
      </div>
      <div class="wplace_plus_project_dropdown_divider" style="height: 1px; background: #e5e7eb; margin: 4px 0;"></div>
      ${projects.map(project => `
        <div class="wplace_plus_project_dropdown_item" data-project-id="${project.id}" style="display: flex; align-items: center; padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #e5e7eb; transition: background-color 0.2s;">
          <span class="wplace_plus_project_dropdown_icon" style="margin-right: 8px; font-size: 14px; width: 16px; text-align: center;">📁</span>
          <span class="wplace_plus_project_dropdown_text" style="flex: 1; font-size: 14px; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${project.name}</span>
          <span class="wplace_plus_project_dropdown_actions" style="display: flex; gap: 4px; margin-left: 8px;">
            <button class="wplace_plus_project_dropdown_btn" data-action="edit-project" data-project-id="${project.id}" title="프로젝트 설정" style="width: 20px; height: 20px; border: none; background: transparent; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px;">✏️</button>
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
      item.style.backgroundColor = '#f3f4f6';
      item.style.transform = 'translateX(2px)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
      item.style.transform = 'translateX(0)';
    });
  });

  // 드롭다운 이벤트 설정
  dropdown.addEventListener('click', async (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    const projectId = e.target.closest('[data-project-id]')?.dataset.projectId;
    
    if (action === 'import-project') {
      // 프로젝트 불러오기
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.style.display = 'none';
      
      fileInput.addEventListener('change', async (changeEvent) => {
        const file = changeEvent.target.files[0];
        if (file) {
          try {
            // projectShare가 사용 가능한지 확인
            if (typeof projectShare !== 'undefined' && projectShare.importProject) {
              // projectShare에 projectManager 설정
              if (projectShare.setProjectManager) {
                projectShare.setProjectManager(projectManager);
              }
              await projectShare.importProject(file);
            } else {
              // fallback: projectManager의 importProject 사용
              await projectManager.importProject(file);
            }
            
            // 드롭다운 닫기
            if (currentProjectDropdown) {
              currentProjectDropdown.remove();
              currentProjectDropdown = null;
            }
            
            // 드롭다운 다시 생성 (새로 추가된 프로젝트 반영)
            await createProjectDropdown(menuItem);
            
          } catch (error) {
            console.error('Wplace Plus: 프로젝트 불러오기 실패:', error);
            alert(`프로젝트 불러오기에 실패했습니다: ${error.message}`);
          }
        }
      });
      
      // 파일 선택 다이얼로그 열기
      document.body.appendChild(fileInput);
      fileInput.click();
      document.body.removeChild(fileInput);
      
    } else if (action === 'create-project') {
      await projectManager.loadProjects(); // 프로젝트 로드 대기
      const currentProjects = projectManager.projects; // 로드된 프로젝트 배열 사용
      const name = prompt('프로젝트 이름을 입력하세요:', `프로젝트 ${currentProjects.length + 1}`);
      if (name) {
        const project = await projectManager.addProject(name);
        if (project) {
          projectManager.openProject(project.id);
        }
        if (currentProjectDropdown) {
          currentProjectDropdown.remove();
          currentProjectDropdown = null;
        }
      }
    } else if (action === 'edit-project' && projectId) {
      // 프로젝트 설정 모달 열기
      const project = projectManager.getProject(projectId);
      if (project && window.createProjectSettingsModal) {
        window.createProjectSettingsModal(project);
        // 드롭다운 닫기
        if (currentProjectDropdown) {
          currentProjectDropdown.remove();
          currentProjectDropdown = null;
        }
      }
    } else if (action === 'delete-project' && projectId) {
      if (confirm('프로젝트를 삭제하시겠습니까?')) {
        await projectManager.deleteProject(projectId);
        if (currentProjectDropdown) {
          currentProjectDropdown.remove();
          currentProjectDropdown = null;
        }
        // 드롭다운 다시 생성
        await createProjectDropdown(menuItem);
      }
    } else if (projectId && !action) {
      // 프로젝트 목록 아이템 자체를 클릭한 경우 (버튼이 아닌 영역)
      projectManager.openProject(projectId);
      if (currentProjectDropdown) {
        currentProjectDropdown.remove();
        currentProjectDropdown = null;
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

// 전역으로 내보내기
window.createProjectDropdown = createProjectDropdown;
window.currentProjectDropdown = currentProjectDropdown;
