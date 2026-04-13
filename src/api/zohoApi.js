import axios from 'axios';

const api = axios.create({
  // In production, frontend and backend share the same origin.
  // In dev, Vite proxies /api → localhost:3001 (see vite.config.js).
  baseURL: '/api/zoho',
  headers: { 'Content-Type': 'application/json' },
});

export async function createRecord(section, data) {
  const res = await api.post(`/${section}`, data);
  return res.data;
}

export async function fetchRecords(section, criteria = '') {
  const res = await api.get(`/${section}`, { params: { criteria } });
  return res.data;
}

export async function patchRecord(section, id, data) {
  const res = await api.patch(`/${section}/${id}`, data);
  return res.data;
}

export async function removeRecord(section, id) {
  const res = await api.delete(`/${section}/${id}`);
  return res.data;
}

export default api;
