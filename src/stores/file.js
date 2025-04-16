import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  uploadFile, 
  adminUploadFile, 
  getFileViewUrl
} from '@/api/file'
import { ElMessage } from 'element-plus'

/**
 * 文件类型常量
 */
export const FileType = {
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
  AUDIO: 'audio',
  OTHER: 'other'
}

/**
 * 文件状态管理
 */
export const useFileStore = defineStore('file', () => {
  // 文件状态
  const uploadedFiles = ref([])
  const loading = ref(false)

  // 上传状态
  const uploadProgress = ref({})
  const uploadStatus = ref({})

  // 计算属性
  const hasFiles = computed(() => uploadedFiles.value.length > 0)
  const uploadedFileUrls = computed(() => uploadedFiles.value.map(file => file.url))

  // 文件类型判断
  const getFileType = (fileUrl = '') => {
    if (!fileUrl) return FileType.OTHER
    
    const extension = fileUrl.split('.').pop().toLowerCase()
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm']
    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac']
    
    if (imageExtensions.includes(extension)) return FileType.IMAGE
    if (videoExtensions.includes(extension)) return FileType.VIDEO
    if (documentExtensions.includes(extension)) return FileType.DOCUMENT
    if (audioExtensions.includes(extension)) return FileType.AUDIO
    
    return FileType.OTHER
  }

  /**
   * 准备文件上传
   * @param {File|File[]} files - 文件对象或文件对象数组
   * @returns {FormData} 准备好的表单数据
   */
  const prepareFileUpload = (files) => {
    const formData = new FormData()
    
    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        formData.append('file', file)
      })
    } else {
      formData.append('file', files)
    }
    
    return formData
  }

  /**
   * 上传单个文件
   * @param {File} file - 文件对象
   * @param {boolean} isAdmin - 是否使用管理员权限上传
   * @returns {Promise<string>} 文件URL
   */
  const uploadSingleFile = async (file, isAdmin = false) => {
    if (!file) {
      ElMessage.error('请选择要上传的文件')
      return null
    }
    
    const formData = prepareFileUpload(file)
    const fileId = file.name + '_' + Date.now()
    
    // 初始化上传状态
    uploadProgress.value[fileId] = 0
    uploadStatus.value[fileId] = 'uploading'
    
    try {
      const uploadFn = isAdmin ? adminUploadFile : uploadFile
      const res = await uploadFn(formData)
      
      if (res.code === 200 && res.data) {
        // 更新上传状态
        uploadProgress.value[fileId] = 100
        uploadStatus.value[fileId] = 'success'
        
        // 添加到已上传文件列表
        const fileUrl = res.data
        const fileType = getFileType(fileUrl)
        
        const fileObj = {
          id: fileId,
          name: file.name,
          url: fileUrl,
          size: file.size,
          type: fileType,
          uploadTime: new Date()
        }
        
        uploadedFiles.value.push(fileObj)
        
        ElMessage.success('文件上传成功')
        return fileUrl
      } else {
        // 上传失败
        uploadStatus.value[fileId] = 'error'
        ElMessage.error(res.message || '文件上传失败')
        return null
      }
    } catch (error) {
      console.error('文件上传出错', error)
      uploadStatus.value[fileId] = 'error'
      ElMessage.error('文件上传出错：' + (error.message || '未知错误'))
      return null
    }
  }

  /**
   * 批量上传文件
   * @param {File[]} files - 文件对象数组
   * @param {boolean} isAdmin - 是否使用管理员权限上传
   * @returns {Promise<string[]>} 文件URL数组
   */
  const uploadFiles = async (files, isAdmin = false) => {
    if (!files || files.length === 0) {
      ElMessage.error('请选择要上传的文件')
      return []
    }
    
    loading.value = true
    const fileUrls = []
    
    try {
      for (const file of files) {
        const fileUrl = await uploadSingleFile(file, isAdmin)
        if (fileUrl) {
          fileUrls.push(fileUrl)
        }
      }
      
      return fileUrls
    } catch (error) {
      console.error('批量上传文件出错', error)
      ElMessage.error('批量上传文件出错：' + (error.message || '未知错误'))
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取文件预览URL
   * @param {string} fileUrl - 文件URL
   * @returns {string} 文件预览URL
   */
  const getPreviewUrl = (fileUrl) => {
    if (!fileUrl) return ''
    
    // 直接返回完整的HTTP URL
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl
    }
    
    // 对于相对路径，使用API处理
    return getFileViewUrl(fileUrl)
  }

  /**
   * 清除上传状态记录
   */
  const clearUploadStatus = () => {
    uploadProgress.value = {}
    uploadStatus.value = {}
  }

  /**
   * 清除已上传文件记录
   */
  const clearUploadedFiles = () => {
    uploadedFiles.value = []
  }

  /**
   * 重置所有状态
   */
  const resetState = () => {
    uploadedFiles.value = []
    uploadProgress.value = {}
    uploadStatus.value = {}
  }

  return {
    // 状态
    uploadedFiles,
    loading,
    uploadProgress,
    uploadStatus,
    
    // 计算属性
    hasFiles,
    uploadedFileUrls,
    
    // 方法
    getFileType,
    prepareFileUpload,
    uploadSingleFile,
    uploadFiles,
    getPreviewUrl,
    clearUploadStatus,
    clearUploadedFiles,
    resetState
  }
}) 