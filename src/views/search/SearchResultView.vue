<template>
  <div class="search-result-container">
    <div class="search-header">
      <h1 class="search-title">搜索结果: {{ keyword }}</h1>
      <p class="result-count">共找到 <span>{{ resultCount }}</span> 个相关商品</p>
    </div>
    
    <!-- 筛选和排序工具栏 -->
    <div class="toolbar">
      <div class="sort-options">
        <span class="sort-label">排序:</span>
        <div class="sort-buttons">
          <el-button 
            :type="currentSort === SortType.DEFAULT ? 'primary' : 'default'" 
            @click="changeSortType(SortType.DEFAULT)"
            size="small"
          >
            默认
          </el-button>
          <el-button 
            :type="currentSort === SortType.SALES_DESC ? 'primary' : 'default'" 
            @click="changeSortType(SortType.SALES_DESC)"
            size="small"
          >
            销量 <el-icon><Sort /></el-icon>
          </el-button>
          <el-button 
            :type="currentSort === SortType.PRICE_ASC ? 'primary' : 'default'" 
            @click="changeSortType(SortType.PRICE_ASC)"
            size="small"
          >
            价格 <el-icon><SortUp /></el-icon>
          </el-button>
          <el-button 
            :type="currentSort === SortType.PRICE_DESC ? 'primary' : 'default'" 
            @click="changeSortType(SortType.PRICE_DESC)"
            size="small"
          >
            价格 <el-icon><SortDown /></el-icon>
          </el-button>
          <el-button 
            :type="currentSort === SortType.NEW_DESC ? 'primary' : 'default'" 
            @click="changeSortType(SortType.NEW_DESC)"
            size="small"
          >
            新品
          </el-button>
        </div>
      </div>
      
      <div class="filter-options">
        <el-popover
          placement="bottom"
          :width="300"
          trigger="click"
          v-model:visible="showFilterPanel"
        >
          <template #reference>
            <el-button size="small">
              价格筛选 <el-icon class="el-icon--right"><Plus /></el-icon>
            </el-button>
          </template>
          
          <div class="price-filter">
            <h4>价格区间</h4>
            <div class="price-range">
              <el-input 
                v-model="priceRange.min" 
                placeholder="最低价" 
                type="number"
                size="small"
              />
              <span class="separator">-</span>
              <el-input 
                v-model="priceRange.max" 
                placeholder="最高价" 
                type="number"
                size="small"
              />
            </div>
            <div class="filter-actions">
              <el-button @click="clearPriceFilter" size="small">重置</el-button>
              <el-button type="primary" @click="applyPriceFilter" size="small">确定</el-button>
            </div>
          </div>
        </el-popover>
        
        <div v-if="priceRange.min !== null || priceRange.max !== null" class="active-filters">
          <el-tag closable @close="clearPriceFilter" type="info" size="small">
            价格: {{ priceRange.min || 0 }}元 - {{ priceRange.max || '不限' }}元
          </el-tag>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <!-- 空结果状态 -->
    <div v-else-if="!hasResults" class="empty-container">
      <el-empty 
        description="没有找到相关商品，请尝试其他关键词或筛选条件" 
        :image-size="200"
      />
    </div>
    
    <!-- 搜索结果列表 -->
    <div v-else class="products-grid">
      <div 
        v-for="product in searchResults" 
        :key="product.id" 
        class="product-card"
        @click="goToProductDetail(product.id)"
      >
        <div class="product-img">
          <img :src="getImageUrl(product.image)" :alt="product.name">
          <div v-if="calculateDiscount(product.price, product.originalPrice)" class="discount-tag">
            {{ calculateDiscount(product.price, product.originalPrice) }}
          </div>
        </div>
        <div class="product-info">
          <h3 class="product-name">{{ product.name }}</h3>
          <p class="product-brief">{{ product.brief }}</p>
          <div class="product-price" v-html="formatPrice(product.price, product.originalPrice)"></div>
          <div class="product-sales">
            <span>销量: {{ product.sales || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div v-if="hasResults && totalPages > 1" class="pagination">
      <el-pagination
        background
        :current-page="currentPage"
        :page-size="searchStore.pageSize"
        :total="total"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useSearchStore, SortType } from '@/stores/search'
import { useFileStore } from '@/stores/file'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Minus, Sort, SortDown, SortUp } from '@element-plus/icons-vue'

const searchStore = useSearchStore()
const fileStore = useFileStore()
const router = useRouter()
const route = useRoute()

// 搜索和加载状态
const loading = computed(() => searchStore.loading)
const loadingMore = ref(false)
const showFilterPanel = ref(false)
const currentSort = ref(SortType.DEFAULT)

// 价格筛选区间
const priceRange = reactive({
  min: null,
  max: null
})

// 监听URL的query变化
watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.keyword !== undefined) {
      // 设置搜索参数并执行搜索
      const params = {
        keyword: newQuery.keyword,
        categoryId: newQuery.categoryId ? parseInt(newQuery.categoryId) : null,
        page: newQuery.page ? parseInt(newQuery.page) : 1,
        sortType: newQuery.sort || SortType.DEFAULT
      }
      
      currentSort.value = params.sortType
      
      if (newQuery.minPrice) {
        params.minPrice = parseFloat(newQuery.minPrice)
        priceRange.min = params.minPrice
      }
      
      if (newQuery.maxPrice) {
        params.maxPrice = parseFloat(newQuery.maxPrice)
        priceRange.max = params.maxPrice
      }
      
      // 执行搜索
      searchStore.setSearchParams(params)
      searchStore.searchProducts()
    }
  },
  { immediate: true }
)

