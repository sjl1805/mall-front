<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReviewStore } from '@/stores/review'
import { useProductStore } from '@/stores/product'
import { useFileStore } from '@/stores/file'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElPagination } from 'element-plus'
import { Star, StarFilled, Filter } from '@element-plus/icons-vue'

// 获取store和路由
const route = useRoute()
const router = useRouter()
const reviewStore = useReviewStore()
const productStore = useProductStore()
const fileStore = useFileStore()
const userStore = useUserStore()

// 状态
const loading = ref(false)
const product = ref(null)
const reviews = ref([])
const reviewStats = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const totalReviews = ref(0)
const filter = ref({
  rating: 0, // 0表示全部，1-5表示对应星级
  hasImage: false, // 是否只看有图评价
})

// 获取商品ID
const productId = computed(() => Number(route.params.id))
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 显示登录对话框
const showLoginDialog = ref(false)

// 加载商品信息
const loadProduct = async () => {
  if (!productId.value) return

  try {
    const productData = await productStore.getProductDetail(productId.value)
    product.value = productData
  } catch (error) {
    console.error('获取商品信息失败', error)
    ElMessage.error('获取商品信息失败')
  }
}

// 加载评价统计
const loadReviewStats = async () => {
  if (!productId.value) return

  try {
    const stats = await reviewStore.getProductReviewStats(productId.value)
    reviewStats.value = stats
    totalReviews.value = stats.total || 0
  } catch (error) {
    console.error('获取评价统计失败', error)
  }
}

// 加载评价列表
const loadReviews = async (page = 1) => {
  if (!productId.value) return

  loading.value = true
  try {
    // 这里简化处理，实际可能需要根据filter传递更多参数
    const reviewData = await reviewStore.getProductReviews(productId.value, page, pageSize.value, true)
    reviews.value = reviewData
    currentPage.value = page
    
    // 更新总数量（根据筛选条件可能会变化）
    if (reviewStore.productReviewPages[productId.value]) {
      totalReviews.value = reviewStore.productReviewPages[productId.value].total
    }
  } catch (error) {
    console.error('获取评价列表失败', error)
    reviews.value = []
  } finally {
    loading.value = false
  }
}

// 筛选评价
const filterReviews = () => {
  // 重置页码并重新加载评价
  loadReviews(1)
}

// 清除筛选
const clearFilter = () => {
  filter.value = {
    rating: 0,
    hasImage: false
  }
  filterReviews()
}

// 前往评价页面
const goToReview = () => {
  if (!isLoggedIn.value) {
    showLoginDialog.value = true
    return
  }
  
  // 验证是否已购买过商品且是否已评价
  try {
    reviewStore.checkCanReview(productId.value)
      .then(result => {
        if (result.canReview) {
          // 跳转到评价页
          router.push({
            name: 'add-review',
            params: { 
              productId: productId.value
            },
            query: { 
              orderNo: result.orderNo
            }
          })
        } else {
          ElMessage.warning(result.message || '您暂时无法评价该商品')
        }
      })
      .catch(error => {
        console.error('检查评价状态失败', error)
        ElMessage.error('操作失败，请稍后重试')
      })
  } catch (e) {
    console.error('评价操作异常', e)
    ElMessage.error('操作异常，请稍后重试')
  }
}

// 前往登录页面
const goToLogin = () => {
  router.push({
    path: '/login',
    query: { redirect: route.fullPath }
  })
}

// 返回商品详情
const goToProduct = () => {
  router.push(`/product/${productId.value}`)
}

