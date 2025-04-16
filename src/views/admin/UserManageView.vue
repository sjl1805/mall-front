<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { useFileStore } from '@/stores/file'
import ImageUploader from '@/components/ImageUploader.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, Lock, More } from '@element-plus/icons-vue'

const adminStore = useAdminStore()
const fileStore = useFileStore()

// 用户列表数据
const userList = ref([])
const total = ref(0)
const loading = ref(false)

// 分页和查询参数
const queryParams = reactive({
  page: 1,
  size: 10,
  username: '',
  nickname: '',
  phone: '',
  email: '',
  status: null
})

// 当前选中的用户（用于编辑）
const currentUser = ref({})

// 对话框可见性控制
const dialogVisible = reactive({
  add: false,
  edit: false,
  resetPassword: false,
  detail: false
})

// 重置密码表单
const resetPasswordForm = reactive({
  userId: null,
  password: '',
  confirmPassword: ''
})

// 用户表单
const userForm = reactive({
  id: null,
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  phone: '',
  email: '',
  status: 1,
  role: 2,
  gender: 1,
  avatar: ''
})

// 用户表单校验规则
const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== userForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 重置密码表单校验规则
const resetPasswordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetPasswordForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 加载用户列表
const loadUserList = async () => {
  loading.value = true
  try {
    const result = await adminStore.fetchUserList(queryParams)
    userList.value = result.records
    total.value = result.total
  } catch (error) {
    console.error('加载用户列表失败', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 重置查询条件
const resetQuery = () => {
  queryParams.username = ''
  queryParams.nickname = ''
  queryParams.phone = ''
  queryParams.email = ''
  queryParams.status = null
  queryParams.page = 1
  loadUserList()
}

// 处理分页变化
const handlePageChange = (page) => {
  queryParams.page = page
  loadUserList()
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  queryParams.size = size
  queryParams.page = 1
  loadUserList()
}

// 打开添加用户对话框
const openAddDialog = () => {
  // 重置表单
  Object.assign(userForm, {
    id: null,
    username: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    phone: '',
    email: '',
    status: 1,
    role: 2,
    gender: 1,
    avatar: ''
  })
  dialogVisible.add = true
}

// 打开编辑用户对话框
const openEditDialog = async (userId) => {
  try {
    const userData = await adminStore.fetchUserDetail(userId)
    // 将用户数据填充到表单
    Object.assign(userForm, {
      id: userData.id,
      username: userData.username,
      nickname: userData.nickname,
      phone: userData.phone || '',
      email: userData.email || '',
      status: userData.status,
      role: userData.role,
      gender: userData.gender || 1,
      avatar: userData.avatar || '',
      // 编辑时不需要填写密码
      password: '',
      confirmPassword: ''
    })
    dialogVisible.edit = true
  } catch (error) {
    console.error('获取用户详情失败', error)
    ElMessage.error('获取用户详情失败')
  }
}

// 打开用户详情对话框
const openDetailDialog = async (userId) => {
  try {
    currentUser.value = await adminStore.fetchUserDetail(userId)
    dialogVisible.detail = true
  } catch (error) {
    console.error('获取用户详情失败', error)
    ElMessage.error('获取用户详情失败')
  }
}

// 打开重置密码对话框
const openResetPasswordDialog = (userId) => {
  resetPasswordForm.userId = userId
  resetPasswordForm.password = ''
  resetPasswordForm.confirmPassword = ''
  dialogVisible.resetPassword = true
}

// 提交添加用户
const submitAddUser = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        // 构建用户对象，去除确认密码字段
        const userData = { ...userForm }
        delete userData.confirmPassword
        
        const success = await adminStore.createUser(userData)
        if (success) {
          dialogVisible.add = false
          loadUserList()
        }
      } catch (error) {
        console.error('添加用户失败', error)
      }
    }
  })
}

// 提交编辑用户
const submitEditUser = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        // 构建用户对象，去除不需要的字段
        const userData = { ...userForm }
        delete userData.confirmPassword
        // 如果密码为空，不提交密码字段
        if (!userData.password) {
          delete userData.password
        }
        
        const success = await adminStore.editUser(userData)
        if (success) {
          dialogVisible.edit = false
          loadUserList()
        }
      } catch (error) {
        console.error('编辑用户失败', error)
      }
    }
  })
}

// 提交重置密码
const submitResetPassword = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const success = await adminStore.resetUserPassword(
          resetPasswordForm.userId, 
          resetPasswordForm.password
        )
        if (success) {
          dialogVisible.resetPassword = false
        }
      } catch (error) {
        console.error('重置密码失败', error)
      }
    }
  })
}

// 删除用户
const handleDeleteUser = (userId) => {
  ElMessageBox.confirm(
    '确定要删除此用户吗？此操作不可恢复',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const success = await adminStore.removeUser(userId)
      if (success) {
        loadUserList()
      }
    } catch (error) {
      console.error('删除用户失败', error)
    }
  }).catch(() => {
    // 取消删除
  })
}

// 更新用户状态
const handleUpdateStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    const success = await adminStore.changeUserStatus(row.id, newStatus)
    if (success) {
      // 直接更新列表中的状态，不需要重新加载整个列表
      row.status = newStatus
    }
  } catch (error) {
    console.error('更新用户状态失败', error)
  }
}

// 更新用户角色
const handleUpdateRole = async (userId, role) => {
  try {
    const success = await adminStore.changeUserRole(userId, role)
    if (success) {
      // 更新成功后重新加载用户列表
      loadUserList()
    }
  } catch (error) {
    console.error('更新用户角色失败', error)
  }
}

