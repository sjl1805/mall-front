<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useFileStore } from '@/stores/file'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Delete, ShoppingCart, ShoppingBag } from '@element-plus/icons-vue'

// 获取store和路由
const cartStore = useCartStore()
const fileStore = useFileStore()
const router = useRouter()

// 加载状态
const loading = ref(false)

// 全选按钮状态
const allSelected = computed(() => cartStore.allChecked)

// 计算属性：商品列表
const cartItems = computed(() => cartStore.cartItems)
const hasItems = computed(() => cartStore.hasItems)
const selectedItems = computed(() => cartStore.selectedItems)
const hasSelectedItems = computed(() => cartStore.hasSelectedItems)

// 统计数据
const selectedCount = computed(() => cartStore.selectedCount)
const selectedTotalPrice = computed(() => cartStore.selectedTotalPrice)
const totalPrice = computed(() => cartStore.totalPrice)

// 获取图片URL
const getImageUrl = (imageUrl) => {
  return fileStore.getPreviewUrl(imageUrl)
}

// 格式化价格
const formatPrice = (price) => {
  return cartStore.formatPrice(price)
}

// 全选/取消全选
const toggleSelectAll = async () => {
  loading.value = true
  try {
    await cartStore.updateAllChecked(!allSelected.value)
  } catch (error) {
    console.error('全选/取消全选失败', error)
  } finally {
    loading.value = false
  }
}

// 选择/取消选择单个商品
const toggleSelectItem = async (productId, checked) => {
  try {
    await cartStore.updateItemChecked(productId, checked)
  } catch (error) {
    console.error('选择/取消选择商品失败', error)
  }
}

// 修改商品数量
const updateQuantity = async (productId, quantity) => {
  try {
    await cartStore.updateCartItemQuantity(productId, quantity)
  } catch (error) {
    console.error('修改商品数量失败', error)
  }
}

