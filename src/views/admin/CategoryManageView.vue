<template>
  <div class="category-manage-container">
    <el-card class="category-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">分类管理</span>
            <el-radio-group v-model="viewMode" size="small" class="view-mode">
              <el-radio-button label="tree">树状视图</el-radio-button>
              <el-radio-button label="list">列表视图</el-radio-button>
            </el-radio-group>
          </div>
          <div class="button-group">
            <el-button type="primary" :icon="Plus" @click="handleAddRootCategory">添加根分类</el-button>
            <el-button type="success" :icon="Upload" @click="dialogVisible.batch = true">批量导入</el-button>
            <el-button :icon="RefreshRight" @click="loadCategoryData">刷新</el-button>
          </div>
        </div>
      </template>
      
      <!-- 树状视图 -->
      <div v-if="viewMode === 'tree'" class="tree-container">
        <el-tree
          ref="categoryTreeRef"
          v-loading="loading"
          :data="categoryTree"
          node-key="id"
          :props="{ label: 'name', children: 'children' }"
          default-expand-all
          :expand-on-click-node="false"
          highlight-current
          draggable
          @node-drop="handleNodeDrop"
        >
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <div class="node-label">
                <el-image 
                  v-if="data.icon" 
                  :src="getIconUrl(data.icon)" 
                  fit="cover" 
                  class="category-icon"
                />
                <span :class="{ 'disabled-node': data.status === 0 }">{{ node.label }}</span>
                <el-tag v-if="data.status === 0" size="small" type="info" class="status-tag">已禁用</el-tag>
                <el-tag size="small" type="success" class="level-tag">{{ `${data.level}级` }}</el-tag>
                <el-tag size="small" type="warning" class="sort-tag">排序:{{ data.sort }}</el-tag>
              </div>
              <div class="node-actions">
                <el-button type="primary" link size="small" @click="handleAddSubCategory(data)">
                  添加子分类
                </el-button>
                <el-button type="primary" link size="small" @click="handleEditCategory(data)">
                  编辑
                </el-button>
                <el-dropdown trigger="click" @command="command => handleCommand(command, data)">
                  <el-button type="primary" link size="small">
                    更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="data.status === 1 ? 'disable' : 'enable'">
                        {{ data.status === 1 ? '禁用' : '启用' }}
                      </el-dropdown-item>
                      <el-dropdown-item command="upload">上传图标</el-dropdown-item>
                      <el-dropdown-item command="sort">修改排序</el-dropdown-item>
                      <el-dropdown-item divided command="delete" style="color: #F56C6C">
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
        </el-tree>
      </div>

      <!-- 列表视图 -->
      <div v-else class="list-container">
        <el-table
          v-loading="loading"
          :data="flattenedCategories"
          style="width: 100%"
          row-key="id"
          border
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="分类名称" min-width="200">
            <template #default="{ row }">
              <div class="category-name-cell">
                <el-image 
                  v-if="row.icon" 
                  :src="getIconUrl(row.icon)" 
                  fit="cover" 
                  class="category-icon-small"
                />
                <span :style="{ marginLeft: (row.level - 1) * 20 + 'px' }" :class="{ 'disabled-node': row.status === 0 }">
                  {{ row.name }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="层级" width="100">
            <template #default="{ row }">
              <el-tag size="small" type="success">{{ `${row.level}级` }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="100" sortable />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleAddSubCategory(row)">
                添加子分类
              </el-button>
              <el-button type="primary" link size="small" @click="handleEditCategory(row)">
                编辑
              </el-button>
              <el-dropdown trigger="click" @command="command => handleCommand(command, row)">
                <el-button type="primary" link size="small">
                  更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="row.status === 1 ? 'disable' : 'enable'">
                      {{ row.status === 1 ? '禁用' : '启用' }}
                    </el-dropdown-item>
                    <el-dropdown-item command="upload">上传图标</el-dropdown-item>
                    <el-dropdown-item command="sort">修改排序</el-dropdown-item>
                    <el-dropdown-item divided command="delete" style="color: #F56C6C">
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="isEmpty" description="暂无分类数据" />
    </el-card>
    
    <!-- 添加/编辑分类对话框 -->
    <el-dialog 
      v-model="dialogVisible.form" 
      :title="isEdit ? '编辑分类' : (isAddSub ? '添加子分类' : '添加根分类')"
      width="500px"
    >
      <el-form 
        ref="categoryFormRef" 
        :model="categoryForm" 
        :rules="categoryRules" 
        label-width="100px"
      >
        <el-form-item label="父级分类" v-if="isAddSub">
          <span>{{ parentCategory?.name || '无' }}</span>
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类排序" prop="sort">
          <el-input-number v-model="categoryForm.sort" :min="0" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="分类图标">
          <div class="icon-preview">
            <el-image 
              v-if="categoryForm.icon" 
              :src="getIconUrl(categoryForm.icon)" 
              fit="cover"
              class="preview-icon"
            />
            <div v-else class="no-icon">暂无图标</div>
          </div>
          <el-upload
            class="icon-uploader"
            :action="uploadIconAction"
            :http-request="uploadCategoryIcon"
            :show-file-list="false"
            :before-upload="beforeIconUpload"
          >
            <el-button type="primary">上传图标</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="categoryForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="dialogVisible.form = false">取消</el-button>
          <el-button type="primary" @click="submitCategoryForm(categoryFormRef)">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 修改排序对话框 -->
    <el-dialog v-model="dialogVisible.sort" title="修改排序" width="400px">
      <el-form :model="sortForm" label-width="100px">
        <el-form-item label="分类名称">
          <span>{{ currentCategory?.name }}</span>
        </el-form-item>
        <el-form-item label="当前排序">
          <span>{{ currentCategory?.sort }}</span>
        </el-form-item>
        <el-form-item label="新排序">
          <el-input-number v-model="sortForm.sort" :min="0" :step="1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="dialogVisible.sort = false">取消</el-button>
          <el-button type="primary" @click="submitUpdateSort">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 上传图标对话框 -->
    <el-dialog v-model="dialogVisible.upload" title="上传分类图标" width="400px">
      <el-form label-width="100px">
        <el-form-item label="分类名称">
          <span>{{ currentCategory?.name }}</span>
        </el-form-item>
        <el-form-item label="当前图标">
          <div class="icon-preview">
            <el-image 
              v-if="currentCategory?.icon" 
              :src="getIconUrl(currentCategory.icon)" 
              fit="cover"
              class="preview-icon"
            />
            <div v-else class="no-icon">暂无图标</div>
          </div>
        </el-form-item>
        <el-form-item label="上传图标">
          <el-upload
            class="icon-uploader"
            :action="uploadIconAction"
            :http-request="uploadExistingCategoryIcon"
            :show-file-list="false"
            :before-upload="beforeIconUpload"
          >
            <el-button type="primary">选择图片</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="dialogVisible.upload = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 批量导入对话框 -->
    <el-dialog v-model="dialogVisible.batch" title="批量导入分类" width="500px">
      <el-alert
        title="请按照以下格式填写分类信息，每行一个分类，父子关系用'-'表示，例如：电子产品-手机-苹果"
        type="info"
        :closable="false"
        style="margin-bottom: 15px"
      />
      <el-form :model="batchForm">
        <el-form-item>
          <el-input
            v-model="batchForm.content"
            type="textarea"
            :rows="10"
            placeholder="例如：
电子产品
电子产品-手机
电子产品-手机-苹果
电子产品-电脑
食品
食品-零食"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="dialogVisible.batch = false">取消</el-button>
          <el-button type="primary" @click="submitBatchImport">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdminCategoryStore } from '@/stores/adminCategory'
import { useFileStore } from '@/stores/file'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown, RefreshRight, Upload } from '@element-plus/icons-vue'

