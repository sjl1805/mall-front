<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useCategoryStore } from '@/stores/category'
import { useFileStore } from '@/stores/file'
import { ElLoading, ElMessage, ElPagination, ElEmpty, ElSkeleton } from 'element-plus'

// 获取路由参数和存储
const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const categoryStore = useCategoryStore()
const fileStore = useFileStore()

// 状态
const loading = ref(false)
const products = ref([])
const categories = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(24)

// 筛选条件
const search = ref({
  categoryId: null,
  minPrice: null,
  maxPrice: null,
  sortBy: 'default', // default, price-asc, price-desc, sales
})

// 计算属性
const hasProducts = computed(() => products.value.length > 0)
const hasCategories = computed(() => categories.value.length > 0)

// 加载商品列表
const loadProducts = async () => {
  loading.value = true
  
  try {
    // 构建查询参数
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      categoryId: search.value.categoryId,
      minPrice: search.value.minPrice,
      maxPrice: search.value.maxPrice,
    }
    
    // 处理排序
    if (search.value.sortBy === 'price-asc') {
      params.orderBy = 'price'
      params.order = 'asc'
    } else if (search.value.sortBy === 'price-desc') {
      params.orderBy = 'price'
      params.order = 'desc'
    } else if (search.value.sortBy === 'sales') {
      params.orderBy = 'sales'
      params.order = 'desc'
    }
    
    const result = await productStore.fetchProducts(params)
    
    products.value = result.records || []
    total.value = result.total || 0
  } catch (error) {
    console.error('获取商品列表失败', error)
    ElMessage.error('获取商品列表失败，请刷新页面重试')
  } finally {
    loading.value = false
  }
}

// 监听路由参数变化
watch(() => route.query, (newQuery) => {
  if (newQuery.categoryId) {
    search.value.categoryId = Number(newQuery.categoryId)
  }
  
  loadProducts()
}, { immediate: true, deep: true })

// 初始化数据
onMounted(async () => {
  // 加载分类列表
  try {
    const categoryList = await categoryStore.fetchCategories()
    categories.value = categoryList
  } catch (error) {
    console.error('获取分类列表失败', error)
  }
  
  // 从路由获取分类ID
  if (route.query.categoryId) {
    search.value.categoryId = Number(route.query.categoryId)
  }
  
  // 加载商品
  loadProducts()
})

// 筛选分类
const filterByCategory = (categoryId) => {
  search.value.categoryId = categoryId === search.value.categoryId ? null : categoryId
  currentPage.value = 1
  
  // 更新URL参数
  router.push({
    path: '/products',
    query: {
      categoryId: search.value.categoryId || undefined
    }
  })
  
  loadProducts()
}

// 清除筛选条件
const clearFilters = () => {
  search.value = {
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    sortBy: 'default',
  }
  
  currentPage.value = 1
  loadProducts()
}

