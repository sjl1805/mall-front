<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFavoriteStore } from '@/stores/favorite'
import { useFileStore } from '@/stores/file'
import { ElMessage, ElMessageBox } from 'element-plus'

// 引入图标
import { Star, Delete, ShoppingCart, View, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const favoriteStore = useFavoriteStore()
const fileStore = useFileStore()

// 收藏列表
const favoriteList = computed(() => favoriteStore.favorites)
const isLoading = computed(() => favoriteStore.loading)
const total = computed(() => favoriteStore.total)
const currentPage = ref(1)
const pageSize = ref(12)
const emptyText = ref('您还没有收藏任何商品')
const listLayout = ref('grid') // grid或list视图

// 获取收藏列表
const fetchFavorites = async () => {
  try {
    await favoriteStore.fetchFavorites(currentPage.value, pageSize.value)
    console.log('获取到的收藏列表:', favoriteStore.favorites)
    // 检查收藏项中的图片路径
    if (favoriteStore.favorites && favoriteStore.favorites.length > 0) {
      console.log('第一个收藏项:', favoriteStore.favorites[0])
      console.log('图片路径:', favoriteStore.favorites[0].image)
      console.log('转换后的图片URL:', getImageUrl(favoriteStore.favorites[0].image))
    }
  } catch (error) {
    console.error('获取收藏列表失败:', error)
  }
}

// 切换页码
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchFavorites()
}

// 切换每页显示数量
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1 // 重置为第一页
  fetchFavorites()
}

// 获取商品图片URL
const getImageUrl = (imageUrl) => {
  // 处理null或undefined情况
  if (!imageUrl) return '/images/default-product.png'
  
  // 对可能的相对路径进行特殊处理，确保路径格式正确
  if (imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
    imageUrl = '/' + imageUrl;
  }
  
  // 使用fileStore处理图片URL
  return fileStore.getPreviewUrl(imageUrl)
}

// 跳转到商品详情
const goToProduct = (productId) => {
  router.push(`/product/${productId}`)
}

// 添加到购物车
const addToCart = (product) => {
  ElMessage.success(`已将 ${product.name || '商品'} 加入购物车`)
  // 这里可以调用购物车相关的方法
}

// 取消收藏
const cancelFavorite = (productId) => {
  ElMessageBox.confirm('确定要取消收藏该商品吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const success = await favoriteStore.removeFromFavorite(productId)
    if (success) {
      // 如果当前页面删除空了，且不是第一页，则跳转到前一页
      if (favoriteList.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
        fetchFavorites()
      }
    }
  }).catch(() => {})
}

// 清空收藏夹
const clearAllFavorites = () => {
  if (favoriteList.value.length === 0) {
    return ElMessage.warning('收藏夹已经是空的了')
  }
  
  ElMessageBox.confirm('确定要清空收藏夹吗？此操作不可恢复！', '警告', {
    confirmButtonText: '确定清空',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    // 依次删除所有收藏
    const promises = favoriteList.value.map(item => 
      favoriteStore.removeFromFavorite(item.id)
    )
    
    try {
      await Promise.all(promises)
      ElMessage.success('已清空收藏夹')
      currentPage.value = 1
      fetchFavorites()
    } catch (error) {
      console.error('清空收藏夹失败', error)
      ElMessage.error('清空收藏夹失败')
    }
  }).catch(() => {})
}

// 切换布局视图
const toggleLayout = () => {
  listLayout.value = listLayout.value === 'grid' ? 'list' : 'grid'
}

// 格式化时间
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

// 组件挂载时获取数据
onMounted(() => {
  fetchFavorites()
})
</script>

