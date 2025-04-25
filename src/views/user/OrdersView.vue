<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOrderStore, OrderStatus } from '@/stores/order'
import { useFileStore } from '@/stores/file'
import { ElMessage, ElMessageBox } from 'element-plus'

// 引入图标
import {
  Document, 
  Delete, 
  CreditCard, 
  Van, 
  ShoppingBag, 
  Search, 
  Refresh, 
  CircleCheck, 
  CircleClose,
  Warning,
  Box,
  Ship,
  Star
} from '@element-plus/icons-vue'

const router = useRouter()
const orderStore = useOrderStore()
const fileStore = useFileStore()

// 订单列表
const orderList = computed(() => orderStore.orderList)
const loading = computed(() => orderStore.loading)
const total = computed(() => orderStore.total)
const currentPage = ref(1)
const pageSize = ref(5)
const currentTab = ref(null) // 当前选中的状态标签

// 统计数据
const orderCounts = computed(() => orderStore.orderCounts)

// 订单状态组
const orderStatusTabs = [
  { name: '全部订单', value: null },
  { name: '待付款', value: OrderStatus.PENDING_PAYMENT },
  { name: '待发货', value: OrderStatus.PENDING_SHIPPING },
  { name: '待收货', value: OrderStatus.PENDING_RECEIPT },
  { name: '已完成', value: OrderStatus.COMPLETED },
  { name: '已取消', value: OrderStatus.CANCELLED }
]

// 获取订单列表
const fetchOrders = async () => {
  await orderStore.fetchOrderList({
    status: currentTab.value,
    page: currentPage.value,
    size: pageSize.value
  })
}

// 获取订单状态文本
const getStatusText = (status) => {
  return orderStore.getOrderStatusText(status)
}

// 获取支付方式文本
const getPayTypeText = (payType) => {
  return orderStore.getPayTypeText(payType)
}

// 获取订单状态类型
const getStatusType = (status) => {
  switch (status) {
    case OrderStatus.PENDING_PAYMENT:
      return 'warning'
    case OrderStatus.PENDING_SHIPPING:
      return 'primary'
    case OrderStatus.PENDING_RECEIPT:
      return 'success'
    case OrderStatus.COMPLETED:
      return 'success'
    case OrderStatus.CANCELLED:
      return 'info'
    default:
      return 'info'
  }
}

// 获取订单状态图标
const getStatusIcon = (status) => {
  switch (status) {
    case OrderStatus.PENDING_PAYMENT:
      return Warning
    case OrderStatus.PENDING_SHIPPING:
      return Box
    case OrderStatus.PENDING_RECEIPT:
      return Ship
    case OrderStatus.COMPLETED:
      return CircleCheck
    case OrderStatus.CANCELLED:
      return CircleClose
    default:
      return Document
  }
}

// 获取商品图片URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '/images/default-product.png'
  return fileStore.getPreviewUrl(imageUrl)
}

// 格式化价格
const formatPrice = (price) => {
  if (price === undefined || price === null) return '0.00'
  return parseFloat(price).toFixed(2)
}

// 格式化时间
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour12: false })
}

// 切换标签
const handleTabChange = (tab) => {
  currentTab.value = tab
  currentPage.value = 1 // 切换标签时重置页码
  fetchOrders()
}

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchOrders()
}

// 每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchOrders()
}

// 查看订单详情
const viewOrderDetail = (orderNo) => {
  router.push(`/order/detail/${orderNo}`)
}

// 支付订单
const payOrder = (orderNo) => {
  router.push(`/order/pay/${orderNo}`)
}

// 取消订单
const cancelOrder = async (orderNo) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '取消订单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const result = await orderStore.cancelOrder(orderNo)
    if (result) {
      ElMessage.success('订单已取消')
    }
  } catch (error) {
    // 用户取消了操作，不做处理
  }
}

