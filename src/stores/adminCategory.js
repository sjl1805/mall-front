import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as categoryApi from '@/api/category'

export const useAdminCategoryStore = defineStore('adminCategory', () => {
  // 状态
  const categoryTree = ref([]) // 分类树形数据
  const categoryList = ref([]) // 分类平铺列表
  const currentCategory = ref(null) // 当前选中的分类
  const loading = ref(false) // 加载状态

  // 获取分类树形列表
  async function fetchCategoryTree() {
    try {
      loading.value = true
      const { data } = await categoryApi.getCategoryTree()
      categoryTree.value = data
    } catch (error) {
      ElMessage.error('获取分类树失败：' + error.message)
    } finally {
      loading.value = false
    }
  }

  // 获取所有分类列表
  async function fetchAllCategories() {
    try {
      loading.value = true
      const { data } = await categoryApi.getAllCategories()
      categoryList.value = data
    } catch (error) {
      ElMessage.error('获取分类列表失败：' + error.message)
    } finally {
      loading.value = false
    }
  }

  // 获取分类详情
  async function fetchCategoryDetail(categoryId) {
    try {
      loading.value = true
      const { data } = await categoryApi.getCategoryDetail(categoryId)
      currentCategory.value = data
      return data
    } catch (error) {
      ElMessage.error('获取分类详情失败：' + error.message)
    } finally {
      loading.value = false
    }
  }

  // 添加分类
  async function addCategory(categoryData) {
    try {
      loading.value = true
      const { data } = await categoryApi.addCategory(categoryData)
      if (data) {
        ElMessage.success('添加分类成功')
        await fetchCategoryTree() // 刷新分类树
        return true
      }
    } catch (error) {
      ElMessage.error('添加分类失败：' + error.message)
      return false
    } finally {
      loading.value = false
    }
  }

  // 更新分类
  async function updateCategory(categoryData) {
    try {
      loading.value = true
      const { data } = await categoryApi.updateCategory(categoryData)
      if (data) {
        ElMessage.success('更新分类成功')
        await fetchCategoryTree() // 刷新分类树
        return true
      }
    } catch (error) {
      ElMessage.error('更新分类失败：' + error.message)
      return false
    } finally {
      loading.value = false
    }
  }

  // 删除分类
  async function deleteCategory(categoryId) {
    try {
      loading.value = true
      const { data } = await categoryApi.deleteCategory(categoryId)
      if (data) {
        ElMessage.success('删除分类成功')
        await fetchCategoryTree() // 刷新分类树
        return true
      }
    } catch (error) {
      ElMessage.error('删除分类失败：' + error.message)
      return false
    } finally {
      loading.value = false
    }
  }

  // 更新分类状态
  async function updateCategoryStatus(categoryId, status) {
    try {
      loading.value = true
      const { data } = await categoryApi.updateCategoryStatus(categoryId, status)
      if (data) {
        ElMessage.success('更新分类状态成功')
        await fetchCategoryTree() // 刷新分类树
        return true
      }
    } catch (error) {
      ElMessage.error('更新分类状态失败：' + error.message)
      return false
    } finally {
      loading.value = false
    }
  }

  // 上传分类图标
  async function uploadCategoryIcon(formData) {
    try {
      loading.value = true
      const { data } = await categoryApi.uploadCategoryIcon(formData)
      if (data) {
        ElMessage.success('上传图标成功')
        return data // 返回图标URL
      }
    } catch (error) {
      ElMessage.error('上传图标失败：' + error.message)
      return null
    } finally {
      loading.value = false
    }
  }

  // 更新分类排序
  async function updateCategorySort(categoryId, sort) {
    try {
      loading.value = true
      const { data } = await categoryApi.updateCategorySort(categoryId, sort)
      if (data) {
        ElMessage.success('更新排序成功')
        await fetchCategoryTree() // 刷新分类树
        return true
      }
    } catch (error) {
      ElMessage.error('更新排序失败：' + error.message)
      return false
    } finally {
      loading.value = false
    }
  }

  // 移动分类
  async function moveCategory(categoryId, targetParentId) {
    try {
      loading.value = true
      const { data } = await categoryApi.moveCategory(categoryId, targetParentId)
      if (data) {
        ElMessage.success('移动分类成功')
        await fetchCategoryTree() // 刷新分类树
        return true
      }
    } catch (error) {
      ElMessage.error('移动分类失败：' + error.message)
      return false
    } finally {
      loading.value = false
    }
  }

  // 批量添加分类
  async function batchAddCategories(categories) {
    try {
      loading.value = true
      const { data } = await categoryApi.batchAddCategories(categories)
      if (data) {
        ElMessage.success('批量添加分类成功')
        await fetchCategoryTree() // 刷新分类树
        return true
      }
    } catch (error) {
      ElMessage.error('批量添加分类失败：' + error.message)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    categoryTree,
    categoryList,
    currentCategory,
    loading,

    // 方法
    fetchCategoryTree,
    fetchAllCategories,
    fetchCategoryDetail,
    addCategory,
    updateCategory,
    deleteCategory,
    updateCategoryStatus,
    uploadCategoryIcon,
    updateCategorySort,
    moveCategory,
    batchAddCategories
  }
}, {
  persist: true // 开启持久化
}) 