import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getEnabledCategories,
  getCategoryTree,
  getCategoryDetail,
  getChildrenCategories
} from '@/api/product'
import { ElMessage } from 'element-plus'

// 分类状态常量
export const CategoryStatus = {
  DISABLED: 0, // 禁用
  ENABLED: 1   // 启用
}

export const useCategoryStore = defineStore('category', () => {
  // 状态
  const categories = ref([]) // 平铺的分类列表
  const categoryTree = ref([]) // 树形结构的分类列表
  const currentCategory = ref(null) // 当前选中的分类
  const loading = ref(false)
  
  // 计算属性
  const categoryCount = computed(() => categories.value.length)
  const hasCategories = computed(() => categories.value.length > 0)
  const topCategories = computed(() => categoryTree.value.filter(item => item.status === CategoryStatus.ENABLED))
  
  // 获取分类的完整路径
  const getCategoryPath = (categoryId) => {
    const path = []
    const findPath = (id, categories) => {
      for (const category of categories) {
        if (category.id === id) {
          path.unshift(category)
          return true
        }
        
        if (category.children && category.children.length > 0) {
          if (findPath(id, category.children)) {
            path.unshift(category)
            return true
          }
        }
      }
      
      return false
    }
    
    findPath(categoryId, categoryTree.value)
    return path
  }
  
  /**
   * 获取所有启用的分类列表（平铺）
   * @returns {Promise<Array>} 分类列表
   */
  const fetchCategories = async () => {
    loading.value = true
    try {
      const res = await getEnabledCategories()
      
      if (res.code === 200) {
        categories.value = res.data || []
        return res.data
      }
      
      return []
    } catch (error) {
      console.error('获取分类列表失败', error)
      ElMessage.error('获取分类列表失败，请稍后重试')
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取分类树
   * @returns {Promise<Array>} 分类树
   */
  const fetchCategoryTree = async () => {
    loading.value = true
    try {
      const res = await getCategoryTree()
      
      if (res.code === 200) {
        categoryTree.value = res.data || []
        return res.data
      }
      
      return []
    } catch (error) {
      console.error('获取分类树失败', error)
      ElMessage.error('获取分类树失败，请稍后重试')
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取分类详情
   * @param {number} categoryId - 分类ID
   * @returns {Promise<Object>} 分类详情
   */
  const fetchCategoryDetail = async (categoryId) => {
    loading.value = true
    try {
      const res = await getCategoryDetail(categoryId)
      
      if (res.code === 200) {
        currentCategory.value = res.data || null
        return res.data
      }
      
      currentCategory.value = null
      return null
    } catch (error) {
      console.error('获取分类详情失败', error)
      currentCategory.value = null
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取子分类
   * @param {number} parentId - 父分类ID
   * @returns {Promise<Array>} 子分类列表
   */
  const fetchChildCategories = async (parentId) => {
    loading.value = true
    try {
      const res = await getChildrenCategories(parentId)
      
      if (res.code === 200) {
        return res.data || []
      }
      
      return []
    } catch (error) {
      console.error('获取子分类失败', error)
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 查找分类
   * @param {number} categoryId - 分类ID
   * @returns {Object} 分类对象
   */
  const findCategory = (categoryId) => {
    return categories.value.find(item => item.id === categoryId) || null
  }
  
  /**
   * 查找分类及其所有子分类ID
   * @param {number} categoryId - 分类ID
   * @returns {Array<number>} 分类ID数组
   */
  const findCategoryAndChildrenIds = (categoryId) => {
    const ids = []
    
    const findChildren = (id, tree) => {
      for (const node of tree) {
        if (node.id === id) {
          ids.push(node.id)
          
          if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
              ids.push(child.id)
              
              if (child.children && child.children.length > 0) {
                findChildren(child.id, [child])
              }
            })
          }
          
          return true
        }
        
        if (node.children && node.children.length > 0) {
          if (findChildren(id, node.children)) {
            return true
          }
        }
      }
      
      return false
    }
    
    findChildren(categoryId, categoryTree.value)
    return ids
  }
  
  /**
   * 格式化分类树为级联选择器选项
   * @returns {Array} 级联选择器选项
   */
  const formatCategoryTreeForCascader = () => {
    const format = (items) => {
      if (!items || items.length === 0) return []
      
      return items.map(item => ({
        value: item.id,
        label: item.name,
        disabled: item.status === CategoryStatus.DISABLED,
        children: format(item.children)
      }))
    }
    
    return format(categoryTree.value)
  }
  
  /**
   * 获取指定层级的分类
   * @param {number} level - 层级
   * @returns {Array} 分类列表
   */
  const getCategoriesByLevel = (level) => {
    return categories.value.filter(item => item.level === level)
  }
  
  return {
    // 状态
    categories,
    categoryTree,
    currentCategory,
    loading,
    
    // 计算属性
    categoryCount,
    hasCategories,
    topCategories,
    
    // 方法
    getCategoryPath,
    fetchCategories,
    fetchCategoryTree,
    fetchCategoryDetail,
    fetchChildCategories,
    findCategory,
    findCategoryAndChildrenIds,
    formatCategoryTreeForCascader,
    getCategoriesByLevel
  }
}, {
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'mall-categories',
        storage: sessionStorage,
        paths: ['categories', 'categoryTree']
      }
    ]
  }
}) 