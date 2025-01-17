<script setup lang="ts">
import { ref } from 'vue';
import ProductService from '../../service/ProductService';
import { Message } from '@arco-design/web-vue';
import { v4 as uuidv4 } from 'uuid';
import { PathManager } from '../../utils/pathManager';

const visible = ref(false);
const fileList = ref([]);
const imageFile = ref<File | null>(null);
const form = ref({
  product_name: '',
  product_type_id: '',
  product_backroud: '',  // 产品图片
  product_describe: ''
});

const handleImageChange = async (files) => {
  if (files.length > 0) {
    const file = files[0].file;
    if (!file) {
      Message.error('获取文件失败');
      return;
    }
    imageFile.value = file;
    form.value.product_backroud = 'temp';
  } else {
    imageFile.value = null;
    form.value.product_backroud = '';
  }
};

const handleSubmit = async () => {
  // 表单验证
  console.log('Form values:', form.value);
  
  if (!form.value.product_name || !form.value.product_type_id || 
      !imageFile.value || !form.value.product_describe) {
    console.log('Missing required fields:', {
      name: !form.value.product_name,
      type: !form.value.product_type_id,
      image: !imageFile.value,
      desc: !form.value.product_describe
    });
    Message.warning('请填写所有必填项');
    return;
  }

  try {
    // 保存图片文件
    const file = imageFile.value;
    const fileName = `images/product/${uuidv4()}${file.name.substring(file.name.lastIndexOf('.'))}`;
    const fullPath = await window.$mapi.file.fullPath(fileName);
    
    // 确保目录存在
    await window.$mapi.file.mkdir('images/product', { isFullPath: true });
    
    // 读取文件内容
    const buffer = await file.arrayBuffer();
    
    // 写入文件
    await window.$mapi.file.writeBuffer(fullPath, Buffer.from(buffer), { isFullPath: true });
    
    // 更新表单中的图片路径
    form.value.product_backroud = PathManager.toStoragePath(fullPath);

    // 创建产品记录
    const result = await ProductService.create({
      ...form.value,
      state: 'active',
      creator: 'current_user',
      updater: 'current_user',
      productAdvantages: '',
      prodectName: '',
      targetAudience: '',
      price: '',
      exclusivePrice: '',
      liveAdvantages: '',
      liveGuarantee: '',
      answerType: 0,
      agentId: '',
      script_index: 0,
      is_delete: 0
    });

    visible.value = false;
    emit('success', result.id);
  } catch (error) {
    console.error('Create product error:', error);
    Message.error('创建失败');
  }
};

const show = () => {
  visible.value = true;
  fileList.value = [];
  imageFile.value = null;
  form.value = {
    product_name: '',
    product_type_id: '',
    product_backroud: '',
    product_describe: ''
  };
};

const emit = defineEmits(['success']);

defineExpose({
  show
});
</script>

<template>
  <a-modal
    v-model:visible="visible"
    title="新建产品"
    :footer="false"
    :mask-closable="false"
    :width="600"
    class="create-product-modal"
  >
    <a-form :model="form" class="space-y-4">
      <a-form-item field="product_name" label="产品名称" required>
        <a-input
          v-model="form.product_name"
          placeholder="请输入产品名称"
          allow-clear
        />
      </a-form-item>

      <a-form-item field="product_type_id" label="产品种类" required>
        <a-select
          v-model="form.product_type_id"
          placeholder="请选择产品种类"
        >
          <a-option value="type1">服饰内衣</a-option>
          <a-option value="type2">食品美食</a-option>
          <a-option value="type2">美妆护肤</a-option>
          <a-option value="type3">母婴用品</a-option>
          <a-option value="type4">数码家电</a-option>
          <a-option value="type5">家居生活</a-option>
          <a-option value="type6">运动户外</a-option>
          <a-option value="type7">汽车用品</a-option>
          <a-option value="type8">图书音像</a-option>
          <a-option value="type9">其他</a-option>
        </a-select>
      </a-form-item>

      <a-form-item field="product_backroud" label="产品图片" required>
        <a-upload
          v-model:file-list="fileList"
          action="/"
          :auto-upload="false"
          :accept="'.jpg,.jpeg,.png,.gif'"
          :limit="1"
          list-type="picture-card"
          image-preview
          @change="handleImageChange"
        >
          <template #upload-button>
            <div class="flex flex-col items-center">
              <icon-plus />
              <div class="mt-2">上传图片</div>
            </div>
          </template>
        </a-upload>
      </a-form-item>

      <a-form-item field="product_describe" label="产品描述" required>
        <a-textarea
          v-model="form.product_describe"
          placeholder="请输入产品描述"
          :auto-size="{ minRows: 3, maxRows: 5 }"
        />
      </a-form-item>

      <div class="flex justify-end gap-2">
        <a-button @click="visible = false">取消</a-button>
        <a-button type="primary" @click="handleSubmit">创建</a-button>
      </div>
    </a-form>
  </a-modal>
</template> 