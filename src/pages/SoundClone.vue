<template>
  <div class="p-6">
    <!-- 顶部标题和按钮区 -->
    <div class="flex justify-between items-center mb-6">
      <div class="text-2xl font-bold">声音克隆</div>
      <div class="flex gap-3">
        <a-button>
          <template #icon>
            <icon-book />
          </template>
          操作手册
        </a-button>
        <a-button type="outline" status="success">
          <template #icon>
            <icon-sound />
          </template>
          配置角色
        </a-button>
        <a-button type="primary" @click="showCloneVoiceDialog = true">
          <template #icon>
            <icon-plus />
          </template>
          新建克隆声音
        </a-button>
        <a-button>
          <template #icon>
            <icon-refresh />
          </template>
        </a-button>
      </div>
    </div>

    <!-- 空状态提示 -->
    <div v-if="!soundList.length" class="flex flex-col items-center justify-center py-20">
      <div class="text-gray-400 mb-4">
        <icon-sound class="text-6xl" />
      </div>
      <div class="text-gray-400 mb-4">暂无克隆声音，请新建克隆声音</div>
    </div>

    <!-- 声音克隆卡片列表 -->
    <div v-else>
      <div v-for="sound in soundList" :key="sound.id" class="sound-card bg-[#252632] rounded-lg p-4 mb-4">
        <div class="flex items-center">
          <!-- 头像区域 -->
          <div class="relative w-16 h-16 mr-4">
            <div v-if="sound.avatar" class="w-full h-full rounded-lg overflow-hidden">
              <img :src="sound.avatar" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-full h-full rounded-lg bg-[#1D1E2B] flex items-center justify-center">
              <icon-user class="text-2xl text-gray-400" />
            </div>
            <div class="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-1 rounded">
              XIII
            </div>
          </div>

          <!-- 信息区域 -->
          <div class="flex-grow">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-lg font-medium text-white">{{ sound.name }}</span>
              <a-tag v-if="sound.level" color="purple" size="small">{{ sound.level }}</a-tag>
            </div>
            <div class="text-sm text-gray-300">
              克隆ID: {{ sound.id }}
            </div>
            <div class="text-sm text-gray-300">
              {{ sound.trainDate }} 训练次数{{ sound.trainCount }}
            </div>
          </div>

          <!-- 状态和操作区域 -->
          <div class="flex items-center gap-4">
            <a-tag color="green" v-if="sound.canUse">可使用</a-tag>
            <a-button type="text">
              <template #icon>
                <icon-edit />
              </template>
              编辑
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <a-modal v-model:visible="showCloneVoiceDialog" title="新建克隆声音" width="500" @ok="handleSaveCloneVoice"
      @cancel="handleCancelCloneVoice">
      <div class="clone-voice-form">
        <!-- <a-radio-group v-model="selectedPlatform" class="mb-4">
          <a-radio value="aliyun">阿里云</a-radio>
          <a-radio value="huoshan">火山引擎</a-radio>
        </a-radio-group> -->

        <div class="mb-4">
          <div>
            <span>上传音频文件：</span>
          </div>
          <div>
            <span>上传一段音频文件，用于克隆声音。建议上传音频时长为10-30秒，音频质量大于音频的时长，避免多人对话、明显杂音、噪音等情况</span>
          </div>
          <div class="image-upload">
            <div class="upload-placeholder">
              <icon-plus />
            </div>
            <div class="upload-text">支持WAV/MP3/M4A格式,建议大小不超过2MB</div>
          </div>
        </div>
        <div class="mb-4">
          <div>
            <span>音频文件对应的文字内容：</span>
          </div>
          <div>
            <a-textarea placeholder="请输入音频文件对应的文字内容" :auto-size="{ minRows: 3, maxRows: 6 }" />
          </div>
        </div>
        <div class="mb-4">
          <div>
            <span>上传音频者封面：</span>
          </div>
          <div>
            <span>上传音频者的图片，用作克隆声音的封面</span>
          </div>
          <div class="image-upload">
            <div class="upload-placeholder">
              <icon-plus />
            </div>
            <div class="upload-text">支持格式:JPG/PNG/JPEG,建议大小不超过5MB</div>
          </div>
        </div>
        <div class="mb-4">
          <div class="flex items-center">
            <span class="w-32 flex-shrink-0">音频源昵称：</span>
            <a-input v-model="name" placeholder="请输入姓名" style="width: 150px" />
          </div>
        </div>

        <div class="mb-4">
          <span>音频者性别：</span>
          <a-radio-group v-model="gender" class="ml-4">
            <a-radio value="male">男</a-radio>
            <a-radio value="female">女</a-radio>
          </a-radio-group>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Modal, Radio, Input, Select, Option } from '@arco-design/web-vue';
import { IconPlus } from '@arco-design/web-vue/es/icon';

interface SoundCloneItem {
  id: string;
  name: string;
  trainCount: string;
  trainDate: string;
  canUse: boolean;
  level?: string;
  avatar?: string;
}

const soundList = ref<SoundCloneItem[]>([
  {
    id: 'S_VesFaHCe1',
    name: '小范/普通话',
    trainCount: '3/10',
    trainDate: '2025/01/02',
    canUse: true,
    level: 'L'
  },
  //可以添加更多声音克隆记录
]);

const showCloneVoiceDialog = ref(false);
const selectedPlatform = ref('aliyun');
const name = ref('');
const gender = ref('male');
const language = ref('普通话');
const voiceId = ref('');

const handleSaveCloneVoice = () => {
  // 保存逻辑
};

const handleCancelCloneVoice = () => {
  showCloneVoiceDialog.value = false;
};
</script>

<style scoped>
.sound-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.clone-voice-form {
  display: flex;
  flex-direction: column;
}

.image-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #ccc;
  padding: 20px;
  border-radius: 8px;
}

.upload-placeholder {
  font-size: 24px;
  color: #ccc;
}

.upload-text {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}
</style>
