import request from '@/utils/request'

/**
 * 分页查询商品列表
 * @param {Object} params - 查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.size=10] - 每页数量
 * @param {number} [params.categoryId] - 分类ID（可选）
 * @param {string} [params.keyword] - 关键词（可选）
 * @param {number} [params.minPrice] - 最小价格（可选）
 * @param {number} [params.maxPrice] - 最大价格（可选）
 * @returns {Promise<Object>} 商品分页结果
 */
export function getProductPage(params) {
  return request({
    url: '/product/page',
    method: 'get',
    params
  })
}

/**
 * 获取商品详情
 * @param {number} id - 商品ID
 * @param {boolean} [includeSimilar=true] - 是否包含相似商品
 * @param {number} [similarLimit=5] - 相似商品数量限制
 * @returns {Promise<Object>} 商品详情及相似商品
 */
export function getProductDetail(id, includeSimilar = true, similarLimit = 5) {
  return request({
    url: `/product/${id}`,
    method: 'get',
    params: {
      includeSimilar,
      similarLimit
    }
  })
}

/**
 * 获取热门商品
 * @param {number} [limit=10] - 数量限制
 * @returns {Promise<Object>} 热门商品列表
 */
export function getHotProducts(limit = 10) {
  return request({
    url: '/product/hot',
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取最新商品
 * @param {number} [limit=10] - 数量限制
 * @returns {Promise<Object>} 最新商品列表
 */
export function getNewProducts(limit = 10) {
  return request({
    url: '/product/new',
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取分类商品
 * @param {number} categoryId - 分类ID
 * @param {number} [limit=10] - 数量限制
 * @returns {Promise<Object>} 分类商品列表
 */
export function getProductsByCategory(categoryId, limit = 10) {
  return request({
    url: `/product/category/${categoryId}`,
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取相似商品
 * @param {number} productId - 商品ID
 * @param {number} [limit=5] - 数量限制
 * @returns {Promise<Object>} 相似商品列表
 */
export function getSimilarProducts(productId, limit = 5) {
  return request({
    url: `/product/${productId}/similar`,
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取启用的分类列表（平铺）
 * @returns {Promise<Object>} 分类列表
 */
export function getEnabledCategories() {
  return request({
    url: '/category/list',
    method: 'get'
  })
}

/**
 * 获取启用的分类树结构
 * @returns {Promise<Object>} 分类树
 */
export function getCategoryTree() {
  return request({
    url: '/category/tree',
    method: 'get'
  })
}

/**
 * 根据ID获取分类详情
 * @param {number} categoryId - 分类ID
 * @returns {Promise<Object>} 分类详情
 */
export function getCategoryDetail(categoryId) {
  return request({
    url: `/category/${categoryId}`,
    method: 'get'
  })
}

/**
 * 根据父ID获取子分类
 * @param {number} parentId - 父分类ID
 * @returns {Promise<Object>} 子分类列表
 */
export function getChildrenCategories(parentId) {
  return request({
    url: `/category/children/${parentId}`,
    method: 'get'
  })
} 