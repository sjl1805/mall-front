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
        description="推荐系统通过分析用户行为、商品特征和用户偏好，为用户提供个性化的商品推荐。本管理界面提供数据计算、推荐生成和状态监控功能，帮助优化站点的推荐效果。"
        show-icon
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-icon">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">商品相似度计算</div>
              <div class="stat-desc">计算商品之间的关联度，支持"猜你喜欢"和"相关商品"推荐</div>
              <div class="stat-action">
                <el-button 
                  type="primary" 
                  @click="handleAllSimilarities" 
                  :loading="loading.similarities"
                >
                  计算所有商品相似度
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">用户偏好计算</div>
              <div class="stat-desc">根据用户行为分析用户兴趣，为个性化推荐提供基础</div>
              <div class="stat-action">
                <el-button 
                  type="primary" 
                  @click="handleUserPreferences" 
                  :loading="loading.preferences"
                >
                  计算用户偏好
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
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
      
      <el-divider content-position="center">推荐系统状态</el-divider>
      
      <el-row :gutter="20" class="status-row">
        <el-col :span="8">
          <div class="status-item">
            <div class="status-label">上次计算商品相似度：</div>
            <div class="status-value">{{ status.lastSimilaritiesTime || '从未计算' }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="status-item">
            <div class="status-label">商品总数：</div>
            <div class="status-value">{{ status.productCount || 0 }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="status-item">
            <div class="status-label">有效相似度记录：</div>
            <div class="status-value">{{ status.similarityCount || 0 }}</div>
          </div>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" class="status-row">
        <el-col :span="8">
          <div class="status-item">
            <div class="status-label">上次计算用户偏好：</div>
            <div class="status-value">{{ status.lastPreferencesTime || '从未计算' }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="status-item">
            <div class="status-label">活跃用户数：</div>
            <div class="status-value">{{ status.activeUserCount || 0 }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="status-item">
            <div class="status-label">有效偏好记录：</div>
            <div class="status-value">{{ status.preferenceCount || 0 }}</div>
          </div>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" class="status-row">
        <el-col :span="8">
          <div class="status-item">
            <div class="status-label">上次生成推荐：</div>
            <div class="status-value">{{ status.lastRecommendationsTime || '从未生成' }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="status-item">
            <div class="status-label">推荐覆盖用户数：</div>
            <div class="status-value">{{ status.recommendedUserCount || 0 }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="status-item">
            <div class="status-label">推荐记录总数：</div>
            <div class="status-value">{{ status.recommendationCount || 0 }}</div>
          </div>
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
        <el-tab-pane label="单个商品相似度计算" name="product">
          <div class="tab-content">
            <el-form :inline="true">
              <el-form-item label="商品ID">
                <el-input v-model="singleProductId" placeholder="请输入商品ID" />
              </el-form-item>
              <el-form-item>
                <el-button 
                  type="primary" 
                  @click="handleSingleProductSimilarity" 
                  :disabled="!singleProductId || loading.singleSimilarity"
                  :loading="loading.singleSimilarity"
                >
                  计算
                </el-button>
              </el-form-item>
              <el-form-item>
                <el-text type="info">为单个商品重新计算与其他所有商品的相似度，用于新增商品或商品信息有重大更新的情况</el-text>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="单个用户偏好计算" name="user">
          <div class="tab-content">
            <el-form :inline="true">
              <el-form-item label="用户ID">
                <el-input v-model="singleUserId" placeholder="请输入用户ID" />
              </el-form-item>
              <el-form-item>
                <el-button 
                  type="primary" 
                  @click="handleSingleUserPreference" 
                  :disabled="!singleUserId || loading.singlePreference"
                  :loading="loading.singlePreference"
                >
                  计算
                </el-button>
              </el-form-item>
              <el-form-item>
                <el-text type="info">为单个用户重新计算偏好，用于用户近期行为发生显著变化的情况</el-text>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
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

        <el-tab-pane label="相似用户查询" name="similar">
          <div class="tab-content">
            <el-form :inline="true">
              <el-form-item label="用户ID">
                <el-input v-model="queryUserId" placeholder="请输入用户ID" />
              </el-form-item>
              <el-form-item label="查询数量">
                <el-input-number v-model="similarLimit" :min="1" :max="20" :step="1" />
              </el-form-item>
              <el-form-item>
                <el-button 
                  type="primary" 
                  @click="handleQuerySimilarUsers" 
                  :disabled="!queryUserId || loading.similarUsers"
                  :loading="loading.similarUsers"
                >
                  查询
                </el-button>
              </el-form-item>
            </el-form>
            
            <div v-if="similarUsers && similarUsers.length > 0" class="similar-users-result">
              <el-table :data="similarUsers" border style="width: 100%">
                <el-table-column prop="userId" label="用户ID" width="100" />
                <el-table-column prop="username" label="用户名" min-width="150" />
                <el-table-column prop="similarity" label="相似度" width="120">
                  <template #default="{ row }">
                    <el-progress 
                      :percentage="Math.round(row.similarity * 100)" 
                      :color="getSimilarityColor(row.similarity)" 
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="commonInterests" label="共同兴趣" min-width="200" show-overflow-tooltip />
                <el-table-column prop="lastActivityTime" label="最近活动时间" width="180" />
              </el-table>
            </div>
            <el-empty v-else-if="queriedSimilarUsers && !loading.similarUsers" description="未找到相似用户" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <el-card class="schedule-card">
      <template #header>
        <div class="card-header">
          <span>计算任务调度</span>
        </div>
      </template>
      
      <div class="schedule-desc">
        <el-text type="info">
          配置推荐系统的自动计算任务，系统将按照指定的时间周期自动执行推荐数据的更新，保持推荐结果的时效性。
        </el-text>
      </div>
      
      <el-row :gutter="20" class="schedule-row">
        <el-col :span="8">
          <el-card class="schedule-item">
            <div class="schedule-title">商品相似度计算</div>
            <el-form label-position="top">
              <el-form-item label="执行周期">
                <el-select v-model="schedule.similarities" placeholder="请选择执行周期">
                  <el-option label="每天" value="daily" />
                  <el-option label="每周" value="weekly" />
                  <el-option label="每月" value="monthly" />
                  <el-option label="手动执行" value="manual" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="schedule.similarities !== 'manual'">
                <el-time-picker
                  v-model="scheduleTime.similarities"
                  placeholder="选择时间"
                  format="HH:mm"
                  value-format="HH:mm"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveSchedule('similarities')">保存设置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="schedule-item">
            <div class="schedule-title">用户偏好计算</div>
            <el-form label-position="top">
              <el-form-item label="执行周期">
                <el-select v-model="schedule.preferences" placeholder="请选择执行周期">
                  <el-option label="每天" value="daily" />
                  <el-option label="每周" value="weekly" />
                  <el-option label="每月" value="monthly" />
                  <el-option label="手动执行" value="manual" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="schedule.preferences !== 'manual'">
                <el-time-picker
                  v-model="scheduleTime.preferences"
                  placeholder="选择时间"
                  format="HH:mm"
                  value-format="HH:mm"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveSchedule('preferences')">保存设置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="schedule-item">
            <div class="schedule-title">推荐结果生成</div>
            <el-form label-position="top">
              <el-form-item label="执行周期">
                <el-select v-model="schedule.recommendations" placeholder="请选择执行周期">
                  <el-option label="每天" value="daily" />
                  <el-option label="每周" value="weekly" />
                  <el-option label="每月" value="monthly" />
                  <el-option label="手动执行" value="manual" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="schedule.recommendations !== 'manual'">
                <el-time-picker
                  v-model="scheduleTime.recommendations"
                  placeholder="选择时间"
                  format="HH:mm"
                  value-format="HH:mm"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveSchedule('recommendations')">保存设置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataAnalysis, UserFilled, Star } from '@element-plus/icons-vue'

const adminStore = useAdminStore()

// 标签页控制
const activeTab = ref('product')

// 单个操作相关状态
const singleProductId = ref('')
const singleUserId = ref('')
const singleRecommendUserId = ref('')
const recommendLimit = ref(10)
const queryUserId = ref('')
const similarLimit = ref(5)
const similarUsers = ref([])
const queriedSimilarUsers = ref(false)

// 推荐系统状态
const status = reactive({
  lastSimilaritiesTime: '',
  productCount: 0,
  similarityCount: 0,
  lastPreferencesTime: '',
  activeUserCount: 0,
  preferenceCount: 0,
  lastRecommendationsTime: '',
  recommendedUserCount: 0,
  recommendationCount: 0
})

// 加载状态
const loading = reactive({
  similarities: false,
  preferences: false,
  recommendations: false,
  singleSimilarity: false,
  singlePreference: false,
  singleRecommendation: false,
  similarUsers: false
})

// 调度设置
const schedule = reactive({
  similarities: 'daily',
  preferences: 'daily',
  recommendations: 'daily'
})

const scheduleTime = reactive({
  similarities: '01:00',
  preferences: '02:00',
  recommendations: '03:00'
})

// 初始化页面加载系统状态
onMounted(async () => {
  await loadRecommendationStatus()
  await loadScheduleSettings()
})

// 加载推荐系统状态
const loadRecommendationStatus = async () => {
  try {
    // 这里应该调用API获取推荐系统状态
    // 由于API未提供，使用模拟数据
    setTimeout(() => {
      status.lastSimilaritiesTime = '2023-11-20 01:30:22'
      status.productCount = 1256
      status.similarityCount = 156800
      status.lastPreferencesTime = '2023-11-20 02:30:45'
      status.activeUserCount = 523
      status.preferenceCount = 12568
      status.lastRecommendationsTime = '2023-11-20 03:30:18'
      status.recommendedUserCount = 498
      status.recommendationCount = 4980
    }, 500)
  } catch (error) {
    console.error('加载推荐系统状态失败', error)
    ElMessage.error('加载推荐系统状态失败')
  }
}

// 加载调度设置
const loadScheduleSettings = async () => {
  try {
    // 这里应该调用API获取调度设置
    // 由于API未提供，使用默认值
  } catch (error) {
    console.error('加载调度设置失败', error)
    ElMessage.error('加载调度设置失败')
  }
}

// 计算所有商品相似度
const handleAllSimilarities = async () => {
  ElMessageBox.confirm(
    '计算所有商品相似度可能需要较长时间，确定要继续吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    loading.similarities = true
    try {
      const result = await adminStore.calculateAllSimilarities()
      ElMessage.success(`成功计算${result}个商品的相似度`)
      status.lastSimilaritiesTime = new Date().toLocaleString()
      status.similarityCount = result * (result - 1) / 2 // 估算相似记录数
    } catch (error) {
      console.error('计算商品相似度失败', error)
    } finally {
      loading.similarities = false
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 计算用户偏好
const handleUserPreferences = async () => {
  ElMessageBox.confirm(
    '计算用户偏好可能需要较长时间，确定要继续吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    loading.preferences = true
    try {
      const result = await adminStore.calculatePreferences()
      ElMessage.success(`成功更新${result}个用户的偏好记录`)
      status.lastPreferencesTime = new Date().toLocaleString()
      status.preferenceCount = result * 10 // 估算偏好记录数
    } catch (error) {
      console.error('计算用户偏好失败', error)
    } finally {
      loading.preferences = false
    }
  }).catch(() => {
    // 用户取消操作
  })
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

// 计算单个商品相似度
const handleSingleProductSimilarity = async () => {
  if (!singleProductId.value) return
  
  loading.singleSimilarity = true
  try {
    const result = await adminStore.calculateSimilaritiesForProduct(parseInt(singleProductId.value))
    ElMessage.success(`成功计算商品 ${singleProductId.value} 与其他 ${result} 个商品的相似度`)
  } catch (error) {
    console.error('计算单个商品相似度失败', error)
  } finally {
    loading.singleSimilarity = false
  }
}

// 计算单个用户偏好
const handleSingleUserPreference = async () => {
  if (!singleUserId.value) return
  
  loading.singlePreference = true
  try {
    await adminStore.calculatePreferences(parseInt(singleUserId.value))
    ElMessage.success(`成功更新用户 ${singleUserId.value} 的偏好记录`)
  } catch (error) {
    console.error('计算单个用户偏好失败', error)
  } finally {
    loading.singlePreference = false
  }
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

// 查询相似用户
const handleQuerySimilarUsers = async () => {
  if (!queryUserId.value) return
  
  loading.similarUsers = true
  queriedSimilarUsers.value = true
  similarUsers.value = []
  
  try {
    const result = await adminStore.fetchSimilarUsers(parseInt(queryUserId.value), similarLimit.value)
    
    // 处理结果
    if (result && result.length > 0) {
      similarUsers.value = result.map(user => ({
        ...user,
        // 添加一些示例数据，实际应该由API返回
        commonInterests: '电子产品, 户外装备, 家居用品',
        lastActivityTime: '2023-11-18 15:30:42'
      }))
    }
  } catch (error) {
    console.error('查询相似用户失败', error)
  } finally {
    loading.similarUsers = false
  }
}

// 获取相似度颜色
const getSimilarityColor = (similarity) => {
  if (similarity >= 0.8) return '#67C23A'
  if (similarity >= 0.5) return '#E6A23C'
  return '#909399'
}

// 保存调度设置
const saveSchedule = (type) => {
  const frequencyText = schedule[type] === 'daily' 
    ? '每天' 
    : schedule[type] === 'weekly'
      ? '每周'
      : schedule[type] === 'monthly'
        ? '每月'
        : '手动执行'
  
  const timeText = schedule[type] !== 'manual' ? `${scheduleTime[type]}` : ''
  
  const taskText = type === 'similarities' 
    ? '商品相似度计算' 
    : type === 'preferences'
      ? '用户偏好计算'
      : '推荐结果生成'
  
  ElMessage.success(`已将${taskText}设置为${frequencyText}${timeText ? ' ' + timeText : ''}`)
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
}

.status-row {
  margin-top: 15px;
}

.status-item {
  display: flex;
  margin-bottom: 10px;
}

.status-label {
  width: 160px;
  color: #606266;
  text-align: right;
  padding-right: 10px;
}

.status-value {
  font-weight: bold;
}

.tab-content {
  padding: 10px 0;
}

.similar-users-result {
  margin-top: 20px;
}

.schedule-desc {
  margin-bottom: 20px;
}

.schedule-row {
  margin-top: 15px;
}

.schedule-item {
  height: 100%;
}

.schedule-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #303133;
}

@media (max-width: 768px) {
  .el-row {
    display: block;
  }
  
  .el-col {
    width: 100% !important;
    margin-bottom: 15px;
  }
  
  .status-item {
    flex-direction: column;
  }
  
  .status-label {
    width: 100%;
    text-align: left;
  }
}
</style>
