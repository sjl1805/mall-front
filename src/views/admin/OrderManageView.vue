<template>
  <div class="order-manage-container">
    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <span>订单管理</span>
        </div>
      </template>
      
      <!-- 搜索表单 -->
      <el-form :model="queryParams" inline>
        <el-form-item label="订单编号">
          <el-input v-model="queryParams.orderNo" placeholder="请输入订单编号" clearable />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="queryParams.status" placeholder="请选择订单状态" clearable>
            <el-option label="待付款" :value="0" />
            <el-option label="待发货" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadOrderList">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="success" :icon="Download" @click="handleExportOrders">导出订单</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 订单统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-card-content">
            <div class="stat-icon pending-payment">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">待付款</div>
              <div class="stat-value">{{ orderStatusCount.pendingPayment || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-card-content">
            <div class="stat-icon pending-shipment">
              <el-icon><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">待发货</div>
              <div class="stat-value">{{ orderStatusCount.pendingShipment || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-card-content">
            <div class="stat-icon shipped">
              <el-icon><Van /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">已发货</div>
              <div class="stat-value">{{ orderStatusCount.shipped || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-card-content">
            <div class="stat-icon completed">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">已完成</div>
              <div class="stat-value">{{ orderStatusCount.completed || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 订单列表 -->
    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="orderList"
        border
        style="width: 100%"
      >
        <el-table-column prop="orderNo" label="订单编号" min-width="200" show-overflow-tooltip />
        <el-table-column label="订单金额" width="120">
          <template #default="{ row }">
            <span class="order-amount">¥{{ row.totalAmount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收货人" width="120">
          <template #default="{ row }">
            <span>{{ row.receiverName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="联系电话" width="140">
          <template #default="{ row }">
            <span>{{ row.receiverPhone }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getOrderStatusType(row.status)">
              {{ getOrderStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="100">
          <template #default="{ row }">
            <span>{{ row.status === 0 ? '未支付' : row.payTypeDesc || '微信' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" show-overflow-tooltip />
        <el-table-column fixed="right" label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewOrder(row.orderNo)">详情</el-button>
            <el-dropdown trigger="click" @command="command => handleOrderCommand(command, row)">
              <el-button type="primary" link>
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="row.status === 1" command="ship">发货</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 0" command="cancel">取消订单</el-dropdown-item>
                  <el-dropdown-item command="note">修改备注</el-dropdown-item>
                  <el-dropdown-item command="print">打印订单</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    
    <!-- 发货对话框 -->
    <el-dialog v-model="dialogVisible.ship" title="订单发货" width="500px">
      <el-form :model="shipForm" :rules="shipRules" ref="shipFormRef" label-width="100px">
        <el-form-item label="订单编号">
          <span>{{ currentOrder.orderNo }}</span>
        </el-form-item>
        <el-form-item label="收货人">
          <span>{{ currentOrder.receiverName }}</span>
        </el-form-item>
        <el-form-item label="收货地址">
          <span>{{ currentOrder.receiverAddress }}</span>
        </el-form-item>
        <el-form-item label="联系电话">
          <span>{{ currentOrder.receiverPhone }}</span>
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
          <span>{{ currentOrder.orderNo }}</span>
        </el-form-item>
        <el-form-item label="当前备注">
          <span>{{ currentOrder.note || '无' }}</span>
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
    
    <!-- 打印订单 -->
    <div ref="printRef" class="print-container" v-if="printVisible">
      <div class="print-header">
        <h1>订单详情</h1>
      </div>
      <div class="print-section">
        <h2>订单信息</h2>
        <table class="print-table">
          <tr>
            <td width="20%">订单编号：</td>
            <td width="30%">{{ printOrder.orderNo }}</td>
            <td width="20%">创建时间：</td>
            <td width="30%">{{ printOrder.createTime }}</td>
          </tr>
          <tr>
            <td>订单状态：</td>
            <td>{{ getOrderStatusText(printOrder.status) }}</td>
            <td>支付方式：</td>
            <td>{{ getPaymentMethodText(printOrder.paymentMethod) ||'微信'}}</td>
          </tr>
          <tr>
            <td>支付时间：</td>
            <td>{{ printOrder.payTime || '未支付' }}</td>
            <td>订单金额：</td>
            <td>¥{{ printOrder.totalAmount?.toFixed(2) }}</td>
          </tr>
        </table>
      </div>
      <div class="print-section">
        <h2>收货信息</h2>
        <table class="print-table">
          <tr>
            <td width="20%">收货人：</td>
            <td width="30%">{{ printOrder.receiverName }}</td>
            <td width="20%">联系电话：</td>
            <td width="30%">{{ printOrder.receiverPhone }}</td>
          </tr>
          <tr>
            <td>收货地址：</td>
            <td colspan="3">{{ printOrder.receiverAddress }}</td>
          </tr>
        </table>
      </div>
      <div class="print-section">
        <h2>商品信息</h2>
        <table class="print-table print-product-table">
          <tr>
            <th>商品名称</th>
            <th>规格</th>
            <th>单价</th>
            <th>数量</th>
            <th>小计</th>
          </tr>
          <template v-if="printOrder.orderItems && printOrder.orderItems.length > 0">
            <tr v-for="(item, index) in printOrder.orderItems" :key="index">
              <td>{{ item.productName }}</td>
              <td>{{ item.productAttr || '默认规格' }}</td>
              <td>¥{{ item.price?.toFixed(2) }}</td>
              <td>{{ item.quantity }}</td>
              <td>¥{{ (item.price * item.quantity)?.toFixed(2) }}</td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="5" style="text-align: center;">暂无商品信息</td>
          </tr>
        </table>
      </div>
      <div class="print-footer">
        <p>打印时间：{{ new Date().toLocaleString() }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Download, Money, Box, Van, CircleCheck, ArrowDown } from '@element-plus/icons-vue'
import { usePrint } from '@/utils/print'

const router = useRouter()
const adminStore = useAdminStore()
const { printRef, print } = usePrint()

// 订单列表数据
const orderList = ref([])
const total = ref(0)
const loading = ref(false)

// 订单统计数据
const orderStatusCount = reactive({
  pendingPayment: 0,  // 待付款
  pendingShipment: 0, // 待发货
  shipped: 0,        // 已发货
  completed: 0,      // 已完成
  cancelled: 0       // 已取消
})

// 当前操作的订单
const currentOrder = ref({})

// 日期范围
const dateRange = ref([])

// 查询参数
const queryParams = reactive({
  page: 1,
  size: 10,
  orderNo: '',
  status: null,
  startTime: '',
  endTime: ''
})

// 对话框控制
const dialogVisible = reactive({
  ship: false,
  note: false
})

// 发货表单
const shipForm = reactive({
  orderNo: '',
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
  orderNo: '',
  note: ''
})

// 打印相关
const printVisible = ref(false)
const printOrder = ref({})

// 表单引用
const shipFormRef = ref(null)

// 加载订单列表
const loadOrderList = async () => {
  loading.value = true
  try {
    // 处理日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      queryParams.startTime = dateRange.value[0]
      queryParams.endTime = dateRange.value[1]
    } else {
      queryParams.startTime = ''
      queryParams.endTime = ''
    }
    
    const result = await adminStore.fetchOrderList(queryParams)
    orderList.value = result.records || []
    total.value = result.total || 0
  } catch (error) {
    console.error('加载订单列表失败', error)
    ElMessage.error('加载订单列表失败')
  } finally {
    loading.value = false
  }
}

// 加载订单状态分布
const loadOrderStatusDistribution = async () => {
  try {
    const result = await adminStore.fetchOrderStatusDistribution()
    if (Array.isArray(result)) {
      result.forEach(item => {
        switch (item.status) {
          case 0:
            orderStatusCount.pendingPayment = item.count
            break
          case 1:
            orderStatusCount.pendingShipment = item.count
            break
          case 2:
            orderStatusCount.shipped = item.count
            break
          case 3:
            orderStatusCount.completed = item.count
            break
          case 4:
            orderStatusCount.cancelled = item.count
            break
        }
      })
    }
  } catch (error) {
    console.error('加载订单状态分布失败', error)
  }
}

// 重置查询条件
const resetQuery = () => {
  queryParams.orderNo = ''
  queryParams.status = null
  queryParams.page = 1
  dateRange.value = []
  queryParams.startTime = ''
  queryParams.endTime = ''
  loadOrderList()
}

// 处理分页变化
const handlePageChange = (page) => {
  queryParams.page = page
  loadOrderList()
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  queryParams.size = size
  queryParams.page = 1
  loadOrderList()
}

// 查看订单详情
const handleViewOrder = (orderNo) => {
  router.push(`/admin/order/detail/${orderNo}`)
}

// 获取订单状态类型（用于标签样式）
const getOrderStatusType = (status) => {
  switch (status) {
    case 0: return 'warning'  // 待付款
    case 1: return 'danger'   // 待发货
    case 2: return 'primary'  // 已发货
    case 3: return 'success'  // 已完成
    case 4: return 'info'     // 已取消
    default: return 'info'
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

// 获取支付方式文本
const getPaymentMethodText = (method) => {
  // 如果 method 为 undefined 或 null，根据订单状态判断
  if (method === undefined || method === null) {
    return '未支付'
  }
  
  // 确保 method 是数字类型
  const paymentMethod = Number(method)
  
  switch (paymentMethod) {
    case 1: return '支付宝'
    case 2: return '微信'
    case 3: return '银联'
    case 4: return '货到付款'
    case 0: return '未支付'
    default: return '未知方式'
  }
}

// 处理订单操作命令
const handleOrderCommand = (command, row) => {
  currentOrder.value = row
  
  switch (command) {
    case 'ship':
      openShipDialog(row)
      break
    case 'cancel':
      handleCancelOrder(row.orderNo)
      break
    case 'note':
      openNoteDialog(row)
      break
    case 'print':
      handlePrintOrder(row.orderNo)
      break
  }
}

// 打开发货对话框
const openShipDialog = (order) => {
  shipForm.orderNo = order.orderNo
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
          shipForm.orderNo,
          shipForm.shippingCode
        )
        
        if (success) {
          ElMessage.success('订单发货成功')
          dialogVisible.ship = false
          loadOrderList()
          loadOrderStatusDistribution()
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
const handleCancelOrder = (orderNo) => {
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
      const success = await adminStore.cancelOrderByAdmin(orderNo)
      if (success) {
        ElMessage.success('取消订单成功')
        loadOrderList()
        loadOrderStatusDistribution()
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
const openNoteDialog = (order) => {
  noteForm.orderNo = order.orderNo
  noteForm.note = order.note || ''
  dialogVisible.note = true
}

// 提交更新备注
const submitUpdateNote = async () => {
  try {
    const success = await adminStore.updateOrderComment(
      noteForm.orderNo,
      noteForm.note
    )
    
    if (success) {
      ElMessage.success('更新订单备注成功')
      dialogVisible.note = false
      
      // 更新当前行的备注信息
      const order = orderList.value.find(o => o.orderNo === noteForm.orderNo)
      if (order) {
        order.note = noteForm.note
      }
    }
  } catch (error) {
    console.error('更新订单备注失败', error)
    ElMessage.error('更新订单备注失败')
  }
}

// 导出订单
const handleExportOrders = async () => {
  try {
    // 处理日期范围
    const params = {}
    if (queryParams.status !== null) {
      params.status = queryParams.status
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    
    ElMessage.info('订单数据导出中，请稍候...')
    const result = await adminStore.exportOrderData(params)
    
    if (result) {
      // 通常后端会返回文件下载链接或文件流
      // 这里假设返回了下载链接
      if (typeof result === 'string') {
        window.open(result, '_blank')
        ElMessage.success('订单导出成功')
      } else {
        ElMessage.success('订单导出功能已触发，请检查下载列表')
      }
    }
  } catch (error) {
    console.error('导出订单失败', error)
    ElMessage.error('导出订单失败')
  }
}

// 打印订单
const handlePrintOrder = async (orderNo) => {
  try {
    const orderDetail = await adminStore.fetchOrderDetail(orderNo)
    printOrder.value = orderDetail
    printVisible.value = true
    
    // 等待DOM渲染完成后打印
    await nextTick()
    print()
    
    // 打印完成后隐藏打印内容
    setTimeout(() => {
      printVisible.value = false
    }, 1000)
  } catch (error) {
    console.error('获取订单详情失败', error)
    ElMessage.error('获取订单详情失败')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadOrderList()
  loadOrderStatusDistribution()
})
</script>

<style scoped>
.order-manage-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
}

.stat-icon .el-icon {
  font-size: 24px;
  color: white;
}

.pending-payment {
  background-color: #F0AD4E;
}

.pending-shipment {
  background-color: #F56C6C;
}

.shipped {
  background-color: #409EFF;
}

.completed {
  background-color: #67C23A;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.list-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.order-amount {
  font-weight: bold;
  color: #F56C6C;
}

/* 打印样式 */
.print-container {
  display: none;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.print-header {
  text-align: center;
  margin-bottom: 20px;
}

.print-section {
  margin-bottom: 20px;
}

.print-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #ddd;
  margin-bottom: 10px;
}

.print-table td, .print-table th {
  border: 1px solid #ddd;
  padding: 8px;
}

.print-product-table th {
  background-color: #f2f2f2;
}

.print-footer {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 30px;
}

@media print {
  .print-container {
    display: block;
  }
}

@media (max-width: 768px) {
  .stat-row .el-col {
    margin-bottom: 15px;
  }
}
</style> 