<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAddressStore } from '@/stores/address'

// 引入图标
import { Plus, Delete, Edit, Location, Check } from '@element-plus/icons-vue'

const addressStore = useAddressStore()

// 地址列表
const addresses = computed(() => addressStore.addresses || [])
const isLoading = ref(false)

// 地址表单
const addressForm = ref({
  id: null,
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false
})

// 验证规则
const rules = {
  name: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度应为2-20个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  province: [
    { required: true, message: '请选择省份', trigger: 'change' }
  ],
  city: [
    { required: true, message: '请选择城市', trigger: 'change' }
  ],
  district: [
    { required: true, message: '请选择区/县', trigger: 'change' }
  ],
  detail: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, max: 100, message: '详细地址长度应为5-100个字符', trigger: 'blur' }
  ]
}

// 地址对话框
const addressDialogVisible = ref(false)
const addressDialogTitle = ref('添加收货地址')
const isAddressSubmitting = ref(false)
const formRef = ref(null)

// 省市区数据
const provinces = ref([])
const cities = ref([])
const districts = ref([])

// 获取地址列表
const fetchAddresses = async () => {
  isLoading.value = true
  try {
    await addressStore.fetchAddresses()
  } catch (error) {
    console.error('获取地址列表失败', error)
    ElMessage.error('获取地址列表失败')
  } finally {
    isLoading.value = false
  }
}

// 加载省市区数据
const loadRegionData = async () => {
  try {
    // 模拟数据，实际项目中可能需要从API获取
    provinces.value = [
      { value: '北京市', label: '北京市' },
      { value: '上海市', label: '上海市' },
      { value: '广东省', label: '广东省' },
      { value: '江苏省', label: '江苏省' },
      { value: '浙江省', label: '浙江省' }
    ]
  } catch (error) {
    console.error('加载省市区数据失败', error)
  }
}

// 当省份改变时
const handleProvinceChange = (province) => {
  addressForm.value.city = ''
  addressForm.value.district = ''
  districts.value = []
  
  if (province === '北京市' || province === '上海市') {
    cities.value = [{ value: province, label: province }]
  } else if (province === '广东省') {
    cities.value = [
      { value: '广州市', label: '广州市' },
      { value: '深圳市', label: '深圳市' },
      { value: '东莞市', label: '东莞市' }
    ]
  } else if (province === '江苏省') {
    cities.value = [
      { value: '南京市', label: '南京市' },
      { value: '苏州市', label: '苏州市' },
      { value: '无锡市', label: '无锡市' }
    ]
  } else if (province === '浙江省') {
    cities.value = [
      { value: '杭州市', label: '杭州市' },
      { value: '宁波市', label: '宁波市' },
      { value: '温州市', label: '温州市' }
    ]
  } else {
    cities.value = []
  }
}

// 当城市改变时
const handleCityChange = (city) => {
  addressForm.value.district = ''
  
  if (city === '北京市') {
    districts.value = [
      { value: '东城区', label: '东城区' },
      { value: '西城区', label: '西城区' },
      { value: '朝阳区', label: '朝阳区' },
      { value: '海淀区', label: '海淀区' }
    ]
  } else if (city === '上海市') {
    districts.value = [
      { value: '黄浦区', label: '黄浦区' },
      { value: '徐汇区', label: '徐汇区' },
      { value: '静安区', label: '静安区' },
      { value: '浦东新区', label: '浦东新区' }
    ]
  } else if (city === '广州市') {
    districts.value = [
      { value: '天河区', label: '天河区' },
      { value: '越秀区', label: '越秀区' },
      { value: '海珠区', label: '海珠区' },
      { value: '白云区', label: '白云区' }
    ]
  } else if (city === '深圳市') {
    districts.value = [
      { value: '福田区', label: '福田区' },
      { value: '罗湖区', label: '罗湖区' },
      { value: '南山区', label: '南山区' },
      { value: '宝安区', label: '宝安区' }
    ]
  } else {
    // 其他城市简化处理，实际项目中应根据API获取
    districts.value = [
      { value: '示例区1', label: '示例区1' },
      { value: '示例区2', label: '示例区2' },
      { value: '示例区3', label: '示例区3' }
    ]
  }
}

