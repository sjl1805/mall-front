<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useSearchStore } from '@/stores/search'
import { useCategoryStore } from '@/stores/category'
import { useFileStore } from '@/stores/file'
import { useCartStore } from '@/stores/cart'
import { ElMessage, ElPopover } from 'element-plus'

// 引入图标
import { 
  Search, 
  User, 
  ShoppingCart, 
  Star, 
  Goods, 
  ArrowDown, 
  Expand, 
  Location,
  Message,
  Setting,
  SwitchButton,
  List,
  ShoppingBag,
  Service,
  Phone,
  Iphone
} from '@element-plus/icons-vue'

// 路由和状态
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const searchStore = useSearchStore()
const categoryStore = useCategoryStore()
const fileStore = useFileStore()
const cartStore = useCartStore()
// 搜索相关
const searchKeyword = ref('')
const isSearchFocused = ref(false)
const searchSuggestions = ref([])

// 导航菜单
const activeNavItem = computed(() => route.path)

// 用户菜单显示控制
const userMenuVisible = ref(false)

// 分类菜单相关
const showAllCategories = ref(false)
const activeCategoryId = ref(null)
const subCategories = ref([])
const isLoading = ref(false)

// 获取所有分类
onMounted(async () => {
  if (!categoryStore.hasCategories) {
    isLoading.value = true
    await categoryStore.fetchCategoryTree()
    isLoading.value = false
  }
})

// 获取购物车商品数量
const cartCount = computed(() => cartStore.cartCount)

// 处理搜索
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    // 保存搜索关键词到store
    searchStore.setSearchParams({ keyword: searchKeyword.value })
    // 跳转到搜索结果页
    router.push({
      path: '/search',
      query: { keyword: searchKeyword.value }
    })
  }
}

// 用户登录/注册
const goToLogin = () => {
  router.push('/login')
}

// 用户退出登录
const handleLogout = async () => {
  await userStore.logout()
  ElMessage.success('已退出登录')
}

// 前往个人中心
const goToUserCenter = () => {
  router.push('/user/profile')
}

// 前往购物车
const goToCart = () => {
  router.push('/cart')
}

// 前往订单页面
const goToOrders = () => {
  router.push('/user/orders')
}

// 前往我的收藏
const goToFavorites = () => {
  router.push('/user/favorites')
}

// 前往后台管理
const goToAdmin = () => {
  router.push('/admin/dashboard')
}

// 显示全部分类
const toggleAllCategories = () => {
  showAllCategories.value = !showAllCategories.value
}

// 获取头像URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '/images/default-avatar.png'
  return fileStore.getPreviewUrl(avatarPath)
}
</script>

