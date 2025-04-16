<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 返回首页
const goHome = () => {
  router.push('/')
}

// 返回上一页
const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1 class="error-title">页面不存在</h1>
      <p class="error-message">抱歉，您访问的页面不存在或已被删除</p>
      <div class="action-buttons">
        <button class="back-button" @click="goBack">返回上一页</button>
        <button class="home-button" @click="goHome">返回首页</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 70vh;
}

.not-found-content {
  flex: 1;
  padding-right: 40px;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #ff4d4f;
  line-height: 1;
  margin-bottom: 20px;
}

.error-title {
  font-size: 36px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.error-message {
  font-size: 18px;
  color: #666;
  margin-bottom: 40px;
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.back-button, .home-button {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.back-button {
  background-color: #f5f5f5;
  color: #666;
}

.back-button:hover {
  background-color: #e0e0e0;
}

.home-button {
  background-color: #ff4d4f;
  color: white;
}

.home-button:hover {
  background-color: #ff7875;
}

.not-found-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.not-found-image img {
  max-width: 100%;
  height: auto;
  max-height: 400px;
}

@media (max-width: 768px) {
  .not-found-container {
    flex-direction: column-reverse;
    text-align: center;
  }
  
  .not-found-content {
    padding-right: 0;
    margin-top: 30px;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-title {
    font-size: 28px;
  }
}
</style>
