// 프로젝트 관리 클래스 (리팩토링됨)
class ProjectManager {
  constructor() {
    this.projects = []; // 프로젝트 목록 (메타데이터만)
    this.projectInstances = new Map(); // 프로젝트별 독립 인스턴스
    this.activeProjectId = null;
    this.projectModals = new Map();
    this.openModalIds = new Set();
    this.isInitialized = false;
    
    // 초기화
    this.init();
  }

  // 초기화
  async init() {
    try {
      console.log('Wplace Plus: ProjectManager 초기화 시작');
      await this.loadProjects();
      this.isInitialized = true;
      console.log('Wplace Plus: ProjectManager 초기화 완료');
    } catch (error) {
      console.error('Wplace Plus: ProjectManager 초기화 실패:', error);
      this.isInitialized = true; // 에러가 발생해도 초기화 완료로 처리
    }
  }

  // Chrome Storage에서 프로젝트 목록 로드 (비동기)
  async loadProjects() {
    try {
      this.projects = await storageManager.loadProjectList();
      console.log('Wplace Plus: 프로젝트 목록 로드 완료');
    } catch (error) {
      console.error('Wplace Plus: 프로젝트 목록 로드 실패:', error);
      this.projects = [];
    }
  }

  // 프로젝트 목록 저장 (비동기)
  async saveProjects() {
    try {
      await storageManager.saveProjectList(this.projects);
      console.log('Wplace Plus: 프로젝트 목록 저장 완료');
    } catch (error) {
      console.error('Wplace Plus: 프로젝트 목록 저장 실패:', error);
    }
  }

  // 새 프로젝트 추가
  async addProject(name) {
    try {
      const projectId = this.generateProjectId();
      const projectName = name || `프로젝트 ${this.projects.length + 1}`;
      
      // ProjectInstance 생성
      const projectInstance = new ProjectInstance(projectId);
      await projectInstance.load();
      
      // 기본 프로젝트 데이터 설정
      projectInstance.data = projectInstance.createDefaultProjectData();
      projectInstance.data.name = projectName;
      
      // 프로젝트 저장
      await projectInstance.save();
      
      // 프로젝트 목록에 메타데이터 추가
      const projectMeta = {
        id: projectId,
        name: projectName,
        description: '',
        version: '1.0.0',
        createdAt: projectInstance.data.createdAt,
        updatedAt: projectInstance.data.updatedAt
      };
      
      this.projects.push(projectMeta);
      await this.saveProjects();
      
      console.log('Wplace Plus: 새 프로젝트 추가 완료:', projectName);
      return projectMeta;
    } catch (error) {
      console.error('Wplace Plus: 새 프로젝트 추가 실패:', error);
      return null;
    }
  }

