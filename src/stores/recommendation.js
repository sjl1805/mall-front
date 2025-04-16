import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from './user'
import {
  getRecommendations as apiGetRecommendations,
  getAllTypeRecommendations as apiGetAllTypeRecommendations,
  getUserCFRecommendations as apiGetUserCFRecommendations,
  getItemCFRecommendations as apiGetItemCFRecommendations,
  getPopularRecommendations as apiGetPopularRecommendations,
  getContentBasedRecommendations as apiGetContentBasedRecommendations,
  getSimilarProductRecommendations as apiGetSimilarProductRecommendations,
  RecommendationType
} from '@/api/recommendation'

// 重新导出常量，方便在组件中使用
export { RecommendationType }

export const useRecommendationStore = defineStore('recommendation', () => {
  // 状态
  const recommendations = ref({
    hybrid: [],        // 混合推荐
    userCF: [],        // 基于用户的协同过滤
    itemCF: [],        // 基于商品的协同过滤
    popular: [],       // 热门推荐
    contentBased: [],  // 基于内容的推荐
    similar: []        // 相似商品推荐（针对特定商品）
  })
  
  // 当前查看的商品相关推荐
  const currentProductId = ref(null)   // 当前查看的商品ID
  
  // 所有类型的推荐（包含不同类型的推荐结果）
  const allTypeRecommendations = ref({})
  
  // 加载状态
  const loading = ref({
    hybrid: false,
    userCF: false,
    itemCF: false,
    popular: false,
    contentBased: false,
    similar: false,
    allTypes: false
  })
  
  // 初始化状态，标记各类推荐是否已初始化加载
  const initialized = ref({
    hybrid: false,
    userCF: false,
    itemCF: false,
    popular: false,
    contentBased: false,
    allTypes: false
  })
  
  // 计算属性
  const hasRecommendations = computed(() => recommendations.value.hybrid.length > 0)
  const hasSimilarProducts = computed(() => recommendations.value.similar.length > 0)
  
  /**
   * 获取推荐商品列表（混合推荐）
   * @param {number} [limit=10] - 数量限制
   * @param {boolean} [force=false] - 是否强制刷新
   * @returns {Promise<Array>} 推荐商品列表
   */
  const getRecommendations = async (limit = 10, force = false) => {
    const userStore = useUserStore()
    
    // 未登录时直接返回热门商品
    if (!userStore.isLoggedIn) {
      return getPopularRecommendations(limit, force)
    }
    
    // 如果已初始化且不强制刷新，则直接返回缓存数据
    if (initialized.value.hybrid && !force && recommendations.value.hybrid.length > 0) {
      return recommendations.value.hybrid
    }
    
    loading.value.hybrid = true
    
    try {
      const res = await apiGetRecommendations(limit)
      
      if (res.code === 200 && res.data) {
        recommendations.value.hybrid = res.data
        initialized.value.hybrid = true
        return res.data
      }
      
      ElMessage.error(res.message || '获取推荐商品失败')
      return []
    } catch (error) {
      console.error('获取推荐商品失败', error)
      return []
    } finally {
      loading.value.hybrid = false
    }
  }
  
  /**
   * 获取所有推荐类型的商品
   * @param {number} [limit=5] - 每种类型的数量限制
   * @param {boolean} [force=false] - 是否强制刷新
   * @returns {Promise<Object>} 所有类型的推荐商品
   */
  const getAllTypeRecommendations = async (limit = 5, force = false) => {
    const userStore = useUserStore()
    
    // 未登录时直接返回热门商品作为替代
    if (!userStore.isLoggedIn) {
      const popularProducts = await getPopularRecommendations(limit * 2, force)
      
      allTypeRecommendations.value = {
        '猜你喜欢': popularProducts.slice(0, limit),
        '热门推荐': popularProducts.slice(limit, limit * 2)
      }
      
      initialized.value.allTypes = true
      return allTypeRecommendations.value
    }
    
    // 如果已初始化且不强制刷新，则直接返回缓存数据
    if (initialized.value.allTypes && !force && Object.keys(allTypeRecommendations.value).length > 0) {
      return allTypeRecommendations.value
    }
    
    loading.value.allTypes = true
    
    try {
      const res = await apiGetAllTypeRecommendations(limit)
      
      if (res.code === 200 && res.data) {
        allTypeRecommendations.value = res.data
        initialized.value.allTypes = true
        return res.data
      }
      
      ElMessage.error(res.message || '获取推荐商品失败')
      return {}
    } catch (error) {
      console.error('获取推荐商品失败', error)
      return {}
    } finally {
      loading.value.allTypes = false
    }
  }
  
  /**
   * 获取猜你喜欢推荐（基于用户的协同过滤）
   * @param {number} [limit=10] - 数量限制
   * @param {boolean} [force=false] - 是否强制刷新
   * @returns {Promise<Array>} 推荐商品列表
   */
  const getUserCFRecommendations = async (limit = 10, force = false) => {
    const userStore = useUserStore()
    
    // 未登录时直接返回热门商品作为替代
    if (!userStore.isLoggedIn) {
      return getPopularRecommendations(limit, force)
    }
    
    // 如果已初始化且不强制刷新，则直接返回缓存数据
    if (initialized.value.userCF && !force && recommendations.value.userCF.length > 0) {
      return recommendations.value.userCF
    }
    
    loading.value.userCF = true
    
    try {
      const res = await apiGetUserCFRecommendations(limit)
      
      if (res.code === 200 && res.data) {
        recommendations.value.userCF = res.data
        initialized.value.userCF = true
        return res.data
      }
      
      ElMessage.error(res.message || '获取猜你喜欢商品失败')
      return []
    } catch (error) {
      console.error('获取猜你喜欢商品失败', error)
      return []
    } finally {
      loading.value.userCF = false
    }
  }
  
  /**
   * 获取相似推荐（基于物品的协同过滤）
   * @param {number} [limit=10] - 数量限制
   * @param {boolean} [force=false] - 是否强制刷新
   * @returns {Promise<Array>} 推荐商品列表
   */
  const getItemCFRecommendations = async (limit = 10, force = false) => {
    const userStore = useUserStore()
    
    // 未登录时直接返回热门商品作为替代
    if (!userStore.isLoggedIn) {
      return getPopularRecommendations(limit, force)
    }
    
    // 如果已初始化且不强制刷新，则直接返回缓存数据
    if (initialized.value.itemCF && !force && recommendations.value.itemCF.length > 0) {
      return recommendations.value.itemCF
    }
    
    loading.value.itemCF = true
    
    try {
      const res = await apiGetItemCFRecommendations(limit)
      
      if (res.code === 200 && res.data) {
        recommendations.value.itemCF = res.data
        initialized.value.itemCF = true
        return res.data
      }
      
      ElMessage.error(res.message || '获取相似推荐商品失败')
      return []
    } catch (error) {
      console.error('获取相似推荐商品失败', error)
      return []
    } finally {
      loading.value.itemCF = false
    }
  }
  
  /**
   * 获取热门推荐
   * @param {number} [limit=10] - 数量限制
   * @param {boolean} [force=false] - 是否强制刷新
   * @returns {Promise<Array>} 推荐商品列表
   */
  const getPopularRecommendations = async (limit = 10, force = false) => {
    // 如果已初始化且不强制刷新，则直接返回缓存数据
    if (initialized.value.popular && !force && recommendations.value.popular.length > 0) {
      return recommendations.value.popular
    }
    
    loading.value.popular = true
    
    try {
      const res = await apiGetPopularRecommendations(limit)
      
      if (res.code === 200 && res.data) {
        recommendations.value.popular = res.data
        initialized.value.popular = true
        return res.data
      }
      
      ElMessage.error(res.message || '获取热门推荐商品失败')
      return []
    } catch (error) {
      console.error('获取热门推荐商品失败', error)
      return []
    } finally {
      loading.value.popular = false
    }
  }
  
  /**
   * 基于内容的推荐
   * @param {number} [limit=10] - 数量限制
   * @param {boolean} [force=false] - 是否强制刷新
   * @returns {Promise<Array>} 推荐商品列表
   */
  const getContentBasedRecommendations = async (limit = 10, force = false) => {
    const userStore = useUserStore()
    
    // 未登录时直接返回热门商品作为替代
    if (!userStore.isLoggedIn) {
      return getPopularRecommendations(limit, force)
    }
    
    // 如果已初始化且不强制刷新，则直接返回缓存数据
    if (initialized.value.contentBased && !force && recommendations.value.contentBased.length > 0) {
      return recommendations.value.contentBased
    }
    
    loading.value.contentBased = true
    
    try {
      const res = await apiGetContentBasedRecommendations(limit)
      
      if (res.code === 200 && res.data) {
        recommendations.value.contentBased = res.data
        initialized.value.contentBased = true
        return res.data
      }
      
      ElMessage.error(res.message || '获取基于内容推荐商品失败')
      return []
    } catch (error) {
      console.error('获取基于内容推荐商品失败', error)
      return []
    } finally {
      loading.value.contentBased = false
    }
  }
  
  /**
   * 获取与商品相似的商品
   * @param {number} productId - 商品ID
   * @param {number} [limit=5] - 数量限制
   * @param {boolean} [force=false] - 是否强制刷新
   * @returns {Promise<Array>} 相似商品列表
   */
  const getSimilarProductRecommendations = async (productId, limit = 5, force = false) => {
    if (!productId) {
      console.error('获取相似商品失败: 商品ID不能为空')
      return []
    }
    
    // 如果是相同的商品ID，且已有数据且不强制刷新，则直接返回缓存数据
    if (currentProductId.value === productId && !force && recommendations.value.similar.length > 0) {
      return recommendations.value.similar
    }
    
    loading.value.similar = true
    
    try {
      const res = await apiGetSimilarProductRecommendations(productId, limit)
      
      if (res.code === 200 && res.data) {
        recommendations.value.similar = res.data
        currentProductId.value = productId
        return res.data
      }
      
      ElMessage.error(res.message || '获取相似商品失败')
      return []
    } catch (error) {
      console.error(`获取商品 ${productId} 的相似商品失败`, error)
      return []
    } finally {
      loading.value.similar = false
    }
  }
  
  /**
   * 格式化商品价格
   * @param {number|string} price - 价格值
   * @returns {string} 格式化后的价格
   */
  const formatPrice = (price) => {
    if (!price) return '0.00'
    return parseFloat(price).toFixed(2)
  }
  
  /**
   * 计算商品折扣率
   * @param {Object} product - 商品对象
   * @returns {number} 折扣率（0-100）
   */
  const calculateDiscountRate = (product) => {
    if (!product || !product.price || !product.originalPrice || product.price >= product.originalPrice) {
      return 0
    }
    
    const discount = Math.floor((1 - product.price / product.originalPrice) * 100)
    return discount > 0 ? discount : 0
  }
  
  /**
   * 加载首页推荐数据
   * 用于应用启动时加载首页所需的推荐数据
   */
  const loadHomePageRecommendations = async () => {
    try {
      // 并行加载不同类型的推荐
      await Promise.all([
        getAllTypeRecommendations(5),
        getPopularRecommendations(10)
      ])
    } catch (error) {
      console.error('加载首页推荐数据失败', error)
    }
  }
  
  /**
   * 初始化推荐模块
   * 用于应用启动时调用
   */
  const initRecommendations = async () => {
    const userStore = useUserStore()
    
    try {
      // 无论是否登录，都加载热门推荐
      await getPopularRecommendations(10)
      
      // 如果已登录，加载个性化推荐
      if (userStore.isLoggedIn) {
        await getRecommendations(10)
      }
    } catch (error) {
      console.error('初始化推荐模块失败', error)
    }
  }
  
  /**
   * 清空推荐数据
   * 用于退出登录时调用
   */
  const clearRecommendationData = () => {
    // 清空所有个性化推荐数据
    recommendations.value = {
      hybrid: [],
      userCF: [],
      itemCF: [],
      popular: [], // 保留热门推荐，因为不需要登录
      contentBased: [],
      similar: []
    }
    
    allTypeRecommendations.value = {}
    currentProductId.value = null
    
    // 重置初始化状态
    initialized.value = {
      hybrid: false,
      userCF: false,
      itemCF: false,
      popular: initialized.value.popular, // 保留热门推荐的初始化状态
      contentBased: false,
      allTypes: false
    }
  }

  return {
    // 状态
    recommendations,
    allTypeRecommendations,
    loading,
    initialized,
    currentProductId,
    
    // 计算属性
    hasRecommendations,
    hasSimilarProducts,
    
    // 方法
    getRecommendations,
    getAllTypeRecommendations,
    getUserCFRecommendations,
    getItemCFRecommendations,
    getPopularRecommendations,
    getContentBasedRecommendations,
    getSimilarProductRecommendations,
    formatPrice,
    calculateDiscountRate,
    loadHomePageRecommendations,
    initRecommendations,
    clearRecommendationData
  }
}) 