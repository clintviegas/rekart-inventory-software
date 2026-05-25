import axios from 'axios';

const api = axios.create({
  baseURL: '/api/oms',
  headers: { 'Content-Type': 'application/json' },
});

export async function createOrder(payload) {
  const res = await api.post('/order', payload);
  return res.data;
}

export async function fetchOrders(params = {}) {
  const res = await api.get('/orders', { params });
  return res.data;
}

export async function updateOrder(id, payload) {
  const res = await api.patch(`/order/${id}`, payload);
  return res.data;
}

export async function deleteOrder(id) {
  const res = await api.delete(`/order/${id}`);
  return res.data;
}

export async function searchProducts(q) {
  const res = await api.get('/products/search', { params: { q, limit: 20 } });
  return res.data;
}

export async function fetchStats() {
  const res = await api.get('/stats');
  return res.data;
}

export async function fetchWarehouseQueue() {
  const res = await api.get('/warehouse-queue');
  return res.data;
}

export async function dispatchOrder(id) {
  const res = await api.patch(`/order/${id}`, { Status: 'Processing', Dispatched_At: new Date().toISOString() });
  return res.data;
}
