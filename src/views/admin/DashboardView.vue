<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { useUserStore } from '@/stores/user'
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

// 图表实例
const chartInstances = {
  orderTrend: null,
  orderStatus: null
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
        activeUsers: dashboardData.value.user.active
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
    legend: {
      data: ['订单数量', '销售额'],
      bottom: 10
    },
    xAxis: {
      type: 'category',
      data: salesTrendData && salesTrendData.length > 0 
        ? salesTrendData.map(item => item.date || '')
        : dailyOrders.map(item => item.date || '')
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数量',
        position: 'left',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#409EFF'
          }
        },
        axisLabel: {
          formatter: '{value} 单'
        }
      },
      {
        type: 'value',
        name: '销售额',
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#67C23A'
          }
        },
        axisLabel: {
          formatter: '¥{value}'
        }
      }
    ],
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
        yAxisIndex: 1,
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
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  min-height: calc(100vh - 60px);
  border-radius: 8px;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 28px;
  color: #303133;
  margin: 0;
  font-weight: 600;
  position: relative;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 40px;
  height: 4px;
  background: #409eff;
  border-radius: 2px;
}

.welcome-message {
  font-size: 16px;
  color: #606266;
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(5px);
}

.user-role {
  background: linear-gradient(135deg, #409eff 0%, #64b5f6 100%);
  color: white;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 14px;
  margin-left: 10px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.data-overview {
  margin-bottom: 24px;
}

.data-card {
  display: flex;
  align-items: center;
  height: 120px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.data-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important;
}

.data-icon {
  width: 70px;
  height: 70px;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 20px;
  margin-left: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.data-card:hover .data-icon {
  transform: scale(1.1) rotate(5deg);
}

.data-icon svg {
  font-size: 32px;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.user-icon {
  background: linear-gradient(135deg, #409eff 0%, #64b5f6 100%);
}

.order-icon {
  background: linear-gradient(135deg, #67c23a 0%, #95d475 100%);
}

.sales-icon {
  background: linear-gradient(135deg, #e6a23c 0%, #f3d19e 100%);
}

.product-icon {
  background: linear-gradient(135deg, #f56c6c 0%, #f89898 100%);
}

.data-info {
  flex: 1;
  padding-right: 16px;
}

.data-title {
  font-size: 15px;
  color: #909399;
  margin-bottom: 10px;
  font-weight: 500;
}

.data-value {
  font-size: 26px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 6px;
  background-image: linear-gradient(90deg, #303133, #606266);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.data-desc {
  font-size: 13px;
  color: #67c23a;
  background-color: rgba(103, 194, 58, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.chart-section {
  margin-bottom: 24px;
}

.chart-card {
  height: 380px;
  position: relative;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  transition: box-shadow 0.3s;
}

.chart-card:hover {
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important;
}

.chart {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px;
}

.loading-container {
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  backdrop-filter: blur(5px);
}

.refresh-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
  z-index: 10;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff 0%, #64b5f6 100%);
  border: none;
  transition: all 0.3s;
}

.refresh-button:hover {
  transform: scale(1.1) rotate(30deg);
  box-shadow: 0 10px 20px rgba(64, 158, 255, 0.5);
}

@media (max-width: 768px) {
  .data-card {
    margin-bottom: 16px;
  }
  
  .chart-card {
    margin-bottom: 16px;
    height: 300px;
  }
}

@media (max-width: 576px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .welcome-message {
    margin-top: 16px;
    width: 100%;
  }
  
  .data-card {
    height: 100px;
  }
  
  .data-icon {
    width: 60px;
    height: 60px;
    margin-right: 12px;
  }
  
  .data-value {
    font-size: 22px;
  }
}
</style> 