// 格式化用户状态
const formatUserStatus = (status) => {
  return status === 1 ? '正常' : '禁用'
}

// 格式化用户角色
const formatUserRole = (role) => {
  return role === 1 ? '管理员' : '普通用户'
}

// 格式化性别
const formatGender = (gender) => {
  switch (gender) {
    case 1: return '男'
    case 2: return '女'
    default: return '未知'
  }
}

// 组件挂载时加载用户列表
onMounted(() => {
  loadUserList()
})
</script>

<template>
  <div class="user-manage-container">
    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
        </div>
      </template>
      
      <!-- 搜索表单 -->
      <el-form :model="queryParams" inline>
        <el-form-item label="用户名">
          <el-input v-model="queryParams.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="queryParams.nickname" placeholder="请输入昵称" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="queryParams.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="queryParams.email" placeholder="请输入邮箱" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadUserList">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 用户列表 -->
    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="primary" :icon="Plus" @click="openAddDialog">添加用户</el-button>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="userList"
        border
        style="width: 100%"
      >
        <el-table-column type="index" width="50" label="#" />
        <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
        <el-table-column prop="nickname" label="昵称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" min-width="120" show-overflow-tooltip />
        <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ formatUserStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 1 ? 'primary' : ''">
              {{ formatUserRole(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160" show-overflow-tooltip />
        <el-table-column fixed="right" label="操作" width="220">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetailDialog(row.id)">详情</el-button>
            <el-button type="primary" link @click="openEditDialog(row.id)">编辑</el-button>
            <el-dropdown trigger="click">
              <el-button type="primary" link>
                更多<el-icon class="el-icon--right"><More /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="openResetPasswordDialog(row.id)">
                    <el-icon><Lock /></el-icon>重置密码
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleUpdateStatus(row)">
                    {{ row.status === 1 ? '禁用' : '启用' }}用户
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleUpdateRole(row.id, row.role === 1 ? 2 : 1)">
                    设为{{ row.role === 1 ? '普通用户' : '管理员' }}
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleDeleteUser(row.id)" style="color: #F56C6C">
                    <el-icon><Delete /></el-icon>删除用户
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    
    <!-- 添加用户对话框 -->
    <el-dialog
      v-model="dialogVisible.add"
      title="添加用户"
      width="500px"
    >
      <el-form
        ref="addFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="100px"
      >
        <!-- 用户头像上传 -->
        <el-form-item label="头像">
          <div class="avatar-uploader">
            <ImageUploader
              v-model="userForm.avatar"
              type="avatar"
              :is-admin="true"
              :max-size="2"
              :preview-size="100"
            />
          </div>
        </el-form-item>
        
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="userForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="userForm.gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="2">女</el-radio>
            <el-radio :label="0">未知</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-radio-group v-model="userForm.role">
            <el-radio :label="1">管理员</el-radio>
            <el-radio :label="2">普通用户</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible.add = false">取消</el-button>
          <el-button type="primary" @click="submitAddUser(addFormRef)">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible.edit"
      title="编辑用户"
      width="500px"
    >
      <el-form
        ref="editFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="100px"
      >
        <!-- 用户头像上传 -->
        <el-form-item label="头像">
          <div class="avatar-uploader">
            <ImageUploader
              v-model="userForm.avatar"
              type="avatar"
              :is-admin="true"
              :max-size="2"
              :preview-size="100"
            />
          </div>
        </el-form-item>
        
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" disabled />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="userForm.gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="2">女</el-radio>
            <el-radio :label="0">未知</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-radio-group v-model="userForm.role">
            <el-radio :label="1">管理员</el-radio>
            <el-radio :label="2">普通用户</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible.edit = false">取消</el-button>
          <el-button type="primary" @click="submitEditUser(editFormRef)">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="dialogVisible.resetPassword"
      title="重置密码"
      width="500px"
    >
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetPasswordForm.password" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetPasswordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible.resetPassword = false">取消</el-button>
          <el-button type="primary" @click="submitResetPassword(resetPasswordFormRef)">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="dialogVisible.detail"
      title="用户详情"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentUser.nickname }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentUser.email || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag :type="currentUser.role === 1 ? 'primary' : ''">
            {{ formatUserRole(currentUser.role) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentUser.status === 1 ? 'success' : 'danger'">
            {{ formatUserStatus(currentUser.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="性别">{{ formatGender(currentUser.gender) }}</el-descriptions-item>
        <el-descriptions-item label="注册时间" :span="2">{{ currentUser.createTime }}</el-descriptions-item>
        <el-descriptions-item label="最后登录时间" :span="2">{{ currentUser.lastLoginTime || '未登录' }}</el-descriptions-item>
        <el-descriptions-item label="头像" :span="2">
          <div v-if="currentUser.avatar" class="user-avatar">
            <el-image 
              :src="fileStore.getPreviewUrl(currentUser.avatar)" 
              :preview-src-list="[fileStore.getPreviewUrl(currentUser.avatar)]" 
              fit="cover" 
            />
          </div>
          <span v-else>未设置头像</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible.detail = false">关闭</el-button>
          <el-button type="primary" @click="openEditDialog(currentUser.id)">编辑</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-manage-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.user-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
}

.user-avatar .el-image {
  width: 100%;
  height: 100%;
}

.avatar-uploader {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

:deep(.el-descriptions__label) {
  width: 120px;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
}

:deep(.el-dropdown-menu__item .el-icon) {
  margin-right: 5px;
}
</style> 