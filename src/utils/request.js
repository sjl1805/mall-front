import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'

// 创建axios实例
const service = axios.create({
  baseURL: '/api', // 与vite.config.js中的代理配置对应
  timeout: 15000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    
    // 评价模块特殊处理
    const isReviewApi = config.url && config.url.includes('/review/');
    
    // 携带token
    if (userStore.token) {
      // 确保每次请求都使用最新的token
      config.headers['Authorization'] = `Bearer ${userStore.token}`
      
      // 检查是否是评价相关API，特别是用户评价列表
      if (isReviewApi && config.url.includes('/review/user')) {
        // 为评价模块特别添加token信息，确保与行为记录保持相同格式
        console.log('用户评价API请求:', config.url)
        // 添加额外的认证信息，尝试与行为记录保持一致
        config.headers['X-Auth-Token'] = userStore.token
      }
      
      // 对于明确标记需要token的请求，额外检查token是否有效
      if (config.needToken === true) {
        console.log('需要认证的请求:', config.url)
        // 这些请求可能需要额外的验证步骤
      }
    } else if (isReviewApi || config.needToken === true) {
      console.warn('需要认证的请求但没有token:', config.url)
      // 对于评价相关的API，如果没有token，记录警告
    }
    
    // 调试信息，显示每个请求的URL
    const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url
    console.log(`${config.method.toUpperCase()} 请求: ${fullUrl}`);
    if (config.params) {
      console.log('请求参数:', config.params);
    }
    
    return config
  },
  error => {
    console.error(error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // 根据后端接口的约定处理响应
    if (res.code !== 200) {
      // 对于评价相关接口的特殊处理
      const isReviewApi = response.config.url && response.config.url.includes('/review/');
      
      // 401: 未登录或token过期
      if (res.code === 401) {
        if (isReviewApi && response.config.url.includes('/review/user')) {
          // 评价列表接口的未登录错误，仅记录日志不弹窗
          console.warn('评价接口未登录:', response.config.url)
          // 直接返回带有code的错误响应，由业务代码处理
          return res;
        } else {
          // 确认对话框询问用户是否重新登录
          ElMessageBox.confirm(
            '登录状态已过期，您可以继续留在该页面，或者重新登录',
            '系统提示',
            {
              confirmButtonText: '重新登录',
              cancelButtonText: '取消',
              type: 'warning'
            }
          ).then(() => {
            const userStore = useUserStore()
            userStore.logout()
            router.push('/login')
          }).catch(() => {
            console.log('用户取消重新登录')
          })
        }
      }
      
      if (!isReviewApi || res.code !== 401) {
        ElMessage({
          message: res.message || '服务器错误',
          type: 'error',
          duration: 5 * 1000
        })
      }
      
      return Promise.reject(new Error(res.message || '服务器错误'))
    } else {
      return res
    }
  },
  error => {
    console.error('请求错误', error)
    // 处理HTTP错误状态码
    if (error.response) {
      // 对于评价相关接口的特殊处理
      const isReviewApi = error.config && error.config.url && error.config.url.includes('/review/');
      
      switch (error.response.status) {
        case 401:
          if (isReviewApi && error.config.url.includes('/review/user')) {
            // 评价列表接口的401错误，仅记录日志不弹窗，不自动登出
            console.warn('评价接口认证失败:', error.config.url)
          } else {
            ElMessage({
              message: '未登录或登录过期，请重新登录',
              type: 'error',
              duration: 5 * 1000
            })
            const userStore = useUserStore()
            userStore.logout()
            router.push('/login')
          }
          break;
        case 403:
          ElMessage({
            message: '没有权限访问该资源',
            type: 'error',
            duration: 5 * 1000
          })
          break
        case 404:
          ElMessage({
            message: '请求的资源不存在',
            type: 'error',
            duration: 5 * 1000
          })
          break
        case 500:
          ElMessage({
            message: '服务器内部错误',
            type: 'error',
            duration: 5 * 1000
          })
          break
        default:
          ElMessage({
            message: error.response.data.message || '未知错误',
            type: 'error',
            duration: 5 * 1000
          })
      }
    } else {
      ElMessage({
        message: '网络连接失败，请检查您的网络',
        type: 'error',
        duration: 5 * 1000
      })
    }
    return Promise.reject(error)
  }
)

export default service 