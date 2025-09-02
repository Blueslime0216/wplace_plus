// WPlace+ UI 상호작용 관리

// UI 초기화
function initializeUI() {
  console.log('[WPlace+] UI 초기화 시작');
  
  // 섹션 상태 복원
  restoreSectionStates();
  
  // 이벤트 리스너 설정
  setupSectionListeners();
  setupToggleListeners();
  setupButtonListeners();
  setupColorListeners();
  
  console.log('[WPlace+] UI 초기화 완료');
}

// 섹션 상태 복원
function restoreSectionStates() {
  const section1Open = WPlacePlusCore.storage.get('section1Open', true);
  const section2Open = WPlacePlusCore.storage.get('section2Open', true);
  
  const section1 = document.getElementById('section-1');
  const section2 = document.getElementById('section-2');
  
  if (section1) {
    if (section1Open) {
      section1.setAttribute('open', '');
    } else {
      section1.removeAttribute('open');
    }
  }
  
  if (section2) {
    if (section2Open) {
      section2.setAttribute('open', '');
    } else {
      section2.removeAttribute('open');
    }
  }
}

// 섹션 이벤트 리스너 설정
function setupSectionListeners() {
  const sections = document.querySelectorAll('.wplace-section');
  
  sections.forEach(section => {
    const summary = section.querySelector('.section-summary');
    if (summary) {
      summary.addEventListener('click', (e) => {
        // 기본 동작 방지 (details 요소의 기본 토글 동작)
        e.preventDefault();
        
        // 수동으로 토글
        const isOpen = section.hasAttribute('open');
        if (isOpen) {
          section.removeAttribute('open');
        } else {
          section.setAttribute('open', '');
        }
        
        // 상태 저장
        const sectionId = section.id;
        if (sectionId === 'section-1') {
          WPlacePlusCore.storage.set('section1Open', !isOpen);
        } else if (sectionId === 'section-2') {
          WPlacePlusCore.storage.set('section2Open', !isOpen);
        }
        
        console.log(`[WPlace+] 섹션 ${sectionId} ${!isOpen ? '열림' : '닫힘'}`);
      });
    }
  });
}

// 토글 스위치 이벤트 리스너 설정
function setupToggleListeners() {
  // 자동 저장 토글
  const autoSaveToggle = document.getElementById('auto-save-toggle');
  if (autoSaveToggle) {
    // 저장된 상태 복원
    const savedState = WPlacePlusCore.storage.get('autoSaveEnabled', false);
    autoSaveToggle.checked = savedState;
    
    autoSaveToggle.addEventListener('change', (e) => {
      const isEnabled = e.target.checked;
      WPlacePlusCore.storage.set('autoSaveEnabled', isEnabled);
      console.log(`[WPlace+] 자동 저장 ${isEnabled ? '활성화' : '비활성화'}`);
    });
  }
  
  // 실시간 미리보기 토글
  const previewToggle = document.getElementById('preview-toggle');
  if (previewToggle) {
    // 저장된 상태 복원
    const savedState = WPlacePlusCore.storage.get('previewEnabled', true);
    previewToggle.checked = savedState;
    
    previewToggle.addEventListener('change', (e) => {
      const isEnabled = e.target.checked;
      WPlacePlusCore.storage.set('previewEnabled', isEnabled);
      console.log(`[WPlace+] 실시간 미리보기 ${isEnabled ? '활성화' : '비활성화'}`);
    });
  }
}

// 버튼 이벤트 리스너 설정
function setupButtonListeners() {
  // 저장 버튼
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      console.log('[WPlace+] 저장 버튼 클릭');
      
      // 버튼 애니메이션
      saveBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        saveBtn.style.transform = '';
      }, 150);
      
      // 저장 완료
    });
  }
  
  // 초기화 버튼
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      console.log('[WPlace+] 초기화 버튼 클릭');
      
      // 확인 대화상자
      if (confirm('모든 설정을 초기화하시겠습니까?')) {
        // 토글 상태 초기화
        const autoSaveToggle = document.getElementById('auto-save-toggle');
        const previewToggle = document.getElementById('preview-toggle');
        
        if (autoSaveToggle) {
          autoSaveToggle.checked = false;
          WPlacePlusCore.storage.set('autoSaveEnabled', false);
        }
        
        if (previewToggle) {
          previewToggle.checked = true;
          WPlacePlusCore.storage.set('previewEnabled', true);
        }
        
        // 색상 초기화
        resetColors();
        
        console.log('[WPlace+] 설정이 초기화되었습니다.');
      }
    });
  }
}