<template>
  <div class="front-layout">
    <!-- 顶部信息栏 -->
    <div class="top-bar">
      <div class="container">
        <div class="welcome">
          <span>欢迎来到电子商城！</span>
          <span class="welcome-info">每日上新 | 品质保障 | 闪电配送</span>
        </div>
        <div class="top-links">
          <template v-if="userStore.isLoggedIn">
            <el-dropdown trigger="click">
              <span class="user-welcome">
                <img :src="getAvatarUrl(userStore.avatar)" alt="用户头像" class="mini-avatar">
                {{ userStore.nickname }} <el-icon><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="goToUserCenter">
                    <el-icon><user /></el-icon> 个人中心
                  </el-dropdown-item>
                  <el-dropdown-item @click="goToOrders">
                    <el-icon><list /></el-icon> 我的订单
                  </el-dropdown-item>
                  <el-dropdown-item @click="goToFavorites">
                    <el-icon><star /></el-icon> 我的收藏
                  </el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin" divided @click="goToAdmin">
                    <el-icon><setting /></el-icon> 后台管理
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    <el-icon><switch-button /></el-icon> 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <a @click="goToLogin" class="login-link">登录</a>
            <span class="divider">|</span>
            <a @click="router.push('/register')" class="register-link">注册</a>
          </template>
          <span class="divider">|</span>
          <a @click="router.push('/user/orders')">我的订单</a>
          <template v-if="userStore.isLoggedIn && userStore.isAdmin">
            <span class="divider">|</span>
            <a @click="goToAdmin" class="admin-link">
              <el-icon><setting /></el-icon> 后台管理
            </a>
          </template>
          <span class="divider">|</span>
          <el-dropdown trigger="hover">
            <span class="customer-service">
              客户服务 <el-icon><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/help')">
                  <el-icon><message /></el-icon> 帮助中心
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-icon><service /></el-icon> 在线客服
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-icon><phone /></el-icon> 联系电话
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span class="divider">|</span>
          <a @click="router.push('/download')">
            <el-icon><iphone /></el-icon> 下载APP
          </a>
        </div>
      </div>
    </div>

    <!-- 主导航栏 -->
    <div class="main-header">
      <div class="container">
        <!-- LOGO -->
        <div class="logo" @click="router.push('/')">
          <img src="@/assets/logo.svg" alt="商城LOGO" />
        </div>

        <!-- 搜索框 -->
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索商品..."
            @keyup.enter="handleSearch"
            @focus="isSearchFocused = true"
            @blur="setTimeout(() => isSearchFocused = false, 200)"
            @input="updateSearchSuggestions"
            class="search-input"
          >
            <template #prefix>
              <el-icon><search /></el-icon>
            </template>
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>

          <!-- 搜索建议下拉框 -->
          <div v-if="isSearchFocused && searchSuggestions.length > 0" class="search-suggestions">
            <div
              v-for="(suggestion, index) in searchSuggestions"
              :key="index"
              class="suggestion-item"
              @click="searchKeyword = suggestion; handleSearch()"
            >
              {{ suggestion }}
            </div>
          </div>

        </div>

        <!-- 购物车 -->
        <div class="cart-box" @click="goToCart">
          <el-badge :value="cartCount" class="cart-badge">
            <el-button class="cart-button" type="danger" plain>
              <el-icon><shopping-cart /></el-icon> 购物车
            </el-button>
          </el-badge>
        </div>
      </div>
    </div>

    <!-- 分类导航 -->
    <div class="category-nav">
      <div class="container">
        <!-- 主导航 -->
        <ul class="nav-menu">
          <li :class="{ active: activeNavItem === '/' }">
            <a @click="router.push('/')">首页</a>
          </li>

          <li :class="{ active: activeNavItem.includes('/products') }">
            <a @click="router.push('/products')">商品列表</a>
          </li>

          <li :class="{ active: activeNavItem.includes('/new') }">
            <a @click="router.push('/new')">新品上市</a>
          </li>
          <li :class="{ active: activeNavItem.includes('/hot') }">
            <a @click="router.push('/hot')">热卖商品</a>
          </li>
          <li :class="{ active: activeNavItem.includes('/recommendation') }"> 
            <a @click="router.push('/recommendations')">推荐商品</a>
          </li>
        </ul>
      </div>
    </div>

    <!-- 主内容区域 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-service">
            <div class="service-item">
              <el-icon><shopping-bag /></el-icon>
              <span>正品保障</span>
            </div>
            <div class="service-item">
              <el-icon><location /></el-icon>
              <span>急速配送</span>
            </div>
            <div class="service-item">
              <el-icon><setting /></el-icon>
              <span>售后无忧</span>
            </div>
            <div class="service-item">
              <el-icon><message /></el-icon>
              <span>专业服务</span>
            </div>
          </div>
        </div>
        
        <div class="footer-middle">
          <div class="footer-column">
            <h4>购物指南</h4>
            <ul>
              <li><a href="#">购物流程</a></li>
              <li><a href="#">会员介绍</a></li>
              <li><a href="#">常见问题</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h4>配送方式</h4>
            <ul>
              <li><a href="#">配送范围</a></li>
              <li><a href="#">配送时间</a></li>
              <li><a href="#">配送查询</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h4>支付方式</h4>
            <ul>
              <li><a href="#">在线支付</a></li>
              <li><a href="#">货到付款</a></li>
              <li><a href="#">分期付款</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h4>售后服务</h4>
            <ul>
              <li><a href="#">退换货政策</a></li>
              <li><a href="#">退换货流程</a></li>
              <li><a href="#">价格保护</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h4>关于我们</h4>
            <ul>
              <li><a href="#">公司简介</a></li>
              <li><a href="#">联系我们</a></li>
              <li><a href="#">招贤纳士</a></li>
            </ul>
          </div>
          <div class="footer-contact">
            <h4>联系客服</h4>
            <div class="contact-phone">400-123-4567</div>
            <div class="contact-time">周一至周日 9:00-22:00</div>
            <el-button type="primary" size="small" round class="contact-btn">
              <el-icon><message /></el-icon> 在线客服
            </el-button>
          </div>
        </div>
        
        <div class="footer-bottom">
          <div class="copyright">© 2023 商城 版权所有</div>
          <div class="footer-links">
            <a href="#">隐私政策</a>
            <a href="#">使用条款</a>
            <a href="#">网站地图</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 全局布局 */
