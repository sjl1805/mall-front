<template>
  <div class="product-manage-container">

    
    <!-- 商品列表 -->
    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <span>商品列表</span>
          <div class="button-group">
            <el-button type="primary" :icon="Plus" @click="handleAddProduct">添加商品</el-button>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="productList"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image 
              :src="getPreviewUrl(row.image)" 
              fit="cover" 
              style="width: 50px; height: 50px"
              :preview-src-list="[getPreviewUrl(row.image)]"
            />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="100" show-overflow-tooltip />
        <el-table-column label="价格" width="120">
          <template #default="{ row }">
            <div class="price-tag">{{ formatPrice(row.price) }}</div>
            <div class="original-price" v-if="row.originalPrice">{{ formatPrice(row.originalPrice) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sales" label="销量" width="100" sortable />
        <el-table-column prop="createTime" label="创建时间" width="180" show-overflow-tooltip />
        <el-table-column fixed="right" label="操作" width="250">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewProduct(row.id)">详情</el-button>
            <el-button type="primary" link @click="handleEditProduct(row.id)">编辑</el-button>
            <el-dropdown trigger="click">
              <el-button type="primary" link>
                更多<el-icon class="el-icon--right"><More /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleUpdateStatus(row)">
                    {{ row.status === 1 ? '下架' : '上架' }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleUpdateStock(row)">
                    修改库存
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleUpdatePrice(row)">
                    修改价格
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleDeleteProduct(row.id)" style="color: #F56C6C">
                    删除商品
                  </el-dropdown-item>
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
    
    <!-- 修改库存对话框 -->
    <el-dialog v-model="dialogVisible.stock" title="修改库存" width="400px">
      <el-form :model="stockForm" label-width="80px">
        <el-form-item label="商品名称">
          <span>{{ currentProduct.name }}</span>
        </el-form-item>
        <el-form-item label="当前库存">
          <span>{{ currentProduct.stock }}</span>
        </el-form-item>
        <el-form-item label="新库存">
          <el-input-number v-model="stockForm.stock" :min="0" :precision="0" :step="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="dialogVisible.stock = false">取消</el-button>
          <el-button type="primary" @click="submitUpdateStock">确认</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 修改价格对话框 -->
    <el-dialog v-model="dialogVisible.price" title="修改价格" width="400px">
      <el-form :model="priceForm" label-width="80px">
        <el-form-item label="商品名称">
          <span>{{ currentProduct.name }}</span>
        </el-form-item>
        <el-form-item label="当前价格">
          <span>{{ formatPrice(currentProduct.price) }}</span>
        </el-form-item>
        <el-form-item label="当前原价" v-if="currentProduct.originalPrice">
          <span>{{ formatPrice(currentProduct.originalPrice) }}</span>
        </el-form-item>
        <el-form-item label="新价格">
          <el-input-number v-model="priceForm.price" :min="0" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="新原价">
          <el-input-number v-model="priceForm.originalPrice" :min="0" :precision="2" :step="0.1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="dialogVisible.price = false">取消</el-button>
          <el-button type="primary" @click="submitUpdatePrice">确认</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 商品详情对话框 -->
    <el-dialog v-model="dialogVisible.detail" title="商品详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="商品ID">{{ productDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ productDetail.name }}</el-descriptions-item>
        <el-descriptions-item label="商品分类">{{ productDetail.categoryName }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ productDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="价格">{{ formatPrice(productDetail.price) }}</el-descriptions-item>
        <el-descriptions-item label="原价">{{ productDetail.originalPrice ? formatPrice(productDetail.originalPrice) : '无' }}</el-descriptions-item>
        <el-descriptions-item label="库存">{{ productDetail.stock }}</el-descriptions-item>
        <el-descriptions-item label="销量">{{ productDetail.sales }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="productDetail.status === 1 ? 'success' : 'info'">
            {{ productDetail.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div class="product-detail-section">
        <h3>商品主图</h3>
        <div class="product-image">
          <el-image 
            v-if="productDetail.image" 
            :src="getPreviewUrl(productDetail.image)" 
            fit="cover"
            :preview-src-list="[getPreviewUrl(productDetail.image)]"
          />
          <span v-else>暂无主图</span>
        </div>
      </div>
      <div class="product-detail-section" v-if="productDetail.images && productDetail.images.length > 0">
        <h3>商品图集</h3>
        <div class="product-images-grid">
          <div v-for="(img, index) in productDetail.images" :key="index" class="product-image-item">
            <el-image 
              :src="getPreviewUrl(img)" 
              fit="cover"
              :preview-src-list="productDetail.images.map(url => getPreviewUrl(url))"
            />
          </div>
        </div>
      </div>
      <div class="product-detail-section">
        <h3>商品描述</h3>
        <div v-html="productDetail.description || '暂无描述'" class="product-description"></div>
      </div>
      <template #footer>
        <span>
          <el-button @click="dialogVisible.detail = false">关闭</el-button>
          <el-button type="primary" @click="handleEditProduct(productDetail.id)">编辑</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useFileStore } from '@/stores/file'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, More } from '@element-plus/icons-vue'

const router = useRouter()
const adminStore = useAdminStore()
const fileStore = useFileStore()

// 商品列表数据
const productList = ref([])
const total = ref(0)
const loading = ref(false)
const selectedProducts = ref([])

// 分类数据
const categoryOptions = ref([])

// 当前操作的商品
const currentProduct = ref({})
const productDetail = ref({})

// 对话框控制
const dialogVisible = reactive({
  stock: false,
  price: false,
  detail: false
})

// 表单数据
const stockForm = reactive({
  productId: null,
  stock: 0
})

const priceForm = reactive({
  productId: null,
  price: 0,
  originalPrice: 0
})

// 查询参数
const queryParams = reactive({
  page: 1,
  size: 10,
  keyword: '',
  categoryId: null,
  minPrice: null,
  maxPrice: null,
  status: null
})

// 加载商品列表
const loadProductList = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = { ...queryParams }
    
    // 如果categoryId是数组(来自级联选择器)，取最后一个值
    if (Array.isArray(params.categoryId)) {
      params.categoryId = params.categoryId[params.categoryId.length - 1]
    }
    
    const result = await adminStore.fetchProductList(params)
    productList.value = result.records.map(product => {
      // 为每个商品添加分类名称
      const category = categoryOptions.value.find(cat => cat.id === product.categoryId)
      return {
        ...product,
        categoryName: category ? category.name : '未知分类'
      }
    }) || []
    total.value = result.total || 0
  } catch (error) {
    console.error('加载商品列表失败', error)
    ElMessage.error('加载商品列表失败')
  } finally {
    loading.value = false
  }
}

// 加载分类树
const loadCategories = async () => {
  try {
    const result = await adminStore.fetchCategoryTree()
    console.log('从后端获取的分类数据:', result)
    categoryOptions.value = convertToTree(result || [])
    console.log('构建的分类树:', categoryOptions.value)
  } catch (error) {
    console.error('加载分类数据失败', error)
    ElMessage.error('加载分类数据失败')
  }
}

// 将扁平列表转换为树形结构
const convertToTree = (list) => {
  const map = {}
  const tree = []

  // 首先创建一个以id为键的映射
  list.forEach(item => {
    map[item.id] = { ...item, children: [] }
  })

  // 然后构建树形结构
  list.forEach(item => {
    const node = map[item.id]
    if (item.parentId === 0) {
      // 根节点直接加入树中
      tree.push(node)
    } else {
      // 子节点加入到父节点的children中
      const parent = map[item.parentId]
      if (parent) {
        parent.children.push(node)
      }
    }
  })

  // 对每个层级的节点按sort字段排序
  const sortNodes = (nodes) => {
    nodes.sort((a, b) => a.sort - b.sort)
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children)
      }
    })
  }
  sortNodes(tree)

  return tree
}

