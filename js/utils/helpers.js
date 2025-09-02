// WPlace+ 유틸리티 헬퍼 함수들

// UI 컨텐츠 생성 (다국어 지원)
function generateUIContent() {
  // 언어 관리자가 없으면 기본 한국어 사용
  const t = window.WPlacePlusLanguage ? window.WPlacePlusLanguage.t : (key) => key;
  
  return `
    <!-- 첫 번째 섹션: 토글 요소와 버튼 -->
    <details class="wplace-section" id="section-1">
      <summary class="section-summary">
        <span class="section-icon">⚙️</span>
        <span class="section-title">${t('settings')}</span>
        <span class="section-arrow">▼</span>
      </summary>
      <div class="section-content">
        <div class="control-group">
          <div class="control-row">
            <label class="control-label">${t('autoSave')}</label>
            <label class="toggle-switch">
              <input type="checkbox" id="auto-save-toggle" class="toggle-input">
              <span class="toggle-slider"></span>
            </label>
            <span class="control-description">${t('autoSave')}</span>
          </div>
          
          <div class="control-row">
            <label class="control-label">${t('preview')}</label>
            <label class="toggle-switch">
              <input type="checkbox" id="preview-toggle" class="toggle-input">
              <span class="toggle-slider"></span>
            </label>
            <span class="control-description">${t('preview')}</span>
          </div>
          
          <div class="button-group">
            <button class="action-btn primary-btn" id="save-btn">
              <span class="btn-icon">💾</span>
              ${t('save')}
            </button>
            <button class="action-btn secondary-btn" id="reset-btn">
              <span class="btn-icon">🔄</span>
              ${t('reset')}
            </button>
          </div>
        </div>
      </div>
    </details>

    <!-- 두 번째 섹션: 컬러 피커와 라벨 -->
    <details class="wplace-section" id="section-2">
      <summary class="section-summary">
        <span class="section-icon">🎨</span>
        <span class="section-title">${t('colorSettings')}</span>
        <span class="section-arrow">▼</span>
      </summary>
      <div class="section-content">
        <div class="color-group">
          <div class="color-row">
            <label class="color-label">${t('primaryColor')}</label>
            <div class="color-input-group">
              <input type="color" id="primary-color" class="color-picker" value="#4A90E2">
              <input type="text" id="primary-hex" class="hex-input" placeholder="#4A90E2" maxlength="7">
              <span class="color-preview" id="primary-preview"></span>
            </div>
          </div>
          
          <div class="color-row">
            <label class="color-label">${t('secondaryColor')}</label>
            <div class="color-input-group">
              <input type="color" id="secondary-color" class="color-picker" value="#7BB3F0">
              <input type="text" id="secondary-hex" class="hex-input" placeholder="#7BB3F0" maxlength="7">
              <span class="color-preview" id="secondary-preview"></span>
            </div>
          </div>
          
          <div class="color-row">
            <label class="color-label">${t('backgroundColor')}</label>
            <div class="color-input-group">
              <input type="color" id="background-color" class="color-picker" value="#E6F2FF">
              <input type="text" id="background-hex" class="hex-input" placeholder="#E6F2FF" maxlength="7">
              <span class="color-preview" id="background-preview"></span>
            </div>
          </div>
          
          <div class="color-presets">
            <div class="preset-label">${t('presetColors')}</div>
            <div class="preset-colors">
              <button class="preset-color" data-color="#4A90E2" style="background: #4A90E2;" title="기본 하늘"></button>
              <button class="preset-color" data-color="#7BB3F0" style="background: #7BB3F0;" title="연한 하늘"></button>
              <button class="preset-color" data-color="#B8D4F0" style="background: #B8D4F0;" title="매우 연한 하늘"></button>
              <button class="preset-color" data-color="#E6F2FF" style="background: #E6F2FF;" title="연한 하늘"></button>
              <button class="preset-color" data-color="#F0F8FF" style="background: #F0F8FF;" title="매우 연한 하늘"></button>
              <button class="preset-color" data-color="#E6F0FF" style="background: #E6F0FF;" title="연한 파랑"></button>
              <button class="preset-color" data-color="#F0FFE6" style="background: #F0FFE6;" title="연한 초록"></button>
              <button class="preset-color" data-color="#FFF0E6" style="background: #FFF0E6;" title="연한 오렌지"></button>
            </div>
          </div>
        </div>
      </div>
    </details>
  `;
}

// DOM 요소 생성 헬퍼
function createElement(tag, className, innerHTML) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
}

// 이벤트 리스너 헬퍼
function addEventListeners(element, events) {
  Object.entries(events).forEach(([event, handler]) => {
    element.addEventListener(event, handler);
  });
}

// 위치 데이터 검증
function validatePosition(position) {
  if (position.x.includes('-9999') || position.y.includes('-9999') ||
      position.x.includes('undefined') || position.y.includes('undefined') ||
      position.x.includes('null') || position.y.includes('null')) {
    console.warn('[WPlace+] 잘못된 위치 데이터 감지, 기본값으로 초기화:', position);
    return { x: '50%', y: '50%' };
  }
  return position;
}

// 크기 데이터 검증
function validateSize(size) {
  if (size.width < 200 || size.height < 200 || 
      size.width > 2000 || size.height > 2000 ||
      isNaN(size.width) || isNaN(size.height)) {
    console.warn('[WPlace+] 잘못된 크기 데이터 감지, 기본값으로 초기화:', size);
    return { width: 400, height: 500 };
  }
  return size;
}

// 모달이 화면 안에 있는지 확인
function isModalVisible(modal) {
  const rect = modal.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && 
         rect.left >= 0 && rect.top >= 0 && 
         rect.left < window.innerWidth && rect.top < window.innerHeight;
}

// 전역에서 접근 가능하도록 설정
window.WPlacePlusHelpers = {
  generateUIContent,
  createElement,
  addEventListeners,
  validatePosition,
  validateSize,
  isModalVisible
};