.front-layout {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.position-relative {
  position: relative;
}

/* 顶部信息栏 */
.top-bar {
  background-color: #f5f5f5;
  border-bottom: 1px solid #e4e4e4;
  height: 36px;
  line-height: 36px;
  color: #666;
  font-size: 12px;
}

.top-bar .container {
  display: flex;
  justify-content: space-between;
}

.welcome {
  display: flex;
  gap: 15px;
  align-items: center;
}

.welcome-info {
  color: #999;
}

.top-links {
  display: flex;
  align-items: center;
}

.top-links a {
  color: #666;
  margin: 0 8px;
  cursor: pointer;
  transition: color 0.3s;
}

.top-links a:hover {
  color: #409eff;
}

.login-link {
  color: #e6a23c !important;
  font-weight: 500;
}

.register-link {
  color: #409eff !important;
  font-weight: 500;
}

.admin-link {
  color: #67c23a !important;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 3px;
}

.divider {
  color: #ddd;
  margin: 0 3px;
}

.user-welcome, .customer-service {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 3px;
  margin: 0 8px;
}

.customer-service:hover {
  color: #409eff;
}

/* 小头像 */
.mini-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 5px;
}

/* 主导航栏 */
.main-header {
  padding: 20px 0;
  background-color: #fff;
}

.main-header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  flex: 0 0 200px;
  cursor: pointer;
}

.logo img {
  max-height: 60px;
}

.search-box {
  flex: 1;
  margin: 0 50px;
  position: relative;
}

.search-input {
  width: 100%;
}