// 选择变更处理
const handleSelectionChange = (selection) => {
  selectedProducts.value = selection
}

// 重置查询条件
const resetQuery = () => {
  queryParams.keyword = ''
  queryParams.categoryId = null
  queryParams.minPrice = null
  queryParams.maxPrice = null
  queryParams.status = null
  queryParams.page = 1
  loadProductList()
}

// 格式化价格
const formatPrice = (price) => {
  if (price === undefined || price === null) {
    return '¥0.00'
  }
  return `¥${parseFloat(price).toFixed(2)}`
}

// 处理分页变化
const handlePageChange = (page) => {
  queryParams.page = page
  loadProductList()
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  queryParams.size = size
  queryParams.page = 1
  loadProductList()
}

// 添加商品
const handleAddProduct = () => {
  router.push('/admin/product/add')
}

// 查看商品详情
const handleViewProduct = async (productId) => {
  try {
    productDetail.value = await adminStore.fetchProductDetail(productId)
    
    // 确保images是数组
    if (productDetail.value.images && !Array.isArray(productDetail.value.images)) {
      productDetail.value.images = productDetail.value.images.split(',').filter(i => i)
    }
    
    dialogVisible.detail = true
  } catch (error) {
    console.error('获取商品详情失败', error)
    ElMessage.error('获取商品详情失败')
  }
}

// 获取图片预览URL
const getPreviewUrl = (url) => {
  return fileStore.getPreviewUrl(url)
}

// 获取图片预览URL
const getIconUrl = (url) => {
  const fullUrl = fileStore.getPreviewUrl(url)
  console.log('生成的图标URL:', fullUrl)
  return fullUrl
}

