import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getUserBehaviorHistoryPage, 
  recordBehavior, 
  getRecentViewedProducts,
  getUserBehaviorStats,
  recordBehaviorBatch,
  clearBehaviorRecords,
  cancelBehavior,
  getBehaviorTypeDesc,
  BehaviorType
} from '@/api/behavior'
import { ElMessage } from 'element-plus'

export const useBehaviorStore = defineStore('behavior', () => {
  // 状态
  const behaviors = ref([])
  const recentViewed = ref([])
  const stats = ref({})
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 计算属性
  const behaviorTypeMap = computed(() => {
    return {
      [BehaviorType.VIEW]: '浏览',
      [BehaviorType.FAVORITE]: '收藏',
      [BehaviorType.CART]: '加购',
      [BehaviorType.PURCHASE]: '购买',
      [BehaviorType.REVIEW]: '评价'
    }
  })

  const behaviorCount = computed(() => {
    return Object.entries(stats.value).reduce((total, [_, count]) => total + count, 0)
  })

  // 根据行为类型获取行为数量
  const getBehaviorCountByType = (type) => {
    return stats.value[type] || 0
  }

  // 分页获取用户行为历史
  const fetchBehaviorHistoryPage = async (params = {}) => {
    loading.value = true
    try {
      const page = params.page || 1
      const size = params.size || 10
      currentPage.value = page
      pageSize.value = size

      const res = await getUserBehaviorHistoryPage(params)
      if (res.code === 200 && res.data) {
        behaviors.value = res.data.records || []
        total.value = res.data.total || 0
        return res.data
      }
      return {
        records: [],
        total: 0,
        pages: 0,
        current: page,
        size: size
      }
    } catch (error) {
      console.error('分页获取用户行为历史失败', error)
      return {
        records: [],
        total: 0,
        pages: 0,
        current: params.page || 1,
        size: params.size || 10
      }
    } finally {
      loading.value = false
    }
  }

  // 记录用户行为
  const recordUserBehavior = async (productId, behaviorType) => {
    try {
      const res = await recordBehavior(productId, behaviorType)
      if (res.code === 200) {
        // 更新统计数据
        if (stats.value[behaviorType]) {
          stats.value[behaviorType]++
        } else {
          stats.value[behaviorType] = 1
        }
        return true
      }
      return false
    } catch (error) {
      console.error('记录用户行为失败', error)
      return false
    }
  }

  // 获取用户最近浏览的商品
  const fetchRecentViewedProducts = async (limit = 10) => {
    loading.value = true
    try {
      const res = await getRecentViewedProducts(limit)
      if (res.code === 200) {
        recentViewed.value = res.data || []
        return res.data
      }
      return []
    } catch (error) {
      console.error('获取最近浏览商品失败', error)
      return []
    } finally {
      loading.value = false
    }
  }

  // 获取用户行为统计数据
  const fetchUserBehaviorStats = async () => {
    loading.value = true
    try {
      const res = await getUserBehaviorStats()
      if (res.code === 200) {
        stats.value = res.data || {}
        return res.data
      }
      return {}
    } catch (error) {
      console.error('获取用户行为统计失败', error)
      return {}
    } finally {
      loading.value = false
    }
  }

  // 批量记录用户行为
  const recordUserBehaviorBatch = async (productIds, behaviorType) => {
    try {
      const res = await recordBehaviorBatch(productIds, behaviorType)
      if (res.code === 200) {
        // 更新统计数据
        if (stats.value[behaviorType]) {
          stats.value[behaviorType] += productIds.length
        } else {
          stats.value[behaviorType] = productIds.length
        }
        return true
      }
      return false
    } catch (error) {
      console.error('批量记录用户行为失败', error)
      return false
    }
  }

  // 清除用户行为记录
  const clearUserBehaviorRecords = async (params = {}) => {
    loading.value = true
    try {
      const res = await clearBehaviorRecords(params)
      if (res.code === 200) {
        ElMessage.success('清除成功')
        
        // 如果清除特定类型的行为，更新统计数据
        if (params.behaviorType && stats.value[params.behaviorType]) {
          stats.value[params.behaviorType] = 0
        } else if (!params.behaviorType) {
          // 如果清除所有行为，重置统计数据
          stats.value = {}
        }
        
        // 重新获取行为历史
        await fetchBehaviorHistory(params)
        return true
      }
      return false
    } catch (error) {
      console.error('清除用户行为记录失败', error)
      return false
    } finally {
      loading.value = false
    }
  }

  // 取消某个行为记录
  const cancelUserBehavior = async (productId, behaviorType) => {
    try {
      const res = await cancelBehavior(productId, behaviorType)
      if (res.code === 200) {
        ElMessage.success('取消成功')
        
        // 更新本地状态
        behaviors.value = behaviors.value.filter(
          item => !(item.productId === productId && item.behaviorType === behaviorType)
        )
        
        // 更新统计数据
        if (stats.value[behaviorType] && stats.value[behaviorType] > 0) {
          stats.value[behaviorType]--
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('取消行为记录失败', error)
      return false
    }
  }

  // 获取行为类型描述
  const fetchBehaviorTypeDesc = async (behaviorType) => {
    try {
      const res = await getBehaviorTypeDesc(behaviorType)
      if (res.code === 200 && res.data) {
        return res.data.desc
      }
      return behaviorTypeMap.value[behaviorType] || '未知行为'
    } catch (error) {
      console.error('获取行为类型描述失败', error)
      return behaviorTypeMap.value[behaviorType] || '未知行为'
    }
  }

  // 删除单条行为记录 (作为 cancelUserBehavior 的别名，用于浏览历史删除)
  const deleteBehavior = async (id) => {
    loading.value = true
    try {
      // 先找到对应的记录
      const behavior = behaviors.value.find(item => item.id === id)
      if (!behavior) {
        ElMessage.error('未找到对应的记录')
        return false
      }
      
      const productId = behavior.productId
      const behaviorType = behavior.behaviorType || 1 // 默认为浏览行为
      
      // 调用取消行为的API
      const res = await cancelBehavior(productId, behaviorType)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        
        // 更新本地状态
        behaviors.value = behaviors.value.filter(item => item.id !== id)
        
        // 更新统计数据
        if (stats.value[behaviorType] && stats.value[behaviorType] > 0) {
          stats.value[behaviorType]--
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('删除行为记录失败', error)
      ElMessage.error('删除记录失败')
      return false
    } finally {
      loading.value = false
    }
  }
  
  // 清除特定类型的用户行为历史 (方便在组件中调用)
  const clearBehaviorHistory = async (behaviorType) => {
    return await clearUserBehaviorRecords({ behaviorType })
  }

  return {
    // 状态
    behaviors,
    recentViewed,
    stats,
    loading,
    total,
    currentPage,
    pageSize,
    
    // 常量
    BehaviorType,
    
    // 计算属性
    behaviorTypeMap,
    behaviorCount,
    
    // 方法
    getBehaviorCountByType,
    fetchBehaviorHistoryPage,
    recordUserBehavior,
    fetchRecentViewedProducts,
    fetchUserBehaviorStats,
    recordUserBehaviorBatch,
    clearUserBehaviorRecords,
    cancelUserBehavior,
    fetchBehaviorTypeDesc,
    deleteBehavior,          // 新增: 删除单条行为记录
    clearBehaviorHistory     // 新增: 清除特定类型的行为历史
  }
}) 