const adminCategoryStore = useAdminCategoryStore()
const fileStore = useFileStore()

// 视图模式
const viewMode = ref('tree')

// 分类数据
const categoryTree = ref([])
const loading = ref(false)
const categoryTreeRef = ref(null)

// 计算属性：扁平化的分类列表（用于表格视图）
const flattenedCategories = computed(() => {
  const flatten = (categories, result = []) => {
    categories.forEach(category => {
      result.push(category)
      if (category.children && category.children.length > 0) {
        flatten(category.children, result)
      }
    })
    return result
  }
  return flatten(categoryTree.value)
})

// 计算属性：是否为空数据
const isEmpty = computed(() => {
  return !loading.value && categoryTree.value.length === 0
})

// 当前操作的分类
const currentCategory = ref(null)
const parentCategory = ref(null)

// 对话框控制
const dialogVisible = reactive({
  form: false,
  sort: false,
  upload: false,
  batch: false
})

// 表单状态控制
const isEdit = ref(false)
const isAddSub = ref(false)

// 分类表单数据
const categoryForm = reactive({
  id: null,
  parentId: 0,
  name: '',
  icon: '',
  sort: 0,
  status: 1
})

// 排序表单数据
const sortForm = reactive({
  categoryId: null,
  sort: 0
})

// 批量导入表单
const batchForm = reactive({
  content: ''
})

