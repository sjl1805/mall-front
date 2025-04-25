<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

// 引入图标
import { Lock, Key, Check, Close } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// 密码表单数据
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const rules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为6-20个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为6-20个字符', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value === passwordForm.oldPassword) {
          callback(new Error('新密码不能与原密码相同'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 是否显示密码
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 是否提交中
const isSubmitting = ref(false)

// 表单引用
const formRef = ref(null)

// 提交修改密码
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      return ElMessage.error('请正确填写表单内容')
    }
    
    // 二次确认
    ElMessageBox.confirm('确定要修改密码吗？修改后需要重新登录', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      isSubmitting.value = true
      
      try {
        await userStore.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
        ElMessage.success('密码修改成功，请重新登录')
        
        // 清除用户信息并跳转到登录页
        setTimeout(() => {
          userStore.clearUserInfo()
          router.push('/login')
        }, 1500)
      } catch (error) {
        console.error('修改密码失败', error)
      } finally {
        isSubmitting.value = false
      }
    }).catch(() => {})
  })
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
}

// 切换密码显示状态
const togglePasswordVisibility = (field) => {
  if (field === 'old') {
    showOldPassword.value = !showOldPassword.value
  } else if (field === 'new') {
    showNewPassword.value = !showNewPassword.value
  } else if (field === 'confirm') {
    showConfirmPassword.value = !showConfirmPassword.value
  }
}
</script>

<template>
  <div class="password-container">
    <div class="page-header">
      <h2 class="page-title">修改密码</h2>
    </div>
    
    <el-card class="password-card">
      <el-form
        ref="formRef"
        :model="passwordForm"
        :rules="rules"
        label-width="100px"
        class="password-form"
      >
        <div class="form-content">
          <!-- 原密码 -->
          <el-form-item label="原密码" prop="oldPassword">
            <el-input
              v-model="passwordForm.oldPassword"
              :type="showOldPassword ? 'text' : 'password'"
              placeholder="请输入原密码"
              :prefix-icon="Lock"
            >
              <template #suffix>
                <el-icon 
                  class="password-eye"
                  @click="togglePasswordVisibility('old')"
                >
                  <svg t="1701856245244" class="icon" viewBox="0 0 1024 1024" :style="{ opacity: showOldPassword ? 1 : 0.5 }">
                    <path d="M512 234.666667c-161.877333 0-299.946667 95.744-360.064 233.386666C211.093333 605.696 349.098667 701.44 512 701.44c161.877333 0 299.946667-95.744 360.064-233.386667C811.946667 330.410667 673.941333 234.666667 512 234.666667z m0 388.693333c-85.802667 0-155.306667-69.504-155.306667-155.306667s69.504-155.306667 155.306667-155.306666 155.306667 69.504 155.306667 155.306666-69.504 155.306667-155.306667 155.306667z" fill="#444"></path>
                    <path v-if="!showOldPassword" d="M512 390.698667a77.610667 77.610667 0 0 0-77.653333 77.653333c0 42.837333 34.816 77.653333 77.653333 77.653333s77.653333-34.816 77.653333-77.653333a77.610667 77.610667 0 0 0-77.653333-77.653333z" fill="#444"></path>
                  </svg>
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <!-- 新密码 -->
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              placeholder="请输入新密码"
              :prefix-icon="Key"
            >
              <template #suffix>
                <el-icon 
                  class="password-eye"
                  @click="togglePasswordVisibility('new')"
                >
                  <svg t="1701856245244" class="icon" viewBox="0 0 1024 1024" :style="{ opacity: showNewPassword ? 1 : 0.5 }">
                    <path d="M512 234.666667c-161.877333 0-299.946667 95.744-360.064 233.386666C211.093333 605.696 349.098667 701.44 512 701.44c161.877333 0 299.946667-95.744 360.064-233.386667C811.946667 330.410667 673.941333 234.666667 512 234.666667z m0 388.693333c-85.802667 0-155.306667-69.504-155.306667-155.306667s69.504-155.306667 155.306667-155.306666 155.306667 69.504 155.306667 155.306666-69.504 155.306667-155.306667 155.306667z" fill="#444"></path>
                    <path v-if="!showNewPassword" d="M512 390.698667a77.610667 77.610667 0 0 0-77.653333 77.653333c0 42.837333 34.816 77.653333 77.653333 77.653333s77.653333-34.816 77.653333-77.653333a77.610667 77.610667 0 0 0-77.653333-77.653333z" fill="#444"></path>
                  </svg>
                </el-icon>
              </template>
            </el-input>
            <div class="input-tip">密码长度为6-20个字符，建议使用字母、数字和符号的组合</div>
          </el-form-item>
          
          <!-- 确认新密码 -->
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="请再次输入新密码"
              :prefix-icon="Key"
            >
              <template #suffix>
                <el-icon 
                  class="password-eye"
                  @click="togglePasswordVisibility('confirm')"
                >
                  <svg t="1701856245244" class="icon" viewBox="0 0 1024 1024" :style="{ opacity: showConfirmPassword ? 1 : 0.5 }">
                    <path d="M512 234.666667c-161.877333 0-299.946667 95.744-360.064 233.386666C211.093333 605.696 349.098667 701.44 512 701.44c161.877333 0 299.946667-95.744 360.064-233.386667C811.946667 330.410667 673.941333 234.666667 512 234.666667z m0 388.693333c-85.802667 0-155.306667-69.504-155.306667-155.306667s69.504-155.306667 155.306667-155.306666 155.306667 69.504 155.306667 155.306666-69.504 155.306667-155.306667 155.306667z" fill="#444"></path>
                    <path v-if="!showConfirmPassword" d="M512 390.698667a77.610667 77.610667 0 0 0-77.653333 77.653333c0 42.837333 34.816 77.653333 77.653333 77.653333s77.653333-34.816 77.653333-77.653333a77.610667 77.610667 0 0 0-77.653333-77.653333z" fill="#444"></path>
                  </svg>
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
        </div>
        
        <div class="password-strength" v-if="passwordForm.newPassword">
          <div class="strength-label">密码强度：</div>
          <div class="strength-meter">
            <div 
              class="strength-level" 
              :class="{
                'weak': passwordForm.newPassword.length >= 6,
                'medium': passwordForm.newPassword.length >= 8 && /[A-Za-z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword),
                'strong': passwordForm.newPassword.length >= 10 && /[A-Za-z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword) && /[^A-Za-z0-9]/.test(passwordForm.newPassword)
              }"
            ></div>
          </div>
          <div 
            class="strength-text"
            :class="{
              'weak-text': passwordForm.newPassword.length >= 6 && !(passwordForm.newPassword.length >= 8 && /[A-Za-z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword)),
              'medium-text': passwordForm.newPassword.length >= 8 && /[A-Za-z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword) && !(passwordForm.newPassword.length >= 10 && /[^A-Za-z0-9]/.test(passwordForm.newPassword)),
              'strong-text': passwordForm.newPassword.length >= 10 && /[A-Za-z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword) && /[^A-Za-z0-9]/.test(passwordForm.newPassword)
            }"
          >
            {{ passwordForm.newPassword.length >= 10 && /[A-Za-z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword) && /[^A-Za-z0-9]/.test(passwordForm.newPassword) ? '强' : 
              (passwordForm.newPassword.length >= 8 && /[A-Za-z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword) ? '中' : '弱') }}
          </div>
        </div>
        
        <div class="form-actions">
          <el-button @click="resetForm">重置</el-button>
          <el-button type="primary" @click="submitForm" :loading="isSubmitting">确认修改</el-button>
        </div>
      </el-form>
    </el-card>
    
    <el-card class="tips-card">
      <template #header>
        <div class="tips-header">
          <h3>安全提示</h3>
        </div>
      </template>
      
      <div class="tips-content">
        <div class="tip-item">
          <el-icon class="tip-icon"><Check /></el-icon>
          <div class="tip-text">建议使用至少8位密码，包含字母、数字和特殊字符</div>
        </div>
        <div class="tip-item">
          <el-icon class="tip-icon"><Check /></el-icon>
          <div class="tip-text">定期更换密码可有效保护您的账户安全</div>
        </div>
        <div class="tip-item">
          <el-icon class="tip-icon warning"><Close /></el-icon>
          <div class="tip-text">请勿使用生日、电话号码等容易被猜测的密码</div>
        </div>
        <div class="tip-item">
          <el-icon class="tip-icon warning"><Close /></el-icon>
          <div class="tip-text">切勿在不同网站使用相同的密码</div>
        </div>
      </div>
    </el-card>
  </div>
