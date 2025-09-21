// 프로젝트 설정 모달 관리
// Version: 0.0.2

// 프로젝트 설정 모달 생성
function createProjectSettingsModal(project) {
  // 기존 모달이 있다면 제거
  const existingModal = document.querySelector('.wplace_plus_project_settings_modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.className = 'wplace_plus_project_settings_modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    opacity: 0;
    transition: opacity 0.2s ease;
  `;

  modal.innerHTML = `
    <div class="wplace_plus_modal_box" style="
      background: white;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      transform: scale(0.95);
      transition: transform 0.2s ease;
    ">
      <div class="wplace_plus_modal_header" style="
        padding: 20px 24px 16px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="
            width: 40px;
            height: 40px;
            background: #f3f4f6;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          ">📁</div>
          <div>
            <h3 style="
              font-size: 18px;
              font-weight: 600;
              color: #111827;
              margin: 0;
            ">프로젝트 설정</h3>
            <p style="
              font-size: 14px;
              color: #6b7280;
              margin: 4px 0 0;
            ">${project.name}</p>
          </div>
        </div>
        <button class="wplace_plus_close_btn" style="
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #6b7280;
          transition: all 0.2s;
        " title="닫기">×</button>
      </div>
      
      <div class="wplace_plus_modal_content" style="
        padding: 24px;
        max-height: 60vh;
        overflow-y: auto;
      ">
        <div class="wplace_plus_settings_section" style="margin-bottom: 24px;">
          <h4 style="
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 16px;
          ">기본 정보</h4>
          
          <div class="wplace_plus_input_group" style="margin-bottom: 16px;">
            <label style="
              display: block;
              font-size: 14px;
              font-weight: 500;
              color: #374151;
              margin-bottom: 8px;
            ">프로젝트 이름</label>
            <input type="text" 
                   id="project-name-input" 
                   value="${project.name}" 
                   style="
                     width: 100%;
                     padding: 12px 16px;
                     border: 2px solid #e5e7eb;
                     border-radius: 8px;
                     font-size: 14px;
                     color: #111827;
                     background: white;
                     transition: border-color 0.2s;
                     box-sizing: border-box;
                   "
                   placeholder="프로젝트 이름을 입력하세요">
          </div>
          
          <div class="wplace_plus_input_group" style="margin-bottom: 16px;">
            <label style="
              display: block;
              font-size: 14px;
              font-weight: 500;
              color: #374151;
              margin-bottom: 8px;
            ">프로젝트 설명</label>
            <textarea id="project-description-input" 
                      style="
                        width: 100%;
                        padding: 12px 16px;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 14px;
                        color: #111827;
                        background: white;
                        resize: vertical;
                        min-height: 80px;
                        font-family: inherit;
                        box-sizing: border-box;
                      "
                      placeholder="프로젝트 설명을 입력하세요">${project.description || ''}</textarea>
          </div>
        </div>
        
        <div class="wplace_plus_settings_section">
          <h4 style="
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 16px;
          ">프로젝트 정보</h4>
          
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
          ">
            <div>
              <label style="
                display: block;
                font-size: 12px;
                font-weight: 500;
                color: #6b7280;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              ">생성일</label>
              <div style="
                font-size: 14px;
                color: #111827;
                padding: 8px 12px;
                background: #f9fafb;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
              ">${new Date(project.createdAt).toLocaleDateString('ko-KR')}</div>
            </div>
            <div>
              <label style="
                display: block;
                font-size: 12px;
                font-weight: 500;
                color: #6b7280;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              ">수정일</label>
              <div style="
                font-size: 14px;
                color: #111827;
                padding: 8px 12px;
                background: #f9fafb;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
              ">${new Date(project.updatedAt).toLocaleDateString('ko-KR')}</div>
            </div>
          </div>
          
          <div>
            <label style="
              display: block;
              font-size: 12px;
              font-weight: 500;
              color: #6b7280;
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            ">프로젝트 ID</label>
            <div style="
              font-size: 12px;
              color: #6b7280;
              padding: 8px 12px;
              background: #f9fafb;
              border-radius: 6px;
              border: 1px solid #e5e7eb;
              font-family: monospace;
              word-break: break-all;
            ">${project.id}</div>
          </div>
        </div>
      </div>
      
      <div class="wplace_plus_modal_footer" style="
        padding: 16px 24px 24px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      ">
        <button class="wplace_plus_btn_cancel" style="
          padding: 10px 20px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        ">취소</button>
        <button class="wplace_plus_btn_save" style="
          padding: 10px 20px;
          border: none;
          background: #3b82f6;
          color: white;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        ">저장</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 애니메이션
  setTimeout(() => {
    modal.style.opacity = '1';
    const modalBox = modal.querySelector('.wplace_plus_modal_box');
    modalBox.style.transform = 'scale(1)';
  }, 10);

  // 이벤트 리스너 설정
  setupProjectSettingsModalEvents(modal, project);

  return modal;
}

// 프로젝트 설정 모달 이벤트 설정
function setupProjectSettingsModalEvents(modal, project) {
  const closeBtn = modal.querySelector('.wplace_plus_close_btn');
  const cancelBtn = modal.querySelector('.wplace_plus_btn_cancel');
  const saveBtn = modal.querySelector('.wplace_plus_btn_save');
  const nameInput = modal.querySelector('#project-name-input');
  const descriptionInput = modal.querySelector('#project-description-input');

  // 모달 닫기 함수
  const closeModal = () => {
    modal.style.opacity = '0';
    const modalBox = modal.querySelector('.wplace_plus_modal_box');
    modalBox.style.transform = 'scale(0.95)';
    setTimeout(() => {
      modal.remove();
    }, 200);
  };

  // 닫기 버튼들
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // 배경 클릭으로 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // ESC 키로 닫기
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleKeydown);
    }
  };
  document.addEventListener('keydown', handleKeydown);

  // 저장 버튼
  saveBtn.addEventListener('click', async () => {
    const newName = nameInput.value.trim();
    const newDescription = descriptionInput.value.trim();

    if (!newName) {
      alert('프로젝트 이름을 입력해주세요.');
      nameInput.focus();
      return;
    }

    if (newName === project.name && newDescription === (project.description || '')) {
      closeModal();
      return;
    }

    try {
      // 프로젝트 업데이트
      const success = await projectManager.updateProject(project.id, {
        name: newName,
        description: newDescription
      });

      if (success) {
        console.log('Wplace Plus: 프로젝트 설정 저장됨:', { name: newName, description: newDescription });
        closeModal();
        
        // 프로젝트 드롭다운 새로고침
        const menuItem = document.querySelector('.wplace_plus_menu_item[data-action="projects"]');
        if (menuItem && window.currentProjectDropdown) {
          window.currentProjectDropdown.remove();
          window.currentProjectDropdown = null;
          if (window.createProjectDropdown) {
            await window.createProjectDropdown(menuItem);
          }
        }
      } else {
        alert('프로젝트 설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Wplace Plus: 프로젝트 설정 저장 실패:', error);
      alert('프로젝트 설정 저장 중 오류가 발생했습니다.');
    }
  });

  // 입력 필드 포커스 효과
  const inputs = [nameInput, descriptionInput];
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.style.borderColor = '#3b82f6';
    });
    
    input.addEventListener('blur', () => {
      input.style.borderColor = '#e5e7eb';
    });
  });

  // 버튼 호버 효과
  const buttons = [closeBtn, cancelBtn, saveBtn];
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (btn === closeBtn) {
        btn.style.backgroundColor = '#f3f4f6';
        btn.style.color = '#111827';
      } else if (btn === cancelBtn) {
        btn.style.backgroundColor = '#f9fafb';
        btn.style.borderColor = '#9ca3af';
      } else if (btn === saveBtn) {
        btn.style.backgroundColor = '#2563eb';
      }
    });
    
    btn.addEventListener('mouseleave', () => {
      if (btn === closeBtn) {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = '#6b7280';
      } else if (btn === cancelBtn) {
        btn.style.backgroundColor = 'white';
        btn.style.borderColor = '#d1d5db';
      } else if (btn === saveBtn) {
        btn.style.backgroundColor = '#3b82f6';
      }
    });
  });
}

// 전역으로 내보내기
window.createProjectSettingsModal = createProjectSettingsModal;
