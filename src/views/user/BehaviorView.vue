<script setup>
import { ref, onMounted, computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useBehaviorStore } from '@/stores/behavior'
import { useFileStore } from '@/stores/file'
import { ElMessage, ElMessageBox } from 'element-plus'

// 引入图标
import { View, Delete, Calendar, ShoppingBag, Timer, Star, ShoppingCart, ChatLineRound, Filter } from '@element-plus/icons-vue'

const router = useRouter()
const behaviorStore = useBehaviorStore()
const fileStore = useFileStore()

// 用户行为列表和过滤条件
const behaviorList = ref([])
const isLoading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const groupByDate = ref(true) // 是否按日期分组显示

// 过滤条件
const filterParams = ref({
  behaviorType: null,
  startTime: null,
  endTime: null
})

// 可选的行为类型列表
const behaviorTypes = computed(() => {
  return [
    { value: null, label: '全部行为' },
    { value: behaviorStore.BehaviorType.VIEW, label: '浏览' },
    { value: behaviorStore.BehaviorType.FAVORITE, label: '收藏' },
    { value: behaviorStore.BehaviorType.CART, label: '加购' },
    { value: behaviorStore.BehaviorType.PURCHASE, label: '购买' },
    { value: behaviorStore.BehaviorType.REVIEW, label: '评价' }
  ]
})

// 当前行为类型的文本
const currentBehaviorTypeText = computed(() => {
  if (!filterParams.value.behaviorType) return '用户行为'
  return behaviorStore.behaviorTypeMap[filterParams.value.behaviorType] || '用户行为'
})

// 分组后的历史记录
const groupedBehaviors = computed(() => {
  if (!groupByDate.value || !behaviorList.value.length) return {}
  
  const grouped = {}
  behaviorList.value.forEach(item => {
    // 获取日期部分，兼容ISO日期格式和普通字符串格式
    const dateStr = formatISODate(item.behaviorTime || item.createTime)
    const date = dateStr.split(' ')[0]
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(item)
  })
  return grouped
})

// 组织为时间线数据格式
const timelineData = computed(() => {
  if (!groupByDate.value) return []
  
  return Object.keys(groupedBehaviors.value).map(date => {
    return {
      date,
      items: groupedBehaviors.value[date]
    }
  }).sort((a, b) => new Date(b.date) - new Date(a.date)) // 按日期倒序排序
})

// 获取商品图片URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '/images/default-product.png'
  
  // 对可能的相对路径进行特殊处理，确保路径格式正确
  if (imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
    imageUrl = '/' + imageUrl
  }
  
  return fileStore.getPreviewUrl(imageUrl)
}

// 格式化ISO日期
const formatISODate = (dateString) => {
  if (!dateString) return ''
  
  let date
  try {
    // 处理ISO格式日期
    if (dateString.includes('T')) {
      date = new Date(dateString)
    } else {
      // 处理普通字符串格式
      date = new Date(dateString.replace(/-/g, '/'))
    }
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.error('日期格式化错误', error)
    return dateString
  }
}

// 获取行为类型图标
const getBehaviorTypeIcon = (type) => {
  switch (type) {
    case behaviorStore.BehaviorType.VIEW:
      return View
    case behaviorStore.BehaviorType.FAVORITE:
      return Star
    case behaviorStore.BehaviorType.CART:
      return ShoppingCart
    case behaviorStore.BehaviorType.PURCHASE:
      return ShoppingBag
    case behaviorStore.BehaviorType.REVIEW:
      return ChatLineRound
    default:
      return View
  }
}