  // 프로젝트 ID 생성
  generateProjectId() {
    return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 프로젝트 메타데이터 가져오기
  getProjectMeta(id) {
    return this.projects.find(p => p.id === id);
  }

  // 프로젝트 인스턴스 가져오기 (비동기)
  async getProjectInstance(id) {
    try {
      // 이미 로드된 인스턴스가 있으면 반환
      if (this.projectInstances.has(id)) {
        return this.projectInstances.get(id);
      }

      // 새 인스턴스 생성 및 로드
      const projectInstance = new ProjectInstance(id);
      await projectInstance.load();
      
      // 인스턴스 저장
      this.projectInstances.set(id, projectInstance);
      
      return projectInstance;
    } catch (error) {
      console.error(`Wplace Plus: 프로젝트 인스턴스 가져오기 실패 - ${id}:`, error);
      return null;
    }
  }

  // 기존 호환성을 위한 getProject 메서드 (deprecated)
  getProject(id) {
    console.warn('Wplace Plus: getProject()는 deprecated입니다. getProjectInstance()를 사용하세요.');
    return this.getProjectMeta(id);
  }

  // 프로젝트 삭제
  async deleteProject(id) {
    try {
      const projectIndex = this.projects.findIndex(p => p.id === id);
      if (projectIndex === -1) {
        console.warn(`Wplace Plus: 삭제할 프로젝트를 찾을 수 없습니다 - ${id}`);
        return false;
      }

      // 모달이 열려있다면 닫기
      const modal = this.projectModals.get(id);
      if (modal) {
        modal.remove();
        this.projectModals.delete(id);
        this.openModalIds.delete(id);
      }

      // 프로젝트 인스턴스 정리
      const projectInstance = this.projectInstances.get(id);
      if (projectInstance) {
        await projectInstance.cleanup();
        this.projectInstances.delete(id);
      }

      // 프로젝트 데이터 삭제
      await storageManager.deleteProject(id);

      // 프로젝트 목록에서 제거
      this.projects.splice(projectIndex, 1);
      await this.saveProjects();

      console.log(`Wplace Plus: 프로젝트 삭제 완료 - ${id}`);
      return true;
    } catch (error) {
      console.error(`Wplace Plus: 프로젝트 삭제 실패 - ${id}:`, error);
      return false;
    }
  }

  // 프로젝트 열기 (모달 생성)
  async openProject(id) {
    try {
      // 초기화 완료 대기
      if (!this.isInitialized) {
        console.log('Wplace Plus: ProjectManager 초기화 대기 중...');
        await this.waitForInitialization();
      }

      // 프로젝트 메타데이터 확인
      const projectMeta = this.getProjectMeta(id);
      if (!projectMeta) {
        console.error(`Wplace Plus: 프로젝트를 찾을 수 없습니다 - ${id}`);
        return null;
      }

      // 프로젝트 인스턴스 가져오기
      const projectInstance = await this.getProjectInstance(id);
      if (!projectInstance) {
        console.error(`Wplace Plus: 프로젝트 인스턴스를 가져올 수 없습니다 - ${id}`);
        return null;
      }

      this.activeProjectId = id;
      
      // 이미 모달이 있다면 제거
      const existingModal = this.projectModals.get(id);
      if (existingModal) {
        existingModal.remove();
      }

      // 새 모달 생성
      const modal = this.createProjectModal(projectInstance);
      this.projectModals.set(id, modal);
      this.openModalIds.add(id);
      
      // 프로젝트 인스턴스에 모달 설정
      projectInstance.setModal(modal);
      
      // 저장된 UI 상태 복원
      this.restoreModalState(modal, projectInstance);
      
      // 저장된 중심점 좌표 복원
      this.restoreCenterPoint(modal, projectInstance);

      // 모달이 열렸음을 표시
      if (!projectInstance.data.ui) projectInstance.data.ui = {};
      if (!projectInstance.data.ui.panels) projectInstance.data.ui.panels = {};
      if (!projectInstance.data.ui.panels.overlay) projectInstance.data.ui.panels.overlay = {};
      projectInstance.data.ui.panels.overlay.visible = true;
      await projectInstance.save();
      
      console.log(`Wplace Plus: 프로젝트 열기 완료 - ${projectMeta.name}`);
      return modal;
    } catch (error) {
      console.error(`Wplace Plus: 프로젝트 열기 실패 - ${id}:`, error);
      return null;
    }
  }

  // 초기화 완료 대기
  async waitForInitialization() {
    const maxWaitTime = 5000; // 5초 최대 대기
    const checkInterval = 100; // 100ms마다 확인
    let waitedTime = 0;

    while (!this.isInitialized && waitedTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitedTime += checkInterval;
    }

    if (!this.isInitialized) {
      console.warn('Wplace Plus: ProjectManager 초기화 대기 시간 초과');
      this.isInitialized = true; // 강제로 초기화 완료로 처리
    }
  }

  // 모달 상태 복원
  restoreModalState(modal, projectInstance) {
    const ui = projectInstance.data?.ui || {};
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
      console.log(`Wplace Plus: 모달 최소화 상태 복원 - 프로젝트: ${projectInstance.data?.name || 'Unknown'}`);
      modal.classList.add('minimized');
      const minimizeBtn = modal.querySelector('.wplace_plus_minimize_btn');
      if (minimizeBtn) {
        minimizeBtn.textContent = '+';
        minimizeBtn.title = '최대화';
      }
    }
  }

  // 저장된 중심점 좌표 복원
  restoreCenterPoint(modal, projectInstance) {
      const xInput = modal.querySelector('#centerpoint-x');
      const yInput = modal.querySelector('#centerpoint-y');
      
      if (xInput && yInput) {
          const centerPoint = projectInstance.positionCapture.currentCoordinates;
          if (centerPoint) {
              xInput.value = centerPoint.x || 0;
              yInput.value = centerPoint.y || 0;
          }
      }
  }

  // 모달 상태 저장
  async saveModalState(modal, projectId) {
    try {
      const projectInstance = this.projectInstances.get(projectId);
      if (!projectInstance) {
        console.warn(`Wplace Plus: 프로젝트 인스턴스를 찾을 수 없습니다 - ${projectId}`);
        return;
      }

      if (!projectInstance.data.ui) projectInstance.data.ui = {};
      if (!projectInstance.data.ui.panels) projectInstance.data.ui.panels = {};
      if (!projectInstance.data.ui.panels.overlay) projectInstance.data.ui.panels.overlay = {};

      // 위치 저장
      projectInstance.data.ui.panels.overlay.position = {
        x: parseInt(modal.style.left) || 100,
        y: parseInt(modal.style.top) || 100
      };

      // 크기 저장
      projectInstance.data.ui.panels.overlay.size = {
        width: parseInt(modal.style.width) || 400,
        height: parseInt(modal.style.height) || 500
      };

      // 최소화 상태 저장
      const isMinimized = modal.classList.contains('minimized');
      projectInstance.data.ui.panels.overlay.collapsed = isMinimized;
      
      console.log(`Wplace Plus: 모달 상태 저장 - 프로젝트: ${projectInstance.data?.name || 'Unknown'}, 최소화: ${isMinimized}`);

      await projectInstance.save();
    } catch (error) {
      console.error(`Wplace Plus: 모달 상태 저장 실패 - ${projectId}:`, error);
    }
  }

