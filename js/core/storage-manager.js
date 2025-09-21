// Chrome Storage API 통합 관리 클래스
class StorageManager {
  constructor() {
    this.storageKey = 'wplace_plus_projects';
  }

  // 프로젝트 목록 저장
  async saveProjectList(projects) {
    try {
      await chrome.storage.local.set({ [this.storageKey]: projects });
      console.log('Wplace Plus: 프로젝트 목록 저장 완료');
      return true;
    } catch (error) {
      console.error('Wplace Plus: 프로젝트 목록 저장 실패:', error);
      return false;
    }
  }

  // 프로젝트 목록 로드
  async loadProjectList() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      const projects = result[this.storageKey] || [];
      console.log('Wplace Plus: 프로젝트 목록 로드 완료');
      return projects;
    } catch (error) {
      console.error('Wplace Plus: 프로젝트 목록 로드 실패:', error);
      return [];
    }
  }

  // 개별 프로젝트 저장
  async saveProject(projectId, projectData) {
    try {
      const key = `wplace_plus_project_${projectId}`;
      await chrome.storage.local.set({ [key]: projectData });
      console.log(`Wplace Plus: 프로젝트 저장 완료 - ${projectId}`);
      return true;
    } catch (error) {
      console.error(`Wplace Plus: 프로젝트 저장 실패 - ${projectId}:`, error);
      return false;
    }
  }

  // 개별 프로젝트 로드
  async loadProject(projectId) {
    try {
      const key = `wplace_plus_project_${projectId}`;
      const result = await chrome.storage.local.get(key);
      const projectData = result[key] || null;
      console.log(`Wplace Plus: 프로젝트 로드 완료 - ${projectId}`);
      return projectData;
    } catch (error) {
      console.error(`Wplace Plus: 프로젝트 로드 실패 - ${projectId}:`, error);
      return null;
    }
  }

  // 프로젝트 삭제
  async deleteProject(projectId) {
    try {
      const key = `wplace_plus_project_${projectId}`;
      await chrome.storage.local.remove(key);
      console.log(`Wplace Plus: 프로젝트 삭제 완료 - ${projectId}`);
      return true;
    } catch (error) {
      console.error(`Wplace Plus: 프로젝트 삭제 실패 - ${projectId}:`, error);
      return false;
    }
  }

  // 중심점 좌표 저장
  async saveCenterPoint(projectId, coordinates) {
    try {
      const projectData = await this.loadProject(projectId);
      if (!projectData) {
        console.warn(`Wplace Plus: 프로젝트를 찾을 수 없어서 중심점 좌표를 저장할 수 없습니다 - ${projectId}`);
        return false;
      }

      if (!projectData.data) {
        projectData.data = {};
      }
      projectData.data.centerPoint = coordinates;
      projectData.updatedAt = new Date().toISOString();

      await this.saveProject(projectId, projectData);
      console.log(`Wplace Plus: 중심점 좌표 저장 완료 - ${projectId}:`, coordinates);
      return true;
    } catch (error) {
      console.error(`Wplace Plus: 중심점 좌표 저장 실패 - ${projectId}:`, error);
      return false;
    }
  }

  // 중심점 좌표 로드
  async loadCenterPoint(projectId) {
    try {
      const projectData = await this.loadProject(projectId);
      if (!projectData || !projectData.data || !projectData.data.centerPoint) {
        return null;
      }
      return projectData.data.centerPoint;
    } catch (error) {
      console.error(`Wplace Plus: 중심점 좌표 로드 실패 - ${projectId}:`, error);
      return null;
    }
  }

  // 이미지 데이터 저장
  async saveImageData(projectId, imageData) {
    try {
      const projectData = await this.loadProject(projectId);
      if (!projectData) {
        console.warn(`Wplace Plus: 프로젝트를 찾을 수 없어서 이미지 데이터를 저장할 수 없습니다 - ${projectId}`);
        return false;
      }

      if (!projectData.data) {
        projectData.data = {};
      }
      projectData.data.imageData = imageData;
      projectData.updatedAt = new Date().toISOString();

      await this.saveProject(projectId, projectData);
      console.log(`Wplace Plus: 이미지 데이터 저장 완료 - ${projectId}`);
      return true;
    } catch (error) {
      console.error(`Wplace Plus: 이미지 데이터 저장 실패 - ${projectId}:`, error);
      return false;
    }
  }

  // 이미지 데이터 로드
  async loadImageData(projectId) {
    try {
      const projectData = await this.loadProject(projectId);
      if (!projectData || !projectData.data || !projectData.data.imageData) {
        return null;
      }
      return projectData.data.imageData;
    } catch (error) {
      console.error(`Wplace Plus: 이미지 데이터 로드 실패 - ${projectId}:`, error);
      return null;
    }
  }

  // 프로젝트 데이터 업데이트
  async updateProjectData(projectId, updates) {
    try {
      const projectData = await this.loadProject(projectId);
      if (!projectData) {
        console.warn(`Wplace Plus: 프로젝트를 찾을 수 없어서 업데이트할 수 없습니다 - ${projectId}`);
        return false;
      }

      // 프로젝트 데이터 업데이트
      Object.assign(projectData, updates);
      projectData.updatedAt = new Date().toISOString();

      await this.saveProject(projectId, projectData);
      console.log(`Wplace Plus: 프로젝트 데이터 업데이트 완료 - ${projectId}`);
      return true;
    } catch (error) {
      console.error(`Wplace Plus: 프로젝트 데이터 업데이트 실패 - ${projectId}:`, error);
      return false;
    }
  }

  // 모든 프로젝트 데이터 정리
  async clearAllProjects() {
    try {
      await chrome.storage.local.clear();
      console.log('Wplace Plus: 모든 프로젝트 데이터 정리 완료');
      return true;
    } catch (error) {
      console.error('Wplace Plus: 모든 프로젝트 데이터 정리 실패:', error);
      return false;
    }
  }
}

// 전역 StorageManager 인스턴스
const storageManager = new StorageManager();
