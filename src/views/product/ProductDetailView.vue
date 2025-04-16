<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useCartStore } from '@/stores/cart'
import { useFavoriteStore } from '@/stores/favorite'
import { useRecommendationStore } from '@/stores/recommendation'
import { useFileStore } from '@/stores/file'
import { useBehaviorStore } from '@/stores/behavior'
import { useUserStore } from '@/stores/user'
import { useReviewStore } from '@/stores/review'
import { ElMessage, ElMessageBox, ElLoading, ElImage, ElInput, ElButton } from 'element-plus'
import { Star, ShoppingCart, Plus, Minus, Share, Location } from '@element-plus/icons-vue'

// 获取路由信息和Store
const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const cartStore = useCartStore()
const favoriteStore = useFavoriteStore()
const recommendationStore = useRecommendationStore()
const fileStore = useFileStore()
const behaviorStore = useBehaviorStore()
const userStore = useUserStore()
const reviewStore = useReviewStore()

// 获取商品ID
const productId = computed(() => Number(route.params.id))

// 状态
const product = ref(null)
const similarProducts = ref([])
const reviews = ref([])
const reviewStats = ref(null)
const loading = ref(true)
const quantity = ref(1)
const activeTab = ref('details')
const mainImageIndex = ref(0)
const isFavorite = ref(false)
const showLoginTip = ref(false)

// 加载商品详情
const loadProductDetails = async () => {
  loading.value = true
  try {
    const productData = await productStore.fetchProductDetail(productId.value)
    product.value = productData.product
    
    // 处理商品图片字段，确保images是数组
    if (product.value) {
      // 如果images是字符串，将其转换为数组
      if (typeof product.value.images === 'string' && product.value.images) {
        product.value.images = product.value.images.split(',').filter(url => url && url.trim())
      } else if (!Array.isArray(product.value.images)) {
        // 如果不是数组也不是字符串，或是空字符串，设为空数组
        product.value.images = []
      }
      
      console.log('处理后的商品图集:', product.value.images) // 用于调试
    }
    
    similarProducts.value = productData.similarProducts || []
    
    // 记录浏览历史
    if (userStore.isLoggedIn) {
      await behaviorStore.recordUserBehavior(productId.value, 1) // 1表示浏览行为
    }
    
    // 获取收藏状态
    checkFavoriteStatus()
    
    // 加载商品评价
    loadProductReviews()
  } catch (error) {
    console.error('获取商品详情失败', error)
    ElMessage.error('获取商品详情失败，请刷新页面重试')
  } finally {
    loading.value = false
  }
}

// 检查商品是否已收藏
const checkFavoriteStatus = async () => {
  if (!userStore.isLoggedIn) {
    isFavorite.value = false
    return
  }
  
  try {
    isFavorite.value = await favoriteStore.checkIsFavorite(productId.value)
  } catch (error) {
    console.error('检查收藏状态失败', error)
    isFavorite.value = false
  }
}

// 加载商品评价
const loadProductReviews = async () => {
  try {
    // 使用reviewStore加载商品评价
    const reviewData = await reviewStore.getProductReviews(productId.value, 1, 5)
    reviews.value = reviewData || []

    // 获取评价统计信息
    const stats = await reviewStore.getProductReviewStats(productId.value)
    reviewStats.value = stats
  } catch (error) {
    console.error('获取商品评价失败', error)
    reviews.value = []
  }
}

// 添加到购物车
const addToCart = async () => {
  if (!userStore.isLoggedIn) {
    showLoginTip.value = true
    return
  }
  
  if (!product.value) return
  
  try {
    await cartStore.addToCart(
      product.value.id,
      quantity.value
    )
    
    ElMessage.success('成功添加到购物车')
  } catch (error) {
    console.error('添加购物车失败', error)
    ElMessage.error('添加购物车失败，请稍后重试')
  }
}