// 表单校验规则
const categoryRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
}

// 表单引用
const categoryFormRef = ref(null)

// 上传图标相关
const uploadIconAction = '#' // 由于使用自定义上传，这里不需要真实的URL

// 加载分类数据
const loadCategoryData = async () => {
  loading.value = true
  try {
    await adminCategoryStore.fetchCategoryTree()
    categoryTree.value = adminCategoryStore.categoryTree || []
    
    // 如果分类树为空，检查是否有扁平列表数据
    if (categoryTree.value.length === 0 && adminCategoryStore.categoryList.length > 0) {
      // 将扁平列表转换为树形结构
      categoryTree.value = convertToTree(adminCategoryStore.categoryList)
    }
  } catch (error) {
    console.error('加载分类数据失败', error)
    ElMessage.error('加载分类数据失败')
  } finally {
    loading.value = false
  }
}

// 将扁平列表转换为树形结构
const convertToTree = (list) => {
  const map = {}
  const tree = []

  // 首先创建一个以id为键的映射
  list.forEach(item => {
    map[item.id] = { ...item, children: [] }
  })

  // 然后构建树形结构
  list.forEach(item => {
    const node = map[item.id]
    if (item.parentId === 0) {
      // 根节点直接加入树中
      tree.push(node)
    } else {
      // 子节点加入到父节点的children中
      const parent = map[item.parentId]
      if (parent) {
        parent.children.push(node)
      }
    }
  })

  // 对每个层级的节点按sort字段排序
  const sortNodes = (nodes) => {
    nodes.sort((a, b) => a.sort - b.sort)
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children)
      }
    })
  }
  sortNodes(tree)

  return tree
}

// 打开添加根分类对话框
const handleAddRootCategory = () => {
  isEdit.value = false
  isAddSub.value = false
  
  // 重置表单
  Object.assign(categoryForm, {
    id: null,
    parentId: 0,
    name: '',
    icon: '',
    sort: 0,
    status: 1
  })
  
  dialogVisible.form = true
}

// 打开添加子分类对话框
const handleAddSubCategory = (data) => {
  isEdit.value = false
  isAddSub.value = true
  parentCategory.value = data
  
  // 重置表单
  Object.assign(categoryForm, {
    id: null,
    parentId: data.id,
    name: '',
    icon: '',
    sort: 0,
    status: 1
  })
  
  dialogVisible.form = true
}

// 打开编辑分类对话框
const handleEditCategory = async (data) => {
  isEdit.value = true
  isAddSub.value = false
  
  try {
    const categoryDetail = await adminCategoryStore.fetchCategoryDetail(data.id)
    
    // 将详情数据填充到表单
    Object.assign(categoryForm, {
      id: categoryDetail.id,
      parentId: categoryDetail.parentId,
      name: categoryDetail.name,
      icon: categoryDetail.icon || '',
      sort: categoryDetail.sort,
      status: categoryDetail.status
    })
    
    dialogVisible.form = true
  } catch (error) {
    console.error('获取分类详情失败', error)
    ElMessage.error('获取分类详情失败')
  }
}