</template> 

<style scoped>
.password-container {
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

.password-card {
  margin-bottom: 20px;
}

.password-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-content {
  width: 100%;
}

.input-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-top: 5px;
}

.password-eye {
  cursor: pointer;
  font-size: 16px;
}

.password-strength {
  display: flex;
  align-items: center;
  margin: 15px 0;
  padding-left: 100px;
}

.strength-label {
  margin-right: 10px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.strength-meter {
  height: 8px;
  width: 200px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 10px;
}

.strength-level {
  height: 100%;
  width: 0;
  border-radius: 4px;
  transition: all 0.3s;
}

.strength-level.weak {
  width: 33%;
  background-color: #f56c6c;
}

.strength-level.medium {
  width: 66%;
  background-color: #e6a23c;
}

.strength-level.strong {
  width: 100%;
  background-color: #67c23a;
}

.strength-text {
  font-size: 14px;
  font-weight: bold;
}

.weak-text {
  color: #f56c6c;
}

.medium-text {
  color: #e6a23c;
}

.strong-text {
  color: #67c23a;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  gap: 20px;
}

.tips-card {
  margin-bottom: 20px;
}

.tips-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.tips-content {
  padding: 10px 0;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
}

.tip-icon {
  font-size: 16px;
  color: #67c23a;
  margin-right: 10px;
  margin-top: 3px;
}

.tip-icon.warning {
  color: #f56c6c;
}

.tip-text {
  flex: 1;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .password-form {
    padding: 0 10px;
  }
  
  .password-strength {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .strength-meter {
    width: 100%;
    margin-bottom: 5px;
  }
}
</style> 