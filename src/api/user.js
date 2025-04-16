import request from '@/utils/request'

/**
 * 获取当前用户信息
 * @returns {Promise<Object>} 用户信息
 */
export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

/**
 * 更新用户个人信息
 * @param {Object} data - 用户信息
 * @returns {Promise<Object>} 更新结果
 */
export function updateUserInfo(data) {
  return request({
    url: '/user/info',
    method: 'put',
    data
  })
}

/**
 * 修改密码
 * @param {Object} data - 包含旧密码和新密码
 * @returns {Promise<Object>} 修改结果
 */
export function updatePassword(data) {
  return request({
    url: '/user/password',
    method: 'put',
    data
  })
}

/**
 * 上传头像
 * @param {FormData} formData - 包含头像文件的表单数据
 * @returns {Promise<Object>} 上传结果
 */
export function uploadAvatar(formData) {
  return request({
    url: '/user/avatar',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 检查用户名是否存在
 * @param {string} username - 用户名
 * @returns {Promise<Object>} 检查结果
 */
export function checkUsername(username) {
  return request({
    url: '/user/check-username',
    method: 'get',
    params: { username }
  })
}

// ==================== 地址管理相关接口 ====================

/**
 * 获取用户地址列表
 * @returns {Promise<Object>} 地址列表
 */
export function getAddressList() {
  return request({
    url: '/user/address/list',
    method: 'get'
  })
}

/**
 * 获取默认地址
 * @returns {Promise<Object>} 默认地址
 */
export function getDefaultAddress() {
  return request({
    url: '/user/address/default',
    method: 'get'
  })
}

/**
 * 添加地址
 * @param {Object} data - 地址信息
 * @returns {Promise<Object>} 添加结果
 */
export function addAddress(data) {
  return request({
    url: '/user/address',
    method: 'post',
    data
  })
}

/**
 * 更新地址
 * @param {Object} data - 地址信息
 * @returns {Promise<Object>} 更新结果
 */
export function updateAddress(data) {
  return request({
    url: '/user/address',
    method: 'put',
    data
  })
}

/**
 * 删除地址
 * @param {number} addressId - 地址ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteAddress(addressId) {
  return request({
    url: `/user/address/${addressId}`,
    method: 'delete'
  })
}

/**
 * 设置默认地址
 * @param {number} addressId - 地址ID
 * @returns {Promise<Object>} 设置结果
 */
export function setDefaultAddress(addressId) {
  return request({
    url: `/user/address/default/${addressId}`,
    method: 'put'
  })
}

/**
 * 获取地址详情
 * @param {number} addressId - 地址ID
 * @returns {Promise<Object>} 地址详情
 */
export function getAddressDetail(addressId) {
  return request({
    url: `/user/address/${addressId}`,
    method: 'get'
  })
}

// ==================== 购物车相关接口 ====================

/**
 * 获取购物车信息
 * @returns {Promise<Object>} 购物车信息
 */
export function getCart() {
  return request({
    url: '/user/cart',
    method: 'get'
  })
}

/**
 * 获取购物车商品数量
 * @returns {Promise<Object>} 商品数量
 */
export function getCartCount() {
  return request({
    url: '/user/cart/count',
    method: 'get'
  })
}

/**
 * 添加商品到购物车
 * @param {number} productId - 商品ID
 * @param {number} quantity - 数量
 * @returns {Promise<Object>} 添加结果
 */
export function addToCart(productId, quantity = 1) {
  return request({
    url: '/user/cart/add',
    method: 'post',
    params: { productId, quantity }
  })
}

/**
 * 更新购物车商品数量
 * @param {number} productId - 商品ID
 * @param {number} quantity - 数量
 * @returns {Promise<Object>} 更新结果
 */
export function updateCartQuantity(productId, quantity) {
  return request({
    url: '/user/cart/update',
    method: 'put',
    params: { productId, quantity }
  })
}

/**
 * 删除购物车商品
 * @param {number} productId - 商品ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteCartItem(productId) {
  return request({
    url: '/user/cart/delete',
    method: 'delete',
    params: { productId }
  })
}

/**
 * 批量删除购物车商品
 * @param {Array<number>} productIds - 商品ID数组
 * @returns {Promise<Object>} 删除结果
 */
export function deleteCartItemBatch(productIds) {
  return request({
    url: '/user/cart/delete/batch',
    method: 'delete',
    params: { productIds }
  })
}

/**
 * 清空购物车
 * @returns {Promise<Object>} 清空结果
 */
export function clearCart() {
  return request({
    url: '/user/cart/clear',
    method: 'delete'
  })
}

/**
 * 选中/取消选中购物车商品
 * @param {number} productId - 商品ID
 * @param {number} checked - 是否选中：0-未选中，1-选中
 * @returns {Promise<Object>} 更新结果
 */
export function updateCartChecked(productId, checked) {
  return request({
    url: '/user/cart/checked',
    method: 'put',
    params: { productId, checked }
  })
}

/**
 * 批量选中/取消选中购物车商品
 * @param {Array<number>} productIds - 商品ID数组
 * @param {number} checked - 是否选中：0-未选中，1-选中
 * @returns {Promise<Object>} 更新结果
 */
export function updateCartCheckedBatch(productIds, checked) {
  return request({
    url: '/user/cart/checked/batch',
    method: 'put',
    params: { productIds, checked }
  })
}

/**
 * 全选/取消全选购物车商品
 * @param {number} checked - 是否选中：0-未选中，1-选中
 * @returns {Promise<Object>} 更新结果
 */
export function updateCartCheckedAll(checked) {
  return request({
    url: '/user/cart/checked/all',
    method: 'put',
    params: { checked }
  })
}

/**
 * 检查商品是否在购物车中
 * @param {number} productId - 商品ID
 * @returns {Promise<Object>} 检查结果
 */
export function existsProductInCart(productId) {
  return request({
    url: '/user/cart/exists',
    method: 'get',
    params: { productId }
  })
}

// ==================== 收藏相关接口 ====================

/**
 * 添加收藏
 * @param {number} productId - 商品ID
 * @returns {Promise<Object>} 收藏结果
 */
export function addFavorite(productId) {
  return request({
    url: '/user/favorite/add',
    method: 'post',
    params: { productId }
  })
}

/**
 * 取消收藏
 * @param {number} productId - 商品ID
 * @returns {Promise<Object>} 取消结果
 */
export function removeFavorite(productId) {
  return request({
    url: '/user/favorite/remove',
    method: 'delete',
    params: { productId }
  })
}

/**
 * 检查商品是否已收藏
 * @param {number} productId - 商品ID
 * @returns {Promise<Object>} 是否已收藏
 */
export function checkFavorite(productId) {
  return request({
    url: '/user/favorite/check',
    method: 'get',
    params: { productId }
  })
}

/**
 * 获取用户收藏的商品列表
 * @param {number} page - 页码
 * @param {number} size - 每页数量
 * @returns {Promise<Object>} 收藏商品分页
 */
export function getFavoriteList(page = 1, size = 10) {
  return request({
    url: '/user/favorite/list',
    method: 'get',
    params: { page, size }
  })
}

/**
 * 获取用户收藏数量
 * @returns {Promise<Object>} 收藏数量
 */
export function getFavoriteCount() {
  return request({
    url: '/user/favorite/count',
    method: 'get'
  })
}

/**
 * 获取用户最近收藏的商品
 * @param {number} limit - 数量限制
 * @returns {Promise<Object>} 商品列表
 */
export function getRecentFavorites(limit = 5) {
  return request({
    url: '/user/favorite/recent',
    method: 'get',
    params: { limit }
  })
}
