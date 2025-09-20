/**
 * Wplace Plus - Fetch Hook
 * 이 스크립트는 페이지의 메인 월드에 주입되어 'fetch' 요청을 가로챕니다.
 * 타일 요청을 감지하여 content script (overlay-manager.js)로 전달하는 역할을 합니다.
 */
(() => {
  console.log('Wplace Plus: Fetch Hook 스크립트 로드됨');

  const originalFetch = window.fetch;

  // URL이 Wplace 타일 요청인지 확인하는 함수
  const isTileURL = (url) => {
    try {
      const u = new URL(url);
      return u.hostname === 'backend.wplace.live' && u.pathname.startsWith('/files/') && u.pathname.endsWith('.png');
    } catch (e) {
      return false;
    }
  };

  window.fetch = async function(...args) {
    const url = args[0] instanceof Request ? args[0].url : args[0];

    if (isTileURL(url)) {
      // console.log(`Wplace Plus: 타일 요청 가로챔: ${url}`);
      
      try {
        const response = await originalFetch.apply(this, args);
        if (!response.ok) {
          return response;
        }

        const originalBlob = await response.blob();

        return new Promise((resolve) => {
          const requestId = `tile-request-${Date.now()}-${Math.random()}`;

          // Content Script로부터 처리된 Blob을 받기 위한 이벤트 리스너
          const responseListener = (event) => {
            if (event.detail.requestId === requestId) {
              // console.log(`Wplace Plus: 처리된 타일 받음: ${url}`);
              const newResponse = new Response(event.detail.blob, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
              resolve(newResponse);
              window.removeEventListener('wplace_plus:tile-response', responseListener);
            }
          };
          window.addEventListener('wplace_plus:tile-response', responseListener);

          // Content Script로 타일 데이터 전송
          window.dispatchEvent(new CustomEvent('wplace_plus:tile-request', {
            detail: {
              requestId,
              url,
              blob: originalBlob
            }
          }));
        });

      } catch (error) {
        console.error(`Wplace Plus: 타일 처리 중 오류 발생: ${url}`, error);
        return originalFetch.apply(this, args); // 오류 발생 시 원본 요청 재실행
      }
    }

    return originalFetch.apply(this, args);
  };
})();
