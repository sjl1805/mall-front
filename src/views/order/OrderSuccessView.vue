<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/order'
import { ElMessage, ElButton } from 'element-plus'
import { Check, ShoppingBag, CreditCard, Document, CircleCheck } from '@element-plus/icons-vue'

// 获取路由和store
const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

// 获取订单号
const orderNo = computed(() => route.query.orderNo)

// 状态
const loading = ref(false)
const order = ref(null)

// 格式化价格
const formatPrice = (price) => {
  if (!price) return '0.00'
  return parseFloat(price).toFixed(2)
}

// 跳转到订单详情
const goToOrderDetail = () => {
  if (orderNo.value) {
    router.push(`/order/detail/${orderNo.value}`)
  }
}

// 跳转到支付页面
const goToPayment = () => {
  if (orderNo.value) {
    router.push(`/order/pay/${orderNo.value}`)
  }
}

// 跳转到订单列表
const goToOrderList = () => {
  router.push('/user/orders')
}

// 继续购物
const continueShopping = () => {
  router.push('/products')
}

// 获取订单详情
const fetchOrderDetail = async () => {
  if (!orderNo.value) {
    return
  }
  
  loading.value = true
  try {
    const orderDetail = await orderStore.getOrderDetail(orderNo.value)
    if (orderDetail) {
      order.value = orderDetail
    }
  } catch (error) {
    console.error('获取订单详情失败', error)
  } finally {
    loading.value = false
  }
}

// 初始化页面
onMounted(async () => {
  if (!orderNo.value) {
    ElMessage.warning('订单号不存在')
    router.push('/user/orders')
    return
  }
  
  await fetchOrderDetail()
})
</script>

<template>
  <div class="order-success">
    <div class="success-header">
      <el-icon class="success-icon"><Check /></el-icon>
      <h1>订单提交成功</h1>
      <p>您的订单已成功提交，我们会尽快为您处理</p>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <!-- 订单信息 -->
    <div class="order-info" v-else-if="order">
      <el-card class="order-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h2>
              <el-icon><Document /></el-icon>
              订单信息
            </h2>
          </div>
        </template>
        
        <div class="order-info">
          <div class="info-item">
            <span class="info-label">订单编号：</span>
            <span class="info-value">{{ order.orderNo }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">订单金额：</span>
            <span class="info-value price">¥{{ formatPrice(order.payAmount) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">收货人：</span>
            <span class="info-value">{{ order.receiverName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系电话：</span>
            <span class="info-value">{{ order.receiverPhone }}</span>
          </div>
          <div class="info-item address">
            <span class="info-label">收货地址：</span>
            <span class="info-value">{{ order.receiverProvince }} {{ order.receiverCity }} {{ order.receiverDistrict }} {{ order.receiverAddress }}</span>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button type="primary" @click="goToPayment" :disabled="!order">
        <el-icon><CreditCard /></el-icon> 立即支付
      </el-button>
      <el-button @click="goToOrderDetail" :disabled="!order">
        <el-icon><Document /></el-icon> 查看订单详情
      </el-button>
      <el-button @click="goToOrderList">
        <el-icon><Document /></el-icon> 查看全部订单
      </el-button>
      <el-button @click="continueShopping">
        <el-icon><ShoppingBag /></el-icon> 继续购物
      </el-button>
    </div>
    
    <!-- 温馨提示 -->
    <div class="tips">
      <h3>温馨提示：</h3>
      <p>1. 请在24小时内完成支付，否则订单将自动取消。</p>
      <p>2. 如果您有任何问题，请联系客服400-888-8888。</p>
    </div>
  </div>
</template>

<style scoped>
.order-success {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.success-header {
  text-align: center;
  margin-bottom: 40px;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background-color: #52c41a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  font-size: 40px;
  color: white;
}

.success-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin: 0 0 15px;
}

.success-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.loading-container {
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.order-info-card {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  line-height: 1.5;
}

.info-item.address {
  grid-column: span 2;
}

.info-label {
  color: #666;
  width: 100px;
  flex-shrink: 0;
}

.info-value {
  color: #333;
}

.info-value.price {
  color: #ff4d4f;
  font-weight: bold;
}

.actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 40px;
}

.tips {
  background-color: #fff7e6;
  border-radius: 8px;
  padding: 20px;
  color: #fa8c16;
}

.tips h3 {
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 10px;
}

.tips p {
  margin: 5px 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .order-info {
    grid-template-columns: 1fr;
  }
  
  .info-item.address {
    grid-column: 1;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .actions .el-button {
    width: 100%;
  }
}
</style> 