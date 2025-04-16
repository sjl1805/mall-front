<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { ElMessage, ElLoading } from 'element-plus'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
// 导入Element Plus图标
import { 
  User as IconUser, 
  List as IconList, 
  Goods as IconGoods, 
  Menu as IconMenu,
  Star as IconStar,
  Plus as IconPlus,
  Money as IconMoney
} from '@element-plus/icons-vue'

// 注册必须的 ECharts 组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  BarChart,
  LineChart,
  PieChart,
  CanvasRenderer
])

const router = useRouter()
const adminStore = useAdminStore()
const userStore = useUserStore()

// 统计数据
const dashboardData = ref(null)
const userStatistics = ref(null)
const orderStatistics = ref(null)
const orderStatusDistribution = ref(null)
const loading = ref(false)

// 图表实例引用
const orderTrendChart = ref(null)
const orderStatusChart = ref(null)
const userGrowthChart = ref(null)

// 图表实例
const chartInstances = {
  orderTrend: null,
  orderStatus: null,
  userGrowth: null
}

// 监听窗口大小变化，重绘图表
const handleResize = () => {
  Object.values(chartInstances).forEach(chart => {
    if (chart) {
      chart.resize()
    }
  })
}

// 加载统计数据
const loadStatistics = async () => {
  loading.value = true
  try {
    // 优先加载仪表盘综合数据
    dashboardData.value = await adminStore.fetchDashboardSummary()
    
    // 并行请求其他必要的统计数据
    const [statusDist, salesTrend] = await Promise.all([
      adminStore.fetchOrderStatusDistribution(),
      adminStore.fetchSalesTrend(7)
    ])
    
    orderStatusDistribution.value = statusDist
    
    // 如果仪表盘数据中缺少某些信息，再请求特定的统计数据
    if (!dashboardData.value?.user) {
      userStatistics.value = await adminStore.fetchUserStatistics()
    } else {
      userStatistics.value = {
        totalUsers: dashboardData.value.user.total,
        todayNewUsers: dashboardData.value.user.today,
        activeUsers: dashboardData.value.user.active,
        dailyRegistrations: []  // 如果需要图表数据，可能还需要单独请求
      }
      
      // 获取用户注册趋势数据用于图表
      const dailyUserRegistrations = await adminStore.fetchDailyUserRegistrations(7)
      if (userStatistics.value) {
        userStatistics.value.dailyRegistrations = dailyUserRegistrations
      }
    }
    
    if (!dashboardData.value?.order || !dashboardData.value?.sales || !dashboardData.value?.product) {
      orderStatistics.value = await adminStore.fetchOrderStatistics()
    } else {
      orderStatistics.value = {
        totalOrders: dashboardData.value.order.total,
        todayOrders: dashboardData.value.order.today,
        pendingOrders: dashboardData.value.order.pending,
        totalSales: dashboardData.value.sales.total,
        todaySales: dashboardData.value.sales.today,
        totalProducts: dashboardData.value.product.total,
        soldProducts: dashboardData.value.product.active,
        lowStockProducts: dashboardData.value.product.lowStock,
        newReviews: dashboardData.value?.newReviews || 0
      }
    }
    
    // 确保DOM已渲染后初始化图表
    await nextTick()
    initCharts()
  } catch (error) {
    console.error('加载统计数据失败', error)
    ElMessage.error('加载统计数据失败')
    
    // 如果综合接口失败，单独请求各数据源
    try {
      const [userStats, orderStats, statusDist] = await Promise.all([
        adminStore.fetchUserStatistics(),
        adminStore.fetchOrderStatistics(),
        adminStore.fetchOrderStatusDistribution()
      ])
      
      userStatistics.value = userStats
      orderStatistics.value = orderStats
      orderStatusDistribution.value = statusDist
      
      await adminStore.fetchSalesTrend(7)
      
      // 确保DOM已渲染后初始化图表
      await nextTick()
      initCharts()
    } catch (fallbackError) {
      console.error('备用统计数据加载失败', fallbackError)
    }
  } finally {
    loading.value = false
  }
}

