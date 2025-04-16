<script setup>
import { ref, onMounted } from 'vue'
import { useProductStore } from '@/stores/product'
import { useFileStore } from '@/stores/file'
import { useRouter } from 'vue-router'
import { ElLoading, ElMessage } from 'element-plus'

// 获取商品存储、文件存储和路由器
const productStore = useProductStore()
const fileStore = useFileStore()
const router = useRouter()

// 状态
const loading = ref(false)
const products = ref([])
const pageSize = ref(24)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const hotProducts = await productStore.fetchHotProducts(pageSize.value)
    products.value = hotProducts
  } catch (error) {
    console.error('获取热卖商品失败', error)
    ElMessage.error('获取商品数据失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

// 页面挂载时加载数据
onMounted(() => {
  loadData()
})

// 格式化价格
const formatPrice = (price, originalPrice) => {
  return productStore.formatPrice(price, originalPrice)
}

// 计算折扣
const calculateDiscount = (price, originalPrice) => {
  return productStore.calculateDiscount(price, originalPrice)
}

// 获取图片URL
const getImageUrl = (imageUrl) => {
  // 使用fileStore中的getPreviewUrl方法处理图片URL
  return fileStore.getPreviewUrl(imageUrl);
}

// 前往商品详情页
const goToProductDetail = (productId) => {
  if (productId) {
    router.push(`/product/${productId}`)
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">热卖商品</h1>
      <p class="page-desc">最受欢迎的精选商品</p>
    </div>

    <!-- 商品列表 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else>
      <div v-if="products.length === 0" class="empty-container">
        <el-empty description="暂无热卖商品，请稍后再来" />
      </div>

      <div v-else class="products-grid">
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
            <div class="hot-tag">热卖</div>
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
    </div>
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

.hot-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #ff7a45;
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