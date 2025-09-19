// 프로젝트 관리 클래스
class ProjectManager {
  constructor() {
    this.storageKey = 'wplace_plus_projects';
    this.projects = this.loadProjects();
    this.activeProjectId = null;
    this.projectModals = new Map();
    this.openModalIds = new Set();
    this.imageUploadManager = imageUploadManager;
  }

  // 로컬 스토리지에서 프로젝트 목록 로드
  loadProjects() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Wplace Plus: 프로젝트 로드 실패:', error);
      return [];
    }
  }

  // 프로젝트 목록 저장
  saveProjects() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.projects));
    } catch (error) {
      console.error('Wplace Plus: 프로젝트 저장 실패:', error);
    }
  }

  // 새 프로젝트 추가
  addProject(name) {
    const project = {
      // 프로젝트 메타데이터
      id: this.generateProjectId(),
      name: name || `프로젝트 ${this.projects.length + 1}`,
      description: '',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // 프로젝트 데이터
      data: {
        overlays: [],
        completedPixels: {
          enabled: false,
          settings: {
            highlightColor: '#00ff00',
            opacity: 0.5
          }
        },
        colorFilter: {
          enabled: false,
          settings: {
            mode: 'monochrome',
            color: '#000000',
            intensity: 0.5
          }
        },
        autoTool: {
          enabled: false
        }
      },
      
      // UI 상태
      ui: {
        activeTool: 'line-tool',
        panels: {
          overlay: {
            visible: false,
            position: { x: 100, y: 100 },
            size: { width: 400, height: 500 },
            collapsed: false
          }
        }
      }
    };

    this.projects.push(project);
    this.saveProjects();
    return project;
  }

  // 프로젝트 ID 생성
  generateProjectId() {
    return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 프로젝트 가져오기
  getProject(id) {
    return this.projects.find(p => p.id === id);
  }

  // 프로젝트 삭제
  deleteProject(id) {
    const projectIndex = this.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) return false;

    // 모달이 열려있다면 닫기
    const modal = this.projectModals.get(id);
    if (modal) {
      modal.remove();
      this.projectModals.delete(id);
      this.openModalIds.delete(id);
    }

    // 프로젝트 데이터 삭제
    localStorage.removeItem(`wplace_plus_project_${id}`);

    // 프로젝트 목록에서 제거
    this.projects.splice(projectIndex, 1);
    this.saveProjects();

    return true;
  }

  // 프로젝트 열기 (모달 생성)
  async openProject(id) {
    const project = this.getProject(id);
    if (!project) return null;

    this.activeProjectId = id;
    
    // ImageUploadManager에 프로젝트 ID 설정 (비동기)
    await this.imageUploadManager.setProjectId(id);
    
    // 이미 모달이 있다면 제거
    const existingModal = this.projectModals.get(id);
    if (existingModal) {
      existingModal.remove();
    }

    // 새 모달 생성
    const modal = this.createProjectModal(project);
    this.projectModals.set(id, modal);
    this.openModalIds.add(id);
    
    // 저장된 UI 상태 복원
    this.restoreModalState(modal, project);
    
    // 모달이 열렸음을 표시
    if (!project.ui) project.ui = {};
    if (!project.ui.panels) project.ui.panels = {};
    if (!project.ui.panels.overlay) project.ui.panels.overlay = {};
    project.ui.panels.overlay.visible = true;
    this.saveProjects();
    
    return modal;
  }

  // 모달 상태 복원
  restoreModalState(modal, project) {
    const ui = project.ui || {};
    const panels = ui.panels || {};
    
    // 위치 복원
    if (panels.overlay && panels.overlay.position) {
      modal.style.left = panels.overlay.position.x + 'px';
      modal.style.top = panels.overlay.position.y + 'px';
    }
    
    // 크기 복원
    if (panels.overlay && panels.overlay.size) {
      modal.style.width = panels.overlay.size.width + 'px';
      modal.style.height = panels.overlay.size.height + 'px';
    }
    
    // 최소화 상태 복원
    if (panels.overlay && panels.overlay.collapsed) {
      console.log(`Wplace Plus: 모달 최소화 상태 복원 - 프로젝트: ${project.name}`);
      modal.classList.add('minimized');
      const minimizeBtn = modal.querySelector('.wplace_plus_minimize_btn');
      if (minimizeBtn) {
        minimizeBtn.textContent = '+';
        minimizeBtn.title = '최대화';
      }
    }
  }

  // 모달 상태 저장
  saveModalState(modal, projectId) {
    const project = this.getProject(projectId);
    if (!project) return;

    if (!project.ui) project.ui = {};
    if (!project.ui.panels) project.ui.panels = {};
    if (!project.ui.panels.overlay) project.ui.panels.overlay = {};

    // 위치 저장
    project.ui.panels.overlay.position = {
      x: parseInt(modal.style.left) || 100,
      y: parseInt(modal.style.top) || 100
    };

    // 크기 저장
    project.ui.panels.overlay.size = {
      width: parseInt(modal.style.width) || 400,
      height: parseInt(modal.style.height) || 500
    };

    // 최소화 상태 저장
    const isMinimized = modal.classList.contains('minimized');
    project.ui.panels.overlay.collapsed = isMinimized;
    
    console.log(`Wplace Plus: 모달 상태 저장 - 프로젝트: ${project.name}, 최소화: ${isMinimized}`);

    this.saveProjects();
  }

  // 프로젝트 모달 생성
  createProjectModal(project) {
    const modal = document.createElement('div');
    modal.className = 'wplace_plus_project_modal';
    modal.dataset.projectId = project.id;
    modal.innerHTML = this.generateProjectModalHTML(project);
    
    // 모달을 body에 추가
    document.body.appendChild(modal);
    
    // 모달 컨트롤 설정
    this.setupModalControls(modal);
    
    return modal;
  }

  // 프로젝트 모달 HTML 생성
  generateProjectModalHTML(project) {
    return `
      <div class="wplace_plus_modal_header">
        <div class="wplace_plus_modal_title">
          <span class="wplace_plus_modal_icon">📁</span>
          <span class="wplace_plus_modal_name">${project.name}</span>
        </div>
        <div class="wplace_plus_modal_controls">
          <button class="wplace_plus_modal_btn wplace_plus_minimize_btn" title="최소화">−</button>
          <button class="wplace_plus_modal_btn wplace_plus_close_btn" title="닫기">×</button>
        </div>
      </div>
      <div class="wplace_plus_modal_content">
        <div class="wplace_plus_project_tabs">
          <button class="wplace_plus_tab_btn active" data-tab="overlay">🖼️ 오버레이</button>
          <button class="wplace_plus_tab_btn" data-tab="completed">✅ 완료 표시</button>
          <button class="wplace_plus_tab_btn" data-tab="filter">🎨 단색 필터</button>
        </div>
        <div class="wplace_plus_tab_content">
          <div class="wplace_plus_tab_panel active" data-panel="overlay">
            ${this.generateOverlayPanelHTML(project)}
          </div>
          <div class="wplace_plus_tab_panel" data-panel="completed">
            ${this.generateCompletedPixelsPanelHTML(project)}
          </div>
          <div class="wplace_plus_tab_panel" data-panel="filter">
            ${this.generateColorFilterPanelHTML(project)}
          </div>
        </div>
      </div>
      <div class="wplace_plus_modal_resize_handle"></div>
    `;
  }

  // 오버레이 패널 HTML 생성
  generateOverlayPanelHTML(project) {
    const data = project.data || {};
    const overlays = data.overlays || [];
    
    return `
      <div class="wplace_plus_panel_section">
        <!-- 이미지 업로드 섹션 -->
        <div class="wplace_plus_image_upload_section">
          <div class="flex items-center justify-center mb-4">
            <button class="btn btn-primary btn-lg shadow-lg w-48" id="upload-image-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" class="size-5">
                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T800-120H200Zm0-80h560v-560H200v560Zm80-80h400L520-400 360-240l-80-80v80Zm-80 80v-560 560Z"/>
              </svg>
              이미지 업로드
            </button>
          </div>
          
          <!-- 업로드 영역 (숨김) -->
          <div class="wplace_plus_file_upload_area hidden" id="file-upload-area">
            <div class="wplace_plus_file_upload_content">
              <div class="wplace_plus_file_upload_icon">📁</div>
              <div class="wplace_plus_file_upload_text">이미지를 드래그하거나 클릭하여 업로드</div>
              <div class="wplace_plus_file_upload_hint">PNG, JPG, GIF 지원</div>
            </div>
          </div>
          
          <!-- 이미지 미리보기 -->
          <div class="wplace_plus_image_preview" id="image-preview" style="display: none;">
            <div class="wplace_plus_image_preview_item">
              <label class="wplace_plus_image_preview_label">원본</label>
              <canvas class="wplace_plus_image_preview_canvas" id="original-canvas"></canvas>
            </div>
            <div class="wplace_plus_image_preview_item">
              <label class="wplace_plus_image_preview_label">처리됨</label>
              <canvas class="wplace_plus_image_preview_canvas" id="processed-canvas"></canvas>
            </div>
            <button class="btn btn-xs btn-ghost absolute top-2 right-2" id="remove-image-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" class="size-3">
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
              </svg>
            </button>
          </div>
          
          <!-- 색상 팔레트 (컴팩트) - 이미지 업로드 시에만 표시 -->
          <div id="color-palette-container" class="wplace_plus_color_palette_compact hidden">
            ${this.imageUploadManager.generateColorPaletteHTML()}
          </div>
        </div>
        
      </div>
    `;
  }

  // 완료 표시 패널 HTML 생성
  generateCompletedPixelsPanelHTML(project) {
    const completedPixels = project.data?.completedPixels || { enabled: false, settings: { highlightColor: '#00ff00', opacity: 0.5 } };
    const settings = completedPixels.settings || { highlightColor: '#00ff00', opacity: 0.5 };
    
    // 색상 값 검증 및 기본값 설정
    const highlightColor = settings.highlightColor && settings.highlightColor !== 'undefined' ? settings.highlightColor : '#00ff00';
    const opacity = typeof settings.opacity === 'number' ? settings.opacity : 0.5;
    
    return `
      <div class="wplace_plus_panel_section">
        <h4>완료 표시</h4>
        <div class="wplace_plus_toggle_group">
          <label class="wplace_plus_toggle">
            <input type="checkbox" ${completedPixels.enabled ? 'checked' : ''}>
            <span class="wplace_plus_toggle_slider"></span>
            <span class="wplace_plus_toggle_label">완성된 픽셀 표시</span>
          </label>
        </div>
        <div class="wplace_plus_color_picker_group">
          <label>하이라이트 색상</label>
          <div class="wplace_plus_color_picker">
            <input type="color" value="${highlightColor}" class="wplace_plus_color_input">
            <input type="text" value="${highlightColor}" class="wplace_plus_color_input">
          </div>
        </div>
        <div class="wplace_plus_slider_group">
          <label>투명도: <span class="wplace_plus_slider_value">${Math.round(opacity * 100)}%</span></label>
          <input type="range" min="0" max="1" step="0.1" value="${opacity}" class="wplace_plus_slider">
        </div>
      </div>
    `;
  }

  // 색상 필터 패널 HTML 생성
  generateColorFilterPanelHTML(project) {
    const colorFilter = project.data?.colorFilter || { enabled: false, settings: { mode: 'monochrome', color: '#000000', intensity: 0.5 } };
    const settings = colorFilter.settings || { mode: 'monochrome', color: '#000000', intensity: 0.5 };
    
    // 색상 값 검증 및 기본값 설정
    const filterColor = settings.color && settings.color !== 'undefined' ? settings.color : '#000000';
    const intensity = typeof settings.intensity === 'number' ? settings.intensity : 0.5;
    
    return `
      <div class="wplace_plus_panel_section">
        <h4>단색 필터</h4>
        <div class="wplace_plus_toggle_group">
          <label class="wplace_plus_toggle">
            <input type="checkbox" ${colorFilter.enabled ? 'checked' : ''}>
            <span class="wplace_plus_toggle_slider"></span>
            <span class="wplace_plus_toggle_label">단색 필터 활성화</span>
          </label>
        </div>
        <div class="wplace_plus_slider_group">
          <label>필터 강도: <span class="wplace_plus_slider_value">${Math.round(intensity * 100)}%</span></label>
          <input type="range" min="0" max="1" step="0.1" value="${intensity}" class="wplace_plus_slider">
        </div>
        <div class="wplace_plus_color_picker_group">
          <label>필터 색상</label>
          <div class="wplace_plus_color_picker">
            <input type="color" value="${filterColor}" class="wplace_plus_color_input">
            <input type="text" value="${filterColor}" class="wplace_plus_color_input">
          </div>
        </div>
      </div>
    `;
  }

  // 모달 컨트롤 설정
  setupModalControls(modal) {
    // 드래그 기능
    this.setupDrag(modal);
    
    // 리사이즈 기능
    this.setupResize(modal);
    
    // 모달 버튼 설정
    this.setupModalButtons(modal);
    
    // 이미지 업로드 컨트롤 설정
    this.setupImageUploadControls(modal);
    
    // 탭 설정
    this.setupTabs(modal);
    
    // 패널 컨트롤 설정
    const projectId = modal.dataset.projectId;
    const project = this.getProject(projectId);
    
    // 오버레이 패널 컨트롤
    this.setupOverlayControls(modal, project);
    
    // 완성된 픽셀 패널 컨트롤
    this.setupCompletedPixelsControls(modal, project);
    
    // 단색 필터 패널 컨트롤
    this.setupColorFilterControls(modal, project);
    
  }

  // 드래그 설정
  setupDrag(modal) {
    const header = modal.querySelector('.wplace_plus_modal_header');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', (e) => {
      // 컨트롤 버튼 클릭이면 드래그 무시
      if (e.target.closest('.wplace_plus_modal_controls')) return;
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(modal.style.left) || 100;
      startTop = parseInt(modal.style.top) || 100;
      
      // 텍스트 선택 방지
      e.preventDefault();
      e.stopPropagation();
      
      modal.style.userSelect = 'none';
      modal.style.webkitUserSelect = 'none';
      modal.style.mozUserSelect = 'none';
      modal.style.msUserSelect = 'none';
      
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', stopDrag);
    });

    const handleDrag = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      modal.style.left = (startLeft + deltaX) + 'px';
      modal.style.top = (startTop + deltaY) + 'px';
    };

    const stopDrag = () => {
      isDragging = false;
      
      // 텍스트 선택 복원
      modal.style.userSelect = '';
      modal.style.webkitUserSelect = '';
      modal.style.mozUserSelect = '';
      modal.style.msUserSelect = '';
      
      // 상태 저장
      const projectId = modal.dataset.projectId;
      if (projectId) {
        this.saveModalState(modal, projectId);
      }
      
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
    };
  }

  // 리사이즈 설정
  setupResize(modal) {
    const resizeHandle = modal.querySelector('.wplace_plus_modal_resize_handle');
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = parseInt(modal.style.width) || 400;
      startHeight = parseInt(modal.style.height) || 500;
      
      // 텍스트 선택 방지
      e.preventDefault();
      e.stopPropagation();
      
      modal.style.userSelect = 'none';
      modal.style.webkitUserSelect = 'none';
      modal.style.mozUserSelect = 'none';
      modal.style.msUserSelect = 'none';
      
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.mozUserSelect = 'none';
      document.body.style.msUserSelect = 'none';
      
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
    });

    const handleResize = (e) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newWidth = Math.max(300, startWidth + deltaX);
      const newHeight = Math.max(200, startHeight + deltaY);
      
      modal.style.width = newWidth + 'px';
      modal.style.height = newHeight + 'px';
    };

    const stopResize = () => {
      isResizing = false;
      
      // 텍스트 선택 복원
      modal.style.userSelect = '';
      modal.style.webkitUserSelect = '';
      modal.style.mozUserSelect = '';
      modal.style.msUserSelect = '';
      
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.mozUserSelect = '';
      document.body.style.msUserSelect = '';
      
      // 상태 저장
      const projectId = modal.dataset.projectId;
      if (projectId) {
        this.saveModalState(modal, projectId);
      }
      
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };
  }

  // 모달 버튼 설정
  setupModalButtons(modal) {
    const projectId = modal.dataset.projectId;
    
    // 최소화/최대화 함수
    const toggleMinimize = () => {
      modal.classList.toggle('minimized');
      
      // 최소화 상태에 따라 버튼 텍스트 변경
      const minimizeBtn = modal.querySelector('.wplace_plus_minimize_btn');
      if (minimizeBtn) {
        if (modal.classList.contains('minimized')) {
          minimizeBtn.textContent = '+';
          minimizeBtn.title = '최대화';
        } else {
          minimizeBtn.textContent = '−';
          minimizeBtn.title = '최소화';
        }
      }
      
      // 상태 저장
      console.log(`Wplace Plus: 모달 최소화 상태 변경 - minimized: ${modal.classList.contains('minimized')}`);
      this.saveModalState(modal, projectId);
    };
    
    // 최소화 버튼
    const minimizeBtn = modal.querySelector('.wplace_plus_minimize_btn');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMinimize();
      });
    }
    
    // 헤더 더블클릭으로 최소화/최대화
    const header = modal.querySelector('.wplace_plus_modal_header');
    if (header) {
      let clickTimeout = null;
      
      header.addEventListener('click', (e) => {
        // 컨트롤 버튼 클릭이면 무시
        if (e.target.closest('.wplace_plus_modal_controls')) return;
        
        if (clickTimeout) {
          // 더블클릭
          clearTimeout(clickTimeout);
          clickTimeout = null;
          e.preventDefault();
          e.stopPropagation();
          toggleMinimize();
        } else {
          // 첫 번째 클릭 - 300ms 대기
          clickTimeout = setTimeout(() => {
            clickTimeout = null;
          }, 300);
        }
      });
    }
    
    // 닫기 버튼
    const closeBtn = modal.querySelector('.wplace_plus_close_btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // 모달이 닫혔음을 표시
        const project = this.getProject(projectId);
        if (project && project.ui && project.ui.panels && project.ui.panels.overlay) {
          project.ui.panels.overlay.visible = false;
          this.saveProjects();
        }
        
        modal.remove();
        this.projectModals.delete(projectId);
        this.openModalIds.delete(projectId);
      });
    }
  }

  // 탭 설정
  setupTabs(modal) {
    const tabButtons = modal.querySelectorAll('.wplace_plus_tab_btn');
    const tabPanels = modal.querySelectorAll('.wplace_plus_tab_panel');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;

        // 모든 탭 버튼 비활성화
        tabButtons.forEach(btn => btn.classList.remove('active'));
        // 클릭된 탭 버튼 활성화
        button.classList.add('active');

        // 모든 탭 패널 숨기기
        tabPanels.forEach(panel => panel.classList.remove('active'));
        // 해당 탭 패널 표시
        const targetPanel = modal.querySelector(`[data-panel="${targetTab}"]`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }

  // 오버레이 컨트롤 설정
  setupOverlayControls(modal, project) {
    const uploadBtn = modal.querySelector('#upload-image-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        console.log('Wplace Plus: 이미지 업로드 버튼 클릭됨');
        // 여기에 이미지 업로드 로직을 추가할 수 있습니다
      });
    }
  }

  // 완성된 픽셀 컨트롤 설정
  setupCompletedPixelsControls(modal, project) {
    const toggle = modal.querySelector('[data-panel="completed"] input[type="checkbox"]');
    const colorInputs = modal.querySelectorAll('[data-panel="completed"] .wplace_plus_color_input');
    const slider = modal.querySelector('[data-panel="completed"] .wplace_plus_slider');

    // 데이터 초기화
    if (!project.data) project.data = {};
    if (!project.data.completedPixels) {
      project.data.completedPixels = { enabled: false, settings: { highlightColor: '#00ff00', opacity: 0.5 } };
    }
    
    // 설정 값 검증 및 기본값 설정
    if (!project.data.completedPixels.settings) {
      project.data.completedPixels.settings = { highlightColor: '#00ff00', opacity: 0.5 };
    }
    if (!project.data.completedPixels.settings.highlightColor || project.data.completedPixels.settings.highlightColor === 'undefined') {
      project.data.completedPixels.settings.highlightColor = '#00ff00';
    }
    if (typeof project.data.completedPixels.settings.opacity !== 'number') {
      project.data.completedPixels.settings.opacity = 0.5;
    }

    if (toggle) {
      toggle.addEventListener('change', (e) => {
        project.data.completedPixels.enabled = e.target.checked;
        this.saveProjects();
      });
    }

    colorInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const value = e.target.value;
        project.data.completedPixels.settings.highlightColor = value;
        
        // 다른 색상 입력도 동기화
        colorInputs.forEach(otherInput => {
          if (otherInput !== input) {
            otherInput.value = value;
          }
        });
        
        this.saveProjects();
      });
    });

    if (slider) {
      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        project.data.completedPixels.settings.opacity = value;
        
        // 슬라이더 값 표시 업데이트
        const valueDisplay = modal.querySelector('[data-panel="completed"] .wplace_plus_slider_value');
        if (valueDisplay) {
          valueDisplay.textContent = Math.round(value * 100) + '%';
        }
        
        this.saveProjects();
      });
    }
  }

  // 색상 필터 컨트롤 설정
  setupColorFilterControls(modal, project) {
    const toggle = modal.querySelector('[data-panel="filter"] input[type="checkbox"]');
    const colorInputs = modal.querySelectorAll('[data-panel="filter"] .wplace_plus_color_input');
    const slider = modal.querySelector('[data-panel="filter"] .wplace_plus_slider');

    // 데이터 초기화
    if (!project.data) project.data = {};
    if (!project.data.colorFilter) {
      project.data.colorFilter = { enabled: false, settings: { mode: 'monochrome', color: '#000000', intensity: 0.5 } };
    }
    
    // 설정 값 검증 및 기본값 설정
    if (!project.data.colorFilter.settings) {
      project.data.colorFilter.settings = { mode: 'monochrome', color: '#000000', intensity: 0.5 };
    }
    if (!project.data.colorFilter.settings.color || project.data.colorFilter.settings.color === 'undefined') {
      project.data.colorFilter.settings.color = '#000000';
    }
    if (typeof project.data.colorFilter.settings.intensity !== 'number') {
      project.data.colorFilter.settings.intensity = 0.5;
    }

    if (toggle) {
      toggle.addEventListener('change', (e) => {
        project.data.colorFilter.enabled = e.target.checked;
        this.saveProjects();
      });
    }

    colorInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const value = e.target.value;
        project.data.colorFilter.settings.color = value;
        
        // 다른 색상 입력도 동기화
        colorInputs.forEach(otherInput => {
          if (otherInput !== input) {
            otherInput.value = value;
          }
        });
        
        this.saveProjects();
      });
    });

    if (slider) {
      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        project.data.colorFilter.settings.intensity = value;
        
        // 슬라이더 값 표시 업데이트
        const valueDisplay = modal.querySelector('[data-panel="filter"] .wplace_plus_slider_value');
        if (valueDisplay) {
          valueDisplay.textContent = Math.round(value * 100) + '%';
        }
        
        this.saveProjects();
      });
    }
  }

  // 이미지 업로드 컨트롤 설정
  setupImageUploadControls(modal) {
    const uploadBtn = modal.querySelector('#upload-image-btn');
    const uploadArea = modal.querySelector('#file-upload-area');
    const imagePreview = modal.querySelector('#image-preview');
    const originalCanvas = modal.querySelector('#original-canvas');
    const processedCanvas = modal.querySelector('#processed-canvas');
    const colorPaletteContainer = modal.querySelector('#color-palette-container');
    const removeImageBtn = modal.querySelector('#remove-image-btn');

    console.log('이미지 업로드 컨트롤 설정 시작');
    console.log('uploadBtn:', uploadBtn);
    console.log('uploadArea:', uploadArea);
    console.log('imagePreview:', imagePreview);
    console.log('originalCanvas:', originalCanvas);
    console.log('processedCanvas:', processedCanvas);
    console.log('colorPaletteContainer:', colorPaletteContainer);

    if (!uploadBtn || !uploadArea || !imagePreview || !originalCanvas || !processedCanvas || !colorPaletteContainer) {
      console.log('필수 요소가 없어서 이미지 업로드 컨트롤 설정을 건너뜁니다');
      return;
    }

    // 이미 설정된 경우 중복 설정 방지
    if (uploadArea.dataset.eventsSetup === 'true') {
      return;
    }

    // 파일 입력 이벤트
    const handleFileChange = async (e) => {
      console.log('파일 변경 이벤트 발생');
      const file = e.target.files[0];
      console.log('선택된 파일:', file);
      if (!file) return;

      try {
        // 로딩 상태 표시
        uploadArea.innerHTML = '<div class="wplace_plus_image_loading">이미지 처리 중...</div>';

        // 이미지 업로드 및 처리
        const result = await this.imageUploadManager.handleImageUpload(file);
        
        // 원본 이미지 표시
        this.imageUploadManager.drawImageToCanvas(result.original, originalCanvas);
        
        // 처리된 이미지 표시
        this.imageUploadManager.drawImageToCanvas(result.processed, processedCanvas);
        
        // 미리보기 표시
        imagePreview.style.display = 'flex';
        
        // 업로드 버튼 숨기기
        uploadBtn.style.display = 'none';
        
        // 색상 팔레트 표시
        colorPaletteContainer.classList.remove('hidden');
        
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        uploadArea.innerHTML = `
          <div class="wplace_plus_image_error">이미지 업로드에 실패했습니다: ${error.message}</div>
          <div class="wplace_plus_file_upload_content">
            <div class="wplace_plus_file_upload_icon">📁</div>
            <div class="wplace_plus_file_upload_text">이미지를 드래그하거나 클릭하여 업로드</div>
            <div class="wplace_plus_file_upload_hint">PNG, JPG, GIF 지원</div>
          </div>
        `;
      }
    };

    // 드래그 앤 드롭 이벤트
    const handleDragOver = (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
    };

    const handleDrop = (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        // 파일 변경 이벤트 직접 호출
        const file = files[0];
        console.log('드롭된 파일:', file);
        handleFileChange({ target: { files: files } });
      }
    };

    // 업로드 버튼 클릭 이벤트
    const handleUploadClick = (e) => {
      console.log('업로드 버튼 클릭됨');
      e.preventDefault();
      e.stopPropagation();
      
      // 이미 파일 입력이 진행 중인 경우 중복 방지
      if (uploadBtn.dataset.uploading === 'true') {
        console.log('이미 업로드 진행 중입니다');
        return;
      }
      
      // 업로드 상태 표시
      uploadBtn.dataset.uploading = 'true';
      
      // 새로운 파일 입력 요소 생성
      const newFileInput = document.createElement('input');
      newFileInput.type = 'file';
      newFileInput.accept = 'image/*';
      newFileInput.style.display = 'none';
      
      // 파일 선택 이벤트 리스너
      newFileInput.addEventListener('change', (changeEvent) => {
        // 업로드 상태 해제
        uploadBtn.dataset.uploading = 'false';
        handleFileChange(changeEvent);
      });
      
      // 취소 시에도 상태 해제
      newFileInput.addEventListener('cancel', () => {
        uploadBtn.dataset.uploading = 'false';
      });
      
      // DOM에 추가하고 클릭
      document.body.appendChild(newFileInput);
      newFileInput.click();
      
      // 클릭 후 제거
      setTimeout(() => {
        if (document.body.contains(newFileInput)) {
          document.body.removeChild(newFileInput);
        }
        // 안전장치: 5초 후 상태 해제
        setTimeout(() => {
          uploadBtn.dataset.uploading = 'false';
        }, 5000);
      }, 100);
    };

    // 이미지 제거 버튼 클릭 이벤트
    const handleRemoveClick = (e) => {
      console.log('이미지 제거 버튼 클릭됨');
      e.preventDefault();
      e.stopPropagation();
      
      // 미리보기 숨기기
      imagePreview.style.display = 'none';
      
      // 업로드 버튼 다시 보이기
      uploadBtn.style.display = 'flex';
      
      // 색상 팔레트 숨기기
      colorPaletteContainer.classList.add('hidden');
      
      // 이미지 데이터 초기화
      this.imageUploadManager.originalImageData = null;
      this.imageUploadManager.processedImageData = null;
      
      // 프로젝트 데이터 저장
      this.imageUploadManager.saveProjectData();
    };

    // 기존 이벤트 리스너 제거 (중복 방지)
    uploadBtn.removeEventListener('click', handleUploadClick);
    uploadArea.removeEventListener('dragover', handleDragOver);
    uploadArea.removeEventListener('dragleave', handleDragLeave);
    uploadArea.removeEventListener('drop', handleDrop);
    if (removeImageBtn) {
      removeImageBtn.removeEventListener('click', handleRemoveClick);
    }

    // 이벤트 리스너 등록
    console.log('이벤트 리스너 등록 중...');
    uploadBtn.addEventListener('click', handleUploadClick);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    if (removeImageBtn) {
      removeImageBtn.addEventListener('click', handleRemoveClick);
    }

    // 이벤트 설정 완료 표시
    uploadArea.dataset.eventsSetup = 'true';
    console.log('이미지 업로드 컨트롤 설정 완료');

    // 색상 팔레트 이벤트 설정
    this.imageUploadManager.setupColorPaletteEvents(colorPaletteContainer);
    
    // 이미지 처리 완료 콜백 설정
    this.imageUploadManager.setOnImageProcessed((processedImageData) => {
      this.imageUploadManager.drawImageToCanvas(processedImageData, processedCanvas);
    });

    // 저장된 이미지 데이터 복원 (비동기)
    setTimeout(() => {
      this.restoreImageData(modal);
    }, 100);
  }

  // 저장된 이미지 데이터 복원
  async restoreImageData(modal) {
    if (!modal || !modal.dataset) return;
    
    const projectId = modal.dataset.projectId;
    if (!projectId) return;

    const imagePreview = modal.querySelector('#image-preview');
    const originalCanvas = modal.querySelector('#original-canvas');
    const processedCanvas = modal.querySelector('#processed-canvas');
    const colorPaletteContainer = modal.querySelector('#color-palette-container');
    const uploadBtn = modal.querySelector('#upload-image-btn');

    if (!imagePreview || !originalCanvas || !processedCanvas || !colorPaletteContainer || !uploadBtn) {
      console.log('Wplace Plus: 필요한 DOM 요소를 찾을 수 없습니다');
      return;
    }

    // ImageUploadManager에서 이미지 데이터 확인
    if (this.imageUploadManager && this.imageUploadManager.originalImageData && this.imageUploadManager.processedImageData) {
      try {
        // 원본 이미지 표시
        this.imageUploadManager.drawImageToCanvas(this.imageUploadManager.originalImageData, originalCanvas);
        
        // 처리된 이미지 표시
        this.imageUploadManager.drawImageToCanvas(this.imageUploadManager.processedImageData, processedCanvas);
        
        // 미리보기 표시
        imagePreview.style.display = 'flex';
        
        // 업로드 버튼 숨기기
        uploadBtn.style.display = 'none';
        
        // 색상 팔레트 표시
        colorPaletteContainer.classList.remove('hidden');
        
        console.log('Wplace Plus: 저장된 이미지 데이터 복원 완료');
      } catch (error) {
        console.error('Wplace Plus: 이미지 데이터 복원 실패:', error);
      }
    } else {
      console.log('Wplace Plus: 복원할 이미지 데이터가 없습니다');
      // 저장된 이미지 데이터가 없으면 색상 팔레트 숨기기
      if (colorPaletteContainer) {
        colorPaletteContainer.classList.add('hidden');
      }
    }
  }
}

// 전역 프로젝트 매니저 인스턴스
const projectManager = new ProjectManager();
