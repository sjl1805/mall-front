<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useFileStore } from '@/stores/file'

const userStore = useUserStore()
const fileStore = useFileStore()

// 用户信息表单
const userForm = ref({
  nickname: '',
  gender: '',
  email: '',
  phone: '',
  birthday: '',
  avatarUrl: '',
  avatarFile: null
})

// 表单验证规则
const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度应为2-20个字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 是否处于编辑状态
const isEditing = ref(false)
// 是否正在提交
const isSubmitting = ref(false)
// 表单引用
const formRef = ref(null)

// 性别选项
const genderOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '保密', value: 'secret' }
]

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    await userStore.getUserInfo()
    initUserForm()
  } catch (error) {
    console.error('获取用户信息失败', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 初始化表单数据
const initUserForm = () => {
  userForm.value.nickname = userStore.userInfo.nickname || ''
  userForm.value.gender = userStore.userInfo.gender || 'secret'
  userForm.value.email = userStore.userInfo.email || ''
  userForm.value.phone = userStore.userInfo.phone || ''
  userForm.value.birthday = userStore.userInfo.birthday || ''
  userForm.value.avatarUrl = getAvatarUrl(userStore.userInfo.avatar)
}

// 获取头像URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '/images/default-avatar.png'
  return fileStore.getPreviewUrl(avatarPath)
}

// 处理头像上传
const handleAvatarUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  // 检查文件类型
  if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
    ElMessage.error('只能上传JPG/PNG/GIF格式的图片')
    return
  }
  
  // 检查文件大小 (2MB)
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过2MB')
    return
  }
  
  // 显示预览
  userForm.value.avatarFile = file
  userForm.value.avatarUrl = URL.createObjectURL(file)
}

// 触发文件选择
const triggerFileInput = () => {
  document.getElementById('avatar-upload').click()
}

// 开始编辑
const startEditing = () => {
  isEditing.value = true
}

// 取消编辑
const cancelEditing = () => {
  ElMessageBox.confirm('确定要取消编辑吗？所有修改将不会保存。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '返回编辑',
    type: 'warning'
  }).then(() => {
    isEditing.value = false
    initUserForm()
  }).catch(() => {})
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      return ElMessage.error('请正确填写表单内容')
    }

    isSubmitting.value = true
    
    try {
      // 如果上传了新头像，先上传头像
      let avatarPath = userStore.userInfo.avatar
      if (userForm.value.avatarFile) {
        const formData = new FormData()
        formData.append('file', userForm.value.avatarFile)
        
        const uploadResult = await fileStore.uploadFile(formData)
        if (uploadResult && uploadResult.filePath) {
          avatarPath = uploadResult.filePath
        }
      }
      
      // 更新用户信息
      await userStore.updateUserInfo({
        nickname: userForm.value.nickname,
        gender: userForm.value.gender,
        email: userForm.value.email,
        phone: userForm.value.phone,
        birthday: userForm.value.birthday,
        avatar: avatarPath
      })
      
      ElMessage.success('个人资料更新成功')
      isEditing.value = false
      // 刷新用户信息
      await fetchUserInfo()
    } catch (error) {
      console.error('更新用户信息失败', error)
      ElMessage.error('更新用户信息失败')
    } finally {
      isSubmitting.value = false
    }
  })
}

// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo()
})
</script>

