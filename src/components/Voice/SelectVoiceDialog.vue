<template>
  <a-modal
    :visible="visible"
    @update:visible="(val) => $emit('update:visible', val)"
    title="选择主播声音"
    width="800"
    @cancel="handleCancel"
  >
    <div class="voice-list">
      <!-- 搜索框 -->
      <div class="mb-4">
        <a-input-search
          v-model="searchText"
          placeholder="搜索主播声音"
          allow-clear
          @search="handleSearch"
          @clear="handleSearch('')"
        />
      </div>

      <!-- 主播声音列表 -->
      <template v-if="voices.length > 0">
        <div class="grid grid-cols-3 gap-4">
          <div
            v-for="voice in filteredVoices"
            :key="voice.id"
            class="voice-card p-4 rounded-lg cursor-pointer"
            :class="{ 'selected': selectedVoiceId === voice.id }"
            @click="handleSelect(voice)"
          >
            <!-- 头像区域 -->
            <div class="relative w-full aspect-square mb-2 rounded-lg overflow-hidden">
              <img
                v-if="voice.image_url"
                :src="voice.image_url"
                :alt="voice.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full bg-[#1D1E2B] flex items-center justify-center">
                <icon-user class="text-4xl text-gray-400" />
              </div>
            </div>

            <!-- 信息区域 -->
            <div class="text-center">
              <div class="text-sm text-gray-400 mb-1">{{ voice.name }}</div>
              <div class="text-sm text-gray-400">
                {{ voice.gender_id === 1 ? '男' : '女' }} /
                {{ voice.language_id === 1 ? '普通话' :
                   voice.language_id === 2 ? '英语' :
                   voice.language_id === 3 ? '日语' : '未知' }}
              </div>
            </div>

            <!-- 试听按钮 -->
            <div class="mt-2 flex justify-center">
              <a-button
                type="text"
                size="small"
                @click.stop="handlePlayAudio(voice)"
              >
                <template #icon>
                  <icon-play-circle v-if="currentPlayingId !== voice.id" />
                  <icon-pause-circle v-else />
                </template>
                {{ currentPlayingId === voice.id ? '停止' : '试听' }}
              </a-button>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center py-12">
          <icon-exclamation-circle-fill class="text-4xl text-gray-400 mb-4" />
          <div class="text-gray-400 mb-4">暂无可用的主播声音</div>
          <a-button type="outline" @click="goToSoundClone">
            <template #icon>
              <icon-plus />
            </template>
            去声音克隆
          </a-button>
        </div>
      </template>
    </div>

    <template #footer>
      <a-button @click="handleCancel">取消</a-button>
      <a-button
        type="primary"
        :disabled="!selectedVoiceId"
        @click="handleConfirm"
      >
        确定
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { useRouter } from 'vue-router';
import AudioCharacterService from '../../service/AudioCharacterService';
import { PathManager } from '../../utils/pathManager';

interface VoiceItem {
  id?: string;
  name?: string;
  gender_id?: number;
  language_id?: number;
  voice_id?: string;
  image_url?: string;
  audio_url?: string;
  state?: string;
}

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'select', voice: VoiceItem): void;
}>();

const searchText = ref('');
const voices = ref<VoiceItem[]>([]);
const selectedVoiceId = ref('');
const audioPlayer = ref<HTMLAudioElement | null>(null);
const currentPlayingId = ref<string | null>(null);

const router = useRouter();

// 过滤后的声音列表
const filteredVoices = computed(() => {
  if (!searchText.value) return voices.value;
  return voices.value.filter(voice =>
    voice.name?.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 加载声音列表
const loadVoices = async () => {
  try {
    const list = await AudioCharacterService.list();
    voices.value = list.filter(item => item.state === 'normal');
  } catch (error) {
    console.error('加载主播声音列表失败:', error);
    Message.error('加载主播声音列表失败');
  }
};

// 处理搜索
const handleSearch = (value: string) => {
  searchText.value = value;
};

// 处理选择
const handleSelect = (voice: VoiceItem) => {
  selectedVoiceId.value = voice.id || '';
};

// 处理确认
const handleConfirm = () => {
  const selectedVoice = voices.value.find(v => v.id === selectedVoiceId.value);
  if (selectedVoice) {
    emit('select', selectedVoice);
    handleCancel();
  }
};

// 处理取消
const handleCancel = () => {
  selectedVoiceId.value = '';
  emit('update:visible', false);
};

// 处理音频播放
const handlePlayAudio = async (voice: VoiceItem) => {
  try {
    if (!voice.audio_url) {
      Message.error('音频文件不存在');
      return;
    }

    // 如果正在播放同一个音频，则停止播放
    if (currentPlayingId.value === voice.id && audioPlayer.value?.paused === false) {
      audioPlayer.value?.pause();
      audioPlayer.value.currentTime = 0;
      currentPlayingId.value = null;
      return;
    }

    // 如果正在播放其他音频，先停止
    if (audioPlayer.value && !audioPlayer.value.paused) {
      audioPlayer.value.pause();
      audioPlayer.value.currentTime = 0;
    }

    // 获取音频文件的完整路径
    const audioPath = PathManager.fromStoragePath(voice.audio_url);
    
    try {
      // 读取音频文件
      const buffer = await window.$mapi.file.readBuffer(audioPath, { isFullPath: true });
      
      // 创建Blob对象，指定MIME类型
      const blob = new Blob([buffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      // 创建新的音频播放器
      audioPlayer.value = new Audio(audioUrl);
      currentPlayingId.value = voice.id || null;

      // 播放结束时清理
      audioPlayer.value.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentPlayingId.value = null;
      };

      // 开始播放
      await audioPlayer.value.play();
    } catch (error) {
      console.error('读取音频文件失败:', error);
      throw error;
    }
  } catch (error) {
    Message.error('音频播放失败');
    currentPlayingId.value = null;
  }
};

// 跳转到声音克隆页面
const goToSoundClone = () => {
  router.push('/sound');
  handleCancel();
};

// 组件挂载时加载数据
loadVoices();

// 组件卸载时停止播放
onUnmounted(() => {
  if (audioPlayer.value && !audioPlayer.value.paused) {
    audioPlayer.value.pause();
  }
});
</script>

<style scoped>
.voice-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: #252632;
  transition: all 0.3s;
}

.voice-card:hover {
  border-color: #165DFF;
}

.voice-card.selected {
  border-color: #165DFF;
  background-color: rgba(22, 93, 255, 0.1);
}
</style> 