const BASE = '/api/files';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data.data;
}

export const api = {
  getDrives: () => request(`${BASE}/drives`),
  listFiles: (path) => request(`${BASE}/list?path=${encodeURIComponent(path)}`),
  getStats: (path) => request(`${BASE}/stats${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  search: (query, path) => request(`${BASE}/search?query=${encodeURIComponent(query)}${path ? `&path=${encodeURIComponent(path)}` : ''}`),
  getRecent: (path) => request(`${BASE}/recent${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  getLargeFiles: (path, minSize) => request(`${BASE}/large?minSize=${minSize || 100}${path ? `&path=${encodeURIComponent(path)}` : ''}`),
  getDuplicates: (path) => request(`${BASE}/duplicates${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  getFavorites: () => request(`${BASE}/favorites`),
  addFavorite: (path) => request(`${BASE}/favorites`, { method: 'POST', body: JSON.stringify({ path }) }),
  removeFavorite: (path) => request(`${BASE}/favorites`, { method: 'DELETE', body: JSON.stringify({ path }) }),
  rename: (oldPath, newName) => request(`${BASE}/rename`, { method: 'PUT', body: JSON.stringify({ oldPath, newName }) }),
  deleteFile: (path) => request(`${BASE}/delete`, { method: 'DELETE', body: JSON.stringify({ path }) }),
  copyFile: (source, destination) => request(`${BASE}/copy`, { method: 'POST', body: JSON.stringify({ source, destination }) }),
  moveFile: (source, destination) => request(`${BASE}/move`, { method: 'POST', body: JSON.stringify({ source, destination }) }),
  preview: (path) => request(`${BASE}/preview?path=${encodeURIComponent(path)}`),
  openFile: (path) => request(`${BASE}/open`, { method: 'POST', body: JSON.stringify({ path }) }),
  createFolder: (path, name) => request(`${BASE}/create-folder`, { method: 'POST', body: JSON.stringify({ path, name }) }),
};
