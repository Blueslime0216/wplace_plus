// WPlace+ 언어 관리 - 다국어 지원

class LanguageManager {
  constructor() {
    this.currentLanguage = WPlacePlusCore.storage.get('language', 'ko');
    this.translations = {
      ko: {
        title: 'WPlace+',
        minimize: '최소화',
        settings: '설정 및 도구',
        autoSave: '자동 저장',
        preview: '실시간 미리보기',
        save: '저장',
        reset: '초기화',
        colorSettings: '색상 설정',
        primaryColor: '기본 색상',
        secondaryColor: '보조 색상',
        backgroundColor: '배경 색상',
        hexInput: 'HEX 입력',
        presetColors: '프리셋 색상',
        confirmReset: '모든 설정을 초기화하시겠습니까?',
        resetComplete: '설정이 초기화되었습니다.',
        saveComplete: '설정이 저장되었습니다.'
      },
      en: {
        title: 'WPlace+',
        minimize: 'Minimize',
        settings: 'Settings & Tools',
        autoSave: 'Auto Save',
        preview: 'Real-time Preview',
        save: 'Save',
        reset: 'Reset',
        colorSettings: 'Color Settings',
        primaryColor: 'Primary Color',
        secondaryColor: 'Secondary Color',
        backgroundColor: 'Background Color',
        hexInput: 'HEX Input',
        presetColors: 'Preset Colors',
        confirmReset: 'Are you sure you want to reset all settings?',
        resetComplete: 'Settings have been reset.',
        saveComplete: 'Settings have been saved.'
      }
    };
    
    this.languageData = {
      ko: { flag: '🇰🇷', name: '한국어' },
      en: { flag: '🇺🇸', name: 'English' }
    };
  }

  // 현재 언어 반환
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // 번역 텍스트 반환
  t(key) {
    return this.translations[this.currentLanguage][key] || key;
  }