// 编辑商品
const handleEditProduct = (productId) => {
  router.push(`/admin/product/edit/${productId}`)
}

// 删除商品
const handleDeleteProduct = (productId) => {
  ElMessageBox.confirm(
    '确定要删除此商品吗？此操作不可恢复',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const success = await adminStore.removeProduct(productId)
      if (success) {
        ElMessage.success('删除成功')
        loadProductList()
      }
    } catch (error) {
      console.error('删除商品失败', error)
      ElMessage.error('删除商品失败')
    }
  }).catch(() => {
    // 取消删除操作
  })
}

// 更新商品状态
const handleUpdateStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const statusText = newStatus === 1 ? '上架' : '下架'
  
  ElMessageBox.confirm(
    `确定要${statusText}该商品吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const success = await adminStore.changeProductStatus(row.id, newStatus)
      if (success) {
        ElMessage.success(`${statusText}成功`)
        // 直接更新当前行的状态，不需要重新加载整个列表
        row.status = newStatus
      }
    } catch (error) {
      console.error(`${statusText}商品失败`, error)
      ElMessage.error(`${statusText}商品失败`)
    }
  }).catch(() => {
    // 取消操作
  })
}

// 打开修改库存对话框
const handleUpdateStock = (row) => {
  currentProduct.value = row
  stockForm.productId = row.id
  stockForm.stock = row.stock
  dialogVisible.stock = true
}

// 提交修改库存
const submitUpdateStock = async () => {
  try {
    const success = await adminStore.updateProductStockCount(
      stockForm.productId,
      stockForm.stock
    )
    if (success) {
      ElMessage.success('修改库存成功')
      dialogVisible.stock = false
      
      // 更新当前行的库存，不需要重新加载整个列表
      const product = productList.value.find(item => item.id === stockForm.productId)
      if (product) {
        product.stock = stockForm.stock
      }
    }
  } catch (error) {
    console.error('修改库存失败', error)
    ElMessage.error('修改库存失败')
  }
}

// 打开修改价格对话框
const handleUpdatePrice = (row) => {
  currentProduct.value = row
  priceForm.productId = row.id
  priceForm.price = row.price
  priceForm.originalPrice = row.originalPrice || 0
  dialogVisible.price = true
}

// 提交修改价格
const submitUpdatePrice = async () => {
  try {
    const success = await adminStore.updateProductPriceInfo(
      priceForm.productId,
      priceForm.price,
      priceForm.originalPrice > 0 ? priceForm.originalPrice : undefined
    )
    if (success) {
      ElMessage.success('修改价格成功')
      dialogVisible.price = false
      
      // 更新当前行的价格，不需要重新加载整个列表
      const product = productList.value.find(item => item.id === priceForm.productId)
      if (product) {
        product.price = priceForm.price
        product.originalPrice = priceForm.originalPrice > 0 ? priceForm.originalPrice : null
      }
    }
  } catch (error) {
    console.error('修改价格失败', error)
    ElMessage.error('修改价格失败')
  }
}

// 批量操作
const handleBatchOperation = (status) => {
  if (selectedProducts.value.length === 0) {
    ElMessage.warning('请至少选择一个商品')
    return
  }
  
  const statusText = status === 1 ? '上架' : '下架'
  const productIds = selectedProducts.value.map(item => item.id)
  
  ElMessageBox.confirm(
    `确定要批量${statusText}选中的${selectedProducts.value.length}个商品吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const success = await adminStore.batchChangeProductStatus(productIds, status)
      if (success) {
        ElMessage.success(`批量${statusText}成功`)
        // 重新加载商品列表
        await loadProductList()
      }
    } catch (error) {
      console.error(`批量${statusText}商品失败`, error)
      ElMessage.error(`批量${statusText}商品失败`)
    }
  }).catch(() => {
    // 取消操作
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadProductList()
  loadCategories()
})
</script>

<style scoped>
.product-manage-container {
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

.button-group {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.price-input {
  width: 120px;
}

.price-separator {
  margin: 0 5px;
}

.price-tag {
  font-weight: bold;
  color: #F56C6C;
}

.original-price {
  font-size: 12px;
  color: #909399;
  text-decoration: line-through;
}

.product-detail-section {
  margin-top: 20px;
}

.product-detail-section h3 {
  font-size: 16px;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #EBEEF5;
}

.product-image {
  width: 200px;
  height: 200px;
  overflow: hidden;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
}

.product-image .el-image {
  width: 100%;
  height: 100%;
}

.product-images-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.product-image-item {
  width: 100%;
  height: 150px;
  overflow: hidden;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
}

.product-image-item .el-image {
  width: 100%;
  height: 100%;
}

.product-description {
  padding: 10px;
  background-color: #F5F7FA;
  border-radius: 4px;
  min-height: 100px;
}

@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
  }
  
  .product-images-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 