  // 프로젝트 모달 생성
  createProjectModal(projectInstance) {
    const modal = document.createElement('div');
    modal.className = 'wplace_plus_project_modal';
    modal.dataset.projectId = projectInstance.projectId;
    
    // 모달을 보이지 않게 추가하여 깜박임 방지
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';

    modal.innerHTML = this.generateProjectModalHTML(projectInstance);
    
    // 모달을 body에 추가
    document.body.appendChild(modal);
    
    // 모달 컨트롤 설정
    this.setupModalControls(modal, projectInstance);
    
    // 다른 스크립트에게 모달이 준비되었음을 알림
    const event = new CustomEvent('wplace_plus:modal_ready', { detail: { modal, project: projectInstance.data } });
    document.dispatchEvent(event);

    // 모달을 부드럽게 표시
    setTimeout(() => {
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
    }, 50); // 약간의 지연 후 표시

    return modal;
  }

  // 프로젝트 모달 HTML 생성
  generateProjectModalHTML(projectInstance) {
    const project = projectInstance.data;
    return `
      <div class="wplace_plus_modal_header">
        <div class="wplace_plus_modal_title">
          <span class="wplace_plus_modal_icon">📁</span>
          <span class="wplace_plus_modal_name">${project?.name || 'Unknown Project'}</span>
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
            ${this.generateOverlayPanelHTML(projectInstance)}
          </div>
          <div class="wplace_plus_tab_panel" data-panel="completed">
            ${this.generateCompletedPixelsPanelHTML(projectInstance)}
          </div>
          <div class="wplace_plus_tab_panel" data-panel="filter">
            ${this.generateColorFilterPanelHTML(projectInstance)}
          </div>
        </div>
      </div>
      <div class="wplace_plus_modal_resize_handle"></div>
    `;
  }

  // 오버레이 패널 HTML 생성
  generateOverlayPanelHTML(projectInstance) {
    const data = projectInstance.data?.data || {};
    const overlays = data.overlays || [];
    const hasImage = projectInstance.imageManager?.originalImageData || (overlays.length > 0 && overlays[0].originalImage);
    
    return `
      <!-- 이미지 업로드 섹션 -->
      <div class="wplace_plus_panel_section ${hasImage ? 'hidden' : ''}" id="image-upload-section">
        <div class="flex items-center justify-center mb-4">
          <button class="btn btn-primary btn-lg shadow-lg w-48" id="upload-image-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" class="size-5">
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T800-120H200Zm0-80h560v-560H200v560Zm80-80h400L520-400 360-240l-80-80v80Zm-80 80v-560 560Z"/>
            </svg>
            이미지 업로드
          </button>
        </div>
      </div>
      
      <!-- 중심점 설정 섹션 -->
      <div class="wplace_plus_panel_section" id="centerpoint-section">
        <h4 class="text-sm font-semibold mb-3">중심점 설정</h4>
        
          <!-- 위치 캡쳐 및 좌표 설정 -->
          <div class="wplace_plus_coordinate_section">
          <div class="wplace_plus_coordinate_layout">
            <!-- 왼쪽: 위치 캡쳐 영역 -->
            <div class="wplace_plus_capture_area">
              <div class="wplace_plus_capture_label">위치 캡쳐</div>
              <div class="wplace_plus_toggle_group">
                <label class="wplace_plus_toggle">
                  <input type="checkbox" id="position-capture-toggle">
                  <span class="wplace_plus_toggle_slider"></span>
                </label>
                <span class="wplace_plus_toggle_label">실시간 위치 캡쳐</span>
              </div>
            </div>
            
            <!-- 오른쪽: 좌표 컨트롤 영역 -->
            <div class="wplace_plus_coordinate_area">
              <!-- X 좌표 -->
              <div class="wplace_plus_coordinate_controls">
                <div class="flex items-center gap-1">
                  <span class="text-xs text-base-content/70">X:</span>
                  <button class="btn btn-xs btn-circle" id="x-minus-1" title="-1">-</button>
                  <input type="number" id="centerpoint-x" class="input input-xs w-12 text-center" value="0" min="0">
                  <button class="btn btn-xs btn-circle" id="x-plus-1" title="+1">+</button>
                </div>
              </div>
              
              <!-- Y 좌표 -->
              <div class="wplace_plus_coordinate_controls">
                <div class="flex items-center gap-1">
                  <span class="text-xs text-base-content/70">Y:</span>
                  <button class="btn btn-xs btn-circle" id="y-minus-1" title="-1">-</button>
                  <input type="number" id="centerpoint-y" class="input input-xs w-12 text-center" value="0" min="0">
                  <button class="btn btn-xs btn-circle" id="y-plus-1" title="+1">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 9방향 앵커 선택 -->
        <div class="wplace_plus_anchor_selector">
          <div class="text-xs font-medium">앵커 위치</div>
          <div class="wplace_plus_anchor_grid">
            <button class="wplace_plus_anchor_btn" data-anchor="top-left" title="왼쪽 상단">
              <div class="wplace_plus_anchor_icon">┌</div>
            </button>
            <button class="wplace_plus_anchor_btn" data-anchor="top-center" title="가운데 상단">
              <div class="wplace_plus_anchor_icon">┬</div>
            </button>
            <button class="wplace_plus_anchor_btn" data-anchor="top-right" title="오른쪽 상단">
              <div class="wplace_plus_anchor_icon">┐</div>
            </button>
            <button class="wplace_plus_anchor_btn" data-anchor="middle-left" title="왼쪽 가운데">
              <div class="wplace_plus_anchor_icon">├</div>
            </button>
            <button class="wplace_plus_anchor_btn active" data-anchor="center" title="중앙">
              <div class="wplace_plus_anchor_icon">┼</div>
            </button>
            <button class="wplace_plus_anchor_btn" data-anchor="middle-right" title="오른쪽 가운데">
              <div class="wplace_plus_anchor_icon">┤</div>
            </button>
            <button class="wplace_plus_anchor_btn" data-anchor="bottom-left" title="왼쪽 하단">
              <div class="wplace_plus_anchor_icon">└</div>
            </button>
            <button class="wplace_plus_anchor_btn" data-anchor="bottom-center" title="가운데 하단">
              <div class="wplace_plus_anchor_icon">┴</div>
            </button>
            <button class="wplace_plus_anchor_btn" data-anchor="bottom-right" title="오른쪽 하단">
              <div class="wplace_plus_anchor_icon">┘</div>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 이미지 미리보기 섹션 - 이미지 업로드 시에만 표시 -->
      <div class="wplace_plus_panel_section ${hasImage ? '' : 'hidden'}" id="image-preview-section">
        <div class="flex items-center justify-between mb-3">
          <h4>이미지 미리보기</h4>
          <button class="btn btn-xs btn-ghost" id="remove-image-btn" title="이미지 제거">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" class="size-3">
              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
            </svg>
          </button>
        </div>
        
        <div class="wplace_plus_image_preview" id="image-preview">
          <div class="wplace_plus_image_preview_item">
            <label class="wplace_plus_image_preview_label">원본</label>
            <canvas class="wplace_plus_image_preview_canvas" id="original-canvas"></canvas>
          </div>
          <div class="wplace_plus_image_preview_item">
            <label class="wplace_plus_image_preview_label">처리됨</label>
            <canvas class="wplace_plus_image_preview_canvas" id="processed-canvas"></canvas>
          </div>
        </div>
        
        <!-- 색상 팔레트 -->
        <div class="mt-4">
          ${this.generateColorPaletteHTML(projectInstance)}
        </div>
      </div>
    `;
  }

