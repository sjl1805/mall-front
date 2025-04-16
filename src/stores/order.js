import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from './user'
import { useCartStore } from './cart'
import router from '@/router'
import {
  createOrder as apiCreateOrder,
  getOrderDetail as apiGetOrderDetail,
  cancelOrder as apiCancelOrder,
  payOrder as apiPayOrder,
  confirmReceipt as apiConfirmReceipt,
  deleteOrder as apiDeleteOrder,
  getUserOrders as apiGetUserOrders,
  payCallback as apiPayCallback,
  OrderStatus,
  PayType
} from '@/api/order'

export { OrderStatus, PayType } // 重新导出常量，方便在组件中使用

export const useOrderStore = defineStore('order', () => {
  // 订单列表状态
  const orderList = ref([]) // 订单列表
  const currentPage = ref(1) // 当前页码
  const pageSize = ref(10) // 每页数量
  const total = ref(0) // 总订单数
  const currentFilter = ref(null) // 当前过滤状态 (null表示全部)
  const loading = ref(false) // 加载状态
  
  // 当前订单详情
  const currentOrder = ref(null) // 当前查看的订单详情
  const detailLoading = ref(false) // 订单详情加载状态
  
  // 支付相关
  const paymentInfo = ref(null) // 支付相关信息
  const paymentLoading = ref(false) // 支付加载状态
  
  // 订单统计信息
  const orderCounts = ref({
    pending_payment: 0, // 待付款数量
    pending_shipping: 0, // 待发货数量
    pending_receipt: 0, // 待收货数量
    completed: 0, // 已完成数量
    cancelled: 0, // 已取消数量
  })
  
  // 计算属性
  const hasOrders = computed(() => orderList.value.length > 0)
  const hasPendingPaymentOrders = computed(() => orderCounts.value.pending_payment > 0)
  const hasPendingShippingOrders = computed(() => orderCounts.value.pending_shipping > 0)
  const hasPendingReceiptOrders = computed(() => orderCounts.value.pending_receipt > 0)
  
  /**
   * 获取用户订单列表
   * @param {Object} params - 查询参数
   * @param {number} [params.status] - 订单状态：0-待付款，1-待发货，2-待收货，3-已完成，4-已取消，null-全部
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.size=10] - 每页数量
   * @returns {Promise<Array>} 订单列表
   */
  const fetchOrderList = async (params = {}) => {
    const userStore = useUserStore()
    
    // 未登录时返回空列表
    if (!userStore.isLoggedIn) {
      orderList.value = []
      return []
    }
    
    loading.value = true
    
    try {
      // 设置默认参数
      const queryParams = {
        status: params.status !== undefined ? params.status : currentFilter.value,
        page: params.page || currentPage.value,
        size: params.size || pageSize.value
      }
      
      // 保存当前的过滤和分页状态
      currentFilter.value = queryParams.status
      currentPage.value = queryParams.page
      pageSize.value = queryParams.size
      
      const res = await apiGetUserOrders(queryParams)
      
      if (res.code === 200 && res.data) {
        orderList.value = res.data.records || []
        total.value = res.data.total || 0
        return orderList.value
      }
      
      ElMessage.error(res.message || '获取订单列表失败')
      return []
    } catch (error) {
      console.error('获取订单列表失败', error)
      ElMessage.error('获取订单列表失败，请稍后重试')
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取订单详情
   * @param {string} orderNo - 订单号
   * @returns {Promise<Object>} 订单详情
   */
  const getOrderDetail = async (orderNo) => {
    if (!orderNo) {
      ElMessage.warning('订单号不能为空')
      return null
    }
    
    detailLoading.value = true
    
    try {
      const res = await apiGetOrderDetail(orderNo)
      
      if (res.code === 200 && res.data) {
        currentOrder.value = res.data
        return res.data
      }
      
      ElMessage.error(res.message || '获取订单详情失败')
      return null
    } catch (error) {
      console.error('获取订单详情失败', error)
      ElMessage.error('获取订单详情失败，请稍后重试')
      return null
    } finally {
      detailLoading.value = false
    }
  }
  
  /**
   * 创建订单
   * @param {Object} orderData - 创建订单参数
   * @param {Array<number>} [orderData.productIds] - 商品ID列表(购物车模式时为空)
   * @param {number} orderData.addressId - 收货地址ID
   * @param {string} [orderData.note] - 订单备注(可选)
   * @param {boolean} [orderData.fromCart=true] - 是否从购物车创建订单
   * @returns {Promise<string|null>} 订单号，失败返回null
   */
  const createOrder = async (orderData) => {
    const userStore = useUserStore()
    
    // 未登录时提示登录
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录后再创建订单')
      router.push('/login')
      return null
    }
    
    if (!orderData.addressId) {
      ElMessage.warning('请选择收货地址')
      return null
    }
    
    loading.value = true
    
    try {
      // 设置默认参数
      const createData = {
        ...orderData,
        fromCart: orderData.fromCart !== undefined ? orderData.fromCart : true
      }
      
      const res = await apiCreateOrder(createData)
      
      if (res.code === 200 && res.data) {
        const orderNo = res.data
        ElMessage.success('订单创建成功')
        
        // 如果是从购物车创建的订单，刷新购物车
        if (createData.fromCart) {
          const cartStore = useCartStore()
          cartStore.fetchCart()
        }
        
        // 刷新订单统计数据
        fetchOrderCounts()
        
        return orderNo
      }
      
      ElMessage.error(res.message || '创建订单失败')
      return null
    } catch (error) {
      console.error('创建订单失败', error)
      ElMessage.error('创建订单失败，请稍后重试')
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 取消订单
   * @param {string} orderNo - 订单号
   * @returns {Promise<boolean>} 是否取消成功
   */
  const cancelOrder = async (orderNo) => {
    if (!orderNo) {
      ElMessage.warning('订单号不能为空')
      return false
    }
    
    loading.value = true
    
    try {
      const res = await apiCancelOrder(orderNo)
      
      if (res.code === 200) {
        ElMessage.success('订单已取消')
        
        // 如果当前有查看的订单，更新订单状态
        if (currentOrder.value && currentOrder.value.orderNo === orderNo) {
          currentOrder.value.status = OrderStatus.CANCELLED
        }
        
        // 刷新订单列表
        await fetchOrderList()
        
        // 刷新订单统计数据
        fetchOrderCounts()
        
        return true
      }
      
      ElMessage.error(res.message || '取消订单失败')
      return false
    } catch (error) {
      console.error('取消订单失败', error)
      ElMessage.error('取消订单失败，请稍后重试')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 支付订单
   * @param {string} orderNo - 订单号
   * @param {number} payType - 支付方式：1-支付宝，2-微信
   * @returns {Promise<Object|null>} 支付信息，失败返回null
   */
  const payOrder = async (orderNo, payType) => {
    if (!orderNo) {
      ElMessage.warning('订单号不能为空')
      return null
    }
    
    if (!payType) {
      ElMessage.warning('请选择支付方式')
      return null
    }
    
    paymentLoading.value = true
    
    try {
      const res = await apiPayOrder(orderNo, payType)
      
      if (res.code === 200 && res.data) {
        paymentInfo.value = res.data
        ElMessage.success('正在跳转到支付页面')
        return res.data
      }
      
      ElMessage.error(res.message || '获取支付信息失败')
      return null
    } catch (error) {
      console.error('获取支付信息失败', error)
      ElMessage.error('获取支付信息失败，请稍后重试')
      return null
    } finally {
      paymentLoading.value = false
    }
  }
  
  /**
   * 支付回调（模拟）
   * @param {string} orderNo - 订单号
   * @param {string} tradeNo - 交易号
   * @returns {Promise<boolean>} 是否处理成功
   */
  const handlePayCallback = async (orderNo, tradeNo) => {
    if (!orderNo || !tradeNo) {
      return false
    }
    
    loading.value = true
    
    try {
      const res = await apiPayCallback(orderNo, tradeNo)
      
      if (res.code === 200) {
        // 支付成功后，更新订单状态
        ElMessage.success('支付成功')
        
        // 如果当前有查看的订单，更新订单状态
        if (currentOrder.value && currentOrder.value.orderNo === orderNo) {
          currentOrder.value.status = OrderStatus.PENDING_SHIPPING
        }
        
        // 刷新订单列表
        await fetchOrderList()
        
        // 刷新订单统计数据
        fetchOrderCounts()
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('支付回调处理失败', error)
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 确认收货
   * @param {string} orderNo - 订单号
   * @returns {Promise<boolean>} 是否确认成功
   */
  const confirmReceipt = async (orderNo) => {
    if (!orderNo) {
      ElMessage.warning('订单号不能为空')
      return false
    }
    
    loading.value = true
    
    try {
      const res = await apiConfirmReceipt(orderNo)
      
      if (res.code === 200) {
        ElMessage.success('已确认收货')
        
        // 如果当前有查看的订单，更新订单状态
        if (currentOrder.value && currentOrder.value.orderNo === orderNo) {
          currentOrder.value.status = OrderStatus.COMPLETED
        }
        
        // 刷新订单列表
        await fetchOrderList()
        
        // 刷新订单统计数据
        fetchOrderCounts()
        
        return true
      }
      
      ElMessage.error(res.message || '确认收货失败')
      return false
    } catch (error) {
      console.error('确认收货失败', error)
      ElMessage.error('确认收货失败，请稍后重试')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 删除订单
   * @param {string} orderNo - 订单号
   * @returns {Promise<boolean>} 是否删除成功
   */
  const deleteOrder = async (orderNo) => {
    if (!orderNo) {
      ElMessage.warning('订单号不能为空')
      return false
    }
    
    loading.value = true
    
    try {
      const res = await apiDeleteOrder(orderNo)
      
      if (res.code === 200) {
        ElMessage.success('订单已删除')
        
        // 如果当前有查看的订单并且是被删除的订单，清空当前订单
        if (currentOrder.value && currentOrder.value.orderNo === orderNo) {
          currentOrder.value = null
        }
        
        // 刷新订单列表
        await fetchOrderList()
        
        // 刷新订单统计数据
        fetchOrderCounts()
        
        return true
      }
      
      ElMessage.error(res.message || '删除订单失败')
      return false
    } catch (error) {
      console.error('删除订单失败', error)
      ElMessage.error('删除订单失败，请稍后重试')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取订单统计数据
   * @returns {Promise<Object>} 订单统计数据
   */
  const fetchOrderCounts = async () => {
    const userStore = useUserStore()
    
    // 未登录时返回空数据
    if (!userStore.isLoggedIn) {
      orderCounts.value = {
        pending_payment: 0,
        pending_shipping: 0,
        pending_receipt: 0,
        completed: 0,
        cancelled: 0
      }
      return orderCounts.value
    }
    
    try {
      // 依次获取各状态订单数量
      const pendingPaymentRes = await apiGetUserOrders({ status: OrderStatus.PENDING_PAYMENT, page: 1, size: 1 })
      const pendingShippingRes = await apiGetUserOrders({ status: OrderStatus.PENDING_SHIPPING, page: 1, size: 1 })
      const pendingReceiptRes = await apiGetUserOrders({ status: OrderStatus.PENDING_RECEIPT, page: 1, size: 1 })
      const completedRes = await apiGetUserOrders({ status: OrderStatus.COMPLETED, page: 1, size: 1 })
      const cancelledRes = await apiGetUserOrders({ status: OrderStatus.CANCELLED, page: 1, size: 1 })
      
      // 更新统计数据
      orderCounts.value = {
        pending_payment: pendingPaymentRes.code === 200 ? pendingPaymentRes.data.total : 0,
        pending_shipping: pendingShippingRes.code === 200 ? pendingShippingRes.data.total : 0,
        pending_receipt: pendingReceiptRes.code === 200 ? pendingReceiptRes.data.total : 0,
        completed: completedRes.code === 200 ? completedRes.data.total : 0,
        cancelled: cancelledRes.code === 200 ? cancelledRes.data.total : 0
      }
      
      return orderCounts.value
    } catch (error) {
      console.error('获取订单统计数据失败', error)
      return orderCounts.value
    }
  }
  
  /**
   * 获取订单状态文本
   * @param {number} status - 订单状态值
   * @returns {string} 状态文本
   */
  const getOrderStatusText = (status) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return '待付款'
      case OrderStatus.PENDING_SHIPPING:
        return '待发货'
      case OrderStatus.PENDING_RECEIPT:
        return '待收货'
      case OrderStatus.COMPLETED:
        return '已完成'
      case OrderStatus.CANCELLED:
        return '已取消'
      default:
        return '未知状态'
    }
  }
  
  /**
   * 获取支付方式文本
   * @param {number} payType - 支付方式值
   * @returns {string} 支付方式文本
   */
  const getPayTypeText = (payType) => {
    switch (payType) {
      case PayType.ALIPAY:
        return '支付宝'
      case PayType.WECHAT:
        return '微信支付'
      default:
        return '未知支付方式'
    }
  }
  
  /**
   * 初始化订单模块
   * 用于应用启动时调用
   */
  const initOrders = async () => {
    const userStore = useUserStore()
    
    // 已登录时初始化订单数据
    if (userStore.isLoggedIn) {
      await fetchOrderCounts()
    }
  }
  
  /**
   * 清空订单数据
   * 用于退出登录时调用
   */
  const clearOrderData = () => {
    orderList.value = []
    currentOrder.value = null
    paymentInfo.value = null
    currentPage.value = 1
    currentFilter.value = null
    total.value = 0
    orderCounts.value = {
      pending_payment: 0,
      pending_shipping: 0,
      pending_receipt: 0,
      completed: 0,
      cancelled: 0
    }
  }

  return {
    // 状态
    orderList,
    currentOrder,
    loading,
    detailLoading,
    paymentLoading,
    currentPage,
    pageSize,
    total,
    currentFilter,
    orderCounts,
    paymentInfo,
    
    // 计算属性
    hasOrders,
    hasPendingPaymentOrders,
    hasPendingShippingOrders,
    hasPendingReceiptOrders,
    
    // 方法
    fetchOrderList,
    getOrderDetail,
    createOrder,
    cancelOrder,
    payOrder,
    handlePayCallback,
    confirmReceipt,
    deleteOrder,
    fetchOrderCounts,
    getOrderStatusText,
    getPayTypeText,
    initOrders,
    clearOrderData
  }
}) 