// 获取搜索结果
const searchResults = computed(() => searchStore.searchResults)
const total = computed(() => searchStore.total)
const keyword = computed(() => searchStore.searchParams.keyword)
const currentPage = computed(() => searchStore.currentPage)
const totalPages = computed(() => searchStore.totalPages)
const hasResults = computed(() => searchStore.hasResults)
const resultCount = computed(() => searchStore.resultCount)

// 获取图片URL
const getImageUrl = (imageUrl) => {
  return fileStore.getPreviewUrl(imageUrl)
}

// 跳转到商品详情页
const goToProductDetail = (productId) => {
  if (productId) {
    router.push(`/product/${productId}`)
  }
}

// 格式化价格
const formatPrice = (price, originalPrice) => {
  if (originalPrice && originalPrice > price) {
    return `<span class="current-price">¥${price.toFixed(2)}</span> <span class="original-price">¥${originalPrice.toFixed(2)}</span>`
  }
  return `<span class="current-price">¥${price.toFixed(2)}</span>`
}

// 计算折扣
const calculateDiscount = (price, originalPrice) => {
  if (originalPrice && originalPrice > price) {
    const discount = Math.round((price / originalPrice) * 10)
    return discount < 10 ? `${discount}折` : ''
  }
  return ''
}

// 修改排序方式
const changeSortType = (sortType) => {
  currentSort.value = sortType
  
  // 更新URL参数，保持其他参数不变
  const query = { ...route.query, sort: sortType, page: 1 }
  router.replace({ query })
  
  // 调用store中的排序方法
  searchStore.changeSortType(sortType)
}

// 价格筛选
const applyPriceFilter = () => {
  // 验证输入
  if (priceRange.min !== null && priceRange.max !== null && priceRange.min > priceRange.max) {
    ElMessage.warning('最小价格不能大于最大价格')
    return
  }
  
  // 更新URL参数
  const query = { ...route.query, page: 1 }
  if (priceRange.min !== null) query.minPrice = priceRange.min
  else delete query.minPrice
  
  if (priceRange.max !== null) query.maxPrice = priceRange.max
  else delete query.maxPrice
  
  router.replace({ query })
  
  // 调用store中的价格筛选方法
  searchStore.filterByPrice(priceRange.min, priceRange.max)
}

// 清除价格筛选
const clearPriceFilter = () => {
  priceRange.min = null
  priceRange.max = null
  
  // 更新URL，移除价格相关参数
  const query = { ...route.query }
  delete query.minPrice
  delete query.maxPrice
  router.replace({ query })
  
  // 调用store清除过滤
  searchStore.clearFilters()
}

// 页码变化处理
const handlePageChange = (page) => {
  // 更新URL参数
  const query = { ...route.query, page }
  router.replace({ query })
  
  // 跳转到指定页
  searchStore.goToPage(page)
  
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 当没有搜索关键词时，检查URL参数并执行搜索
onMounted(() => {
  if (!searchStore.searchParams.keyword && route.query.keyword) {
    const params = {
      keyword: route.query.keyword,
      categoryId: route.query.categoryId ? parseInt(route.query.categoryId) : null,
      page: route.query.page ? parseInt(route.query.page) : 1,
      sortType: route.query.sort || SortType.DEFAULT
    }
    
    if (route.query.minPrice) {
      params.minPrice = parseFloat(route.query.minPrice)
      priceRange.min = params.minPrice
    }
    
    if (route.query.maxPrice) {
      params.maxPrice = parseFloat(route.query.maxPrice)
      priceRange.max = params.maxPrice
    }
    
    currentSort.value = params.sortType
    searchStore.setSearchParams(params)
    searchStore.searchProducts()
  }
})
</script>

<style scoped>
.search-result-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.search-header {
  margin-bottom: 20px;
}

.search-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.result-count {
  font-size: 14px;
  color: #666;
}

.result-count span {
  color: #ff4d4f;
  font-weight: bold;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.sort-options {
  display: flex;
  align-items: center;
}

.sort-label {
  font-size: 14px;
  color: #666;
  margin-right: 10px;
}

.sort-buttons {
  display: flex;
  gap: 10px;
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 10px;
}

.price-filter {
  padding: 10px;
}

.price-filter h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.price-range {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.separator {
  margin: 0 10px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.loading-container {
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.empty-container {
  padding: 60px 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.product-img {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-img img {
  transform: scale(1.05);
}

.discount-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ff4d4f;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.product-info {
  padding: 15px;
}

.product-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  height: 44px;
}

.product-brief {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  height: 42px;
}

.product-price {
  font-size: 16px;
  margin-bottom: 10px;
}

.current-price {
  font-weight: bold;
  color: #ff4d4f;
}

.original-price {
  color: #999;
  font-size: 14px;
  text-decoration: line-through;
  margin-left: 5px;
}

.product-sales {
  font-size: 12px;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  margin-bottom: 20px;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .sort-buttons {
    flex-wrap: wrap;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>