// 获取用户行为历史
const fetchBehaviorHistory = async () => {
  isLoading.value = true
  try {
    const params = {
      ...filterParams.value,
      page: currentPage.value,
      size: pageSize.value
    }
    
    const result = await behaviorStore.fetchBehaviorHistoryPage(params)
    
    if (result && result.records) {
      behaviorList.value = result.records
      total.value = result.total || 0
    } else {
      behaviorList.value = []
      total.value = 0
    }
    
    console.log('获取的用户行为数据:', behaviorList.value)
  } catch (error) {
    console.error('获取用户行为历史失败', error)
    ElMessage.error('获取用户行为历史失败')
    behaviorList.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

// 切换分页
const handlePageChange = (page) => {
  currentPage.value = page
  fetchBehaviorHistory()
}

// 切换每页条数
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchBehaviorHistory()
}

// 应用过滤条件
const applyFilters = () => {
  currentPage.value = 1
  fetchBehaviorHistory()
}

// 重置过滤条件
const resetFilters = () => {
  filterParams.value = {
    behaviorType: null,
    startTime: null,
    endTime: null
  }
  currentPage.value = 1
  fetchBehaviorHistory()
}

// 前往商品详情页
const goToProduct = (productId) => {
  router.push(`/product/${productId}`)
}

// 删除单条记录
const deleteRecord = (id) => {
  ElMessageBox.confirm('确定要删除这条行为记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 找到该记录
      const record = behaviorList.value.find(item => item.id === id)
      if (!record) {
        ElMessage.error('未找到记录信息')
        return
      }
      
      await behaviorStore.cancelUserBehavior(record.productId, record.behaviorType)
      ElMessage.success('删除成功')
      fetchBehaviorHistory() // 重新加载数据
    } catch (error) {
      console.error('删除记录失败', error)
      ElMessage.error('删除记录失败')
    }
  }).catch(() => {})
}

// 清空指定类型的行为记录
const clearBehaviorHistory = () => {
  const behaviorType = filterParams.value.behaviorType
  const typeText = behaviorType ? behaviorStore.behaviorTypeMap[behaviorType] : '所有'
  
  ElMessageBox.confirm(
    `确定要清空${typeText}行为记录吗？此操作不可恢复！`, 
    '警告', 
    {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    try {
      await behaviorStore.clearUserBehaviorRecords({
        behaviorType: filterParams.value.behaviorType
      })
      ElMessage.success(`已清空${typeText}行为记录`)
      fetchBehaviorHistory()
    } catch (error) {
      console.error('清空记录失败', error)
      ElMessage.error('清空记录失败')
    }
  }).catch(() => {})
}

// 切换显示模式
const toggleDisplayMode = () => {
  groupByDate.value = !groupByDate.value
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  // 只保留时间部分
  const timePart = time.split(' ')[1]
  return timePart ? timePart.substring(0, 5) : '' // 只显示小时和分钟
}

// 格式化日期为易读形式
const formatDate = (date) => {
  if (!date) return ''
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const targetDate = new Date(date)
  
  if (targetDate.toDateString() === today.toDateString()) {
    return '今天'
  } else if (targetDate.toDateString() === yesterday.toDateString()) {
    return '昨天'
  } else {
    return date
  }
}

// 监听过滤条件变化，自动应用过滤器
watchEffect(() => {
  if (filterParams.value.behaviorType !== undefined) {
    console.log('行为类型变更:', filterParams.value.behaviorType)
  }
})

// 组件挂载时获取数据
onMounted(() => {
  fetchBehaviorHistory()
  behaviorStore.fetchUserBehaviorStats() // 获取用户行为统计数据
})
</script>

