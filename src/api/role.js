import request from '@/utils/request'

/**
 * 获取当前用户的角色信息
 * @returns {Promise<Object>} 角色信息，包含role(角色值)、roleName(角色名称)和permissions(权限列表)
 */
export function getRoleInfo() {
  return request({
    url: '/role/info',
    method: 'get'
  })
}

/**
 * 检查当前用户是否为管理员
 * 该接口需要管理员角色才能访问，用于前端判断是否有管理权限
 * @returns {Promise<Object>} 检查结果
 */
export function checkAdmin() {
  return request({
    url: '/role/check-admin',
    method: 'get'
  })
}

/**
 * 角色常量
 */
export const Role = {
  ADMIN: 1,     // 管理员
  USER: 2       // 普通用户
} 