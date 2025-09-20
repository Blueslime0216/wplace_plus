/**
 * Wplace Plus - Overlay Manager
 * fetch-hook.js로부터 타일 요청 이벤트를 받아 오버레이를 렌더링하고,
 * 처리된 이미지를 다시 fetch-hook.js로 전달하는 핵심 컨트롤러입니다.
 */
class OverlayManager {
  constructor() {
    this.init();
  }

  init() {
    console.log('Wplace Plus: Overlay Manager 초기화');
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('wplace_plus:tile-request', (event) => {
      this.handleTileRequest(event.detail);
    });
  }

  async handleTileRequest({ requestId, url, blob }) {
    // console.log(`Wplace Plus: Overlay Manager가 타일 요청 처리 시작: ${url}`);

    // TODO: 여기에 실제 오버레이 렌더링 로직 추가
    // 1. URL에서 타일 좌표 파싱
    // 2. projectManager에서 현재 프로젝트의 오버레이 데이터 가져오기
    // 3. 해당 타일 좌표에 그려야 할 오버레이 조각(chunk) 찾기
    // 4. OffscreenCanvas를 사용하여 원본 blob 위에 오버레이 조각 그리기
    // 5. 최종 결과 Blob 생성

    // 임시: 현재는 원본 Blob을 그대로 반환
    const processedBlob = await this.drawOverlays(blob, url);

    // 처리된 Blob을 fetch-hook.js로 다시 전송
    window.dispatchEvent(new CustomEvent('wplace_plus:tile-response', {
      detail: {
        requestId,
        blob: processedBlob
      }
    }));
  }
  
  async drawOverlays(originalBlob, url) {
    // 이 함수에서 실제 오버레이 합성 로직이 구현됩니다.
    // 지금은 원본을 그대로 반환합니다.
    return originalBlob;
  }
}

// 전역 인스턴스 생성
const overlayManager = new OverlayManager();
