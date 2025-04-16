<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReviewStore } from '@/stores/review'
import { useFileStore } from '@/stores/file'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox, ElPagination } from 'element-plus'
import { StarFilled, Delete, View } from '@element-plus/icons-vue'

// 获取store和路由
const router = useRouter()
const reviewStore = useReviewStore()
const fileStore = useFileStore()
const userStore = useUserStore()

// 状态
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

// 计算属性
const userReviews = computed(() => reviewStore.userReviews)
const totalReviews = computed(() => reviewStore.userReviewPage.total)
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 显示登录对话框
const showLoginDialog = ref(false)
// 显示token过期对话框
const showTokenExpiredDialog = ref(false)
// 状态同步中
const syncingLoginState = ref(false)

// 获取用户评价
const loadUserReviews = async (page = 1, force = false) => {
  if (!isLoggedIn.value) {
    showLoginDialog.value = true
    return
  }

  loading.value = true
  try {
    // 在加载之前尝试刷新用户信息，但不要阻塞主流程
    if (userStore.token) {
      // 使用与行为记录相同的方式处理token
      userStore.getUserInfo().catch(err => {
        console.warn('刷新用户信息失败，继续使用缓存token', err);
      });
    }
    
    // 使用更强的错误处理
    try {
      await reviewStore.getUserReviews(page, pageSize.value, force);
      currentPage.value = page;
      
      // 如果成功加载了数据，检查是否有评价列表
      if (userReviews.value && userReviews.value.length > 0) {
        console.log(`成功加载${userReviews.value.length}条评价`);
      } else if (isLoggedIn.value) {
        console.log('评价列表为空');
      }
    } catch (reviewError) {
      console.error('加载用户评价失败', reviewError);
      // 在此处理特定的评价加载错误，而不是向上抛出
      
      // 检查数据是否为空，如果为空但用户已登录，可能是登录状态不一致
      if (userReviews.value.length === 0 && isLoggedIn.value && totalReviews.value === 0) {
        console.warn('用户已登录但评价列表为空，可能需要同步登录状态');
        checkLoginState(reviewError);
      }
    }
  } finally {
    loading.value = false
  }
}

// 检查登录状态
const checkLoginState = (error = null) => {
  // 如果明确是未登录错误
  if (error && (
      error.response?.status === 401 || 
      error.response?.data?.message?.includes('未登录') ||
      error.message?.includes('未登录')
  )) {
    showTokenExpiredDialog.value = true
    return
  }
  
  // 尝试重新获取用户信息，检查登录状态是否有效
  userStore.getUserInfo()
    .then(() => {
      console.log('用户信息获取成功，登录状态有效')
    })
    .catch(err => {
      if (err.response?.status === 401 || 
          err.response?.data?.message?.includes('未登录') ||
          err.message?.includes('未登录')) {
        showTokenExpiredDialog.value = true
      }
    })
}

// 同步登录状态（重新登录）
const syncLoginState = async () => {
  syncingLoginState.value = true
  try {
    await userStore.logout(false) // 静默登出，不跳转
    showTokenExpiredDialog.value = false
    showLoginDialog.value = true
  } catch (error) {
    console.error('同步登录状态失败', error)
  } finally {
    syncingLoginState.value = false
  }
}

// 查看商品详情
const viewProduct = (productId) => {
  router.push(`/product/${productId}`)
}

// 删除评价
const deleteReview = async (reviewId, productId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评价吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const result = await reviewStore.deleteReview(reviewId, productId)
    if (result) {
      ElMessage.success('评价已删除')
      loadUserReviews(currentPage.value, true)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评价失败', error)
      ElMessage.error('删除评价失败')
    }
  }
}

// 处理页码变化
const handlePageChange = (page) => {
  loadUserReviews(page)
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

// 前往登录页面
const goToLogin = () => {
  router.push({
    path: '/login',
    query: { redirect: router.currentRoute.value.fullPath }
  })
}

// 页面加载时获取评价列表
onMounted(() => {
  // 检查登录状态并尝试刷新用户信息
  checkAndRefreshLoginState();
})

// 检查并刷新登录状态
const checkAndRefreshLoginState = async () => {
  try {
    // 如果本地存在token，强制刷新用户信息
    if (userStore.token) {
      console.log('刷新用户信息开始...')
      try {
        await userStore.getUserInfo();
        console.log('刷新用户信息成功')
        
        // 刷新成功后再加载评价
        if (userStore.isLoggedIn) {
          // 使用与行为记录相同的方式加载数据
          await loadUserReviewsWithRetry();
        }
      } catch (error) {
        console.error('刷新用户信息失败，但仍尝试加载评价')
        // 即使刷新失败，也尝试加载评价，让请求拦截器处理认证
        await loadUserReviewsWithRetry();
      }
    } else {
      // 未登录状态，什么都不做
      console.log('用户未登录，不加载评价列表');
    }
  } catch (error) {
    console.error('检查登录状态失败', error);
    // 登录状态失效，显示未登录界面
  }
}

// 带重试机制的评价加载方法（模拟行为记录的方式）
const loadUserReviewsWithRetry = async (maxRetries = 1) => {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      await loadUserReviews(1, true);
      break; // 成功则跳出循环
    } catch (error) {
      retries++;
      if (retries <= maxRetries) {
        console.warn(`评价加载失败，第${retries}次重试`);
        // 尝试刷新token
        try { await userStore.getUserInfo(); } catch (e) { /* 忽略错误 */ }
      } else {
        console.error('评价加载失败，已达到最大重试次数');
        break;
      }
    }
  }
}
</script>

