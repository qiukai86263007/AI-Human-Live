<template>
  <div class="p-6">
    <!-- 顶部标题和按钮区 -->
    <div class="flex justify-between items-center mb-6">
      <div class="text-2xl font-bold">形象克隆</div>
      <div class="flex gap-3">
        <a-button>
          <template #icon>
            <icon-book />
          </template>
          操作手册
        </a-button>
        <a-button type="outline" status="success">
          <template #icon>
            <icon-user />
          </template>
          配置角色
        </a-button>
        <a-button type="primary" @click="showCloneDialog = true">
          <template #icon>
            <icon-plus />
          </template>
          新建克隆形象
        </a-button>
        <a-button>
          <template #icon>
            <icon-refresh @click="loadAvatarList" />
          </template>
        </a-button>
      </div>
    </div>

    <!-- 空状态提示 -->
    <div v-if="!avatarList.length" class="flex flex-col items-center justify-center py-20">
      <div class="text-gray-400 mb-4">
        <icon-user class="text-6xl" />
      </div>
      <div class="text-gray-400 mb-4">暂无克隆形象，请新建克隆形象，克隆完成后可以在我的主播中找到并使用</div>
    </div>

    <!-- 形象克隆卡片列表 -->
    <div v-else>
      <div v-for="avatar in avatarList" :key="avatar.id" class="avatar-card bg-[#252632] rounded-lg p-4 mb-4">
        <div class="flex items-center">
          <!-- 头像区域 -->
          <div class="relative w-16 h-16 mr-4">
            <div v-if="avatar.anchor_backgroud" class="w-full h-full rounded-lg overflow-hidden">
              <img :src="avatar.anchor_backgroud" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-full h-full rounded-lg bg-[#1D1E2B] flex items-center justify-center">
              <icon-user class="text-2xl text-gray-400" />
            </div>
          </div>

          <!-- 信息区域 -->
          <div class="flex-grow text-gray-400">
            <div>{{ avatar.anchor_name }}</div>
            <div>创建时间: {{ new Date(avatar.create_date).toLocaleString() }}</div>
          </div>

          <!-- 操作区域 -->
          <div class="flex items-center gap-4">
            <a-tag color="green" v-if="avatar.state === 'normal'">可使用</a-tag>
            <a-button type="text" @click="handleEdit(avatar)">
              <template #icon>
                <icon-edit />
              </template>
              编辑
            </a-button>
            <a-button type="text" status="danger" @click="handleDelete(avatar.id)">
              <template #icon>
                <icon-delete />
              </template>
              删除
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑对话框 -->
    <a-modal v-model:visible="showCloneDialog" title="新建克隆形象" width="500" @ok="handleSaveClone"
      @cancel="handleCancelClone">
      <div class="clone-form">
        <div class="mb-4">
          <div>
            <span>上传形象视频：</span>
          </div>
          <div>
            <span>上传一段视频文件，用于克隆形象。建议上传视频时长为10-30秒，视频质量清晰，避免多人出现、明显遮挡等情况，视频封面将作为主播形象照片</span>
          </div>
          <div class="upload-area" @click="handleVideoClick">
            <div class="upload-placeholder">
              <icon-plus />
            </div>
            <div v-if="videoFileName" class="upload-filename">{{ videoFileName }}</div>
            <div class="upload-text">支持MP4格式,建议大小不超过50MB</div>
          </div>
          <!-- 视频封面预览 -->
          <div v-if="coverImageUrl" class="mt-4">
            <div class="text-sm text-gray-400 mb-2">视频封面预览（默认作为主播形象照片）:</div>
            <img :src="coverImageUrl" class="w-full max-h-[200px] object-contain rounded-lg" />
          </div>
          <input
            type="file"
            ref="videoUploadRef"
            accept=".mp4"
            class="hidden"
            @change="handleVideoUpload"
          />
        </div>

        <div class="mb-4">
          <div class="flex items-center">
            <span class="w-32 flex-shrink-0">形象昵称：</span>
            <a-input v-model="name" placeholder="请输入姓名" style="width: 150px" />
          </div>
        </div>

        <div class="mb-4">
          <span>形象性别：</span>
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
import { ref, onMounted, watch } from 'vue';
import { Modal, Radio, Input, Message } from '@arco-design/web-vue';
import { IconPlus } from '@arco-design/web-vue/es/icon';
import AnchorService, { AnchorRecord } from '../service/AnchorService';
import { v4 as uuidv4 } from 'uuid';
import { PathManager } from '../utils/pathManager';
const avatarList = ref<AnchorRecord[]>([]);
const showCloneDialog = ref(false);
const name = ref('');
const gender = ref('male');
const videoFile = ref<File | null>(null);
const videoFileName = ref('');
const videoUploadRef = ref<HTMLInputElement | null>(null);
const coverImageUrl = ref('');
const videoBlob = ref<Blob | null>(null);

// 加载形象列表
const loadAvatarList = async () => {
  try {
    avatarList.value = await AnchorService.list();
  } catch (error) {
    Message.error('加载形象列表失败');
  }
};

// 从视频中提取封面帧
const extractCoverFrame = async (file: File): Promise<{ dataUrl: string; blob: Blob }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.preload = 'metadata';
    video.currentTime = 0;
    video.autoplay = false;
    video.muted = true;
    
    video.oncanplay = () => {
      video.currentTime = 0.1;
    };
    
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }
        const dataUrl = canvas.toDataURL('image/jpeg');
        resolve({ dataUrl, blob });
        
        URL.revokeObjectURL(video.src);
        video.remove();
      }, 'image/jpeg', 0.95);
    };
    
    video.src = URL.createObjectURL(file);
  });
};

