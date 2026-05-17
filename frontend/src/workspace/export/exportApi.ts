export async function downloadWorkspaceExport() {
  const response = await fetch('http://localhost:4000/api/workspace/export');
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
