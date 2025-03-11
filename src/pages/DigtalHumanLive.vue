<script setup lang="ts">
import { ref, computed, watch, onMounted, onActivated, onDeactivated } from 'vue';
import { Message, Modal } from '@arco-design/web-vue';
import CreateLiveRoomDialog from '../components/Live/CreateLiveRoomDialog.vue';
import LiveBroadcastService, { LiveBroadcastRecord } from '../service/LiveBroadcastService';
import LiveProductService from '../service/LiveProductService';
import ProductSceneService from '../service/ProductSceneService';
import { useRouter } from 'vue-router';
import { LiveRoomState } from '../types/liveRoomState';
import { StorageUtil } from '../lib/storage'
import { MusetalkUtils } from '../utils/MusetalkUtils';

import { useMyStore } from '../store/modules/myStore';
import { getStatus } from '../utils/VoiceCloneUtils';
import { get } from 'lodash-es';
import { mock } from 'node:test';

interface MockQueryResponse {
  msg: string;
  code: number;
  data: {
    pending_count: number;
    processing_count: number;
    total_count: number;
    failed_count: number;
    completed_count: number;
  };
}

const store = useMyStore();

const router = useRouter();
const createDialog = ref();
const liveRooms = ref<LiveBroadcastRecord[]>([]);
const previewImages = ref<Record<string, string>>({});
const searchText = ref('');
const selectedType = ref('全部');
const dateRange = ref([]);

const typeOptions = [
  { label: '全部', value: '全部' },
  { label: '生成视频中', value: LiveRoomState.CREATING },
  { label: '编辑中', value: LiveRoomState.EDITING },
  { label: '待开播', value: LiveRoomState.CREATED },
  { label: '直播中', value: LiveRoomState.LIVE },
];