// 移除单个商品
const removeItem = async (productId, productName) => {
  try {
    await ElMessageBox.confirm(
      `确定要从购物车中移除商品 "${productName}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await cartStore.removeFromCart(productId)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除商品失败', error)
    }
  }
}

// 清空购物车
const clearCart = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空购物车吗？此操作不可恢复。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await cartStore.clearCart()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空购物车失败', error)
    }
  }
}

// 删除选中商品
const removeSelectedItems = async () => {
  if (!hasSelectedItems.value) {
    ElMessage.warning('请至少选择一件商品')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要删除所有选中的商品吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const productIds = selectedItems.value.map(item => item.productId)
    await cartStore.removeFromCartBatch(productIds)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除选中商品失败', error)
    }
  }
}

// 前往商品详情页
const goToProduct = (productId) => {
  router.push(`/product/${productId}`)
}

// 结算
const checkout = () => {
  if (!hasSelectedItems.value) {
    ElMessage.warning('请至少选择一件商品进行结算')
    return
  }
  
  router.push('/checkout')
}

// 继续购物
const continueShopping = () => {
  router.push('/products')
}

// 初始化：加载购物车数据
onMounted(async () => {
  loading.value = true
  try {
    await cartStore.fetchCart()
  } catch (error) {
    console.error('获取购物车数据失败', error)
  } finally {
    loading.value = false
  }
})

// 监听购物车内的变化，自动重新计算总价
watch(
  () => cartItems.value,
  () => {
    // 购物车项变化时会自动重新计算总价
  },
  { deep: true }
)
</script>

<template>
  <div class="cart-page">
    <div class="cart-header">
      <h1 class="page-title">我的购物车</h1>
    </div>
    
    <!-- 加载状态 -->
    <el-card v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <el-skeleton :rows="5" animated />
      </div>
    </el-card>
    
    <!-- 空购物车 -->
    <el-card v-else-if="!hasItems" class="empty-cart">
      <div class="empty-cart-content">
        <el-empty 
          description="您的购物车还是空的"
          :image-size="200"
        >
          <template #image>
            <el-icon class="empty-icon"><ShoppingCart /></el-icon>
          </template>
          <el-button type="primary" @click="continueShopping">
            去购物
          </el-button>
        </el-empty>
      </div>
    </el-card>
    
    <!-- 购物车内容 -->
    <template v-else>
      <el-card class="cart-container">
        <!-- 购物车表头 -->
        <div class="cart-table-header">
          <div class="cart-col checkbox-col">
            <el-checkbox
              v-model="allSelected"
              @change="toggleSelectAll"
              :disabled="loading"
            >
              全选
            </el-checkbox>
          </div>
          <div class="cart-col product-col">商品信息</div>
          <div class="cart-col price-col">单价</div>
          <div class="cart-col quantity-col">数量</div>
          <div class="cart-col subtotal-col">小计</div>
          <div class="cart-col action-col">操作</div>
        </div>
        
        <!-- 购物车列表 -->
        <div class="cart-items">
          <div 
            v-for="item in cartItems" 
            :key="item.productId" 
            class="cart-item"
          >
            <div class="cart-col checkbox-col">
              <el-checkbox
                v-model="item.checked"
                :value="item.checked === 1"
                @change="(val) => toggleSelectItem(item.productId, val)"
                :disabled="loading"
              />
            </div>
            
            <div class="cart-col product-col" @click="goToProduct(item.productId)">
              <div class="product-info">
                <div class="product-image">
                  <img :src="getImageUrl(item.productImage)" :alt="item.productName">
                </div>
                <div class="product-details">
                  <div class="product-name">{{ item.productName }}</div>
                  <div v-if="item.productAttr" class="product-attr">
                    规格：{{ item.productAttr }}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="cart-col price-col">
              <div class="price">¥{{ formatPrice(item.price) }}</div>
              <div v-if="item.originalPrice > item.price" class="original-price">
                ¥{{ formatPrice(item.originalPrice) }}
              </div>
            </div>
            
            <div class="cart-col quantity-col">
              <el-input-number
                v-model="item.quantity"
                :min="1"
                :max="99"
                size="small"
                @change="(val) => updateQuantity(item.productId, val)"
                :disabled="loading"
              />
            </div>
            
            <div class="cart-col subtotal-col">
              <div class="subtotal">¥{{ formatPrice(item.totalPrice) }}</div>
            </div>
            
            <div class="cart-col action-col">
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                circle
                @click="removeItem(item.productId, item.productName)"
                :disabled="loading"
              />
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 购物车底部 -->
      <el-card class="cart-footer">
        <div class="cart-summary">
          <div class="cart-actions">
            <el-checkbox
              v-model="allSelected"
              @change="toggleSelectAll"
              :disabled="loading"
            >
              全选
            </el-checkbox>
            <el-button 
              type="danger" 
              size="small" 
              @click="removeSelectedItems"
              :disabled="!hasSelectedItems || loading"
            >
              删除选中商品
            </el-button>
            <el-button 
              type="warning" 
              size="small" 
              @click="clearCart"
              :disabled="!hasItems || loading"
            >
              清空购物车
            </el-button>
          </div>
          
          <div class="cart-total">
            <div class="total-info">
              <p>已选商品 <span class="highlight">{{ selectedCount }}</span> 件</p>
              <p>
                商品总价：<span class="price">¥{{ formatPrice(selectedTotalPrice) }}</span>
              </p>
            </div>
            
            <div class="checkout-action">
              <el-button 
                type="primary" 
                size="large" 
                @click="checkout"
                :disabled="!hasSelectedItems || loading"
                :icon="ShoppingBag"
              >
                去结算
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.cart-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.cart-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.loading-container {
  padding: 30px;
  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-cart {
  min-height: 300px;
}

.empty-cart-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 80px;
  color: #c0c4cc;
}

.cart-container {
  margin-bottom: 20px;
}

.cart-table-header {
  display: flex;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
  background-color: #f5f7fa;
  font-weight: bold;
}

.cart-col {
  padding: 0 10px;
}

.checkbox-col {
  flex: 0 0 80px;
  display: flex;
  align-items: center;
}

.product-col {
  flex: 1;
  min-width: 0;
}

.price-col,
.subtotal-col {
  flex: 0 0 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.quantity-col {
  flex: 0 0 150px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-col {
  flex: 0 0 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cart-items {
  margin-top: 10px;
}

.cart-item {
  display: flex;
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.product-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.product-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  margin-right: 15px;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.product-attr {
  font-size: 12px;
  color: #999;
}

.price {
  font-size: 16px;
  color: #ff4d4f;
  font-weight: bold;
}

.original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.subtotal {
  font-size: 16px;
  color: #ff4d4f;
  font-weight: bold;
}

.cart-footer {
  margin-bottom: 50px;
}

.cart-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
}

.cart-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.cart-total {
  display: flex;
  align-items: center;
  gap: 20px;
}

.total-info {
  text-align: right;
  line-height: 1.6;
}

.highlight {
  color: #ff4d4f;
  font-weight: bold;
}

.price {
  font-size: 20px;
  color: #ff4d4f;
  font-weight: bold;
}

.checkout-action .el-button {
  padding: 12px 25px;
}

@media (max-width: 768px) {
  .cart-table-header {
    display: none;
  }
  
  .cart-item {
    flex-wrap: wrap;
    position: relative;
    padding-bottom: 30px;
  }
  
  .checkbox-col {
    flex: 0 0 30px;
  }
  
  .product-col {
    flex: 1;
  }
  
  .price-col,
  .quantity-col,
  .subtotal-col,
  .action-col {
    flex: 0 0 50%;
    margin-top: 15px;
    justify-content: flex-start;
  }
  
  .cart-summary {
    flex-direction: column;
    gap: 20px;
  }
  
  .cart-total {
    width: 100%;
    flex-direction: column;
  }
  
  .total-info {
    width: 100%;
    text-align: center;
  }
  
  .checkout-action {
    width: 100%;
  }
  
  .checkout-action .el-button {
    width: 100%;
  }
}
</style> 