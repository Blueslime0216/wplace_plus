// 이미지 업로드 및 색상 변환 기능
class ImageUploadManager {
  constructor() {
    this.selectedFreeColors = new Set();
    this.selectedPaidColors = new Set();
    this.originalImageData = null;
    this.processedImageData = null;
    this.imageCanvas = null;
    this.imageContext = null;
    this.currentProjectId = null;
    
    // 색상 팔레트가 로드된 후 초기화
    this.initializeColors();
  }

  // 색상 초기화
  initializeColors() {
    if (typeof DEFAULT_FREE_KEYS !== 'undefined') {
      this.selectedFreeColors = new Set(DEFAULT_FREE_KEYS);
    }
  }

  // 프로젝트 ID 설정
  async setProjectId(projectId) {
    this.currentProjectId = projectId;
    await this.loadProjectData();
  }

  // 프로젝트 데이터 로드
  async loadProjectData() {
    if (!this.currentProjectId) {
      console.log('Wplace Plus: 프로젝트 ID가 없어서 데이터를 로드할 수 없습니다');
      return;
    }

    try {
      const projectData = localStorage.getItem(`wplace_plus_project_${this.currentProjectId}`);
      if (projectData) {
        const data = JSON.parse(projectData);
        
        // 색상 선택 상태 복원
        if (data.selectedFreeColors && Array.isArray(data.selectedFreeColors)) {
          this.selectedFreeColors = new Set(data.selectedFreeColors);
        }
        if (data.selectedPaidColors && Array.isArray(data.selectedPaidColors)) {
          this.selectedPaidColors = new Set(data.selectedPaidColors);
        }
        
        // 이미지 데이터 복원 (비동기)
        if (data.originalImageData && typeof data.originalImageData === 'string') {
          try {
            this.originalImageData = await this.dataURLToImageDataAsync(data.originalImageData);
            console.log('Wplace Plus: 원본 이미지 데이터 복원 완료');
          } catch (error) {
            console.error('Wplace Plus: 원본 이미지 데이터 복원 실패:', error);
          }
        }
        if (data.processedImageData && typeof data.processedImageData === 'string') {
          try {
            this.processedImageData = await this.dataURLToImageDataAsync(data.processedImageData);
            console.log('Wplace Plus: 처리된 이미지 데이터 복원 완료');
          } catch (error) {
            console.error('Wplace Plus: 처리된 이미지 데이터 복원 실패:', error);
          }
        }
      } else {
        console.log('Wplace Plus: 저장된 프로젝트 데이터가 없습니다');
      }
    } catch (error) {
      console.error('Wplace Plus: 프로젝트 데이터 로드 실패:', error);
    }
  }