// 初始化所有图表
const initCharts = () => {
  // 销毁之前的图表实例（如果有的话）
  Object.values(chartInstances).forEach(chart => {
    if (chart) {
      chart.dispose()
    }
  })
  
  // 使用setTimeout确保DOM元素已完全渲染
  setTimeout(() => {
    initOrderTrendChart()
    initOrderStatusChart()
    initUserGrowthChart()
    
    // 绑定窗口大小变化事件
    window.removeEventListener('resize', handleResize)
    window.addEventListener('resize', handleResize)
  }, 300)
}

// 初始化订单趋势图表
const initOrderTrendChart = () => {
  if (!orderTrendChart.value) {
    console.warn('订单趋势图表DOM元素不存在')
    return
  }
  
  // 确保DOM元素有宽高
  if (orderTrendChart.value.clientWidth === 0 || orderTrendChart.value.clientHeight === 0) {
    console.warn('订单趋势图表DOM元素宽高为0，延迟初始化')
    setTimeout(initOrderTrendChart, 300)
    return
  }
  
  // 创建图表实例
  chartInstances.orderTrend = echarts.init(orderTrendChart.value)
  
  // 使用销售趋势数据
  const salesTrendData = adminStore.salesTrend || []
  const dailyOrders = orderStatistics.value?.dailyOrders || []
  
  const option = {
    title: {
      text: '近7天订单趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: salesTrendData && salesTrendData.length > 0 
        ? salesTrendData.map(item => item.date || '')
        : dailyOrders.map(item => item.date || '')
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '订单数量',
        type: 'line',
        data: salesTrendData && salesTrendData.length > 0
          ? salesTrendData.map(item => item.orders || 0)
          : dailyOrders.map(item => item.count || 0),
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        }
      },
      {
        name: '销售额',
        type: 'line',
        data: salesTrendData && salesTrendData.length > 0
          ? salesTrendData.map(item => item.sales || 0)
          : dailyOrders.map(item => item.amount || 0),
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#67C23A'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
            ]
          }
        }
      }
    ]
  }
  
  chartInstances.orderTrend.setOption(option)
}

// 初始化订单状态分布图表
const initOrderStatusChart = () => {
  if (!orderStatusChart.value || !orderStatusDistribution.value) {
    console.warn('订单状态图表DOM元素不存在或数据为空')
    return
  }
  
  // 确保DOM元素有宽高
  if (orderStatusChart.value.clientWidth === 0 || orderStatusChart.value.clientHeight === 0) {
    console.warn('订单状态图表DOM元素宽高为0，延迟初始化')
    setTimeout(initOrderStatusChart, 300)
    return
  }
  
  // 创建图表实例
  chartInstances.orderStatus = echarts.init(orderStatusChart.value)
  
  // 确保orderStatusDistribution是数组
  const distributionData = Array.isArray(orderStatusDistribution.value) 
    ? orderStatusDistribution.value 
    : []
  
  const option = {
    title: {
      text: '订单状态分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: distributionData.map(item => ({
          name: item.statusName || '未知状态',
          value: item.count || 0
        }))
      }
    ]
  }
  
  chartInstances.orderStatus.setOption(option)
}

// 初始化用户增长图表
const initUserGrowthChart = () => {
  if (!userGrowthChart.value || !userStatistics.value) {
    console.warn('用户增长图表DOM元素不存在或数据为空')
    return
  }
  
  // 确保DOM元素有宽高
  if (userGrowthChart.value.clientWidth === 0 || userGrowthChart.value.clientHeight === 0) {
    console.warn('用户增长图表DOM元素宽高为0，延迟初始化')
    setTimeout(initUserGrowthChart, 300)
    return
  }
  
  // 创建图表实例
  chartInstances.userGrowth = echarts.init(userGrowthChart.value)
  
  // 获取每日用户注册数据
  const dailyRegistrationsData = userStatistics.value.dailyRegistrations || []
  
  // 转换为数组格式，以便于 ECharts 使用
  const dates = []
  const counts = []
  
  // 如果是对象格式，转换为数组
  if (typeof dailyRegistrationsData === 'object' && !Array.isArray(dailyRegistrationsData)) {
    for (const date in dailyRegistrationsData) {
      if (Object.prototype.hasOwnProperty.call(dailyRegistrationsData, date)) {
        dates.push(date)
        counts.push(dailyRegistrationsData[date])
      }
    }
    // 按日期排序
    const sortedIndices = dates.map((date, index) => index)
      .sort((a, b) => new Date(dates[a]) - new Date(dates[b]))
    
    dates.length = 0
    counts.length = 0
    
    for (const index of sortedIndices) {
      dates.push(Object.keys(dailyRegistrationsData)[index])
      counts.push(Object.values(dailyRegistrationsData)[index])
    }
  } else {
    // 如果已经是数组格式，直接使用
    const dailyRegistrations = Array.isArray(dailyRegistrationsData) 
      ? dailyRegistrationsData 
      : []
      
    for (const item of dailyRegistrations) {
      dates.push(item.date || '')
      counts.push(item.count || 0)
    }
  }
  
  const option = {
    title: {
      text: '用户增长趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增用户',
        type: 'bar',
        data: counts,
        itemStyle: {
          color: '#E6A23C'
        }
      }
    ]
  }
  
  chartInstances.userGrowth.setOption(option)
}

