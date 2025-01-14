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
            <div v-if="avatar.avatar" class="w-full h-full rounded-lg overflow-hidden">
              <img :src="avatar.avatar" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-full h-full rounded-lg bg-[#1D1E2B] flex items-center justify-center">
              <icon-user class="text-2xl text-gray-400" />
            </div>
          </div>

          <!-- 状态和操作区域 -->
          <div class="flex items-center gap-4">
            <a-tag color="green" v-if="avatar.canUse">可使用</a-tag>
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
            <span>上传一段视频文件，用于克隆形象。建议上传视频时长为10-30秒，视频质量清晰，避免多人出现、明显遮挡等情况</span>
          </div>
          <div class="upload-area" @click="handleVideoClick">
            <div class="upload-placeholder">
              <icon-plus />
            </div>
            <div v-if="videoFileName" class="upload-filename">{{ videoFileName }}</div>
            <div class="upload-text">支持MP4格式,建议大小不超过50MB</div>
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
import { ref, onMounted } from 'vue';
import { Modal, Radio, Input, Message } from '@arco-design/web-vue';
import { IconPlus } from '@arco-design/web-vue/es/icon';
import { v4 as uuidv4 } from 'uuid';
import { PathManager } from '../utils/pathManager';

interface AvatarCloneItem {
  id: string;
  name: string;
  canUse: boolean;
  avatar?: string;
  create_date?: string;
  video_url?: string;
  state?: string;
}

const avatarList = ref<AvatarCloneItem[]>([]);
const showCloneDialog = ref(false);
const name = ref('');
const gender = ref('male');
const videoFile = ref<File | null>(null);
const videoFileName = ref('');
const videoUploadRef = ref<HTMLInputElement | null>(null);

// 保存文件到本地
const saveFile = async (file: File, subDir: string): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const ext = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${ext}`;
  const fullSubDir = await window.$mapi.file.fullPath(`${subDir}`);
  const filePath = `${fullSubDir}/${fileName}`;
  
  // 确保目录存在
  await window.$mapi.file.mkdir(fullSubDir);
  
  // 写入文件
  await window.$mapi.file.writeBuffer(filePath, Buffer.from(buffer), { isFullPath: true });
  
  // 转换为标准化的 URL 格式存储到数据库
  return PathManager.toStoragePath(filePath);
};

// 加载形象克隆列表
const loadAvatarList = async () => {
  try {
    // TODO: 实现加载列表逻辑
    avatarList.value = [];
  } catch (error) {
    console.error('加载形象克隆列表失败:', error);
    Message.error('加载形象克隆列表失败');
  }
};

// 删除形象克隆
const handleDelete = async (id: string) => {
  try {
    await Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个克隆形象吗？',
      onOk: async () => {
        // TODO: 实现删除逻辑
        Message.success('删除成功');
        loadAvatarList();
      }
    });
  } catch (error) {
    console.error('删除失败:', error);
    Message.error('删除失败');
  }
};

// 编辑形象克隆
const handleEdit = async (item: AvatarCloneItem) => {
  try {
    name.value = item.name;
    showCloneDialog.value = true;
  } catch (error) {
    console.error('加载编辑数据失败:', error);
    Message.error('加载编辑数据失败');
  }
};

// 在组件挂载时加载列表
onMounted(() => {
  loadAvatarList();
});

const handleSaveClone = async () => {
  try {
    if (!videoFile.value) {
      Message.error('请上传形象视频');
      return;
    }
    
    if (!name.value) {
      Message.error('请输入形象昵称');
      return;
    }
    
    // 保存视频文件
    const videoPath = await saveFile(videoFile.value, 'videos');
    
    // TODO: 实现保存到数据库的逻辑
    
    Message.success('保存成功');
    showCloneDialog.value = false;
    
    // 刷新列表
    await loadAvatarList();
    
    // 重置表单
    name.value = '';
    gender.value = 'male';
    videoFile.value = null;
    videoFileName.value = '';
    
  } catch (error) {
    console.error('保存失败:', error);
    Message.error('保存失败');
  }
};

const handleCancelClone = () => {
  showCloneDialog.value = false;
};

const handleVideoUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    // 检查文件类型
    if (!['video/mp4'].includes(file.type)) {
      Message.error('请上传MP4格式的视频文件');
      return;
    }
    // 检查文件大小（50MB = 50 * 1024 * 1024 bytes）
    if (file.size > 50 * 1024 * 1024) {
      Message.error('视频文件大小不能超过50MB');
      return;
    }
    videoFile.value = file;
    videoFileName.value = file.name;
  }
};

const handleVideoClick = () => {
  videoUploadRef.value?.click();
};
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