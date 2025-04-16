<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useCategoryStore } from '@/stores/category'
import { useFileStore } from '@/stores/file'
import { ElCarousel, ElCarouselItem, ElSkeleton, ElEmpty } from 'element-plus'

// 获取store和router
const productStore = useProductStore()
const categoryStore = useCategoryStore()
const fileStore = useFileStore()
const router = useRouter()

// 状态
const loading = ref({
  hot: false,
  new: false,
  categories: false,
  banners: false
})
const hotProducts = ref([])
const newProducts = ref([])
const categories = ref([])
const banners = ref([])  // 改为空数组，将从热门商品中生成

// 特色分类 - 手动配置一些热门分类
const featuredCategories = ref([
  { id: 6, name: '手机数码', icon: 'MobilePhone', color: '#ff4d4f' },
  { id: 7, name: '电脑办公', icon: 'Laptop', color: '#1890ff' },
  { id: 8, name: '家用电器', icon: 'HomeFilled', color: '#52c41a' },
  { id: 9, name: '服饰鞋包', icon: 'ShoppingBag', color: '#722ed1' },
  { id: 10, name: '美妆护肤', icon: 'Medal', color: '#eb2f96' },
  { id: 11, name: '食品生鲜', icon: 'Food', color: '#fa8c16' },
  { id: 12, name: '图书文具', icon: 'Reading', color: '#13c2c2' },
  { id: 13, name: '运动户外', icon: 'Football', color: '#2f54eb' }
])

// 加载热卖商品
const loadHotProducts = async () => {
  loading.value.hot = true
  try {
    const products = await productStore.fetchHotProducts(8)
    hotProducts.value = products
    
    // 生成轮播图数据
    generateBanners(products)
  } catch (error) {
    console.error('获取热卖商品失败', error)
  } finally {
    loading.value.hot = false
  }
}

// 从热门商品生成轮播图数据
const generateBanners = (products) => {
  loading.value.banners = true
  try {
    // 选取前3个热门商品作为轮播图内容
    const topProducts = products.slice(0, 3)
    banners.value = topProducts.map(product => ({
      id: product.id,
      title: product.name,
      subtitle: product.brief || '热卖商品，限时优惠',
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      link: `/product/${product.id}`
    }))
  } catch (error) {
    console.error('生成轮播图数据失败', error)
    // 使用默认轮播图作为备选
    banners.value = [
      {
        id: 1,
        title: '数码精品',
        subtitle: '发现科技新生活',
        image: '/uploads/banner1.jpg',
        link: '/category/6'
      },
      {
        id: 2,
        title: '新品上市',
        subtitle: '发现最新上架的精选商品',
        image: '/uploads/banner2.jpg',
        link: '/new'
      },
      {
        id: 3,
        title: '热卖商品',
        subtitle: '最受欢迎的精选商品',
        image: '/uploads/banner3.jpg',
        link: '/hot'
      }
    ]
  } finally {
    loading.value.banners = false
  }
}

// 加载新品上市
const loadNewProducts = async () => {
  loading.value.new = true
  try {
    const products = await productStore.fetchNewProducts(8)
    newProducts.value = products
  } catch (error) {
    console.error('获取新品上市失败', error)
  } finally {
    loading.value.new = false
  }
}

// 加载分类
const loadCategories = async () => {
  loading.value.categories = true
  try {
    await categoryStore.fetchCategoryTree()
    categories.value = categoryStore.topCategories
  } catch (error) {
    console.error('获取分类失败', error)
  } finally {
    loading.value.categories = false
  }
}

// 获取图片URL
const getImageUrl = (imageUrl) => {
  return fileStore.getPreviewUrl(imageUrl)
}

// 前往商品详情页
const goToProductDetail = (productId) => {
  if (productId) {
    router.push(`/product/${productId}`)
  }
}

// 前往分类页面
const goToCategory = (categoryId) => {
  if (categoryId) {
    router.push(`/category/${categoryId}`)
  }
}

// 前往页面
const goToPage = (link) => {
  if (link) {
    router.push(link)
  }
}

// 格式化价格
const formatPrice = (price, originalPrice) => {
  return productStore.formatPrice(price, originalPrice)
}

// 计算折扣
const calculateDiscount = (price, originalPrice) => {
  return productStore.calculateDiscount(price, originalPrice)
}

// 页面挂载时加载数据
onMounted(() => {
  loadHotProducts()
  loadNewProducts()
  loadCategories()
})
</script>