// 添加地址
const addAddress = () => {
  resetAddressForm()
  addressDialogTitle.value = '添加收货地址'
  addressDialogVisible.value = true
}

// 编辑地址
const editAddress = (address) => {
  addressDialogTitle.value = '编辑收货地址'
  addressForm.value.id = address.id
  addressForm.value.name = address.name
  addressForm.value.phone = address.phone
  addressForm.value.province = address.province
  addressForm.value.city = address.city
  addressForm.value.district = address.district
  addressForm.value.detail = address.detail
  addressForm.value.isDefault = address.isDefault
  
  // 加载省市区数据
  handleProvinceChange(address.province)
  handleCityChange(address.city)
  
  addressDialogVisible.value = true
}

// 重置表单
const resetAddressForm = () => {
  addressForm.value = {
    id: null,
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    isDefault: false
  }
  
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 提交表单
const submitAddressForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      return ElMessage.error('请正确填写表单内容')
    }

    isAddressSubmitting.value = true
    
    try {
      const addressData = {
        name: addressForm.value.name,
        phone: addressForm.value.phone,
        province: addressForm.value.province,
        city: addressForm.value.city,
        district: addressForm.value.district,
        detail: addressForm.value.detail,
        isDefault: addressForm.value.isDefault ? 1 : 0
      }
      
      if (addressForm.value.id) {
        // 更新地址
        await addressStore.updateAddressById(addressForm.value.id, addressData)
        ElMessage.success('地址修改成功')
      } else {
        // 添加地址
        await addressStore.createAddress(addressData)
        ElMessage.success('地址添加成功')
      }
      
      addressDialogVisible.value = false
      // 刷新地址列表
      await fetchAddresses()
    } catch (error) {
      console.error('保存地址失败', error)
      ElMessage.error('保存地址失败')
    } finally {
      isAddressSubmitting.value = false
    }
  })
}

