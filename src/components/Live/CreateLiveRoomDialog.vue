<script setup lang="ts">
import { ref } from 'vue';
import LiveBroadcastService from '../../service/LiveBroadcastService';
import { useRouter } from 'vue-router';

const visible = ref(false);
const form = ref({
  name: '',
  introduction: ''
});

const router = useRouter();

const show = () => {
  visible.value = true;
  form.value = {
    name: '',
    introduction: ''
  };
};

const handleSubmit = async () => {
  try {
    // 创建直播间记录
    const id = await LiveBroadcastService.create({
      live_name: form.value.name,
      live_introduction: form.value.introduction,
      creator: 'current_user',  // 这里需要替换为实际的用户ID
      updater: 'current_user',
      video_duration: '0',
      audio_live_on: 0
    });

    // 关闭对话框
    visible.value = false;

    // 跳转到直播间编辑页面
    router.push({
      path: 'live-room/edit',
      query: { id }
    });
  } catch (error) {
    console.error(error);
  }
};

defineExpose({
  show
});
</script>

<template>
  <a-modal
    v-model:visible="visible"
    title="新建直播间"
    :footer="false"
    :mask-closable="false"
    :width="800"
    class="create-live-room-modal"
  >
    <div class="flex">
      <!-- 左侧虚拟人预览 -->
      <div class="w-[360px] bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg p-4 mr-6">
        <div class="aspect-video bg-black/20 rounded-lg">
          <!-- 预留数字人预览区域 -->
        </div>
      </div>

      <!-- 右侧表单 -->
      <div class="flex-grow">
        <div class="mb-6">
          <div class="text-lg font-medium mb-2">AI数字人直播</div>
        </div>

        <a-form :model="form" class="mb-6" :style="{ width: '100%' }">
          <div class="mb-4">
            <div class="text-sm mb-1 flex items-center justify-center">直播间名称</div>
            <a-input
              v-model="form.name"
              placeholder="给直播间起个好听的名字吧"
              allow-clear
            />
          </div>
          <div class="mb-4">
            <div class="text-sm mb-1 flex items-center justify-center">直播间简介</div>
            <a-textarea
              v-model="form.introduction"
              placeholder="介绍一下直播间的内容"
              :auto-size="{ minRows: 4, maxRows: 6 }"
            />
          </div>
        </a-form>

        <div class="flex justify-center">
          <a-button
            type="primary"
            size="large"
            class="w-full"
            :disabled="!form.name"
            @click="handleSubmit"
          >
            开始搭建
          </a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.create-live-room-modal :deep(.arco-modal-content) {
  padding: 24px;
}
</style>
