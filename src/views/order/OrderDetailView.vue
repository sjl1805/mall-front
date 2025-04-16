<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore, OrderStatus, PayType } from '@/stores/order'
import { useFileStore } from '@/stores/file'
import { ElMessageBox, ElMessage } from 'element-plus'
import { 
  Van as Truck,
  Document,
  Location,
  CreditCard,
  ShoppingBag
} from '@element-plus/icons-vue'

// 获取 store 和路由
const orderStore = useOrderStore()
const fileStore = useFileStore()
const route = useRoute()
const router = useRouter()

// 获取订单号
const orderNo = computed(() => route.params.orderNo)

// 订单状态
const loading = ref(false)
const order = computed(() => orderStore.currentOrder)

// 获取图片 URL
const getImageUrl = (imageUrl) => {
  return fileStore.getPreviewUrl(imageUrl)
}

// 格式化价格
const formatPrice = (price) => {
  if (price === undefined || price === null) return '0.00'
  return parseFloat(price).toFixed(2)
}

// 获取订单状态文本
const getStatusText = (status) => {
  return orderStore.getOrderStatusText(status)
}

// 获取支付方式文本
const getPayTypeText = (payType) => {
  return orderStore.getPayTypeText(payType)
}

// 获取订单状态对应的类型
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

// 格式化时间
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 取消订单
const cancelOrder = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要取消该订单吗？',
      '取消订单',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await orderStore.cancelOrder(orderNo.value)
    if (result) {
      ElMessage.success('订单已取消')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消订单失败', error)
    }
  }
}

// 支付订单
const payOrder = () => {
  router.push(`/order/pay/${orderNo.value}`)
}

// 确认收货
const confirmReceipt = async () => {
  try {
    await ElMessageBox.confirm(
      '确定已收到商品吗？',
      '确认收货',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await orderStore.confirmReceipt(orderNo.value)
    if (result) {
      ElMessage.success('已确认收货')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('确认收货失败', error)
    }
  }
}

// 删除订单
const deleteOrder = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该订单吗？订单删除后不可恢复。',
      '删除订单',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }
    )
    
    const result = await orderStore.deleteOrder(orderNo.value)
    if (result) {
      ElMessage.success('订单已删除')
      router.push('/user/orders')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除订单失败', error)
    }
  }
}

// 返回订单列表
const goToOrderList = () => {
  router.push('/user/orders')
}

// 加载订单详情
const loadOrderDetail = async () => {
  loading.value = true
  try {
    await orderStore.getOrderDetail(orderNo.value)
  } catch (error) {
    console.error('获取订单详情失败', error)
  } finally {
    loading.value = false
  }
}

// 初始化页面
onMounted(() => {
  loadOrderDetail()
})
</script>