// 导航到指定路径
const navigateTo = (path) => {
  router.push(path)
}

// 组件销毁时清理资源
const onUnmounted = () => {
  // 销毁所有图表实例
  Object.values(chartInstances).forEach(chart => {
    if (chart) {
      chart.dispose()
    }
  })
  
  // 移除事件监听器
  window.removeEventListener('resize', handleResize)
}

// 在组件挂载后获取统计数据并初始化图表
onMounted(async () => {
  // 加载数据，图表初始化放在loadStatistics中进行
  await loadStatistics()
})
</script>

<template>
  <div class="dashboard-container">
    <div class="page-header">
      <h2 class="page-title">控制面板</h2>
      <div class="welcome-message">
        欢迎回来，{{ userStore.nickname }}
        <span class="user-role">{{ userStore.isAdmin ? '管理员' : '用户' }}</span>
      </div>
    </div>

    <!-- 加载指示器 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <template v-else>
      <!-- 数据概览卡片 -->
      <el-row :gutter="20" class="data-overview">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="data-card">
            <div class="data-icon user-icon">
              <el-icon><icon-user /></el-icon>
            </div>
            <div class="data-info">
              <div class="data-title">用户总数</div>
              <div class="data-value">{{ dashboardData?.user?.total || userStatistics?.totalUsers || '0' }}</div>
              <div class="data-desc">今日新增 {{ dashboardData?.user?.today || userStatistics?.todayNewUsers || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="data-card">
            <div class="data-icon order-icon">
              <el-icon><icon-list /></el-icon>
            </div>
            <div class="data-info">
              <div class="data-title">订单总数</div>
              <div class="data-value">{{ dashboardData?.order?.total || orderStatistics?.totalOrders || '0' }}</div>
              <div class="data-desc">今日订单 {{ dashboardData?.order?.today || orderStatistics?.todayOrders || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="data-card">
            <div class="data-icon sales-icon">
              <el-icon><icon-money /></el-icon>
            </div>
            <div class="data-info">
              <div class="data-title">销售总额</div>
              <div class="data-value">¥{{ (dashboardData?.sales?.total || orderStatistics?.totalSales || 0).toFixed(2) }}</div>
              <div class="data-desc">今日销售 ¥{{ (dashboardData?.sales?.today || orderStatistics?.todaySales || 0).toFixed(2) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="data-card">
            <div class="data-icon product-icon">
              <el-icon><icon-goods /></el-icon>
            </div>
            <div class="data-info">
              <div class="data-title">商品总数</div>
              <div class="data-value">{{ dashboardData?.product?.total || orderStatistics?.totalProducts || '0' }}</div>
              <div class="data-desc">已售 {{ dashboardData?.product?.active || orderStatistics?.soldProducts || 0 }} 件</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="20" class="chart-section">
        <el-col :xs="24" :lg="16">
          <el-card shadow="hover" class="chart-card">
            <div ref="orderTrendChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="8">
          <el-card shadow="hover" class="chart-card">
            <div ref="orderStatusChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="chart-section">
        <el-col :xs="24" :md="12">
          <el-card shadow="hover" class="chart-card">
            <div ref="userGrowthChart" class="chart"></div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :md="12">
          <el-card shadow="hover" class="quick-actions">
            <template #header>
              <div class="card-header">
                <h3>快捷操作</h3>
              </div>
            </template>
            
            <div class="action-grid">
              <div class="action-item" @click="navigateTo('/admin/products')">
                <el-icon><icon-goods /></el-icon>
                <span>商品管理</span>
              </div>
              <div class="action-item" @click="navigateTo('/admin/orders')">
                <el-icon><icon-list /></el-icon>
                <span>订单管理</span>
              </div>
              <div class="action-item" @click="navigateTo('/admin/users')">
                <el-icon><icon-user /></el-icon>
                <span>用户管理</span>
              </div>
              <div class="action-item" @click="navigateTo('/admin/categories')">
                <el-icon><icon-menu /></el-icon>
                <span>分类管理</span>
              </div>
              <div class="action-item" @click="navigateTo('/admin/recommendation')">
                <el-icon><icon-star /></el-icon>
                <span>推荐管理</span>
              </div>
              <div class="action-item" @click="navigateTo('/admin/product/add')">
                <el-icon><icon-plus /></el-icon>
                <span>添加商品</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 待处理任务 -->
      <el-row :gutter="20" class="task-section">
        <el-col :xs="24">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <h3>待处理任务</h3>
              </div>
            </template>
            
            <el-table :data="[
              { 
                id: 1, 
                type: '订单', 
                count: dashboardData?.order?.pending || adminStore.dashboardSummary?.pendingDeliveries || orderStatistics?.pendingOrders || 0, 
                desc: '待发货订单' 
              },
              { 
                id: 2, 
                type: '商品', 
                count: dashboardData?.product?.lowStock || adminStore.dashboardSummary?.lowStockProducts || orderStatistics?.lowStockProducts || 0, 
                desc: '库存不足商品' 
              },
              { 
                id: 3, 
                type: '评价', 
                count: dashboardData?.newReviews || adminStore.dashboardSummary?.newReviews || orderStatistics?.newReviews || 0, 
                desc: '新增商品评价' 
              }
            ]" style="width: 100%">
              <el-table-column prop="type" label="类型" width="180" />
              <el-table-column prop="count" label="数量" width="180" />
              <el-table-column prop="desc" label="描述" />
              <el-table-column fixed="right" label="操作" width="120">
                <template #default="scope">
                  <el-button link type="primary" size="small" @click="navigateTo(
                    scope.row.type === '订单' ? '/admin/orders' : 
                    scope.row.type === '商品' ? '/admin/products' : 
                    '/admin/reviews'
                  )">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 刷新按钮 -->
    <el-button 
      class="refresh-button" 
      circle 
      type="primary" 
      icon="Refresh" 
      title="刷新数据"
      :loading="loading"
      @click="loadStatistics"
    ></el-button>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 20px;
  position: relative;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 24px;
  color: #303133;
  margin: 0;
}

.welcome-message {
  font-size: 16px;
  color: #606266;
}

.user-role {
  background-color: #ecf5ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 14px;
  margin-left: 10px;
}

.data-overview {
  margin-bottom: 20px;
}

.data-card {
  display: flex;
  align-items: center;
  height: 100px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
}

.data-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.data-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
}

.data-icon svg {
  font-size: 32px;
  color: white;
}

.user-icon {
  background-color: #409eff;
}

.order-icon {
  background-color: #67c23a;
}

.sales-icon {
  background-color: #e6a23c;
}

.product-icon {
  background-color: #f56c6c;
}

.data-info {
  flex: 1;
}

.data-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.data-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.data-desc {
  font-size: 12px;
  color: #909399;
}

.chart-section {
  margin-bottom: 20px;
}

.chart-card {
  height: 350px;
  position: relative;
}

.chart {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.quick-actions {
  height: 350px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px 0;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-item:hover {
  background-color: #ecf5ff;
  transform: translateY(-3px);
}

.action-item svg {
  font-size: 28px;
  color: #409eff;
  margin-bottom: 8px;
}

.action-item span {
  font-size: 14px;
  color: #606266;
}

.task-section {
  margin-bottom: 20px;
}

.loading-container {
  padding: 20px;
}

.refresh-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

@media (max-width: 768px) {
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .welcome-message {
    margin-top: 10px;
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 