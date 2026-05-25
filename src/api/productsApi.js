import axios from 'axios';

const BASE = '/api/products';

export const fetchProducts = (params = {}) =>
  axios.get(BASE, { params, withCredentials: true }).then((r) => r.data);

export const createProduct = (data) =>
  axios.post(BASE, data, { withCredentials: true }).then((r) => r.data);

export const updateProduct = (id, data) =>
  axios.patch(`${BASE}/${id}`, data, { withCredentials: true }).then((r) => r.data);

export const deleteProduct = (id) =>
  axios.delete(`${BASE}/${id}`, { withCredentials: true }).then((r) => r.data);

export const importProducts = (rows) =>
  axios.post(`${BASE}/import`, { rows }, { withCredentials: true }).then((r) => r.data);
