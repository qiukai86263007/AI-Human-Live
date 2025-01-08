<script setup lang="ts">
import { ref } from 'vue';
import ProductService from '../../service/ProductService';
import { Message } from '@arco-design/web-vue';

const visible = ref(false);
const form = ref({
  product_name: '',
  product_type_id: '',
  product_backroud: '',  // 产品图片
  product_describe: ''
});

const handleSubmit = async () => {
  try {
    await ProductService.create({
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
    Message.success('创建成功');
    // 触发刷新事件
    emit('refresh');
  } catch (error) {
    console.error('创建产品失败:', error);
    Message.error('创建失败');
  }
};

const show = () => {
  visible.value = true;
  form.value = {
    product_name: '',
    product_type_id: '',
    product_backroud: '',
    product_describe: ''
  };
};

const emit = defineEmits(['refresh']);

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
          <a-option value="type1">种类1</a-option>
          <a-option value="type2">种类2</a-option>
          <a-option value="type3">种类3</a-option>
        </a-select>
      </a-form-item>

      <a-form-item field="product_backroud" label="产品图片" required>
        <a-upload
          v-model="form.product_backroud"
          action="/"
          :auto-upload="false"
          image-preview
        />
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