// 页面切换处理
const handlePageChange = (page) => {
  loadReviews(page)
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取图片URL
const getImageUrl = (imageUrl) => {
  return fileStore.getPreviewUrl(imageUrl)
}

// 页面加载时初始化数据
onMounted(async () => {
  if (!productId.value) {
    ElMessage.error('商品ID无效')
    router.push('/')
    return
  }
  
  await loadProduct()
  await loadReviewStats()
  await loadReviews(1)
})
</script>

<template>
  <div class="product-reviews-container">
    <div class="page-header">
      <div class="back-link" @click="goToProduct">
        <i class="el-icon-arrow-left">←</i>
        <span>返回商品详情</span>
      </div>
      <h1 class="page-title">商品评价</h1>
    </div>
    
    <!-- 商品信息 -->
    <div v-if="product" class="product-info">
      <div class="product-image">
        <img :src="getImageUrl(product.image)" :alt="product.name">
      </div>
      <div class="product-details">
        <h2 class="product-name">{{ product.name }}</h2>
        <div class="product-price">¥{{ product.price }}</div>
      </div>
    </div>
    
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
    
    <!-- 筛选条件 -->
    <div class="filter-container">
      <div class="filter-title">
        <el-icon><Filter /></el-icon>
        <span>筛选条件</span>
      </div>
      <div class="filter-options">
        <div class="filter-group">
          <span class="filter-label">评分：</span>
          <div class="filter-buttons">
            <el-button 
              :type="filter.rating === 0 ? 'primary' : ''" 
              size="small" 
              @click="filter.rating = 0; filterReviews()"
            >
              全部
            </el-button>
            <el-button 
              v-for="i in 5" 
              :key="i" 
              :type="filter.rating === i ? 'primary' : ''" 
              size="small" 
              @click="filter.rating = i; filterReviews()"
            >
              {{ i }}星
            </el-button>
          </div>
        </div>
        <div class="filter-group">
          <el-checkbox 
            v-model="filter.hasImage" 
            @change="filterReviews()"
          >
            只看有图评价
          </el-checkbox>
        </div>
        <div class="filter-actions">
          <el-button size="small" @click="clearFilter">清除筛选</el-button>
        </div>
      </div>
    </div>
    
    <!-- 评价列表 -->
    <div class="review-container">
      <div v-if="loading" class="loading-placeholder">
        <el-skeleton :rows="3" animated />
      </div>
      
      <template v-else>
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
                <span class="review-date">{{ formatDate(review.createTime || review.createTimeStr) }}</span>
              </div>
            </div>
            <div class="review-content">{{ review.content }}</div>
            <div v-if="review.images && review.images.length" class="review-images">
              <el-image
                v-for="(image, idx) in Array.isArray(review.images) ? review.images : review.images.split(',')"
                :key="idx"
                :src="getImageUrl(image)"
                fit="cover"
                :preview-src-list="Array.isArray(review.images) ? review.images.map(img => getImageUrl(img)) : review.images.split(',').map(img => getImageUrl(img))"
                class="review-image"
              />
            </div>
            <div v-if="review.reply" class="review-reply">
              <span class="reply-label">商家回复：</span>
              <span class="reply-content">{{ review.reply }}</span>
            </div>
          </div>
          
          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="totalReviews"
              layout="prev, pager, next, jumper, total"
              @current-change="handlePageChange"
            />
          </div>
          
          <!-- 评价按钮 -->
          <div class="review-actions">
            <el-button type="primary" @click="goToReview">我要评价</el-button>
          </div>
        </div>
        
        <div v-else class="empty-reviews">
          <el-empty description="暂无评价">
            <template #extra>
              <el-button type="primary" @click="goToReview">我要评价</el-button>
            </template>
          </el-empty>
        </div>
      </template>
    </div>
    
    <!-- 登录提示对话框 -->
    <el-dialog
      v-model="showLoginDialog"
      title="请先登录"
      width="30%"
    >
      <span>您需要登录后才能发表评价</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showLoginDialog = false">取消</el-button>
          <el-button type="primary" @click="goToLogin">
            去登录
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.product-reviews-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.back-link {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  margin-bottom: 10px;
}

.back-link:hover {
  color: #ff6700;
}

.back-link i {
  margin-right: 5px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.product-info {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 15px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: 18px;
  margin: 0 0 10px;
  color: #333;
}

.product-price {
  font-size: 16px;
  color: #ff6700;
}

.review-stats {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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

.filter-container {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.filter-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.filter-title .el-icon {
  margin-right: 5px;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.filter-label {
  margin-right: 10px;
  color: #666;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-actions {
  margin-left: auto;
}

.review-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.loading-placeholder {
  padding: 20px;
}

.review-list {
  padding: 0;
}

.review-item {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
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
  line-height: 1.6;
  color: #333;
  margin-bottom: 15px;
}

.review-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.review-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  object-fit: cover;
}

.review-reply {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
}

.reply-label {
  color: #ff6700;
  font-weight: bold;
}

.reply-content {
  color: #666;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.empty-reviews {
  padding: 50px 0;
  text-align: center;
}

.review-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

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
  
  .review-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .reviewer-info {
    margin-bottom: 10px;
  }
  
  .filter-options {
    flex-direction: column;
  }
  
  .filter-group {
    margin-bottom: 10px;
  }
  
  .filter-actions {
    margin-left: 0;
    margin-top: 10px;
  }
}
</style> 