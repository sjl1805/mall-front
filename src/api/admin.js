import request from '@/utils/request'

// ==================== 用户管理 ====================

/**
 * 获取用户列表（分页）
 * @param {Object} params - 查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.size=10] - 每页数量
 * @param {string} [params.username] - 用户名关键词(可选)
 * @param {string} [params.nickname] - 昵称关键词(可选)
 * @param {string} [params.phone] - 手机号(可选)
 * @param {string} [params.email] - 邮箱(可选)
 * @param {number} [params.status] - 状态(可选)：0-禁用，1-正常
 * @returns {Promise<Object>} 用户分页数据
 */
export function getUserList(params = {}) {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

/**
 * 获取用户详情
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} 用户详情
 */
export function getUserDetail(userId) {
  return request({
    url: `/admin/users/${userId}`,
    method: 'get'
  })
}

/**
 * 添加用户
 * @param {Object} userData - 用户信息
 * @returns {Promise<Object>} 添加结果
 */
export function addUser(userData) {
  return request({
    url: '/admin/users',
    method: 'post',
    data: userData
  })
}

/**
 * 更新用户
 * @param {Object} userData - 用户信息
 * @returns {Promise<Object>} 更新结果
 */
export function updateUser(userData) {
  return request({
    url: '/admin/users',
    method: 'put',
    data: userData
  })
}

/**
 * 删除用户
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteUser(userId) {
  return request({
    url: `/admin/users/${userId}`,
    method: 'delete'
  })
}

/**
 * 启用/禁用用户
 * @param {number} userId - 用户ID
 * @param {number} status - 状态：0-禁用，1-正常
 * @returns {Promise<Object>} 操作结果
 */
export function updateUserStatus(userId, status) {
  return request({
    url: `/admin/users/${userId}/status`,
    method: 'put',
    params: { status }
  })
}

/**
 * 重置用户密码
 * @param {number} userId - 用户ID
 * @param {string} password - 新密码
 * @returns {Promise<Object>} 重置结果
 */
export function resetPassword(userId, password) {
  return request({
    url: `/admin/users/${userId}/password`,
    method: 'put',
    params: { password }
  })
}

/**
 * 修改用户角色
 * @param {number} userId - 用户ID
 * @param {number} role - 角色：1-管理员，2-用户
 * @returns {Promise<Object>} 操作结果
 */
export function updateUserRole(userId, role) {
  return request({
    url: `/admin/users/${userId}/role`,
    method: 'put',
    params: { role }
  })
}

/**
 * 获取用户统计信息
 * @returns {Promise<Object>} 用户统计信息
 */
export function getUserStatistics() {
  return request({
    url: '/admin/users/statistics',
    method: 'get'
  })
}

// ==================== 分类管理 ====================

/**
 * 获取分类树形列表
 * @returns {Promise<Object>} 分类树
 */
export function getCategoryTree() {
  return request({
    url: '/admin/categories/tree',
    method: 'get'
  })
}

/**
 * 获取所有分类的平铺列表
 * @returns {Promise<Object>} 分类列表
 */
export function getAllCategories() {
  return request({
    url: '/admin/categories',
    method: 'get'
  })
}

/**
 * 获取分类详情
 * @param {number} categoryId - 分类ID
 * @returns {Promise<Object>} 分类详情
 */
export function getCategoryDetail(categoryId) {
  return request({
    url: `/admin/categories/${categoryId}`,
    method: 'get'
  })
}

/**
 * 添加分类
 * @param {Object} categoryData - 分类信息
 * @returns {Promise<Object>} 添加结果
 */
export function addCategory(categoryData) {
  return request({
    url: '/admin/categories',
    method: 'post',
    data: categoryData
  })
}

/**
 * 更新分类
 * @param {Object} categoryData - 分类信息
 * @returns {Promise<Object>} 更新结果
 */
export function updateCategory(categoryData) {
  return request({
    url: '/admin/categories',
    method: 'put',
    data: categoryData
  })
}

/**
 * 删除分类
 * @param {number} categoryId - 分类ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteCategory(categoryId) {
  return request({
    url: `/admin/categories/${categoryId}`,
    method: 'delete'
  })
}

/**
 * 启用/禁用分类
 * @param {number} categoryId - 分类ID
 * @param {number} status - 状态：0-禁用，1-正常
 * @returns {Promise<Object>} 操作结果
 */
export function updateCategoryStatus(categoryId, status) {
  return request({
    url: `/admin/categories/${categoryId}/status`,
    method: 'put',
    params: { status }
  })
}

/**
 * 上传分类图标
 * @param {File} file - 图标文件
 * @param {number} categoryId - 分类ID
 * @returns {Promise<Object>} 图标URL
 */
export function uploadCategoryIcon(file, categoryId) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('categoryId', categoryId)
  
  return request({
    url: '/admin/categories/icon',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 修改分类排序
 * @param {number} categoryId - 分类ID
 * @param {number} sort - 排序值
 * @returns {Promise<Object>} 操作结果
 */
export function updateCategorySort(categoryId, sort) {
  return request({
    url: `/admin/categories/${categoryId}/sort`,
    method: 'put',
    params: { sort }
  })
}

/**
 * 移动分类
 * @param {number} categoryId - 分类ID
 * @param {number} targetParentId - 目标父分类ID
 * @returns {Promise<Object>} 操作结果
 */
export function moveCategory(categoryId, targetParentId) {
  return request({
    url: `/admin/categories/${categoryId}/move`,
    method: 'put',
    params: { targetParentId }
  })
}

/**
 * 批量添加分类
 * @param {Array<Object>} categories - 分类列表
 * @returns {Promise<Object>} 操作结果
 */
export function batchAddCategories(categories) {
  return request({
    url: '/admin/categories/batch',
    method: 'post',
    data: categories
  })
}

// ==================== 订单管理 ====================

/**
 * 获取订单列表（分页）
 * @param {Object} params - 查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.size=10] - 每页数量
 * @param {number} [params.status] - 订单状态(可选)
 * @param {string} [params.orderNo] - 订单编号(可选)
 * @param {string} [params.startTime] - 开始时间(可选)
 * @param {string} [params.endTime] - 结束时间(可选)
 * @returns {Promise<Object>} 订单分页数据
 */
export function getOrderList(params = {}) {
  return request({
    url: '/admin/orders',
    method: 'get',
    params
  })
}

/**
 * 获取订单详情
 * @param {string} orderNo - 订单编号
 * @returns {Promise<Object>} 订单详情
 */
export function getOrderDetail(orderNo) {
  return request({
    url: `/admin/orders/${orderNo}`,
    method: 'get'
  })
}

/**
 * 订单发货
 * @param {string} orderNo - 订单编号
 * @param {string} shippingCode - 物流单号
 * @returns {Promise<Object>} 发货结果
 */
export function shipOrder(orderNo, shippingCode) {
  return request({
    url: `/admin/orders/${orderNo}/ship`,
    method: 'post',
    params: { shippingCode }
  })
}

/**
 * 取消订单
 * @param {string} orderNo - 订单编号
 * @returns {Promise<Object>} 取消结果
 */
export function cancelOrder(orderNo) {
  return request({
    url: `/admin/orders/${orderNo}/cancel`,
    method: 'put'
  })
}

/**
 * 获取订单统计信息
 * @returns {Promise<Object>} 订单统计信息
 */
export function getOrderStatistics() {
  return request({
    url: '/admin/orders/statistics',
    method: 'get'
  })
}

/**
 * 获取订单状态分布
 * @returns {Promise<Object>} 状态分布数据
 */
export function getOrderStatusDistribution() {
  return request({
    url: '/admin/orders/status-distribution',
    method: 'get'
  })
}

/**
 * 修改订单备注
 * @param {string} orderNo - 订单编号
 * @param {string} note - 备注内容
 * @returns {Promise<Object>} 修改结果
 */
export function updateOrderNote(orderNo, note) {
  return request({
    url: `/admin/orders/${orderNo}/note`,
    method: 'put',
    params: { note }
  })
}

/**
 * 导出订单数据
 * @param {Object} params - 查询参数
 * @param {number} [params.status] - 订单状态(可选)
 * @param {string} [params.startTime] - 开始时间(可选)
 * @param {string} [params.endTime] - 结束时间(可选)
 * @returns {Promise<Object>} 导出结果
 */
export function exportOrders(params = {}) {
  return request({
    url: '/admin/orders/export',
    method: 'get',
    params
  })
}

// ==================== 商品管理 ====================

/**
 * 获取商品列表（分页）
 * @param {Object} params - 查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.size=10] - 每页数量
 * @param {number} [params.categoryId] - 分类ID(可选)
 * @param {string} [params.keyword] - 关键词(可选)
 * @param {number} [params.minPrice] - 最小价格(可选)
 * @param {number} [params.maxPrice] - 最大价格(可选)
 * @param {number} [params.status] - 商品状态(可选)：0-下架，1-上架
 * @returns {Promise<Object>} 商品分页数据
 */
export function getProductList(params = {}) {
  return request({
    url: '/admin/products',
    method: 'get',
    params
  })
}

/**
 * 获取商品详情
 * @param {number} productId - 商品ID
 * @returns {Promise<Object>} 商品详情
 */
export function getProductDetail(productId) {
  return request({
    url: `/admin/products/${productId}`,
    method: 'get'
  })
}

/**
 * 添加商品
 * @param {Object} productData - 商品信息
 * @returns {Promise<Object>} 添加结果
 */
export function addProduct(productData) {
  return request({
    url: '/admin/products',
    method: 'post',
    data: productData
  })
}

/**
 * 更新商品
 * @param {Object} productData - 商品信息
 * @returns {Promise<Object>} 更新结果
 */
export function updateProduct(productData) {
  return request({
    url: '/admin/products',
    method: 'put',
    data: productData
  })
}

/**
 * 删除商品
 * @param {number} productId - 商品ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteProduct(productId) {
  return request({
    url: `/admin/products/${productId}`,
    method: 'delete'
  })
}

/**
 * 商品上下架
 * @param {number} productId - 商品ID
 * @param {number} status - 状态：0-下架，1-上架
 * @returns {Promise<Object>} 操作结果
 */
export function updateProductStatus(productId, status) {
  return request({
    url: `/admin/products/${productId}/status`,
    method: 'put',
    params: { status }
  })
}

/**
 * 更新商品库存
 * @param {number} productId - 商品ID
 * @param {number} stock - 库存数量
 * @returns {Promise<Object>} 操作结果
 */
export function updateProductStock(productId, stock) {
  return request({
    url: `/admin/products/${productId}/stock`,
    method: 'put',
    params: { stock }
  })
}

/**
 * 更新商品价格
 * @param {number} productId - 商品ID
 * @param {number} price - 价格
 * @param {number} [originalPrice] - 原价(可选)
 * @returns {Promise<Object>} 操作结果
 */
export function updateProductPrice(productId, price, originalPrice) {
  const params = { price }
  if (originalPrice !== undefined) {
    params.originalPrice = originalPrice
  }
  
  return request({
    url: `/admin/products/${productId}/price`,
    method: 'put',
    params
  })
}

/**
 * 上传商品主图
 * @param {File} file - 图片文件
 * @param {number} productId - 商品ID
 * @returns {Promise<Object>} 图片URL
 */
export function uploadProductImage(file, productId) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('productId', productId)
  
  return request({
    url: '/admin/products/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 上传商品图片（添加到图片集）
 * @param {File} file - 图片文件
 * @param {number} productId - 商品ID
 * @returns {Promise<Object>} 图片URL
 */
export function uploadProductImages(file, productId) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('productId', productId)
  
  return request({
    url: '/admin/products/images',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 删除商品图片
 * @param {number} productId - 商品ID
 * @param {string} imageUrl - 图片URL
 * @returns {Promise<Object>} 操作结果
 */
export function deleteProductImage(productId, imageUrl) {
  return request({
    url: `/admin/products/${productId}/images`,
    method: 'delete',
    params: { imageUrl }
  })
}

/**
 * 批量上下架商品
 * @param {Array<number>} productIds - 商品ID列表
 * @param {number} status - 状态：0-下架，1-上架
 * @returns {Promise<Object>} 操作结果
 */
export function batchUpdateProductStatus(productIds, status) {
  return request({
    url: '/admin/products/batch/status',
    method: 'put',
    params: { 
      productIds: productIds,
      status 
    }
  })
}

// ==================== 推荐管理 ====================

/**
 * 计算所有商品间的相似度
 * @returns {Promise<Object>} 计算结果
 */
export function calculateAllProductSimilarities() {
  return request({
    url: '/admin/products/similarity/calculate/all',
    method: 'post'
  })
}

/**
 * 计算指定商品与其他所有商品的相似度
 * @param {number} productId - 商品ID
 * @returns {Promise<Object>} 计算结果
 */
export function calculateProductSimilarities(productId) {
  return request({
    url: `/admin/products/similarity/calculate/${productId}`,
    method: 'post'
  })
}

/**
 * 计算用户偏好
 * @param {number} [userId] - 用户ID，为空则计算所有用户
 * @returns {Promise<Object>} 计算结果
 */
export function calculateUserPreferences(userId) {
  return request({
    url: '/admin/recommendation/calculate/preference',
    method: 'post',
    params: userId ? { userId } : {}
  })
}

/**
 * 生成用户推荐结果
 * @param {number} [userId] - 用户ID，为空则生成所有用户的推荐
 * @param {number} [limit=10] - 每种推荐类型的数量限制
 * @returns {Promise<Object>} 生成结果
 */
export function calculateRecommendations(userId, limit = 10) {
  const params = { limit }
  if (userId) {
    params.userId = userId
  }
  
  return request({
    url: '/admin/recommendation/calculate/recommendation',
    method: 'post',
    params
  })
}

/**
 * 获取相似用户列表
 * @param {number} [userId] - 用户ID，为空则使用当前登录用户
 * @param {number} [limit=5] - 数量限制
 * @returns {Promise<Object>} 相似用户列表及相似度
 */
export function getSimilarUsers(userId, limit = 5) {
  const params = { limit }
  if (userId) {
    params.userId = userId
  }
  
  return request({
    url: '/admin/recommendation/similar-users',
    method: 'get',
    params
  })
}

// ==================== 统计数据接口 ====================

/**
 * 获取仪表盘概要数据
 * @returns {Promise<Object>} 仪表盘概要数据
 */
export function getDashboardSummary() {
  return request({
    url: '/admin/dashboard/summary',
    method: 'get'
  })
}

/**
 * 获取销售统计数据
 * @param {string} [timeRange='week'] - 时间范围：week-本周，month-本月，year-本年
 * @returns {Promise<Object>} 销售统计数据
 */
export function getSalesStatistics(timeRange = 'week') {
  return request({
    url: '/admin/statistics/sales',
    method: 'get',
    params: { timeRange }
  })
}

/**
 * 获取商品销售排行榜
 * @param {number} [limit=10] - 数量限制
 * @returns {Promise<Object>} 商品销售排行榜
 */
export function getProductSalesRanking(limit = 10) {
  return request({
    url: '/admin/statistics/product-ranking',
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取分类销售统计
 * @returns {Promise<Object>} 分类销售统计
 */
export function getCategorySalesStatistics() {
  return request({
    url: '/admin/statistics/category-sales',
    method: 'get'
  })
}

// ==================== Statistics Controller API ====================

/**
 * 获取每日用户注册统计
 * @param {number} [days=7] - 天数
 * @returns {Promise<Object>} 每日注册统计列表
 */
export function getDailyUserRegistrations(days = 7) {
  return request({
    url: '/statistics/user/daily',
    method: 'get',
    params: { days }
  })
}

/**
 * 获取每日订单统计
 * @param {number} [days=7] - 天数
 * @returns {Promise<Object>} 每日订单统计列表
 */
export function getDailyOrderStatistics(days = 7) {
  return request({
    url: '/statistics/order/daily',
    method: 'get',
    params: { days }
  })
}

/**
 * 计算用户增长率
 * @param {number} [days=30] - 天数
 * @returns {Promise<Object>} 增长率(百分比)
 */
export function calculateUserGrowthRate(days = 30) {
  return request({
    url: '/statistics/user/growth',
    method: 'get',
    params: { days }
  })
}

/**
 * 计算订单增长率
 * @param {number} [days=30] - 天数
 * @returns {Promise<Object>} 增长率(百分比)
 */
export function calculateOrderGrowthRate(days = 30) {
  return request({
    url: '/statistics/order/growth',
    method: 'get',
    params: { days }
  })
}

/**
 * 计算销售额增长率
 * @param {number} [days=30] - 天数
 * @returns {Promise<Object>} 增长率(百分比)
 */
export function calculateSalesGrowthRate(days = 30) {
  return request({
    url: '/statistics/sales/growth',
    method: 'get',
    params: { days }
  })
}

/**
 * 计算月度销售额
 * @returns {Promise<Object>} 月销售额
 */
export function calculateMonthlySales() {
  return request({
    url: '/statistics/sales/monthly',
    method: 'get'
  })
}

/**
 * 获取销售额统计（按时间段）
 * @param {string} [timeRange='month'] - 时间范围：week-本周，month-本月，year-本年
 * @returns {Promise<Object>} 销售额统计
 */
export function getStatisticsSales(timeRange = 'month') {
  return request({
    url: '/statistics/sales',
    method: 'get',
    params: { timeRange }
  })
}

/**
 * 获取商品销售排行榜
 * @param {number} [limit=10] - 限制数量
 * @returns {Promise<Object>} 商品销售排行榜
 */
export function getStatisticsProductRanking(limit = 10) {
  return request({
    url: '/statistics/product/ranking',
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取分类销售统计
 * @returns {Promise<Object>} 分类销售统计
 */
export function getStatisticsCategorySales() {
  return request({
    url: '/statistics/category',
    method: 'get'
  })
}

/**
 * 获取最近订单列表（带分页）
 * @param {number} [page=1] - 页码
 * @param {number} [size=10] - 每页数量
 * @returns {Promise<Object>} 订单列表
 */
export function getRecentOrders(page = 1, size = 10) {
  return request({
    url: '/statistics/orders/recent',
    method: 'get',
    params: { page, size }
  })
}

/**
 * 获取销售趋势
 * @param {number} [days=30] - 天数
 * @returns {Promise<Object>} 销售趋势
 */
export function getSalesTrend(days = 30) {
  return request({
    url: '/statistics/sales/trend',
    method: 'get',
    params: { days }
  })
}

/**
 * 统计新增评价数
 * @param {number} [days=7] - 天数
 * @returns {Promise<Object>} 评价数量
 */
export function countNewReviews(days = 7) {
  return request({
    url: '/statistics/reviews/count',
    method: 'get',
    params: { days }
  })
}

/**
 * 获取统计概览数据
 * @returns {Promise<Object>} 统计概览数据
 */
export function getStatisticsOverview() {
  return request({
    url: '/statistics/overview',
    method: 'get'
  })
} 