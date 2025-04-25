<script setup>
import { RouterView, useRoute, useRouter } from 'vue-router'
import { onMounted, watch, ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useFileStore } from '@/stores/file'
import { useCartStore } from '@/stores/cart'
import { storeToRefs } from 'pinia'
import { ElMessage, ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'

// 引入图标
import {
  User,
  ShoppingCart,
  Star,
  List,
  ArrowDown,
  Setting,
  Message,
  SwitchButton,
  Lock
} from '@element-plus/icons-vue'

// 获取用户信息和文件存储
const userStore = useUserStore()
const fileStore = useFileStore()
const route = useRoute()
const router = useRouter()

// 解构用户相关的数据，使用storeToRefs保持响应性
const {
  isLoggedIn,
  nickname,
  avatar,
  userInfo,
  roleName
} = storeToRefs(userStore)

// 获取头像URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '/images/default-avatar.png'
  return fileStore.getPreviewUrl(avatarPath)
}

// 动态更新页面标题
const updateTitle = () => {
  const baseTitle = '电子商城'
  const routeTitle = route.meta.title
  document.title = routeTitle ? `${routeTitle} - ${baseTitle}` : baseTitle
}

const cartStore = useCartStore()
// 获取购物车商品数量
const cartCount = computed(() => cartStore.cartCount)
// 监控路由变化
watch(() => route.path, (newVal) => {
  updateTitle()
  checkAuth()
})

// 检查登录状态和权限
const checkAuth = async () => {
  // 如果有token但没有用户信息，先获取用户信息
  if (isLoggedIn.value && !userInfo.value.userId) {
    try {
      await userStore.getUserInfo()
    } catch (error) {
      console.error('获取用户信息失败', error)
      router.push('/login')
      return
    }
  }

  // 检查是否需要登录
  if (route.meta.requiresAuth && !isLoggedIn.value) {
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    })
  }
}

// 用户菜单项
const userMenuItems = [
  { path: '/user/profile', name: '个人资料', icon: User },
  { path: '/user/orders', name: '我的订单', icon: List },
  { path: '/user/address', name: '收货地址', icon: 'el-icon-location' },
  { path: '/user/favorites', name: '我的收藏', icon: Star },
  { path: '/user/reviews', name: '我的评价', icon: Message },
  { path: '/user/behavior', name: '浏览历史', icon: 'el-icon-time' },
  { path: '/user/password', name: '修改密码', icon: Lock }
]

