<script setup>
import { ref, computed } from 'vue';
import { useFileStore } from '@/stores/file';
import { ElMessage } from 'element-plus';
import { Upload, Delete } from '@element-plus/icons-vue';

const props = defineProps({
  // 图片URL，用于显示当前图片
  modelValue: {
    type: String,
    default: ''
  },
  // 上传类型：avatar-头像, image-普通图片
  type: {
    type: String,
    default: 'image'
  },
  // 是否使用管理员上传接口
  isAdmin: {
    type: Boolean,
    default: false
  },
  // 限制文件大小（MB）
  maxSize: {
    type: Number,
    default: 2
  },
  // 预览图大小
  previewSize: {
    type: Number,
    default: 100
  },
  // 是否可以删除
  deletable: {
    type: Boolean,
    default: true
  },
  // 禁用状态
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'uploaded', 'deleted', 'error']);

const fileStore = useFileStore();
const uploadRef = ref(null);

// 计算图片大小样式
const sizeStyle = computed(() => {
  return {
    width: `${props.previewSize}px`,
    height: `${props.previewSize}px`
  };
});

// 计算预览图的圆角样式
const shapeStyle = computed(() => {
  return props.type === 'avatar' ? 'border-radius: 50%' : 'border-radius: 4px';
});

// 获取预览URL
const previewUrl = computed(() => {
  return props.modelValue ? fileStore.getPreviewUrl(props.modelValue) : '';
});

// 验证文件
const validateFile = (file) => {
  const isImage = file.type.startsWith('image/');
  const maxSizeBytes = props.maxSize * 1024 * 1024;
  const isValidSize = file.size <= maxSizeBytes;

  if (!isImage) {
    ElMessage.error('只能上传图片文件！');
    return false;
  }
  
  if (!isValidSize) {
    ElMessage.error(`图片大小不能超过 ${props.maxSize}MB！`);
    return false;
  }
  
  return true;
};

// 上传图片
const uploadImage = async (file) => {
  if (props.disabled) return;
  
  if (validateFile(file)) {
    try {
      // 显示上传中状态
      const fileUrl = await fileStore.uploadSingleFile(file, props.isAdmin);
      
      if (fileUrl) {
        emit('update:modelValue', fileUrl);
        emit('uploaded', fileUrl);
      }
    } catch (error) {
      console.error('上传图片失败', error);
      ElMessage.error('上传图片失败: ' + (error.message || '未知错误'));
      emit('error', error);
    }
  }
};

// 触发文件选择
const triggerUpload = () => {
  if (props.disabled) return;
  uploadRef.value && uploadRef.value.click();
};

// 文件选择后处理
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    uploadImage(file);
  }
  // 重置input，以便再次选择相同文件
  e.target.value = '';
};

// 删除图片
const removeImage = () => {
  if (props.disabled || !props.deletable) return;
  emit('update:modelValue', '');
  emit('deleted');
};
</script>

<template>
  <div class="image-uploader" :class="{ 'is-disabled': disabled }">
    <!-- 有图片时显示预览 -->
    <div 
      v-if="modelValue" 
      class="image-preview" 
      :style="{ ...sizeStyle, ...{ [shapeStyle]: true } }"
    >
      <img :src="previewUrl" class="image" />
      
      <!-- 删除按钮 -->
      <div v-if="deletable" class="image-actions">
        <el-button 
          type="danger" 
          :icon="Delete" 
          circle 
          size="small" 
          @click="removeImage"
          :disabled="disabled"
        ></el-button>
      </div>
    </div>
    
    <!-- 无图片时显示上传占位符 -->
    <div 
      v-else 
      class="image-upload-placeholder" 
      :style="{ ...sizeStyle, ...{ [shapeStyle]: true } }"
      @click="triggerUpload"
    >
      <el-icon><Upload /></el-icon>
      <span>点击上传</span>
    </div>
    
    <!-- 隐藏的文件输入 -->
    <input
      ref="uploadRef"
      type="file"
      accept="image/*"
      style="display: none;"
      @change="handleFileChange"
      :disabled="disabled"
    />
  </div>
</template>

<style scoped>
.image-uploader {
  display: inline-flex;
  justify-content: center;
}

.image-uploader.is-disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.image-preview {
  position: relative;
  overflow: hidden;
  border: 1px dashed #d9d9d9;
  background-color: #fff;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .image-actions {
  opacity: 1;
}

.image-upload-placeholder {
  border: 1px dashed #d9d9d9;
  background-color: #fbfdff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: #8c939d;
  transition: border-color 0.3s;
}

.image-upload-placeholder:hover {
  border-color: #409eff;
}

.image-upload-placeholder .el-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.is-disabled .image-upload-placeholder {
  cursor: not-allowed;
  background-color: #f5f7fa;
}
</style> 