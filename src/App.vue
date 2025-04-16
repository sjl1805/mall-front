<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 获取用户store
const userStore = useUserStore()

// 应用初始化时自动检查用户登录状态
onMounted(async () => {
  // 如果已有token但没有用户信息，则获取用户信息
  if (userStore.token && !userStore.userId) {
    try {
      await userStore.getUserInfo()
      console.log('已自动恢复用户登录状态')
    } catch (error) {
      console.error('恢复用户登录状态失败', error)
      // 如果获取用户信息失败，清除过期的token
      userStore.clearUserInfo()
    }
  }
})
</script>

<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style>
/* 全局样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
  color: #333;
  line-height: 1.5;
  min-height: 100vh;
  width: 100%;
}

/* 确保应用容器占满整个页面 */
.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

a {
  text-decoration: none;
  color: #409eff;
}

/* 统一的容器样式 */
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 15px;
}

/* 统一的卡片容器样式 */
.card-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

/* 统一的标题样式 */
.section-title {
  font-size: 22px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  color: #333;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-container {
    padding: 10px;
  }
  
  .card-container {
    padding: 15px;
  }
  
  .section-title {
    font-size: 20px;
  }
}
</style>