// 处理退出登录
const handleLogout = async () => {
  await userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

// 导航菜单
const activeNavItem = computed(() => route.path)

// 用户相关跳转方法
const goToUserCenter = () => {
  router.push('/user/profile')
}

const goToOrders = () => {
  router.push('/user/orders')
}

const goToFavorites = () => {
  router.push('/user/favorites')
}

const goToLogin = () => {
  router.push('/login')
}

const goToCart = () => {
  router.push('/cart')
}
// 前往后台管理
const goToAdmin = () => {
  router.push('/admin/dashboard')
}
// 组件挂载时执行
onMounted(() => {
  updateTitle()
  checkAuth()
})
</script>

<template>
  <div class="user-layout">
    <!-- 顶部信息栏 -->
    <div class="top-bar">
      <div class="container">
        <div class="welcome">
          <span>欢迎来到用户中心！</span>
        </div>
        <div class="top-links">
          <template v-if="isLoggedIn">
            <el-dropdown trigger="click">
              <span class="user-welcome">
                <img :src="getAvatarUrl(avatar)" alt="用户头像" class="mini-avatar">
                {{ nickname || '用户' }} <el-icon><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="goToUserCenter">
                    <el-icon>
                      <user />
                    </el-icon> 个人中心
                  </el-dropdown-item>
                  <el-dropdown-item @click="goToOrders">
                    <el-icon>
                      <list />
                    </el-icon> 我的订单
                  </el-dropdown-item>
                  <el-dropdown-item @click="goToFavorites">
                    <el-icon>
                      <star />
                    </el-icon> 我的收藏
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    <el-icon><switch-button /></el-icon> 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <a @click="goToLogin">登录</a>
            <span class="divider">|</span>
            <a @click="router.push('/register')">注册</a>
          </template>
          <span class="divider">|</span>
          <a @click="router.push('/user/orders')">我的订单</a>
          <template v-if="userStore.isLoggedIn && userStore.isAdmin">
            <span class="divider">|</span>
            <a @click="goToAdmin" class="admin-link">
              <el-icon><setting /></el-icon> 后台管理
            </a>
          </template>
        </div>
      </div>
    </div>

    <!-- 主导航栏 -->
    <div class="main-header">
      <div class="container">
        <!-- LOGO -->
        <div class="logo" @click="router.push('/')">
          <img src="@/assets/logo.svg" alt="商城LOGO" class="logo-img" />
          <span class="logo-text">电子商城</span>
        </div>

        <!-- 导航菜单 -->
        <nav class="main-nav">
          <router-link to="/">首页</router-link>
          <router-link to="/products">商品列表</router-link>
          <router-link to="/new">新品上市</router-link>
          <router-link to="/hot">热卖商品</router-link>
        </nav>
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

    <!-- 用户中心内容区域 -->
    <div class="user-container">
      <!-- 侧边栏导航 -->
      <aside class="user-sidebar">
        <div class="user-menu">
          <div class="menu-title">个人中心</div>
          <div class="menu-items">
            <router-link v-for="item in userMenuItems" :key="item.path" :to="item.path" class="menu-item">
              <el-icon v-if="typeof item.icon !== 'string'">
                <component :is="item.icon" />
              </el-icon>
              <i v-else :class="item.icon"></i>
              <span>{{ item.name }}</span>
            </router-link>
          </div>
        </div>
        <!-- 用户信息卡片 -->
        <div class="user-card" v-if="isLoggedIn">
          <div class="card-avatar">
            <img :src="getAvatarUrl(avatar)" alt="用户头像">
          </div>
          <div class="card-info">
            <div class="card-name">{{ nickname || '用户' }}</div>
            <div class="card-role">{{ roleName }}</div>
          </div>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="user-content">
        <RouterView />
      </main>
    </div>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-service">
            <div class="service-item">
              <el-icon><shopping-cart /></el-icon>
              <span>正品保障</span>
            </div>
            <div class="service-item">
              <el-icon>
                <setting />
              </el-icon>
              <span>售后无忧</span>
            </div>
            <div class="service-item">
              <el-icon>
                <message />
              </el-icon>
              <span>专业服务</span>
            </div>
          </div>
        </div>

        <div class="footer-middle">
          <div class="footer-column">
            <h4>购物指南</h4>
            <ul>
              <li><a href="#">购物流程</a></li>
              <li><a href="#">常见问题</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h4>配送方式</h4>
            <ul>
              <li><a href="#">配送范围</a></li>
              <li><a href="#">配送时间</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h4>售后服务</h4>
            <ul>
              <li><a href="#">退换货政策</a></li>
              <li><a href="#">售后流程</a></li>
            </ul>
          </div>
          <div class="footer-contact">
            <h4>联系客服</h4>
            <div class="contact-phone">400-123-4567</div>
            <div class="contact-time">周一至周日 9:00-22:00</div>
            <el-button type="primary" size="small" round class="contact-btn">
              <el-icon>
                <message />
              </el-icon> 在线客服
            </el-button>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="copyright">© 2023 电子商城 版权所有</div>
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
.user-layout {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
  width: 100%;
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

.top-links a {
  color: #666;
  margin: 0 8px;
  cursor: pointer;
}

.top-links a:hover {
  color: #409eff;
}

.divider {
  color: #ccc;
  margin: 0 3px;
}

.user-welcome {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 3px;
  margin: 0 8px;
}

/* 主导航栏 */
.main-header {
  padding: 20px 0;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.main-header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  flex: 0 0 200px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-img {
  max-height: 40px;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.main-nav {
  display: flex;
  gap: 30px;
}

.main-nav a {
  color: #333;
  font-size: 16px;
  transition: color 0.3s;
  text-decoration: none;
  position: relative;
}

.main-nav a:hover,
.main-nav a.router-link-active {
  color: #409eff;
}

.main-nav a.router-link-active:after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #409eff;
}

.cart-box {
  flex: 0 0 120px;
}

.cart-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 用户中心内容区域 */
.user-container {
  display: flex;
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 15px;
  flex: 1;
  gap: 20px;
  padding-top: 20px;
  padding-bottom: 20px;
  min-height: 800px; /* 设置最小高度 */
  width: 100%;
}

.user-sidebar {
  width: 220px;
  flex-shrink: 0; /* 防止侧边栏被压缩 */
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-menu {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.menu-title {
  background-color: #409eff;
  color: #fff;
  padding: 15px;
  font-size: 16px;
  font-weight: bold;
}

.menu-items {
  display: flex;
  flex-direction: column;
}

.menu-item {
  padding: 12px 15px;
  color: #333;
  border-bottom: 1px solid #f5f7fa;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.menu-item:hover,
.menu-item.router-link-active {
  background-color: #ecf5ff;
  color: #409eff;
}

.menu-item i,
.menu-item .el-icon {
  font-size: 16px;
}

/* 用户卡片样式 */
.user-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.card-name {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.card-role {
  font-size: 14px;
  color: #999;
}

.user-content {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  height: 800px; /* 固定高度 */
  overflow-y: auto; /* 内容超出时显示滚动条 */
  position: relative; /* 为内部定位提供参考 */
}

/* 美化滚动条 */
.user-content::-webkit-scrollbar {
  width: 6px;
}

.user-content::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.user-content::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}

/* 页脚 */
.footer {
  background-color: #fff;
  border-top: 1px solid #e4e4e4;
  padding-top: 40px;
  margin-top: auto;
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

.service-item i,
.service-item .el-icon {
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

/* 响应式布局 */
@media (max-width: 992px) {
  .footer-contact {
    flex: 0 0 100%;
    margin-top: 20px;
  }

  .service-item {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .main-header .container {
    flex-direction: column;
    gap: 15px;
  }

  .logo {
    flex: 0 0 auto;
  }

  .main-nav {
    width: 100%;
    justify-content: space-between;
  }

  .cart-box {
    margin-top: 10px;
    flex: 0 0 auto;
  }

  .user-container {
    flex-direction: column;
    min-height: auto;
  }

  .user-sidebar {
    width: 100%;
    margin-bottom: 20px;
  }

  .user-card {
    margin-top: 15px;
  }

  .footer-column {
    flex: 0 0 50%;
  }

  .footer-service {
    flex-wrap: wrap;
  }

  .service-item {
    flex: 0 0 50%;
    margin-bottom: 20px;
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

  .user-content {
    height: auto;
    min-height: 600px; /* 移动端最小高度 */
  }
}

/* 添加用户小头像样式 */
.mini-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 5px;
  vertical-align: middle;
}

.customer-service {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 3px;
  margin: 0 8px;
}

.customer-service:hover {
  color: #409eff;
}
</style>