<template>
  <div class="favorites-container">
    <div class="page-header">
      <h2 class="page-title">我的收藏</h2>
      <div class="page-actions">
        <el-button @click="toggleLayout" type="primary" plain>
          {{ listLayout === 'grid' ? '列表视图' : '网格视图' }}
        </el-button>
        <el-button @click="clearAllFavorites" type="danger" plain>清空收藏</el-button>
      </div>
    </div>
    
    <div class="favorites-content" v-loading="isLoading">
      <!-- 空状态 -->
      <div v-if="favoriteList.length === 0" class="empty-favorites">
        <el-empty :description="emptyText" :image-size="120">
          <el-button type="primary" @click="router.push('/products')">去逛逛</el-button>
        </el-empty>
      </div>
      
      <!-- 网格视图 -->
      <div v-else-if="listLayout === 'grid'" class="favorites-grid">
        <div 
          v-for="item in favoriteList" 
          :key="item.id" 
          class="favorite-card"
        >
          <div class="product-img" @click="goToProduct(item.id)">
            <img 
              :src="getImageUrl(item.image)" 
              :alt="item.productName"
              @error="(e) => e.target.src = '/images/default-product.png'"
            >
          </div>
          <div class="product-info">
            <h3 class="product-name" @click="goToProduct(item.id)">{{ item.name }}</h3>
            <div class="product-price">¥{{ item.price ? item.price.toFixed(2) : '0.00' }}</div>
            <div class="favorite-time">收藏于: {{ formatDate(item.createTime) }}</div>
            <div class="card-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="goToProduct(item.id)"
                :icon="View"
              >
                查看
              </el-button>
              <el-button 
                type="success" 
                size="small" 
                @click="addToCart(item)"
                :icon="ShoppingCart"
              >
                加入购物车
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="cancelFavorite(item.id)"
                :icon="Delete"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 列表视图 -->
      <div v-else>
        <el-table :data="favoriteList" style="width: 100%" border>
          <el-table-column label="商品信息" min-width="400">
            <template #default="scope">
              <div class="product-table-info">
                <div class="product-table-img" @click="goToProduct(scope.row.id)">
                  <img 
                    :src="getImageUrl(scope.row.image)" 
                    :alt="scope.row.productName"
                    @error="(e) => e.target.src = '/images/default-product.png'"
                  >
                </div>
                <div class="product-table-content">
                  <div class="product-table-name" @click="goToProduct(scope.row.id)">
                    {{ scope.row.name }}
                  </div>
                  <div class="product-table-price">¥{{ scope.row.price ? scope.row.price.toFixed(2) : '0.00' }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="收藏时间" width="180" prop="createTime">
            <template #default="scope">
              {{ formatDate(scope.row.createTime) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="250" align="center">
            <template #default="scope">
              <el-button-group>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="goToProduct(scope.row.id)"
                >
                  查看
                </el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  @click="addToCart(scope.row)"
                >
                  加入购物车
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="cancelFavorite(scope.row.id)"
                >
                  删除
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 48, 96]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-container {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 10px;
}

.empty-favorites {
  padding: 60px 0;
  text-align: center;
}

/* 网格视图样式 */
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.favorite-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.favorite-card:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-5px);
}

.product-img {
  height: 200px;
  overflow: hidden;
  cursor: pointer;
}

.product-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.favorite-card:hover .product-img img {
  transform: scale(1.05);
}

.product-info {
  padding: 15px;
}

.product-name {
  margin: 0 0 10px;
  font-size: 1rem;
  color: #333;
  cursor: pointer;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 2.4em;
  line-height: 1.2;
}

.product-name:hover {
  color: var(--el-color-primary);
}

.product-price {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ff6b6b;
  margin-bottom: 10px;
}

.favorite-time {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 15px;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

/* 列表视图样式 */
.product-table-info {
  display: flex;
  align-items: center;
}

.product-table-img {
  width: 70px;
  height: 70px;
  overflow: hidden;
  border-radius: 4px;
  margin-right: 15px;
  cursor: pointer;
  flex-shrink: 0;
}

.product-table-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-table-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.product-table-name {
  font-size: 0.95rem;
  margin-bottom: 5px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-table-name:hover {
  color: var(--el-color-primary);
}

.product-table-price {
  font-size: 1rem;
  font-weight: bold;
  color: #ff6b6b;
}

/* 分页容器 */
.pagination-container {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .favorites-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .page-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .product-img {
    height: 160px;
  }
  
  .card-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .card-actions .el-button {
    width: 100%;
  }
}
</style> 