// 删除地址
const deleteAddress = (address) => {
  ElMessageBox.confirm(`确定要删除收货人为 "${address.name}" 的地址吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await addressStore.removeAddress(address.id)
      ElMessage.success('地址删除成功')
      // 刷新地址列表
      await fetchAddresses()
    } catch (error) {
      console.error('删除地址失败', error)
      ElMessage.error('删除地址失败')
    }
  }).catch(() => {})
}

// 设置为默认地址
const setDefaultAddress = async (address) => {
  if (address.isDefault === 1) return
  
  try {
    await addressStore.setDefaultAddress(address.id)
    ElMessage.success('已设置为默认地址')
    // 刷新地址列表
    await fetchAddresses()
  } catch (error) {
    console.error('设置默认地址失败', error)
    ElMessage.error('设置默认地址失败')
  }
}

// 获取完整地址文本
const getFullAddress = (address) => {
  return `${address.province} ${address.city} ${address.district} ${address.detail}`
}

// 组件挂载时获取数据
onMounted(async () => {
  await fetchAddresses()
  await loadRegionData()
})
</script>

<template>
  <div class="address-container">
    <div class="page-header">
      <h2 class="page-title">收货地址</h2>
      <div class="page-actions">
        <el-button type="primary" @click="addAddress" :icon="Plus">添加新地址</el-button>
      </div>
    </div>
    
    <div class="address-list" v-loading="isLoading">
      <div v-if="addresses.length === 0" class="empty-address">
        <el-empty description="暂无收货地址" :image-size="120">
          <el-button type="primary" @click="addAddress">添加地址</el-button>
        </el-empty>
      </div>
      
      <div v-else class="address-cards">
        <el-card 
          v-for="address in addresses" 
          :key="address.id" 
          class="address-card"
          :class="{ 'default-address': address.isDefault === 1 }"
        >
          <div class="address-header">
            <div class="address-badges">
              <el-tag v-if="address.isDefault === 1" type="success" effect="dark" size="small">默认</el-tag>
            </div>
            <div class="address-actions">
              <el-button 
                v-if="address.isDefault !== 1" 
                size="small" 
                type="primary" 
                plain 
                @click="setDefaultAddress(address)"
              >
                设为默认
              </el-button>
              <el-button 
                size="small" 
                type="primary" 
                plain 
                @click="editAddress(address)"
                :icon="Edit"
              >
                编辑
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                plain 
                @click="deleteAddress(address)"
                :icon="Delete"
              >
                删除
              </el-button>
            </div>
          </div>
          
          <div class="address-body">
            <div class="address-icon">
              <el-icon :size="24" color="#409EFF"><location /></el-icon>
            </div>
            <div class="address-info">
              <div class="address-contact">
                <span class="name">{{ address.name }}</span>
                <span class="phone">{{ address.phone }}</span>
              </div>
              <div class="address-text">
                {{ getFullAddress(address) }}
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 地址表单对话框 -->
    <el-dialog
      v-model="addressDialogVisible"
      :title="addressDialogTitle"
      width="500px"
      @close="resetAddressForm"
    >
      <el-form
        ref="formRef"
        :model="addressForm"
        :rules="rules"
        label-width="100px"
        class="address-form"
      >
        <el-form-item label="收货人" prop="name">
          <el-input v-model="addressForm.name" placeholder="请输入收货人姓名"></el-input>
        </el-form-item>
        
        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="addressForm.phone" placeholder="请输入11位手机号码"></el-input>
        </el-form-item>
        
        <el-form-item label="所在地区" required>
          <div class="region-selects">
            <el-form-item prop="province" class="region-item">
              <el-select 
                v-model="addressForm.province" 
                placeholder="请选择省份"
                @change="handleProvinceChange"
              >
                <el-option 
                  v-for="item in provinces" 
                  :key="item.value" 
                  :label="item.label" 
                  :value="item.value"
                ></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item prop="city" class="region-item">
              <el-select 
                v-model="addressForm.city" 
                placeholder="请选择城市"
                @change="handleCityChange"
                :disabled="!addressForm.province"
              >
                <el-option 
                  v-for="item in cities" 
                  :key="item.value" 
                  :label="item.label" 
                  :value="item.value"
                ></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item prop="district" class="region-item">
              <el-select 
                v-model="addressForm.district" 
                placeholder="请选择区/县"
                :disabled="!addressForm.city"
              >
                <el-option 
                  v-for="item in districts" 
                  :key="item.value" 
                  :label="item.label" 
                  :value="item.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </div>
        </el-form-item>
        
        <el-form-item label="详细地址" prop="detail">
          <el-input
            v-model="addressForm.detail"
            type="textarea"
            rows="3"
            placeholder="请输入详细地址信息，如道路、门牌号、小区、楼栋号、单元等"
          ></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="addressForm.isDefault">设为默认收货地址</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addressDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitAddressForm" :loading="isAddressSubmitting">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.address-container {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.empty-address {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.address-cards {
  display: grid;
  gap: 15px;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

.address-card {
  position: relative;
  border: 1px solid #EBEEF5;
  transition: all 0.3s;
}

.address-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-3px);
}

.default-address {
  border: 1px solid #67C23A;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.address-badges {
  display: flex;
  gap: 5px;
}

.address-actions {
  display: flex;
  gap: 8px;
}

.address-body {
  display: flex;
  gap: 15px;
}

.address-icon {
  padding-top: 5px;
}

.address-info {
  flex: 1;
}

.address-contact {
  margin-bottom: 8px;
}

.address-contact .name {
  font-size: 16px;
  font-weight: bold;
  margin-right: 15px;
}

.address-contact .phone {
  color: #666;
}

.address-text {
  color: #333;
  line-height: 1.5;
}

.region-selects {
  display: flex;
  gap: 10px;
}

.region-item {
  margin-bottom: 0;
  flex: 1;
}

@media (max-width: 768px) {
  .address-cards {
    grid-template-columns: 1fr;
  }
  
  .region-selects {
    flex-direction: column;
    gap: 0;
  }
  
  .region-item {
    margin-bottom: 10px;
  }
  
  .address-actions {
    flex-direction: column;
    gap: 5px;
  }
}
</style>