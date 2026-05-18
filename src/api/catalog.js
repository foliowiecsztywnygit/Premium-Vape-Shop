import { apiFetch } from './client'

export function getCategories() {
  return apiFetch('/api/catalog/categories')
}

export function getProducts(params) {
  const query = new URLSearchParams()
  if (params?.category) query.set('category', params.category)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiFetch(`/api/catalog/products${suffix}`)
}

export function getProduct(id) {
  return apiFetch(`/api/catalog/products/${id}`)
}

