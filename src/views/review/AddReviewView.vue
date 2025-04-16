<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReviewStore } from '@/stores/review'
import { useProductStore } from '@/stores/product'
import { useFileStore } from '@/stores/file'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElUpload } from 'element-plus'
import { Star, StarFilled, Upload } from '@element-plus/icons-vue'

// 获取store和路由
const route = useRoute()
const router = useRouter()
const reviewStore = useReviewStore()
const productStore = useProductStore()
const fileStore = useFileStore()
const userStore = useUserStore()

// 获取商品ID和订单ID
const productId = computed(() => Number(route.query.productId))
const orderId = computed(() => Number(route.query.orderId))

// 评价表单
const reviewForm = ref({
  productId: null,
  orderId: null,
  content: '',
  rating: 0,
  images: [],
  anonymous: false
})

// 商品信息
const product = ref(null)
const loading = ref(false)

// 图片上传相关
const fileList = ref([])
const uploadHeaders = computed(() => ({
  // 如果需要认证的话，在这里添加token
}))

// 初始化数据
const initData = async () => {
  if (!productId.value || !orderId.value) {
    ElMessage.error('参数错误')
    router.push('/user/orders')
    return
  }

  // 检查登录状态
  if (!userStore.token) {
    ElMessage.warning('请先登录后再评价')
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    })
    return
  }

  // 在访问受保护资源前，尝试刷新用户信息
  try {
    await userStore.getUserInfo()
    
    // 如果刷新后发现未登录，则跳转
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录后再评价')
      router.push({
        path: '/login',
        query: { redirect: route.fullPath }
      })
      return
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    // 如果获取用户信息失败，也视为未登录
    ElMessage.warning('登录状态异常，请重新登录')
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    })
    return
  }

  loading.value = true
  try {
    // 获取商品信息
    const productInfo = await productStore.getProductDetail(productId.value)
    if (productInfo) {
      product.value = productInfo
      reviewForm.value.productId = productId.value
      reviewForm.value.orderId = orderId.value
    }

    // 检查是否已评价
    const reviewed = await reviewStore.checkReviewed(productId.value)
    if (reviewed) {
      ElMessage.warning('该商品已评价')
      router.push('/user/reviews')
    }
  } catch (error) {
    console.error('初始化评价页面失败', error)
    // 检查是否是登录状态问题
    if (error.response?.status === 401 || 
        error.response?.data?.message?.includes('未登录') ||
        error.message?.includes('未登录')) {
      ElMessage.warning('登录状态已过期，请重新登录')
      router.push({
        path: '/login',
        query: { redirect: route.fullPath }
      })
    }
  } finally {
    loading.value = false
  }
}

// 处理图片上传
const handleUploadSuccess = (response) => {
  if (response.code === 200) {
    reviewForm.value.images.push(response.data)
  } else {
    ElMessage.error('图片上传失败')
  }
}

const handleUploadError = () => {
  ElMessage.error('图片上传失败，请重试')
}

const handleRemove = (file) => {
  const index = reviewForm.value.images.indexOf(file.url)
  if (index !== -1) {
    reviewForm.value.images.splice(index, 1)
  }
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

// 提交评价
const submitReview = async () => {
  if (reviewForm.value.rating === 0) {
    ElMessage.warning('请选择评分')
    return
  }

  if (!reviewForm.value.content.trim()) {
    ElMessage.warning('请填写评价内容')
    return
  }

  loading.value = true
  try {
    const result = await reviewStore.addReview(reviewForm.value)
    if (result) {
      ElMessage.success('评价发表成功')
      router.push('/user/reviews')
    }
  } catch (error) {
    console.error('提交评价失败', error)
  } finally {
    loading.value = false
  }
}

// 返回订单详情
const goBack = () => {
  router.push(`/order/detail/${orderId.value}`)
}

onMounted(() => {
  initData()
})
</script>

<template>
  <div class="review-page">
    <div class="page-header">
      <h1 class="page-title">商品评价</h1>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <template v-else-if="product">
      <!-- 商品信息 -->
      <el-card class="product-card">
        <div class="product-info">
          <div class="product-image">
            <img :src="fileStore.getPreviewUrl(product.image)" :alt="product.name">
          </div>
          <div class="product-detail">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-price">¥{{ product.price }}</p>
          </div>
        </div>
      </el-card>

      <!-- 评价表单 -->
      <el-card class="review-form">
        <!-- 评分 -->
        <div class="rating-section">
          <div class="rating-label">商品评分：</div>
          <div class="rating-stars">
            <span 
              v-for="i in 5" 
              :key="i"
              class="star-item"
              @click="reviewForm.rating = i"
              @mouseenter="hoverRating = i"
              @mouseleave="hoverRating = 0"
            >
              <el-icon :size="24" :color="i <= (hoverRating || reviewForm.rating) ? '#ff4d4f' : '#dcdfe6'">
                <StarFilled v-if="i <= (hoverRating || reviewForm.rating)" />
                <Star v-else />
              </el-icon>
            </span>
            <span class="rating-text">{{ reviewStore.getRatingLevel(reviewForm.rating) }}</span>
          </div>
        </div>

        <!-- 评价内容 -->
        <div class="content-section">
          <el-input
            v-model="reviewForm.content"
            type="textarea"
            :rows="4"
            placeholder="请分享您对商品的使用体验..."
            maxlength="500"
            show-word-limit
          />
        </div>

        <!-- 图片上传 -->
        <div class="upload-section">
          <el-upload
            action="/api/file/upload"
            :headers="uploadHeaders"
            list-type="picture-card"
            :file-list="fileList"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
            :limit="6"
          >
            <el-icon><Upload /></el-icon>
            <div class="upload-text">上传图片</div>
          </el-upload>
          <div class="upload-tip">最多上传6张图片，每张不超过2M</div>
        </div>

        <!-- 匿名选项 -->
        <div class="anonymous-section">
          <el-checkbox v-model="reviewForm.anonymous">匿名评价</el-checkbox>
        </div>

        <!-- 提交按钮 -->
        <div class="form-actions">
          <el-button @click="goBack">返回</el-button>
          <el-button type="primary" @click="submitReview" :loading="loading">
            发表评价
          </el-button>
        </div>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.review-page {
  max-width: 800px;
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

.product-card {
  margin-bottom: 20px;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-image {
  width: 100px;
  height: 100px;
  overflow: hidden;
  border-radius: 4px;
  margin-right: 15px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-detail {
  flex: 1;
}

.product-name {
  font-size: 16px;
  margin: 0 0 10px;
  color: #333;
}

.product-price {
  font-size: 18px;
  color: #ff4d4f;
  margin: 0;
}

.review-form {
  padding: 20px;
}

.rating-section {
  margin-bottom: 20px;
}

.rating-label {
  font-size: 16px;
  margin-bottom: 10px;
}

.rating-stars {
  display: flex;
  align-items: center;
}

.star-item {
  cursor: pointer;
  padding: 2px;
}

.rating-text {
  margin-left: 10px;
  color: #666;
}

.content-section {
  margin-bottom: 20px;
}

.upload-section {
  margin-bottom: 20px;
}

.upload-text {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.anonymous-section {
  margin-bottom: 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

@media (max-width: 768px) {
  .product-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .product-image {
    margin-bottom: 15px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .el-button {
    width: 100%;
  }
}
</style>