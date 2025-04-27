import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import { login as apiLogin, register as apiRegister, logout as apiLogout, getCaptcha as apiGetCaptcha } from '@/api/auth'
import { 
  getUserInfo as apiGetUserInfo, 
  updateUserInfo as apiUpdateUserInfo, 
  updatePassword as apiUpdatePassword,
  uploadAvatar as apiUploadAvatar,
  checkUsername as apiCheckUsername
} from '@/api/user'
import { getRoleInfo, checkAdmin, Role } from '@/api/role'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  // 基本用户信息
  const token = ref('')
  const userId = ref(null)
  const username = ref('')
  const nickname = ref('')
  const avatar = ref('')
  const phone = ref('')
  const email = ref('')
  const gender = ref(0) // 默认为未知
  const birthday = ref(null) // 生日
  const role = ref(2) // 默认为普通用户
  const status = ref(1) // 默认为正常状态
  const registerTime = ref(null) // 注册时间
  const lastLoginTime = ref(null) // 最后登录时间 
  
  // 权限相关
  const permissions = ref([])
  const roleName = ref('普通用户')
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === Role.ADMIN)
  const userInfo = computed(() => ({
    userId: userId.value,
    username: username.value,
    nickname: nickname.value,
    avatar: avatar.value,
    phone: phone.value,
    email: email.value,
    gender: gender.value,
    birthday: birthday.value,
    role: role.value,
    status: status.value,
    registerTime: registerTime.value,
    lastLoginTime: lastLoginTime.value
  }))
  
  // 登录方法
  const login = async (loginData) => {
    try {
      const res = await apiLogin(loginData)
      
      if (res.code === 200) {
        setUserInfo(res.data)
        // 登录成功后获取用户权限
        await fetchUserPermissions()
        ElMessage.success(res.message || '登录成功')
        return res
      }
    } catch (error) {
      console.error('登录失败', error)
      ElMessage.error(error.response?.data?.message || '登录失败，请稍后重试')
      throw error
    }
  }

  // 注册方法
  const register = async (registerData) => {
    try {
      const res = await apiRegister(registerData)
      
      if (res.code === 200) {
        setUserInfo(res.data)
        // 注册成功后获取用户权限
        await fetchUserPermissions()
        ElMessage.success(res.message || '注册成功')
        return res
      }
    } catch (error) {
      console.error('注册失败', error)
      ElMessage.error(error.response?.data?.message || '注册失败，请稍后重试')
      throw error
    }
  }

  // 退出登录
  const logout = async (redirect = true) => {
    try {
      await apiLogout()
      if (redirect) {
        ElMessage.success('退出登录成功')
      }
    } catch (error) {
      console.error('登出请求失败', error)
    } finally {
      // 无论请求是否成功，都清除用户信息
      clearUserInfo()
      // 如果需要跳转，则跳转到登录页
      if (redirect) {
        router.push('/login')
      }
    }
  }

  // 获取验证码
  const getCaptcha = async () => {
    try {
      const res = await apiGetCaptcha()
      
      if (res.code === 200) {
        // 将后端返回的key字段映射到前端所需的captchaKey字段
        return {
          captchaKey: res.data.key,
          image: res.data.image
        }
      }
    } catch (error) {
      console.error('获取验证码失败', error)
      ElMessage.error('获取验证码失败，请刷新重试')
      throw error
    }
  }

  // 获取用户信息
  const getUserInfo = async () => {
    // 如果没有token，直接返回null
    if (!token.value) {
      return null;
    }
    
    // 如果已经有用户ID，说明已经获取过用户信息，可以直接返回
    if (userId.value) {
      return {
        userId: userId.value,
        username: username.value,
        nickname: nickname.value,
        avatar: avatar.value,
        phone: phone.value,
        email: email.value,
        gender: gender.value,
        birthday: birthday.value,
        role: role.value,
        status: status.value,
        registerTime: registerTime.value
      }
    }
    
    // 如果有token但没有用户信息，则从服务器获取
    try {
      const res = await apiGetUserInfo()
      
      if (res.code === 200) {
        // 更新除token外的用户信息
        userId.value = res.data.id
        username.value = res.data.username
        nickname.value = res.data.nickname
        avatar.value = res.data.avatar
        phone.value = res.data.phone
        email.value = res.data.email
        gender.value = res.data.gender
        birthday.value = res.data.birthday
        role.value = res.data.role
        status.value = res.data.status
        registerTime.value = res.data.registerTime           
        // 获取用户权限
        await fetchUserPermissions()
        
        return res.data
      } else if (res.code === 401) {
        // token无效，清除用户信息但不做跳转
        console.warn('获取用户信息失败: token无效')
        clearUserInfo()
        return null
      } else {
        console.error('获取用户信息失败', res.message)
        throw new Error(res.message || '获取用户信息失败')
      }
    } catch (error) {
      console.error('获取用户信息失败', error)
      // 出错时清除用户信息，防止出现状态不一致
      clearUserInfo()
      throw error
    }
  }

  // 更新用户信息
  const updateUserInfo = async (userData) => {
    try {
      const res = await apiUpdateUserInfo(userData)
      
      if (res.code === 200) {
        // 更新本地状态
        if (userData.nickname) nickname.value = userData.nickname
        if (userData.phone) phone.value = userData.phone
        if (userData.email) email.value = userData.email
        if (userData.gender !== undefined) gender.value = userData.gender
        if (userData.birthday) birthday.value = userData.birthday
        
        ElMessage.success('个人信息更新成功')
        return res
      }
    } catch (error) {
      console.error('更新用户信息失败', error)
      ElMessage.error(error.response?.data?.message || '更新失败，请稍后重试')
      throw error
    }
  }

  // 修改密码
  const changePassword = async (oldPassword, newPassword) => {
    try {
      const res = await apiUpdatePassword({
        oldPassword,
        newPassword
      })
      
      if (res.code === 200) {
        ElMessage.success('密码修改成功')
        return res
      }
    } catch (error) {
      console.error('修改密码失败', error)
      ElMessage.error(error.response?.data?.message || '密码修改失败，请检查原密码是否正确')
      throw error
    }
  }

  // 上传头像
  const uploadAvatar = async (formData) => {
    try {
      const res = await apiUploadAvatar(formData)
      
      if (res.code === 200) {
        avatar.value = res.data
        ElMessage.success('头像上传成功')
        return res
      }
    } catch (error) {
      console.error('上传头像失败', error)
      ElMessage.error('头像上传失败，请稍后重试')
      throw error
    }
  }

  // 检查用户名是否存在
  const checkUsernameExists = async (usernameToCheck) => {
    try {
      const res = await apiCheckUsername(usernameToCheck)
      
      if (res.code === 200) {
        return res.data.exists
      }
      return false
    } catch (error) {
      console.error('检查用户名失败', error)
      return false
    }
  }

  // 获取用户权限
  const fetchUserPermissions = async () => {
    if (!token.value) return

    try {
      const res = await getRoleInfo()
      
      if (res.code === 200) {
        permissions.value = res.data.permissions || []
        roleName.value = res.data.roleName || '普通用户'
        return res.data
      }
    } catch (error) {
      console.error('获取用户权限失败', error)
      permissions.value = []
    }
  }

  // 验证管理员权限
  const verifyAdminRole = async () => {
    if (!token.value || role.value !== Role.ADMIN) return false
    
    try {
      const res = await checkAdmin()
      return res.code === 200
    } catch (error) {
      console.error('验证管理员权限失败', error)
      return false
    }
  }

  // 检查是否有特定权限
  const hasPermission = (permissionCode) => {
    return permissions.value.includes(permissionCode)
  }

  // 设置用户信息
  const setUserInfo = (userInfo) => {
    token.value = userInfo.token
    userId.value = userInfo.userId
    username.value = userInfo.username
    nickname.value = userInfo.nickname || username.value
    avatar.value = userInfo.avatar || ''
    phone.value = userInfo.phone || ''
    email.value = userInfo.email || ''
    gender.value = userInfo.gender || 0
    birthday.value = userInfo.birthday || null
    role.value = userInfo.role || Role.USER
    status.value = userInfo.status || 1
    lastLoginTime.value = userInfo.lastLoginTime || null
    registerTime.value = userInfo.registerTime || null
  }

  // 清除用户信息
  const clearUserInfo = () => {
    token.value = ''
    userId.value = null
    username.value = ''
    nickname.value = ''
    avatar.value = ''
    phone.value = ''
    email.value = ''
    gender.value = 0
    birthday.value = null
    role.value = Role.USER
    status.value = 1
    lastLoginTime.value = null
    permissions.value = []
    roleName.value = '普通用户'
  }

  // 获取用户头像或默认头像
  const getAvatarOrDefault = () => {
    return avatar.value || '/images/default-avatar.png'
  }

  // 获取性别文本
  const getGenderText = () => {
    switch (gender.value) {
      case 1:
        return '男'
      case 2:
        return '女'
      default:
        return '未设置'
    }
  }

  // 格式化生日
  const getFormattedBirthday = () => {
    if (!birthday.value) return '未设置'
    
    const date = new Date(birthday.value)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  return {
    // 状态
    token,
    userId,
    username,
    nickname,
    avatar,
    phone,
    email,
    gender,
    birthday,
    role,
    status,
    registerTime,
    permissions,
    roleName,
    
    // 计算属性
    isLoggedIn,
    isAdmin,
    userInfo,
    
    // 方法
    login,
    register,
    logout,
    getCaptcha,
    getUserInfo,
    updateUserInfo,
    changePassword,
    uploadAvatar,
    checkUsernameExists,
    fetchUserPermissions,
    verifyAdminRole,
    hasPermission,
    setUserInfo,
    clearUserInfo,
    getAvatarOrDefault,
    getGenderText,
    getFormattedBirthday
  }
}, {
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'mall-user',
        storage: localStorage,
        paths: [
          'token', 'userId', 'username', 'nickname', 'avatar', 
          'phone', 'email', 'gender', 'birthday', 'role', 
          'status', 'lastLoginTime'
        ]
      }
    ]
  }
}) 