// 页码改变
const handlePageChange = (page) => {
  currentPage.value = page
  loadProducts()
  
  // 滚动到顶部
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 跳转到商品详情
const goToProductDetail = (productId) => {
  router.push(`/product/${productId}`)
}

// 格式化价格
const formatPrice = (price) => {
  if (!price) return '0.00'
  return parseFloat(price).toFixed(2)
}

// 计算折扣
const calculateDiscount = (price, originalPrice) => {
  return productStore.calculateDiscount(price, originalPrice)
}

// 获取图片URL
const getImageUrl = (imageUrl) => {
  return fileStore.getPreviewUrl(imageUrl)
}

// 新增状态
const selectedParentCategory = ref(null) // 选中的父分类
const subCategories = ref([]) // 子分类列表

// 新增方法：处理父分类点击
const handleParentCategoryClick = async (category) => {
  if (selectedParentCategory.value === category.id) {
    selectedParentCategory.value = null
    subCategories.value = []
  } else {
    selectedParentCategory.value = category.id
    // 获取子分类
    const children = await categoryStore.fetchChildCategories(category.id)
    subCategories.value = children
  }
}
</script>

<template>
  <div class="product-list-page">
    <!-- 头部信息 -->
    <div class="page-header">
      <h1 class="page-title">商品列表</h1>
      <p class="result-info" v-if="hasProducts">
        共 <span class="highlight">{{ total }}</span> 件商品
      </p>
    </div>
    
    <!-- 分类筛选 -->
    <div v-if="hasCategories" class="category-filter">
      <div class="filter-header">商品分类</div>
      <div class="category-list">
        <!-- 父分类列表 -->
        <div 
          v-for="cat in categories" 
          :key="cat.id" 
          class="category-item parent-category"
          :class="{ 
            active: selectedParentCategory === cat.id,
            selected: search.categoryId === cat.id 
          }"
          @click="handleParentCategoryClick(cat)"
        >
          <img 
            v-if="cat.icon" 
            :src="getImageUrl(cat.icon)" 
            class="category-icon" 
            :alt="cat.name"
          >
          <span class="category-name">{{ cat.name }}</span>
        </div>
      </div>
      
      <!-- 子分类列表 -->
      <div v-if="subCategories.length" class="sub-category-list">
        <div 
          v-for="subCat in subCategories" 
          :key="subCat.id" 
          class="category-item sub-category"
          :class="{ active: search.categoryId === subCat.id }"
          @click="filterByCategory(subCat.id)"
        >
          <img 
            v-if="subCat.icon" 
            :src="getImageUrl(subCat.icon)" 
            class="category-icon" 
            :alt="subCat.name"
          >
          <span class="category-name">{{ subCat.name }}</span>
        </div>
      </div>
    </div>
    
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="sort-options">
        <span 
          class="sort-option" 
          :class="{ active: search.sortBy === 'default' }"
          @click="search.sortBy = 'default'; loadProducts()"
        >
          默认排序
        </span>
        <span 
          class="sort-option" 
          :class="{ active: search.sortBy === 'price-asc' }"
          @click="search.sortBy = 'price-asc'; loadProducts()"
        >
          价格 ↑
        </span>
        <span 
          class="sort-option" 
          :class="{ active: search.sortBy === 'price-desc' }"
          @click="search.sortBy = 'price-desc'; loadProducts()"
        >
          价格 ↓
        </span>
        <span 
          class="sort-option" 
          :class="{ active: search.sortBy === 'sales' }"
          @click="search.sortBy = 'sales'; loadProducts()"
        >
          销量优先
        </span>
      </div>
      
      <div class="price-filter">
        <span class="filter-label">价格：</span>
        <el-input
          v-model="search.minPrice"
          placeholder="最低价"
          size="small"
          style="width: 100px;"
        />
        <span>-</span>
        <el-input
          v-model="search.maxPrice"
          placeholder="最高价"
          size="small"
          style="width: 100px;"
        />
        <el-button size="small" @click="loadProducts">筛选</el-button>
        <el-button size="small" @click="clearFilters">重置</el-button>
      </div>
    </div>
    
    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <!-- 商品为空 -->
    <div v-else-if="!hasProducts" class="empty-container">
      <el-empty description="暂无商品" />
    </div>
    
    <!-- 商品列表 -->
    <div v-else class="product-grid">
      <div 
        v-for="product in products" 
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
          <p class="product-brief">{{ product.brief || product.subtitle || product.description }}</p>
          <div class="product-price">
            <span class="current-price">¥{{ formatPrice(product.price) }}</span>
            <span 
              v-if="product.originalPrice && product.originalPrice > product.price" 
              class="original-price"
            >
              ¥{{ formatPrice(product.originalPrice) }}
            </span>
          </div>
          <div class="product-sales">
            <span>销量: {{ product.sales || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.product-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.result-info {
  font-size: 16px;
  color: #666;
}

.highlight {
  color: #ff6700;
  font-weight: bold;
}

.category-filter {
  margin-bottom: 20px;
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.filter-header {
  font-size: 16px;
  color: #333;
  font-weight: bold;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background-color: #f5f5f5;
  cursor: pointer;
  transition: all 0.3s;
}

.category-icon {
  width: 20px;
  height: 20px;
  object-fit: cover;
  border-radius: 4px;
}

.category-name {
  font-size: 14px;
}

.parent-category {
  background-color: #fff;
  border: 1px solid #e0e0e0;
}

.parent-category:hover {
  border-color: #ff6700;
  color: #ff6700;
}

.parent-category.active {
  background-color: #ff6700;
  color: white;
  border-color: #ff6700;
}

.sub-category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #e0e0e0;
}

.sub-category {
  background-color: #f5f5f5;
  font-size: 13px;
}

.sub-category:hover {
  background-color: #e5e5e5;
}

.sub-category.active {
  background-color: #ff6700;
  color: white;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.sort-options {
  display: flex;
  gap: 20px;
}

.sort-option {
  font-size: 14px;
  cursor: pointer;
  padding: 5px 0;
  position: relative;
}

.sort-option:hover {
  color: #ff6700;
}

.sort-option.active {
  color: #ff6700;
  font-weight: bold;
}

.sort-option.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #ff6700;
}

.price-filter {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-size: 14px;
  color: #666;
}

.loading-container,
.empty-container {
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.product-grid {
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
  background-color: #ff6700;
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
  margin-bottom: 5px;
}

.current-price {
  font-size: 18px;
  font-weight: bold;
  color: #ff6700;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
  margin-left: 8px;
}

.product-sales {
  font-size: 12px;
  color: #999;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  margin-bottom: 30px;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-bar {
    flex-direction: column;
    gap: 15px;
  }
  
  .sort-options {
    width: 100%;
    justify-content: space-between;
  }
  
  .price-filter {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
}
</style> 