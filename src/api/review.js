import request from '@/utils/request'

/**
 * 添加商品评价
 * @param {Object} reviewData - 评价信息
 * @param {number} reviewData.productId - 商品ID
 * @param {number} reviewData.orderId - 订单ID
 * @param {string} reviewData.content - 评价内容
 * @param {number} reviewData.rating - 评分(1-5星)
 * @param {Array<string>} [reviewData.images] - 评价图片列表(可选)
 * @param {boolean} [reviewData.anonymous=false] - 是否匿名(可选)
 * @returns {Promise<Object>} 评价ID
 */
export function addReview(reviewData) {
  return request({
    url: '/review/add',
    method: 'post',
    data: reviewData,
    needToken: true
  })
}

/**
 * 删除评价
 * @param {number} reviewId - 评价ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteReview(reviewId) {
  return request({
    url: `/review/${reviewId}`,
    method: 'delete',
    needToken: true
  })
}

/**
 * 获取商品评价列表
 * @param {number} productId - 商品ID
 * @param {number} [page=1] - 页码
 * @param {number} [size=10] - 每页数量
 * @returns {Promise<Object>} 评价分页
 */
export function getProductReviews(productId, page = 1, size = 10) {
  return request({
    url: `/review/product/${productId}`,
    method: 'get',
    params: { page, size }
  })
}

/**
 * 获取用户评价列表
 * @param {number} [page=1] - 页码
 * @param {number} [size=10] - 每页数量
 * @returns {Promise<Object>} 评价分页
 */
export function getUserReviews(page = 1, size = 10) {
  return request({
    url: '/review/user',
    method: 'get',
    params: { page, size },
    needToken: true,
    timeout: 10000,
    headers: {
      'X-Request-UserReview': 'true' // 添加特殊标记，便于调试和后端识别
    }
  })
}

/**
 * 获取商品评价统计
 * @param {number} productId - 商品ID
 * @returns {Promise<Object>} 评价统计信息
 */
export function getProductReviewStats(productId) {
  return request({
    url: `/review/stats/${productId}`,
    method: 'get'
  })
}

/**
 * 检查用户是否已评价商品
 * @param {number} productId - 商品ID
 * @returns {Promise<Object>} 是否已评价的结果对象，包含reviewed属性
 */
export function checkReviewed(productId) {
  return request({
    url: '/review/check',
    method: 'get',
    params: { productId },
    needToken: true
  })
}

/**
 * 获取最新评价列表
 * @param {number} [limit=5] - 数量限制
 * @returns {Promise<Object>} 评价列表
 */
export function getLatestReviews(limit = 5) {
  return request({
    url: '/review/latest',
    method: 'get',
    params: { limit }
  })
} 