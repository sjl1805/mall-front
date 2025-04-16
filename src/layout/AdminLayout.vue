<script setup>
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()
const isCollapse = ref(false)

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败', error)
  }
}

// 切换菜单折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<template>
  <div class="admin-layout" :class="{ 'menu-collapsed': isCollapse }">
    <!-- 侧边栏 -->
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span v-if="!isCollapse">电子商城管理系统</span>
          <span v-else>商城</span>
        </div>
        <div class="collapse-btn" @click="toggleCollapse">
          <i class="el-icon" :class="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'">
            {{ isCollapse ? '→' : '←' }}
          </i>
        </div>
      </div>
      
      <div class="sidebar-menu">
        <router-link to="/admin/dashboard">
          <span class="menu-icon">📊</span>
          <span class="menu-text">控制面板</span>
        </router-link>
        <router-link to="/admin/users">
          <span class="menu-icon">👥</span>
          <span class="menu-text">用户管理</span>
        </router-link>
        <router-link to="/admin/categories">
          <span class="menu-icon">📂</span>
          <span class="menu-text">分类管理</span>
        </router-link>
        <router-link to="/admin/products">
          <span class="menu-icon">📦</span>
          <span class="menu-text">商品管理</span>
        </router-link>
        <router-link to="/admin/orders">
          <span class="menu-icon">📝</span>
          <span class="menu-text">订单管理</span>
        </router-link>
        <router-link to="/admin/recommendation">
          <span class="menu-icon">🔍</span>
          <span class="menu-text">推荐管理</span>
        </router-link>
      </div>
    </aside>

    <div class="admin-main">
      <!-- 顶部导航栏 -->
      <header class="admin-header">
        <div class="header-left">
          <div class="breadcrumb">
            <!-- 可以添加面包屑导航 -->
            管理后台
          </div>
        </div>
        <div class="header-right">
          <div class="user-info">
            <span class="username">{{ userStore.username || '管理员' }}</span>
            <router-link to="/" class="back-to-front-btn">回到前台</router-link>
            <button class="logout-btn" @click="handleLogout">退出登录</button>
          </div>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.admin-sidebar {
  width: 250px;
  background-color: #001529;
  color: #fff;
  transition: width 0.3s;
  overflow-y: auto;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
}

.menu-collapsed .admin-sidebar {
  width: 80px;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background-color: #002140;
  overflow: hidden;
}

.logo {
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapse-btn {
  cursor: pointer;
  font-size: 18px;
}

.sidebar-menu {
  padding: 16px 0;
}

.sidebar-menu a {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: all 0.3s;
}

.sidebar-menu a:hover {
  color: #fff;
  background-color: #1890ff;
}

.sidebar-menu a.router-link-active {
  color: #fff;
  background-color: #1890ff;
}

.menu-icon {
  margin-right: 10px;
  font-size: 16px;
}

.menu-collapsed .menu-text {
  display: none;
}

.admin-main {
  flex: 1;
  margin-left: 250px;
  transition: margin-left 0.3s;
  display: flex;
  flex-direction: column;
}

.menu-collapsed .admin-main {
  margin-left: 80px;
}

.admin-header {
  height: 64px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  font-size: 16px;
}

.breadcrumb {
  font-weight: bold;
  color: #1890ff;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  margin-right: 10px;
  font-weight: bold;
}

.back-to-front-btn {
  background-color: #1890ff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  margin-right: 10px;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s;
}

.back-to-front-btn:hover {
  background-color: #40a9ff;
}

.logout-btn {
  background-color: transparent;
  border: 1px solid #d9d9d9;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.admin-content {
  padding: 24px;
  flex: 1;
}

@media (max-width: 768px) {
  .admin-sidebar {
    width: 80px;
  }
  
  .menu-text {
    display: none;
  }
  
  .admin-main {
    margin-left: 80px;
  }
}
</style> 