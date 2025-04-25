import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 导入管理员API
import {
  // 用户管理
  getUserList,
  getUserDetail,
  addUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  resetPassword,
  updateUserRole,
  getUserStatistics,
  
  // 分类管理
  getCategoryTree,
  getAllCategories,
  getCategoryDetail,
  addCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
  uploadCategoryIcon,
  updateCategorySort,
  moveCategory,
  batchAddCategories,
  
  // 订单管理
  getOrderList,
  getOrderDetail,
  shipOrder,
  cancelOrder,
  getOrderStatistics,
  getOrderStatusDistribution,
  updateOrderNote,
  exportOrders,
  
  // 商品管理
  getProductList,
  getProductDetail,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  updateProductStock,
  updateProductPrice,
  uploadProductImage,
  uploadProductImages,
  deleteProductImage,
  batchUpdateProductStatus,
  
  // 推荐管理
  calculateAllProductSimilarities,
  calculateProductSimilarities,
  calculateUserPreferences,
  calculateRecommendations,
  getSimilarUsers,

  // 统计数据
  getDashboardSummary,
  getSalesStatistics,
  getProductSalesRanking,
  getCategorySalesStatistics,
  
  // StatisticsController API
  getDailyUserRegistrations,
  getDailyOrderStatistics,
  calculateUserGrowthRate,
  calculateOrderGrowthRate,
  calculateSalesGrowthRate,
  calculateMonthlySales,
  getStatisticsSales,
  getStatisticsProductRanking,
  getStatisticsCategorySales,
  getRecentOrders,
  getSalesTrend,
  countNewReviews,
  getStatisticsOverview,
  updateAllUserPreferences
} from '@/api/admin'

