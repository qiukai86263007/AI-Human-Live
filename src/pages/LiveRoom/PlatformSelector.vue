<template>
  <a-modal
    v-model:visible="modalVisible"
    title="选择开播平台"
    :footer="false"
    :mask-closable="true"
    :width="800"
  >
    <div class="grid grid-cols-4 gap-4">
      <div v-for="platform in platforms" 
           :key="platform.id"
           class="aspect-[2/1] rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
           :class="`bg-gradient-to-r ${getPlatformGradient(platform.code)}`"
           @click="handleSelect(platform)"
      >
        <div class="h-full flex items-center justify-center text-white">
          <div class="text-center">
            <img :src="`/platform-icons/${platform.icon}.png`" 
                 :alt="platform.name"
                 class="w-8 h-8 mx-auto mb-1"
            />
            <div class="text-sm">{{ platform.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';

interface Platform {
  id: number;
  name: string;
  icon: string;
  code: string;
}

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'select', platform: Platform): void;
}>();

// 使用计算属性处理 v-model
const modalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 直播平台列表
const platforms = [
  { id: 1, name: '抖音', icon: 'douyin', code: 'douyin' },
  { id: 2, name: '视频号', icon: 'channels', code: 'channels' },
  { id: 3, name: '快手', icon: 'kuaishou', code: 'kuaishou' },
  { id: 4, name: '阿里国际站', icon: 'alibaba', code: 'alibaba' },
  { id: 5, name: 'TikTok', icon: 'tiktok', code: 'tiktok' },
  { id: 6, name: '淘宝', icon: 'taobao', code: 'taobao' },
  { id: 7, name: '美团', icon: 'meituan', code: 'meituan' },
  { id: 8, name: '拼多多', icon: 'pdd', code: 'pdd' },
];

// 获取平台卡片的渐变背景
const getPlatformGradient = (code: string) => {
  const gradients = {
    douyin: 'from-[#FE2C55] to-[#000000]',
    channels: 'from-[#07C160] to-[#045D3F]',
    kuaishou: 'from-[#FE6D2D] to-[#B94B1E]',
    alibaba: 'from-[#FF6A00] to-[#B94B1E]',
    tiktok: 'from-[#FE2C55] to-[#000000]',
    taobao: 'from-[#FF4400] to-[#B93200]',
    meituan: 'from-[#FFD100] to-[#B99A00]',
    pdd: 'from-[#E22E1F] to-[#A31E15]'
  };
  return gradients[code] || 'from-gray-500 to-gray-700';
};

// 处理平台选择
const handleSelect = (platform: Platform) => {
  emit('select', platform);
  emit('update:visible', false);
};
</script> 