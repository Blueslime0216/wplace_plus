// 프로젝트 관리 드롭다운 생성 함수
function createProjectDropdown(menuButton) {
  // 기존 드롭다운이 있다면 제거
  const existingDropdown = document.querySelector('.wplace_plus_project_dropdown');
  if (existingDropdown) {
    existingDropdown.remove();
  }

  // 프로젝트 목록 가져오기
  const projects = projectManager.loadProjects();

  // 드롭다운 생성
  const dropdown = document.createElement('div');
  dropdown.className = 'wplace_plus_project_dropdown';
  
  // 프로젝트 목록 HTML 생성
  let projectsHTML = '';
  if (projects.length > 0) {
    projects.forEach(project => {
      projectsHTML += `
        <div class="wplace_plus_project_item" data-project-id="${project.id}">
          <span class="wplace_plus_project_icon">📁</span>
          <span class="wplace_plus_project_name">${project.name}</span>
          <span class="wplace_plus_project_date">${new Date(project.updatedAt).toLocaleDateString()}</span>
        </div>
      `;
    });
  } else {
    projectsHTML = '<div class="wplace_plus_project_empty">프로젝트가 없습니다</div>';
  }

  dropdown.innerHTML = `
    <div class="wplace_plus_project_header">
      <span class="wplace_plus_project_title">프로젝트 목록</span>
    </div>
    <div class="wplace_plus_project_list">
      ${projectsHTML}
    </div>
    <div class="wplace_plus_project_footer">
      <button class="wplace_plus_btn wplace_plus_btn_primary wplace_plus_btn_sm" id="add-project-btn">
        + 새 프로젝트 추가
      </button>
    </div>
  `;

  // 드롭다운을 body에 추가하고 위치 설정
  document.body.appendChild(dropdown);
  
  // 메뉴 버튼의 위치를 기준으로 드롭다운 위치 설정 (오른쪽)
  const menuRect = menuButton.getBoundingClientRect();
  const dropdownWidth = 280; // 최소 너비
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = menuRect.right + 8;
  let top = menuRect.top;
  
  // 화면 오른쪽 경계를 벗어나는 경우 왼쪽으로 표시
  if (left + dropdownWidth > viewportWidth) {
    left = menuRect.left - dropdownWidth - 8;
  }
  
  // 화면 아래쪽 경계를 벗어나는 경우 위로 조정
  if (top + 300 > viewportHeight) {
    top = viewportHeight - 300 - 10;
  }
  
  // 화면 위쪽 경계를 벗어나는 경우 아래로 조정
  if (top < 10) {
    top = 10;
  }
  
  dropdown.style.top = top + 'px';
  dropdown.style.left = left + 'px';

  // 드롭다운 이벤트 설정
  setupProjectDropdownEvents(dropdown);

  // 애니메이션을 위한 약간의 지연
  setTimeout(() => {
    dropdown.classList.add('show');
  }, 10);
}

// 프로젝트 드롭다운 이벤트 설정
function setupProjectDropdownEvents(dropdown) {
  // 새 프로젝트 추가 버튼
  const addProjectBtn = dropdown.querySelector('#add-project-btn');
  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', () => {
      const projectName = prompt('프로젝트 이름을 입력하세요:', `프로젝트 ${projectManager.projects.length + 1}`);
      if (projectName && projectName.trim()) {
        const newProject = projectManager.addProject(projectName.trim());
        console.log('Wplace Plus: 새 프로젝트 추가됨:', newProject);
        
        // 드롭다운 새로고침
        dropdown.remove();
        createProjectDropdown(document.querySelector('.wplace_plus_menu_item[data-action="projects"]'));
      }
    });
  }

  // 프로젝트 아이템 클릭
  const projectItems = dropdown.querySelectorAll('.wplace_plus_project_item');
  projectItems.forEach(item => {
    item.addEventListener('click', () => {
      const projectId = item.dataset.projectId;
      if (projectId) {
        console.log('Wplace Plus: 프로젝트 열기:', projectId);
        projectManager.openProject(projectId);
        dropdown.remove();
      }
    });
  });

  // 드롭다운 외부 클릭 시 닫기
  const closeDropdown = (e) => {
    if (!dropdown.contains(e.target) && !e.target.closest('.wplace_plus_menu_item[data-action="projects"]')) {
      dropdown.remove();
      document.removeEventListener('click', closeDropdown);
    }
  };

  // 약간의 지연 후 이벤트 리스너 추가 (즉시 닫히는 것을 방지)
  setTimeout(() => {
    document.addEventListener('click', closeDropdown);
  }, 100);

  // 윈도우 리사이즈/스크롤 시 위치 업데이트
  const updatePosition = () => {
    const menuButton = document.querySelector('.wplace_plus_menu_item[data-action="projects"]');
    if (menuButton) {
      const menuRect = menuButton.getBoundingClientRect();
      const dropdownWidth = 280; // 최소 너비
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let left = menuRect.right + 8;
      let top = menuRect.top;
      
      // 화면 오른쪽 경계를 벗어나는 경우 왼쪽으로 표시
      if (left + dropdownWidth > viewportWidth) {
        left = menuRect.left - dropdownWidth - 8;
      }
      
      // 화면 아래쪽 경계를 벗어나는 경우 위로 조정
      if (top + 300 > viewportHeight) {
        top = viewportHeight - 300 - 10;
      }
      
      // 화면 위쪽 경계를 벗어나는 경우 아래로 조정
      if (top < 10) {
        top = 10;
      }
      
      dropdown.style.top = top + 'px';
      dropdown.style.left = left + 'px';
    }
  };

  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition);

  // 드롭다운이 제거될 때 이벤트 리스너 정리
  const originalRemove = dropdown.remove;
  dropdown.remove = function() {
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition);
    originalRemove.call(this);
  };
}
