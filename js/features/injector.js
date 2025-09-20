/**
 * Wplace Plus - Injector Script
 * 페이지의 window 컨텍스트에서 실행되어 실제 fetch를 후킹하는 스크립트
 * position-capture.js와 통신하여 좌표 데이터를 전달
 */
(() => {
  'use strict';
  
  // 원본 fetch 함수 백업
  const ORIGINAL_FETCH = window.fetch;
  const TILE_SIZE = 1000;
  const BACKEND_HOST = 'backend.wplace.live';
  
  // Hook된 fetch 함수
  const hookedFetch = async (input, init) => {
    // <html> 태그의 속성을 읽어 캡처 활성화 여부 확인
    const isCaptureEnabled = document.documentElement.dataset.captureEnabled === 'true';
    
    if (isCaptureEnabled) {
      const urlStr = typeof input === 'string' ? input : input.url || '';
      
      try {
        const url = new URL(urlStr, location.href);
        
        // backend.wplace.live 호스트 확인
        if (url.hostname === BACKEND_HOST) {
          // 픽셀 URL 패턴 매칭: /s0/pixel/{chunkX}/{chunkY}?x={posX}&y={posY}
          const match = url.pathname.match(/\/s0\/pixel\/(\d+)\/(\d+)$/);
          
          if (match) {
            // 좌표 데이터 추출
            const chunkX = parseInt(match[1], 10);
            const chunkY = parseInt(match[2], 10);
            const posX = parseInt(url.searchParams.get('x') || '0', 10);
            const posY = parseInt(url.searchParams.get('y') || '0', 10);
            
            // 전역 좌표 계산
            const globalX = chunkX * TILE_SIZE + posX;
            const globalY = chunkY * TILE_SIZE + posY;
            
            // 좌표 데이터 객체 생성
            const coordinateData = {
              chunk: { x: chunkX, y: chunkY },
              pixel: { x: posX, y: posY },
              global: { x: globalX, y: globalY },
              url: urlStr,
              timestamp: Date.now()
            };
            
            console.log('Wplace Plus Injector: 좌표 감지됨', coordinateData);
            
            // 커스텀 이벤트를 발생시켜 컨트롤러로 데이터 전송
            window.dispatchEvent(new CustomEvent('wplace_plus:coords_captured', { 
              detail: coordinateData 
            }));
          }
        }
      } catch (error) {
        // URL 파싱 에러는 무시 (정상적인 다른 요청들)
      }
    }
    
    // 원래 fetch 함수 호출
    return ORIGINAL_FETCH(input, init);
  };

  // 페이지의 모든 리소스가 로드된 후 훅 설치
  const installHook = () => {
    window.fetch = hookedFetch;
    console.log('Wplace Plus Injector: Fetch Hook이 성공적으로 설치되었습니다.');
  };

  // DOM이 준비되면 즉시 설치 시도
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installHook);
  } else {
    installHook();
  }

  // 추가로 window.onload도 대비 (더 안전한 설치)
  window.addEventListener('load', () => {
    // 이미 설치되어 있지 않다면 다시 설치
    if (window.fetch !== hookedFetch) {
      window.fetch = hookedFetch;
      console.log('Wplace Plus Injector: window.onload에서 Fetch Hook 재설치 완료');
    }
  });

  // 페이지 언로드 시 정리
  window.addEventListener('beforeunload', () => {
    if (window.fetch === hookedFetch) {
      window.fetch = ORIGINAL_FETCH;
      console.log('Wplace Plus Injector: Fetch Hook 정리 완료');
    }
  });

})();