// 立即购买
const buyNow = async () => {
  if (!userStore.isLoggedIn) {
    showLoginTip.value = true
    return
  }
  
  if (!product.value) return
  
  try {
    // 先添加到购物车
    await cartStore.addToCart(
      product.value.id,
      quantity.value
    )
    
    // 然后跳转到结算页面，传递参数表示立即购买的商品
    router.push({
      name: 'checkout',
      query: { productId: product.value.id, quantity: quantity.value, direct: 'true' }
    })
  } catch (error) {
    console.error('立即购买失败', error)
    ElMessage.error('立即购买失败，请稍后重试')
  }
}

// 收藏/取消收藏商品
const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    showLoginTip.value = true
    return
  }
  
  if (!product.value) return
  
  try {
    if (isFavorite.value) {
      await favoriteStore.removeFromFavorite(product.value.id)
      isFavorite.value = false
      ElMessage.success('已取消收藏')
    } else {
      await favoriteStore.addToFavorite(product.value.id)
      isFavorite.value = true
      ElMessage.success('收藏成功')
    }
  } catch (error) {
    console.error('操作收藏失败', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 增加数量
const increaseQuantity = () => {
  if (product.value && quantity.value < product.value.stock) {
    quantity.value++
  } else {
    ElMessage.warning('商品库存不足')
  }
}

// 减少数量
const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

// 更新数量
const updateQuantity = (val) => {
  const num = parseInt(val)
  if (isNaN(num) || num < 1) {
    quantity.value = 1
  } else if (product.value && num > product.value.stock) {
    quantity.value = product.value.stock
    ElMessage.warning('数量不能超过库存')
  } else {
    quantity.value = num
  }
}

// 前往评价页面
const goToReview = () => {
  if (!userStore.isLoggedIn) {
    showLoginTip.value = true
    return
  }
  
  // 验证是否已购买过商品且是否已评价
  reviewStore.checkReviewed(productId.value)
    .then(hasReviewed => {
      if (hasReviewed) {
        ElMessage.warning('您已评价过该商品')
        return
      }
      
      // 跳转到评价页
      router.push({
        path: `/review/add`,
        query: { 
          productId: productId.value,
          orderId: 0  // 这里应传递真实订单ID，简化处理
        }
      })
    })
    .catch(error => {
      console.error('检查评价状态失败', error)
      ElMessage.error('操作失败，请稍后重试')
    })
}

// 前往商品详情页
const goToProductDetail = (id) => {
  router.push(`/product/${id}`)
}

// 前往登录页
const goToLogin = () => {
  router.push({
    path: '/login',
    query: { redirect: route.fullPath }
  })
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

// 获取评论图片数组
const getReviewImages = (images) => {
  if (Array.isArray(images)) {
    return images
  } else if (typeof images === 'string' && images) {
    return images.split(',').filter(url => url && url.trim())
  } else {
    return []
  }
}

// 页面挂载时加载数据
onMounted(() => {
  loadProductDetails()
})
</script>

<template>
  <div class="product-detail-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton style="width: 100%;" animated>
        <template #template>
          <div style="display: flex; gap: 20px; padding: 20px;">
            <div>
              <el-skeleton-item variant="image" style="width: 400px; height: 400px; border-radius: 8px;" />
            </div>
            <div style="flex: 1;">
              <el-skeleton-item variant="h1" style="width: 50%; height: 30px; margin-bottom: 20px;" />
              <el-skeleton-item variant="text" style="width: 80%; height: 20px; margin-bottom: 10px;" />
              <el-skeleton-item variant="text" style="width: 60%; height: 20px; margin-bottom: 30px;" />
              <el-skeleton-item variant="text" style="width: 40%; height: 30px; margin-bottom: 20px;" />
              <div style="display: flex; gap: 20px; margin-bottom: 40px;">
                <el-skeleton-item variant="button" style="width: 150px; height: 40px;" />
                <el-skeleton-item variant="button" style="width: 150px; height: 40px;" />
              </div>
              <el-skeleton-item variant="text" style="width: 100%; height: 100px;" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>
    
    <!-- 商品不存在 -->
    <div v-else-if="!product" class="empty-container">
      <el-empty description="商品不存在或已下架" />
      <el-button type="primary" @click="router.push('/')">返回首页</el-button>
    </div>
    
    <!-- 商品详情 -->
    <div v-else class="product-detail">
      <div class="product-header">
        <div class="product-gallery">
          <div class="main-image">
            <el-image
              :src="getImageUrl(product.images && product.images.length ? product.images[mainImageIndex] : product.image)"
              fit="cover"
              :preview-src-list="product.images && product.images.length ? 
                          product.images.map(img => getImageUrl(img)) : 
                          [getImageUrl(product.image)]"
              :initial-index="mainImageIndex"
              hide-on-click-modal
            >
              <template #error>
                <div class="image-error">
                  <i class="el-icon-picture-outline"></i>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
          </div>
          
          <div class="thumbnail-list" v-if="product.images && product.images.length > 1">
            <div
              v-for="(image, index) in product.images"
              :key="index"
              class="thumbnail-item"
              :class="{ active: mainImageIndex === index }"
              @click="mainImageIndex = index"
            >
              <img :src="getImageUrl(image)" :alt="`${product.name} - 图片${index + 1}`">
            </div>
          </div>
        </div>
        
        <div class="product-info">
          <h1 class="product-name">{{ product.name }}</h1>
          <p class="product-brief">{{ product.brief || product.subtitle }}</p>
          
          <div class="product-meta">
            <div class="product-price">
              <span class="current-price">¥{{ formatPrice(product.price) }}</span>
              <span v-if="product.originalPrice && product.originalPrice > product.price" class="original-price">¥{{ formatPrice(product.originalPrice) }}</span>
              <span v-if="calculateDiscount(product.price, product.originalPrice)" class="discount-label">
                {{ calculateDiscount(product.price, product.originalPrice) }}
              </span>
            </div>
            
            <div class="product-stats">
              <span class="stat-item">销量: {{ product.sales || 0 }}</span>
              <span class="stat-item">库存: {{ product.stock || 0 }}</span>
            </div>
          </div>
          
          <div class="product-attributes" v-if="product.attributes && product.attributes.length">
            <div v-for="attr in product.attributes" :key="attr.id" class="attribute-item">
              <span class="attribute-name">{{ attr.name }}:</span>
              <span class="attribute-value">{{ attr.value }}</span>
            </div>
          </div>
          
          <div class="product-quantity">
            <span class="quantity-label">数量:</span>
            <div class="quantity-input">
              <el-button :icon="Minus" @click="decreaseQuantity" :disabled="quantity <= 1" />
              <el-input v-model="quantity" type="number" :min="1" :max="product.stock" @change="updateQuantity" />
              <el-button :icon="Plus" @click="increaseQuantity" :disabled="quantity >= product.stock" />
            </div>
            <span class="stock-info">库存: {{ product.stock }}</span>
          </div>
          
          <div class="product-actions">
            <el-button type="primary" size="large" @click="buyNow" :disabled="product.stock <= 0">
              立即购买
            </el-button>
            <el-button type="warning" size="large" @click="addToCart" :disabled="product.stock <= 0">
              <el-icon><ShoppingCart /></el-icon>
              加入购物车
            </el-button>
            <el-button :type="isFavorite ? 'danger' : ''" @click="toggleFavorite">
              <el-icon><Star /></el-icon>
              {{ isFavorite ? '已收藏' : '收藏' }}
            </el-button>
          </div>
          
          <div class="product-services">
            <div class="service-item">
              <i class="el-icon-checked">✓</i>
              <span>正品保障</span>
            </div>
            <div class="service-item">
              <i class="el-icon-checked">✓</i>
              <span>急速发货</span>
            </div>
            <div class="service-item">
              <i class="el-icon-checked">✓</i>
              <span>7天无理由退货</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 商品详情选项卡 -->
      <div class="product-tabs">
        <div class="tab-header">
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'details' }" 
            @click="activeTab = 'details'"
          >
            商品详情
          </div>
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'params' }" 
            @click="activeTab = 'params'"
          >
            规格参数
          </div>
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'reviews' }" 
            @click="activeTab = 'reviews'"
          >
            用户评价
            <span v-if="reviews.length" class="review-count">({{ reviews.length }})</span>
          </div>
        </div>
        
        <div class="tab-content">
          <!-- 商品详情选项 -->
          <div v-if="activeTab === 'details'" class="tab-pane">
            <div class="product-description" v-if="product.description" v-html="product.description"></div>
            <el-empty v-else description="暂无详细描述" />
          </div>
          
          <!-- 规格参数选项 -->
          <div v-if="activeTab === 'params'" class="tab-pane">
            <div class="product-params" v-if="product.attributes && product.attributes.length">
              <table class="params-table">
                <tr v-for="attr in product.attributes" :key="attr.id">
                  <td class="param-name">{{ attr.name }}</td>
                  <td class="param-value">{{ attr.value }}</td>
                </tr>
              </table>
            </div>
            <el-empty v-else description="暂无规格参数" />
          </div>
          
          <!-- 用户评价选项 -->
          <div v-if="activeTab === 'reviews'" class="tab-pane">
            <!-- 评价统计 -->
            <div v-if="reviewStats" class="review-stats">
              <div class="stats-summary">
                <div class="avg-rating">
                  <div class="rating-number">{{ reviewStats.avgRating || '0.0' }}</div>
                  <div class="rating-stars">
                    <el-rate
                      v-model="reviewStats.avgRating"
                      disabled
                      show-score
                      text-color="#ff9900"
                    />
                  </div>
                  <div class="rating-text">平均评分</div>
                </div>
                <div class="rating-distribution">
                  <div v-for="i in 5" :key="i" class="rating-bar">
                    <span class="rating-label">{{ 6-i }}星</span>
                    <div class="progress-bar">
                      <div 
                        class="progress" 
                        :style="{
                          width: reviewStats.ratingPercent && reviewStats.ratingPercent[6-i] 
                            ? reviewStats.ratingPercent[6-i] + '%' 
                            : '0%'
                        }"
                      ></div>
                    </div>
                    <span class="rating-count">{{ reviewStats.ratingCounts && reviewStats.ratingCounts[6-i] || 0 }}</span>
                  </div>
                </div>
              </div>
              <div class="stats-info">
                <div class="stat-item">
                  <span class="stat-label">好评率</span>
                  <span class="stat-value">{{ reviewStats.goodRatePercent || '0%' }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">总评价数</span>
                  <span class="stat-value">{{ reviewStats.total || 0 }}</span>
                </div>
              </div>
            </div>

            <div v-if="reviews.length" class="review-list">
              <div v-for="review in reviews" :key="review.id" class="review-item">
                <div class="review-header">
                  <div class="reviewer-info">
                    <img :src="getImageUrl(review.avatar || '/images/default-avatar.jpg')" class="reviewer-avatar" alt="用户头像">
                    <span class="reviewer-name">{{ review.username || review.nickname || '匿名用户' }}</span>
                  </div>
                  <div class="review-rating">
                    <el-rate
                      v-model="review.rating"
                      disabled
                      show-score
                      text-color="#ff9900"
                    />
                    <span class="review-date">{{ review.createTime || review.createTimeStr }}</span>
                  </div>
                </div>
                <div class="review-content">{{ review.content }}</div>
                <div v-if="review.images && review.images.length" class="review-images">
                  <el-image
                    v-for="(image, idx) in getReviewImages(review.images)"
                    :key="idx"
                    :src="getImageUrl(image)"
                    fit="cover"
                    :preview-src-list="getReviewImages(review.images).map(img => getImageUrl(img))"
                    class="review-image"
                  />
                </div>
                <div v-if="review.reply" class="review-reply">
                  <span class="reply-label">商家回复：</span>
                  <span class="reply-content">{{ review.reply }}</span>
                </div>
              </div>
              
              <div class="review-actions">
                <el-button @click="goToReview">我要评价</el-button>
                <el-button v-if="reviewStats && reviewStats.total > 5" type="primary" @click="router.push(`/product/${productId.value}/reviews`)">
                  查看全部评价 ({{ reviewStats.total }})
                </el-button>
              </div>
            </div>
            <div v-else class="no-reviews">
              <el-empty description="暂无评价">
                <template #extra>
                  <el-button type="primary" @click="goToReview">我要评价</el-button>
                </template>
              </el-empty>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 相似商品推荐 -->
      <div v-if="similarProducts.length" class="similar-products">
        <h3 class="section-title">相似商品推荐</h3>
        <div class="product-grid">
          <div
            v-for="item in similarProducts"
            :key="item.id"
            class="product-card"
            @click="goToProductDetail(item.id)"
          >
            <div class="product-card-image">
              <el-image
                :src="getImageUrl(item.image)"
                fit="cover"
                :lazy="true"
              >
                <template #error>
                  <div class="image-error">
                    <i class="el-icon-picture-outline"></i>
                  </div>
                </template>
              </el-image>
              <span v-if="calculateDiscount(item.price, item.originalPrice)" class="discount-badge">
                {{ calculateDiscount(item.price, item.originalPrice) }}
              </span>
            </div>
            <div class="product-card-info">
              <h4 class="product-card-name">{{ item.name }}</h4>
              <p class="product-card-price">
                <span class="price">¥{{ formatPrice(item.price) }}</span>
                <span v-if="item.originalPrice && item.originalPrice > item.price" class="original">¥{{ formatPrice(item.originalPrice) }}</span>
              </p>
              <p class="product-card-sales">销量: {{ item.sales || 0 }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 登录提示对话框 -->
    <el-dialog
      v-model="showLoginTip"
      title="提示"
      width="30%"
    >
      <span>请先登录后再继续操作</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showLoginTip = false">取消</el-button>
          <el-button type="primary" @click="goToLogin">
            去登录
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template> 

<style scoped>
.product-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container,
.empty-container {
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.empty-container .el-button {
  margin-top: 20px;
}

.product-detail {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.product-header {
  display: flex;
  padding: 30px;
}

.product-gallery {
  flex: 0 0 400px;
  margin-right: 30px;
}

.main-image {
  width: 400px;
  height: 400px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
}

.thumbnail-list {
  display: flex;
  gap: 10px;
}

.thumbnail-item {
  width: 80px;
  height: 80px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.thumbnail-item.active {
  border-color: #ff4d4f;
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.product-brief {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

.product-meta {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.product-price {
  margin-bottom: 10px;
}

.current-price {
  font-size: 28px;
  font-weight: bold;
  color: #ff4d4f;
}

.original-price {
  font-size: 18px;
  color: #999;
  text-decoration: line-through;
  margin-left: 10px;
}

.discount-label {
  display: inline-block;
  background-color: #ff4d4f;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 10px;
}

.product-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  font-size: 14px;
  color: #666;
}

.product-attributes {
  margin-bottom: 20px;
}

.attribute-item {
  display: flex;
  margin-bottom: 10px;
}

.attribute-name {
  font-size: 14px;
  color: #666;
  min-width: 80px;
}

.attribute-value {
  font-size: 14px;
  color: #333;
}

.product-quantity {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.quantity-label {
  font-size: 14px;
  color: #666;
  margin-right: 10px;
}

.quantity-input {
  display: flex;
  width: 150px;
}

.quantity-input .el-input {
  width: 70px;
  margin: 0 5px;
}

.stock-info {
  font-size: 14px;
  color: #999;
  margin-left: 20px;
}

.product-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.product-services {
  display: flex;
  gap: 20px;
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
}

.service-item {
  display: flex;
  align-items: center;
}

.service-item i {
  color: #52c41a;
  margin-right: 5px;
}

.service-item span {
  font-size: 14px;
  color: #666;
}

/* 响应式布局 */
@media (max-width: 992px) {
  .product-header {
    flex-direction: column;
  }
  
  .product-gallery {
    margin-right: 0;
    margin-bottom: 30px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 576px) {
  .product-actions {
    flex-direction: column;
  }
  
  .product-services {
    flex-direction: column;
    gap: 10px;
  }
  
  .main-image {
    width: 100%;
    height: auto;
    aspect-ratio: 1/1;
  }
}

.product-tabs {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tab-header {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.tab-item {
  padding: 15px 25px;
  font-size: 16px;
  cursor: pointer;
  position: relative;
  transition: color 0.3s;
}

.tab-item:hover {
  color: #ff6700;
}

.tab-item.active {
  color: #ff6700;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background-color: #ff6700;
}

.review-count {
  font-size: 14px;
  color: #ff6700;
  margin-left: 5px;
}

.tab-content {
  padding: 20px;
  min-height: 300px;
}

.tab-pane {
  line-height: 1.6;
}

.product-description {
  font-size: 14px;
  line-height: 1.8;
  color: #333;
}

.product-description img {
  max-width: 100%;
  height: auto;
  margin: 10px 0;
}

.params-table {
  width: 100%;
  border-collapse: collapse;
}

.params-table tr {
  border-bottom: 1px solid #eee;
}

.params-table tr:last-child {
  border-bottom: none;
}

.params-table td {
  padding: 12px 10px;
  font-size: 14px;
}

.param-name {
  width: 100px;
  color: #999;
  background-color: #f9f9f9;
}

.param-value {
  color: #333;
}

.review-list {
  padding: 10px 0;
}

.review-item {
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.reviewer-info {
  display: flex;
  align-items: center;
}

.reviewer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.reviewer-name {
  font-size: 14px;
  color: #333;
}

.review-rating {
  display: flex;
  align-items: center;
}

.review-date {
  margin-left: 10px;
  font-size: 12px;
  color: #999;
}

.review-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 10px;
}

.review-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.review-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
}

.review-reply {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 10px;
}

.reply-label {
  color: #ff6700;
  font-weight: bold;
}

.reply-content {
  color: #666;
}

.review-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  gap: 15px;
}

.no-reviews {
  padding: 30px 0;
}

/* 评价统计样式 */
.review-stats {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.stats-summary {
  display: flex;
  gap: 30px;
  margin-bottom: 15px;
}

.avg-rating {
  flex: 0 0 150px;
  text-align: center;
  border-right: 1px solid #eee;
  padding-right: 20px;
}

.rating-number {
  font-size: 36px;
  font-weight: bold;
  color: #ff6700;
  margin-bottom: 5px;
}

.rating-stars {
  margin-bottom: 5px;
}

.rating-text {
  font-size: 14px;
  color: #666;
}

.rating-distribution {
  flex: 1;
}

.rating-bar {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.rating-label {
  width: 40px;
  font-size: 14px;
  color: #666;
}

.progress-bar {
  flex: 1;
  height: 12px;
  background-color: #eee;
  border-radius: 6px;
  overflow: hidden;
  margin: 0 10px;
}

.progress {
  height: 100%;
  background-color: #ff6700;
  border-radius: 6px;
}

.rating-count {
  width: 40px;
  font-size: 14px;
  color: #666;
  text-align: right;
}

.stats-info {
  display: flex;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-right: 10px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #ff6700;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stats-summary {
    flex-direction: column;
    gap: 15px;
  }
  
  .avg-rating {
    border-right: none;
    border-bottom: 1px solid #eee;
    padding-right: 0;
    padding-bottom: 15px;
  }
}

.similar-products {
  margin-bottom: 30px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 80px;
  height: 2px;
  background-color: #ff6700;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.product-card {
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.product-card-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.discount-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ff6700;
  color: #fff;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 3px;
}

.product-card-info {
  padding: 10px;
}

.product-card-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  max-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.product-card-price {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.price {
  font-size: 16px;
  color: #ff6700;
  font-weight: bold;
}

.original {
  margin-left: 5px;
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.product-card-sales {
  font-size: 12px;
  color: #999;
}

.login-tip {
  text-align: center;
  padding: 20px 0;
}
</style> 