// 提交分类表单
const submitCategoryForm = async (formEl) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        let success
        if (isEdit.value) {
          // 编辑分类
          success = await adminCategoryStore.updateCategory(categoryForm)
        } else {
          // 添加分类
          success = await adminCategoryStore.addCategory(categoryForm)
        }
        
        if (success) {
          ElMessage.success(isEdit.value ? '更新分类成功' : '添加分类成功')
          dialogVisible.form = false
          loadCategoryData()
        }
      } catch (error) {
        console.error(isEdit.value ? '更新分类失败' : '添加分类失败', error)
        ElMessage.error(isEdit.value ? '更新分类失败' : '添加分类失败')
      }
    } else {
      ElMessage.error('请检查表单是否填写正确')
    }
  })
}

// 更多操作处理
const handleCommand = (command, data) => {
  currentCategory.value = data
  
  switch (command) {
    case 'delete':
      handleDeleteCategory(data.id)
      break
    case 'disable':
      handleUpdateStatus(data.id, 0)
      break
    case 'enable':
      handleUpdateStatus(data.id, 1)
      break
    case 'sort':
      openSortDialog(data)
      break
    case 'upload':
      openUploadDialog(data)
      break
  }
}

// 打开排序对话框
const openSortDialog = (data) => {
  sortForm.categoryId = data.id
  sortForm.sort = data.sort || 0
  dialogVisible.sort = true
}

// 提交更新排序
const submitUpdateSort = async () => {
  try {
    const success = await adminCategoryStore.updateCategorySort(
      sortForm.categoryId,
      sortForm.sort
    )
    
    if (success) {
      ElMessage.success('更新排序成功')
      dialogVisible.sort = false
      loadCategoryData()
    }
  } catch (error) {
    console.error('更新排序失败', error)
    ElMessage.error('更新排序失败')
  }
}

// 打开上传图标对话框
const openUploadDialog = (data) => {
  dialogVisible.upload = true
}

// 图片上传前的校验
const beforeIconUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片!')
    return false
  }
  
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  
  return true
}

// 获取图标预览URL
const getIconUrl = (iconUrl) => {
  return fileStore.getPreviewUrl(iconUrl)
}

// 上传分类图标（添加/编辑表单中）
const uploadCategoryIcon = async (options) => {
  try {
    const file = options.file
    // 注意：添加/编辑分类时，可能还没有categoryId，此时上传的是临时图片
    const fileUrl = await fileStore.uploadSingleFile(file, true) // 使用管理员权限上传
    
    if (fileUrl) {
      categoryForm.icon = fileUrl
      ElMessage.success('上传图标成功')
    }
  } catch (error) {
    console.error('上传图标失败', error)
    ElMessage.error('上传图标失败')
  }
}

// 上传现有分类的图标
const uploadExistingCategoryIcon = async (options) => {
  try {
    const file = options.file
    const fileUrl = await fileStore.uploadSingleFile(file, true) // 使用管理员权限上传
    
    if (fileUrl) {
      // 更新当前分类的图标
      currentCategory.value.icon = fileUrl
      ElMessage.success('上传图标成功')
      // 关闭对话框
      dialogVisible.upload = false
      // 重新加载分类树
      loadCategoryData()
    }
  } catch (error) {
    console.error('上传图标失败', error)
    ElMessage.error('上传图标失败')
  }
}

// 删除分类
const handleDeleteCategory = (categoryId) => {
  ElMessageBox.confirm(
    '确定要删除此分类吗？如果有子分类，将无法删除',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const success = await adminCategoryStore.deleteCategory(categoryId)
      if (success) {
        ElMessage.success('删除分类成功')
        loadCategoryData()
      }
    } catch (error) {
      console.error('删除分类失败', error)
      ElMessage.error('删除分类失败：' + (error.message || '未知错误'))
    }
  }).catch(() => {
    // 取消删除操作
  })
}

// 更新分类状态
const handleUpdateStatus = async (categoryId, status) => {
  const statusText = status === 1 ? '启用' : '禁用'
  
  try {
    const success = await adminCategoryStore.updateCategoryStatus(categoryId, status)
    if (success) {
      ElMessage.success(`${statusText}分类成功`)
      loadCategoryData()
    }
  } catch (error) {
    console.error(`${statusText}分类失败`, error)
    ElMessage.error(`${statusText}分类失败`)
  }
}