  // 색상 팔레트 HTML 생성
  generateColorPaletteHTML(projectInstance) {
    // 색상 팔레트가 로드되지 않은 경우 빈 HTML 반환
    if (typeof WPLACE_FREE === 'undefined' || typeof WPLACE_PAID === 'undefined') {
      return '<div class="text-xs text-base-content/60">색상 팔레트를 로드하는 중...</div>';
    }

    const selectedFreeColors = projectInstance.imageManager?.selectedFreeColors || new Set();
    const selectedPaidColors = projectInstance.imageManager?.selectedPaidColors || new Set();

    return `
      <div class="wplace_plus_color_palette_section">
        <!-- 헤더 섹션 -->
        <div class="wplace_plus_palette_header">
          <h5 class="wplace_plus_palette_title">색상 팔레트</h5>
          <div class="wplace_plus_toggle_buttons">
            <button class="btn btn-xs btn-ghost" id="toggle-all-free">
              무료 전체
            </button>
            <button class="btn btn-xs btn-ghost" id="toggle-all-paid">
              유료 전체
            </button>
          </div>
        </div>
        
        <!-- 색상 그리드 섹션 -->
        <div class="wplace_plus_color_sections">
          <!-- 무료 색상 섹션 -->
          <div class="wplace_plus_color_section">
            <div class="wplace_plus_section_header">
              <span class="wplace_plus_section_title">무료 색상</span>
              <span class="wplace_plus_color_count" id="free-color-count">${selectedFreeColors.size}/${WPLACE_FREE.length}</span>
            </div>
            <div class="wplace_plus_color_grid_compact" id="free-color-grid">
              ${this.generateColorGridHTML(WPLACE_FREE, selectedFreeColors, 'free')}
            </div>
          </div>
          
          <!-- 유료 색상 섹션 -->
          <div class="wplace_plus_color_section">
            <div class="wplace_plus_section_header">
              <span class="wplace_plus_section_title">유료 색상</span>
              <span class="wplace_plus_color_count" id="paid-color-count">${selectedPaidColors.size}/${WPLACE_PAID.length}</span>
            </div>
            <div class="wplace_plus_color_grid_compact" id="paid-color-grid">
              ${this.generateColorGridHTML(WPLACE_PAID, selectedPaidColors, 'paid')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 완료 표시 패널 HTML 생성
  generateCompletedPixelsPanelHTML(projectInstance) {
    const completedPixels = projectInstance.data?.data?.completedPixels || { enabled: false, settings: { highlightColor: '#00ff00', opacity: 0.5 } };
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
  generateColorFilterPanelHTML(projectInstance) {
    const colorFilter = projectInstance.data?.data?.colorFilter || { enabled: false, settings: { mode: 'monochrome', color: '#000000', intensity: 0.5 } };
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
  setupModalControls(modal, projectInstance) {
    // 드래그 기능
    this.setupDrag(modal);
    
    // 리사이즈 기능
    this.setupResize(modal);
    
    // 모달 버튼 설정
    this.setupModalButtons(modal);
    
    // 이미지 업로드 컨트롤 설정
    this.setupImageUploadControls(modal, projectInstance);
    
    // 탭 설정
    this.setupTabs(modal);
    
    // 패널 컨트롤 설정
    const projectId = modal.dataset.projectId;
    
    // 오버레이 패널 컨트롤
    this.setupOverlayControls(modal, projectInstance);
    
    // 완성된 픽셀 패널 컨트롤
    this.setupCompletedPixelsControls(modal, projectInstance);
    
    // 단색 필터 패널 컨트롤
    this.setupColorFilterControls(modal, projectInstance);
    
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
      closeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        const projectInstance = await this.getProjectInstance(projectId);
        if (projectInstance && projectInstance.data.ui?.panels?.overlay) {
            projectInstance.data.ui.panels.overlay.visible = false;
            await projectInstance.save();
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
  setupOverlayControls(modal, projectInstance) {
    const uploadBtn = modal.querySelector('#upload-image-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        console.log('Wplace Plus: 이미지 업로드 버튼 클릭됨');
        // 여기에 이미지 업로드 로직을 추가할 수 있습니다
      });
    }
  }

  // 완성된 픽셀 컨트롤 설정
  setupCompletedPixelsControls(modal, projectInstance) {
    const toggle = modal.querySelector('[data-panel="completed"] input[type="checkbox"]');
    const colorInputs = modal.querySelectorAll('[data-panel="completed"] .wplace_plus_color_input');
    const slider = modal.querySelector('[data-panel="completed"] .wplace_plus_slider');

    // 데이터 초기화
    if (!projectInstance.data.data) projectInstance.data.data = {};
    if (!projectInstance.data.data.completedPixels) {
      projectInstance.data.data.completedPixels = { enabled: false, settings: { highlightColor: '#00ff00', opacity: 0.5 } };
    }
    
    // 설정 값 검증 및 기본값 설정
    if (!projectInstance.data.data.completedPixels.settings) {
      projectInstance.data.data.completedPixels.settings = { highlightColor: '#00ff00', opacity: 0.5 };
    }
    if (!projectInstance.data.data.completedPixels.settings.highlightColor || projectInstance.data.data.completedPixels.settings.highlightColor === 'undefined') {
      projectInstance.data.data.completedPixels.settings.highlightColor = '#00ff00';
    }
    if (typeof projectInstance.data.data.completedPixels.settings.opacity !== 'number') {
      projectInstance.data.data.completedPixels.settings.opacity = 0.5;
    }

    if (toggle) {
      toggle.addEventListener('change', (e) => {
        projectInstance.data.data.completedPixels.enabled = e.target.checked;
        projectInstance.save();
      });
    }

    colorInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const value = e.target.value;
        projectInstance.data.data.completedPixels.settings.highlightColor = value;
        
        // 다른 색상 입력도 동기화
        colorInputs.forEach(otherInput => {
          if (otherInput !== input) {
            otherInput.value = value;
          }
        });
        
        projectInstance.save();
      });
    });

    if (slider) {
      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        projectInstance.data.data.completedPixels.settings.opacity = value;
        
        // 슬라이더 값 표시 업데이트
        const valueDisplay = modal.querySelector('[data-panel="completed"] .wplace_plus_slider_value');
        if (valueDisplay) {
          valueDisplay.textContent = Math.round(value * 100) + '%';
        }
        
        projectInstance.save();
      });
    }
  }

  // 색상 필터 컨트롤 설정
  setupColorFilterControls(modal, projectInstance) {
    const toggle = modal.querySelector('[data-panel="filter"] input[type="checkbox"]');
    const colorInputs = modal.querySelectorAll('[data-panel="filter"] .wplace_plus_color_input');
    const slider = modal.querySelector('[data-panel="filter"] .wplace_plus_slider');

    // 데이터 초기화
    if (!projectInstance.data.data) projectInstance.data.data = {};
    if (!projectInstance.data.data.colorFilter) {
      projectInstance.data.data.colorFilter = { enabled: false, settings: { mode: 'monochrome', color: '#000000', intensity: 0.5 } };
    }
    
    // 설정 값 검증 및 기본값 설정
    if (!projectInstance.data.data.colorFilter.settings) {
      projectInstance.data.data.colorFilter.settings = { mode: 'monochrome', color: '#000000', intensity: 0.5 };
    }
    if (!projectInstance.data.data.colorFilter.settings.color || projectInstance.data.data.colorFilter.settings.color === 'undefined') {
      projectInstance.data.data.colorFilter.settings.color = '#000000';
    }
    if (typeof projectInstance.data.data.colorFilter.settings.intensity !== 'number') {
      projectInstance.data.data.colorFilter.settings.intensity = 0.5;
    }

    if (toggle) {
      toggle.addEventListener('change', (e) => {
        projectInstance.data.data.colorFilter.enabled = e.target.checked;
        projectInstance.save();
      });
    }

    colorInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const value = e.target.value;
        projectInstance.data.data.colorFilter.settings.color = value;
        
        // 다른 색상 입력도 동기화
        colorInputs.forEach(otherInput => {
          if (otherInput !== input) {
            otherInput.value = value;
          }
        });
        
        projectInstance.save();
      });
    });

    if (slider) {
      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        projectInstance.data.data.colorFilter.settings.intensity = value;
        
        // 슬라이더 값 표시 업데이트
        const valueDisplay = modal.querySelector('[data-panel="filter"] .wplace_plus_slider_value');
        if (valueDisplay) {
          valueDisplay.textContent = Math.round(value * 100) + '%';
        }
        
        projectInstance.save();
      });
    }
  }

  // 이미지 업로드 컨트롤 설정
  setupImageUploadControls(modal, projectInstance) {
    const uploadBtn = modal.querySelector('#upload-image-btn');
    const uploadSection = modal.querySelector('#image-upload-section');
    const imagePreviewSection = modal.querySelector('#image-preview-section');
    const imagePreview = modal.querySelector('#image-preview');
    const originalCanvas = modal.querySelector('#original-canvas');
    const processedCanvas = modal.querySelector('#processed-canvas');
    const removeImageBtn = modal.querySelector('#remove-image-btn');

    console.log('이미지 업로드 컨트롤 설정 시작');
    console.log('uploadBtn:', uploadBtn);
    console.log('imagePreviewSection:', imagePreviewSection);
    console.log('imagePreview:', imagePreview);
    console.log('originalCanvas:', originalCanvas);
    console.log('processedCanvas:', processedCanvas);

    if (!uploadBtn || !uploadSection || !imagePreviewSection || !imagePreview || !originalCanvas || !processedCanvas) {
      console.log('필수 요소가 없어서 이미지 업로드 컨트롤 설정을 건너뜁니다');
      return;
    }

    // 이미 설정된 경우 중복 설정 방지
    if (uploadBtn.dataset.eventsSetup === 'true') {
      return;
    }

    // 파일 입력 이벤트
    const handleFileChange = async (e) => {
      console.log('파일 변경 이벤트 발생');
      const file = e.target.files[0];
      console.log('선택된 파일:', file);
      if (!file) return;

      try {
        // 이미지 파일을 ImageData로 변환
        const imageData = await this.fileToImageData(file);
        
        // ProjectInstance에 이미지 데이터 저장
        projectInstance.setImageData(imageData, imageData); // 원본과 처리된 이미지를 동일하게 설정
        
        // 원본 이미지 표시
        this.drawImageToCanvas(imageData, originalCanvas);
        
        // 처리된 이미지 표시 (색상 팔레트 적용)
        const processedImageData = this.processImageWithPalette(imageData, projectInstance);
        projectInstance.imageManager.processedImageData = processedImageData;
        
        // 캔버스 업데이트
        const processedCanvas = modal.querySelector('#processed-canvas');
        if (processedCanvas) {
          this.drawImageToCanvas(processedImageData, processedCanvas);
        }
        
        // 이미지 미리보기 섹션 표시
        imagePreviewSection.classList.remove('hidden');
        
        // 업로드 섹션 전체 숨기기
        uploadSection.classList.add('hidden');
        
        console.log('Wplace Plus: 이미지 업로드 완료 - ProjectInstance에 저장됨');
        
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        alert(`이미지 업로드에 실패했습니다: ${error.message}`);
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
      
      // 이미지 미리보기 섹션 숨기기
      imagePreviewSection.classList.add('hidden');
      
      // 업로드 섹션 전체 다시 보이기
      uploadSection.classList.remove('hidden');
      
      // ProjectInstance에서 이미지 데이터 제거
      projectInstance.setImageData(null, null);
      
      console.log('Wplace Plus: 이미지 제거 완료 - ProjectInstance에서 삭제됨');
    };

    // 기존 이벤트 리스너 제거 (중복 방지)
    uploadBtn.removeEventListener('click', handleUploadClick);
    if (removeImageBtn) {
      removeImageBtn.removeEventListener('click', handleRemoveClick);
    }

    // 이벤트 리스너 등록
    console.log('이벤트 리스너 등록 중...');
    uploadBtn.addEventListener('click', handleUploadClick);
    if (removeImageBtn) {
      removeImageBtn.addEventListener('click', handleRemoveClick);
    }

    // 이벤트 설정 완료 표시
    uploadBtn.dataset.eventsSetup = 'true';
    console.log('이미지 업로드 컨트롤 설정 완료');

    // 색상 팔레트 이벤트 설정
    this.setupColorPaletteEvents(imagePreviewSection, projectInstance);
    
    // 위치 캡쳐 토글 이벤트 리스너 설정
    this.setupPositionCaptureListeners(modal, projectInstance);

    // 저장된 이미지 데이터 복원 (비동기)
    setTimeout(() => {
      this.restoreImageData(modal, projectInstance);
    }, 100);
  }

  // 파일을 ImageData로 변환
  async fileToImageData(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // ImageData를 Canvas에 그리기
  drawImageToCanvas(imageData, canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);
  }

  // 색상 팔레트로 이미지 처리
  processImageWithPalette(imageData, projectInstance) {
    const { data, width, height } = imageData;
    const processedData = new Uint8ClampedArray(data);
    
    // 선택된 색상들 가져오기
    const selectedFreeColors = projectInstance.imageManager?.selectedFreeColors || new Set();
    const selectedPaidColors = projectInstance.imageManager?.selectedPaidColors || new Set();
    
    const availableColors = [
      ...Array.from(selectedFreeColors).map(colorKeyToRgb),
      ...Array.from(selectedPaidColors).map(colorKeyToRgb)
    ];

    // 선택된 색상이 없으면 원본 이미지를 그대로 반환
    if (availableColors.length === 0) {
      return new ImageData(data, width, height);
    }

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a === 0) continue; // 투명 픽셀은 건드리지 않음

      // 가장 가까운 색상 찾기
      const closestColor = this.findClosestColor(r, g, b, availableColors);
      
      processedData[i] = closestColor[0];     // R
      processedData[i + 1] = closestColor[1]; // G
      processedData[i + 2] = closestColor[2]; // B
      // A는 그대로 유지
    }

    return new ImageData(processedData, width, height);
  }

  // 가장 가까운 색상 찾기
  findClosestColor(r, g, b, palette) {
    if (!palette || palette.length === 0) {
      return [r, g, b];
    }

    let minDistance = Infinity;
    let closestColor = palette[0];

    for (const [pr, pg, pb] of palette) {
      const distance = Math.sqrt(
        Math.pow(r - pr, 2) + Math.pow(g - pg, 2) + Math.pow(b - pb, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = [pr, pg, pb];
      }
    }

    return closestColor;
  }

  // 색상 팔레트 이벤트 설정
  setupColorPaletteEvents(container, projectInstance) {
    if (!container) return;

    // 이미 설정된 경우 중복 설정 방지
    if (container.dataset.eventsSetup === 'true') {
      return;
    }

    // 개별 색상 클릭 이벤트
    container.addEventListener('click', (e) => {
      const colorCell = e.target.closest('.wplace_plus_color_cell_compact');
      if (!colorCell) return;

      const colorKey = colorCell.dataset.colorKey;
      const type = colorCell.dataset.type;
      
      if (!colorKey || !type) return;
      
      if (type === 'free') {
        if (projectInstance.imageManager.selectedFreeColors.has(colorKey)) {
          projectInstance.imageManager.selectedFreeColors.delete(colorKey);
        } else {
          projectInstance.imageManager.selectedFreeColors.add(colorKey);
        }
      } else if (type === 'paid') {
        if (projectInstance.imageManager.selectedPaidColors.has(colorKey)) {
          projectInstance.imageManager.selectedPaidColors.delete(colorKey);
        } else {
          projectInstance.imageManager.selectedPaidColors.add(colorKey);
        }
      }

      // UI 업데이트
      this.updateColorPaletteUI(container, projectInstance);
      
      // 이미지 다시 처리
      if (projectInstance.imageManager.originalImageData) {
        const processedImageData = this.processImageWithPalette(projectInstance.imageManager.originalImageData, projectInstance);
        projectInstance.imageManager.processedImageData = processedImageData;
        
        // 캔버스 업데이트
        const processedCanvas = container.querySelector('#processed-canvas');
        if (processedCanvas) {
          this.drawImageToCanvas(processedImageData, processedCanvas);
        }
      }
      
      // 프로젝트 데이터 저장
      projectInstance.save();
    });

    // 이벤트 설정 완료 표시
    container.dataset.eventsSetup = 'true';
  }

  // 색상 팔레트 UI 업데이트
  updateColorPaletteUI(container, projectInstance) {
    if (!container) return;

    // 무료 색상 그리드 업데이트
    const freeGrid = container.querySelector('#free-color-grid');
    if (freeGrid && typeof WPLACE_FREE !== 'undefined') {
      freeGrid.innerHTML = this.generateColorGridHTML(WPLACE_FREE, projectInstance.imageManager.selectedFreeColors, 'free');
    }

    // 유료 색상 그리드 업데이트
    const paidGrid = container.querySelector('#paid-color-grid');
    if (paidGrid && typeof WPLACE_PAID !== 'undefined') {
      paidGrid.innerHTML = this.generateColorGridHTML(WPLACE_PAID, projectInstance.imageManager.selectedPaidColors, 'paid');
    }
  }

  // 색상 그리드 HTML 생성
  generateColorGridHTML(colors, selectedColors, type) {
    if (!colors || !Array.isArray(colors)) {
      return '';
    }

    return colors.map((color, index) => {
      if (!Array.isArray(color) || color.length < 3) {
        return '';
      }

      const [r, g, b] = color;
      const colorKey = `${r},${g},${b}`;
      const isSelected = selectedColors && selectedColors.has(colorKey);
      const colorName = (typeof WPLACE_NAMES !== 'undefined' && WPLACE_NAMES[colorKey]) || colorKey;
      const hexColor = (typeof rgbToHex !== 'undefined') ? rgbToHex(r, g, b) : `rgb(${r},${g},${b})`;
      
      return `
        <button class="wplace_plus_color_cell_compact ${isSelected ? 'selected' : ''}" 
                data-color-key="${colorKey}" 
                data-type="${type}"
                style="background-color: ${hexColor}"
                title="${colorName}">
          ${isSelected ? `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-2 text-white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          ` : ''}
        </button>
      `;
    }).join('');
  }

  // 위치 캡쳐 이벤트 리스너 설정
  setupPositionCaptureListeners(modal, projectInstance) {
    const positionCaptureToggle = modal.querySelector('#position-capture-toggle');
    const xInput = modal.querySelector('#centerpoint-x');
    const yInput = modal.querySelector('#centerpoint-y');
    
    if (positionCaptureToggle) {
      positionCaptureToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        
        // ProjectInstance에 위치 캡처 상태 저장
        projectInstance.positionCapture.isEnabled = isEnabled;
        
        // 위치 캡쳐 상태 변경
        if (typeof window !== 'undefined' && window.positionCapture) {
          window.positionCapture.toggleCapture(isEnabled);
        } else if (typeof positionCapture !== 'undefined') {
          positionCapture.toggleCapture(isEnabled);
        }
        console.log('Wplace Plus: 위치 캡쳐', isEnabled ? '활성화됨' : '비활성화됨');
      });
    }

    // X, Y 좌표 입력 이벤트 리스너
    if (xInput) {
      xInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value) || 0;
        console.log('Wplace Plus: X 좌표 변경:', value);
        
        // ProjectInstance에 좌표 저장
        const currentCoords = projectInstance.positionCapture.currentCoordinates || { x: 0, y: 0 };
        projectInstance.setCenterPoint({ x: value, y: currentCoords.y });
      });
    }

    if (yInput) {
      yInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value) || 0;
        console.log('Wplace Plus: Y 좌표 변경:', value);
        
        // ProjectInstance에 좌표 저장
        const currentCoords = projectInstance.positionCapture.currentCoordinates || { x: 0, y: 0 };
        projectInstance.setCenterPoint({ x: currentCoords.x, y: value });
      });
    }

    // 좌표 증감 버튼 이벤트 리스너
    const xMinusBtn = modal.querySelector('#x-minus-1');
    const xPlusBtn = modal.querySelector('#x-plus-1');
    const yMinusBtn = modal.querySelector('#y-minus-1');
    const yPlusBtn = modal.querySelector('#y-plus-1');

    if (xMinusBtn && xInput) {
      xMinusBtn.addEventListener('click', () => {
        const currentValue = parseInt(xInput.value) || 0;
        xInput.value = Math.max(0, currentValue - 1);
        xInput.dispatchEvent(new Event('input'));
      });
    }

    if (xPlusBtn && xInput) {
      xPlusBtn.addEventListener('click', () => {
        const currentValue = parseInt(xInput.value) || 0;
        xInput.value = currentValue + 1;
        xInput.dispatchEvent(new Event('input'));
      });
    }

    if (yMinusBtn && yInput) {
      yMinusBtn.addEventListener('click', () => {
        const currentValue = parseInt(yInput.value) || 0;
        yInput.value = Math.max(0, currentValue - 1);
        yInput.dispatchEvent(new Event('input'));
      });
    }

    if (yPlusBtn && yInput) {
      yPlusBtn.addEventListener('click', () => {
        const currentValue = parseInt(yInput.value) || 0;
        yInput.value = currentValue + 1;
        yInput.dispatchEvent(new Event('input'));
      });
    }
  }

  // 저장된 이미지 데이터 복원
  async restoreImageData(modal, projectInstance) {
    if (!modal || !modal.dataset) return;
    
    const projectId = modal.dataset.projectId;
    if (!projectId || !projectInstance) return;

    const imagePreviewSection = modal.querySelector('#image-preview-section');
    const imagePreview = modal.querySelector('#image-preview');
    const originalCanvas = modal.querySelector('#original-canvas');
    const processedCanvas = modal.querySelector('#processed-canvas');
    const uploadBtn = modal.querySelector('#upload-image-btn');

    if (!imagePreviewSection || !imagePreview || !originalCanvas || !processedCanvas || !uploadBtn) {
      console.log('Wplace Plus: 필요한 DOM 요소를 찾을 수 없습니다');
      return;
    }

    // ProjectInstance에서 이미지 데이터 확인
    if (projectInstance.imageManager?.originalImageData && projectInstance.imageManager?.processedImageData) {
      try {
        // 원본 이미지 표시
        this.drawImageToCanvas(projectInstance.imageManager.originalImageData, originalCanvas);
        
        // 처리된 이미지 표시
        this.drawImageToCanvas(projectInstance.imageManager.processedImageData, processedCanvas);
        
        // 이미지 미리보기 섹션 표시
        imagePreviewSection.classList.remove('hidden');
        
        // 업로드 섹션 전체 숨기기
        const uploadSection = modal.querySelector('#image-upload-section');
        if (uploadSection) {
          uploadSection.classList.add('hidden');
        }
        
        console.log('Wplace Plus: 저장된 이미지 데이터 복원 완료');
      } catch (error) {
        console.error('Wplace Plus: 이미지 데이터 복원 실패:', error);
      }
    } else {
      console.log('Wplace Plus: 복원할 이미지 데이터가 없습니다');
      // 저장된 이미지 데이터가 없으면 이미지 미리보기 섹션 숨기기
      if (imagePreviewSection) {
        imagePreviewSection.classList.add('hidden');
      }
    }
  }
}

// 전역 프로젝트 매니저 인스턴스
const projectManager = new ProjectManager();
