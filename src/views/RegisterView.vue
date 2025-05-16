<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { UserFilled, Lock, Message, Phone, Key } from '@element-plus/icons-vue'

// 获取store和路由器
const userStore = useUserStore()
const router = useRouter()

// 注册表单数据
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  email: '',
  captcha: '',
  captchaKey: '',
  agreement: false
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
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '请输入正确的验证码', trigger: 'blur' }
  ],
  agreement: [
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请同意用户协议'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 获取验证码
const getCaptcha = async () => {
  captchaLoading.value = true
  try {
    const captchaData = await userStore.getCaptcha()
    console.log('注册页 - 获取到的验证码数据:', captchaData) // 调试输出
    registerForm.captchaKey = captchaData.captchaKey
    captchaImage.value = captchaData.image
    console.log('注册页 - 设置后的captchaKey:', registerForm.captchaKey) // 调试输出
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
const registerFormRef = ref(null)
const loading = ref(false)
const passwordType = ref('password')
const confirmPasswordType = ref('password')

// 切换密码显示
const togglePasswordVisibility = (field) => {
  if (field === 'password') {
    passwordType.value = passwordType.value === 'password' ? 'text' : 'password'
  } else {
    confirmPasswordType.value = confirmPasswordType.value === 'password' ? 'text' : 'password'
  }
}

// 提交注册表单
const submitForm = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      try {
        const res = await userStore.register({
          username: registerForm.username,
          password: registerForm.password,
          confirmPassword: registerForm.confirmPassword,
          phone: registerForm.phone,
          email: registerForm.email,
          captcha: registerForm.captcha,
          captchaKey: registerForm.captchaKey
        })
        
        if (res.code === 200) {
          ElMessage.success('注册成功，请登录')
          router.push('/login')
        } else {
          getCaptcha() // 刷新验证码
        }
      } catch (error) {
        console.error('注册失败', error)
        getCaptcha() // 刷新验证码
      } finally {
        loading.value = false
      }
    } else {
      ElMessage.error('请填写正确的注册信息')
      return false
    }
  })
}

// 去登录页面
const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <h2 class="register-title">用户注册</h2>
        <p class="register-subtitle">创建一个新账号，开始您的购物之旅</p>
      </div>
      
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="rules"
        label-position="top"
        class="register-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model.trim="registerForm.username"
            placeholder="请输入用户名"
            :prefix-icon="UserFilled"
            autocomplete="username"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model.trim="registerForm.password"
            :type="passwordType"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            autocomplete="new-password"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model.trim="registerForm.confirmPassword"
            :type="confirmPasswordType"
            placeholder="请再次输入密码"
            :prefix-icon="Lock"
            autocomplete="new-password"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="手机号码" prop="phone">
          <el-input
            v-model.trim="registerForm.phone"
            placeholder="请输入手机号码"
            :prefix-icon="Phone"
            autocomplete="tel"
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model.trim="registerForm.email"
            placeholder="请输入邮箱地址"
            :prefix-icon="Message"
            autocomplete="email"
          />
        </el-form-item>
        
        <el-form-item label="验证码" prop="captcha">
          <div class="captcha-container">
            <el-input
              v-model.trim="registerForm.captcha"
              placeholder="请输入验证码"
              :prefix-icon="Key"
            />
            <div class="captcha-image" @click="getCaptcha">
              <img v-if="captchaImage" :src="captchaImage" alt="验证码" />
              <div v-else class="captcha-loading">验证码加载中...</div>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item prop="agreement">
          <el-checkbox v-model="registerForm.agreement">
            我已阅读并同意 <a href="#" class="agreement-link">用户协议</a> 和 <a href="#" class="agreement-link">隐私政策</a>
          </el-checkbox>
        </el-form-item>
        
        <el-button
          type="primary"
          class="register-button"
          :loading="loading"
          @click="submitForm"
        >
          注册
        </el-button>
        
        <div class="login-link">
          <span>已有账号?</span>
          <a @click="goToLogin">立即登录</a>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.register-box {
  width: 100%;
  max-width: 560px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.register-subtitle {
  font-size: 16px;
  color: #999;
}

.register-form {
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

.agreement-link {
  color: #409eff;
  text-decoration: none;
}

.agreement-link:hover {
  text-decoration: underline;
}

.register-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  margin-top: 10px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #409eff;
  text-decoration: none;
  margin-left: 5px;
  cursor: pointer;
}

.login-link a:hover {
  text-decoration: underline;
}

@media (max-width: 576px) {
  .register-box {
    padding: 30px 20px;
  }
  
  .register-title {
    font-size: 24px;
  }
  
  .register-subtitle {
    font-size: 14px;
  }
}
</style> 