<template>
  <div class="order-detail-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">订单详情</h1>
        <el-tag 
          v-if="order" 
          :type="getStatusType(order.status)" 
          class="status-tag"
        >
          {{ getStatusText(order.status) }}
        </el-tag>
      </div>
      <div class="header-right">
        <el-button @click="goToOrderList">返回订单列表</el-button>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <!-- 订单不存在 -->
    <div v-else-if="!order" class="empty-order">
      <el-empty description="订单不存在或已被删除">
        <el-button type="primary" @click="goToOrderList">返回订单列表</el-button>
      </el-empty>
    </div>
    
    <!-- 订单详情 -->
    <template v-else>
      <!-- 订单基本信息 -->
      <el-card class="order-info-section">
        <template #header>
          <div class="section-header">
            <h2>
              <el-icon><Document /></el-icon>
              订单信息
            </h2>
          </div>
        </template>
        
        <div class="order-info-content">
          <div class="info-item">
            <span class="info-label">订单编号：</span>
            <span class="info-value">{{ order.orderNo }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">下单时间：</span>
            <span class="info-value">{{ formatDate(order.createTime) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">订单状态：</span>
            <span class="info-value">{{ getStatusText(order.status) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">支付方式：</span>
            <span class="info-value">{{ getPayTypeText(order.payType) }}</span>
          </div>
          <div v-if="order.payTime" class="info-item">
            <span class="info-label">支付时间：</span>
            <span class="info-value">{{ formatDate(order.payTime) }}</span>
          </div>
          <div v-if="order.shippingTime" class="info-item">
            <span class="info-label">发货时间：</span>
            <span class="info-value">{{ formatDate(order.shippingTime) }}</span>
          </div>
          <div v-if="order.receiveTime" class="info-item">
            <span class="info-label">收货时间：</span>
            <span class="info-value">{{ formatDate(order.receiveTime) }}</span>
          </div>
          <div v-if="order.note" class="info-item">
            <span class="info-label">订单备注：</span>
            <span class="info-value">{{ order.note }}</span>
          </div>
        </div>
      </el-card>
      
      <!-- 商品信息 -->
      <el-card class="product-section">
        <template #header>
          <div class="section-header">
            <h2>
              <el-icon><ShoppingBag /></el-icon>
              商品信息
            </h2>
          </div>
        </template>
        
        <div class="product-list">
          <el-table :data="order.orderItems" style="width: 100%">
            <el-table-column label="商品" min-width="400">
              <template #default="{ row }">
                <div class="product-info">
                  <div class="product-image">
                    <img :src="getImageUrl(row.productImage)" :alt="row.productName">
                  </div>
                  <div class="product-detail">
                    <h3 class="product-name">{{ row.productName }}</h3>
                    <p v-if="row.productAttr" class="product-attr">{{ row.productAttr }}</p>
                  </div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column label="单价" width="120">
              <template #default="{ row }">
                <div class="product-price">¥{{ formatPrice(row.price) }}</div>
              </template>
            </el-table-column>
            
            <el-table-column label="数量" width="100">
              <template #default="{ row }">
                <div>{{ row.quantity }}</div>
              </template>
            </el-table-column>
            
            <el-table-column label="小计" width="120">
              <template #default="{ row }">
                <div class="product-subtotal">¥{{ formatPrice(row.totalPrice) }}</div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
      
      <!-- 物流信息 -->
      <el-card class="shipping-section" v-if="order.status !== OrderStatus.PENDING_PAYMENT && order.status !== OrderStatus.CANCELLED">
        <template #header>
          <div class="section-header">
            <h2>
              <el-icon><Truck /></el-icon>
              物流信息
            </h2>
          </div>
        </template>
        
        <div class="shipping-content">
          <div v-if="order.shippingName && order.shippingCode" class="shipping-info">
            <div class="info-item">
              <span class="info-label">物流公司：</span>
              <span class="info-value">{{ order.shippingName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">物流单号：</span>
              <span class="info-value">{{ order.shippingCode }}</span>
            </div>
          </div>
          <div v-else class="empty-shipping">
            <p v-if="order.status === OrderStatus.PENDING_SHIPPING">商家正在备货中，请耐心等待...</p>
            <p v-else>暂无物流信息</p>
          </div>
        </div>
      </el-card>
      
      <!-- 收货地址 -->
      <el-card class="address-section">
        <template #header>
          <div class="section-header">
            <h2>
              <el-icon><Location /></el-icon>
              收货信息
            </h2>
          </div>
        </template>
        
        <div class="address-content">
          <div class="info-item">
            <span class="info-label">收货人：</span>
            <span class="info-value">{{ order.receiverName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系电话：</span>
            <span class="info-value">{{ order.receiverPhone }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">收货地址：</span>
            <span class="info-value">{{ order.receiverProvince }} {{ order.receiverCity }} {{ order.receiverDistrict }} {{ order.receiverAddress }}</span>
          </div>
        </div>
      </el-card>
      
      <!-- 金额信息 -->
      <el-card class="amount-section">
        <template #header>
          <div class="section-header">
            <h2>
              <el-icon><CreditCard /></el-icon>
              金额信息
            </h2>
          </div>
        </template>
        
        <div class="amount-content">
          <div class="amount-item">
            <span class="amount-label">商品金额：</span>
            <span class="amount-value">¥{{ formatPrice(order.totalAmount) }}</span>
          </div>
          <div class="amount-item">
            <span class="amount-label">运费：</span>
            <span class="amount-value">¥{{ formatPrice(order.shippingAmount) }}</span>
          </div>
          <div class="amount-item">
            <span class="amount-label">优惠金额：</span>
            <span class="amount-value">-¥{{ formatPrice(order.discountAmount) }}</span>
          </div>
          <div class="amount-item total">
            <span class="amount-label">实付金额：</span>
            <span class="amount-value total-amount">¥{{ formatPrice(order.payAmount) }}</span>
          </div>
        </div>
      </el-card>
      
      <!-- 操作按钮 -->
      <div class="order-actions">
        <template v-if="order.status === OrderStatus.PENDING_PAYMENT">
          <el-button type="primary" @click="payOrder">去支付</el-button>
          <el-button @click="cancelOrder">取消订单</el-button>
        </template>
        
        <template v-if="order.status === OrderStatus.PENDING_RECEIPT">
          <el-button type="primary" @click="confirmReceipt">确认收货</el-button>
        </template>
        
        <template v-if="order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED">
          <el-button type="danger" @click="deleteOrder">删除订单</el-button>
        </template>
        
        <el-button @click="goToOrderList">返回订单列表</el-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.order-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.status-tag {
  font-size: 14px;
}

.loading-container {
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.empty-order {
  padding: 60px 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.section-header {
  display: flex;
  align-items: center;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-info-section,
.product-section,
.shipping-section,
.address-section,
.amount-section {
  margin-bottom: 20px;
}

/* 订单信息样式 */
.order-info-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.info-item {
  display: flex;
  line-height: 1.5;
}

.info-label {
  min-width: 90px;
  color: #666;
}

.info-value {
  color: #333;
}

/* 商品样式 */
.product-info {
  display: flex;
  align-items: center;
}

.product-image {
  width: 80px;
  height: 80px;
  overflow: hidden;
  margin-right: 15px;
  border-radius: 4px;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-detail {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 14px;
  margin: 0 0 5px 0;
  color: #333;
}

.product-attr {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.product-price {
  color: #ff4d4f;
  font-weight: bold;
}

.product-subtotal {
  color: #ff4d4f;
  font-weight: bold;
}

/* 物流信息样式 */
.shipping-content {
  padding: 10px 0;
}

.empty-shipping {
  color: #999;
  text-align: center;
  padding: 20px 0;
}

/* 金额信息样式 */
.amount-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.amount-item {
  display: flex;
  line-height: 2;
  min-width: 200px;
}

.amount-label {
  color: #666;
}

.amount-value {
  min-width: 100px;
  text-align: right;
  color: #333;
}

.total .amount-label {
  font-weight: bold;
}

.total-amount {
  color: #ff4d4f;
  font-weight: bold;
  font-size: 18px;
}

/* 操作按钮样式 */
.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
  margin-bottom: 50px;
}

@media (max-width: 768px) {
  .order-info-content {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-right {
    width: 100%;
  }
  
  .header-right .el-button {
    width: 100%;
  }
  
  .order-actions {
    flex-wrap: wrap;
  }
  
  .order-actions .el-button {
    flex: 1 0 calc(50% - 8px);
  }
}
</style> 