// 处理节点拖拽
const handleNodeDrop = async ({ draggingNode, dropNode, dropType }) => {
  const draggingData = draggingNode.data
  const dropData = dropNode.data
  
  try {
    let targetParentId
    let newSort = 0
    
    if (dropType === 'inner') {
      // 放到子节点
      targetParentId = dropData.id
      // 获取目标节点的子节点数量，新节点排在最后
      newSort = (dropData.children?.length || 0) + 1
    } else {
      // 放到前面或后面，使用相同的父节点
      targetParentId = dropData.parentId || 0
      // 根据放置位置计算新的排序值
      if (dropType === 'before') {
        newSort = dropData.sort
      } else {
        newSort = dropData.sort + 1
      }
    }
    
    // 更新分类的父节点和排序
    const success = await adminCategoryStore.moveCategory(
      draggingData.id,
      targetParentId,
      newSort
    )
    
    if (success) {
      ElMessage.success('移动分类成功')
      // 重新加载树，以确保数据正确
      loadCategoryData()
    }
  } catch (error) {
    console.error('移动分类失败', error)
    ElMessage.error('移动分类失败')
    // 失败后恢复原状，重新加载树
    loadCategoryData()
  }
}

// 批量导入分类
const submitBatchImport = async () => {
  if (!batchForm.content.trim()) {
    ElMessage.warning('请输入分类数据')
    return
  }
  
  try {
    // 解析输入内容
    const lines = batchForm.content.split('\n').filter(line => line.trim())
    const categories = []
    const categoryMap = new Map() // 用于临时存储分类路径到ID的映射
    
    for (const line of lines) {
      const parts = line.trim().split('-')
      
      if (parts.length === 0 || !parts[0]) continue
      
      let parentId = 0
      let fullPath = ''
      
      // 构建每一级的分类
      for (let i = 0; i < parts.length; i++) {
        const name = parts[i].trim()
        if (!name) continue
        
        // 构建当前层级的完整路径
        fullPath = fullPath ? `${fullPath}-${name}` : name
        
        // 如果该路径已经处理过，获取它的ID作为下一级的父ID
        if (categoryMap.has(fullPath)) {
          parentId = categoryMap.get(fullPath)
          continue
        }
        
        // 创建新的分类对象
        const category = {
          name,
          parentId,
          sort: 0,
          status: 1
        }
        
        // 为这个路径分配一个临时ID
        const tempId = `temp_${categories.length + 1}`
        categoryMap.set(fullPath, tempId)
        
        // 将分类添加到待导入列表
        categories.push(category)
        
        // 下一级的父ID
        parentId = tempId
      }
    }
    
    if (categories.length === 0) {
      ElMessage.warning('没有有效的分类数据')
      return
    }
    
    // 确认导入
    ElMessageBox.confirm(
      `确定要导入 ${categories.length} 个分类吗？`,
      '确认导入',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    ).then(async () => {
      const success = await adminCategoryStore.batchAddCategories(categories)
      if (success) {
        ElMessage.success('批量导入分类成功')
        dialogVisible.batch = false
        batchForm.content = ''
        loadCategoryData()
      }
    }).catch(() => {
      // 取消导入
    })
    
  } catch (error) {
    console.error('批量导入分类失败', error)
    ElMessage.error('批量导入分类失败')
  }
}

// 组件挂载时加载分类数据
onMounted(() => {
  loadCategoryData()
})
</script>

<style scoped>
.category-manage-container {
  padding: 20px;
}

.category-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.view-mode {
  margin-left: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.tree-container,
.list-container {
  min-height: 400px;
  margin-top: 20px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.node-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.category-icon-small {
  width: 20px;
  height: 20px;
  border-radius: 2px;
}

.status-tag,
.level-tag,
.sort-tag {
  margin-left: 6px;
}

.disabled-node {
  color: #909399;
}

.node-actions {
  margin-left: 30px;
}

.category-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-preview {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.preview-icon {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.no-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
  color: #909399;
  font-size: 12px;
}

.icon-uploader {
  display: inline-block;
}

.batch-import-btn {
  margin-top: 15px;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 10px;
  }

  .header-left {
    width: 100%;
    justify-content: space-between;
  }

  .button-group {
    width: 100%;
    justify-content: space-between;
  }

  .custom-tree-node {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .node-actions {
    margin-left: 0;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style> 