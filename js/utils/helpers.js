// 유틸리티 함수들

// DOM 요소 생성 헬퍼
function createElement(tag, className, innerHTML) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
}

// 클래스 토글 헬퍼
function toggleClass(element, className) {
  if (element) {
    element.classList.toggle(className);
  }
}

// 요소 표시/숨김 헬퍼
function showElement(element) {
  if (element) {
    element.style.display = '';
    element.classList.remove('hidden');
  }
}

function hideElement(element) {
  if (element) {
    element.style.display = 'none';
    element.classList.add('hidden');
  }
}

// 로컬 스토리지 헬퍼
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Storage save error:', error);
    return false;
  }
}

function loadFromStorage(key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Storage load error:', error);
    return defaultValue;
  }
}

// 이벤트 리스너 헬퍼
function addEventListeners(element, events, handler) {
  if (!element || !events || !handler) return;
  
  const eventArray = Array.isArray(events) ? events : [events];
  eventArray.forEach(event => {
    element.addEventListener(event, handler);
  });
}

function removeEventListeners(element, events, handler) {
  if (!element || !events || !handler) return;
  
  const eventArray = Array.isArray(events) ? events : [events];
  eventArray.forEach(event => {
    element.removeEventListener(event, handler);
  });
}

// 디바운스 함수
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 스로틀 함수
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 요소 위치 계산 헬퍼
function getElementPosition(element) {
  if (!element) return { top: 0, left: 0, width: 0, height: 0 };
  
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height
  };
}

// 뷰포트 내 요소 확인
function isElementInViewport(element) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// 색상 유틸리티
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// 파일 유틸리티
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

function isValidImageFile(filename) {
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const extension = getFileExtension(filename).toLowerCase();
  return validExtensions.includes(extension);
}

// 날짜 포맷팅
function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

// 문자열 유틸리티
function truncateString(str, maxLength, suffix = '...') {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 배열 유틸리티
function removeDuplicates(array, key = null) {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = typeof item === 'object' ? item[key] : item;
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

// 객체 유틸리티
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

// 에러 핸들링
function handleError(error, context = '') {
  console.error(`Wplace Plus Error${context ? ` (${context})` : ''}:`, error);
  
  // 사용자에게 에러 알림 (선택사항)
  if (window.showNotification) {
    window.showNotification('오류가 발생했습니다. 콘솔을 확인해주세요.', 'error');
  }
}

// 성공 메시지
function showSuccess(message) {
  console.log('Wplace Plus Success:', message);
  
  if (window.showNotification) {
    window.showNotification(message, 'success');
  }
}

// 정보 메시지
function showInfo(message) {
  console.log('Wplace Plus Info:', message);
  
  if (window.showNotification) {
    window.showNotification(message, 'info');
  }
}
