import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  addFavorite, 
  removeFavorite, 
  checkFavorite, 
  getFavoriteList, 
  getFavoriteCount, 
  getRecentFavorites
} from '@/api/user'
import { ElMessage } from 'element-plus'

export const useFavoriteStore = defineStore('favorite', () => {
  // 状态
  const favorites = ref([])
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 计算属性
  const favoriteCount = computed(() => {
    return total.value
  })

  // 方法
  // 获取收藏列表
  const fetchFavorites = async (page = 1, size = 10) => {
    loading.value = true
    currentPage.value = page
    pageSize.value = size
    
    try {
      const res = await getFavoriteList(page, size)
      if (res.code === 200 && res.data) {
        favorites.value = res.data.records || []
        total.value = res.data.total || 0
      }
    } catch (error) {
      console.error('获取收藏列表失败', error)
    } finally {
      loading.value = false
    }
  }

  // 获取收藏数量
  const fetchFavoriteCount = async () => {
    try {
      const res = await getFavoriteCount()
      if (res.code === 200 && res.data) {
        total.value = res.data.count || 0
        return total.value
      }
      return 0
    } catch (error) {
      console.error('获取收藏数量失败', error)
      return 0
    }
  }

  // 获取最近收藏
  const fetchRecentFavorites = async (limit = 5) => {
    loading.value = true
    try {
      const res = await getRecentFavorites(limit)
      if (res.code === 200) {
        return res.data || []
      }
      return []
    } catch (error) {
      console.error('获取最近收藏失败', error)
      return []
    } finally {
      loading.value = false
    }
  }

  // 添加收藏
  const addToFavorite = async (productId) => {
    loading.value = true
    try {
      const res = await addFavorite(productId)
      if (res.code === 200) {
        ElMessage.success('收藏成功')
        // 更新收藏数量
        await fetchFavoriteCount()
        return true
      }
      return false
    } catch (error) {
      console.error('添加收藏失败', error)
      return false
    } finally {
      loading.value = false
    }
  }

  // 取消收藏
  const removeFromFavorite = async (productId) => {
    loading.value = true
    try {
      const res = await removeFavorite(productId)
      if (res.code === 200) {
        ElMessage.success('取消收藏成功')
        // 从当前列表中移除
        favorites.value = favorites.value.filter(item => item.id !== productId)
        // 更新收藏数量
        total.value = Math.max(0, total.value - 1)
        return true
      }
      return false
    } catch (error) {
      console.error('取消收藏失败', error)
      return false
    } finally {
      loading.value = false
    }
  }

  // 检查是否已收藏
  const checkIsFavorite = async (productId) => {
    try {
      const res = await checkFavorite(productId)
      if (res.code === 200 && res.data) {
        return res.data.favorite
      }
      return false
    } catch (error) {
      console.error('检查收藏状态失败', error)
      return false
    }
  }

  // 切换收藏状态
  const toggleFavorite = async (productId) => {
    const isFavorite = await checkIsFavorite(productId)
    if (isFavorite) {
      return await removeFromFavorite(productId)
    } else {
      return await addToFavorite(productId)
    }
  }

  return {
    // 状态
    favorites,
    loading,
    total,
    currentPage,
    pageSize,
    
    // 计算属性
    favoriteCount,
    
    // 方法
    fetchFavorites,
    fetchFavoriteCount,
    fetchRecentFavorites,
    addToFavorite,
    removeFromFavorite,
    checkIsFavorite,
    toggleFavorite
  }
}) 