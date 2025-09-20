/**
 * Wplace Plus - 위치 캡처 컨트롤러
 * injector.js와 통신하여 좌표 캡처를 관리하는 컨트롤러
 */
class PositionCapture {
  constructor() {
    // 기본 상태
    this.storageKey = 'wplace_plus_coordinates';
    this.isEnabled = false;
    this.currentCoordinates = null;
    this.lastDetectedCoords = null;
    
    // 이벤트 리스너
    this.boundClickHandler = this.handleClick.bind(this);
    this.boundCoordsHandler = this.handleCoordsCaptured.bind(this);
    
    this.init();
  }

  /**
   * 초기화
   */
  async init() {
    console.log('Wplace Plus: 위치 캡처 컨트롤러 초기화');
    this.injectScript();
    this.setupEventListeners();
    await this.loadCoordinates(); // 저장된 좌표 불러오기 (UI 업데이트는 이벤트로 처리)
  }

  /**
   * injector.js를 페이지에 주입하는 함수
   */
  injectScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/features/injector.js');
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => {
      console.log('Wplace Plus: Injector 스크립트 주입 완료');
      script.remove(); // 주입 후 스크립트 태그는 제거해도 코드는 메모리에 남음
    };
    script.onerror = () => {
      console.error('Wplace Plus: Injector 스크립트 주입 실패');
    };
  }

  /**
   * 저장된 좌표를 불러오는 함수
   */
  async loadCoordinates() {
    try {
      console.log('Wplace Plus: 저장된 좌표 불러오기 시작...');
      const result = await chrome.storage.local.get(this.storageKey);
      console.log('Wplace Plus: storage에서 가져온 데이터:', result);
      
      if (result[this.storageKey]) {
        this.currentCoordinates = result[this.storageKey];
        console.log('Wplace Plus: 저장된 좌표를 불러왔습니다', this.currentCoordinates);
        // this.updateUI(this.currentCoordinates); // 여기서 직접 호출하지 않음
      } else {
        console.log('Wplace Plus: 저장된 좌표가 없습니다');
      }
    } catch (error) {
      console.error('Wplace Plus: 좌표 불러오기 실패:', error);
    }
  }

  /**
   * 현재 좌표를 저장하는 함수
   */
  async saveCoordinates() {
    try {
      console.log('Wplace Plus: 좌표 저장 중...', this.currentCoordinates);
      await chrome.storage.local.set({ [this.storageKey]: this.currentCoordinates });
      console.log('Wplace Plus: 좌표 저장 완료');
    } catch (error) {
      console.error('Wplace Plus: 좌표 저장 실패:', error);
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 토글 버튼 클릭 이벤트
    document.addEventListener('click', this.boundClickHandler);
    
    // injector가 보낸 커스텀 이벤트를 수신
    window.addEventListener('wplace_plus:coords_captured', this.boundCoordsHandler);

    // 모달이 준비되었다는 이벤트를 수신
    document.addEventListener('wplace_plus:modal_ready', () => {
      console.log('Wplace Plus: 모달 준비 완료 이벤트 수신. 좌표 UI를 업데이트합니다.');
      if (this.currentCoordinates) {
        this.updateUI(this.currentCoordinates);
      }
    });
  }

  /**
   * 클릭 이벤트 핸들러
   */
  handleClick(event) {
    const target = event.target;
    if (target && target.id === 'position-capture-toggle') {
      this.toggleCapture();
    }
  }

  /**
   * injector에서 좌표 데이터를 수신하는 핸들러
   */
  handleCoordsCaptured(event) {
    const { chunk, pixel, global, url, timestamp } = event.detail;
    
    // 좌표가 변경되었는지 확인 (중복 처리 방지)
    if (this.lastDetectedCoords && 
        this.lastDetectedCoords.chunk.x === chunk.x && 
        this.lastDetectedCoords.chunk.y === chunk.y &&
        this.lastDetectedCoords.pixel.x === pixel.x && 
        this.lastDetectedCoords.pixel.y === pixel.y) {
      return;
    }
    
    // UI 업데이트
    this.updateUI(global);
    
    // 현재 좌표 저장
    this.lastDetectedCoords = { chunk, pixel };
    this.currentCoordinates = global;
    this.saveCoordinates(); // 좌표를 캡처할 때마다 저장
    
    console.log('Wplace Plus: 좌표 데이터 수신됨', {
      chunk,
      pixel,
      global,
      url,
      timestamp
    });
  }


  /**
   * UI 업데이트
   */
  updateUI(coords) {
    // X, Y 입력 필드 찾기
    const xInput = document.getElementById('centerpoint-x');
    const yInput = document.getElementById('centerpoint-y');
    
    if (xInput && yInput) {
      xInput.value = coords.x;
      yInput.value = coords.y;
      
      // change 이벤트 발생시켜서 다른 리스너들이 반응하도록 함
      xInput.dispatchEvent(new Event('change', { bubbles: true }));
      yInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('Wplace Plus: 좌표 입력 필드 업데이트 완료', coords);
    } else {
      console.warn('Wplace Plus: 좌표 입력 필드를 찾을 수 없습니다');
    }
  }

  /**
   * 캡처 토글
   */
  toggleCapture(forceState = null) {
    if (forceState !== null) {
      this.isEnabled = forceState;
    } else {
      this.isEnabled = !this.isEnabled;
    }
    
    // <html> 태그의 data 속성을 통해 injector.js에 상태 전달
    document.documentElement.dataset.captureEnabled = this.isEnabled;
    
    if (this.isEnabled) {
      console.log('Wplace Plus: 위치 캡처 활성화 (Injector에 신호 전송)');
    } else {
      console.log('Wplace Plus: 위치 캡처 비활성화 (Injector에 신호 전송)');
    }
    
    this.updateToggleUI();
  }

  /**
   * 토글 UI 업데이트
   */
  updateToggleUI() {
    const toggleButtons = document.querySelectorAll('#position-capture-toggle');
    toggleButtons.forEach(button => {
      button.checked = this.isEnabled;
      button.classList.toggle('active', this.isEnabled);
      button.textContent = this.isEnabled ? '위치 캡처 ON' : '위치 캡처 OFF';
    });
  }

  /**
   * 현재 좌표 가져오기
   */
  getCurrentCoordinates() {
    return this.currentCoordinates;
  }

  /**
   * 캡처 상태 가져오기
   */
  isCaptureEnabled() {
    return this.isEnabled;
  }

  /**
   * 정리
   */
  destroy() {
    // injector에 비활성화 신호 전송
    document.documentElement.dataset.captureEnabled = 'false';
    
    // 이벤트 리스너 제거
    document.removeEventListener('click', this.boundClickHandler);
    window.removeEventListener('wplace_plus:coords_captured', this.boundCoordsHandler);
    
    // 상태 초기화
    this.isEnabled = false;
    this.currentCoordinates = null;
    this.lastDetectedCoords = null;
    
    console.log('Wplace Plus: 위치 캡처 컨트롤러 정리 완료');
  }
}

// 전역 인스턴스 생성 및 초기화
let positionCapture;

async function initializePositionCapture() {
  positionCapture = new PositionCapture();
  await positionCapture.init(); // init() 완료까지 대기
  
  // 전역 스코프에 등록
  if (typeof window !== 'undefined') {
    window.positionCapture = positionCapture;
  }
  
  console.log('Wplace Plus: PositionCapture 초기화 완료');
}

// 즉시 초기화 시작
initializePositionCapture();

// 모듈 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PositionCapture;
}
