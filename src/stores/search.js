import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getProductPage } from '@/api/product'
import { useCategoryStore } from './category'
import { ElMessage } from 'element-plus'

// 排序方式常量
export const SortType = {
  DEFAULT: 'default', // 默认排序
  PRICE_ASC: 'price_asc', // 价格升序
  PRICE_DESC: 'price_desc', // 价格降序
  SALES_DESC: 'sales_desc', // 销量降序
  NEW_DESC: 'new_desc' // 新品降序
}

export const useSearchStore = defineStore('search', () => {
  // 搜索状态
  const searchResults = ref([]) // 搜索结果
  const total = ref(0) // 结果总数
  const currentPage = ref(1) // 当前页码
  const pageSize = ref(24) // 每页数量
  const loading = ref(false) // 加载状态
  const suggestions = ref([]) // 搜索建议
  
  // 搜索参数
  const searchParams = ref({
    keyword: '', // 搜索关键词
    categoryId: null, // 分类ID
    minPrice: null, // 最小价格
    maxPrice: null, // 最大价格
    sortType: SortType.DEFAULT // 排序方式
  })
  
  // 计算属性
  const hasResults = computed(() => searchResults.value.length > 0)
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
  const resultCount = computed(() => total.value)
  
  // 设置搜索参数
  const setSearchParams = (params) => {
    if (params.keyword !== undefined) {
      searchParams.value.keyword = params.keyword
    }
    
    if (params.categoryId !== undefined) {
      searchParams.value.categoryId = params.categoryId
    }
    
    if (params.minPrice !== undefined) {
      searchParams.value.minPrice = params.minPrice
    }
    
    if (params.maxPrice !== undefined) {
      searchParams.value.maxPrice = params.maxPrice
    }
    
    if (params.sortType !== undefined) {
      searchParams.value.sortType = params.sortType
    }
    
    if (params.page !== undefined) {
      currentPage.value = params.page
    }
    
    if (params.size !== undefined) {
      pageSize.value = params.size
    }
  }
  
  // 重置搜索参数
  const resetSearchParams = () => {
    searchParams.value = {
      keyword: '',
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      sortType: SortType.DEFAULT
    }
    currentPage.value = 1
  }
  
  /**
   * 搜索商品
   * @param {Object} params - 搜索参数
   * @returns {Promise<Object>} 搜索结果
   */
  const searchProducts = async (params = {}) => {
    // 更新搜索参数
    setSearchParams(params)
    
    loading.value = true
    
    try {
      // 准备请求参数
      const requestParams = {
        page: currentPage.value,
        size: pageSize.value,
        keyword: searchParams.value.keyword,
        categoryId: searchParams.value.categoryId,
        minPrice: searchParams.value.minPrice,
        maxPrice: searchParams.value.maxPrice
      }
      
      // 添加排序参数
      switch (searchParams.value.sortType) {
        case SortType.PRICE_ASC:
          requestParams.sortField = 'price'
          requestParams.sortOrder = 'asc'
          break
        case SortType.PRICE_DESC:
          requestParams.sortField = 'price'
          requestParams.sortOrder = 'desc'
          break
        case SortType.SALES_DESC:
          requestParams.sortField = 'sales'
          requestParams.sortOrder = 'desc'
          break
        case SortType.NEW_DESC:
          requestParams.sortField = 'createTime'
          requestParams.sortOrder = 'desc'
          break
        default:
          // 默认排序不传排序参数
          break
      }
      
      const res = await getProductPage(requestParams)
      
      if (res.code === 200 && res.data) {
        searchResults.value = res.data.records || []
        total.value = res.data.total || 0
        return res.data
      }
      
      return { records: [], total: 0 }
    } catch (error) {
      console.error('搜索商品失败', error)
      ElMessage.error('搜索失败，请稍后重试')
      return { records: [], total: 0 }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取下一页
   * @returns {Promise<Object>} 搜索结果
   */
  const loadNextPage = async () => {
    if (currentPage.value * pageSize.value >= total.value) {
      // 已经是最后一页
      return { records: searchResults.value, total: total.value }
    }
    
    currentPage.value++
    return await searchProducts()
  }
  
  /**
   * 获取上一页
   * @returns {Promise<Object>} 搜索结果
   */
  const loadPrevPage = async () => {
    if (currentPage.value <= 1) {
      // 已经是第一页
      return { records: searchResults.value, total: total.value }
    }
    
    currentPage.value--
    return await searchProducts()
  }
  
  /**
   * 跳转到指定页
   * @param {number} page - 页码
   * @returns {Promise<Object>} 搜索结果
   */
  const goToPage = async (page) => {
    if (page < 1 || page > totalPages.value) {
      return { records: searchResults.value, total: total.value }
    }
    
    currentPage.value = page
    return await searchProducts()
  }
  
  /**
   * 更改排序方式
   * @param {string} sortType - 排序方式
   * @returns {Promise<Object>} 搜索结果
   */
  const changeSortType = async (sortType) => {
    searchParams.value.sortType = sortType
    currentPage.value = 1 // 切换排序时重置为第一页
    return await searchProducts()
  }
  
  /**
   * 按分类搜索
   * @param {number} categoryId - 分类ID
   * @returns {Promise<Object>} 搜索结果
   */
  const searchByCategory = async (categoryId) => {
    // 获取分类及其子分类ID
    const categoryStore = useCategoryStore()
    
    // 先获取分类树，确保有子分类数据
    if (!categoryStore.hasCategories) {
      await categoryStore.fetchCategoryTree()
    }
    
    // 重置其他搜索条件，只保留分类条件
    resetSearchParams()
    searchParams.value.categoryId = categoryId
    currentPage.value = 1
    
    return await searchProducts()
  }
  
  /**
   * 价格区间筛选
   * @param {number} minPrice - 最小价格
   * @param {number} maxPrice - 最大价格
   * @returns {Promise<Object>} 搜索结果
   */
  const filterByPrice = async (minPrice, maxPrice) => {
    searchParams.value.minPrice = minPrice
    searchParams.value.maxPrice = maxPrice
    currentPage.value = 1
    
    return await searchProducts()
  }
  
  /**
   * 清除筛选条件
   * @returns {Promise<Object>} 搜索结果
   */
  const clearFilters = async () => {
    // 只保留关键词和排序方式，清除其他筛选条件
    searchParams.value.categoryId = null
    searchParams.value.minPrice = null
    searchParams.value.maxPrice = null
    currentPage.value = 1
    
    return await searchProducts()
  }
  
  /**
   * 获取搜索建议
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 搜索建议列表
   */
  const getSearchSuggestions = (keyword) => {
    if (!keyword || keyword.trim() === '') {
      return [] // 无关键词时返回空数组
    }
    
    const trimmedKeyword = keyword.trim().toLowerCase()
    
    // 从已有搜索结果中提取关键词
    const resultKeywords = searchResults.value
      .map(product => product.name)
      .filter(name => name.toLowerCase().includes(trimmedKeyword))
    
    // 根据相关度排序 (完全匹配 > 开头匹配 > 包含匹配)
    return [...new Set(resultKeywords)]
      .sort((a, b) => {
        const aLower = a.toLowerCase()
        const bLower = b.toLowerCase()
        
        // 完全匹配优先
        if (aLower === trimmedKeyword && bLower !== trimmedKeyword) return -1
        if (bLower === trimmedKeyword && aLower !== trimmedKeyword) return 1
        
        // 开头匹配次之
        if (aLower.startsWith(trimmedKeyword) && !bLower.startsWith(trimmedKeyword)) return -1
        if (bLower.startsWith(trimmedKeyword) && !aLower.startsWith(trimmedKeyword)) return 1
        
        // 其他情况按字母顺序
        return a.localeCompare(b)
      })
      .slice(0, 10) // 最多返回10条建议
  }
  
  return {
    // 状态
    searchResults,
    total,
    currentPage,
    pageSize,
    loading,
    searchParams,
    
    // 计算属性
    hasResults,
    totalPages,
    resultCount,
    
    // 方法
    setSearchParams,
    resetSearchParams,
    searchProducts,
    loadNextPage,
    loadPrevPage,
    goToPage,
    changeSortType,
    searchByCategory,
    filterByPrice,
    clearFilters,
    getSearchSuggestions
  }
}) 