<script setup lang="ts">
import { ref, computed } from 'vue';
import { Input, Select, DatePicker, Button, Card } from '@arco-design/web-vue';

const searchText = ref('');
const selectedType = ref('全部');
const dateRange = ref([]);

const typeOptions = [
  { label: '全部', value: '全部' },
  { label: '编辑中', value: '编辑中' },
  { label: '待开播', value: '待开播' },
  { label: '直播中', value: '直播中' },
];

// 原始数据
const originalRooms = ref([
  {
    title: '零食大放送',
    status: '编辑中',
    startTime: '2025/1/3 14:25:48',
  },
  {
    title: '快手-俄罗斯糖果巧克力',
    status: '待开播',
    startTime: '2025/1/2 15:21:51',
  },
]);

// 过滤后的数据
const rooms = computed(() => {
  return originalRooms.value.filter(room => {
    // 标题搜索过滤
    const matchSearch = searchText.value ? 
      room.title.toLowerCase().includes(searchText.value.toLowerCase()) : 
      true;

    // 状态类型过滤
    const matchType = selectedType.value === '全部' ? 
      true : 
      room.status === selectedType.value;

    // 日期范围过滤
    let matchDate = true;
    if (dateRange.value && dateRange.value.length === 2) {
      // 将日期字符串转换为时间戳进行比较
      const roomDate = new Date(room.startTime).getTime();
      const start = new Date(dateRange.value[0]);
      const end = new Date(dateRange.value[1]);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      matchDate = roomDate >= start.getTime() && roomDate <= end.getTime();
    }

    return matchSearch && matchType && matchDate;
  });
});

// 重置过滤条件
const resetFilters = () => {
  searchText.value = '';
  selectedType.value = '全部';
  dateRange.value = [];
};

// 刷新数据
const refreshData = async () => {
  try {
    // TODO: 从API获取数据
    // const response = await api.getRooms();
    // originalRooms.value = response.data;
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
  }
};

</script>

<template>
  <div class="p-6">
    <!-- 标题 -->
    <div class="text-2xl font-bold mb-6">数字人直播</div>
    
    <!-- 搜索过滤区 -->
    <div class="flex items-center gap-4 mb-6">
      <a-input
        v-model="searchText"
        placeholder="搜索直播间名称"
        class="w-64"
        allow-clear
        @clear="refreshData"
      >
        <template #prefix>
          <icon-search />
        </template>
      </a-input>
      
      <a-select
        v-model="selectedType"
        :style="{ width: '120px' }"
        :options="typeOptions"
        @change="refreshData"
      />
      
      <a-range-picker
        v-model="dateRange"
        class="w-72"
        @change="refreshData"
      />
      
      <a-button @click="resetFilters">
        <template #icon>
          <icon-refresh />
        </template>
        重置
      </a-button>
    </div>

    <!-- 创建直播间按钮 -->
    <div class="flex justify-between items-center mb-6">
      <a-button type="primary" size="large">
        <template #icon>
          <icon-plus />
        </template>
        创建直播间
      </a-button>
    </div>

    <!-- 空状态提示 -->
    <div v-if="rooms.length === 0" class="flex flex-col items-center justify-center py-20">
      <div class="text-gray-400 mb-4">
        <icon-empty class="text-6xl" />
      </div>
      <div class="text-gray-400 mb-4">
        {{ searchText || selectedType !== '全部' || dateRange.length ? 
           '没有找到符合条件的直播间' : 
           '暂无直播间，请创建新的直播间' }}
      </div>
    </div>

    <!-- 直播间列表 -->
    <div v-else class="grid grid-cols-4 gap-4">
      <a-card
        v-for="room in rooms"
        :key="room.title"
        class="hover:shadow-lg transition-shadow"
      >
        <div class="relative aspect-video bg-gray-100 mb-3">
          <!-- 状态标签 -->
          <div class="absolute left-2 top-2 px-2 py-1 text-sm text-white rounded"
               :class="{
                 'bg-blue-500': room.status === '编辑中',
                 'bg-yellow-500': room.status === '待开播',
                 'bg-green-500': room.status === '直播中'
               }">
            {{ room.status }}
          </div>
        </div>
        
        <div class="text-lg font-medium mb-2">{{ room.title }}</div>
        <div class="text-gray-500 text-sm">{{ room.startTime }}</div>
        
        <div class="mt-3 flex gap-2">
          <a-button type="text">进入直播</a-button>
          <a-button type="text">
            <icon-more-vertical />
          </a-button>
        </div>
      </a-card>
    </div>
  </div>
</template>

<style scoped>
.video-container {
  background-color: var(--color-bg-1);
  min-height: 100vh;
}
</style>
