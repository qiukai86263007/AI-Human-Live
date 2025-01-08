<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import CreateLiveRoomDialog from '../components/Live/CreateLiveRoomDialog.vue';
import LiveBroadcastService, { LiveBroadcastRecord } from '../service/LiveBroadcastService';
import { useRouter } from 'vue-router';

const router = useRouter();
const createDialog = ref();
const liveRooms = ref<LiveBroadcastRecord[]>([]);
const searchText = ref('');
const selectedType = ref('全部');
const dateRange = ref([]);

const typeOptions = [
  { label: '全部', value: '全部' },
  { label: '编辑中', value: 'editing' },
  { label: '待开播', value: 'created' },
  { label: '直播中', value: 'running' },
];

// 加载直播间列表
const loadLiveRooms = async () => {
  try {
    liveRooms.value = await LiveBroadcastService.list();
  } catch (error) {
    console.error('加载直播间列表失败:', error);
  }
};

// 过滤后的数据
const filteredRooms = computed(() => {
  return liveRooms.value.filter(room => {
    // 标题搜索过滤
    const matchSearch = searchText.value ? 
      room.live_name.toLowerCase().includes(searchText.value.toLowerCase()) : 
      true;

    // 状态类型过滤
    const matchType = selectedType.value === '全部' ? 
      true : 
      room.state === selectedType.value;

    // 日期范围过滤
    let matchDate = true;
    if (dateRange.value && dateRange.value.length === 2) {
      const roomDate = new Date(room.create_date).getTime();
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

// 组件挂载时加载数据
onMounted(() => {
  loadLiveRooms();
});

const handleCreate = () => {
  createDialog.value?.show();
};

const getStateColor = (state?: string) => {
  switch (state) {
    case 'editing':
      return 'blue';
    case 'created':
      return 'orange';
    case 'running':
      return 'green';
    default:
      return 'gray';
  }
};

const getStateText = (state?: string) => {
  switch (state) {
    case 'editing':
      return '编辑中';
    case 'created':
      return '待开播';
    case 'running':
      return '直播中';
    default:
      return '未知状态';
  }
};

const handleRoomClick = (room: LiveBroadcastRecord) => {
  if (!room.id) return;
  router.push({
    path: '/live-room/edit',
    query: { id: room.id }
  });
};
</script>

<template>
  <div class="p-6">
    <!-- 标题 -->
    <div class="mb-6 flex justify-between items-center">
      <div class="text-2xl font-medium">AI数字人直播</div>
    </div>

    <!-- 搜索过滤区 -->
    <div class="flex items-center gap-4 mb-6">
      <a-input
        v-model="searchText"
        placeholder="搜索直播间名称"
        class="w-64"
        allow-clear
      >
        <template #prefix>
          <icon-search />
        </template>
      </a-input>
      
      <a-select
        v-model="selectedType"
        :style="{ width: '120px' }"
        :options="typeOptions"
      />
      
      <a-range-picker
        v-model="dateRange"
        class="w-72"
      />
      
      <a-button @click="resetFilters">
        <template #icon>
          <icon-refresh />
        </template>
        重置
      </a-button>
      
      <div class="flex-grow"></div>
      
      <a-button type="primary" @click="handleCreate">
        <template #icon>
          <icon-plus />
        </template>
        新建直播间
      </a-button>
    </div>

    <!-- 直播间列表 -->
    <div class="grid grid-cols-5 gap-6">
      <template v-if="filteredRooms.length">
        <div v-for="room in filteredRooms" 
             :key="room.id" 
             class="bg-[#1D1E2B] rounded-lg overflow-hidden cursor-pointer hover:bg-[#2A2B3B] transition-colors"
             @click="handleRoomClick(room)"
        >
          <div class="aspect-video bg-black/20">
            <!-- 预览图位置 -->
          </div>
          <div class="p-4">
            <div class="text-white font-medium mb-2">{{ room.live_name }}</div>
            <div class="text-gray-400 text-sm line-clamp-2">{{ room.live_introduction }}</div>
            <div class="mt-2 flex justify-between items-center">
              <a-tag :color="getStateColor(room.state)">
                {{ getStateText(room.state) }}
              </a-tag>
              <span class="text-sm text-gray-500">
                {{ new Date(room.create_date).toLocaleDateString() }}
              </span>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="col-span-5 text-center py-12 text-gray-400">
          {{ searchText || selectedType !== '全部' || dateRange.length ? 
             '没有找到符合条件的直播间' : 
             '暂无直播间，点击右上角创建' }}
        </div>
      </template>
    </div>

    <CreateLiveRoomDialog ref="createDialog" />
  </div>
</template>

<style scoped>
.video-container {
  background-color: var(--color-bg-1);
  min-height: 100vh;
}
</style>
