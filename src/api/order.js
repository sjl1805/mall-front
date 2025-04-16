import request from '@/utils/request'

/**
 * 创建订单
 * @param {Object} orderData - 创建订单参数
 * @param {Array<number>} orderData.productIds - 商品ID列表(购物车模式时为空)
 * @param {number} orderData.addressId - 收货地址ID
 * @param {string} [orderData.note] - 订单备注(可选)
 * @param {boolean} [orderData.fromCart=true] - 是否从购物车创建订单
 * @returns {Promise<Object>} 订单号
 */
export function createOrder(orderData) {
  return request({
    url: '/order/create',
    method: 'post',
    data: orderData
  })
}

/**
 * 获取订单详情
 * @param {string} orderNo - 订单号
 * @returns {Promise<Object>} 订单详情
 */
export function getOrderDetail(orderNo) {
  return request({
    url: '/order/detail',
    method: 'get',
    params: { orderNo }
  })
}

/**
 * 取消订单
 * @param {string} orderNo - 订单号
 * @returns {Promise<Object>} 取消结果
 */
export function cancelOrder(orderNo) {
  return request({
    url: '/order/cancel',
    method: 'post',
    params: { orderNo }
  })
}

/**
 * 支付订单
 * @param {string} orderNo - 订单号
 * @param {number} payType - 支付方式：1-支付宝，2-微信
 * @returns {Promise<Object>} 支付信息
 */
export function payOrder(orderNo, payType) {
  return request({
    url: '/order/pay',
    method: 'post',
    params: { orderNo, payType }
  })
}

/**
 * 确认收货
 * @param {string} orderNo - 订单号
 * @returns {Promise<Object>} 确认结果
 */
export function confirmReceipt(orderNo) {
  return request({
    url: '/order/confirm',
    method: 'post',
    params: { orderNo }
  })
}

/**
 * 删除订单
 * @param {string} orderNo - 订单号
 * @returns {Promise<Object>} 删除结果
 */
export function deleteOrder(orderNo) {
  return request({
    url: '/order/delete',
    method: 'delete',
    params: { orderNo }
  })
}

/**
 * 获取用户订单列表
 * @param {Object} params - 查询参数
 * @param {number} [params.status] - 订单状态：0-待付款，1-待发货，2-待收货，3-已完成，4-已取消，null-全部
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.size=10] - 每页数量
 * @returns {Promise<Object>} 订单列表分页
 */
export function getUserOrders(params = {}) {
  return request({
    url: '/order/list',
    method: 'get',
    params
  })
}

/**
 * 订单支付回调（模拟）
 * 注意：实际项目中，这个接口通常由支付平台回调，一般不会在前端直接调用
 * @param {string} orderNo - 订单号
 * @param {string} tradeNo - 交易号
 * @returns {Promise<Object>} 处理结果
 */
export function payCallback(orderNo, tradeNo) {
  return request({
    url: '/order/pay/callback',
    method: 'post',
    params: { orderNo, tradeNo }
  })
}

/**
 * 订单状态常量
 */
export const OrderStatus = {
  PENDING_PAYMENT: 0,  // 待付款
  PENDING_SHIPPING: 1, // 待发货
  PENDING_RECEIPT: 2,  // 待收货
  COMPLETED: 3,        // 已完成
  CANCELLED: 4         // 已取消
}

/**
 * 支付方式常量
 */
export const PayType = {
  ALIPAY: 1, // 支付宝
  WECHAT: 2  // 微信
} 