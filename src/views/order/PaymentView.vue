<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore, PayType } from '@/stores/order'
import { ElMessageBox, ElMessage } from 'element-plus'
import { CreditCard } from '@element-plus/icons-vue'
import QRCode from 'qrcode' // 使用更稳定的qrcode库

// 获取路由和store
const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

// 获取订单号
const orderNo = computed(() => route.params.orderNo)

// 状态
const loading = ref(false)
const submitting = ref(false)
const order = ref(null)
const selectedPayType = ref(PayType.ALIPAY) // 默认支付宝支付
const showPayCode = ref(false)
const paymentInfo = ref(null)
const qrCodeUrl = ref('') // 二维码图片URL

// 支付方式选项
const payTypeOptions = [
  {
    value: PayType.ALIPAY,
    label: '支付宝',
    icon: 'https://www.alipay.com/favicon.ico'
  },
  {
    value: PayType.WECHAT,
    label: '微信支付',
    icon: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico'
  }
]

// 获取支付方式名称
const getPayTypeName = (payType) => {
  const option = payTypeOptions.find(opt => opt.value === payType)
  return option ? option.label : '未知支付方式'
}

// 格式化价格
const formatPrice = (price) => {
  if (!price) return '0.00'
  return parseFloat(price).toFixed(2)
}

// 获取订单详情
const fetchOrderDetail = async () => {
  loading.value = true
  try {
    const orderDetail = await orderStore.getOrderDetail(orderNo.value)
    if (orderDetail) {
      order.value = orderDetail
      
      // 计算商品总数量
      if (orderDetail.orderItems) {
        order.value.totalQuantity = orderDetail.orderItems.reduce((sum, item) => sum + item.quantity, 0)
      }
      
      // 如果订单已经选择了支付方式，使用订单的支付方式
      if (order.value.payType) {
        selectedPayType.value = order.value.payType
      }
    }
  } catch (error) {
    console.error('获取订单详情失败', error)
  } finally {
    loading.value = false
  }
}