// 加载直播间列表
const loadLiveRooms = async () => {
  try {
    liveRooms.value = await LiveBroadcastService.list();
    console.log('加载直播间列表:', liveRooms.value);
    store.livesList = liveRooms.value.map(i=>{
      return {
        id: i.id,
        state: i.state
      }
    }) as any;
    console.log('store.livesList',store.livesList)
    // 加载每个直播间的预览图
    for (const room of liveRooms.value) {
      if (!room.id) continue;
      try {
        // 获取直播间的第一个产品
        const products = await LiveProductService.listByLiveId(room.id);
        console.log('products', products);
        if (products.length > 0) {
          // 获取第一个产品的场景（包含主播信息）
          const scenes = await ProductSceneService.listByProductId(products[0].product_id);
          console.log('scenes', scenes);
          if (scenes.length > 0) {
            // 使用第一个场景的主播图片作为预览图
            previewImages.value[room.id] = scenes[0].anchor_url;
            
          }
        }
      } catch (error) {
        console.error('加载预览图失败:', error);
      }
    }
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
      const roomDate = room.create_date ? new Date(room.create_date).getTime() : 0;
      const start = dateRange.value[0] ? new Date(dateRange.value[0]) : new Date();
      const end = dateRange.value[1] ? new Date(dateRange.value[1]) : new Date();
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

/*用于下载*/
let gettingList:any[] = [];
let isQuerying = false;
watch(()=>store.livesList,  // 每次onMounted 都会触发一次 提交下载请求也会更新store(TODO)
  async (new1,old) => {
    // console.log('livesList changed',new1,old);
    let a = new1.filter(item=>item.state == LiveRoomState.CREATING)
    let b;
    if(old){
      b = old.filter(item=>item.state == LiveRoomState.CREATING)
      for(let i=0;i<a.length;i++){
        if(b.includes(a[i])) continue;
        gettingList.push(a[i]);
      }
    }else{
      gettingList = a;
    }
    // console.log('gettingList',gettingList);
    queryIsDownloadable(gettingList); // 轮询可下载状态
  }
)
const queryIsDownloadable = async (list) => {
  if(isQuerying) return;
  // 如果正在寻找 那么增加 否则新建
  if(list.length){
    isQuerying = true;
    const promises = list.map(i=>{
      // loopQuery(i.id)  // 请求状态  注意 后端提供的格式是 ../state/123  而不是  ../state?parentTaskId=123
      return mockQuery().then(r=>r.data)
      .then(d=>{
        if(d.completed_count==d.total_count){
          sendDownloadRequest(i.id);
          gettingList = gettingList.filter(item => item.id !== i.id);
        }
      })
      .catch(e=>{
        console.error(`查询直播间 ${i.id} 状态失败:`, e)
      })
    })

    await Promise.all(promises)
    isQuerying = false;
    if (gettingList.length) {
      setTimeout(() => {
        queryIsDownloadable(gettingList);
      }, 1000);
    }
  }
}
// 实际需要用到MusetalkUtils.getTaskStatus(taskId)然后再.then
const mockQuery = async ():Promise<MockQueryResponse> => new Promise((resolve,reject)=>{
  setTimeout(()=>{
    let a :MockQueryResponse = {
      'msg':'操作成功',
      'code':200,
      'data':{
        'pending_count':19,
        'processing_count':1,
        'total_count':20,
        'failed_count':0,
        'completed_count':20
      }
    }
    resolve(a)
  },100)
})
const mockVideos = [
  { videoPath1:'1',videoName:'1.mp4' },
  { videoPath2:'2',videoName:'2.mp4' },
  { videoPath3:'3',videoName:'3.mp4' }
]
const sendDownloadRequest = async id =>{
  /* 这里 会发起getRenderedViews(taskId: string)  以及其他逻辑处理
    希望在getRenderedViews返回已经解压缩好了的文件路径
    然后这个函数中 根据表中的update事件 确定好视频的顺序 然后剩下的就是考虑拼接播放了
   */
  id = '78ce0232-5795-469d-a5d7-ea0776be0349'
  let path = await MusetalkUtils.mockGetRenderedViews(id);
  console.log('已经拿到视频文件夹:',path)
  
  // 下面确定视频顺序  
  // let getDefaultSequence = ()
}
function mockGetRenderViews(id){
  // .then(async r=>{       // 更新直播状态为 待直播
  //   await LiveBroadcastService.update(liveId, {
  //     state: LiveRoomState.CREATED,
  //     update_date: new Date().toISOString(),
  //     updater: 'current_user'
  //   });
  // })
}





// 组件挂载时加载数据
onMounted(() => {
  loadLiveRooms();
  console.log('```onMounted```')
});
onActivated(()=>{
  loadLiveRooms();
  console.log('```onActivated```')
})
const handleCreate = () => {
  createDialog.value?.show();
};

const getStateColor = (state?: string) => {
  switch (state) {
    case LiveRoomState.EDITING:
      return 'blue';
    case LiveRoomState.CREATED:
      return 'orange';
    case LiveRoomState.LIVE:
      return 'green';
      case LiveRoomState.CREATING:
      return 'blue';
    default:
      return 'gray';
  }
};

const getStateText = (state?: string) => {
  switch (state) {
    case LiveRoomState.EDITING:
      return '编辑中';
    case LiveRoomState.CREATED:
      return '待开播';
    case LiveRoomState.LIVE:
      return '直播中';
    case LiveRoomState.CREATING:
      return '渲染中';
    default:
      return '未知状态';
  }
};

const handleRoomClick = (room: LiveBroadcastRecord) => {
  console.log('handleRoomClick roomId:', room.id);
  if (!room.id) return;
  router.push({
    path: '/live-room/edit',
    query: { id: room.id ,autoSelect: 'true'}
  })
};

// 添加删除方法
const handleDelete = async (room: LiveBroadcastRecord, event: Event) => {
  // 阻止事件冒泡，避免触发卡片点击
  event.stopPropagation();
  
  Modal.warning({
    title: '确认删除',
    content: `确定要删除直播间 "${room.live_name}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      try {
        await LiveBroadcastService.delete(room);
        Message.success('删除成功');
        loadLiveRooms(); // 重新加载列表
      } catch (error) {
        console.error('删除直播间失败:', error);
        Message.error('删除失败');
      }
    },
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
        重置过滤条件
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
    <div class="grid grid-cols-4 gap-6">
      <template v-if="filteredRooms.length">
        <div v-for="room in filteredRooms" 
             :key="room.id" 
             class="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group"
             @click="handleRoomClick(room)"
        >
          <!-- 删除按钮 -->
          <div class="absolute top-3 right-3 z-10">
            <a-button
              type="primary"
              status="danger"
              shape="circle"
              size="mini"
              class="opacity-0 group-hover:opacity-100 transition-opacity"
              @click="(e) => handleDelete(room, e)"
            >
              <template #icon>
                <icon-delete />
              </template>
            </a-button>
          </div>
          
          <!-- 预览图片 -->
          <div class="absolute inset-0">
            <template v-if="room.id && previewImages[room.id]">
              <img :src="previewImages[room.id]" :alt="room.live_name" class="w-full h-full object-cover">
            </template>
            <template v-else>
              <div class="w-full h-full flex items-center justify-center text-gray-500 bg-black/10">
                <icon-image class="text-4xl" />
              </div>
            </template>
          </div>
          
          <!-- 内容遮罩 -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
            <div class="absolute bottom-0 left-0 right-0 p-6">
              <div class="text-white font-medium text-lg mb-3">{{ room.live_name }}</div>
              <div class="text-gray-100 text-sm line-clamp-2 mb-4">{{ room.live_introduction }}</div>
              <div class="flex justify-between items-center">
                <a-tag :color="getStateColor(store.livesList.find(i=>i.id === room.id).state)" size="small">
                  {{ getStateText(store.livesList.find(i=>i.id === room.id).state) }}
                </a-tag>
                <span class="text-sm text-gray-200">
                  {{ room.create_date ? new Date(room.create_date).toLocaleDateString() : '' }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- 悬停效果遮罩 -->
          <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </template>
      <template v-else>
        <div class="col-span-3 text-center py-12 text-gray-400">
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
