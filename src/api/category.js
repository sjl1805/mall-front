import request from '@/utils/request'

// 获取分类树形列表
export function getCategoryTree() {
  return request({
    url: '/admin/categories/tree',
    method: 'get'
  })
}

// 获取所有分类列表
export function getAllCategories() {
  return request({
    url: '/admin/categories',
    method: 'get'
  })
}

// 获取分类详情
export function getCategoryDetail(categoryId) {
  return request({
    url: `/admin/categories/${categoryId}`,
    method: 'get'
  })
}

// 添加分类
export function addCategory(data) {
  return request({
    url: '/admin/categories',
    method: 'post',
    data
  })
}

// 更新分类
export function updateCategory(data) {
  return request({
    url: '/admin/categories',
    method: 'put',
    data
  })
}

// 删除分类
export function deleteCategory(categoryId) {
  return request({
    url: `/admin/categories/${categoryId}`,
    method: 'delete'
  })
}

// 更新分类状态
export function updateCategoryStatus(categoryId, status) {
  return request({
    url: `/admin/categories/${categoryId}/status`,
    method: 'put',
    params: { status }
  })
}

// 上传分类图标
export function uploadCategoryIcon(data) {
  return request({
    url: '/admin/categories/icon',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data
  })
}

// 更新分类排序
export function updateCategorySort(categoryId, sort) {
  return request({
    url: `/admin/categories/${categoryId}/sort`,
    method: 'put',
    params: { sort }
  })
}

// 移动分类
export function moveCategory(categoryId, targetParentId) {
  return request({
    url: `/admin/categories/${categoryId}/move`,
    method: 'put',
    params: { targetParentId }
  })
}

// 批量添加分类
export function batchAddCategories(data) {
  return request({
    url: '/admin/categories/batch',
    method: 'post',
    data
  })
} 