export const useAdminStore = defineStore('admin', () => {
  // ==================== 用户管理状态 ====================
  const userListLoading = ref(false)
  const userList = ref([])
  const userTotal = ref(0)
  const userDetail = ref(null)
  const userStatistics = ref(null)
  
  // ==================== 分类管理状态 ====================
  const categoryTreeLoading = ref(false)
  const categoryTree = ref([])
  const categoryList = ref([])
  const categoryDetail = ref(null)
  
  // ==================== 订单管理状态 ====================
  const orderListLoading = ref(false)
  const orderList = ref([])
  const orderTotal = ref(0)
  const orderDetail = ref(null)
  const orderStatistics = ref(null)
  const orderStatusDistribution = ref(null)
  
  // ==================== 商品管理状态 ====================
  const productListLoading = ref(false)
  const productList = ref([])
  const productTotal = ref(0)
  const productDetail = ref(null)
  
  // ==================== 推荐管理状态 ====================
  const recommendationLoading = ref(false)
  const similarUsers = ref([])
  const preferencesUpdateResult = ref(null)
  
  // ==================== 统计数据状态 ====================
  const dashboardLoading = ref(false)
  const dashboardSummary = ref(null)
  const salesStatistics = ref(null)
  const productRanking = ref([])
  const categorySalesStats = ref([])
  const salesTrend = ref([])
  const statisticsOverview = ref(null)
  
  // ==================== 用户管理方法 ====================
  
  /**
   * 获取用户列表（分页）
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 用户分页数据
   */
  const fetchUserList = async (params = {}) => {
    userListLoading.value = true
    try {
      const res = await getUserList(params)
      if (res.code === 200) {
        userList.value = res.data.records
        userTotal.value = res.data.total
        return res.data
      } else {
        ElMessage.error(res.message || '获取用户列表失败')
        throw new Error(res.message || '获取用户列表失败')
      }
    } catch (error) {
      console.error('获取用户列表失败', error)
      throw error
    } finally {
      userListLoading.value = false
    }
  }
  
  /**
   * 获取用户详情
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 用户详情
   */
  const fetchUserDetail = async (userId) => {
    try {
      const res = await getUserDetail(userId)
      if (res.code === 200) {
        userDetail.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取用户详情失败')
        throw new Error(res.message || '获取用户详情失败')
      }
    } catch (error) {
      console.error('获取用户详情失败', error)
      throw error
    }
  }
  
  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<boolean>} 是否成功
   */
  const createUser = async (userData) => {
    try {
      const res = await addUser(userData)
      if (res.code === 200) {
        ElMessage.success(res.message || '添加用户成功')
        return true
      } else {
        ElMessage.error(res.message || '添加用户失败')
        return false
      }
    } catch (error) {
      console.error('添加用户失败', error)
      ElMessage.error(error.response?.data?.message || '添加用户失败')
      throw error
    }
  }
  
  /**
   * 更新用户信息
   * @param {Object} userData - 用户数据
   * @returns {Promise<boolean>} 是否成功
   */
  const editUser = async (userData) => {
    try {
      const res = await updateUser(userData)
      if (res.code === 200) {
        ElMessage.success(res.message || '更新用户成功')
        // 如果当前有加载的用户详情，且ID匹配，则更新本地的用户详情
        if (userDetail.value && userDetail.value.id === userData.id) {
          userDetail.value = { ...userDetail.value, ...userData }
        }
        return true
      } else {
        ElMessage.error(res.message || '更新用户失败')
        return false
      }
    } catch (error) {
      console.error('更新用户失败', error)
      ElMessage.error(error.response?.data?.message || '更新用户失败')
      throw error
    }
  }
  
  /**
   * 删除用户
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否成功
   */
  const removeUser = async (userId) => {
    try {
      const res = await deleteUser(userId)
      if (res.code === 200) {
        ElMessage.success(res.message || '删除用户成功')
        return true
      } else {
        ElMessage.error(res.message || '删除用户失败')
        return false
      }
    } catch (error) {
      console.error('删除用户失败', error)
      ElMessage.error(error.response?.data?.message || '删除用户失败')
      throw error
    }
  }
  
  /**
   * 更新用户状态（启用/禁用）
   * @param {number} userId - 用户ID
   * @param {number} status - 状态：0-禁用，1-正常
   * @returns {Promise<boolean>} 是否成功
   */
  const changeUserStatus = async (userId, status) => {
    try {
      const res = await updateUserStatus(userId, status)
      if (res.code === 200) {
        const statusText = status === 1 ? '启用' : '禁用'
        ElMessage.success(res.message || `用户${statusText}成功`)
        // 更新用户列表中的状态
        const userIndex = userList.value.findIndex(user => user.id === userId)
        if (userIndex !== -1) {
          userList.value[userIndex].status = status
        }
        // 更新用户详情中的状态
        if (userDetail.value && userDetail.value.id === userId) {
          userDetail.value.status = status
        }
        return true
      } else {
        ElMessage.error(res.message || '更新用户状态失败')
        return false
      }
    } catch (error) {
      console.error('更新用户状态失败', error)
      ElMessage.error(error.response?.data?.message || '更新用户状态失败')
      throw error
    }
  }
  
  /**
   * 重置用户密码
   * @param {number} userId - 用户ID
   * @param {string} password - 新密码
   * @returns {Promise<boolean>} 是否成功
   */
  const resetUserPassword = async (userId, password) => {
    try {
      const res = await resetPassword(userId, password)
      if (res.code === 200) {
        ElMessage.success(res.message || '重置密码成功')
        return true
      } else {
        ElMessage.error(res.message || '重置密码失败')
        return false
      }
    } catch (error) {
      console.error('重置密码失败', error)
      ElMessage.error(error.response?.data?.message || '重置密码失败')
      throw error
    }
  }
  
  /**
   * 修改用户角色
   * @param {number} userId - 用户ID
   * @param {number} role - 角色：1-管理员，2-用户
   * @returns {Promise<boolean>} 是否成功
   */
  const changeUserRole = async (userId, role) => {
    try {
      const res = await updateUserRole(userId, role)
      if (res.code === 200) {
        const roleText = role === 1 ? '管理员' : '普通用户'
        ElMessage.success(res.message || `用户角色已修改为${roleText}`)
        // 更新用户列表中的角色
        const userIndex = userList.value.findIndex(user => user.id === userId)
        if (userIndex !== -1) {
          userList.value[userIndex].role = role
        }
        // 更新用户详情中的角色
        if (userDetail.value && userDetail.value.id === userId) {
          userDetail.value.role = role
        }
        return true
      } else {
        ElMessage.error(res.message || '修改用户角色失败')
        return false
      }
    } catch (error) {
      console.error('修改用户角色失败', error)
      ElMessage.error(error.response?.data?.message || '修改用户角色失败')
      throw error
    }
  }
  
  /**
   * 获取用户统计信息
   * @returns {Promise<Object>} 用户统计信息
   */
  const fetchUserStatistics = async () => {
    try {
      const res = await getUserStatistics()
      if (res.code === 200) {
        userStatistics.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取用户统计信息失败')
        throw new Error(res.message || '获取用户统计信息失败')
      }
    } catch (error) {
      console.error('获取用户统计信息失败', error)
      throw error
    }
  }
  
  // ==================== 分类管理方法 ====================
  
  /**
   * 获取分类树形结构
   * @returns {Promise<Array>} 分类树形结构
   */
  const fetchCategoryTree = async () => {
    categoryTreeLoading.value = true
    try {
      const res = await getCategoryTree()
      if (res.code === 200) {
        categoryTree.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取分类树失败')
        throw new Error(res.message || '获取分类树失败')
      }
    } catch (error) {
      console.error('获取分类树失败', error)
      throw error
    } finally {
      categoryTreeLoading.value = false
    }
  }
  
  /**
   * 获取所有分类列表（平铺）
   * @returns {Promise<Array>} 所有分类
   */
  const fetchAllCategories = async () => {
    try {
      const res = await getAllCategories()
      if (res.code === 200) {
        categoryList.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取分类列表失败')
        throw new Error(res.message || '获取分类列表失败')
      }
    } catch (error) {
      console.error('获取分类列表失败', error)
      throw error
    }
  }
  
  /**
   * 获取分类详情
   * @param {number} categoryId - 分类ID
   * @returns {Promise<Object>} 分类详情
   */
  const fetchCategoryDetail = async (categoryId) => {
    try {
      const res = await getCategoryDetail(categoryId)
      if (res.code === 200) {
        categoryDetail.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取分类详情失败')
        throw new Error(res.message || '获取分类详情失败')
      }
    } catch (error) {
      console.error('获取分类详情失败', error)
      throw error
    }
  }
  
  /**
   * 创建分类
   * @param {Object} categoryData - 分类数据
   * @returns {Promise<boolean>} 是否成功
   */
  const createCategory = async (categoryData) => {
    try {
      const res = await addCategory(categoryData)
      if (res.code === 200) {
        ElMessage.success(res.message || '添加分类成功')
        // 刷新分类树和列表
        await Promise.all([fetchCategoryTree(), fetchAllCategories()])
        return true
      } else {
        ElMessage.error(res.message || '添加分类失败')
        return false
      }
    } catch (error) {
      console.error('添加分类失败', error)
      ElMessage.error(error.response?.data?.message || '添加分类失败')
      throw error
    }
  }
  
  /**
   * 更新分类
   * @param {Object} categoryData - 分类数据
   * @returns {Promise<boolean>} 是否成功
   */
  const editCategory = async (categoryData) => {
    try {
      const res = await updateCategory(categoryData)
      if (res.code === 200) {
        ElMessage.success(res.message || '更新分类成功')
        // 刷新分类树和列表
        await Promise.all([fetchCategoryTree(), fetchAllCategories()])
        // 更新分类详情
        if (categoryDetail.value && categoryDetail.value.id === categoryData.id) {
          categoryDetail.value = { ...categoryDetail.value, ...categoryData }
        }
        return true
      } else {
        ElMessage.error(res.message || '更新分类失败')
        return false
      }
    } catch (error) {
      console.error('更新分类失败', error)
      ElMessage.error(error.response?.data?.message || '更新分类失败')
      throw error
    }
  }
  
  /**
   * 删除分类
   * @param {number} categoryId - 分类ID
   * @returns {Promise<boolean>} 是否成功
   */
  const removeCategory = async (categoryId) => {
    try {
      const res = await deleteCategory(categoryId)
      if (res.code === 200) {
        ElMessage.success(res.message || '删除分类成功')
        // 刷新分类树和列表
        await Promise.all([fetchCategoryTree(), fetchAllCategories()])
        return true
      } else {
        ElMessage.error(res.message || '删除分类失败')
        return false
      }
    } catch (error) {
      console.error('删除分类失败', error)
      ElMessage.error(error.response?.data?.message || '删除分类失败')
      throw error
    }
  }
  
  /**
   * 更新分类状态
   * @param {number} categoryId - 分类ID
   * @param {number} status - 状态：0-禁用，1-正常
   * @returns {Promise<boolean>} 是否成功
   */
  const changeCategoryStatus = async (categoryId, status) => {
    try {
      const res = await updateCategoryStatus(categoryId, status)
      if (res.code === 200) {
        const statusText = status === 1 ? '启用' : '禁用'
        ElMessage.success(res.message || `分类${statusText}成功`)
        // 刷新分类树和列表
        await Promise.all([fetchCategoryTree(), fetchAllCategories()])
        // 更新分类详情
        if (categoryDetail.value && categoryDetail.value.id === categoryId) {
          categoryDetail.value.status = status
        }
        return true
      } else {
        ElMessage.error(res.message || '更新分类状态失败')
        return false
      }
    } catch (error) {
      console.error('更新分类状态失败', error)
      ElMessage.error(error.response?.data?.message || '更新分类状态失败')
      throw error
    }
  }
  
  /**
   * 上传分类图标
   * @param {File} file - 图标文件
   * @param {number} categoryId - 分类ID
   * @returns {Promise<string>} 图标URL
   */
  const uploadCategoryIconFile = async (file, categoryId) => {
    try {
      const res = await uploadCategoryIcon(file, categoryId)
      if (res.code === 200) {
        ElMessage.success(res.message || '上传图标成功')
        // 如果当前有加载的分类详情，且ID匹配，则更新图标
        if (categoryDetail.value && categoryDetail.value.id === categoryId) {
          categoryDetail.value.icon = res.data
        }
        return res.data
      } else {
        ElMessage.error(res.message || '上传图标失败')
        throw new Error(res.message || '上传图标失败')
      }
    } catch (error) {
      console.error('上传图标失败', error)
      ElMessage.error(error.response?.data?.message || '上传图标失败')
      throw error
    }
  }
  
  /**
   * 更新分类排序
   * @param {number} categoryId - 分类ID
   * @param {number} sort - 排序值
   * @returns {Promise<boolean>} 是否成功
   */
  const updateCategorySorting = async (categoryId, sort) => {
    try {
      const res = await updateCategorySort(categoryId, sort)
      if (res.code === 200) {
        ElMessage.success(res.message || '更新排序成功')
        // 刷新分类树和列表
        await Promise.all([fetchCategoryTree(), fetchAllCategories()])
        // 更新分类详情
        if (categoryDetail.value && categoryDetail.value.id === categoryId) {
          categoryDetail.value.sort = sort
        }
        return true
      } else {
        ElMessage.error(res.message || '更新排序失败')
        return false
      }
    } catch (error) {
      console.error('更新排序失败', error)
      ElMessage.error(error.response?.data?.message || '更新排序失败')
      throw error
    }
  }
  
  /**
   * 移动分类（修改父分类）
   * @param {number} categoryId - 分类ID
   * @param {number} targetParentId - 目标父分类ID
   * @returns {Promise<boolean>} 是否成功
   */
  const moveCategoryToParent = async (categoryId, targetParentId) => {
    try {
      const res = await moveCategory(categoryId, targetParentId)
      if (res.code === 200) {
        ElMessage.success(res.message || '移动分类成功')
        // 刷新分类树和列表
        await Promise.all([fetchCategoryTree(), fetchAllCategories()])
        // 更新分类详情
        if (categoryDetail.value && categoryDetail.value.id === categoryId) {
          categoryDetail.value.parentId = targetParentId
        }
        return true
      } else {
        ElMessage.error(res.message || '移动分类失败')
        return false
      }
    } catch (error) {
      console.error('移动分类失败', error)
      ElMessage.error(error.response?.data?.message || '移动分类失败')
      throw error
    }
  }
  
  /**
   * 批量添加分类
   * @param {Array<Object>} categories - 分类列表
   * @returns {Promise<boolean>} 是否成功
   */
  const batchCreateCategories = async (categories) => {
    try {
      const res = await batchAddCategories(categories)
      if (res.code === 200) {
        ElMessage.success(res.message || '批量添加分类成功')
        // 刷新分类树和列表
        await Promise.all([fetchCategoryTree(), fetchAllCategories()])
        return true
      } else {
        ElMessage.error(res.message || '批量添加分类失败')
        return false
      }
    } catch (error) {
      console.error('批量添加分类失败', error)
      ElMessage.error(error.response?.data?.message || '批量添加分类失败')
      throw error
    }
  }
  
  // ==================== 订单管理方法 ====================
  
  /**
   * 获取订单列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 订单分页数据
   */
  const fetchOrderList = async (params = {}) => {
    orderListLoading.value = true
    try {
      const res = await getOrderList(params)
      if (res.code === 200) {
        orderList.value = res.data.records
        orderTotal.value = res.data.total
        return res.data
      } else {
        ElMessage.error(res.message || '获取订单列表失败')
        throw new Error(res.message || '获取订单列表失败')
      }
    } catch (error) {
      console.error('获取订单列表失败', error)
      throw error
    } finally {
      orderListLoading.value = false
    }
  }
  
  /**
   * 获取订单详情
   * @param {string} orderNo - 订单编号
   * @returns {Promise<Object>} 订单详情
   */
  const fetchOrderDetail = async (orderNo) => {
    try {
      if (!orderNo || typeof orderNo !== 'string') {
        ElMessage.error('订单编号无效')
        return null
      }
      
      // 验证订单号格式
      if (!/^\d{17,20}$/.test(orderNo)) {
        ElMessage.error('订单号格式不正确')
        return null
      }
      
      const res = await getOrderDetail(orderNo)
      if (res.code === 200) {
        orderDetail.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取订单详情失败')
        return null
      }
    } catch (error) {
      console.error('获取订单详情失败', error)
      
      // 根据错误类型提供更详细的错误信息
      if (error.response) {
        // 服务器返回了错误状态码
        const status = error.response.status
        if (status === 404) {
          ElMessage.error('订单不存在')
        } else if (status === 403) {
          ElMessage.error('没有权限查看此订单')
        } else {
          ElMessage.error(`服务器错误(${status}): ${error.response.data?.message || '未知错误'}`)
        }
      } else if (error.request) {
        // 请求已发送但没有收到响应
        ElMessage.error('服务器无响应，请检查网络连接')
      } else {
        // 请求设置触发的错误
        ElMessage.error(error.message || '请求订单详情失败')
      }
      
      throw error
    }
  }
  
  /**
   * 订单发货
   * @param {string} orderNo - 订单编号
   * @param {string} shippingCode - 物流单号
   * @returns {Promise<boolean>} 是否成功
   */
  const shipOrderWithCode = async (orderNo, shippingCode) => {
    try {
      const res = await shipOrder(orderNo, shippingCode)
      if (res.code === 200) {
        ElMessage.success(res.message || '订单发货成功')
        // 如果当前存在订单详情且匹配，则更新其状态
        if (orderDetail.value && orderDetail.value.orderNo === orderNo) {
          orderDetail.value.status = 2  // 发货后状态为待收货(2)
          orderDetail.value.statusDesc = '待收货'
        }
        return true
      } else {
        ElMessage.error(res.message || '订单发货失败')
        return false
      }
    } catch (error) {
      console.error('订单发货失败', error)
      ElMessage.error(error.response?.data?.message || '订单发货失败')
      throw error
    }
  }
  
  /**
   * 取消订单
   * @param {string} orderNo - 订单编号
   * @returns {Promise<boolean>} 是否成功
   */
  const cancelOrderByAdmin = async (orderNo) => {
    try {
      const res = await cancelOrder(orderNo)
      if (res.code === 200) {
        ElMessage.success(res.message || '订单取消成功')
        // 如果当前存在订单详情且匹配，则更新其状态
        if (orderDetail.value && orderDetail.value.orderNo === orderNo) {
          orderDetail.value.status = 4  // 取消后状态为已取消(4)
          orderDetail.value.statusDesc = '已取消'
        }
        return true
      } else {
        ElMessage.error(res.message || '订单取消失败')
        return false
      }
    } catch (error) {
      console.error('订单取消失败', error)
      ElMessage.error(error.response?.data?.message || '订单取消失败')
      throw error
    }
  }
  
  /**
   * 获取订单统计信息
   * @returns {Promise<Object>} 订单统计信息
   */
  const fetchOrderStatistics = async () => {
    try {
      const res = await getOrderStatistics()
      if (res.code === 200) {
        orderStatistics.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取订单统计信息失败')
        throw new Error(res.message || '获取订单统计信息失败')
      }
    } catch (error) {
      console.error('获取订单统计信息失败', error)
      throw error
    }
  }
  
  /**
   * 获取订单状态分布
   * @returns {Promise<Object>} 订单状态分布
   */
  const fetchOrderStatusDistribution = async () => {
    try {
      const res = await getOrderStatusDistribution()
      if (res.code === 200) {
        orderStatusDistribution.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取订单状态分布失败')
        throw new Error(res.message || '获取订单状态分布失败')
      }
    } catch (error) {
      console.error('获取订单状态分布失败', error)
      throw error
    }
  }
  
  /**
   * 修改订单备注
   * @param {string} orderNo - 订单编号
   * @param {string} note - 备注内容
   * @returns {Promise<boolean>} 是否成功
   */
  const updateOrderComment = async (orderNo, note) => {
    try {
      const res = await updateOrderNote(orderNo, note)
      if (res.code === 200) {
        ElMessage.success(res.message || '更新订单备注成功')
        // 如果当前存在订单详情且匹配，则更新其备注
        if (orderDetail.value && orderDetail.value.orderNo === orderNo) {
          orderDetail.value.note = note
        }
        return true
      } else {
        ElMessage.error(res.message || '更新订单备注失败')
        return false
      }
    } catch (error) {
      console.error('更新订单备注失败', error)
      ElMessage.error(error.response?.data?.message || '更新订单备注失败')
      throw error
    }
  }
  
  /**
   * 导出订单数据
   * @param {Object} params - 查询参数
   * @returns {Promise<string>} 导出文件链接
   */
  const exportOrderData = async (params = {}) => {
    try {
      const res = await exportOrders(params)
      if (res.code === 200) {
        ElMessage.success(res.message || '订单导出成功')
        return res.data
      } else {
        ElMessage.error(res.message || '订单导出失败')
        throw new Error(res.message || '订单导出失败')
      }
    } catch (error) {
      console.error('订单导出失败', error)
      throw error
    }
  }

  // ==================== 商品管理方法 ====================
  
  /**
   * 获取商品列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 商品分页数据
   */
  const fetchProductList = async (params = {}) => {
    productListLoading.value = true
    try {
      const res = await getProductList(params)
      if (res.code === 200) {
        productList.value = res.data.records
        productTotal.value = res.data.total
        return res.data
      } else {
        ElMessage.error(res.message || '获取商品列表失败')
        throw new Error(res.message || '获取商品列表失败')
      }
    } catch (error) {
      console.error('获取商品列表失败', error)
      throw error
    } finally {
      productListLoading.value = false
    }
  }
  
  /**
   * 获取商品详情
   * @param {number} productId - 商品ID
   * @returns {Promise<Object>} 商品详情
   */
  const fetchProductDetail = async (productId) => {
    try {
      const res = await getProductDetail(productId)
      if (res.code === 200) {
        productDetail.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取商品详情失败')
        throw new Error(res.message || '获取商品详情失败')
      }
    } catch (error) {
      console.error('获取商品详情失败', error)
      throw error
    }
  }
  
  /**
   * 添加商品
   * @param {Object} productData - 商品数据
   * @returns {Promise<boolean>} 是否成功
   */
  const createProduct = async (productData) => {
    try {
      const res = await addProduct(productData)
      if (res.code === 200) {
        ElMessage.success(res.message || '添加商品成功')
        return true
      } else {
        ElMessage.error(res.message || '添加商品失败')
        return false
      }
    } catch (error) {
      console.error('添加商品失败', error)
      ElMessage.error(error.response?.data?.message || '添加商品失败')
      throw error
    }
  }
  
  /**
   * 更新商品
   * @param {Object} productData - 商品数据
   * @returns {Promise<boolean>} 是否成功
   */
  const editProduct = async (productData) => {
    try {
      const res = await updateProduct(productData)
      if (res.code === 200) {
        ElMessage.success(res.message || '更新商品成功')
        // 更新商品详情（如果有）
        if (productDetail.value && productDetail.value.id === productData.id) {
          productDetail.value = { ...productDetail.value, ...productData }
        }
        return true
      } else {
        ElMessage.error(res.message || '更新商品失败')
        return false
      }
    } catch (error) {
      console.error('更新商品失败', error)
      ElMessage.error(error.response?.data?.message || '更新商品失败')
      throw error
    }
  }
  
  /**
   * 删除商品
   * @param {number} productId - 商品ID
   * @returns {Promise<boolean>} 是否成功
   */
  const removeProduct = async (productId) => {
    try {
      const res = await deleteProduct(productId)
      if (res.code === 200) {
        ElMessage.success(res.message || '删除商品成功')
        return true
      } else {
        ElMessage.error(res.message || '删除商品失败')
        return false
      }
    } catch (error) {
      console.error('删除商品失败', error)
      ElMessage.error(error.response?.data?.message || '删除商品失败')
      throw error
    }
  }
  
  /**
   * 商品上下架
   * @param {number} productId - 商品ID
   * @param {number} status - 状态：0-下架，1-上架
   * @returns {Promise<boolean>} 是否成功
   */
  const changeProductStatus = async (productId, status) => {
    try {
      const res = await updateProductStatus(productId, status)
      if (res.code === 200) {
        const statusText = status === 1 ? '上架' : '下架'
        ElMessage.success(res.message || `商品${statusText}成功`)
        // 更新商品列表中的状态
        const productIndex = productList.value.findIndex(p => p.id === productId)
        if (productIndex !== -1) {
          productList.value[productIndex].status = status
        }
        // 更新商品详情中的状态
        if (productDetail.value && productDetail.value.id === productId) {
          productDetail.value.status = status
        }
        return true
      } else {
        ElMessage.error(res.message || '更新商品状态失败')
        return false
      }
    } catch (error) {
      console.error('更新商品状态失败', error)
      ElMessage.error(error.response?.data?.message || '更新商品状态失败')
      throw error
    }
  }
  
  /**
   * 更新商品库存
   * @param {number} productId - 商品ID
   * @param {number} stock - 库存数量
   * @returns {Promise<boolean>} 是否成功
   */
  const updateProductStockCount = async (productId, stock) => {
    try {
      const res = await updateProductStock(productId, stock)
      if (res.code === 200) {
        ElMessage.success(res.message || '更新库存成功')
        // 更新商品列表中的库存
        const productIndex = productList.value.findIndex(p => p.id === productId)
        if (productIndex !== -1) {
          productList.value[productIndex].stock = stock
        }
        // 更新商品详情中的库存
        if (productDetail.value && productDetail.value.id === productId) {
          productDetail.value.stock = stock
        }
        return true
      } else {
        ElMessage.error(res.message || '更新库存失败')
        return false
      }
    } catch (error) {
      console.error('更新库存失败', error)
      ElMessage.error(error.response?.data?.message || '更新库存失败')
      throw error
    }
  }
  
  /**
   * 更新商品价格
   * @param {number} productId - 商品ID
   * @param {number} price - 价格
   * @param {number} [originalPrice] - 原价(可选)
   * @returns {Promise<boolean>} 是否成功
   */
  const updateProductPriceInfo = async (productId, price, originalPrice) => {
    try {
      const res = await updateProductPrice(productId, price, originalPrice)
      if (res.code === 200) {
        ElMessage.success(res.message || '更新价格成功')
        
        // 更新商品列表中的价格
        const productIndex = productList.value.findIndex(p => p.id === productId)
        if (productIndex !== -1) {
          productList.value[productIndex].price = price
          if (originalPrice !== undefined) {
            productList.value[productIndex].originalPrice = originalPrice
          }
        }
        
        // 更新商品详情中的价格
        if (productDetail.value && productDetail.value.id === productId) {
          productDetail.value.price = price
          if (originalPrice !== undefined) {
            productDetail.value.originalPrice = originalPrice
          }
        }
        
        return true
      } else {
        ElMessage.error(res.message || '更新价格失败')
        return false
      }
    } catch (error) {
      console.error('更新价格失败', error)
      ElMessage.error(error.response?.data?.message || '更新价格失败')
      throw error
    }
  }
  
  /**
   * 上传商品主图
   * @param {File} file - 图片文件
   * @param {number} productId - 商品ID
   * @returns {Promise<string>} 图片URL
   */
  const uploadProductMainImage = async (file, productId) => {
    try {
      const res = await uploadProductImage(file, productId)
      if (res.code === 200) {
        ElMessage.success(res.message || '上传商品主图成功')
        // 更新商品详情中的主图
        if (productDetail.value && productDetail.value.id === productId) {
          productDetail.value.image = res.data
        }
        return res.data
      } else {
        ElMessage.error(res.message || '上传商品主图失败')
        throw new Error(res.message || '上传商品主图失败')
      }
    } catch (error) {
      console.error('上传商品主图失败', error)
      ElMessage.error(error.response?.data?.message || '上传商品主图失败')
      throw error
    }
  }
  
  /**
   * 上传商品图片（添加到图片集）
   * @param {File} file - 图片文件
   * @param {number} productId - 商品ID
   * @returns {Promise<string>} 图片URL
   */
  const uploadProductGalleryImage = async (file, productId) => {
    try {
      const res = await uploadProductImages(file, productId)
      if (res.code === 200) {
        ElMessage.success(res.message || '上传商品图片成功')
        
        // 更新商品详情中的图片集
        if (productDetail.value && productDetail.value.id === productId) {
          // 如果已有图片集，则添加新的图片URL
          if (productDetail.value.images) {
            const imagesArray = productDetail.value.images.split(',')
            imagesArray.push(res.data)
            productDetail.value.images = imagesArray.join(',')
          } else {
            // 如果没有图片集，则直接设置
            productDetail.value.images = res.data
          }
        }
        
        return res.data
      } else {
        ElMessage.error(res.message || '上传商品图片失败')
        throw new Error(res.message || '上传商品图片失败')
      }
    } catch (error) {
      console.error('上传商品图片失败', error)
      ElMessage.error(error.response?.data?.message || '上传商品图片失败')
      throw error
    }
  }
  
  /**
   * 删除商品图片
   * @param {number} productId - 商品ID
   * @param {string} imageUrl - 图片URL
   * @returns {Promise<boolean>} 是否成功
   */
  const removeProductImage = async (productId, imageUrl) => {
    try {
      const res = await deleteProductImage(productId, imageUrl)
      if (res.code === 200) {
        ElMessage.success(res.message || '删除商品图片成功')
        
        // 更新商品详情中的图片集
        if (productDetail.value && productDetail.value.id === productId && productDetail.value.images) {
          const imagesArray = productDetail.value.images.split(',')
          const updatedImagesArray = imagesArray.filter(url => url !== imageUrl)
          productDetail.value.images = updatedImagesArray.join(',')
        }
        
        return true
      } else {
        ElMessage.error(res.message || '删除商品图片失败')
        return false
      }
    } catch (error) {
      console.error('删除商品图片失败', error)
      ElMessage.error(error.response?.data?.message || '删除商品图片失败')
      throw error
    }
  }
  
  /**
   * 批量上下架商品
   * @param {Array<number>} productIds - 商品ID列表
   * @param {number} status - 状态：0-下架，1-上架
   * @returns {Promise<boolean>} 是否成功
   */
  const batchChangeProductStatus = async (productIds, status) => {
    try {
      const res = await batchUpdateProductStatus(productIds, status)
      if (res.code === 200) {
        const statusText = status === 1 ? '上架' : '下架'
        ElMessage.success(res.message || `批量${statusText}商品成功`)
        return true
      } else {
        ElMessage.error(res.message || '批量更新商品状态失败')
        return false
      }
    } catch (error) {
      console.error('批量更新商品状态失败', error)
      ElMessage.error(error.response?.data?.message || '批量更新商品状态失败')
      throw error
    }
  }
  
  // ==================== 推荐管理方法 ====================
  
  /**
   * 计算所有商品间的相似度
   * @returns {Promise<number>} 计算结果
   */
  const calculateAllSimilarities = async () => {
    recommendationLoading.value = true
    try {
      const res = await calculateAllProductSimilarities()
      if (res.code === 200) {
        ElMessage.success(res.message || '成功计算商品相似度')
        return res.data
      } else {
        ElMessage.error(res.message || '计算商品相似度失败')
        throw new Error(res.message || '计算商品相似度失败')
      }
    } catch (error) {
      console.error('计算商品相似度失败', error)
      ElMessage.error(error.response?.data?.message || '计算商品相似度失败')
      throw error
    } finally {
      recommendationLoading.value = false
    }
  }
  
  /**
   * 计算指定商品与其他所有商品的相似度
   * @param {number} productId - 商品ID
   * @returns {Promise<number>} 计算结果
   */
  const calculateSimilaritiesForProduct = async (productId) => {
    try {
      const res = await calculateProductSimilarities(productId)
      if (res.code === 200) {
        ElMessage.success(res.message || '成功计算指定商品相似度')
        return res.data
      } else {
        ElMessage.error(res.message || '计算指定商品相似度失败')
        throw new Error(res.message || '计算指定商品相似度失败')
      }
    } catch (error) {
      console.error('计算指定商品相似度失败', error)
      ElMessage.error(error.response?.data?.message || '计算指定商品相似度失败')
      throw error
    }
  }
  
  /**
   * 计算用户偏好
   * @param {number} [userId] - 用户ID，为空则计算所有用户
   * @returns {Promise<number>} 计算结果
   */
  const calculatePreferences = async (userId) => {
    recommendationLoading.value = true
    try {
      const res = await calculateUserPreferences(userId)
      if (res.code === 200) {
        const message = userId 
          ? `成功更新用户${userId}的偏好记录` 
          : '成功更新所有用户偏好记录'
        ElMessage.success(res.message || message)
        return res.data
      } else {
        ElMessage.error(res.message || '计算用户偏好失败')
        throw new Error(res.message || '计算用户偏好失败')
      }
    } catch (error) {
      console.error('计算用户偏好失败', error)
      ElMessage.error(error.response?.data?.message || '计算用户偏好失败')
      throw error
    } finally {
      recommendationLoading.value = false
    }
  }
  
  /**
   * 生成用户推荐结果
   * @param {number} [userId] - 用户ID，为空则生成所有用户的推荐
   * @param {number} [limit=10] - 每种推荐类型的数量限制
   * @returns {Promise<number>} 生成结果
   */
  const generateRecommendations = async (userId, limit = 10) => {
    recommendationLoading.value = true
    try {
      const res = await calculateRecommendations(userId, limit)
      if (res.code === 200) {
        const message = userId 
          ? `成功更新用户${userId}的推荐记录` 
          : '成功更新所有用户推荐记录'
        ElMessage.success(res.message || message)
        return res.data
      } else {
        ElMessage.error(res.message || '生成推荐记录失败')
        throw new Error(res.message || '生成推荐记录失败')
      }
    } catch (error) {
      console.error('生成推荐记录失败', error)
      ElMessage.error(error.response?.data?.message || '生成推荐记录失败')
      throw error
    } finally {
      recommendationLoading.value = false
    }
  }
  
  /**
   * 获取用户与其他用户的相似度
   * @param {number} [userId] - 用户ID，为空则使用当前登录用户
   * @param {number} [limit=5] - 数量限制
   * @returns {Promise<Object>} 相似用户列表及相似度
   */
  const fetchSimilarUsers = async (userId, limit = 5) => {
    recommendationLoading.value = true
    try {
      const res = await getSimilarUsers(userId, limit)
      if (res.code === 200) {
        similarUsers.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取相似用户失败')
        throw new Error(res.message || '获取相似用户失败')
      }
    } catch (error) {
      console.error('获取相似用户失败', error)
      ElMessage.error(error.response?.data?.message || '获取相似用户失败')
      throw error
    } finally {
      recommendationLoading.value = false
    }
  }
  
  /**
   * 更新所有用户偏好
   * 这是一个耗时操作，建议在系统负载较低时执行
   * @returns {Promise<Object>} 更新结果，包含更新数量和执行时间
   */
  const updateAllUserPreferences = async () => {
    recommendationLoading.value = true
    try {
      const res = await updateAllUserPreferences()
      if (res.code === 200) {
        preferencesUpdateResult.value = res.data
        ElMessage.success(res.message || '成功更新所有用户偏好')
        return res.data
      } else {
        ElMessage.error(res.message || '更新所有用户偏好失败')
        throw new Error(res.message || '更新所有用户偏好失败')
      }
    } catch (error) {
      console.error('更新所有用户偏好失败', error)
      ElMessage.error(error.response?.data?.message || '更新所有用户偏好失败')
      throw error
    } finally {
      recommendationLoading.value = false
    }
  }
  
  // ==================== 统计数据方法 ====================
  
  /**
   * 获取仪表盘概要数据
   * @returns {Promise<Object>} 仪表盘概要数据
   */
  const fetchDashboardSummary = async () => {
    dashboardLoading.value = true
    try {
      const res = await getDashboardSummary()
      if (res.code === 200) {
        dashboardSummary.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取仪表盘数据失败')
        throw new Error(res.message || '获取仪表盘数据失败')
      }
    } catch (error) {
      console.error('获取仪表盘数据失败', error)
      throw error
    } finally {
      dashboardLoading.value = false
    }
  }
  
  /**
   * 获取销售统计数据
   * @param {string} timeRange - 时间范围
   * @returns {Promise<Object>} 销售统计数据
   */
  const fetchSalesStatistics = async (timeRange = 'week') => {
    try {
      const res = await getSalesStatistics(timeRange)
      if (res.code === 200) {
        salesStatistics.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取销售统计数据失败')
        throw new Error(res.message || '获取销售统计数据失败')
      }
    } catch (error) {
      console.error('获取销售统计数据失败', error)
      throw error
    }
  }
  
  /**
   * 获取商品销售排行榜
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 商品销售排行榜
   */
  const fetchProductRanking = async (limit = 10) => {
    try {
      const res = await getProductSalesRanking(limit)
      if (res.code === 200) {
        productRanking.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取商品排行榜失败')
        throw new Error(res.message || '获取商品排行榜失败')
      }
    } catch (error) {
      console.error('获取商品排行榜失败', error)
      throw error
    }
  }
  
  /**
   * 获取分类销售统计
   * @returns {Promise<Array>} 分类销售统计
   */
  const fetchCategorySalesStats = async () => {
    try {
      const res = await getCategorySalesStatistics()
      if (res.code === 200) {
        categorySalesStats.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取分类销售统计失败')
        throw new Error(res.message || '获取分类销售统计失败')
      }
    } catch (error) {
      console.error('获取分类销售统计失败', error)
      throw error
    }
  }
  
  /**
   * 获取每日用户注册统计
   * @param {number} days - 天数
   * @returns {Promise<Array>} 每日注册统计列表
   */
  const fetchDailyUserRegistrations = async (days = 7) => {
    try {
      const res = await getDailyUserRegistrations(days)
      if (res.code === 200) {
        return res.data
      } else {
        ElMessage.error(res.message || '获取用户注册统计失败')
        throw new Error(res.message || '获取用户注册统计失败')
      }
    } catch (error) {
      console.error('获取用户注册统计失败', error)
      throw error
    }
  }
  
  /**
   * 获取每日订单统计
   * @param {number} days - 天数
   * @returns {Promise<Array>} 每日订单统计列表
   */
  const fetchDailyOrderStatistics = async (days = 7) => {
    try {
      const res = await getDailyOrderStatistics(days)
      if (res.code === 200) {
        return res.data
      } else {
        ElMessage.error(res.message || '获取订单统计失败')
        throw new Error(res.message || '获取订单统计失败')
      }
    } catch (error) {
      console.error('获取订单统计失败', error)
      throw error
    }
  }
  
  /**
   * 计算销售增长率
   * @param {number} days - 天数
   * @returns {Promise<number>} 增长率
   */
  const fetchSalesGrowthRate = async (days = 30) => {
    try {
      const res = await calculateSalesGrowthRate(days)
      if (res.code === 200) {
        return res.data
      } else {
        ElMessage.error(res.message || '计算销售增长率失败')
        throw new Error(res.message || '计算销售增长率失败')
      }
    } catch (error) {
      console.error('计算销售增长率失败', error)
      throw error
    }
  }
  
  /**
   * 获取销售趋势
   * @param {number} days - 天数
   * @returns {Promise<Array>} 销售趋势
   */
  const fetchSalesTrend = async (days = 30) => {
    try {
      const res = await getSalesTrend(days)
      if (res.code === 200) {
        salesTrend.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取销售趋势失败')
        throw new Error(res.message || '获取销售趋势失败')
      }
    } catch (error) {
      console.error('获取销售趋势失败', error)
      throw error
    }
  }
  
  /**
   * 获取统计概览数据
   * @returns {Promise<Object>} 统计概览数据
   */
  const fetchStatisticsOverview = async () => {
    try {
      const res = await getStatisticsOverview()
      if (res.code === 200) {
        statisticsOverview.value = res.data
        return res.data
      } else {
        ElMessage.error(res.message || '获取统计概览失败')
        throw new Error(res.message || '获取统计概览失败')
      }
    } catch (error) {
      console.error('获取统计概览失败', error)
      throw error
    }
  }

  return {
    // 用户管理状态
    userListLoading,
    userList,
    userTotal,
    userDetail,
    userStatistics,
    
    // 分类管理状态
    categoryTreeLoading,
    categoryTree,
    categoryList,
    categoryDetail,
    
    // 订单管理状态
    orderListLoading,
    orderList,
    orderTotal,
    orderDetail,
    orderStatistics,
    orderStatusDistribution,
    
    // 商品管理状态
    productListLoading,
    productList,
    productTotal,
    productDetail,
    
    // 推荐管理状态
    recommendationLoading,
    similarUsers,
    preferencesUpdateResult,
    
    // 统计数据状态
    dashboardLoading,
    dashboardSummary,
    salesStatistics,
    productRanking,
    categorySalesStats,
    salesTrend,
    statisticsOverview,
    
    // 用户管理方法
    fetchUserList,
    fetchUserDetail,
    createUser,
    editUser,
    removeUser,
    changeUserStatus,
    resetUserPassword,
    changeUserRole,
    fetchUserStatistics,
    
    // 分类管理方法
    fetchCategoryTree,
    fetchAllCategories,
    fetchCategoryDetail,
    createCategory,
    editCategory,
    removeCategory,
    changeCategoryStatus,
    uploadCategoryIconFile,
    updateCategorySorting,
    moveCategoryToParent,
    batchCreateCategories,
    
    // 订单管理方法
    fetchOrderList,
    fetchOrderDetail,
    shipOrderWithCode,
    cancelOrderByAdmin,
    fetchOrderStatistics,
    fetchOrderStatusDistribution,
    updateOrderComment,
    exportOrderData,
    
    // 商品管理方法
    fetchProductList,
    fetchProductDetail,
    createProduct,
    editProduct,
    removeProduct,
    changeProductStatus,
    updateProductStockCount,
    updateProductPriceInfo,
    uploadProductMainImage,
    uploadProductGalleryImage,
    removeProductImage,
    batchChangeProductStatus,
    
    // 推荐管理方法
    calculateAllSimilarities,
    calculateSimilaritiesForProduct,
    calculatePreferences,
    generateRecommendations,
    fetchSimilarUsers,
    updateAllUserPreferences,
    
    // 统计数据方法
    fetchDashboardSummary,
    fetchSalesStatistics,
    fetchProductRanking,
    fetchCategorySalesStats,
    fetchDailyUserRegistrations,
    fetchDailyOrderStatistics,
    fetchSalesGrowthRate,
    fetchSalesTrend,
    fetchStatisticsOverview
  }
})
