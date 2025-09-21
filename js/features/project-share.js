// 프로젝트 공유 관리 클래스
class ProjectShare {
  constructor() {
    this.projectManager = null;
  }

  // 프로젝트 매니저 설정
  setProjectManager(projectManager) {
    this.projectManager = projectManager;
  }

  // 공유 패널 HTML 생성
  generateSharePanelHTML(project) {
    return `
      <div class="wplace_plus_panel_section">
        <h4>프로젝트 공유</h4>
        
        <!-- 내보내기 섹션 -->
        <div class="wplace_plus_share_section">
          <div class="wplace_plus_share_header">
            <span class="wplace_plus_share_icon">📤</span>
            <span class="wplace_plus_share_title">프로젝트 내보내기</span>
          </div>
          <p class="wplace_plus_share_description">
            현재 프로젝트를 JSON 파일로 내보내서 다른 곳에서 사용할 수 있습니다.
          </p>
          <button class="btn btn-primary w-full" id="export-project-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" class="size-4 mr-2">
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T800-120H200Zm0-80h560v-560H200v560Zm80-80h400L520-400 360-240l-80-80v80Zm-80 80v-560 560Z"/>
            </svg>
            프로젝트 내보내기
          </button>
        </div>

        <!-- 구분선 -->
        <div class="wplace_plus_divider"></div>

        <!-- 덮어씌우기 섹션 -->
        <div class="wplace_plus_share_section">
          <div class="wplace_plus_share_header">
            <span class="wplace_plus_share_icon">🔄</span>
            <span class="wplace_plus_share_title">프로젝트 덮어씌우기</span>
          </div>
          <p class="wplace_plus_share_description">
            이전에 내보낸 JSON 파일로 현재 프로젝트를 덮어씌울 수 있습니다. 기존 데이터는 모두 교체됩니다.
          </p>
          <button class="btn btn-outline w-full" id="overwrite-project-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" class="size-4 mr-2">
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T800-120H200Zm0-80h560v-560H200v560Zm80-80h400L520-400 360-240l-80-80v80Zm-80 80v-560 560Z"/>
            </svg>
            프로젝트 덮어씌우기
          </button>
          <input type="file" id="overwrite-file-input" accept=".json" style="display: none;">
        </div>

        <!-- 프로젝트 정보 표시 -->
        <div class="wplace_plus_project_info">
          <div class="wplace_plus_info_item">
            <span class="wplace_plus_info_label">프로젝트명:</span>
            <span class="wplace_plus_info_value">${project.name}</span>
          </div>
          <div class="wplace_plus_info_item">
            <span class="wplace_plus_info_label">생성일:</span>
            <span class="wplace_plus_info_value">${new Date(project.createdAt).toLocaleDateString('ko-KR')}</span>
          </div>
          <div class="wplace_plus_info_item">
            <span class="wplace_plus_info_label">수정일:</span>
            <span class="wplace_plus_info_value">${new Date(project.updatedAt).toLocaleDateString('ko-KR')}</span>
          </div>
          <div class="wplace_plus_info_item">
            <span class="wplace_plus_info_label">버전:</span>
            <span class="wplace_plus_info_value">${project.version}</span>
          </div>
        </div>
      </div>
    `;
  }