<template>
  <div class="reviews-container">
    <div class="page-header">
      <h1 class="page-title">我的评价</h1>
    </div>

    <!-- 登录检查 -->
    <template v-if="!isLoggedIn">
      <div class="login-prompt">
        <el-empty description="您尚未登录，请先登录后查看评价">
          <template #extra>
            <el-button type="primary" @click="goToLogin">去登录</el-button>
          </template>
        </el-empty>
      </div>
    </template>

    <!-- 已登录用户内容 -->
    <template v-else>
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 评价列表 -->
      <template v-else>
        <div v-if="userReviews.length" class="reviews-list">
          <div v-for="review in userReviews" :key="review.id" class="review-item">
            <div class="product-info">
              <div class="product-image" @click="viewProduct(review.productId)">
                <img :src="getImageUrl(review.productImage)" :alt="review.productName">
              </div>
              <div class="product-details">
                <h3 class="product-name" @click="viewProduct(review.productId)">{{ review.productName }}</h3>
                <div class="product-price">¥{{ review.productPrice }}</div>
              </div>
            </div>
            
            <div class="review-content">
              <div class="review-header">
                <div class="review-rating">
                  <el-rate 
                    v-model="review.rating" 
                    disabled
                    show-score
                    text-color="#ff9900"
                  />
                  <span class="review-date">{{ formatDate(review.createTime || review.createTimeStr) }}</span>
                </div>
                <div class="review-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    :icon="View" 
                    @click="viewProduct(review.productId)"
                  >
                    查看商品
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    :icon="Delete" 
                    @click="deleteReview(review.id, review.productId)"
                  >
                    删除评价
                  </el-button>
                </div>
              </div>
              
              <div class="review-text">{{ review.content }}</div>
              
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
          </div>
          
          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="totalReviews"
              layout="prev, pager, next, jumper"
              @current-change="handlePageChange"
            />
          </div>
        </div>
        
        <div v-else class="empty-reviews">
          <el-empty description="您还没有发表过评价">
            <template #extra>
              <el-button type="primary" @click="router.push('/')">去购物</el-button>
            </template>
          </el-empty>
        </div>
      </template>
    </template>

    <!-- 登录提示对话框 -->
    <el-dialog
      v-model="showLoginDialog"
      title="请先登录"
      width="30%"
    >
      <span>您需要登录后才能查看和管理您的评价</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showLoginDialog = false">取消</el-button>
          <el-button type="primary" @click="goToLogin">
            去登录
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 登录状态不一致提示对话框 -->
    <el-dialog
      v-model="showTokenExpiredDialog"
      title="登录状态不一致"
      width="30%"
    >
      <span>您的登录状态不一致，请重新登录</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTokenExpiredDialog = false">取消</el-button>
          <el-button type="primary" @click="syncLoginState">
            重新登录
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.reviews-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.loading-container {
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.reviews-list {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.review-item {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.review-item:last-child {
  border-bottom: none;
}

.product-info {
  display: flex;
  margin-bottom: 15px;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 15px;
  cursor: pointer;
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
  font-size: 16px;
  margin: 0 0 10px;
  color: #333;
  cursor: pointer;
}

.product-name:hover {
  color: #ff6700;
}

.product-price {
  font-size: 14px;
  color: #ff6700;
}

.review-content {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
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

.review-actions {
  display: flex;
  gap: 10px;
}

.review-text {
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
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.login-prompt {
  background: #fff;
  border-radius: 8px;
  padding: 50px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

@media (max-width: 768px) {
  .review-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .review-rating {
    margin-bottom: 10px;
  }
  
  .product-info {
    flex-direction: column;
  }
  
  .product-image {
    margin-bottom: 10px;
    margin-right: 0;
  }
}
</style> 