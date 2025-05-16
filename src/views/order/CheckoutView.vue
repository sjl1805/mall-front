<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useOrderStore, PayType } from '@/stores/order'
import { useAddressStore } from '@/stores/address'
import { useFileStore } from '@/stores/file'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Location, CreditCard, ShoppingBag } from '@element-plus/icons-vue'

// 获取 store 和路由
const cartStore = useCartStore()
const orderStore = useOrderStore()
const addressStore = useAddressStore()
const fileStore = useFileStore()
const router = useRouter()

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 表单数据
const orderForm = ref({
  addressId: null,
  payType: PayType.ALIPAY, // 默认支付宝支付
  note: '',
  fromCart: true, // 默认从购物车结算
  productIds: []
})

// 商品列表
const selectedItems = computed(() => cartStore.selectedItems)
const totalAmount = computed(() => cartStore.selectedTotalPrice)

// 地址相关
const addresses = computed(() => addressStore.addresses)
const hasAddresses = computed(() => addressStore.addressCount > 0)
const selectedAddress = computed(() => {
  if (!orderForm.value.addressId && addressStore.defaultAddress) {
    orderForm.value.addressId = addressStore.defaultAddress.id
  }
  return addresses.value.find(addr => addr.id === orderForm.value.addressId) || null
})

// 获取图片 URL
const getImageUrl = (imageUrl) => {
  return fileStore.getPreviewUrl(imageUrl)
}

// 格式化价格
const formatPrice = (price) => {
  return cartStore.formatPrice(price)
}

// 获取地址列表
const fetchAddresses = async () => {
  loading.value = true
  try {
    await addressStore.fetchAddresses()
    
    // 如果有默认地址，选中它
    if (addressStore.hasDefaultAddress) {
      orderForm.value.addressId = addressStore.defaultAddress.id
    } else if (addresses.value.length > 0) {
      orderForm.value.addressId = addresses.value[0].id
    }
  } catch (error) {
    console.error('获取地址列表失败', error)
  } finally {
    loading.value = false
  }
}

// 前往添加地址页面
const goToAddAddress = () => {
  router.push('/user/address')
}

// 提交订单
const submitOrder = async () => {
  // 验证表单
  if (!orderForm.value.addressId) {
    ElMessage.warning('请选择收货地址')
    return
  }
  
  if (!selectedItems.value.length) {
    ElMessage.warning('购物车中没有选中商品')
    router.push('/cart')
    return
  }
  
  try {
    submitting.value = true
    
    // 创建订单
    const orderNo = await orderStore.createOrder(orderForm.value)
    
    if (orderNo) {
      // 创建成功，跳转到支付页面
      router.push(`/order/pay/${orderNo}`)
    }
  } catch (error) {
    console.error('提交订单失败', error)
  } finally {
    submitting.value = false
  }
}

