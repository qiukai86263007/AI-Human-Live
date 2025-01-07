<template>
  <a-modal
    v-model:visible="modalVisible"
    :title="`AI智能互动设置${platform ? `（平台：${platform}）` : ''}`"
    :footer="false"
    :mask-closable="false"
    :closable="true"
    :width="800"
    :draggable="true"
    :align-center="false"
    modal-class="platform-settings-modal"
    :style="{ position: 'fixed' }"
    @close.stop="handleClose"
  >
    <div class="flex h-[600px]">
      <!-- 左侧选项卡 -->
      <div class="w-32 border-r border-gray-200">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          class="py-3 px-4 cursor-pointer"
          :class="currentTab === tab.key ? 'bg-blue-50 text-blue-500' : 'text-gray-500 hover:bg-gray-50'"
          @click="currentTab = tab.key"
        >
          {{ tab.name }}
        </div>
      </div>
      
      <!-- 右侧内容区域 -->
      <div class="flex-1 p-4">
        <!-- 全局设置面板 -->
        <div v-if="currentTab === 'global'" class="h-full">
          <div class="flex flex-col h-full">
            <div class="space-y-6 flex-grow">
              <!-- 运行模式 -->
              <div>
                <div class="mb-2">运行模式</div>
                <div class="flex items-center gap-4">
                  <a-radio-group v-model="settings.runMode">
                    <a-radio value="smart">智能弹夹</a-radio>
                    <a-radio value="practice">实时弹夹</a-radio>
                  </a-radio-group>
                </div>

              </div>
              
              <!-- 发送间隔 -->
              <div>
                <div class="mb-2">发送间隔</div>
                <div class="flex items-center gap-2">
                  <a-input-number
                    v-model="settings.replyDelay"
                    :min="0"
                    :max="100"
                    class="w-24"
                  />
                  <span>秒内一次关键词不重复回复</span>
                </div>
              </div>
              
              <!-- 优先级设置 -->
              <div>
                <div class="mb-2">优先级设置</div>
                <div class="flex flex-wrap gap-4">
                  <div v-for="item in priorityItems" 
                       :key="item.key" 
                       class="flex items-center gap-2 whitespace-nowrap"
                  >
                    <a-input-number
                      v-model="settings.priorities[item.key]"
                      :min="0"
                      :max="10"
                      :precision="0"
                      class="w-16"
                      size="small"
                    />
                    <span>{{ item.label }}</span>
                  </div>
                </div>
                <div class="text-gray-400 text-sm mt-1">
                  数字越大优先级越高，仅针对智能模式生效
                </div>
              </div>
            </div>
            
            <!-- 底部保存按钮 -->
            <div class="flex justify-end mt-6 pt-4 border-t">
              <a-button type="primary" @click="handleSave">
                保存当前设置
              </a-button>
            </div>
          </div>
        </div>
        
        <!-- 定时引导面板 -->
        <div v-else-if="currentTab === 'timing'" class="h-full">
          <!-- 定时引导内容 -->
        </div>
        
        <!-- 人气互动面板 -->
        <div v-else-if="currentTab === 'popularity'" class="h-full">
          <!-- 人气互动内容 -->
        </div>
        
        <!-- 礼物感谢面板 -->
        <div v-else-if="currentTab === 'gift'" class="h-full">
          <!-- 礼物感谢内容 -->
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed, ref, reactive } from 'vue';

interface Settings {
  runMode: 'smart' | 'practice';
  replyDelay: number;
  priorities: {
    productQA: number;
    activity: number;
    welcome: number;
    gift: number;
    popularity: number;
  };
}

// 设置数据
const settings = reactive<Settings>({
  runMode: 'smart',
  replyDelay: 10,
  priorities: {
    productQA: 4,
    activity: 3,
    welcome: 2,
    gift: 1,
    popularity: 0
  }
});

// 选项卡配置
const tabs = [
  { key: 'global', name: '全局设置' },
  { key: 'timing', name: '定时引导' },
  { key: 'popularity', name: '人气互动' },
  { key: 'gift', name: '礼物感谢' },
];

// 当前选中的选项卡
const currentTab = ref('global');

const props = defineProps<{
  visible: boolean;
  platform?: string;  // 平台名称
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'back'): void;
  (e: 'close'): void;
}>();

// 使用计算属性处理 v-model
const modalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 处理返回
const handleBack = () => {
  emit('back');
};

// 处理关闭
const handleClose = (e: Event) => {
  // 阻止事件冒泡
  e?.stopPropagation();
  emit('close');
  emit('update:visible', false);
};

// 处理保存
const handleSave = () => {
  // TODO: 实际保存逻辑
  console.log('保存设置:', settings);
  // 可以添加保存成功提示
  Message.success('设置已保存');
};

// 优先级配置
const priorityItems = [
  { key: 'productQA', label: '产品问答' },
  { key: 'activity', label: '活动引导' },
  { key: 'welcome', label: '欢迎' },
  { key: 'gift', label: '礼物感谢' },
  { key: 'popularity', label: '人气互动' },
];
</script>

<style scoped>
/* 添加过渡效果 */
.py-3 {
  transition: all 0.3s ease;
}

/* 设置初始位置 */
:deep(.platform-settings-modal) {
  z-index: 2000 !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%);
  position: fixed !important;
}

/* 确保遮罩层也在更高层级 */
:deep(.arco-modal-mask) {
  z-index: 1999 !important;
}

/* 添加拖动时的鼠标样式 */
:deep(.arco-modal-header) {
  cursor: move;
}
</style>