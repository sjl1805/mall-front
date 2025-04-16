import request from '@/utils/request'


/**
 * 分页获取用户行为历史（视图对象）
 * @param {Object} params - 查询参数
 * @param {number} [params.behaviorType] - 行为类型(可选)
 * @param {string} [params.startTime] - 开始时间(可选)，格式：yyyy-MM-dd HH:mm:ss
 * @param {string} [params.endTime] - 结束时间(可选)，格式：yyyy-MM-dd HH:mm:ss
 * @param {number} [params.page=1] - 页码(可选)，默认1
 * @param {number} [params.size=10] - 每页数量(可选)，默认10
 * @returns {Promise<Object>} 用户行为分页
 */
export function getUserBehaviorHistoryPage(params) {
  return request({
    url: '/user/behavior/page',
    method: 'get',
    params
  })
}

/**
 * 记录用户行为
 * @param {number} productId - 商品ID
 * @param {number} behaviorType - 行为类型
 * @returns {Promise<Object>} 记录结果
 */
export function recordBehavior(productId, behaviorType) {
  return request({
    url: '/user/behavior/record',
    method: 'post',
    params: { productId, behaviorType }
  })
}

/**
 * 获取用户最近浏览的商品
 * @param {number} [limit=10] - 数量限制(可选)，默认10
 * @returns {Promise<Object>} 商品列表
 */
export function getRecentViewedProducts(limit = 10) {
  return request({
    url: '/user/behavior/recent/view',
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取用户行为统计数据
 * @returns {Promise<Object>} 各类行为的统计数据
 */
export function getUserBehaviorStats() {
  return request({
    url: '/user/behavior/stats',
    method: 'get'
  })
}

/**
 * 批量记录用户行为
 * @param {Array<number>} productIds - 商品ID列表
 * @param {number} behaviorType - 行为类型
 * @returns {Promise<Object>} 记录结果
 */
export function recordBehaviorBatch(productIds, behaviorType) {
  return request({
    url: '/user/behavior/record/batch',
    method: 'post',
    params: { productIds, behaviorType }
  })
}

/**
 * 清除用户行为记录
 * @param {Object} params - 查询参数
 * @param {number} [params.behaviorType] - 行为类型(可选)
 * @param {string} [params.beforeTime] - 清除该时间之前的记录(可选)，格式：yyyy-MM-dd HH:mm:ss
 * @returns {Promise<Object>} 清除结果
 */
export function clearBehaviorRecords(params) {
  return request({
    url: '/user/behavior/clear',
    method: 'delete',
    params
  })
}

/**
 * 取消某个行为记录
 * @param {number} productId - 商品ID
 * @param {number} behaviorType - 行为类型
 * @returns {Promise<Object>} 取消结果
 */
export function cancelBehavior(productId, behaviorType) {
  return request({
    url: '/user/behavior/cancel',
    method: 'delete',
    params: { productId, behaviorType }
  })
}

/**
 * 获取行为类型描述
 * @param {number} behaviorType - 行为类型
 * @returns {Promise<Object>} 描述文本
 */
export function getBehaviorTypeDesc(behaviorType) {
  return request({
    url: '/user/behavior/type-desc',
    method: 'get',
    params: { behaviorType }
  })
}

/**
 * 行为类型常量
 */
export const BehaviorType = {
  VIEW: 1,    // 浏览
  FAVORITE: 2, // 收藏
  CART: 3,    // 加购
  PURCHASE: 4, // 购买
  REVIEW: 5   // 评价
} 