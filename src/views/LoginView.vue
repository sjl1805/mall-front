<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElLoading } from 'element-plus'
import { UserFilled, Lock, Key } from '@element-plus/icons-vue'

// 获取store、路由器和当前路由
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  captchaKey: '',
  rememberMe: false
})

// 验证码相关
const captchaImage = ref('')
const captchaLoading = ref(false)

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在6-20个字符之间', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '请输入正确的验证码', trigger: 'blur' }
  ]
}

// 获取验证码
const getCaptcha = async () => {
  captchaLoading.value = true
  try {
    const captchaData = await userStore.getCaptcha()
    console.log('获取到的验证码数据:', captchaData) // 调试输出
    loginForm.captchaKey = captchaData.captchaKey
    captchaImage.value = captchaData.image
    console.log('设置后的captchaKey:', loginForm.captchaKey) // 调试输出
  } catch (error) {
    console.error('获取验证码失败', error)
    ElMessage.error('获取验证码失败，请刷新页面重试')
  } finally {
    captchaLoading.value = false
  }
}

// 页面初始化时获取验证码
onMounted(() => {
  getCaptcha()
})

// 表单和提交状态
const loginFormRef = ref(null)
const loading = ref(false)
const passwordType = ref('password')

// 切换密码显示
const togglePasswordVisibility = () => {
  passwordType.value = passwordType.value === 'password' ? 'text' : 'password'
}

// 重定向地址
const redirect = computed(() => route.query.redirect || '/')

// 提交登录表单
const submitForm = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      try {
        const res = await userStore.login({
          username: loginForm.username,
          password: loginForm.password,
          captcha: loginForm.captcha,
          captchaKey: loginForm.captchaKey,
          rememberMe: loginForm.rememberMe
        })
        
        if (res.code === 200) {
          ElMessage.success('登录成功')
          router.push(redirect.value)
        } else {
          getCaptcha() // 刷新验证码
        }
      } catch (error) {
        console.error('登录失败', error)
        getCaptcha() // 刷新验证码
      } finally {
        loading.value = false
      }
    } else {
      ElMessage.error('请填写正确的登录信息')
      return false
    }
  })
}

// 去注册页面
const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2 class="login-title">用户登录</h2>
        <p class="login-subtitle">欢迎回来，请登录您的账号</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-position="top"
        class="login-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model.trim="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="UserFilled"
            autocomplete="username"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model.trim="loginForm.password"
            :type="passwordType"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            autocomplete="current-password"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="验证码" prop="captcha">
          <div class="captcha-container">
            <el-input
              v-model.trim="loginForm.captcha"
              placeholder="请输入验证码"
              :prefix-icon="Key"
            />
            <div class="captcha-image" @click="getCaptcha">
              <img v-if="captchaImage" :src="captchaImage" alt="验证码" />
              <div v-else class="captcha-loading">验证码加载中...</div>
            </div>
          </div>
        </el-form-item>
        
        <div class="form-options">
          <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
          <a href="#" class="forgot-password">忘记密码?</a>
        </div>
        
        <el-button
          type="primary"
          class="login-button"
          :loading="loading"
          @click="submitForm"
        >
          登录
        </el-button>
        
        <div class="register-link">
          <span>还没有账号?</span>
          <a @click="goToRegister">立即注册</a>
        </div>
      </el-form>
      
      <div class="login-footer">
        <div class="login-tips">
          <p>提示: 默认管理员账号 admin 密码 123456</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 480px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.login-subtitle {
  font-size: 16px;
  color: #999;
}

.login-form {
  margin-bottom: 20px;
}

.captcha-container {
  display: flex;
  gap: 10px;
}

.captcha-image {
  flex: 0 0 auto;
  width: 120px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  background-color: #f5f5f5;
}

.captcha-image img {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.captcha-loading {
  font-size: 12px;
  color: #999;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.forgot-password {
  color: #409eff;
  font-size: 14px;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

.login-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #ff4d4f;
  text-decoration: none;
  margin-left: 5px;
  cursor: pointer;
}

.register-link a:hover {
  text-decoration: underline;
}

.login-footer {
  margin-top: 30px;
  text-align: center;
}

.login-tips {
  padding: 10px;
  background-color: #fff7e6;
  border-radius: 4px;
  font-size: 12px;
  color: #ffa940;
}

@media (max-width: 576px) {
  .login-box {
    padding: 30px 20px;
  }
  
  .login-title {
    font-size: 24px;
  }
  
  .login-subtitle {
    font-size: 14px;
  }
}
</style> 