// 初始化页面
onMounted(async () => {
  loading.value = true
  try {
    // 获取购物车选中商品
    await cartStore.fetchCart()
    
    // 获取地址列表
    await fetchAddresses()
    
    // 如果没有选中商品，返回购物车页面
    if (!selectedItems.value.length) {
      ElMessage.warning('请先选择要购买的商品')
      router.push('/cart')
    }
  } catch (error) {
    console.error('初始化结算页面失败', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="checkout-page">
    <h1 class="page-title">确认订单</h1>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <template v-else>
      <!-- 收货地址 -->
      <el-card class="address-section">
        <template #header>
          <div class="section-header">
            <h2>
              <el-icon><Location /></el-icon>
              收货地址
            </h2>
          </div>
        </template>
        
        <div v-if="hasAddresses" class="address-list">
          <el-radio-group v-model="orderForm.addressId" class="address-radio-group">
            <el-radio 
              v-for="address in addresses" 
              :key="address.id" 
              :label="address.id"
              class="address-radio"
            >
              <div class="address-item">
                <div class="address-info">
                  <p class="address-name">
                    <span>{{ address.name }}</span>
                    <span class="address-phone">{{ address.phone }}</span>
                    <el-tag v-if="address.isDefault === 1" size="small" type="danger">默认</el-tag>
                  </p>
                  <p class="address-detail">
                    {{ address.province }} {{ address.city }} {{ address.district }} {{ address.detail }}
                  </p>
                </div>
              </div>
            </el-radio>
          </el-radio-group>
        </div>
        
        <div v-else class="empty-address">
          <p>您还没有收货地址，请先添加</p>
          <el-button type="primary" @click="goToAddAddress">添加收货地址</el-button>
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
          <el-table :data="selectedItems" style="width: 100%">
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
      
      
      <!-- 订单备注 -->
      <el-card class="note-section">
        <template #header>
          <div class="section-header">
            <h2>订单备注</h2>
          </div>
        </template>
        
        <div class="order-note">
          <el-input
            v-model="orderForm.note"
            type="textarea"
            placeholder="请输入订单备注信息（选填）"
            :rows="2"
            maxlength="200"
            show-word-limit
          />
        </div>
      </el-card>
      
      <!-- 订单金额 -->
      <el-card class="order-summary">
        <div class="summary-detail">
          <span>商品总金额：</span>
          <span class="price">¥{{ formatPrice(totalAmount) }}</span>
        </div>
        <div class="summary-detail">
          <span>运费：</span>
          <span class="price">¥0.00</span>
        </div>
        <div class="summary-detail">
          <span>应付金额：</span>
          <span class="total-price">¥{{ formatPrice(totalAmount) }}</span>
        </div>
        
        <div class="summary-footer">
          <div class="selected-address" v-if="selectedAddress">
            <span>收货地址：</span>
            <span>{{ selectedAddress.name }} {{ selectedAddress.phone }} {{ selectedAddress.province }} {{ selectedAddress.city }} {{ selectedAddress.district }} {{ selectedAddress.detail }}</span>
          </div>
          
          <div class="submit-area">
            <el-button 
              type="primary" 
              size="large" 
              :loading="submitting" 
              @click="submitOrder"
            >
              提交订单
            </el-button>
          </div>
        </div>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.checkout-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.loading-container {
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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

.address-section,
.product-section,
.payment-section,
.note-section,
.order-summary {
  margin-bottom: 20px;
}

/* 地址样式 */
.address-list {
  display: flex;
  flex-wrap: wrap;
}

.address-radio-group {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.address-radio {
  margin-right: 0;
  width: calc(50% - 8px);
  height: auto;
}

.address-item {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 15px;
  margin-top: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.address-item:hover {
  border-color: #ff4d4f;
}

.address-info {
  display: flex;
  flex-direction: column;
}

.address-name {
  font-weight: bold;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.address-phone {
  color: #666;
  margin-left: 10px;
}

.address-detail {
  color: #666;
  line-height: 1.5;
}

.empty-address {
  text-align: center;
  padding: 20px;
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

/* 支付方式样式 */
.payment-options {
  padding: 10px 0;
}

.payment-radio-group {
  display: flex;
  gap: 20px;
}

.payment-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.payment-logo {
  height: 25px;
  width: auto;
}

/* 订单备注样式 */
.order-note {
  padding: 10px 0;
}

/* 订单金额样式 */
.order-summary {
  margin-bottom: 50px;
}

.summary-detail {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.price {
  margin-left: 10px;
  color: #ff4d4f;
  font-weight: bold;
}

.total-price {
  margin-left: 10px;
  color: #ff4d4f;
  font-weight: bold;
  font-size: 20px;
}

.summary-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.selected-address {
  max-width: 70%;
  color: #666;
}

.submit-area {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .address-radio {
    width: 100%;
  }
  
  .summary-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .selected-address {
    max-width: 100%;
  }
  
  .submit-area {
    width: 100%;
  }
  
  .submit-area .el-button {
    width: 100%;
  }
}
</style> 