// 生成二维码
const generateQRCode = async () => {
  try {
    // 构建支付信息
    const payInfo = {
      orderNo: orderNo.value,
      amount: order.value.payAmount,
      payType: selectedPayType.value,
      timestamp: Date.now()
    }
    
    // 使用qrcode库生成二维码URL
    qrCodeUrl.value = await QRCode.toDataURL(JSON.stringify(payInfo), {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
  } catch (error) {
    console.error('生成二维码失败', error)
    ElMessage.error('生成支付二维码失败')
  }
}

// 提交支付
const submitPayment = async () => {
  if (!selectedPayType.value) {
    ElMessage.warning('请选择支付方式')
    return
  }
  
  submitting.value = true
  
  try {
    const result = await orderStore.payOrder(orderNo.value, selectedPayType.value)
    
    if (result) {
      // 添加模拟的交易号
      paymentInfo.value = {
        ...result,
        tradeNo: 'mock_' + Date.now() // 添加模拟的交易号
      }
      
      // 生成二维码
      await generateQRCode()
      
      // 显示二维码对话框
      showPayCode.value = true
      ElMessage.success('请扫描二维码完成支付')
    }
  } catch (error) {
    console.error('获取支付信息失败', error)
  } finally {
    submitting.value = false
  }
}

// 模拟支付完成
const simulatePaymentCompleted = async () => {
  if (!paymentInfo.value || !paymentInfo.value.tradeNo) {
    ElMessage.warning('支付信息不完整')
    return
  }
  
  submitting.value = true
  
  try {
    const result = await orderStore.handlePayCallback(orderNo.value, paymentInfo.value.tradeNo)
    
    if (result) {
      ElMessageBox.alert(
        '支付成功！感谢您的购买。',
        '支付完成',
        {
          confirmButtonText: '查看订单',
          callback: () => {
            router.push(`/order/detail/${orderNo.value}`)
          }
        }
      )
    } else {
      ElMessage.error('支付处理失败，请联系客服')
    }
  } catch (error) {
    console.error('处理支付回调失败', error)
  } finally {
    submitting.value = false
  }
}

// 取消支付
const cancelPayment = () => {
  showPayCode.value = false
  paymentInfo.value = null
  qrCodeUrl.value = ''
}

// 返回订单详情
const goToOrderDetail = () => {
  router.push(`/order/detail/${orderNo.value}`)
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
  <div class="payment-page">
    <h1 class="page-title">订单支付</h1>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <!-- 订单不存在 -->
    <div v-else-if="!order" class="empty-order">
      <el-empty description="订单不存在或已被删除">
        <el-button type="primary" @click="router.push('/user/orders')">返回订单列表</el-button>
      </el-empty>
    </div>
    
    <!-- 已支付 -->
    <div v-else-if="order.status !== 0" class="paid-container">
      <el-result
        icon="success"
        title="订单已支付"
        sub-title="您的订单已经支付完成，无需重复支付"
      >
        <template #extra>
          <el-button type="primary" @click="goToOrderDetail">查看订单详情</el-button>
        </template>
      </el-result>
    </div>
    
    <!-- 支付页面 -->
    <template v-else>
      <div class="payment-container">
        <!-- 订单信息 -->
        <el-card class="order-card">
          <template #header>
            <div class="card-header">
              <h2>订单信息</h2>
              <el-button 
                type="text"
                @click="goToOrderDetail"
              >
                查看详情
              </el-button>
            </div>
          </template>
          
          <div class="order-info">
            <div class="info-item">
              <span class="info-label">订单编号：</span>
              <span class="info-value">{{ order.orderNo }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">商品数量：</span>
              <span class="info-value">{{ order.totalQuantity || 0 }} 件</span>
            </div>
            <div class="info-item payment-amount">
              <span class="info-label">应付金额：</span>
              <span class="info-value price">¥{{ formatPrice(order.payAmount) }}</span>
            </div>
          </div>
        </el-card>
        
        <!-- 支付方式选择 -->
        <el-card class="payment-method-card">
          <template #header>
            <div class="card-header">
              <h2>
                <el-icon><CreditCard /></el-icon>
                选择支付方式
              </h2>
            </div>
          </template>
          
          <div class="payment-methods">
            <el-radio-group v-model="selectedPayType" class="payment-radio-group">
              <el-radio 
                v-for="option in payTypeOptions" 
                :key="option.value" 
                :label="option.value"
                class="payment-radio"
              >
                <div class="payment-option">
                  <img :src="option.icon" :alt="option.label" class="payment-icon">
                  <span>{{ option.label }}</span>
                </div>
              </el-radio>
            </el-radio-group>
          </div>
        </el-card>
        
        <!-- 提交按钮 -->
        <div class="payment-actions">
          <div class="payment-summary">
            <span>订单金额：</span>
            <span class="payment-price">¥{{ formatPrice(order.payAmount) }}</span>
          </div>
          <div class="payment-buttons">
            <el-button 
              @click="goToOrderDetail"
            >
              返回订单详情
            </el-button>
            <el-button 
              type="primary" 
              :loading="submitting" 
              @click="submitPayment"
            >
              立即支付
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 支付二维码弹窗 -->
      <el-dialog
        v-model="showPayCode"
        title="扫码支付"
        width="400px"
        :close-on-click-modal="false"
        :show-close="true"
      >
        <div class="payment-qrcode">
          <div class="qrcode-info">
            <p class="payment-type">{{ getPayTypeName(selectedPayType) }}</p>
            <p class="payment-amount">¥{{ formatPrice(order.payAmount) }}</p>
          </div>
          
          <div class="qrcode-image">
            <!-- 二维码图片 -->
            <div class="qrcode-container">
              <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="支付二维码" class="qrcode-img" />
              <div v-else class="qrcode-loading">
                <el-skeleton :rows="3" animated />
              </div>
            </div>
          </div>
          
          <div class="qrcode-footer">
            <p>请使用{{ getPayTypeName(selectedPayType) }}扫描二维码完成支付</p>
            <p class="qrcode-order-no">订单号: {{ orderNo }}</p>
          </div>
        </div>
        
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="cancelPayment">取消支付</el-button>
            <el-button type="primary" @click="simulatePaymentCompleted">
              模拟支付完成
            </el-button>
          </span>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<style scoped>
.payment-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.loading-container {
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.empty-order,
.paid-container {
  padding: 60px 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.order-card,
.payment-method-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
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
  gap: 15px;
}

.info-item {
  display: flex;
  line-height: 1.5;
}

.info-item.payment-amount {
  grid-column: span 2;
  padding-top: 10px;
  border-top: 1px dashed #eee;
  margin-top: 10px;
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
  font-size: 20px;
}

.payment-methods {
  padding: 10px 0;
}

.payment-radio-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.payment-radio {
  height: auto;
  margin-right: 0;
}

.payment-option {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-top: 5px;
  transition: all 0.3s;
}

.payment-option:hover {
  background-color: #f5f7fa;
}

.payment-icon {
  height: 30px;
  margin-right: 10px;
}

.payment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.payment-summary {
  font-size: 16px;
}

.payment-price {
  font-size: 20px;
  color: #ff4d4f;
  font-weight: bold;
  margin-left: 10px;
}

.payment-buttons {
  display: flex;
  gap: 15px;
}

.payment-qrcode {
  text-align: center;
  padding: 20px;
}

.qrcode-info {
  margin-bottom: 20px;
}

.payment-type {
  font-size: 16px;
  color: #666;
  margin: 0 0 5px;
}

.payment-amount {
  font-size: 24px;
  font-weight: bold;
  color: #ff4d4f;
  margin: 0;
}

.qrcode-image {
  margin-bottom: 20px;
}

.qrcode-container {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 8px;
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.qrcode-img {
  max-width: 100%;
  max-height: 100%;
}

.qrcode-loading {
  width: 100%;
  padding: 20px;
}

.qrcode-footer {
  color: #666;
  font-size: 14px;
}

.qrcode-order-no {
  margin-top: 5px;
  color: #999;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  gap: 15px;
}

@media (max-width: 768px) {
  .order-info {
    grid-template-columns: 1fr;
  }
  
  .info-item.payment-amount {
    grid-column: 1;
  }
  
  .payment-actions {
    flex-direction: column;
    gap: 15px;
  }
  
  .payment-buttons {
    width: 100%;
  }
  
  .payment-buttons .el-button {
    flex: 1;
  }
}
</style> 