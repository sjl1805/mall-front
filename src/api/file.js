import request from '@/utils/request'

/**
 * 通用文件上传
 * @param {FormData} formData - 包含文件的表单数据
 * @returns {Promise<Object>} 上传结果，包含文件URL
 */
export function uploadFile(formData) {
  return request({
    url: '/file/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 管理员文件上传
 * @param {FormData} formData - 包含文件的表单数据
 * @returns {Promise<Object>} 上传结果，包含文件URL
 */
export function adminUploadFile(formData) {
  return request({
    url: '/file/admin/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 删除文件（管理员）
 * @param {string} fileUrl - 文件URL
 * @returns {Promise<Object>} 删除结果
 */
export function deleteFile(fileUrl) {
  return request({
    url: '/file',
    method: 'delete',
    params: { fileUrl }
  })
}

/**
 * 获取文件信息
 * @param {string} fileUrl - 文件URL
 * @returns {Promise<Object>} 文件信息
 */
export function getFileInfo(fileUrl) {
  return request({
    url: '/file/info',
    method: 'get',
    params: { fileUrl }
  })
}

/**
 * 管理员获取文件信息
 * @param {string} fileUrl - 文件URL
 * @returns {Promise<Object>} 文件信息
 */
export function adminGetFileInfo(fileUrl) {
  return request({
    url: '/file/admin/info',
    method: 'get',
    params: { fileUrl }
  })
}

/**
 * 获取文件预览URL
 * @param {string} fileUrl - 文件URL
 * @returns {string} 文件预览的完整URL
 */
export function getFileViewUrl(fileUrl) {
  // 首先检查fileUrl是否为空
  if (!fileUrl) return '';
  
  // 检查fileUrl是否已经是完整URL (包含http://或https://)
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  
  // 统一处理：所有文件路径都通过file/view接口获取
  return `/api/file/view?fileUrl=${encodeURIComponent(fileUrl)}`;
}

/**
 * 获取管理员文件预览URL
 * @param {string} fileUrl - 文件URL
 * @returns {string} 文件预览的完整URL
 */
export function getAdminFileViewUrl(fileUrl) {
  // 首先检查fileUrl是否为空
  if (!fileUrl) return '';
  
  // 检查fileUrl是否已经是完整URL (包含http://或https://)
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  
  // 统一处理：所有文件路径都通过file/admin/view接口获取
  // 这里直接使用硬编码的baseURL，确保与curl命令一致
  return `/api/file/admin/view?fileUrl=${encodeURIComponent(fileUrl)}`;
} 