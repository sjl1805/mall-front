import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getAddressList, 
  getDefaultAddress, 
  addAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress, 
  getAddressDetail 
} from '@/api/user'
import { ElMessage } from 'element-plus'

export const useAddressStore = defineStore('address', () => {
  // 状态
  const addresses = ref([])
  const currentAddress = ref(null)
  const defaultAddress = ref(null)
  const loading = ref(false)

  // 计算属性
  const addressCount = computed(() => {
    return addresses.value.length
  })

  const hasDefaultAddress = computed(() => {
    return !!defaultAddress.value
  })

  // 方法
  // 获取地址列表
  const fetchAddresses = async () => {
    loading.value = true
    try {
      const res = await getAddressList()
      if (res.code === 200) {
        addresses.value = res.data || []
        // 查找默认地址
        const defaultAddr = addresses.value.find(addr => addr.isDefault === 1)
        if (defaultAddr) {
          defaultAddress.value = defaultAddr
        }
      }
    } catch (error) {
      console.error('获取地址列表失败', error)
    } finally {
      loading.value = false
    }
  }

  // 获取默认地址
  const fetchDefaultAddress = async () => {
    loading.value = true
    try {
      const res = await getDefaultAddress()
      if (res.code === 200) {
        defaultAddress.value = res.data
        return res.data
      }
      return null
    } catch (error) {
      console.error('获取默认地址失败', error)
      return null
    } finally {
      loading.value = false
    }
  }

  // 获取地址详情
  const fetchAddressDetail = async (addressId) => {
    loading.value = true
    try {
      const res = await getAddressDetail(addressId)
      if (res.code === 200) {
        currentAddress.value = res.data
        return res.data
      }
      return null
    } catch (error) {
      console.error('获取地址详情失败', error)
      return null
    } finally {
      loading.value = false
    }
  }

  // 添加地址
  const createAddress = async (addressData) => {
    loading.value = true
    try {
      const res = await addAddress(addressData)
      if (res.code === 200) {
        ElMessage.success('添加地址成功')
        
        // 如果是默认地址，更新默认地址
        if (addressData.isDefault === 1 && res.data) {
          defaultAddress.value = res.data
        }
        
        // 刷新地址列表
        await fetchAddresses()
        return res.data
      }
      return null
    } catch (error) {
      console.error('添加地址失败', error)
      return null
    } finally {
      loading.value = false
    }
  }

  // 更新地址
  const updateAddressById = async (addressData) => {
    loading.value = true
    try {
      const res = await updateAddress(addressData)
      if (res.code === 200) {
        ElMessage.success('更新地址成功')
        
        // 如果是默认地址，更新默认地址
        if (addressData.isDefault === 1) {
          defaultAddress.value = addressData
        } else if (defaultAddress.value && defaultAddress.value.id === addressData.id) {
          defaultAddress.value = null
        }
        
        // 更新地址列表中的对应地址
        const index = addresses.value.findIndex(addr => addr.id === addressData.id)
        if (index !== -1) {
          addresses.value[index] = { ...addresses.value[index], ...addressData }
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('更新地址失败', error)
      return false
    } finally {
      loading.value = false
    }
  }

  // 删除地址
  const removeAddress = async (addressId) => {
    loading.value = true
    try {
      const res = await deleteAddress(addressId)
      if (res.code === 200) {
        ElMessage.success('删除地址成功')
        
        // 如果删除的是默认地址，清空默认地址
        if (defaultAddress.value && defaultAddress.value.id === addressId) {
          defaultAddress.value = null
        }
        
        // 从地址列表中移除
        addresses.value = addresses.value.filter(addr => addr.id !== addressId)
        
        return true
      }
      return false
    } catch (error) {
      console.error('删除地址失败', error)
      return false
    } finally {
      loading.value = false
    }
  }

  // 设置默认地址
  const setAddressDefault = async (addressId) => {
    loading.value = true
    try {
      const res = await setDefaultAddress(addressId)
      if (res.code === 200) {
        ElMessage.success('设置默认地址成功')
        
        // 更新地址列表中的默认状态
        addresses.value.forEach(addr => {
          addr.isDefault = addr.id === addressId ? 1 : 0
        })
        
        // 更新默认地址
        defaultAddress.value = addresses.value.find(addr => addr.id === addressId)
        
        return true
      }
      return false
    } catch (error) {
      console.error('设置默认地址失败', error)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    addresses,
    currentAddress,
    defaultAddress,
    loading,
    
    // 计算属性
    addressCount,
    hasDefaultAddress,
    
    // 方法
    fetchAddresses,
    fetchDefaultAddress,
    fetchAddressDetail,
    createAddress,
    updateAddressById,
    removeAddress,
    setAddressDefault
  }
})