<template>
  <div class="profile-container">
    <div class="page-header">
      <h2 class="page-title">个人资料</h2>
      <div class="page-actions" v-if="!isEditing">
        <el-button type="primary" @click="startEditing">编辑资料</el-button>
      </div>
    </div>
    
    <el-card class="profile-card">
      <el-form 
        ref="formRef"
        :model="userForm"
        :rules="rules"
        label-width="100px"
        class="profile-form"
        :disabled="!isEditing"
      >
        <div class="avatar-section">
          <div class="avatar-container">
            <img :src="userForm.avatarUrl" alt="用户头像" class="avatar-image" />
            <div v-if="isEditing" class="avatar-edit" @click="triggerFileInput">
              <i class="el-icon-camera"></i>
              <span>更换头像</span>
            </div>
            <input 
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/gif"
              @change="handleAvatarUpload"
              style="display: none;"
            />
          </div>
          <div class="upload-tips" v-if="isEditing">
            <p>支持JPG、PNG、GIF格式，最大2MB</p>
          </div>
        </div>
        
        <div class="form-content">
          <el-form-item label="账户名" prop="username">
            <el-input v-model="userStore.userInfo.username" disabled></el-input>
            <div class="input-tip">账户名不可修改</div>
          </el-form-item>
          
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="userForm.nickname" placeholder="请输入昵称"></el-input>
          </el-form-item>
          
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="userForm.gender">
              <el-radio v-for="option in genderOptions" :key="option.value" :label="option.value">
                {{ option.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="手机号码" prop="phone">
            <el-input v-model="userForm.phone" placeholder="请输入手机号码"></el-input>
          </el-form-item>
          
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="userForm.email" placeholder="请输入邮箱"></el-input>
          </el-form-item>
          
          <el-form-item label="生日" prop="birthday">
            <el-date-picker
              v-model="userForm.birthday"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled-date="date => date > new Date()"
            >
            </el-date-picker>
          </el-form-item>
          
          <el-form-item label="注册时间">
            <el-input v-model="userStore.userInfo.createdAt" disabled></el-input>
          </el-form-item>
        </div>
        
        <div class="form-actions" v-if="isEditing">
          <el-button @click="cancelEditing">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="isSubmitting">保存</el-button>
        </div>
      </el-form>
    </el-card>
    
    <el-card class="security-card">
      <template #header>
        <div class="security-header">
          <h3>账号安全</h3>
        </div>
      </template>
      
      <div class="security-item">
        <div class="security-icon safe">
          <i class="el-icon-lock"></i>
        </div>
        <div class="security-info">
          <h4>登录密码</h4>
          <p>定期修改密码可以保护您的账号安全</p>
        </div>
        <div class="security-action">
          <el-button type="primary" plain @click="$router.push('/user/password')">修改密码</el-button>
        </div>
      </div>
      
      <div class="security-item">
        <div class="security-icon" :class="userForm.phone ? 'safe' : 'danger'">
          <i class="el-icon-mobile-phone"></i>
        </div>
        <div class="security-info">
          <h4>手机绑定</h4>
          <p v-if="userForm.phone">已绑定: {{ userForm.phone }}</p>
          <p v-else>绑定手机号码可增强账号安全性</p>
        </div>
        <div class="security-action">
          <el-button type="primary" plain v-if="!userForm.phone" @click="startEditing">绑定手机</el-button>
          <el-button v-else @click="startEditing">修改</el-button>
        </div>
      </div>
      
      <div class="security-item">
        <div class="security-icon" :class="userForm.email ? 'safe' : 'danger'">
          <i class="el-icon-message"></i>
        </div>
        <div class="security-info">
          <h4>邮箱绑定</h4>
          <p v-if="userForm.email">已绑定: {{ userForm.email }}</p>
          <p v-else>绑定邮箱可用于接收订单通知，找回密码等</p>
        </div>
        <div class="security-action">
          <el-button type="primary" plain v-if="!userForm.email" @click="startEditing">绑定邮箱</el-button>
          <el-button v-else @click="startEditing">修改</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.profile-container {
  padding: 0 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  color: #333;
  margin: 0;
}

.profile-card {
  margin-bottom: 20px;
}

.profile-form {
  display: flex;
  flex-wrap: wrap;
}

.avatar-section {
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 40px;
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 15px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-edit {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
  opacity: 0;
}

.avatar-container:hover .avatar-edit {
  opacity: 1;
}

.upload-tips {
  color: #999;
  font-size: 12px;
  text-align: center;
}

.form-content {
  flex: 1;
  min-width: 300px;
}

.input-tip {
  color: #999;
  font-size: 12px;
  margin-top: 5px;
}

.form-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.security-card {
  margin-bottom: 20px;
}

.security-header {
  display: flex;
  align-items: center;
}

.security-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.security-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.security-item:last-child {
  border-bottom: none;
}

.security-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 15px;
}

.security-icon.safe {
  background-color: #f0f9eb;
  color: #67c23a;
}

.security-icon.danger {
  background-color: #fef0f0;
  color: #f56c6c;
}

.security-info {
  flex: 1;
}

.security-info h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 5px 0;
}

.security-info p {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.security-action {
  margin-left: 20px;
}

@media (max-width: 768px) {
  .profile-form {
    flex-direction: column;
  }
  
  .avatar-section {
    width: 100%;
    margin-right: 0;
    margin-bottom: 20px;
  }
  
  .security-item {
    flex-direction: column;
    align-items: flex-start;
    text-align: center;
  }
  
  .security-icon {
    margin: 0 auto 10px;
  }
  
  .security-info {
    margin-bottom: 10px;
    text-align: center;
  }
  
  .security-action {
    margin-left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
  }
}
</style> 