<template>
  <div class="behavior-container">
    <div class="behavior-header">
      <h1 class="page-title">{{ currentBehaviorTypeText }}历史</h1>
      <div class="header-actions">
        <el-button type="primary" plain size="small" @click="toggleDisplayMode">
          {{ groupByDate ? '普通模式' : '时间线模式' }}
        </el-button>
        <el-button 
          type="danger" 
          plain 
          size="small" 
          @click="clearBehaviorHistory"
          :disabled="total === 0"
        >
          清空记录
        </el-button>
      </div>
    </div>
    
    <!-- 过滤器区域 -->
    <div class="filter-container">
      <el-card shadow="hover">
        <template #header>
          <div class="filter-header">
            <span><el-icon><Filter /></el-icon> 筛选条件</span>
          </div>
        </template>
        <el-form :inline="true" class="filter-form">
          <el-form-item label="行为类型">
            <el-select 
              v-model="filterParams.behaviorType" 
              placeholder="选择行为类型"
              clearable
            >
              <el-option 
                v-for="type in behaviorTypes" 
                :key="type.value" 
                :label="type.label" 
                :value="type.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="开始时间">
            <el-date-picker
              v-model="filterParams.startTime"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              clearable
            />
          </el-form-item>
          <el-form-item label="结束时间">
            <el-date-picker
              v-model="filterParams.endTime"
              type="datetime"
              placeholder="选择结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilters">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    
    <!-- 行为统计区域 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="4" v-for="(type, index) in behaviorTypes.slice(1)" :key="index">
          <el-card shadow="hover" class="stats-card" :class="{ 'active': filterParams.behaviorType === type.value }">
            <div class="stats-item" @click="filterParams.behaviorType = type.value; applyFilters()">
              <el-icon :size="24"><component :is="getBehaviorTypeIcon(type.value)" /></el-icon>
              <div class="stats-content">
                <div class="stats-title">{{ type.label }}</div>
                <div class="stats-value">{{ behaviorStore.getBehaviorCountByType(type.value) || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="hover" class="stats-card" :class="{ 'active': filterParams.behaviorType === null }">
            <div class="stats-item" @click="filterParams.behaviorType = null; applyFilters()">
              <el-icon :size="24"><View /></el-icon>
              <div class="stats-content">
                <div class="stats-title">全部</div>
                <div class="stats-value">{{ behaviorStore.behaviorCount }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <el-divider />
    
    <div v-if="isLoading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="total === 0" class="empty-state">
      <el-empty :description="`暂无${currentBehaviorTypeText}记录`" />
    </div>
    
    <div v-else>
      <!-- 时间线显示模式 -->
      <div v-if="groupByDate" class="timeline-view">
        <el-timeline>
          <el-timeline-item
            v-for="group in timelineData"
            :key="group.date"
            :timestamp="formatDate(group.date)"
            placement="top"
            :icon="Calendar"
            type="primary"
          >
            <el-card class="date-group-card">
              <div class="product-grid">
                <div 
                  v-for="item in group.items" 
                  :key="item.id"
                  class="product-item"
                >
                  <div class="product-image" @click="goToProduct(item.productId)">
                    <img :src="getImageUrl(item.productImage)" :alt="item.productName">
                    <!-- 行为类型标签 -->
                    <div class="behavior-type-badge" :class="`behavior-type-${item.behaviorType}`">
                      <el-icon><component :is="getBehaviorTypeIcon(item.behaviorType)" /></el-icon>
                      {{ behaviorStore.behaviorTypeMap[item.behaviorType] || '浏览' }}
                    </div>
                  </div>
                  <div class="product-info">
                    <div class="product-name" @click="goToProduct(item.productId)">{{ item.productName }}</div>
                    <div class="product-price">¥ {{ item.productPrice || '暂无价格' }}</div>
                    <div class="product-view-time">
                      <el-icon><Timer /></el-icon>
                      <span>{{ formatTime(item.behaviorTime) }}</span>
                    </div>
                    <div class="product-actions">
                      <el-button 
                        size="small" 
                        type="primary" 
                        text 
                        @click="goToProduct(item.productId)"
                      >
                        <el-icon><View /></el-icon> 查看
                      </el-button>
                      <el-button 
                        size="small" 
                        type="danger" 
                        text 
                        @click="deleteRecord(item.id)"
                      >
                        <el-icon><Delete /></el-icon> 删除
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
      
      <!-- 普通列表模式 -->
      <div v-else class="list-view">
        <el-card v-for="item in behaviorList" :key="item.id" class="product-card">
          <div class="product-card-content">
            <div class="product-image" @click="goToProduct(item.productId)">
              <img :src="getImageUrl(item.productImage)" :alt="item.productName">
              <!-- 行为类型标签 -->
              <div class="behavior-type-badge" :class="`behavior-type-${item.behaviorType}`">
                <el-icon><component :is="getBehaviorTypeIcon(item.behaviorType)" /></el-icon>
                {{ behaviorStore.behaviorTypeMap[item.behaviorType] || '浏览' }}
              </div>
            </div>
            <div class="product-details">
              <h3 class="product-name" @click="goToProduct(item.productId)">{{ item.productName }}</h3>
              <div class="product-price">¥ {{ item.productPrice || '暂无价格' }}</div>
              <div class="product-time">
                <el-icon><Timer /></el-icon>
                <span>{{ item.behaviorTime || item.behaviorTimeStr }}</span>
              </div>
              <div class="product-behavior-desc" v-if="item.behaviorTypeDesc">
                {{ item.behaviorTypeDesc }}
              </div>
            </div>
            <div class="product-actions">
              <el-button 
                size="small" 
                type="primary" 
                @click="goToProduct(item.productId)"
              >
                <el-icon><View /></el-icon> 查看
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="deleteRecord(item.id)"
              >
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.behavior-container {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: calc(100vh - 120px);
}

.behavior-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-header {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.filter-header .el-icon {
  margin-right: 8px;
}

.filter-form {
  margin-top: 10px;
}

/* 统计卡片样式 */
.stats-container {
  margin-bottom: 20px;
}

.stats-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stats-card:hover, .stats-card.active {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stats-card.active {
  border-color: #409EFF;
}

.stats-item {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stats-content {
  margin-left: 10px;
}

.stats-title {
  font-size: 14px;
  color: #606266;
}

.stats-value {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
}

.loading-container {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.empty-state {
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
}

/* 时间线样式 */
.timeline-view {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.date-group-card {
  margin-bottom: 20px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.product-item {
  background: #f9f9f9;
  border-radius: 6px;
  overflow: hidden;
  transition: transform 0.3s;
  position: relative;
}

.product-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.product-image {
  height: 160px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-image:hover img {
  transform: scale(1.05);
}

/* 行为类型标签 */
.behavior-type-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(64, 158, 255, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  z-index: 1;
}

.behavior-type-badge .el-icon {
  margin-right: 4px;
}

.behavior-type-1 {
  background-color: rgba(64, 158, 255, 0.8); /* 浏览 - 蓝色 */
}

.behavior-type-2 {
  background-color: rgba(230, 162, 60, 0.8); /* 收藏 - 橙色 */
}

.behavior-type-3 {
  background-color: rgba(103, 194, 58, 0.8); /* 加购 - 绿色 */
}

.behavior-type-4 {
  background-color: rgba(245, 108, 108, 0.8); /* 购买 - 红色 */
}

.behavior-type-5 {
  background-color: rgba(144, 147, 153, 0.8); /* 评价 - 灰色 */
}

.product-info {
  padding: 10px;
}

.product-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  height: 40px;
}

.product-name:hover {
  color: #409EFF;
}

.product-price {
  font-size: 16px;
  color: #f56c6c;
  font-weight: bold;
  margin-bottom: 5px;
}

.product-view-time {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}

.product-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

/* 列表样式 */
.list-view {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-card {
  transition: transform 0.3s;
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.product-card-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.product-card .product-image {
  width: 100px;
  height: 100px;
  min-width: 100px;
}

.product-details {
  flex: 1;
}

.product-details .product-name {
  margin-top: 0;
}

.product-time {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 5px;
}

.product-behavior-desc {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}

/* 分页样式 */
.pagination-container {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

@media screen and (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
  
  .product-card-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .product-card .product-image {
    width: 100%;
    height: 180px;
  }
  
  .product-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .filter-form {
    display: flex;
    flex-direction: column;
  }
  
  .filter-form .el-form-item {
    margin-right: 0;
    width: 100%;
  }
}
</style> 