// 모달 복원 관리
// Version: 0.0.2

// 열려있던 모달들 복원
async function restoreOpenModals() {
  if (typeof projectManager === 'undefined') {
    console.error('Wplace Plus: projectManager가 아직 로드되지 않았습니다');
    return;
  }

  await projectManager.loadProjects(); // 먼저 프로젝트를 로드
  const projects = projectManager.projects; // 로드된 프로젝트 배열 사용
  
  for (const projectMeta of projects) {
    const projectInstance = await projectManager.getProjectInstance(projectMeta.id);
    if (!projectInstance || !projectInstance.data) continue;

    const ui = projectInstance.data.ui || {};
    const panels = ui.panels || {};
    const overlay = panels.overlay || {};
    
    // 오버레이 패널이 열려있었다면 복원 (최소화 상태 포함)
    if (overlay.visible) {
      console.log(`Wplace Plus: 프로젝트 "${projectInstance.data.name}" 모달 복원 (최소화 상태: ${overlay.collapsed})`);
      projectManager.openProject(projectInstance.data.id);
    }
  }
}

// 전역으로 내보내기
window.restoreOpenModals = restoreOpenModals;
