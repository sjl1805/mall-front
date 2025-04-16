import request from '@/utils/request'

/**
 * 获取推荐商品列表（混合推荐）
 * 优先从推荐表中获取，如果没有记录，则实时计算
 * @param {number} [limit=10] - 数量限制
 * @returns {Promise<Object>} 推荐商品列表
 */
export function getRecommendations(limit = 10) {
  return request({
    url: '/recommend',
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取所有推荐类型的商品
 * 包括：猜你喜欢、相似推荐、热门推荐、综合推荐
 * @param {number} [limit=5] - 每种类型的数量限制
 * @returns {Promise<Object>} 所有类型的推荐商品
 */
export function getAllTypeRecommendations(limit = 5) {
  return request({
    url: '/recommend/all-types',
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取猜你喜欢推荐（基于用户的协同过滤）
 * @param {number} [limit=10] - 数量限制
 * @returns {Promise<Object>} 推荐商品列表
 */
export function getUserCFRecommendations(limit = 10) {
  return request({
    url: '/recommend/user-cf',
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取相似推荐（基于物品的协同过滤）
 * @param {number} [limit=10] - 数量限制
 * @returns {Promise<Object>} 推荐商品列表
 */
export function getItemCFRecommendations(limit = 10) {
  return request({
    url: '/recommend/item-cf',
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取热门推荐
 * @param {number} [limit=10] - 数量限制
 * @returns {Promise<Object>} 推荐商品列表
 */
export function getPopularRecommendations(limit = 10) {
  return request({
    url: '/recommend/popular',
    method: 'get',
    params: { limit }
  })
}

/**
 * 基于内容的推荐
 * @param {number} [limit=10] - 数量限制
 * @returns {Promise<Object>} 推荐商品列表
 */
export function getContentBasedRecommendations(limit = 10) {
  return request({
    url: '/recommend/content-based',
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取与商品相似的商品
 * @param {number} productId - 商品ID
 * @param {number} [limit=5] - 数量限制
 * @returns {Promise<Object>} 相似商品列表
 */
export function getSimilarProductRecommendations(productId, limit = 5) {
  return request({
    url: `/recommend/similar/${productId}`,
    method: 'get',
    params: { limit }
  })
}

/**
 * 推荐类型常量
 */
export const RecommendationType = {
  HYBRID: 'hybrid',      // 混合推荐
  USER_BASED: 'user-cf', // 基于用户的协同过滤
  ITEM_BASED: 'item-cf', // 基于物品的协同过滤
  POPULAR: 'popular',    // 热门推荐
  CONTENT: 'content-based' // 基于内容的推荐
} 