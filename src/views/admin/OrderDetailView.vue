<template>
  <div class="order-detail-container">
    <el-page-header :icon="Back" @back="goBack" title="订单详情" />
    
    <div v-loading="loading">
      <template v-if="orderDetail">
        <!-- 订单状态卡片 -->
        <el-card class="status-card">
          <div class="status-header">
            <div class="status-info">
              <div class="status-badge" :class="getOrderStatusClass(orderDetail.status)">
                {{ getOrderStatusText(orderDetail.status) }}
              </div>
              <div class="status-desc">{{ getOrderStatusDesc(orderDetail.status) }}</div>
            </div>
            
            <div class="order-actions">
              <el-button 
                v-if="orderDetail.status === 1" 
                type="primary" 
                @click="openShipDialog"
              >发货</el-button>
              <el-button 
                v-if="orderDetail.status === 0" 
                type="warning" 
                @click="handleCancelOrder"
              >取消订单</el-button>
              <el-button 
                type="info" 
                plain 
                @click="openNoteDialog"
              >修改备注</el-button>
            </div>
          </div>
          
          <div class="order-steps">
            <el-steps :active="getOrderStepActive(orderDetail.status)" finish-status="success">
              <el-step title="提交订单" :description="orderDetail.createTime" />
              <el-step title="付款成功" :description="orderDetail.payTime || '未支付'" />
              <el-step title="商品发货" :description="orderDetail.deliveryTime || '未发货'" />
              <el-step title="交易完成" :description="orderDetail.completeTime || '未完成'" />
            </el-steps>
          </div>
        </el-card>
        
        <!-- 订单信息卡片 -->
        <div class="card-group">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span>订单信息</span>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="订单编号">{{ orderDetail.orderNo }}</el-descriptions-item>
              <el-descriptions-item label="下单时间">{{ orderDetail.createTimeStr }}</el-descriptions-item>
              <el-descriptions-item label="支付方式">{{ orderDetail.payTypeDesc }}</el-descriptions-item>
              <el-descriptions-item label="支付时间">{{ orderDetail.payTime || '未支付' }}</el-descriptions-item>
              <el-descriptions-item label="发货时间">{{ orderDetail.deliveryTime || '未发货' }}</el-descriptions-item>
              <el-descriptions-item label="物流单号">
                <span v-if="orderDetail.shippingCode">{{ orderDetail.shippingCode }}</span>
                <span v-else class="empty-text">暂无物流信息</span>
              </el-descriptions-item>
              <el-descriptions-item label="订单备注" :span="2">
                <span v-if="orderDetail.note">{{ orderDetail.note }}</span>
                <span v-else class="empty-text">暂无备注</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
          
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span>收货信息</span>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="收货人">{{ orderDetail.receiverName }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ orderDetail.receiverPhone }}</el-descriptions-item>
              <el-descriptions-item label="收货地址" :span="2">{{ orderDetail.receiverAddress }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>
        
        <!-- 商品信息卡片 -->
        <el-card class="product-card">
          <template #header>
            <div class="card-header">
              <span>商品信息</span>
            </div>
          </template>
          
          <el-table :data="orderDetail.orderItems || []" border style="width: 100%">
            <el-table-column label="商品图片" width="100">
              <template #default="{ row }">
                <el-image 
                  :src="fileStore.getPreviewUrl(row.productImage)" 
                  fit="cover" 
                  style="width: 60px; height: 60px" 
                  :preview-src-list="[fileStore.getPreviewUrl(row.productImage)]"
                />
              </template>
            </el-table-column>
            <el-table-column prop="productName" label="商品名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="productAttr" label="商品规格" width="150" show-overflow-tooltip>
              <template #default="{ row }">
                <span>{{ row.productAttr || '默认规格' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="单价" width="120">
              <template #default="{ row }">
                <span>¥{{ row.price?.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column label="小计" width="120">
              <template #default="{ row }">
                <span class="subtotal">¥{{ row.totalPrice?.toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="order-amount-info">
            <div class="amount-item">
              <span>商品总价：</span>
              <span>¥{{ (orderDetail.totalAmount - orderDetail.freightAmount)?.toFixed(2) }}</span>
            </div>
            <div class="amount-item">
              <span>运费：</span>
              <span>¥{{ orderDetail.freightAmount?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="amount-item">
              <span>订单总价：</span>
              <span class="total-amount">¥{{ orderDetail.totalAmount?.toFixed(2) }}</span>
            </div>
          </div>
        </el-card>
        
        <!-- 订单日志卡片 -->
        <el-card class="log-card" v-if="orderDetail.logs && orderDetail.logs.length > 0">
          <template #header>
            <div class="card-header">
              <span>订单日志</span>
            </div>
          </template>
          
          <el-timeline>
            <el-timeline-item
              v-for="(log, index) in orderDetail.logs"
              :key="index"
              :timestamp="log.createTime"
              :type="getLogType(log.type)"
            >
              {{ log.content }}
              <div v-if="log.operator" class="log-operator">操作人：{{ log.operator }}</div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </template>
      
      <el-empty v-else-if="!loading" description="未找到订单信息" />
    </div>
    
    <!-- 发货对话框 -->
    <el-dialog v-model="dialogVisible.ship" title="订单发货" width="500px">
      <el-form :model="shipForm" :rules="shipRules" ref="shipFormRef" label-width="100px">
        <el-form-item label="订单编号">
          <span>{{ orderDetail?.orderNo }}</span>
        </el-form-item>
        <el-form-item label="收货人">
          <span>{{ orderDetail?.receiverName }}</span>
        </el-form-item>
        <el-form-item label="收货地址">
          <span>{{ orderDetail?.receiverAddress }}</span>
        </el-form-item>
        <el-form-item label="联系电话">
          <span>{{ orderDetail?.receiverPhone }}</span>
        </el-form-item>
        <el-form-item label="物流单号" prop="shippingCode">
          <el-input v-model="shipForm.shippingCode" placeholder="请输入物流单号" />
        </el-form-item>
        <el-form-item label="物流公司">
          <el-select v-model="shipForm.shippingCompany" placeholder="请选择物流公司">
            <el-option label="顺丰速运" value="SF" />
            <el-option label="中通快递" value="ZTO" />
            <el-option label="圆通速递" value="YTO" />
            <el-option label="韵达速递" value="YD" />
            <el-option label="申通快递" value="STO" />
            <el-option label="邮政EMS" value="EMS" />
            <el-option label="京东物流" value="JD" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="dialogVisible.ship = false">取消</el-button>
          <el-button type="primary" @click="submitShipOrder(shipFormRef)">确认发货</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 订单备注对话框 -->
    <el-dialog v-model="dialogVisible.note" title="修改订单备注" width="500px">
      <el-form :model="noteForm" label-width="100px">
        <el-form-item label="订单编号">
          <span>{{ orderDetail?.orderNo }}</span>
        </el-form-item>
        <el-form-item label="当前备注">
          <span>{{ orderDetail?.note || '无' }}</span>
        </el-form-item>
        <el-form-item label="新备注">
          <el-input
            v-model="noteForm.note"
            type="textarea"
            :rows="3"
            placeholder="请输入新的订单备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="dialogVisible.note = false">取消</el-button>
          <el-button type="primary" @click="submitUpdateNote">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useFileStore } from '@/stores/file'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const fileStore = useFileStore()

// 订单详情数据
const orderDetail = ref(null)
const loading = ref(false)

// 对话框控制
const dialogVisible = reactive({
  ship: false,
  note: false
})

// 发货表单
const shipForm = reactive({
  shippingCode: '',
  shippingCompany: ''
})

// 发货表单校验规则
const shipRules = {
  shippingCode: [
    { required: true, message: '请输入物流单号', trigger: 'blur' }
  ]
}

// 备注表单
const noteForm = reactive({
  note: ''
})

// 表单引用
const shipFormRef = ref(null)

// 返回上一页
const goBack = () => {
  router.back()
}

// 加载订单详情
const loadOrderDetail = async () => {
  const orderNo = route.params.orderNo
  if (!orderNo) {
    ElMessage.error('缺少订单编号')
    router.push('/admin/orders')
    return
  }
  
  loading.value = true
  try {
    const result = await adminStore.fetchOrderDetail(orderNo)
    if (!result) {
      ElMessage.error('订单不存在或已被删除')
      setTimeout(() => {
        router.push('/admin/orders')
      }, 1500)
      return
    }
    orderDetail.value = result
    // 预填充备注表单
    noteForm.note = result.note || ''
  } catch (error) {
    console.error('获取订单详情失败', error)
    ElMessage.error('获取订单详情失败：' + (error.message || '未知错误'))
    setTimeout(() => {
      router.push('/admin/orders')
    }, 1500)
  } finally {
    loading.value = false
  }
}

// 获取订单状态文本
const getOrderStatusText = (status) => {
  switch (status) {
    case 0: return '待付款'
    case 1: return '待发货'
    case 2: return '已发货'
    case 3: return '已完成'
    case 4: return '已取消'
    default: return '未知状态'
  }
}

// 获取订单状态描述
const getOrderStatusDesc = (status) => {
  switch (status) {
    case 0: return '买家尚未完成支付，请等待买家支付或提醒买家支付'
    case 1: return '买家已支付，请尽快安排发货'
    case 2: return '商品已发出，等待买家确认收货'
    case 3: return '交易已完成'
    case 4: return '订单已取消'
    default: return ''
  }
}

// 获取订单状态对应的类名
const getOrderStatusClass = (status) => {
  switch (status) {
    case 0: return 'status-pending-payment'
    case 1: return 'status-pending-shipment'
    case 2: return 'status-shipped'
    case 3: return 'status-completed'
    case 4: return 'status-cancelled'
    default: return ''
  }
}

// 获取步骤条激活状态
const getOrderStepActive = (status) => {
  switch (status) {
    case 0: return 1  // 已提交订单
    case 1: return 2  // 已付款
    case 2: return 3  // 已发货
    case 3: return 4  // 已完成
    case 4: return 1  // 已取消（只完成第一步）
    default: return 0
  }
}

// 获取支付方式文本
const getPaymentMethodText = (method) => {
  switch (method) {
    case 1: return '支付宝'
    case 2: return '微信'
    case 3: return '银联'
    case 4: return '货到付款'
    default: return '未支付'
  }
}

// 获取日志类型
const getLogType = (type) => {
  switch (type) {
    case 'create': return 'primary'
    case 'payment': return 'success'
    case 'ship': return 'info'
    case 'complete': return 'success'
    case 'cancel': return 'warning'
    default: return ''
  }
}

// 打开发货对话框
const openShipDialog = () => {
  shipForm.shippingCode = ''
  shipForm.shippingCompany = ''
  dialogVisible.ship = true
}

// 提交发货
const submitShipOrder = async (formEl) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const success = await adminStore.shipOrderWithCode(
          orderDetail.value.orderNo,
          shipForm.shippingCode
        )
        
        if (success) {
          ElMessage.success('订单发货成功')
          dialogVisible.ship = false
          loadOrderDetail()
        }
      } catch (error) {
        console.error('订单发货失败', error)
        ElMessage.error('订单发货失败')
      }
    } else {
      ElMessage.warning('请填写完整的发货信息')
    }
  })
}

// 取消订单
const handleCancelOrder = () => {
  if (!orderDetail.value) return
  
  ElMessageBox.confirm(
    '确定要取消此订单吗？此操作不可恢复',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const success = await adminStore.cancelOrderByAdmin(orderDetail.value.orderNo)
      if (success) {
        ElMessage.success('取消订单成功')
        loadOrderDetail()
      }
    } catch (error) {
      console.error('取消订单失败', error)
      ElMessage.error('取消订单失败')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 打开备注对话框
const openNoteDialog = () => {
  noteForm.note = orderDetail.value.note || ''
  dialogVisible.note = true
}

// 提交更新备注
const submitUpdateNote = async () => {
  if (!orderDetail.value) return
  
  try {
    const success = await adminStore.updateOrderComment(
      orderDetail.value.orderNo,
      noteForm.note
    )
    
    if (success) {
      ElMessage.success('更新订单备注成功')
      dialogVisible.note = false
      loadOrderDetail()
    }
  } catch (error) {
    console.error('更新订单备注失败', error)
    ElMessage.error('更新订单备注失败')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped>
.order-detail-container {
  padding: 20px;
}

.status-card {
  margin-top: 20px;
  margin-bottom: 20px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 4px;
  color: white;
  font-weight: bold;
  margin-bottom: 10px;
}

.status-pending-payment {
  background-color: #F0AD4E;
}

.status-pending-shipment {
  background-color: #F56C6C;
}

.status-shipped {
  background-color: #409EFF;
}

.status-completed {
  background-color: #67C23A;
}

.status-cancelled {
  background-color: #909399;
}

.status-desc {
  color: #606266;
  font-size: 14px;
}

.order-steps {
  margin-top: 30px;
}

.card-group {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.info-card {
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-text {
  color: #909399;
  font-style: italic;
}

.product-card {
  margin-bottom: 20px;
}

.order-amount-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-top: 20px;
}

.amount-item {
  margin-bottom: 5px;
}

.total-amount {
  font-size: 18px;
  color: #F56C6C;
  font-weight: bold;
}

.subtotal {
  color: #F56C6C;
}

.log-card {
  margin-bottom: 20px;
}

.log-operator {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

@media (max-width: 768px) {
  .card-group {
    flex-direction: column;
  }
  
  .status-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .order-actions {
    margin-top: 15px;
  }
}
</style> 