  // 언어 변경
  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      WPlacePlusCore.storage.set('language', lang);
      this.updateUI();
      this.updateModalContent();
    }
  }

  // UI 업데이트 (드롭다운 버튼)
  updateUI() {
    const languageBtn = document.getElementById('language-btn');
    const languageMenu = document.getElementById('language-menu');
    
    if (languageBtn && languageMenu) {
      const currentData = this.languageData[this.currentLanguage];
      
      // 버튼 텍스트 업데이트
      const flagSpan = languageBtn.querySelector('.language-flag');
      const textSpan = languageBtn.querySelector('.language-text');
      
      if (flagSpan) flagSpan.textContent = currentData.flag;
      if (textSpan) textSpan.textContent = currentData.name;
      
      // 메뉴에서 선택된 항목 표시
      const options = languageMenu.querySelectorAll('.language-option');
      options.forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.lang === this.currentLanguage) {
          option.classList.add('selected');
        }
      });
    }
  }

  // 모달 컨텐츠 업데이트
  updateModalContent() {
    const modal = WPlacePlusModal.getModal();
    if (!modal) return;

    // 헤더 제목 업데이트
    const titleElement = modal.querySelector('.header-title');
    if (titleElement) {
      titleElement.textContent = this.t('title');
    }

    // 최소화 버튼 툴팁 업데이트
    const minimizeBtn = modal.querySelector('.minimize-btn');
    if (minimizeBtn) {
      minimizeBtn.title = this.t('minimize');
    }

    // UI 컨텐츠 재생성
    const contentElement = modal.querySelector('.modal-content');
    if (contentElement) {
      contentElement.innerHTML = WPlacePlusHelpers.generateUIContent();
      // UI 이벤트 리스너 재설정
      WPlacePlusUI.initializeUI();
    }
  }

  // 드롭다운 이벤트 리스너 설정
  setupLanguageDropdown() {
    const languageBtn = document.getElementById('language-btn');
    const languageMenu = document.getElementById('language-menu');
    
    if (!languageBtn || !languageMenu) return;

    // 드롭다운 토글
    languageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // 언어 옵션 클릭
    const options = languageMenu.querySelectorAll('.language-option');
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = option.dataset.lang;
        this.setLanguage(lang);
        this.closeDropdown();
      });
    });

    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', (e) => {
      if (!languageBtn.contains(e.target) && !languageMenu.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // ESC 키로 드롭다운 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDropdown();
      }
    });

    // 모달 이동 시 드롭다운 위치 업데이트
    window.addEventListener('resize', () => {
      if (languageMenu.classList.contains('show') && languageMenu.parentNode === document.body) {
        this.adjustDropdownPosition();
      }
    });

    // 스크롤 시 드롭다운 위치 업데이트
    window.addEventListener('scroll', () => {
      if (languageMenu.classList.contains('show') && languageMenu.parentNode === document.body) {
        this.adjustDropdownPosition();
      }
    });

    // 모달 드래그 시 드롭다운 위치 업데이트
    const modal = WPlacePlusModal.getModal();
    if (modal) {
      modal.addEventListener('mousemove', () => {
        if (languageMenu.classList.contains('show') && languageMenu.parentNode === document.body) {
          this.adjustDropdownPosition();
        }
      });
    }
  }

  // 드롭다운 열기/닫기
  toggleDropdown() {
    const languageBtn = document.getElementById('language-btn');
    const languageMenu = document.getElementById('language-menu');
    
    if (!languageBtn || !languageMenu) return;

    const isOpen = languageMenu.classList.contains('show');
    
    if (isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  // 드롭다운 열기
  openDropdown() {
    const languageBtn = document.getElementById('language-btn');
    const languageMenu = document.getElementById('language-menu');
    
    if (!languageBtn || !languageMenu) return;

    // 드롭다운을 body에 포털로 이동
    this.portalDropdownToBody();

    // 드롭다운 위치 조정
    this.adjustDropdownPosition();

    languageBtn.classList.add('active');
    languageMenu.classList.add('show');
  }

  // 드롭다운을 body에 포털로 이동
  portalDropdownToBody() {
    const languageMenu = document.getElementById('language-menu');
    if (!languageMenu) return;

    // 이미 body에 있으면 스킵
    if (languageMenu.parentNode === document.body) return;

    // 애니메이션 비활성화
    languageMenu.style.transition = 'none';
    languageMenu.style.transform = 'none';
    languageMenu.style.opacity = '0';
    languageMenu.style.visibility = 'hidden';

    // body로 이동
    document.body.appendChild(languageMenu);
    
    // 포털용 스타일 적용
    languageMenu.style.position = 'fixed';
    languageMenu.style.zIndex = '99999';
    languageMenu.style.pointerEvents = 'auto';
  }

  // 드롭다운 위치 조정 (화면 경계 고려)
  adjustDropdownPosition() {
    const languageBtn = document.getElementById('language-btn');
    const languageMenu = document.getElementById('language-menu');
    
    if (!languageBtn || !languageMenu) return;

    const btnRect = languageBtn.getBoundingClientRect();
    const menuHeight = 100; // 대략적인 메뉴 높이
    const menuWidth = 120; // 대략적인 메뉴 너비
    const spaceBelow = window.innerHeight - btnRect.bottom;
    const spaceAbove = btnRect.top;

    // 포털로 body에 있으므로 fixed 위치로 계산
    languageMenu.style.position = 'fixed';
    languageMenu.style.right = 'auto';
    languageMenu.style.bottom = 'auto';

    // 기본적으로 아래쪽으로 열기
    languageMenu.style.left = (btnRect.right - menuWidth) + 'px';
    languageMenu.style.top = (btnRect.bottom + 5) + 'px';

    // 아래쪽 공간이 부족하고 위쪽 공간이 충분하면 위쪽으로 열기
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      languageMenu.style.top = (btnRect.top - menuHeight - 5) + 'px';
    }

    // 위치 설정 후 애니메이션 재활성화
    setTimeout(() => {
      languageMenu.style.transition = '';
      languageMenu.style.opacity = '1';
      languageMenu.style.visibility = 'visible';
    }, 10);
  }

  // 드롭다운 닫기
  closeDropdown() {
    const languageBtn = document.getElementById('language-btn');
    const languageMenu = document.getElementById('language-menu');
    
    if (!languageBtn || !languageMenu) return;

    languageBtn.classList.remove('active');
    languageMenu.classList.remove('show');
    
    // 포털에서 원래 위치로 복원
    this.restoreDropdownFromPortal();
  }

  // 드롭다운을 포털에서 원래 위치로 복원
  restoreDropdownFromPortal() {
    const languageMenu = document.getElementById('language-menu');
    if (!languageMenu) return;

    // 애니메이션 비활성화
    languageMenu.style.transition = 'none';
    languageMenu.style.opacity = '0';
    languageMenu.style.visibility = 'hidden';

    // body에서 원래 부모로 이동
    const languageDropdown = document.querySelector('.language-dropdown');
    if (languageDropdown && languageMenu.parentNode === document.body) {
      languageDropdown.appendChild(languageMenu);
    }

    // 스타일 초기화
    languageMenu.style.position = '';
    languageMenu.style.left = '';
    languageMenu.style.top = '';
    languageMenu.style.right = '';
    languageMenu.style.bottom = '';
    languageMenu.style.zIndex = '';
    languageMenu.style.pointerEvents = '';
    languageMenu.style.transform = 'translateY(-10px)';

    // 애니메이션 재활성화
    setTimeout(() => {
      languageMenu.style.transition = '';
    }, 10);
  }

  // 초기화
  initialize() {
    this.updateUI();
    this.setupLanguageDropdown();
  }
}

// 언어 관리자 인스턴스
const languageManager = new LanguageManager();

// 전역에서 접근 가능하도록 설정
window.WPlacePlusLanguage = {
  manager: languageManager,
  t: (key) => languageManager.t(key),
  setLanguage: (lang) => languageManager.setLanguage(lang),
  getCurrentLanguage: () => languageManager.getCurrentLanguage(),
  initialize: () => languageManager.initialize()
};