const handleVideoClick = () => {
  videoUploadRef.value?.click();
};

const handleVideoUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (!['video/mp4'].includes(file.type)) {
      Message.error('请上传MP4格式的视频文件');
      target.value = '';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      Message.error('视频文件大小不能超过50MB');
      target.value = '';
      return;
    }
    videoFile.value = file;
    videoFileName.value = file.name;
    
    try {
      const { dataUrl, blob } = await extractCoverFrame(file);
      coverImageUrl.value = dataUrl;
      videoBlob.value = blob;
    } catch (error) {
      Message.error('提取视频封面失败');
    }
    
    target.value = '';
  }
};

const handleSaveClone = async () => {
  try {
    if (!name.value) {
      Message.warning('请输入形象昵称');
      return;
    }
    if (!videoFile.value) {
      Message.warning('请上传形象视频');
      return;
    }
    if (!videoBlob.value) {
      Message.warning('请等待视频封面生成');
      return;
    }

    const fileName = `avatar/${uuidv4()}.jpg`;
    // 获取完整路径
    const fullPath = await window.$mapi.file.fullPath(fileName);
    try {
    
      // 确保目录存在
      await window.$mapi.file.mkdir('avatar', { isFullPath: true });
      

      
      const arrayBuffer = await videoBlob.value.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await window.$mapi.file.writeBuffer(fullPath, uint8Array, {isFullPath:true});
  
    } catch (error) {
      Message.error('保存图片失败');
      return;
    }
    
    await AnchorService.create({
      anchor_name: name.value,
      anchor_backgroud: PathManager.toStoragePath(fullPath),
      state: 'normal',
      creator: 'myself',
      updater: 'myself'
    });

    Message.success('保存成功');
    showCloneDialog.value = false;
    await loadAvatarList();
    resetForm();
    
  } catch (error) {
    Message.error('保存失败');
  }
};

// 编辑形象
const handleEdit = async (record: AnchorRecord) => {
  name.value = record.anchor_name;
  // 如果有背景图,则显示
  if (record.anchor_backgroud) {
    coverImageUrl.value = record.anchor_backgroud;
  }
  showCloneDialog.value = true;
};

// 删除形象
const handleDelete = async (id: string) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个形象吗？',
    onOk: async () => {
      try {
        await AnchorService.delete(id);
        Message.success('删除成功');
        await loadAvatarList();
      } catch (error) {
        Message.error('删除失败');
      }
    }
  });
};

const handleCancelClone = () => {
  showCloneDialog.value = false;
  resetForm();
};

// 重置表单所有状态
const resetForm = () => {
  name.value = '';
  gender.value = 'male';
  videoFile.value = null;
  videoFileName.value = '';
  coverImageUrl.value = '';
};

// 监听对话框显示状态
watch(showCloneDialog, (newValue) => {
  if (newValue) {
    // 打开对话框时重置表单
    resetForm();
  }
});

onMounted(() => {
  loadAvatarList();
});
</script>

<style scoped>
.avatar-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.clone-form {
  display: flex;
  flex-direction: column;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #ccc;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
}

.upload-filename {
  margin-top: 8px;
  font-size: 14px;
  color: #165DFF;
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

.hidden {
  display: none;
}
</style> 