// 색상 관련 이벤트 리스너 설정
function setupColorListeners() {
  // 색상 피커와 HEX 입력 동기화
  const colorMappings = [
    { picker: 'primary-color', hex: 'primary-hex', preview: 'primary-preview' },
    { picker: 'secondary-color', hex: 'secondary-hex', preview: 'secondary-preview' },
    { picker: 'background-color', hex: 'background-hex', preview: 'background-preview' }
  ];
  
  colorMappings.forEach(mapping => {
    const picker = document.getElementById(mapping.picker);
    const hexInput = document.getElementById(mapping.hex);
    const preview = document.getElementById(mapping.preview);
    
    if (picker && hexInput && preview) {
      // 저장된 색상 복원
      const savedColor = WPlacePlusCore.storage.get(mapping.picker, picker.value);
      picker.value = savedColor;
      hexInput.value = savedColor;
      preview.style.backgroundColor = savedColor;
      
      // 색상 피커 변경 시
      picker.addEventListener('input', (e) => {
        const color = e.target.value;
        hexInput.value = color;
        preview.style.backgroundColor = color;
        WPlacePlusCore.storage.set(mapping.picker, color);
        console.log(`[WPlace+] ${mapping.picker} 색상 변경:`, color);
      });
      
      // HEX 입력 변경 시
      hexInput.addEventListener('input', (e) => {
        const hex = e.target.value;
        if (isValidHex(hex)) {
          picker.value = hex;
          preview.style.backgroundColor = hex;
          WPlacePlusCore.storage.set(mapping.picker, hex);
          console.log(`[WPlace+] ${mapping.picker} HEX 변경:`, hex);
        }
      });
      
      // HEX 입력 포커스 시 전체 선택
      hexInput.addEventListener('focus', (e) => {
        e.target.select();
      });
    }
  });
  
  // 프리셋 색상 버튼
  const presetColors = document.querySelectorAll('.preset-color');
  presetColors.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const color = e.target.dataset.color;
      if (color) {
        // 기본 색상에 적용
        const primaryPicker = document.getElementById('primary-color');
        const primaryHex = document.getElementById('primary-hex');
        const primaryPreview = document.getElementById('primary-preview');
        
        if (primaryPicker && primaryHex && primaryPreview) {
          primaryPicker.value = color;
          primaryHex.value = color;
          primaryPreview.style.backgroundColor = color;
          WPlacePlusCore.storage.set('primary-color', color);
          
          // 버튼 애니메이션
          btn.style.transform = 'scale(0.9)';
          setTimeout(() => {
            btn.style.transform = '';
          }, 150);
          
          console.log(`[WPlace+] 기본 색상이 ${color}로 변경되었습니다.`);
        }
      }
    });
  });
}

// 색상 초기화
function resetColors() {
  const defaultColors = {
    'primary-color': '#4A90E2',
    'secondary-color': '#7BB3F0',
    'background-color': '#E6F2FF'
  };
  
  Object.entries(defaultColors).forEach(([key, value]) => {
    const picker = document.getElementById(key);
    const hexInput = document.getElementById(key.replace('-color', '-hex'));
    const preview = document.getElementById(key.replace('-color', '-preview'));
    
    if (picker && hexInput && preview) {
      picker.value = value;
      hexInput.value = value;
      preview.style.backgroundColor = value;
      WPlacePlusCore.storage.set(key, value);
    }
  });
}

// HEX 색상 유효성 검사
function isValidHex(hex) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}



// 전역에서 접근 가능하도록 설정
window.WPlacePlusUI = {
  initializeUI,
  resetColors
};
