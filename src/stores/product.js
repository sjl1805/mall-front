import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getProductPage, 
  getProductDetail, 
  getHotProducts, 
  getNewProducts,
  getProductsByCategory,
  getSimilarProducts,
  getEnabledCategories,
  getCategoryTree,
  getCategoryDetail,
  getChildrenCategories
} from '@/api/product'
import { ElMessage } from 'element-plus'

// 商品状态常量
export const ProductStatus = {
  OFF_SHELF: 0, // 下架
  ON_SHELF: 1   // 上架
}

export const useProductStore = defineStore('product', () => {
  // 商品列表状态
  const products = ref([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)
  
  // 商品详情状态
  const currentProduct = ref(null)
  const similarProducts = ref([])
  
  // 分类状态
  const categories = ref([])
  const categoryTree = ref([])
  const currentCategory = ref(null)
  
  // 特色商品状态
  const hotProducts = ref([])
  const newProducts = ref([])
  const categoryProducts = ref([])

  // 筛选条件
  const filterOptions = ref({
    categoryId: null,
    keyword: '',
    minPrice: null,
    maxPrice: null
  })
  
  // 计算属性
  const productCount = computed(() => total.value)
  const categoryCount = computed(() => categories.value.length)
  const hasProducts = computed(() => products.value.length > 0)
  const hasCategories = computed(() => categories.value.length > 0)
  
  // 格式化价格，显示为 "¥xx.xx" 或 "¥xx.xx~¥yy.yy"
  const formatPrice = (price, originalPrice) => {
    if (!price) return '¥0.00'
    
    const formattedPrice = `¥${Number(price).toFixed(2)}`
    
    if (originalPrice && Number(originalPrice) > Number(price)) {
      return `${formattedPrice} <del class="text-gray-400 text-sm">¥${Number(originalPrice).toFixed(2)}</del>`
    }
    
    return formattedPrice
  }
  
  // 计算折扣率
  const calculateDiscount = (price, originalPrice) => {
    if (!price || !originalPrice || Number(originalPrice) <= Number(price)) return null
    
    const discount = (Number(price) / Number(originalPrice) * 10).toFixed(1)
    return `${discount}折`
  }
  
  // 商品列表相关方法
  
  /**
   * 获取商品列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 商品列表数据
   */
  const fetchProducts = async (params = {}) => {
    loading.value = true
    
    try {
      // 合并默认参数和传入的参数
      const queryParams = {
        page: params.page || currentPage.value,
        size: params.size || pageSize.value,
        categoryId: params.categoryId !== undefined ? params.categoryId : filterOptions.value.categoryId,
        keyword: params.keyword !== undefined ? params.keyword : filterOptions.value.keyword,
        minPrice: params.minPrice !== undefined ? params.minPrice : filterOptions.value.minPrice,
        maxPrice: params.maxPrice !== undefined ? params.maxPrice : filterOptions.value.maxPrice
      }
      
      // 更新当前页码和每页条数
      currentPage.value = queryParams.page
      pageSize.value = queryParams.size
      
      // 更新筛选条件
      if (params.categoryId !== undefined) filterOptions.value.categoryId = params.categoryId
      if (params.keyword !== undefined) filterOptions.value.keyword = params.keyword
      if (params.minPrice !== undefined) filterOptions.value.minPrice = params.minPrice
      if (params.maxPrice !== undefined) filterOptions.value.maxPrice = params.maxPrice
      
      const res = await getProductPage(queryParams)
      
      if (res.code === 200 && res.data) {
        products.value = res.data.records || []
        total.value = res.data.total || 0
        return res.data
      }
      
      return { records: [], total: 0 }
    } catch (error) {
      console.error('获取商品列表失败', error)
      ElMessage.error('获取商品列表失败，请稍后重试')
      return { records: [], total: 0 }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 根据关键词搜索商品
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Object>} 搜索结果
   */
  const searchProducts = async (keyword) => {
    return await fetchProducts({ 
      page: 1, 
      keyword, 
      categoryId: null, 
      minPrice: null, 
      maxPrice: null 
    })
  }
  
  /**
   * 按分类筛选商品
   * @param {number} categoryId - 分类ID
   * @returns {Promise<Object>} 筛选结果
   */
  const filterProductsByCategory = async (categoryId) => {
    return await fetchProducts({ 
      page: 1, 
      categoryId 
    })
  }
  
  /**
   * 按价格范围筛选商品
   * @param {number} minPrice - 最小价格
   * @param {number} maxPrice - 最大价格
   * @returns {Promise<Object>} 筛选结果
   */
  const filterProductsByPrice = async (minPrice, maxPrice) => {
    return await fetchProducts({ 
      page: 1, 
      minPrice, 
      maxPrice 
    })
  }
  
  /**
   * 清除所有筛选条件
   * @returns {Promise<Object>} 重置后的结果
   */
  const clearFilters = async () => {
    filterOptions.value = {
      categoryId: null,
      keyword: '',
      minPrice: null,
      maxPrice: null
    }
    
    return await fetchProducts({ page: 1 })
  }
  
  // 商品详情相关方法
  
  /**
   * 获取商品详情
   * @param {number} id - 商品ID
   * @param {boolean} includeSimilar - 是否包含相似商品
   * @param {number} similarLimit - 相似商品数量限制
   * @returns {Promise<Object>} 商品详情
   */
  const fetchProductDetail = async (id, includeSimilar = true, similarLimit = 5) => {
    loading.value = true
    
    try {
      const res = await getProductDetail(id, includeSimilar, similarLimit)
      
      if (res.code === 200 && res.data) {
        currentProduct.value = res.data.product || null
        
        if (includeSimilar) {
          similarProducts.value = res.data.similarProducts || []
        }
        
        return res.data
      }
      
      currentProduct.value = null
      similarProducts.value = []
      return null
    } catch (error) {
      console.error('获取商品详情失败', error)
      ElMessage.error('获取商品详情失败，请稍后重试')
      currentProduct.value = null
      similarProducts.value = []
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取相似商品
   * @param {number} productId - 商品ID
   * @param {number} limit - 数量限制
   * @returns {Promise<Array>} 相似商品列表
   */
  const fetchSimilarProducts = async (productId, limit = 5) => {
    try {
      const res = await getSimilarProducts(productId, limit)
      
      if (res.code === 200) {
        similarProducts.value = res.data || []
        return res.data
      }
      
      return []
    } catch (error) {
      console.error('获取相似商品失败', error)
      return []
    }
  }
  
  // 分类相关方法
  
  /**
   * 获取所有启用的分类列表
   * @returns {Promise<Array>} 分类列表
   */
  const fetchCategories = async () => {
    try {
      const res = await getEnabledCategories()
      
      if (res.code === 200) {
        categories.value = res.data || []
        return res.data
      }
      
      return []
    } catch (error) {
      console.error('获取分类列表失败', error)
      ElMessage.error('获取分类列表失败，请稍后重试')
      return []
    }
  }
  
  /**
   * 获取分类树
   * @returns {Promise<Array>} 分类树
   */
  const fetchCategoryTree = async () => {
    try {
      const res = await getCategoryTree()
      
      if (res.code === 200) {
        categoryTree.value = res.data || []
        return res.data
      }
      
      return []
    } catch (error) {
      console.error('获取分类树失败', error)
      ElMessage.error('获取分类树失败，请稍后重试')
      return []
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
        currentCategory.value = res.data || null
        return res.data
      }
      
      currentCategory.value = null
      return null
    } catch (error) {
      console.error('获取分类详情失败', error)
      currentCategory.value = null
      return null
    }
  }
  
  /**
   * 获取子分类
   * @param {number} parentId - 父分类ID
   * @returns {Promise<Array>} 子分类列表
   */
  const fetchChildCategories = async (parentId) => {
    try {
      const res = await getChildrenCategories(parentId)
      
      if (res.code === 200) {
        return res.data || []
      }
      
      return []
    } catch (error) {
      console.error('获取子分类失败', error)
      return []
    }
  }
  
  // 特色商品相关方法
  
  /**
   * 获取热门商品
   * @param {number} limit - 数量限制
   * @returns {Promise<Array>} 热门商品列表
   */
  const fetchHotProducts = async (limit = 10) => {
    try {
      const res = await getHotProducts(limit)
      
      if (res.code === 200) {
        hotProducts.value = res.data || []
        return res.data
      }
      
      return []
    } catch (error) {
      console.error('获取热门商品失败', error)
      return []
    }
  }
  
  /**
   * 获取最新商品
   * @param {number} limit - 数量限制
   * @returns {Promise<Array>} 最新商品列表
   */
  const fetchNewProducts = async (limit = 10) => {
    try {
      const res = await getNewProducts(limit)
      
      if (res.code === 200) {
        newProducts.value = res.data || []
        return res.data
      }
      
      return []
    } catch (error) {
      console.error('获取最新商品失败', error)
      return []
    }
  }
  
  /**
   * 获取分类商品
   * @param {number} categoryId - 分类ID
   * @param {number} limit - 数量限制
   * @returns {Promise<Array>} 分类商品列表
   */
  const fetchCategoryProducts = async (categoryId, limit = 10) => {
    try {
      const res = await getProductsByCategory(categoryId, limit)
      
      if (res.code === 200) {
        categoryProducts.value = res.data || []
        return res.data
      }
      
      return []
    } catch (error) {
      console.error('获取分类商品失败', error)
      return []
    }
  }
  
  /**
   * 加载首页所需数据
   * @returns {Promise<Object>} 首页数据
   */
  const loadHomePageData = async () => {
    try {
      const [hotProductsRes, newProductsRes, categoriesRes] = await Promise.all([
        fetchHotProducts(8),
        fetchNewProducts(8),
        fetchCategoryTree()
      ])
      
      // 获取主要分类的商品（默认获取前4个分类各8件商品）
      const topCategories = categoryTree.value
        .filter(category => category.status === 1)
        .slice(0, 4)
      
      const categoryProductsList = await Promise.all(
        topCategories.map(category => fetchCategoryProducts(category.id, 8))
      )
      
      return {
        hotProducts: hotProductsRes,
        newProducts: newProductsRes,
        categories: categoriesRes,
        categoryProducts: categoryProductsList.map((products, index) => ({
          category: topCategories[index],
          products
        }))
      }
    } catch (error) {
      console.error('加载首页数据失败', error)
      ElMessage.error('加载首页数据失败，请刷新重试')
      return {}
    }
  }
  
  return {
    // 状态
    products,
    total,
    currentPage,
    pageSize,
    loading,
    currentProduct,
    similarProducts,
    categories,
    categoryTree,
    currentCategory,
    hotProducts,
    newProducts,
    categoryProducts,
    filterOptions,
    
    // 计算属性
    productCount,
    categoryCount,
    hasProducts,
    hasCategories,
    
    // 工具方法
    formatPrice,
    calculateDiscount,
    
    // 商品列表方法
    fetchProducts,
    searchProducts,
    filterProductsByCategory,
    filterProductsByPrice,
    clearFilters,
    
    // 商品详情方法
    fetchProductDetail,
    fetchSimilarProducts,
    
    // 分类方法
    fetchCategories,
    fetchCategoryTree,
    fetchCategoryDetail,
    fetchChildCategories,
    
    // 特色商品方法
    fetchHotProducts,
    fetchNewProducts,
    fetchCategoryProducts,
    
    // 组合方法
    loadHomePageData
  }
}, {
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'mall-products',
        storage: sessionStorage,
        paths: [
          'categories', 
          'categoryTree', 
          'hotProducts', 
          'newProducts'
        ]
      }
    ]
  }
}) 