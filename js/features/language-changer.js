// wplace.live 사이트의 언어를 한국어로 변경하는 기능
// Version: 1.0.0

console.log('Wplace Plus: 언어 변경 기능이 로드되었습니다.');

// 언어 변경 함수
function changeLanguageToKorean() {
  // HTML 태그의 lang 속성을 'kr'로 변경
  const htmlElement = document.documentElement;
  if (htmlElement) {
    const currentLang = htmlElement.getAttribute('lang');
    console.log('Wplace Plus: 현재 언어:', currentLang);
    
    if (currentLang !== 'kr') {
      htmlElement.setAttribute('lang', 'kr');
      console.log('Wplace Plus: 언어가 한국어(kr)로 변경되었습니다.');
      
      // 변경 이벤트 발생
      const event = new CustomEvent('languageChanged', {
        detail: { 
          from: currentLang, 
          to: 'kr' 
        }
      });
      document.dispatchEvent(event);
    } else {
      console.log('Wplace Plus: 이미 한국어로 설정되어 있습니다.');
    }
  } else {
    console.error('Wplace Plus: HTML 요소를 찾을 수 없습니다.');
  }
}

// DOM이 로드되기 전에 즉시 실행
changeLanguageToKorean();

// DOM이 완전히 로드된 후에도 다시 한 번 확인
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', changeLanguageToKorean);
} else {
  changeLanguageToKorean();
}

// 페이지 로드 완료 후에도 확인 (SPA 환경 대응)
window.addEventListener('load', changeLanguageToKorean);

// DOM 변경 감지 (SPA 환경에서 페이지가 동적으로 변경되는 경우 대응)
const languageObserver = new MutationObserver((mutations) => {
  let shouldCheckLanguage = false;
  
  mutations.forEach((mutation) => {
    // HTML 요소의 속성이 변경되었는지 확인
    if (mutation.type === 'attributes' && 
        mutation.target === document.documentElement && 
        mutation.attributeName === 'lang') {
      shouldCheckLanguage = true;
    }
    
    // HTML 요소 자체가 변경되었는지 확인
    if (mutation.type === 'childList' && 
        mutation.target === document.documentElement) {
      shouldCheckLanguage = true;
    }
  });
  
  if (shouldCheckLanguage) {
    console.log('Wplace Plus: HTML 변경 감지, 언어 재확인');
    setTimeout(changeLanguageToKorean, 100);
  }
});

// HTML 요소 관찰 시작
languageObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['lang'],
  childList: true,
  subtree: false
});

// 페이지 언로드 시 관찰자 정리
window.addEventListener('beforeunload', () => {
  if (languageObserver) {
    languageObserver.disconnect();
  }
});

// 언어 변경 이벤트 리스너 (다른 스크립트에서 사용할 수 있도록)
document.addEventListener('languageChanged', (event) => {
  console.log('Wplace Plus: 언어 변경 이벤트 발생:', event.detail);
});

// 전역 함수로 노출 (다른 스크립트에서 호출 가능)
window.wplacePlusLanguageChanger = {
  changeToKorean: changeLanguageToKorean,
  getCurrentLanguage: () => document.documentElement.getAttribute('lang')
};
