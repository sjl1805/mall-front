<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRecommendationStore } from '@/stores/recommendation'
import { useUserStore } from '@/stores/user'
import { useFileStore } from '@/stores/file'
import { useRouter } from 'vue-router'
import { ElMessage, ElButton, ElSkeleton, ElEmpty, ElBacktop } from 'element-plus'

// 获取推荐、用户和文件存储
const recommendationStore = useRecommendationStore()
const userStore = useUserStore()
const fileStore = useFileStore()
const router = useRouter()

// 状态
const loading = ref(false)
const recommendations = ref([])

// 每页显示的商品数量
const pageSize = ref(24)
// 是否强制刷新数据
const forceRefresh = ref(false)

// 加载推荐数据
const loadRecommendations = async () => {
  if (loading.value) return; // 防止重复加载
  
  if (recommendations.value.length > 0 && !forceRefresh.value) {
    return // 已有数据，不重复加载
  }

  loading.value = true

  try {
    const data = await recommendationStore.getRecommendations(pageSize.value, forceRefresh.value)
    recommendations.value = data
    forceRefresh.value = false
  } catch (error) {
    console.error('加载推荐商品失败', error)
    ElMessage.error('加载推荐商品失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  forceRefresh.value = true
  loadRecommendations()
}

// 格式化价格
const formatPrice = (price, originalPrice) => {
  if (!price) return '0.00'
  
  let priceHtml = `<span class="current-price">¥${parseFloat(price).toFixed(2)}</span>`
  
  if (originalPrice && originalPrice > price) {
    priceHtml += `<span class="original-price">¥${parseFloat(originalPrice).toFixed(2)}</span>`
  }
  
  return priceHtml
}

// 计算折扣
const calculateDiscount = (price, originalPrice) => {
  if (!price || !originalPrice || originalPrice <= price) {
    return null
  }
  
  const discount = Math.floor((1 - price / originalPrice) * 100)
  return discount > 0 ? `${discount}折` : null
}

// 获取图片URL
const getImageUrl = (imageUrl) => {
  return fileStore.getPreviewUrl(imageUrl)
}

// 前往商品详情页
const goToProductDetail = (productId) => {
  if (productId) {
    router.push(`/product/${productId}`)
  }
}

// 跳转到登录页
const goToLogin = () => {
  router.push({
    path: '/login',
    query: { redirect: router.currentRoute.value.fullPath }
  })
}

// 计算属性：是否已登录
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 监听登录状态变化
watch(() => userStore.isLoggedIn, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    // 用户刚登录，刷新推荐数据
    forceRefresh.value = true
    loadRecommendations()
  }
})

// 页面挂载时加载数据
onMounted(() => {
  loadRecommendations()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">为您推荐</h1>
      <p class="page-desc" v-if="isLoggedIn">
        根据您的浏览历史和喜好，为您精选商品
      </p>
      <p class="page-desc" v-else>
        登录后可获取更加个性化的推荐商品
      </p>
      
      <div class="action-buttons">
        <el-button v-if="!isLoggedIn" type="primary" @click="goToLogin">立即登录</el-button>
        <el-button @click="refreshData" :loading="loading" :disabled="loading">
          <i class="el-icon-refresh"></i> 刷新推荐
        </el-button>
      </div>
    </div>

    <div class="recommendation-container">
      <div class="tab-content-container">
        <div class="tab-header">
          <h2>综合推荐</h2>
          <p>根据您的浏览和购买习惯，为您精选的商品</p>
        </div>
        
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>
        
        <div v-else-if="recommendations.length === 0" class="empty-container">
          <el-empty description="暂无推荐商品，请稍后再来" />
        </div>
        
        <div v-else class="products-grid">
          <div 
            v-for="product in recommendations" 
            :key="product.id" 
            class="product-card"
            @click="goToProductDetail(product.id)"
          >
            <div class="product-img">
              <img :src="getImageUrl(product.mainImage || product.image)" :alt="product.name">
              <div v-if="calculateDiscount(product.price, product.originalPrice)" class="discount-tag">
                {{ calculateDiscount(product.price, product.originalPrice) }}
              </div>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-brief">{{ product.brief || product.subtitle }}</p>
              <div class="product-price" v-html="formatPrice(product.price, product.originalPrice)"></div>
              <div class="product-sales" v-if="product.sales">
                <span>销量: {{ product.sales }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <el-backtop :right="20" :bottom="20"></el-backtop>
  </div>
</template> 

<style scoped>
.page-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.page-desc {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 15px;
}

.recommendation-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.tab-content-container {
  padding: 20px 0;
}

.tab-header {
  margin-bottom: 20px;
}

.tab-header h2 {
  font-size: 22px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.tab-header p {
  font-size: 14px;
  color: #666;
}

.loading-container {
  padding: 40px;
}

.empty-container {
  padding: 60px 0;
  text-align: center;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 20px;
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
  font-size: 18px;
  font-weight: bold;
  color: #ff4d4f;
}

.current-price {
  color: #ff4d4f;
  font-weight: bold;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
  margin-left: 5px;
}

.product-sales {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style> 