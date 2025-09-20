// Wplace Plus Background Script

// 확장 프로그램이 설치되거나 업데이트될 때 실행
chrome.runtime.onInstalled.addListener(() => {
  console.log('Wplace Plus Background Script 초기화');
});

// wplace.live 탭이 업데이트될 때 fetch-hook.js를 주입
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('wplace.live')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['js/features/fetch-hook.js'],
      world: 'MAIN',
    }).then(() => {
      console.log('Wplace Plus: fetch-hook.js가 성공적으로 주입되었습니다.');
    }).catch(err => {
      console.error('Wplace Plus: fetch-hook.js 주입 실패:', err);
    });
  }
});
