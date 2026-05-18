import { apiFetch } from './client'

export function adminLogin(password) {
  return apiFetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
}

export function adminChangePassword(currentPassword, newPassword) {
  return apiFetch('/api/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
    ...withAdminHeaders(),
  })
}

export function adminGetCategories() {
  return apiFetch('/api/admin/categories', {
    method: 'GET',
    ...withAdminHeaders({}),
  })
}

export function adminGetProducts() {
  return apiFetch('/api/admin/products', {
    method: 'GET',
    ...withAdminHeaders({}),
  })
}

function getAdminToken() {
  return localStorage.getItem('pvs-admin-token') || ''
}

function withAdminHeaders(options) {
  const token = getAdminToken()
  return {
    ...(options || {}),
    headers: {
      ...(options?.headers || {}),
      'Content-Type': 'application/json',
      'x-admin-token': token,
    },
  }
}

export function adminCreateCategory(payload) {
  return apiFetch('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
    ...withAdminHeaders(),
  })
}

export function adminUpdateCategory(id, payload) {
  return apiFetch(`/api/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    ...withAdminHeaders(),
  })
}

export function adminDeleteCategory(id) {
  return apiFetch(`/api/admin/categories/${id}`, {
    method: 'DELETE',
    ...withAdminHeaders({}),
  })
}

export function adminCreateProduct(payload) {
  return apiFetch('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
    ...withAdminHeaders(),
  })
}

export function adminUpdateProduct(id, payload) {
  return apiFetch(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    ...withAdminHeaders(),
  })
}

export function adminDeleteProduct(id) {
  return apiFetch(`/api/admin/products/${id}`, {
    method: 'DELETE',
    ...withAdminHeaders({}),
  })
}