.hot-keywords {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.hot-keywords a {
  margin: 0 5px;
  color: #666;
  cursor: pointer;
}

.hot-keywords a:hover {
  color: #409eff;
}

.search-suggestions {
  position: absolute;
  top: 40px;
  left: 0;
  width: 100%;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-top: none;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.suggestion-item {
  padding: 8px 15px;
  cursor: pointer;
}

.suggestion-item:hover {
  background-color: #f5f7fa;
}

.cart-box {
  flex: 0 0 120px;
}

.cart-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 分类导航 */
.category-nav {
  background-color: #409eff;
  color: #fff;
}

.category-nav .container {
  display: flex;
  align-items: center;
  height: 50px;
}

.all-categories {
  width: 200px;
  height: 50px;
  background-color: #237eed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.all-categories.active {
  background-color: #166adc;
}

.all-categories i {
  margin-right: 5px;
}

.nav-menu {
  display: flex;
  list-style: none;
  margin-left: 20px;
}

.nav-menu li {
  padding: 0 15px;
  font-size: 16px;
  line-height: 50px;
  cursor: pointer;
}

.nav-menu li:hover,
.nav-menu li.active {
  background-color: #237eed;
}

.nav-menu li a {
  color: #fff;
  text-decoration: none;
}

/* 分类菜单 */
.category-menu-container {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.category-menu {
  width: 200px;
  background-color: #fff;
  position: relative;
  z-index: 9;
  border: 1px solid #e0e0e0;
  border-top: none;
}

.category-loading {
  padding: 15px;
  text-align: center;
  color: #999;
}

.primary-category {
  list-style: none;
  padding: 0;
  margin: 0;
}

.primary-category li {
  position: relative;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 15px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #333;
}

.primary-category li:hover .category-item,
.primary-category li.active .category-item {
  color: #409eff;
  background-color: #f5f7fa;
}

.sub-category-panel {
  position: absolute;
  top: 0;
  left: 100%;
  width: 700px;
  min-height: 100%;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  padding: 15px;
  display: flex;
  flex-wrap: wrap;
  z-index: 8;
}

.sub-category-group {
  width: 33.333%;
  padding: 10px;
}

.sub-category-title {
  font-weight: bold;
  padding-bottom: 5px;
  margin-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
  cursor: pointer;
}

.sub-category-title:hover {
  color: #409eff;
}

.sub-category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.sub-category-list a {
  font-size: 12px;
  color: #666;
  padding: 3px 5px;
  cursor: pointer;
}

.sub-category-list a:hover {
  color: #409eff;
  background-color: #f5f7fa;
  border-radius: 2px;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  padding: 20px 0;
  background-color: #f5f7fa;
}

/* 页脚 */
.footer {
  background-color: #fff;
  border-top: 1px solid #e4e4e4;
  padding-top: 40px;
}

.footer-top {
  border-bottom: 1px solid #e4e4e4;
  padding-bottom: 30px;
}

.footer-service {
  display: flex;
  justify-content: space-around;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.service-item i {
  font-size: 30px;
  color: #409eff;
}

.footer-middle {
  display: flex;
  padding: 30px 0;
  flex-wrap: wrap;
}

.footer-column {
  flex: 1;
  min-width: 120px;
  margin-bottom: 20px;
}

.footer-column h4 {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.footer-column ul {
  list-style: none;
  padding: 0;
}

.footer-column li {
  margin-bottom: 8px;
}

.footer-column a {
  color: #666;
  font-size: 13px;
}

.footer-column a:hover {
  color: #409eff;
}

.footer-contact {
  flex: 0 0 220px;
  text-align: center;
}

.contact-phone {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin: 10px 0;
}

.contact-time {
  color: #999;
  font-size: 12px;
  margin-bottom: 15px;
}

.contact-btn {
  width: 140px;
}

.footer-bottom {
  border-top: 1px solid #e4e4e4;
  padding: 15px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.copyright {
  color: #999;
  font-size: 12px;
}

.footer-links a {
  color: #666;
  font-size: 12px;
  margin-left: 15px;
}

.footer-links a:hover {
  color: #409eff;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .footer-contact {
    flex: 0 0 100%;
    margin-top: 20px;
  }
  
  .service-item {
    font-size: 14px;
  }
  
  .sub-category-panel {
    width: 500px;
  }
  
  .sub-category-group {
    width: 50%;
  }
}

@media (max-width: 768px) {
  .main-header .container {
    flex-direction: column;
    gap: 20px;
  }
  
  .logo {
    flex: 0 0 auto;
  }
  
  .search-box {
    margin: 0;
    width: 100%;
  }
  
  .cart-box {
    margin-top: 10px;
    flex: 0 0 auto;
  }
  
  .all-categories {
    width: 150px;
  }
  
  .sub-category-panel {
    width: 400px;
  }
  
  .sub-category-group {
    width: 100%;
  }
  
  .footer-column {
    flex: 0 0 50%;
  }
}

@media (max-width: 576px) {
  .footer-service {
    flex-wrap: wrap;
  }
  
  .service-item {
    flex: 0 0 50%;
    margin-bottom: 20px;
  }
  
  .sub-category-panel {
    width: 200px;
  }
  
  .category-menu {
    width: 150px;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: 10px;
  }
  
  .footer-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
  
  .footer-links a {
    margin: 0;
  }
}
</style>