import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from './user'
import { 
  getCart as apiGetCart,
  getCartCount as apiGetCartCount,
  addToCart as apiAddToCart,
  updateCartQuantity as apiUpdateCartQuantity,
  deleteCartItem as apiDeleteCartItem,
  deleteCartItemBatch as apiDeleteCartItemBatch,
  clearCart as apiClearCart,
  updateCartChecked as apiUpdateCartChecked,
  updateCartCheckedBatch as apiUpdateCartCheckedBatch,
  updateCartCheckedAll as apiUpdateCartCheckedAll,
  existsProductInCart as apiExistsProductInCart
} from '@/api/user'

export const useCartStore = defineStore('cart', () => {
  // 购物车状态
  const cartItems = ref([]) // 购物车商品列表
  const selectedCount = ref(0) // 已选中商品数量
  const selectedTotalPrice = ref(0) // 已选中商品总价
  const totalPrice = ref(0) // 所有商品总价
  const allChecked = ref(false) // 是否全选
  const loading = ref(false) // 加载状态
  const initialized = ref(false) // 是否已初始化
  
  // 计算属性
  const cartCount = computed(() => cartItems.value.reduce((total, item) => total + item.quantity, 0))
  const hasItems = computed(() => cartItems.value.length > 0)
  const hasSelectedItems = computed(() => selectedCount.value > 0)
  const selectedItems = computed(() => cartItems.value.filter(item => item.checked === 1))
  
  /**
   * 获取购物车列表
   * @param {boolean} [silent=false] - 是否静默请求（不显示加载状态和错误消息）
   * @returns {Promise<Object>} 购物车信息
   */
  const fetchCart = async (silent = false) => {
    const userStore = useUserStore()
    
    // 未登录时不请求购物车数据
    if (!userStore.isLoggedIn) {
      clearCartData()
      return null
    }
    
    if (!silent) {
      loading.value = true
    }
    
    try {
      const res = await apiGetCart()
      
      if (res.code === 200 && res.data) {
        // 更新购物车数据
        updateCartData(res.data)
        initialized.value = true
        return res.data
      }
      
      return null
    } catch (error) {
      console.error('获取购物车失败', error)
      if (!silent) {
        ElMessage.error('获取购物车失败，请稍后重试')
      }
      return null
    } finally {
      if (!silent) {
        loading.value = false
      }
    }
  }
  
  /**
   * 获取购物车商品数量
   * @returns {Promise<number>} 商品数量
   */
  const getCartCount = async () => {
    const userStore = useUserStore()
    
    // 未登录时返回0
    if (!userStore.isLoggedIn) {
      return 0
    }
    
    try {
      const res = await apiGetCartCount()
      
      if (res.code === 200) {
        return res.data || 0
      }
      
      return 0
    } catch (error) {
      console.error('获取购物车数量失败', error)
      return 0
    }
  }
  
  /**
   * 添加商品到购物车
   * @param {number} productId - 商品ID
   * @param {number} quantity - 数量（默认为1）
   * @returns {Promise<Boolean>} 是否添加成功
   */
  const addToCart = async (productId, quantity = 1) => {
    const userStore = useUserStore()
    
    // 未登录时提示登录
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录后再添加商品到购物车')
      return false
    }
    
    // 参数验证
    if (!productId) {
      ElMessage.warning('商品ID不能为空')
      return false
    }
    
    if (quantity < 1) {
      ElMessage.warning('商品数量不能小于1')
      return false
    }
    
    loading.value = true
    
    try {
      const res = await apiAddToCart(productId, quantity)
      
      if (res.code === 200) {
        // 添加成功后刷新购物车列表
        await fetchCart(true)
        ElMessage.success('添加商品到购物车成功')
        return true
      }
      
      ElMessage.error(res.message || '添加商品到购物车失败')
      return false
    } catch (error) {
      console.error('添加商品到购物车失败', error)
      ElMessage.error('添加商品到购物车失败，请稍后重试')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 更新购物车商品数量
   * @param {number} productId - 商品ID
   * @param {number} quantity - 新的数量
   * @returns {Promise<Boolean>} 是否更新成功
   */
  const updateCartItemQuantity = async (productId, quantity) => {
    // 参数验证
    if (!productId) {
      ElMessage.warning('商品ID不能为空')
      return false
    }
    
    // 数量不能小于1
    if (quantity < 1) {
      ElMessage.warning('商品数量不能小于1')
      return false
    }
    
    loading.value = true
    
    try {
      const res = await apiUpdateCartQuantity(productId, quantity)
      
      if (res.code === 200) {
        // 更新成功后更新本地购物车数据
        const index = cartItems.value.findIndex(item => item.productId === productId)
        if (index !== -1) {
          cartItems.value[index].quantity = quantity
          
          // 更新商品小计
          const price = cartItems.value[index].price || 0
          cartItems.value[index].totalPrice = price * quantity
          
          // 重新计算总价
          recalculateTotals()
        }
        
        return true
      }
      
      ElMessage.error(res.message || '更新商品数量失败')
      return false
    } catch (error) {
      console.error('更新商品数量失败', error)
      ElMessage.error('更新商品数量失败，请稍后重试')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 从购物车中移除商品
   * @param {number} productId - 商品ID
   * @returns {Promise<Boolean>} 是否移除成功
   */
  const removeFromCart = async (productId) => {
    if (!productId) {
      ElMessage.warning('商品ID不能为空')
      return false
    }
    
    loading.value = true
    
    try {
      const res = await apiDeleteCartItem(productId)
      
      if (res.code === 200) {
        // 移除成功后更新本地购物车数据
        cartItems.value = cartItems.value.filter(item => item.productId !== productId)
        
        // 重新计算总价
        recalculateTotals()
        
        ElMessage.success('商品已从购物车中移除')
        return true
      }
      
      ElMessage.error(res.message || '移除商品失败')
      return false
    } catch (error) {
      console.error('移除商品失败', error)
      ElMessage.error('移除商品失败，请稍后重试')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 批量移除购物车商品
   * @param {Array<number>} productIds - 商品ID数组
   * @returns {Promise<boolean>} 是否移除成功
   */
  const removeFromCartBatch = async (productIds) => {
    if (!productIds || !productIds.length) {
      ElMessage.warning('商品ID不能为空')
      return false
    }
    
    loading.value = true
    
    try {
      const res = await apiDeleteCartItemBatch(productIds)
      
      if (res.code === 200) {
        // 移除成功后更新本地购物车数据
        cartItems.value = cartItems.value.filter(item => !productIds.includes(item.productId))
        
        // 重新计算总价
        recalculateTotals()
        
        ElMessage.success('已从购物车中移除选中商品')
        return true
      }
      
      ElMessage.error(res.message || '批量移除商品失败')
      return false
    } catch (error) {
      console.error('批量移除商品失败', error)
      ElMessage.error('批量移除商品失败，请稍后重试')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 清空购物车
   * @returns {Promise<Boolean>} 是否清空成功
   */
  const clearCart = async () => {
    loading.value = true
    
    try {
      const res = await apiClearCart()
      
      if (res.code === 200) {
        // 清空成功后更新本地购物车数据
        clearCartData()
        ElMessage.success('购物车已清空')
        return true
      }
      
      ElMessage.error(res.message || '清空购物车失败')
      return false
    } catch (error) {
      console.error('清空购物车失败', error)
      ElMessage.error('清空购物车失败，请稍后重试')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 选择/取消选择购物车商品
   * @param {number} productId - 商品ID
   * @param {boolean} checked - 是否选中
   * @returns {Promise<Boolean>} 是否选择成功
   */
  const updateItemChecked = async (productId, checked) => {
    if (!productId) {
      ElMessage.warning('商品ID不能为空')
      return false
    }
    
    // 转换为后端需要的格式：0-未选中，1-选中
    const checkedValue = checked ? 1 : 0
    
    loading.value = true
    
    try {
      const res = await apiUpdateCartChecked(productId, checkedValue)
      
      if (res.code === 200) {
        // 选择成功后更新本地购物车数据
        const index = cartItems.value.findIndex(item => item.productId === productId)
        if (index !== -1) {
          cartItems.value[index].checked = checkedValue
          
          // 重新计算选中商品
          recalculateTotals()
        }
        
        return true
      }
      
      ElMessage.error(res.message || '选择商品失败')
      return false
    } catch (error) {
      console.error('选择商品失败', error)
      ElMessage.error('选择商品失败，请稍后重试')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 批量选择/取消选择购物车商品
   * @param {Array<number>} productIds - 商品ID数组
   * @param {boolean} checked - 是否选中
   * @returns {Promise<Boolean>} 是否选择成功
   */
  const updateItemsCheckedBatch = async (productIds, checked) => {
    if (!productIds || !productIds.length) {
      ElMessage.warning('商品ID不能为空')
      return false
    }
    
    // 转换为后端需要的格式：0-未选中，1-选中
    const checkedValue = checked ? 1 : 0
    
    loading.value = true
    
    try {
      const res = await apiUpdateCartCheckedBatch(productIds, checkedValue)
      
      if (res.code === 200) {
        // 选择成功后更新本地购物车数据
        productIds.forEach(productId => {
          const index = cartItems.value.findIndex(item => item.productId === productId)
          if (index !== -1) {
            cartItems.value[index].checked = checkedValue
          }
        })
        
        // 重新计算选中商品
        recalculateTotals()
        
        return true
      }
      
      ElMessage.error(res.message || '批量选择商品失败')
      return false
    } catch (error) {
      console.error('批量选择商品失败', error)
      ElMessage.error('批量选择商品失败，请稍后重试')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 全选/取消全选购物车商品
   * @param {boolean} checked - 是否全选
   * @returns {Promise<Boolean>} 是否全选成功
   */
  const updateAllChecked = async (checked) => {
    // 转换为后端需要的格式：0-未选中，1-选中
    const checkedValue = checked ? 1 : 0
    
    loading.value = true
    
    try {
      const res = await apiUpdateCartCheckedAll(checkedValue)
      
      if (res.code === 200) {
        // 全选成功后更新本地购物车数据
        cartItems.value.forEach(item => {
          item.checked = checkedValue
        })
        
        // 更新全选状态
        allChecked.value = checked
        
        // 重新计算选中商品
        recalculateTotals()
        
        return true
      }
      
      ElMessage.error(res.message || '全选商品失败')
      return false
    } catch (error) {
      console.error('全选商品失败', error)
      ElMessage.error('全选商品失败，请稍后重试')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 检查商品是否在购物车中
   * @param {number} productId - 商品ID
   * @returns {Promise<boolean>} 是否在购物车中
   */
  const checkProductInCart = async (productId) => {
    const userStore = useUserStore()
    
    // 未登录时直接返回false
    if (!userStore.isLoggedIn) {
      return false
    }
    
    if (!productId) {
      return false
    }
    
    // 先检查本地购物车数据
    if (initialized.value) {
      const exists = cartItems.value.some(item => item.productId === productId)
      if (exists) {
        return true
      }
    }
    
    try {
      const res = await apiExistsProductInCart(productId)
      
      if (res.code === 200) {
        return res.data || false
      }
      
      return false
    } catch (error) {
      console.error('检查商品是否在购物车中失败', error)
      return false
    }
  }
  
  /**
   * 重新计算购物车总价和选中商品数量
   */
  const recalculateTotals = () => {
    // 计算选中商品数量和价格
    let selCount = 0
    let selTotal = 0
    let total = 0
    let allSel = cartItems.value.length > 0
    
    cartItems.value.forEach(item => {
      // 计算商品总价
      const itemTotal = item.price * item.quantity
      
      // 更新商品总价
      item.totalPrice = itemTotal
      
      // 累计总价
      total += itemTotal
      
      // 累计选中商品
      if (item.checked === 1) {
        selCount += item.quantity
        selTotal += itemTotal
      } else {
        allSel = false
      }
    })
    
    // 更新状态
    selectedCount.value = selCount
    selectedTotalPrice.value = selTotal
    totalPrice.value = total
    allChecked.value = allSel
  }
  
  /**
   * 更新购物车数据
   * @param {Object} cartData - 购物车数据
   */
  const updateCartData = (cartData) => {
    if (!cartData) return
    
    // 更新购物车商品列表
    cartItems.value = cartData.cartItems || []
    
    // 更新统计信息
    selectedCount.value = cartData.selectedCount || 0
    selectedTotalPrice.value = cartData.selectedTotalPrice || 0
    totalPrice.value = cartData.totalPrice || 0
    allChecked.value = cartData.allChecked || false
  }
  
  /**
   * 清空购物车数据
   */
  const clearCartData = () => {
    cartItems.value = []
    selectedCount.value = 0
    selectedTotalPrice.value = 0
    totalPrice.value = 0
    allChecked.value = false
    initialized.value = false
  }
  
  /**
   * 初始化购物车
   * 登录后调用此方法获取购物车数据
   */
  const initCart = async () => {
    if (!initialized.value) {
      await fetchCart()
    }
  }
  
  /**
   * 格式化商品价格
   * @param {number} price - 价格
   * @returns {string} 格式化后的价格
   */
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0.00'
    return parseFloat(price).toFixed(2)
  }
  
  return {
    // 状态
    cartItems,
    selectedCount,
    selectedTotalPrice,
    totalPrice,
    allChecked,
    loading,
    initialized,
    
    // 计算属性
    cartCount,
    hasItems,
    hasSelectedItems,
    selectedItems,
    
    // 方法
    fetchCart,
    getCartCount,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    removeFromCartBatch,
    clearCart,
    updateItemChecked,
    updateItemsCheckedBatch,
    updateAllChecked,
    checkProductInCart,
    initCart,
    clearCartData,
    formatPrice
  }
}) 