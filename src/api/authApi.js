import axios from 'axios';

const api = axios.create({
  baseURL: '/api/auth',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export async function login(email, password) {
  const res = await api.post('/login', { email, password });
  return res.data.user;
}

export async function signup(email, password, name) {
  const res = await api.post('/signup', { email, password, name });
  return res.data.user;
}

export async function logout() {
  await api.post('/logout');
}

export async function fetchMe() {
  const res = await api.get('/me');
  return res.data.user;
}

export async function needsBootstrap() {
  const res = await api.get('/needs-bootstrap');
  return Boolean(res.data.needsBootstrap);
}