<template>
  <div class="home-container">
    <!-- 主横幅轮播图 -->
    <div class="banner-section">
      <div v-if="loading.banners" class="loading-container banner-loading">
        <el-skeleton :rows="2" animated style="height: 400px;" />
      </div>
      <el-carousel v-else height="400px" :interval="5000" arrow="always" indicator-position="outside">
        <el-carousel-item v-for="banner in banners" :key="banner.id" @click="goToPage(banner.link)">
          <div class="banner-item" :style="`background-image: url(${getImageUrl(banner.image)})`">
            <div class="banner-content">
              <h2 class="banner-title">{{ banner.title }}</h2>
              <p class="banner-subtitle">{{ banner.subtitle }}</p>
              <div v-if="banner.price" class="banner-price">
                <span class="current-price">¥{{ banner.price }}</span>
                <span v-if="banner.originalPrice && banner.originalPrice > banner.price" class="original-price">¥{{ banner.originalPrice }}</span>
                <span v-if="calculateDiscount(banner.price, banner.originalPrice)" class="discount-label">
                  {{ calculateDiscount(banner.price, banner.originalPrice) }}
                </span>
              </div>
              <button class="banner-btn">立即查看</button>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>



    <!-- 热卖商品 -->
    <div class="product-section">
      <div class="section-header">
        <h2 class="section-title">热卖商品</h2>
        <router-link to="/hot" class="view-more">查看更多 &gt;</router-link>
      </div>

      <div v-if="loading.hot" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="hotProducts.length === 0" class="empty-container">
        <el-empty description="暂无热卖商品" />
      </div>

      <div v-else class="products-grid">
        <div 
          v-for="product in hotProducts" 
          :key="product.id" 
          class="product-card"
          @click="goToProductDetail(product.id)"
        >
          <div class="product-img">
            <img :src="getImageUrl(product.image)" :alt="product.name">
            <div v-if="calculateDiscount(product.price, product.originalPrice)" class="discount-tag">
              {{ calculateDiscount(product.price, product.originalPrice) }}
            </div>
            <div class="hot-tag">热卖</div>
          </div>
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-brief">{{ product.brief }}</p>
            <div class="product-price" v-html="formatPrice(product.price, product.originalPrice)"></div>
            <div class="product-sales">
              <span>销量: {{ product.sales || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- 新品上市 -->
    <div class="product-section">
      <div class="section-header">
        <h2 class="section-title">新品上市</h2>
        <router-link to="/new" class="view-more">查看更多 &gt;</router-link>
      </div>

      <div v-if="loading.new" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="newProducts.length === 0" class="empty-container">
        <el-empty description="暂无新品上市" />
      </div>

      <div v-else class="products-grid">
        <div 
          v-for="product in newProducts" 
          :key="product.id" 
          class="product-card"
          @click="goToProductDetail(product.id)"
        >
          <div class="product-img">
            <img :src="getImageUrl(product.image)" :alt="product.name">
            <div v-if="calculateDiscount(product.price, product.originalPrice)" class="discount-tag">
              {{ calculateDiscount(product.price, product.originalPrice) }}
            </div>
            <div class="new-tag">新品</div>
          </div>
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-brief">{{ product.brief }}</p>
            <div class="product-price" v-html="formatPrice(product.price, product.originalPrice)"></div>
            <div class="product-sales">
              <span>销量: {{ product.sales || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 轮播图样式 */
.banner-section {
  margin-bottom: 40px;
}

.banner-loading {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-item {
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.banner-content {
  padding: 30px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  margin-left: 60px;
  max-width: 350px;
}

.banner-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.banner-subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 15px;
}

.banner-price {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-price {
  font-size: 24px;
  font-weight: bold;
  color: #ff4d4f;
}

.original-price {
  font-size: 16px;
  color: #999;
  text-decoration: line-through;
}

.discount-label {
  background-color: #ff4d4f;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.banner-btn {
  padding: 8px 20px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.banner-btn:hover {
  background-color: #ff7875;
}

/* 分类导航样式 */
.category-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
  position: relative;
  padding-left: 15px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 5px;
  height: 20px;
  width: 5px;
  background-color: #ff4d4f;
  border-radius: 2px;
}

.category-nav {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 15px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
}

.category-item:hover {
  transform: translateY(-5px);
}

.category-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  margin-bottom: 8px;
}

.category-name {
  font-size: 14px;
  color: #333;
}

/* 商品区域样式 */
.product-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.view-more {
  font-size: 14px;
  color: #999;
  text-decoration: none;
}

.view-more:hover {
  color: #ff4d4f;
}

.loading-container {
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.empty-container {
  padding: 60px 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.product-img {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-img img {
  transform: scale(1.05);
}

.discount-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ff4d4f;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.hot-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #ff7a45;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.new-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #52c41a;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.product-info {
  padding: 15px;
}

.product-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  height: 44px;
}

.product-brief {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  height: 42px;
}

.product-price {
  font-size: 18px;
  font-weight: bold;
  color: #ff4d4f;
}

.product-sales {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}

/* 促销广告位 */
.promo-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 40px;
}

.promo-item {
  height: 180px;
  background-color: #f8f8f8;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 30px;
  transition: all 0.3s;
  background-size: cover;
  background-position: center;
}

.promo-item:first-child {
  background-image: linear-gradient(to right, #fa541c, #ff85c0);
}

.promo-item:last-child {
  background-image: linear-gradient(to right, #1890ff, #13c2c2);
}

.promo-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.promo-content {
  color: white;
  max-width: 60%;
}

.promo-content h3 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.promo-content p {
  font-size: 14px;
  margin-bottom: 15px;
}

.promo-content button {
  padding: 6px 15px;
  background-color: white;
  color: #333;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.promo-content button:hover {
  opacity: 0.9;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .category-nav {
    grid-template-columns: repeat(4, 1fr);
    row-gap: 20px;
  }
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .category-nav {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .promo-section {
    grid-template-columns: 1fr;
  }
  
  .banner-content {
    margin-left: 30px;
    max-width: 300px;
  }
}

@media (max-width: 576px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .category-nav {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .banner-content {
    margin-left: 20px;
    padding: 20px;
    max-width: 250px;
  }
  
  .banner-title {
    font-size: 22px;
  }
  
  .banner-subtitle {
    font-size: 14px;
  }
  
  .banner-price {
    flex-wrap: wrap;
  }
  
  .current-price {
    font-size: 20px;
  }
}
</style>


