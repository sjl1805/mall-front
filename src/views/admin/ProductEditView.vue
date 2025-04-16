<template>
  <div class="product-edit-container">
    <el-page-header :icon="Back" @back="goBack" :title="isEdit ? '编辑商品' : '添加商品'" />

    <el-card class="form-card">
      <el-form 
        ref="productFormRef" 
        :model="productForm"
        :rules="productRules" 
        label-width="120px"
        label-position="right"
        status-icon
      >
        <!-- 基本信息区域 -->
        <el-divider content-position="left">基本信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="productForm.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品分类" prop="categoryId">
              <el-cascader
                v-model="productForm.categoryId"
                :options="categoryOptions"
                :props="{ checkStrictly: true, value: 'id', label: 'name' }"
                placeholder="请选择商品分类"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="商品价格" prop="price">
              <el-input-number 
                v-model="productForm.price" 
                :min="0" 
                :precision="2" 
                :step="0.1" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="原价" prop="originalPrice">
              <el-input-number 
                v-model="productForm.originalPrice" 
                :min="0" 
                :precision="2" 
                :step="0.1" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="库存" prop="stock">
              <el-input-number 
                v-model="productForm.stock" 
                :min="0" 
                :precision="0"
                :step="1" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="productForm.status">
                <el-radio :label="1">上架</el-radio>
                <el-radio :label="0">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 商品图片区域 -->
        <el-divider content-position="left">商品图片</el-divider>
        
        <el-form-item label="商品主图" prop="image">
          <div class="image-upload-container">
            <ImageUploader
              v-model="productForm.image"
              type="image"
              :is-admin="true"
              :max-size="2"
              :preview-size="150"
              @uploaded="handleMainImageUploaded"
              @deleted="handleMainImageDeleted"
            />
            <div class="image-upload-tip">建议上传尺寸为800x800的商品主图</div>
          </div>
        </el-form-item>
        
        <el-form-item label="商品图集">
          <div class="gallery-upload-container">
            <div class="gallery-images">
              <template v-if="productForm.images && productForm.images.length > 0">
                <div 
                  v-for="(img, index) in productForm.images" 
                  :key="index" 
                  class="gallery-image-item"
                >
                  <el-image 
                    v-if="img && img.trim()"
                    :src="fileStore.getPreviewUrl(img)" 
                    fit="cover"
                    :preview-src-list="productForm.images.filter(url => url && url.trim()).map(url => fileStore.getPreviewUrl(url))"
                    style="width: 100%; height: 100%"
                    @click="previewImage(img, productForm.images.filter(url => url && url.trim()))"
                  />
                  <div v-else class="empty-image">无效图片</div>
                  <div class="gallery-image-actions">
                    <el-button 
                      type="danger" 
                      size="small" 
                      circle 
                      @click="handleRemoveGalleryImage(index)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </template>
              
              <!-- 图集上传按钮 -->
              <div class="gallery-upload-item" v-if="!productForm.images || productForm.images.length < 9">
                <ImageUploader
                  v-model="tempGalleryImage"
                  type="image"
                  :is-admin="true"
                  :max-size="2"
                  :preview-size="150"
                  @update:modelValue="handleTempGalleryImageChange"
                />
              </div>
            </div>
            <div class="image-upload-tip">最多可上传9张图片，每张大小不超过2MB</div>
          </div>
        </el-form-item>
        
        <!-- 商品详情区域 -->
        <el-divider content-position="left">商品详情</el-divider>
        
        <el-form-item label="商品简介" prop="brief">
          <el-input 
            v-model="productForm.brief" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入商品简介"
          />
        </el-form-item>
        
        <el-form-item label="商品详情" prop="description">
          <el-input 
            v-model="productForm.description" 
            type="textarea" 
            :rows="8" 
            placeholder="请输入商品详情，支持HTML"
          />
        </el-form-item>
        
        <!-- 其他属性区域 -->
        <el-divider content-position="left">其他信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="productForm.unit" placeholder="件/个/套" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="重量(kg)" prop="weight">
              <el-input-number 
                v-model="productForm.weight" 
                :min="0" 
                :precision="2" 
                :step="0.1" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序" prop="sort">
              <el-input-number 
                v-model="productForm.sort" 
                :precision="0" 
                :step="1" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="关键词" prop="keywords">
              <el-tag
                v-for="tag in keywordTags"
                :key="tag"
                class="mx-1"
                closable
                @close="handleRemoveKeyword(tag)"
              >
                {{ tag }}
              </el-tag>
              <el-input
                v-if="keywordInputVisible"
                ref="keywordInputRef"
                v-model="keywordInputValue"
                class="w-50 m-2 keyword-input"
                size="small"
                @keyup.enter="handleAddKeyword"
                @blur="handleAddKeyword"
              />
              <el-button v-else class="button-new-tag ml-1" size="small" @click="showKeywordInput">
                + 添加关键词
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 表单操作按钮 -->
        <div class="form-actions">
          <el-button @click="goBack">取消</el-button>
          <el-button type="primary" @click="submitForm(productFormRef)">保存</el-button>
        </div>
      </el-form>
    </el-card>
    
    <!-- 图片预览 -->
    <el-dialog v-model="previewVisible" title="图片预览">
      <el-image
        style="width: 100%"
        :src="fileStore.getPreviewUrl(previewUrl)"
        :preview-src-list="activePreviewUrls.map(url => fileStore.getPreviewUrl(url))"
        fit="contain"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useFileStore } from '@/stores/file'
