import { getConfiguredApiBase } from '../../shared/api';
import { apiRoutes } from '../../shared/apiRoutes';

export async function downloadWorkspaceExport() {
  const apiBase = getConfiguredApiBase();
  if (!apiBase) {
    throw new Error('Set a backend URL on mobile before exporting the workspace.');
  }

  const response = await fetch(`${apiBase}${apiRoutes.exportWorkspace}`);
  if (!response.ok) {
    throw new Error('Workspace export failed.');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `tasklist-workspace-${today}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
