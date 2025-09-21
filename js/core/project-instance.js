// 프로젝트별 독립적인 상태 관리 클래스
class ProjectInstance {
  constructor(projectId) {
    this.projectId = projectId;
    this.isLoaded = false;
    this.data = null;
    this.modal = null;
    this.eventListeners = new Map();
    
    // 프로젝트별 독립적인 이미지 관리자
    this.imageManager = {
      originalImageData: null,
      processedImageData: null,
      selectedFreeColors: new Set(),
      selectedPaidColors: new Set()
    };
    
    // 프로젝트별 독립적인 위치 캡처 상태
    this.positionCapture = {
      isEnabled: false,
      currentCoordinates: null
    };
  }

  // 프로젝트 데이터 로드
  async load() {
    try {
      console.log(`Wplace Plus: 프로젝트 데이터 로드 시작 - ${this.projectId}`);
      
      // StorageManager를 통해 프로젝트 데이터 로드
      this.data = await storageManager.loadProject(this.projectId);
      
      if (!this.data) {
        console.log(`Wplace Plus: 프로젝트 데이터가 없습니다 - ${this.projectId}`);
        this.isLoaded = true;
        return;
      }

      // 이미지 데이터 복원
      if (this.data.data && this.data.data.imageData) {
        this.imageManager = {
          ...this.imageManager,
          ...this.data.data.imageData
        };
        
        // Set 객체로 변환
        if (this.imageManager.selectedFreeColors) {
          this.imageManager.selectedFreeColors = new Set(this.imageManager.selectedFreeColors);
        }
        if (this.imageManager.selectedPaidColors) {
          this.imageManager.selectedPaidColors = new Set(this.imageManager.selectedPaidColors);
        }
      }

      // 중심점 좌표 복원
      if (this.data.data && this.data.data.centerPoint) {
        this.positionCapture.currentCoordinates = this.data.data.centerPoint;
      }

      this.isLoaded = true;
      console.log(`Wplace Plus: 프로젝트 데이터 로드 완료 - ${this.projectId}`);
    } catch (error) {
      console.error(`Wplace Plus: 프로젝트 데이터 로드 실패 - ${this.projectId}:`, error);
      this.isLoaded = true; // 에러가 발생해도 로드 완료로 처리
    }
  }

  // 프로젝트 데이터 저장
  async save() {
    try {
      if (!this.data) {
        console.warn(`Wplace Plus: 저장할 프로젝트 데이터가 없습니다 - ${this.projectId}`);
        return false;
      }

      // 이미지 데이터를 프로젝트 데이터에 병합
      if (!this.data.data) {
        this.data.data = {};
      }
      
      this.data.data.imageData = {
        originalImageData: this.imageManager.originalImageData,
        processedImageData: this.imageManager.processedImageData,
        selectedFreeColors: Array.from(this.imageManager.selectedFreeColors),
        selectedPaidColors: Array.from(this.imageManager.selectedPaidColors)
      };

      // 중심점 좌표 저장
      if (this.positionCapture.currentCoordinates) {
        this.data.data.centerPoint = this.positionCapture.currentCoordinates;
      }

      this.data.updatedAt = new Date().toISOString();

      const success = await storageManager.saveProject(this.projectId, this.data);
      if (success) {
        console.log(`Wplace Plus: 프로젝트 데이터 저장 완료 - ${this.projectId}`);
      }
      return success;
    } catch (error) {
      console.error(`Wplace Plus: 프로젝트 데이터 저장 실패 - ${this.projectId}:`, error);
      return false;
    }
  }

  // 이미지 데이터 설정
  setImageData(originalImageData, processedImageData) {
    this.imageManager.originalImageData = originalImageData;
    this.imageManager.processedImageData = processedImageData;
    this.save(); // 자동 저장
  }

  // 색상 선택 상태 설정
  setColorSelection(freeColors, paidColors) {
    this.imageManager.selectedFreeColors = new Set(freeColors);
    this.imageManager.selectedPaidColors = new Set(paidColors);
    this.save(); // 자동 저장
  }

  // 중심점 좌표 설정
  setCenterPoint(coordinates) {
    this.positionCapture.currentCoordinates = coordinates;
    this.save(); // 자동 저장
  }

  // 프로젝트 데이터 업데이트
  async updateData(updates) {
    try {
      if (!this.data) {
        this.data = this.createDefaultProjectData();
      }

      Object.assign(this.data, updates);
      this.data.updatedAt = new Date().toISOString();

      const success = await storageManager.saveProject(this.projectId, this.data);
      if (success) {
        console.log(`Wplace Plus: 프로젝트 데이터 업데이트 완료 - ${this.projectId}`);
      }
      return success;
    } catch (error) {
      console.error(`Wplace Plus: 프로젝트 데이터 업데이트 실패 - ${this.projectId}:`, error);
      return false;
    }
  }

  // 기본 프로젝트 데이터 생성
  createDefaultProjectData() {
    return {
      id: this.projectId,
      name: `프로젝트 ${this.projectId}`,
      description: '',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {
        overlays: [],
        completedPixels: {
          enabled: false,
          settings: {
            highlightColor: '#00ff00',
            opacity: 0.5
          }
        },
        colorFilter: {
          enabled: false,
          settings: {
            mode: 'monochrome',
            color: '#000000',
            intensity: 0.5
          }
        },
        autoTool: {
          enabled: false
        }
      },
      ui: {
        activeTool: 'line-tool',
        panels: {
          overlay: {
            visible: false,
            position: { x: 100, y: 100 },
            size: { width: 400, height: 500 },
            collapsed: false
          }
        }
      }
    };
  }

  // 이벤트 리스너 추가
  addEventListener(element, event, handler, options = {}) {
    const key = `${event}_${Date.now()}_${Math.random()}`;
    element.addEventListener(event, handler, options);
    this.eventListeners.set(key, { element, event, handler, options });
    return key;
  }

  // 이벤트 리스너 제거
  removeEventListener(key) {
    const listener = this.eventListeners.get(key);
    if (listener) {
      listener.element.removeEventListener(listener.event, listener.handler, listener.options);
      this.eventListeners.delete(key);
    }
  }

  // 모든 이벤트 리스너 정리
  cleanupEventListeners() {
    this.eventListeners.forEach((listener, key) => {
      listener.element.removeEventListener(listener.event, listener.handler, listener.options);
    });
    this.eventListeners.clear();
  }

  // 모달 설정
  setModal(modal) {
    this.modal = modal;
  }

  // 모달 정리
  cleanupModal() {
    if (this.modal) {
      this.cleanupEventListeners();
      this.modal = null;
    }
  }

  // 프로젝트 인스턴스 정리
  async cleanup() {
    try {
      // 마지막으로 데이터 저장
      await this.save();
      
      // 모달 정리
      this.cleanupModal();
      
      console.log(`Wplace Plus: 프로젝트 인스턴스 정리 완료 - ${this.projectId}`);
    } catch (error) {
      console.error(`Wplace Plus: 프로젝트 인스턴스 정리 실패 - ${this.projectId}:`, error);
    }
  }
}