import ImageUploader from '@/components/ImageUploader.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back, Plus, Delete, ZoomIn } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const fileStore = useFileStore()

// 判断是编辑还是新增
const isEdit = computed(() => {
  return !!route.params.id
})

// 初始化表单数据
const productForm = reactive({
  id: null,
  name: '',
  categoryId: null,
  price: 0,
  originalPrice: 0,
  stock: 0,
  status: 1,
  image: '',
  images: [],
  brief: '',
  description: '',
  unit: '件',
  weight: 0,
  sort: 0,
  keywords: '',
  sales: 0,
  views: 0
})

// 表单校验规则
const productRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入商品库存', trigger: 'blur' }
  ]
}

// 分类数据
const categoryOptions = ref([])
const productFormRef = ref()
const loading = ref(false)

// 图片预览相关
const previewVisible = ref(false)
const previewUrl = ref('')
const activePreviewUrls = ref([])

// 关键词标签相关
const keywordInputVisible = ref(false)
const keywordInputValue = ref('')
const keywordInputRef = ref()
const keywordTags = ref([])

// 临时图片变量，用于图集上传
const tempGalleryImage = ref('')

// 监听临时图片变量变化
const handleTempGalleryImageChange = (url) => {
  if (url) {
    handleAddGalleryImage(url)
    // 重置临时图片变量，以便下一次上传
    tempGalleryImage.value = ''
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 加载分类树
const loadCategories = async () => {
  try {
    const result = await adminStore.fetchCategoryTree()
    categoryOptions.value = result || []
  } catch (error) {
    console.error('加载分类数据失败', error)
    ElMessage.error('加载分类数据失败')
  }
}

// 加载商品详情
const loadProductDetail = async () => {
  if (!isEdit.value) return
  
  loading.value = true
  try {
    const result = await adminStore.fetchProductDetail(route.params.id)
    
    // 将结果填充到表单
    for (const key in result) {
      if (key in productForm) {
        productForm[key] = result[key]
      }
    }
    
    // 处理分类ID (级联选择器需要数组格式)
    if (productForm.categoryId && !Array.isArray(productForm.categoryId)) {
      productForm.categoryId = [productForm.categoryId]
    }
    
    // 处理关键词
    if (productForm.keywords) {
      keywordTags.value = productForm.keywords.split(',').filter(k => k)
    }
    
    // 确保images是数组，正确处理逗号分隔的字符串
    if (typeof productForm.images === 'string') {
      // 分割逗号分隔的字符串，并过滤空字符串
      productForm.images = productForm.images.split(',').filter(url => url.trim() !== '')
    } else if (!Array.isArray(productForm.images)) {
      // 如果既不是字符串也不是数组，初始化为空数组
      productForm.images = []
    }
    
    console.log('加载的商品图集:', productForm.images) // 用于调试
    
  } catch (error) {
    console.error('加载商品详情失败', error)
    ElMessage.error('加载商品详情失败')
  } finally {
    loading.value = false
  }
}

// 主图上传成功回调
const handleMainImageUploaded = (url) => {
  productForm.image = url
  ElMessage.success('主图上传成功')
}

// 主图删除回调
const handleMainImageDeleted = () => {
  productForm.image = ''
}

// 添加图集图片
const handleAddGalleryImage = (url) => {
  if (!productForm.images) {
    productForm.images = []
  }
  productForm.images.push(url)
  ElMessage.success('图片添加成功')
}

// 移除图集图片
const handleRemoveGalleryImage = (index) => {
  ElMessageBox.confirm(
    '确定要移除此图片吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    const imageUrl = productForm.images[index]
    
    if (productForm.id) {
      try {
        // 如果商品已保存，则调用API删除
        const success = await adminStore.removeProductImage(productForm.id, imageUrl)
        if (success) {
          productForm.images.splice(index, 1)
          ElMessage.success('删除图片成功')
        }
      } catch (error) {
        console.error('删除图片失败', error)
        ElMessage.error('删除图片失败')
      }
    } else {
      // 如果商品未保存，直接从本地数组移除
      productForm.images.splice(index, 1)
      ElMessage.success('删除图片成功')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 预览图片
const previewImage = (url, urls = []) => {
  previewUrl.value = url
  activePreviewUrls.value = urls.length > 0 ? urls : [url]
  previewVisible.value = true
}

// 显示关键词输入框
const showKeywordInput = () => {
  keywordInputVisible.value = true
  nextTick(() => {
    keywordInputRef.value?.focus()
  })
}

// 添加关键词
const handleAddKeyword = () => {
  if (keywordInputValue.value) {
    if (!keywordTags.value.includes(keywordInputValue.value)) {
      keywordTags.value.push(keywordInputValue.value)
    }
    keywordInputVisible.value = false
    keywordInputValue.value = ''
    updateKeywords()
  }
}

// 移除关键词
const handleRemoveKeyword = (tag) => {
  keywordTags.value = keywordTags.value.filter(t => t !== tag)
  updateKeywords()
}

// 更新表单中的关键词字符串
const updateKeywords = () => {
  productForm.keywords = keywordTags.value.join(',')
}

// 提交表单
const submitForm = async (formEl) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const formData = { ...productForm }
        
        // 处理分类ID (后端需要单个ID，而不是数组)
        if (Array.isArray(formData.categoryId)) {
          formData.categoryId = formData.categoryId[formData.categoryId.length - 1]
        }
        
        // 将images数组转换为逗号分隔的字符串
        if (Array.isArray(formData.images)) {
          formData.images = formData.images.join(',')
        }
        
        let success
        if (isEdit.value) {
          // 编辑商品
          success = await adminStore.editProduct(formData)
        } else {
          // 新增商品
          success = await adminStore.createProduct(formData)
        }
        
        if (success) {
          ElMessage.success(isEdit.value ? '更新商品成功' : '添加商品成功')
          router.push('/admin/products')
        }
      } catch (error) {
        console.error(isEdit.value ? '更新商品失败' : '添加商品失败', error)
        ElMessage.error(isEdit.value ? '更新商品失败' : '添加商品失败')
      } finally {
        loading.value = false
      }
    } else {
      ElMessage.error('请检查表单是否填写正确')
    }
  })
}

// 组件挂载时加载数据
onMounted(() => {
  // 加载分类数据
  loadCategories()
  
  // 如果是编辑模式，加载商品详情
  if (isEdit.value) {
    loadProductDetail()
  }
})
</script>

<style scoped>
.product-edit-container {
  padding: 20px;
}

.form-card {
  margin-top: 20px;
}

.image-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-upload-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.gallery-upload-container {
  width: 100%;
}

.gallery-images {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.gallery-image-item {
  position: relative;
  width: 100%;
  height: 150px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.empty-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 12px;
}

.gallery-upload-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 150px;
}

.gallery-image-actions {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s;
}

.gallery-image-item:hover .gallery-image-actions {
  opacity: 1;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding-bottom: 20px;
}

.keyword-input {
  width: 100px;
  display: inline-flex;
  vertical-align: bottom;
  margin-left: 8px;
}

.el-tag + .el-tag {
  margin-left: 8px;
}

@media (max-width: 768px) {
  .gallery-images {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 576px) {
  .gallery-images {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 