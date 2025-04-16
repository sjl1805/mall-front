import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data - 登录数据
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @param {string} data.captcha - 验证码
 * @param {string} data.captchaKey - 验证码key
 * @returns {Promise<Object>} 登录结果
 */
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

/**
 * 用户注册
 * @param {Object} data - 注册数据
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @param {string} data.confirmPassword - 确认密码
 * @param {string} data.nickname - 昵称（可选）
 * @param {string} data.phone - 手机号（可选）
 * @param {string} data.email - 邮箱（可选）
 * @param {string} data.captcha - 验证码
 * @param {string} data.captchaKey - 验证码key
 * @returns {Promise<Object>} 注册结果
 */
export function register(data) {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

/**
 * 用户退出登录
 * @returns {Promise<Object>} 登出结果
 */
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

/**
 * 获取验证码
 * @returns {Promise<Object>} 验证码结果，包含key和图片base64
 */
export function getCaptcha() {
  return request({
    url: '/auth/captcha',
    method: 'get'
  })
} 