  // 공유 섹션 컨트롤 설정
  setupShareControls(modal, project) {
    const exportBtn = modal.querySelector('#export-project-btn');
    const overwriteBtn = modal.querySelector('#overwrite-project-btn');
    const overwriteFileInput = modal.querySelector('#overwrite-file-input');

    // 내보내기 버튼 이벤트
    if (exportBtn) {
      exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.exportProject(project);
      });
    }

    // 덮어씌우기 버튼 이벤트
    if (overwriteBtn) {
      overwriteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        overwriteFileInput.click();
      });
    }

    // 파일 선택 이벤트
    if (overwriteFileInput) {
      overwriteFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.overwriteProject(file, project);
        }
        // 파일 입력 초기화
        e.target.value = '';
      });
    }
  }

  // 프로젝트 내보내기
  exportProject(project) {
    try {
      // 프로젝트 데이터를 JSON으로 변환
      const exportData = {
        ...project,
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0.0'
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Blob 생성
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // 다운로드 링크 생성
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wplace_plus_${project.name.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      
      // 다운로드 실행
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // URL 해제
      URL.revokeObjectURL(url);
      
      console.log('Wplace Plus: 프로젝트 내보내기 완료:', project.name);
      
      // 성공 메시지 표시 (선택사항)
      this.showNotification('프로젝트가 성공적으로 내보내졌습니다.', 'success');
      
    } catch (error) {
      console.error('Wplace Plus: 프로젝트 내보내기 실패:', error);
      this.showNotification('프로젝트 내보내기에 실패했습니다.', 'error');
    }
  }

  // 프로젝트 불러오기
  async importProject(file) {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // 데이터 유효성 검사
      if (!this.validateImportData(importData)) {
        throw new Error('유효하지 않은 프로젝트 파일입니다.');
      }
      
      // 새 프로젝트 ID 생성 (중복 방지)
      const newProject = {
        ...importData,
        id: this.projectManager.generateProjectId(),
        name: `${importData.name} (가져온 프로젝트)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        importedAt: new Date().toISOString()
      };
      
      // 프로젝트 추가
      this.projectManager.projects.push(newProject);
      await this.projectManager.saveProjects();
      
      console.log('Wplace Plus: 프로젝트 불러오기 완료:', newProject.name);
      
      // 성공 메시지 표시
      this.showNotification('프로젝트가 성공적으로 불러와졌습니다.', 'success');
      
      // 프로젝트 목록 새로고침 (다른 스크립트에서 처리)
      const event = new CustomEvent('wplace_plus:project_imported', { 
        detail: { project: newProject } 
      });
      document.dispatchEvent(event);
      
    } catch (error) {
      console.error('Wplace Plus: 프로젝트 불러오기 실패:', error);
      this.showNotification(`프로젝트 불러오기에 실패했습니다: ${error.message}`, 'error');
    }
  }

  // 프로젝트 덮어씌우기 (완전 교체)
  async overwriteProject(file, currentProject) {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // 데이터 유효성 검사
      if (!this.validateImportData(importData)) {
        throw new Error('유효하지 않은 프로젝트 파일입니다.');
      }
      
      // 완전히 새로운 프로젝트로 생성 (모든 데이터 교체)
      const newProject = {
        ...importData,
        id: this.projectManager.generateProjectId(), // 새로운 ID 생성
        name: importData.name, // 파일의 이름 사용
        createdAt: new Date().toISOString(), // 새로운 생성일
        updatedAt: new Date().toISOString(), // 새로운 수정일
        overwrittenAt: new Date().toISOString() // 덮어씌우기 일시 추가
      };
      
      // 기존 프로젝트 삭제
      const projectIndex = this.projectManager.projects.findIndex(p => p.id === currentProject.id);
      if (projectIndex !== -1) {
        // 기존 모달이 있다면 닫기
        const existingModal = this.projectManager.projectModals.get(currentProject.id);
        if (existingModal) {
          // 모달 스택에서 제거
          if (typeof modalStackManager !== 'undefined') {
            modalStackManager.removeModal(currentProject.id);
          }
          
          existingModal.remove();
          this.projectManager.projectModals.delete(currentProject.id);
          this.projectManager.openModalIds.delete(currentProject.id);
        }
        
        // 프로젝트 목록에서 기존 프로젝트 제거
        this.projectManager.projects.splice(projectIndex, 1);
        
        // 새 프로젝트 추가
        this.projectManager.projects.push(newProject);
        await this.projectManager.saveProjects();
        
        console.log('Wplace Plus: 프로젝트 완전 교체 완료:', newProject.name);
        
        // 성공 메시지 표시
        this.showNotification('프로젝트가 성공적으로 교체되었습니다.', 'success');
        
        // 새 프로젝트 모달 열기 이벤트 발생
        const event = new CustomEvent('wplace_plus:project_replaced', { 
          detail: { 
            oldProject: currentProject,
            newProject: newProject
          } 
        });
        document.dispatchEvent(event);
        
      } else {
        throw new Error('현재 프로젝트를 찾을 수 없습니다.');
      }
      
    } catch (error) {
      console.error('Wplace Plus: 프로젝트 덮어씌우기 실패:', error);
      this.showNotification(`프로젝트 덮어씌우기에 실패했습니다: ${error.message}`, 'error');
    }
  }

  // 가져온 데이터 유효성 검사
  validateImportData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.name || typeof data.name !== 'string') return false;
    if (!data.data || typeof data.data !== 'object') return false;
    if (!data.version || typeof data.version !== 'string') return false;
    
    return true;
  }

  // 알림 메시지 표시
  showNotification(message, type = 'info') {
    // 간단한 알림 구현 (기존 UI와 일관성 유지)
    const notification = document.createElement('div');
    notification.className = `wplace_plus_notification wplace_plus_notification_${type}`;
    notification.textContent = message;
    
    // 스타일 적용
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '99999',
      maxWidth: '300px',
      wordWrap: 'break-word',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease'
    });
    
    // 타입별 색상 설정
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6',
      warning: '#f59e0b'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // 애니메이션으로 표시
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // 3초 후 자동 제거
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// 전역 공유 관리자 인스턴스
const projectShare = new ProjectShare();
