<template>
  <div class="recommendation-manage-container">
    <el-card class="overview-card">
      <template #header>
        <div class="card-header">
          <span>推荐管理</span>
        </div>
      </template>
      
      <el-alert
        title="推荐系统管理说明"
        type="info"
        description="推荐系统通过分析用户行为、商品特征和用户偏好，为用户提供个性化的商品推荐。本管理界面提供推荐生成功能，帮助优化站点的推荐效果。"
        show-icon
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-row :gutter="20">
        <el-col :span="24">
          <el-card class="stat-card">
            <div class="stat-icon">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">推荐结果生成</div>
              <div class="stat-desc">生成最终的推荐结果，包括个性化推荐、猜你喜欢等</div>
              <div class="stat-action">
                <el-button 
                  type="primary" 
                  @click="handleRecommendations" 
                  :loading="loading.recommendations"
                >
                  生成推荐结果
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
    
    <el-card class="advanced-card">
      <template #header>
        <div class="card-header">
          <span>高级操作</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="单个用户推荐生成" name="recommend">
          <div class="tab-content">
            <el-form :inline="true">
              <el-form-item label="用户ID">
                <el-input v-model="singleRecommendUserId" placeholder="请输入用户ID" />
              </el-form-item>
              <el-form-item label="推荐数量">
                <el-input-number v-model="recommendLimit" :min="1" :max="50" :step="1" />
              </el-form-item>
              <el-form-item>
                <el-button 
                  type="primary" 
                  @click="handleSingleUserRecommendation" 
                  :disabled="!singleRecommendUserId || loading.singleRecommendation"
                  :loading="loading.singleRecommendation"
                >
                  生成
                </el-button>
              </el-form-item>
              <el-form-item>
                <el-text type="info">为单个用户立即生成推荐，可以在用户偏好变化后使用此功能</el-text>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star } from '@element-plus/icons-vue'

const adminStore = useAdminStore()

// 标签页控制
const activeTab = ref('recommend')

// 单个操作相关状态
const singleRecommendUserId = ref('')
const recommendLimit = ref(10)

// 推荐系统状态
const status = reactive({
  lastRecommendationsTime: '',
  recommendedUserCount: 0,
  recommendationCount: 0
})

// 加载状态
const loading = reactive({
  recommendations: false,
  singleRecommendation: false
})

// 初始化页面加载系统状态
onMounted(async () => {
  await loadRecommendationStatus()
})

// 加载推荐系统状态
const loadRecommendationStatus = async () => {
  try {
    // 这里应该调用API获取推荐系统状态
    // 由于API未提供，使用模拟数据
    setTimeout(() => {
      status.lastRecommendationsTime = '2023-11-20 03:30:18'
      status.recommendedUserCount = 498
      status.recommendationCount = 4980
    }, 500)
  } catch (error) {
    console.error('加载推荐系统状态失败', error)
    ElMessage.error('加载推荐系统状态失败')
  }
}

// 生成推荐结果
const handleRecommendations = async () => {
  ElMessageBox.confirm(
    '生成推荐结果可能需要较长时间，确定要继续吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    loading.recommendations = true
    try {
      const result = await adminStore.generateRecommendations()
      ElMessage.success(`成功更新${result}个用户的推荐记录`)
      status.lastRecommendationsTime = new Date().toLocaleString()
      status.recommendedUserCount = result
      status.recommendationCount = result * 10 // 估算推荐记录数
    } catch (error) {
      console.error('生成推荐结果失败', error)
    } finally {
      loading.recommendations = false
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 生成单个用户的推荐
const handleSingleUserRecommendation = async () => {
  if (!singleRecommendUserId.value) return
  
  loading.singleRecommendation = true
  try {
    await adminStore.generateRecommendations(
      parseInt(singleRecommendUserId.value),
      recommendLimit.value
    )
    ElMessage.success(`成功为用户 ${singleRecommendUserId.value} 生成 ${recommendLimit.value} 条推荐记录`)
  } catch (error) {
    console.error('生成单个用户推荐失败', error)
  } finally {
    loading.singleRecommendation = false
  }
}
</script>

<style scoped>
.recommendation-manage-container {
  padding: 20px;
}

.overview-card, .advanced-card, .schedule-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card {
  display: flex;
  height: 100%;
  padding: 10px;
}

.stat-icon {
  font-size: 40px;
  color: #409EFF;
  margin-right: 15px;
  display: flex;
  align-items: center;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.stat-desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 15px;
  min-height: 40px;
}

.stat-action {
  margin-top: auto;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tab-content {
  padding: 10px 0;
}

@media (max-width: 768px) {
  .el-row {
    display: block;
  }
  
  .el-col {
    width: 100% !important;
    margin-bottom: 15px;
  }
}
</style>