  // 프로젝트 데이터 저장
  saveProjectData() {
    if (!this.currentProjectId) return;

    try {
      const data = {
        selectedFreeColors: Array.from(this.selectedFreeColors),
        selectedPaidColors: Array.from(this.selectedPaidColors),
        originalImageData: this.originalImageData ? this.imageDataToDataURL(this.originalImageData) : null,
        processedImageData: this.processedImageData ? this.imageDataToDataURL(this.processedImageData) : null
      };
      
      localStorage.setItem(`wplace_plus_project_${this.currentProjectId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Wplace Plus: 프로젝트 데이터 저장 실패:', error);
    }
  }

  // DataURL을 ImageData로 변환 (비동기)
  dataURLToImageDataAsync(dataURL) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          resolve(imageData);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = (error) => {
        console.error('Wplace Plus: 이미지 로드 실패:', error);
        reject(error);
      };
      img.src = dataURL;
    });
  }

  // 이미지 업로드 처리
  async handleImageUpload(file) {
    try {
      const imageData = await this.fileToImageData(file);
      this.originalImageData = imageData;
      
      // 기준 좌표 가져오기 (positionCapture 초기화 대기)
      let anchorCoords = null;
      if (window.positionCapture) {
        anchorCoords = window.positionCapture.getCurrentCoordinates();
      } else {
        // positionCapture가 아직 초기화되지 않았다면 잠시 대기
        await new Promise(resolve => {
          const checkPositionCapture = () => {
            if (window.positionCapture) {
              anchorCoords = window.positionCapture.getCurrentCoordinates();
              resolve();
            } else {
              setTimeout(checkPositionCapture, 100);
            }
          };
          checkPositionCapture();
        });
      }
      
      if (!anchorCoords) {
        alert('오버레이를 위한 기준점 좌표가 설정되지 않았습니다. 먼저 캔버스에서 위치를 캡처해주세요.');
        return null;
      }
      
      // 이미지 타일화 처리
      const chunkedTiles = await this.preProcessImageForTiling(this.originalImageData, anchorCoords);
      
      this.processedImageData = this.processImageWithPalette(imageData);
      
      // 새 오버레이 객체 생성
      const newOverlay = {
        id: `overlay_${Date.now()}`,
        name: file.name,
        enabled: true,
        opacity: 0.7,
        originalImage: this.imageDataToDataURL(this.originalImageData),
        anchor: anchorCoords,
        chunkedTiles: chunkedTiles
      };
      
      // projectManager를 통해 오버레이 추가
      const project = projectManager.getProject(this.currentProjectId);
      if (project) {
        if (!project.data.overlays) {
          project.data.overlays = [];
        }
        // 현재는 하나의 오버레이만 관리하도록 기존 것을 대체
        project.data.overlays = [newOverlay];
        await projectManager.saveProjects();
        console.log('Wplace Plus: 새 오버레이가 프로젝트에 저장되었습니다.');
      }
      
      return {
        original: this.originalImageData,
        processed: this.processedImageData
      };
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      throw error;
    }
  }

  // 파일을 ImageData로 변환
  async fileToImageData(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // 팔레트 색상으로 이미지 처리
  processImageWithPalette(imageData) {
    const { data, width, height } = imageData;
    const processedData = new Uint8ClampedArray(data);
    
    // 선택된 색상들만 사용
    const availableColors = [
      ...Array.from(this.selectedFreeColors).map(colorKeyToRgb),
      ...Array.from(this.selectedPaidColors).map(colorKeyToRgb)
    ];

    // 선택된 색상이 없으면 원본 이미지를 그대로 반환
    if (availableColors.length === 0) {
      return new ImageData(data, width, height);
    }

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a === 0) continue; // 투명 픽셀은 건드리지 않음

      // 가장 가까운 색상 찾기
      const closestColor = this.findClosestColor(r, g, b, availableColors);
      
      processedData[i] = closestColor[0];     // R
      processedData[i + 1] = closestColor[1]; // G
      processedData[i + 2] = closestColor[2]; // B
      // A는 그대로 유지
    }

    return new ImageData(processedData, width, height);
  }

  // 가장 가까운 색상 찾기 (유클리드 거리)
  findClosestColor(r, g, b, palette) {
    // 팔레트가 비어있거나 유효하지 않은 경우 원본 색상 반환
    if (!palette || palette.length === 0) {
      return [r, g, b];
    }

    let minDistance = Infinity;
    let closestColor = palette[0];

    for (const [pr, pg, pb] of palette) {
      const distance = Math.sqrt(
        Math.pow(r - pr, 2) + Math.pow(g - pg, 2) + Math.pow(b - pb, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = [pr, pg, pb];
      }
    }

    return closestColor;
  }

  // 색상 선택 상태 업데이트
  updateColorSelection(freeColors, paidColors) {
    this.selectedFreeColors = new Set(freeColors);
    this.selectedPaidColors = new Set(paidColors);
    
    // 이미지가 있으면 다시 처리
    if (this.originalImageData) {
      this.processedImageData = this.processImageWithPalette(this.originalImageData);
    }
    
    // 프로젝트 데이터 저장
    this.saveProjectData();
  }

  // 이미지를 타일 조각으로 사전 처리하는 함수
  async preProcessImageForTiling(imageData, anchorCoords) {
    if (!imageData || !anchorCoords) {
      throw new Error('타일화 처리를 위한 이미지 데이터 또는 기준 좌표가 없습니다.');
    }

    const TILE_SIZE = 1000;
    const { width, height } = imageData;
    const { x: anchorX, y: anchorY } = anchorCoords;

    const chunkedTiles = {};
    const startTileX = Math.floor(anchorX / TILE_SIZE);
    const startTileY = Math.floor(anchorY / TILE_SIZE);
    const endTileX = Math.floor((anchorX + width - 1) / TILE_SIZE);
    const endTileY = Math.floor((anchorY + height - 1) / TILE_SIZE);

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCtx.putImageData(imageData, 0, 0);

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tileOriginX = tx * TILE_SIZE;
        const tileOriginY = ty * TILE_SIZE;

        // 원본 이미지에서 현재 타일과 겹치는 영역 계산
        const sx = Math.max(0, tileOriginX - anchorX);
        const sy = Math.max(0, tileOriginY - anchorY);
        const sWidth = Math.min(width - sx, TILE_SIZE - (anchorX - tileOriginX + sx));
        const sHeight = Math.min(height - sy, TILE_SIZE - (anchorY - tileOriginY + sy));
        
        if (sWidth <= 0 || sHeight <= 0) continue;

        // 타일 내에서 이미지가 그려질 위치
        const dx = Math.max(0, anchorX - tileOriginX);
        const dy = Math.max(0, anchorY - tileOriginY);
        
        const chunkCanvas = document.createElement('canvas');
        chunkCanvas.width = TILE_SIZE;
        chunkCanvas.height = TILE_SIZE;
        const chunkCtx = chunkCanvas.getContext('2d');

        // 원본 이미지의 해당 부분을 잘라내어 청크 캔버스에 그리기
        chunkCtx.drawImage(tempCanvas, sx, sy, sWidth, sHeight, dx, dy, sWidth, sHeight);
        
        const tileKey = `${String(tx).padStart(4, '0')},${String(ty).padStart(4, '0')}`;
        chunkedTiles[tileKey] = chunkCanvas.toDataURL('image/png');
      }
    }
    
    return chunkedTiles;
  }

  // ImageData를 Canvas에 그리기
  drawImageToCanvas(imageData, canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);
  }

  // ImageData를 DataURL로 변환
  imageDataToDataURL(imageData) {
    const canvas = document.createElement('canvas');
    this.drawImageToCanvas(imageData, canvas);
    return canvas.toDataURL('image/png');
  }

  // 색상 팔레트 HTML 생성
  generateColorPaletteHTML() {
    // 색상 팔레트가 로드되지 않은 경우 빈 HTML 반환
    if (typeof WPLACE_FREE === 'undefined' || typeof WPLACE_PAID === 'undefined') {
      return '<div class="text-xs text-base-content/60">색상 팔레트를 로드하는 중...</div>';
    }

    return `
      <div class="wplace_plus_color_palette_section">
        <!-- 헤더 섹션 -->
        <div class="wplace_plus_palette_header">
          <h5 class="wplace_plus_palette_title">색상 팔레트</h5>
          <div class="wplace_plus_toggle_buttons">
            <button class="btn btn-xs btn-ghost" id="toggle-all-free">
              무료 전체
            </button>
            <button class="btn btn-xs btn-ghost" id="toggle-all-paid">
              유료 전체
            </button>
          </div>
        </div>
        
        <!-- 색상 그리드 섹션 -->
        <div class="wplace_plus_color_sections">
          <!-- 무료 색상 섹션 -->
          <div class="wplace_plus_color_section">
            <div class="wplace_plus_section_header">
              <span class="wplace_plus_section_title">무료 색상</span>
              <span class="wplace_plus_color_count" id="free-color-count">0/0</span>
            </div>
            <div class="wplace_plus_color_grid_compact" id="free-color-grid">
              ${this.generateColorGridHTML(WPLACE_FREE, this.selectedFreeColors, 'free')}
            </div>
          </div>
          
          <!-- 유료 색상 섹션 -->
          <div class="wplace_plus_color_section">
            <div class="wplace_plus_section_header">
              <span class="wplace_plus_section_title">유료 색상</span>
              <span class="wplace_plus_color_count" id="paid-color-count">0/0</span>
            </div>
            <div class="wplace_plus_color_grid_compact" id="paid-color-grid">
              ${this.generateColorGridHTML(WPLACE_PAID, this.selectedPaidColors, 'paid')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 색상 그리드 HTML 생성
  generateColorGridHTML(colors, selectedColors, type) {
    if (!colors || !Array.isArray(colors)) {
      return '';
    }

    return colors.map((color, index) => {
      // 색상 배열이 올바른지 확인
      if (!Array.isArray(color) || color.length < 3) {
        return '';
      }

      const [r, g, b] = color;
      const colorKey = `${r},${g},${b}`;
      const isSelected = selectedColors && selectedColors.has(colorKey);
      const colorName = (typeof WPLACE_NAMES !== 'undefined' && WPLACE_NAMES[colorKey]) || colorKey;
      const hexColor = (typeof rgbToHex !== 'undefined') ? rgbToHex(r, g, b) : `rgb(${r},${g},${b})`;
      
      return `
        <button class="wplace_plus_color_cell_compact ${isSelected ? 'selected' : ''}" 
                data-color-key="${colorKey}" 
                data-type="${type}"
                style="background-color: ${hexColor}"
                title="${colorName}">
          ${isSelected ? `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-2 text-white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          ` : ''}
        </button>
      `;
    }).join('');
  }

  // 색상 팔레트 이벤트 설정
  setupColorPaletteEvents(container) {
    if (!container) return;

    // 이미 설정된 경우 중복 설정 방지
    if (container.dataset.eventsSetup === 'true') {
      return;
    }

    // 개별 색상 클릭 이벤트
    container.addEventListener('click', (e) => {
      const colorCell = e.target.closest('.wplace_plus_color_cell_compact');
      if (!colorCell) return;

      const colorKey = colorCell.dataset.colorKey;
      const type = colorCell.dataset.type;
      
      if (!colorKey || !type) return;
      
      if (type === 'free') {
        if (this.selectedFreeColors.has(colorKey)) {
          this.selectedFreeColors.delete(colorKey);
        } else {
          this.selectedFreeColors.add(colorKey);
        }
      } else if (type === 'paid') {
        if (this.selectedPaidColors.has(colorKey)) {
          this.selectedPaidColors.delete(colorKey);
        } else {
          this.selectedPaidColors.add(colorKey);
        }
      }

      // UI 업데이트
      this.updateColorPaletteUI(container);
      this.updateColorCounts(container);
      
      // 이미지 다시 처리
      if (this.originalImageData) {
        this.processedImageData = this.processImageWithPalette(this.originalImageData);
        if (this.onImageProcessed) {
          this.onImageProcessed(this.processedImageData);
        }
      }
      
      // 프로젝트 데이터 저장
      this.saveProjectData();
    });

    // 전체 선택/해제 버튼
    const toggleFreeBtn = container.querySelector('#toggle-all-free');
    const togglePaidBtn = container.querySelector('#toggle-all-paid');

    if (toggleFreeBtn && typeof DEFAULT_FREE_KEYS !== 'undefined') {
      toggleFreeBtn.addEventListener('click', () => {
        const allFreeSelected = DEFAULT_FREE_KEYS.every(key => this.selectedFreeColors.has(key));
        if (allFreeSelected) {
          this.selectedFreeColors.clear();
        } else {
          DEFAULT_FREE_KEYS.forEach(key => this.selectedFreeColors.add(key));
        }
        this.updateColorPaletteUI(container);
        this.updateColorCounts(container);
        this.updateProcessedImage();
        this.saveProjectData();
      });
    }

    if (togglePaidBtn && typeof DEFAULT_PAID_KEYS !== 'undefined') {
      togglePaidBtn.addEventListener('click', () => {
        const allPaidSelected = DEFAULT_PAID_KEYS.every(key => this.selectedPaidColors.has(key));
        if (allPaidSelected) {
          this.selectedPaidColors.clear();
        } else {
          DEFAULT_PAID_KEYS.forEach(key => this.selectedPaidColors.add(key));
        }
        this.updateColorPaletteUI(container);
        this.updateColorCounts(container);
        this.updateProcessedImage();
        this.saveProjectData();
      });
    }

    // 이벤트 설정 완료 표시
    container.dataset.eventsSetup = 'true';
    
    // 색상 팔레트가 로드된 후 개수 업데이트
    this.updateColorCounts(container);
  }

  // 색상 팔레트 UI 업데이트
  updateColorPaletteUI(container) {
    if (!container) return;

    // 무료 색상 그리드 업데이트
    const freeGrid = container.querySelector('#free-color-grid');
    if (freeGrid && typeof WPLACE_FREE !== 'undefined') {
      freeGrid.innerHTML = this.generateColorGridHTML(WPLACE_FREE, this.selectedFreeColors, 'free');
    }

    // 유료 색상 그리드 업데이트
    const paidGrid = container.querySelector('#paid-color-grid');
    if (paidGrid && typeof WPLACE_PAID !== 'undefined') {
      paidGrid.innerHTML = this.generateColorGridHTML(WPLACE_PAID, this.selectedPaidColors, 'paid');
    }

    // 버튼 텍스트 업데이트
    const toggleFreeBtn = container.querySelector('#toggle-all-free');
    const togglePaidBtn = container.querySelector('#toggle-all-paid');

    if (toggleFreeBtn && typeof DEFAULT_FREE_KEYS !== 'undefined') {
      const allFreeSelected = DEFAULT_FREE_KEYS.every(key => this.selectedFreeColors.has(key));
      toggleFreeBtn.textContent = allFreeSelected ? '무료 해제' : '무료 전체';
    }

    if (togglePaidBtn && typeof DEFAULT_PAID_KEYS !== 'undefined') {
      const allPaidSelected = DEFAULT_PAID_KEYS.every(key => this.selectedPaidColors.has(key));
      togglePaidBtn.textContent = allPaidSelected ? '유료 해제' : '유료 전체';
    }

    // 색상 개수 업데이트
    this.updateColorCounts(container);
  }

  // 색상 개수 업데이트
  updateColorCounts(container) {
    const freeCountElement = container.querySelector('#free-color-count');
    const paidCountElement = container.querySelector('#paid-color-count');
    
    if (freeCountElement) {
      const freeCount = this.selectedFreeColors.size;
      const totalFree = typeof WPLACE_FREE !== 'undefined' ? WPLACE_FREE.length : 0;
      freeCountElement.textContent = `${freeCount}/${totalFree}`;
    }
    
    if (paidCountElement) {
      const paidCount = this.selectedPaidColors.size;
      const totalPaid = typeof WPLACE_PAID !== 'undefined' ? WPLACE_PAID.length : 0;
      paidCountElement.textContent = `${paidCount}/${totalPaid}`;
    }
  }

  // 처리된 이미지 업데이트
  updateProcessedImage() {
    if (this.originalImageData) {
      this.processedImageData = this.processImageWithPalette(this.originalImageData);
      this.onImageProcessed?.(this.processedImageData);
      this.saveProjectData();
    }
  }

  // 이미지 처리 완료 콜백 설정
  setOnImageProcessed(callback) {
    this.onImageProcessed = callback;
  }

  // 현재 선택된 색상들 반환
  getSelectedColors() {
    return {
      free: Array.from(this.selectedFreeColors),
      paid: Array.from(this.selectedPaidColors)
    };
  }

  // 색상 선택 상태 복원
  restoreColorSelection(freeColors, paidColors) {
    this.selectedFreeColors = new Set(freeColors || DEFAULT_FREE_KEYS);
    this.selectedPaidColors = new Set(paidColors || []);
  }
}

// 전역 ImageUploadManager 인스턴스
const imageUploadManager = new ImageUploadManager();
