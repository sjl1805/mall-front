import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from './user'
import {
  addReview as apiAddReview,
  deleteReview as apiDeleteReview,
  getProductReviews as apiGetProductReviews,
  getUserReviews as apiGetUserReviews,
  getProductReviewStats as apiGetProductReviewStats,
  checkReviewed as apiCheckReviewed,
  getLatestReviews as apiGetLatestReviews
} from '@/api/review'

export const useReviewStore = defineStore('review', () => {
  // 状态
  const productReviews = ref({}) // 以商品ID为键的评价列表
  const userReviews = ref([]) // 用户评价列表
  const reviewStats = ref({}) // 以商品ID为键的评价统计信息
  const reviewedProducts = ref({}) // 记录用户已评价过的商品，键为商品ID，值为布尔值
  const latestReviews = ref([]) // 最新评价列表
  
  // 分页状态
  const productReviewPages = ref({}) // 以商品ID为键的分页信息
  const userReviewPage = ref({
    current: 1,
    size: 10,
    total: 0
  })
  
  // 加载状态
  const loading = ref({
    productReviews: false,
    userReviews: false,
    reviewStats: false,
    checkReviewed: false,
    latestReviews: false,
    addReview: false,
    deleteReview: false
  })
  
  // 计算属性
  const hasProductReviews = computed(() => (productId) => {
    return productReviews.value[productId] && productReviews.value[productId].length > 0
  })
  
  const hasUserReviews = computed(() => userReviews.value.length > 0)
  const hasLatestReviews = computed(() => latestReviews.value.length > 0)
  
  /**
   * 添加商品评价
   * @param {Object} reviewData - 评价信息
   * @param {number} reviewData.productId - 商品ID
   * @param {number} reviewData.orderId - 订单ID
   * @param {string} reviewData.content - 评价内容
   * @param {number} reviewData.rating - 评分(1-5星)
   * @param {Array<string>} [reviewData.images] - 评价图片列表(可选)
   * @param {boolean} [reviewData.anonymous=false] - 是否匿名(可选)
   * @returns {Promise<number|null>} 评价ID，失败返回null
   */
  const addReview = async (reviewData) => {
    const userStore = useUserStore()
    
    // 未登录时提示登录
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录后再发表评价')
      return null
    }
    
    // 验证必填字段
    if (!reviewData.productId) {
      ElMessage.warning('商品ID不能为空')
      return null
    }
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      ElMessage.warning('评分必须在1-5之间')
      return null
    }
    
    loading.value.addReview = true
    
    try {
      // 处理评价图片
      let processedData = { ...reviewData }
      if (reviewData.images && Array.isArray(reviewData.images)) {
        processedData.images = reviewData.images.join(',')
      }
      
      // 处理匿名字段
      if (reviewData.anonymous !== undefined) {
        processedData.anonymous = reviewData.anonymous ? 1 : 0
      } else {
        processedData.anonymous = 0 // 默认不匿名
      }
      
      const res = await apiAddReview(processedData)
      
      if (res.code === 200 && res.data) {
        const reviewId = res.data
        ElMessage.success('评价发表成功')
        
        // 标记该商品已被评价
        reviewedProducts.value[reviewData.productId] = true
        
        // 重新加载评价列表
        if (productReviews.value[reviewData.productId]) {
          getProductReviews(reviewData.productId, 1, 10)
        }
        
        // 重新加载评价统计
        if (reviewStats.value[reviewData.productId]) {
          getProductReviewStats(reviewData.productId)
        }
        
        return reviewId
      }
      
      ElMessage.error(res.message || '评价发表失败')
      return null
    } catch (error) {
      console.error('评价发表失败', error)
      ElMessage.error('评价发表失败，请稍后重试')
      return null
    } finally {
      loading.value.addReview = false
    }
  }
  
  /**
   * 删除评价
   * @param {number} reviewId - 评价ID
   * @param {number} productId - 商品ID，用于更新相关视图
   * @returns {Promise<boolean>} 是否删除成功
   */
  const deleteReview = async (reviewId, productId) => {
    const userStore = useUserStore()
    
    // 未登录时提示登录
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录后再操作')
      return false
    }
    
    if (!reviewId) {
      ElMessage.warning('评价ID不能为空')
      return false
    }
    
    loading.value.deleteReview = true
    
    try {
      const res = await apiDeleteReview(reviewId)
      
      if (res.code === 200) {
        ElMessage.success('评价删除成功')
        
        // 更新用户评价列表
        userReviews.value = userReviews.value.filter(review => review.id !== reviewId)
        
        // 如果提供了商品ID，更新相关数据
        if (productId) {
          // 更新商品评价列表
          if (productReviews.value[productId]) {
            productReviews.value[productId] = productReviews.value[productId].filter(
              review => review.id !== reviewId
            )
          }
          
          // 重新检查是否已评价该商品
          checkReviewed(productId)
          
          // 重新加载评价统计
          if (reviewStats.value[productId]) {
            getProductReviewStats(productId)
          }
        }
        
        return true
      }
      
      ElMessage.error(res.message || '删除评价失败')
      return false
    } catch (error) {
      console.error('删除评价失败', error)
      ElMessage.error('删除评价失败，请稍后重试')
      return false
    } finally {
      loading.value.deleteReview = false
    }
  }
  
  /**
   * 获取商品评价列表
   * @param {number} productId - 商品ID
   * @param {number} [page=1] - 页码
   * @param {number} [size=10] - 每页数量
   * @param {boolean} [force=false] - 是否强制刷新
   * @returns {Promise<Array>} 评价列表
   */
  const getProductReviews = async (productId, page = 1, size = 10, force = false) => {
    if (!productId) {
      console.error('获取商品评价失败: 商品ID不能为空')
      return []
    }
    
    // 如果已有数据且不强制刷新，则直接返回缓存数据
    if (!force && 
        productReviews.value[productId] && 
        productReviewPages.value[productId] && 
        productReviewPages.value[productId].current === page && 
        productReviewPages.value[productId].size === size) {
      return productReviews.value[productId]
    }
    
    loading.value.productReviews = true
    
    try {
      const res = await apiGetProductReviews(productId, page, size)
      
      if (res.code === 200 && res.data) {
        // 更新评价列表
        productReviews.value[productId] = res.data.records || []
        
        // 更新分页信息
        productReviewPages.value[productId] = {
          current: res.data.current,
          size: res.data.size,
          total: res.data.total
        }
        
        return productReviews.value[productId]
      }
      
      ElMessage.error(res.message || '获取商品评价失败')
      return []
    } catch (error) {
      console.error(`获取商品评价失败: productId=${productId}`, error)
      return []
    } finally {
      loading.value.productReviews = false
    }
  }
  
  /**
   * 获取用户评价列表
   * @param {number} [page=1] - 页码
   * @param {number} [size=10] - 每页数量
   * @param {boolean} [force=false] - 是否强制刷新
   * @returns {Promise<Array>} 评价列表
   */
  const getUserReviews = async (page = 1, size = 10, force = false) => {
    const userStore = useUserStore()
    
    // 未登录检查 - 检查token有效性
    if (!userStore.token) {
      console.warn('用户未登录或token不存在，不发送评价列表请求')
      userReviews.value = []
      userReviewPage.value = {
        current: 1,
        size: 10,
        total: 0
      }
      return []
    }
    
    // 如果已有数据且不强制刷新，则直接返回缓存数据
    if (!force && 
        userReviews.value.length > 0 && 
        userReviewPage.value.current === page && 
        userReviewPage.value.size === size) {
      return userReviews.value
    }
    
    loading.value.userReviews = true
    
    try {
      // 设置请求重试次数
      let retries = 0;
      const maxRetries = 1;
      let success = false;
      let res;
      
      while (!success && retries <= maxRetries) {
        try {
          res = await apiGetUserReviews(page, size);
          success = true;
        } catch (error) {
          // 如果是401错误且还有重试机会，尝试刷新token并重试
          if (error.response?.status === 401 && retries < maxRetries) {
            console.warn('401错误，尝试刷新token后重试');
            retries++;
            try {
              // 尝试刷新用户信息
              await userStore.getUserInfo();
            } catch (refreshError) {
              console.error('刷新用户信息失败', refreshError);
            }
          } else {
            throw error; // 重试失败或其他错误，抛出
          }
        }
      }
      
      if (!res || !success) {
        throw new Error('获取评价列表失败');
      }
      
      if (res.code === 200 && res.data) {
        // 更新评价列表
        userReviews.value = res.data.records || []
        
        // 更新分页信息
        userReviewPage.value = {
          current: res.data.current,
          size: res.data.size,
          total: res.data.total
        }
        
        return userReviews.value
      }
      
      if (res.code === 401 || (res.message && res.message.includes('未登录'))) {
        // 如果服务器响应是未登录状态，静默处理，不弹出错误消息
        console.warn('服务器认为用户未登录，可能需要重新登录')
        userReviews.value = []
        userReviewPage.value = {
          current: 1,
          size: 10,
          total: 0
        }
        return []
      }
      
      ElMessage.error(res.message || '获取我的评价失败')
      return []
    } catch (error) {
      console.error('获取我的评价失败', error)
      
      // 如果错误是由于未登录导致的
      if (error.response?.status === 401 || 
          error.response?.data?.message?.includes('未登录') ||
          error.message?.includes('未登录')) {
        
        // 不再自动清除用户信息，只提示用户可能需要重新登录
        console.warn('服务器认为用户未登录，前端状态与后端不一致')
        
        // 清空评价数据但不清除用户信息
        userReviews.value = []
        userReviewPage.value = {
          current: 1,
          size: 10,
          total: 0
        }
      }
      
      return []
    } finally {
      loading.value.userReviews = false
    }
  }
  
  /**
   * 获取商品评价统计
   * @param {number} productId - 商品ID
   * @param {boolean} [force=false] - 是否强制刷新
   * @returns {Promise<Object>} 评价统计信息
   */
  const getProductReviewStats = async (productId, force = false) => {
    if (!productId) {
      console.error('获取评价统计失败: 商品ID不能为空')
      return {}
    }
    
    // 如果已有数据且不强制刷新，则直接返回缓存数据
    if (!force && reviewStats.value[productId]) {
      return reviewStats.value[productId]
    }
    
    loading.value.reviewStats = true
    
    try {
      const res = await apiGetProductReviewStats(productId)
      
      if (res.code === 200 && res.data) {
        reviewStats.value[productId] = res.data
        return res.data
      }
      
      return {}
    } catch (error) {
      console.error(`获取评价统计失败: productId=${productId}`, error)
      return {}
    } finally {
      loading.value.reviewStats = false
    }
  }
  
  /**
   * 检查用户是否已评价商品
   * @param {number} productId - 商品ID
   * @param {boolean} [force=false] - 是否强制刷新
   * @returns {Promise<boolean>} 是否已评价
   */
  const checkReviewed = async (productId, force = false) => {
    const userStore = useUserStore()
    
    // 更严格的未登录检查
    if (!userStore.token) {
      console.warn('用户未登录或token不存在，不发送检查评价请求')
      reviewedProducts.value[productId] = false
      return false
    }
    
    if (!productId) {
      console.error('检查是否已评价失败: 商品ID不能为空')
      return false
    }
    
    // 如果已有数据且不强制刷新，则直接返回缓存数据
    if (!force && reviewedProducts.value[productId] !== undefined) {
      return reviewedProducts.value[productId]
    }
    
    loading.value.checkReviewed = true
    
    try {
      // 设置请求重试次数
      let retries = 0;
      const maxRetries = 1;
      let success = false;
      let res;
      
      while (!success && retries <= maxRetries) {
        try {
          res = await apiCheckReviewed(productId);
          success = true;
        } catch (error) {
          // 如果是401错误且还有重试机会，尝试刷新token并重试
          if (error.response?.status === 401 && retries < maxRetries) {
            console.warn('401错误，尝试刷新token后重试');
            retries++;
            try {
              // 尝试刷新用户信息
              await userStore.getUserInfo();
            } catch (refreshError) {
              console.error('刷新用户信息失败', refreshError);
            }
          } else {
            throw error; // 重试失败或其他错误，抛出
          }
        }
      }
      
      if (!res || !success) {
        throw new Error('检查评价状态失败');
      }
      
      if (res.code === 200 && res.data) {
        reviewedProducts.value[productId] = res.data.reviewed || false
        return reviewedProducts.value[productId]
      }
      
      if (res.code === 401 || (res.message && res.message.includes('未登录'))) {
        // 如果服务器响应是未登录状态，静默处理
        console.warn('服务器认为用户未登录，可能需要重新登录')
        reviewedProducts.value[productId] = false
        return false
      }
      
      reviewedProducts.value[productId] = false
      return false
    } catch (error) {
      console.error(`检查是否已评价失败: productId=${productId}`, error)
      
      // 如果错误是由于未登录导致的
      if (error.response?.status === 401 || 
          error.response?.data?.message?.includes('未登录') ||
          error.message?.includes('未登录')) {
        
        // 不再自动清除用户信息，只记录警告
        console.warn('服务器认为用户未登录，前端状态与后端不一致')
      }
      
      reviewedProducts.value[productId] = false
      return false
    } finally {
      loading.value.checkReviewed = false
    }
  }
  
  /**
   * 获取最新评价列表
   * @param {number} [limit=5] - 数量限制
   * @param {boolean} [force=false] - 是否强制刷新
   * @returns {Promise<Array>} 评价列表
   */
  const getLatestReviews = async (limit = 5, force = false) => {
    // 如果已有数据且数量相同且不强制刷新，则直接返回缓存数据
    if (!force && latestReviews.value.length === limit) {
      return latestReviews.value
    }
    
    loading.value.latestReviews = true
    
    try {
      const res = await apiGetLatestReviews(limit)
      
      if (res.code === 200 && res.data) {
        latestReviews.value = res.data
        return res.data
      }
      
      return []
    } catch (error) {
      console.error('获取最新评价失败', error)
      return []
    } finally {
      loading.value.latestReviews = false
    }
  }
  
  /**
   * 格式化评分为星星显示
   * @param {number} rating - 评分值(1-5)
   * @returns {string} 星星字符串
   */
  const formatRating = (rating) => {
    if (!rating) return ''
    
    const stars = Math.round(rating)
    return '★'.repeat(stars) + '☆'.repeat(Math.max(0, 5 - stars))
  }
  
  /**
   * 计算评分等级
   * @param {number} rating - 评分值(1-5)
   * @returns {string} 评分等级描述
   */
  const getRatingLevel = (rating) => {
    if (!rating) return '未评分'
    
    if (rating >= 4.5) return '非常好'
    if (rating >= 4) return '很好'
    if (rating >= 3) return '一般'
    if (rating >= 2) return '较差'
    return '很差'
  }
  
  /**
   * 计算评分百分比
   * @param {number} rating - 评分值(1-5)
   * @returns {number} 百分比值(0-100)
   */
  const getRatingPercentage = (rating) => {
    if (!rating) return 0
    return Math.round((rating / 5) * 100)
  }
  
  /**
   * 初始化评价模块
   * 用于应用启动时调用
   */
  const initReviews = async () => {
    const userStore = useUserStore()
    
    try {
      // 获取最新评价(不需要登录)
      await getLatestReviews(5)
      
      // 如果已登录，获取用户评价
      if (userStore.isLoggedIn) {
        await getUserReviews()
      }
    } catch (error) {
      console.error('初始化评价模块失败', error)
    }
  }
  
  /**
   * 清空评价数据
   * 用于退出登录时调用
   */
  const clearReviewData = () => {
    // 清空用户相关评价数据
    userReviews.value = []
    reviewedProducts.value = {}
    
    // 重置分页信息
    userReviewPage.value = {
      current: 1,
      size: 10,
      total: 0
    }
    
    // 不清除商品评价数据和最新评价数据，因为不需要登录也可查看
  }

  return {
    // 状态
    productReviews,
    userReviews,
    reviewStats,
    reviewedProducts,
    latestReviews,
    productReviewPages,
    userReviewPage,
    loading,
    
    // 计算属性
    hasProductReviews,
    hasUserReviews,
    hasLatestReviews,
    
    // 方法
    addReview,
    deleteReview,
    getProductReviews,
    getUserReviews,
    getProductReviewStats,
    checkReviewed,
    getLatestReviews,
    formatRating,
    getRatingLevel,
    getRatingPercentage,
    initReviews,
    clearReviewData
  }
}) 