// 确认收货
const confirmReceipt = async (orderNo) => {
  try {
    await ElMessageBox.confirm('确定已收到商品吗？', '确认收货', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const result = await orderStore.confirmReceipt(orderNo)
    if (result) {
      ElMessage.success('已确认收货')
    }
  } catch (error) {
    // 用户取消了操作，不做处理
  }
}

// 删除订单
const deleteOrder = async (orderNo) => {
  try {
    await ElMessageBox.confirm('确定要删除该订单吗？订单删除后不可恢复。', '删除订单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    })
    const result = await orderStore.deleteOrder(orderNo)
    if (result) {
      ElMessage.success('订单已删除')
    }
  } catch (error) {
    // 用户取消了操作，不做处理
  }
}

// 去评价
const goToReview = (item) => {
  // 假设取第一个商品进行评价
  if (item.orderItems && item.orderItems.length > 0) {
    const productId = item.orderItems[0].productId
    router.push(`/review/add/${productId}`)
  }
}

// 刷新订单列表
const refreshOrders = () => {
  fetchOrders()
  orderStore.fetchOrderCounts()
}

// 刷新订单统计
const refreshOrderCounts = async () => {
  await orderStore.fetchOrderCounts()
}

// 监听当前标签变化，更新订单列表
watch(currentTab, (newVal) => {
  fetchOrders()
})

// 组件挂载时获取数据
onMounted(async () => {
  await refreshOrderCounts()
  fetchOrders()
})
</script>

<template>
  <div class="orders-container">
    <div class="page-header">
      <h2 class="page-title">我的订单</h2>
      <div class="page-actions">
        <el-button @click="refreshOrders" :icon="Refresh" circle title="刷新订单"></el-button>
      </div>
    </div>
    
    <!-- 订单状态统计卡片 -->
    <div class="order-stats">
      <div 
        v-for="tab in orderStatusTabs" 
        :key="tab.value"
        class="order-stat-item"
        :class="{ active: currentTab === tab.value }"
        @click="handleTabChange(tab.value)"
      >
        <div class="stat-top">
          <el-icon :size="24" class="status-icon" :class="'status-' + (tab.value || 'all')">
            <component :is="tab.value !== null ? getStatusIcon(tab.value) : Document" />
          </el-icon>
          <span class="stat-name">{{ tab.name }}</span>
        </div>
        <div class="stat-count">
          {{ tab.value === null ? 
              total : 
              (tab.value === OrderStatus.PENDING_PAYMENT ? orderCounts.pending_payment : 
              (tab.value === OrderStatus.PENDING_SHIPPING ? orderCounts.pending_shipping : 
              (tab.value === OrderStatus.PENDING_RECEIPT ? orderCounts.pending_receipt : 
              (tab.value === OrderStatus.COMPLETED ? orderCounts.completed : 
              (tab.value === OrderStatus.CANCELLED ? orderCounts.cancelled : 0))))) }}
        </div>
      </div>
    </div>
    
    <!-- 订单列表 -->
    <div class="orders-content" v-loading="loading">
      <!-- 空状态 -->
      <el-empty 
        v-if="orderList.length === 0" 
        description="暂无相关订单"
        :image-size="200"
      >
        <el-button type="primary" @click="router.push('/products')">去购物</el-button>
      </el-empty>
      
      <!-- 订单列表项 -->
      <div v-else class="order-list">
        <div v-for="item in orderList" :key="item.orderNo" class="order-item">
          <div class="order-header">
            <div class="order-header-left">
              <span class="order-number">订单号：{{ item.orderNo }}</span>
              <span class="order-time">下单时间：{{ formatDate(item.createTime) }}</span>
            </div>
            <div class="order-header-right">
              <el-tag :type="getStatusType(item.status)" effect="light" size="large">
                <el-icon class="status-tag-icon">
                  <component :is="getStatusIcon(item.status)" />
                </el-icon>
                {{ getStatusText(item.status) }}
              </el-tag>
            </div>
          </div>
          
          <div class="order-body" @click="viewOrderDetail(item.orderNo)">
            <div class="order-products">
              <!-- 订单商品列表 -->
              <div v-for="product in item.orderItems" :key="product.id" class="order-product">
                <div class="product-image">
                  <img :src="getImageUrl(product.productImage)" :alt="product.productName" @error="(e) => e.target.src = '/images/default-product.png'">
                </div>
                <div class="product-info">
                  <div class="product-name">{{ product.productName }}</div>
                  <div class="product-props">{{ product.productProps || '默认规格' }}</div>
                </div>
                <div class="product-quantity">x{{ product.quantity }}</div>
                <div class="product-price">¥{{ formatPrice(product.price) }}</div>
              </div>
            </div>
            
            <div class="order-summary">
              <div class="order-total">
                共 <span class="count">{{ item.totalQuantity }}</span> 件商品，
                总计：<span class="price">¥{{ formatPrice(item.totalAmount) }}</span>
                <span class="freight">(含运费: ¥{{ formatPrice(item.freight) }})</span>
              </div>
            </div>
          </div>
          
          <div class="order-footer">
            <div class="order-recipient">
              <span class="recipient-label">收货人：</span>
              <span class="recipient-name">{{ item.recipientName }}</span>
              <span class="recipient-phone">{{ item.recipientPhone }}</span>
            </div>
            <div class="order-actions">
              <!-- 待付款状态 -->
              <template v-if="item.status === OrderStatus.PENDING_PAYMENT">
                <el-button 
                  type="primary" 
                  @click="payOrder(item.orderNo)"
                  :icon="CreditCard"
                >
                  立即支付
                </el-button>
                <el-button 
                  @click="cancelOrder(item.orderNo)"
                  :icon="CircleClose"
                >
                  取消订单
                </el-button>
              </template>
              
              <!-- 待发货状态 -->
              <template v-else-if="item.status === OrderStatus.PENDING_SHIPPING">
                <el-button 
                  @click="viewOrderDetail(item.orderNo)"
                  :icon="Document"
                >
                  查看详情
                </el-button>
              </template>
              
              <!-- 待收货状态 -->
              <template v-else-if="item.status === OrderStatus.PENDING_RECEIPT">
                <el-button 
                  type="primary" 
                  @click="confirmReceipt(item.orderNo)"
                  :icon="CircleCheck"
                >
                  确认收货
                </el-button>
                <el-button 
                  @click="viewOrderDetail(item.orderNo)"
                  :icon="Document"
                >
                  查看详情
                </el-button>
              </template>
              
              <!-- 已完成状态 -->
              <template v-else-if="item.status === OrderStatus.COMPLETED">
                <el-button 
                  type="primary" 
                  @click="goToReview(item)"
                  :icon="Star"
                  v-if="!item.reviewed"
                >
                  去评价
                </el-button>
                <el-button 
                  @click="viewOrderDetail(item.orderNo)"
                  :icon="Document"
                >
                  查看详情
                </el-button>
                <el-button 
                  type="danger" 
                  @click="deleteOrder(item.orderNo)"
                  :icon="Delete"
                >
                  删除订单
                </el-button>
              </template>
              
              <!-- 已取消状态 -->
              <template v-else-if="item.status === OrderStatus.CANCELLED">
                <el-button 
                  @click="viewOrderDetail(item.orderNo)"
                  :icon="Document"
                >
                  查看详情
                </el-button>
                <el-button 
                  type="danger" 
                  @click="deleteOrder(item.orderNo)"
                  :icon="Delete"
                >
                  删除订单
                </el-button>
              </template>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-container {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 10px;
}

/* 订单状态统计 */
.order-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.order-stat-item {
  flex: 1;
  min-width: 120px;
  border-radius: 8px;
  padding: 15px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.order-stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.order-stat-item.active {
  border-color: var(--el-color-primary);
}

.stat-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.status-icon {
  padding: 8px;
  border-radius: 50%;
  color: #fff;
}

.status-all {
  background-color: #909399;
}

.status-0 {
  background-color: #e6a23c;
}

.status-1 {
  background-color: #409eff;
}

.status-2 {
  background-color: #67c23a;
}

.status-3 {
  background-color: #67c23a;
}

.status-4 {
  background-color: #909399;
}

.stat-name {
  font-size: 1rem;
  font-weight: 500;
}

.stat-count {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--el-color-primary);
  text-align: center;
}

/* 订单列表 */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-item {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.order-header-left {
  display: flex;
  gap: 15px;
}

.order-number {
  font-weight: bold;
}

.order-time {
  color: var(--el-text-color-secondary);
}

.status-tag-icon {
  margin-right: 5px;
}

.order-body {
  padding: 20px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.order-body:hover {
  background-color: #f5f7fa;
}

.order-products {
  margin-bottom: 15px;
}

.order-product {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dashed #ebeef5;
}

.order-product:last-child {
  border-bottom: none;
}

.product-image {
  width: 80px;
  height: 80px;
  margin-right: 15px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  flex: 1;
  overflow: hidden;
}

.product-name {
  font-size: 1rem;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-props {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

.product-quantity {
  margin: 0 20px;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.product-price {
  width: 100px;
  text-align: right;
  font-weight: bold;
  font-size: 1.1rem;
  color: #ff6b6b;
}

.order-summary {
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

.order-total {
  font-size: 0.9rem;
  color: var(--el-text-color-secondary);
}

.order-total .count {
  color: var(--el-color-danger);
  font-weight: bold;
}

.order-total .price {
  color: #ff6b6b;
  font-size: 1.2rem;
  font-weight: bold;
}

.order-total .freight {
  color: var(--el-text-color-secondary);
  font-size: 0.8rem;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f9f9f9;
  border-top: 1px solid #ebeef5;
}

.order-recipient {
  font-size: 0.9rem;
  color: var(--el-text-color-secondary);
}

.recipient-label {
  margin-right: 5px;
}

.recipient-name {
  margin-right: 10px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.order-actions {
  display: flex;
  gap: 10px;
}

/* 分页 */
.pagination-container {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .order-stats {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 10px;
  }
  
  .order-stat-item {
    min-width: 100px;
    flex: 0 0 auto;
  }
  
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .order-header-right {
    align-self: flex-end;
  }
  
  .order-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .order-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .product-image {
    width: 60px;
    height: 60px;
  }
  
  .product-price {
    width: 70px;
  }
}
</style> 