<template>
  <div 
    v-show="modelValue" 
    class="draggable-window"
    :style="{ 
      left: position.x + 'px', 
      top: position.y + 'px',
      width: size.width + 'px',
      height: size.height + 'px'
    }"
    ref="dragRef"
  >
    <div class="resize-handle top" @mousedown.stop="startResize('top')"></div>
    <div class="resize-handle right" @mousedown.stop="startResize('right')"></div>
    <div class="resize-handle bottom" @mousedown.stop="startResize('bottom')"></div>
    <div class="resize-handle left" @mousedown.stop="startResize('left')"></div>
    <div class="resize-handle top-left" @mousedown.stop="startResize('top-left')"></div>
    <div class="resize-handle top-right" @mousedown.stop="startResize('top-right')"></div>
    <div class="resize-handle bottom-left" @mousedown.stop="startResize('bottom-left')"></div>
    <div class="resize-handle bottom-right" @mousedown.stop="startResize('bottom-right')"></div>

    <div class="window-header" @mousedown="startDrag">
      <div class="title">场控设置</div>
      <div class="controls">
        <a-button type="text" size="mini" @click="handleCancel">
          <icon-close />
        </a-button>
      </div>
    </div>
    
    <div class="window-content">
      <div class="live-room">
        <a-layout>
          <a-layout-content>
            <div class="webview-container" ref="webviewContainer">
              <webview
                v-if="modelValue"
                ref="webviewRef"
                :src="initialUrl"
                
                allowpopups
                class="h-[800px] w-full"
                style="display:inline-flex;"
              ></webview>
            </div>
          </a-layout-content>
          
          <a-layout-sider :style="{ width: '300px' }">
            <div class="comment-list">
              <div class="comment-header">
                <h3>弹幕列表</h3>
              </div>
              <div class="comments">
                <div v-for="(comment, index) in comments" :key="index" class="comment-item">
                  <span class="username">{{ comment.username }}:</span>
                  <span class="content">{{ comment.content }}</span>
                  <span class="time">{{ comment.time }}</span>
                </div>
              </div>

              <div class="comment-input">
                <a-input
                  v-model="commentText"
                  placeholder="输入要发送的评论"
                  :maxLength="40"
                ></a-input>
                <a-button type="primary" @click="handleSendComment">发送</a-button>
              </div>
            </div>
          </a-layout-sider>
        </a-layout>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, onMounted, nextTick, defineProps, defineEmits, watch, computed } from 'vue';
import { Message } from '@arco-design/web-vue';
import type { WebviewTag } from 'electron';
import { IconClose } from '@arco-design/web-vue/es/icon';
import { ipcRenderer } from 'electron';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  roomId: {
    type: String,
    default: ''
  },
  welcomeGuide: {
    type: Boolean,
    default: false
  },
  productQA: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'onNewComments']);

// Form state
interface FormState {
  liveUrl: string;
}

const formState = ref<FormState>({
  liveUrl: ''
});

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const liveUrl = ref('');
const initialUrl = computed(() => {
  if (props.roomId) {
    return `https://live.kuaishou.com/u/${props.roomId}`;
  }
  return 'https://live.kuaishou.com';
});
const webviewRef = ref<WebviewTag | null>(null);
const webviewContainer = ref<HTMLElement | null>(null);
const comments = ref<Array<{username: string, content: string, time: string, id: string}>>([]);
const commentText = ref('');
const collectInterval = ref<number | null>(null);
const platform = ref<'kuaishou' | 'douyin'>('kuaishou');
const autoReplyInterval = ref<number | null>(null);
const repliedComments = new Set<string>();

// Add dragging functionality
const position = ref({ x: 50, y: 50 });
const isDragging = ref(false);
const dragRef = ref<HTMLElement | null>(null);
let startPos = { x: 0, y: 0 };
let startMousePos = { x: 0, y: 0 };

// Add window size state
const size = ref({
  width: 1000,
  height: 700
});

// Add minimum size limit
const MIN_WIDTH = 600;
const MIN_HEIGHT = 400;

// Add resizing state
const isResizing = ref(false);
const resizeDirection = ref('');
let startSize = { width: 0, height: 0 };
let startResizePos = { x: 0, y: 0 };

// Add watch for modelValue
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    // Dialog is shown, initialize webview
    nextTick(() => {
      initWebview();
    });
  } else {
    // Dialog is hidden, cleanup webview
    if (webviewRef.value) {
      stopCollection();
      comments.value = [];
      // 通知父组件清空弹幕
      emit('onNewComments', []);
      webviewRef.value = null;
    }
  }
});

const handleCancel = () => {
  stopCollection();
  comments.value = [];
  // 通知父组件清空弹幕
  emit('onNewComments', []);
  emit('update:modelValue', false);
  emit('cancel');
};

const loadLiveRoom = () => {
  if (!formState.value.liveUrl) {
    Message.warning('请输入直播间地址');
    return;
  }
  
  try {
    const url = new URL(formState.value.liveUrl);
    if (!url.hostname.includes('kuaishou.com') && !url.hostname.includes('douyin.com')) {
      Message.error('请输入正确的快手或抖音直播间地址');
      return;
    }
    
    platform.value = url.hostname.includes('kuaishou.com') ? 'kuaishou' : 'douyin';
    
    if (webviewRef.value) {
      webviewRef.value.loadURL(url.href);
      stopCollection();
    }
  } catch (error) {
    Message.error('请输入正确的URL地址');
  }
};

const startCollection = () => {
  if (!webviewRef.value) return;
  
  const collectComments = () => {
    const kuaishouScript = `
      (() => {
        try {
          // 获取弹幕容器
          const wrapper = document.querySelector('.wrapper.flex-1.flex-col');
          if (!wrapper) return [];
          
          // 获取所有非系统消息的弹幕
          const messages = Array.from(wrapper.querySelectorAll('.comment-cell')).filter(item => {
            // 过滤掉系统消息和已处理的消息
            if (item.classList.contains('system') || item.dataset.processed) return false;
            // 标记该消息已被处理
            item.dataset.processed = 'true';
            return true;
          });
          
          if (!messages.length) return [];
          
          const comments = [];
          messages.forEach(message => {
            try {
              const usernameElement = message.querySelector('.username');
              const commentElement = message.querySelector('.comment');
              
              if (!usernameElement || !commentElement) {
                console.log('找不到用户名或内容元素:', message.innerHTML);
                return;
              }
              
              const username = usernameElement.textContent.replace('：', '').trim();
              let content = '';
              
              const innerSpan = commentElement.querySelector('span span:last-child');
              if (innerSpan) {
                content = innerSpan.textContent?.trim() || '';
              } else {
                content = commentElement.textContent?.trim() || '';
              }
              
              if (username && content) {
                const timestamp = new Date().getTime();
                comments.push({
                  username,
                  content: content.trim(),
                  time: new Date().toLocaleString(),
                  id: \`\${username}-\${content}-\${Math.floor(timestamp/1000)}\`
                });
              }
            } catch (e) {
              console.error('处理单条弹幕出错:', e);
            }
          });
          
          return comments;
        } catch (e) {
          console.error('采集弹幕出错:', e);
          return [];
        }
      })()
    `;

    const douyinScript = `
      (() => {
        try {
          const messages = document.querySelectorAll('.webcast-chatroom___item.webcast-chatroom___enter-done');
          if (!messages.length) return [];
          
          const comments = [];
          messages.forEach(message => {
            try {
              const username = message.querySelector('.u2QdU6ht')?.textContent?.replace('：', '').trim();
              const contentElement = message.querySelector('.WsJsvMP9');
              
              if (!username || !contentElement) return;
              
              let content = '';
              const textElement = contentElement.querySelector('.webcast-chatroom___content-with-emoji-text');
              if (textElement) {
                content = textElement.textContent?.trim() || '';
              }
              
              const emojiElements = contentElement.querySelectorAll('.webcast-chatroom___content-with-emoji-emoji img');
              const emojis = Array.from(emojiElements).map(img => img.alt || '').filter(Boolean);
              if (emojis.length > 0) {
                content += ' ' + emojis.join(' ');
              }
              
              if (content) {
                const timestamp = new Date().getTime();
                comments.push({
                  username,
                  content,
                  time: new Date().toLocaleString(),
                  id: \`\${username}-\${content}-\${Math.floor(timestamp/1000)}\`
                });
              }
            } catch (e) {
              console.error('处理单条弹幕出错:', e);
            }
          });
          
          return comments;
        } catch (e) {
          console.error('采集弹幕出错:', e);
          return [];
        }
      })()
    `;

    webviewRef.value?.executeJavaScript(
      platform.value === 'kuaishou' ? kuaishouScript : douyinScript
    ).then((result: any) => {
      if (Array.isArray(result) && result.length > 0) {
        const currentTime = new Date().getTime();
        const newComments = result.filter(comment => {
          const isDuplicate = comments.value.some(existing => 
            existing.id === comment.id || 
            (existing.username === comment.username && 
             existing.content === comment.content && 
             (currentTime - new Date(existing.time).getTime()) < 60000)
          );
          return !isDuplicate;
        });
        
        if (newComments.length > 0) {
          comments.value.push(...newComments);
          emit('onNewComments', newComments);
        }
      }
    }).catch(error => {
      console.error('执行弹幕采集脚本出错:', error);
    });
  };
  
  collectComments();
  collectInterval.value = window.setInterval(collectComments, 1000);

  if (platform.value === 'kuaishou' && props.welcomeGuide) {
    startAutoReply();
  }
};

const stopCollection = () => {
  if (collectInterval.value) {
    clearInterval(collectInterval.value);
    collectInterval.value = null;
  }
  stopAutoReply();
  repliedComments.clear();
  comments.value = [];
};

const sendComment = async (text: string) => {
  if (!webviewRef.value || !text) return;
  
  try {
    const script = platform.value === 'kuaishou' 
      ? `
        (() => {
          const container = document.querySelector('div.chat-actions');
          if (!container) throw new Error('找不到评论区容器');
          
          const input = container.querySelector('textarea.box-boder[max-length="40"]');
          if (!input) throw new Error('找不到输入框元素');
          
          input.value = ${JSON.stringify(text)};
          input.dispatchEvent(new Event('input', { bubbles: true }));
          
          const sendBtn = container.querySelector('div.submit-button');
          if (!sendBtn) throw new Error('找不到发送按钮');
          
          setTimeout(() => {
            sendBtn.click();
          }, 100);
        })()
      `
      : `
        (() => {
          const input = document.querySelector('.webcast-chatroom___textarea');
          if (!input) throw new Error('找不到评论输入框');
          
          input.value = ${JSON.stringify(text)};
          input.dispatchEvent(new Event('input', { bubbles: true }));
          
          const sendBtn = document.querySelector('.webcast-chatroom___send-btn');
          if (!sendBtn) throw new Error('找不到发送按钮');
          
          sendBtn.click();
        })()
      `;
    
    await webviewRef.value.executeJavaScript(script);
    return true;
  } catch (error) {
    console.error('发送评论失败:', error);
    throw error;
  }
};

const handleSendComment = async () => {
  if (!commentText.value) return;
  
  try {
    await sendComment(commentText.value);
    commentText.value = '';
    Message.success('评论发送成功');
  } catch (error) {
    Message.error('发送评论失败：' + error);
  }
};

const startAutoReply = async () => {
  // 如果两个功能都没开启，或者已经有定时器在运行，就返回
  if ((!props.welcomeGuide && !props.productQA) || autoReplyInterval.value) return;

  // 从数据库获取发送间隔时间
  const configSql = `SELECT interval_time 
    FROM regular_interaction_config 
    WHERE state = 'normal' 
    ORDER BY create_date DESC 
    LIMIT 1`;

  const autoReply = async () => {
    const unrepliedComments = comments.value.filter(comment => !repliedComments.has(comment.id));
    if (unrepliedComments.length > 0) {
      const commentToReply = unrepliedComments[0];
      repliedComments.add(commentToReply.id);

      try {
        await sendAutoReply(commentToReply);
      } catch (error) {
        console.error('自动回复失败:', error);
      }
    }
  };

  try {
    const result = await window.$mapi.db.first(configSql);
    const intervalTime = result?.interval_time ? result.interval_time * 1000 : 10000; // 默认10秒
    autoReplyInterval.value = window.setInterval(autoReply, intervalTime);
  } catch (error) {
    console.error('获取发送间隔时间失败:', error);
    autoReplyInterval.value = window.setInterval(autoReply, 10000);
  }
};

const stopAutoReply = () => {
  if (autoReplyInterval.value) {
    clearInterval(autoReplyInterval.value);
    autoReplyInterval.value = null;
  }
};

const sendAutoReply = async (comment: {username: string, id: string}) => {
  if (!webviewRef.value) return;

  try {
    // 首先随机决定使用哪种回复类型（定时引导或产品问答）
    const useProductQA = Math.random() < 0.5;

    let replyText = '';

    if (useProductQA && props.productQA) {
      // 从QAndA表获取回复内容
      const qaSql = `SELECT replys FROM q_and_a 
        WHERE state = 'normal' 
        ORDER BY RANDOM() 
        LIMIT 1`;

      const qaResult = await window.$mapi.db.first(qaSql);
      
      if (qaResult && qaResult.replys) {
        const replies = Array.isArray(qaResult.replys) 
          ? qaResult.replys 
          : JSON.parse(qaResult.replys || '[]');
        
        if (replies.length > 0) {
          // 随机选择一条回复
          replyText = replies[Math.floor(Math.random() * replies.length)];
        }
      }
    }

    // 如果产品问答没有获取到回复，或者随机选择了定时引导，则使用定时引导的内容
    if (!replyText && props.welcomeGuide) {
      // 从数据库获取定时引导的内容和概率字段
      const guideSql = `SELECT 
        guide_all_contents, guide_follow_contents, 
        guide_cost_contents, guide_share_contents,
        guide_all_chance, guide_follow_chance,
        guide_cost_chance, guide_share_chance
      FROM regular_interaction_config 
      WHERE state = 'normal' 
      ORDER BY create_date DESC 
      LIMIT 1`;

      const result = await window.$mapi.db.first(guideSql);

      if (result) {
        interface ContentItem {
          content: string;
          [key: string]: any;
        }

        interface ContentGroup {
          contents: ContentItem[];
          chance: number;
        }

        // 解析内容和计算概率
        const contentGroups: ContentGroup[] = [
          { 
            contents: result.guide_all_contents ? JSON.parse(result.guide_all_contents) : [], 
            chance: result.guide_all_chance || 0 
          },
          { 
            contents: result.guide_follow_contents ? JSON.parse(result.guide_follow_contents) : [], 
            chance: result.guide_follow_chance || 0 
          },
          { 
            contents: result.guide_cost_contents ? JSON.parse(result.guide_cost_contents) : [], 
            chance: result.guide_cost_chance || 0 
          },
          { 
            contents: result.guide_share_contents ? JSON.parse(result.guide_share_contents) : [], 
            chance: result.guide_share_chance || 0 
          }
        ];

        // 根据概率选择内容组
        const totalChance = contentGroups.reduce((sum, group) => sum + group.chance, 0);
        if (totalChance > 0) {
          let randomNum = Math.random() * totalChance;
          let selectedGroup: ContentGroup | null = null;

          for (const group of contentGroups) {
            if (randomNum < group.chance) {
              selectedGroup = group;
              break;
            }
            randomNum -= group.chance;
          }

          if (selectedGroup && selectedGroup.contents.length > 0) {
            // 从选中的组中随机选择一条内容
            const selectedContent = selectedGroup.contents[Math.floor(Math.random() * selectedGroup.contents.length)];
            if (selectedContent?.content) {
              replyText = selectedContent.content;
            }
          }
        }
      }
    }

    // 如果有回复内容，发送回复
    if (replyText) {
      console.log('Selected reply:', replyText);
      await sendComment(replyText);
    }
  } catch (error) {
    console.error('Auto reply failed:', error);
  }
};

const initWebview = () => {
  nextTick(() => {
    const element = webviewContainer.value?.querySelector('webview') as WebviewTag;
    if (element) {
      webviewRef.value = element;
      
      element.addEventListener('dom-ready', () => {
        console.log('Webview DOM ready');
        webviewRef.value?.openDevTools();
        startCollection();
      });

      element.addEventListener('did-start-loading', () => {
        console.log('开始加载页面');
      });

      element.addEventListener('did-finish-load', () => {
        console.log('页面加载完成');
      });

      element.addEventListener('did-fail-load', (event: Electron.DidFailLoadEvent) => {
        console.log('页面加载失败:', event);
        Message.error('加载失败：' + event.errorDescription);
      });
    }
  });
};

// Add dragging functionality
const startDrag = (e: MouseEvent) => {
  if (!dragRef.value) return;
  
  isDragging.value = true;
  startPos = { x: position.value.x, y: position.value.y };
  startMousePos = { x: e.clientX, y: e.clientY };
  
  // 使用 electron 的 ipcRenderer 来处理拖动
  const handleDrag = async (e: MouseEvent) => {
    if (!isDragging.value) return;
    
    const dx = e.clientX - startMousePos.x;
    const dy = e.clientY - startMousePos.y;
    
    // 计算新位置
    const newX = startPos.x + dx;
    const newY = startPos.y + dy;
    
    // 更新本地位置状态
    position.value = { x: newX, y: newY };
    
    // 通过 IPC 更新窗口位置
    await ipcRenderer.invoke('window:move', null, {
      mouseX: e.offsetX,
      mouseY: e.offsetY,
      width: size.value.width,
      height: size.value.height
    });
  };
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', handleDrag);
  });
};

// Start resizing
const startResize = (direction: string) => {
  isResizing.value = true;
  resizeDirection.value = direction;
  startSize = { width: size.value.width, height: size.value.height };
  startResizePos = { x: position.value.x, y: position.value.y };
  
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
};

// Handle resizing
const onResize = (e: MouseEvent) => {
  if (!isResizing.value) return;

  const dx = e.clientX - startMousePos.x;
  const dy = e.clientY - startMousePos.y;

  switch (resizeDirection.value) {
    case 'right':
      size.value.width = Math.max(MIN_WIDTH, startSize.width + dx);
      break;
    case 'bottom':
      size.value.height = Math.max(MIN_HEIGHT, startSize.height + dy);
      break;
    case 'left':
      const newWidth = Math.max(MIN_WIDTH, startSize.width - dx);
      if (newWidth !== size.value.width) {
        position.value.x = startResizePos.x + (startSize.width - newWidth);
        size.value.width = newWidth;
      }
      break;
    case 'top':
      const newHeight = Math.max(MIN_HEIGHT, startSize.height - dy);
      if (newHeight !== size.value.height) {
        position.value.y = startResizePos.y + (startSize.height - newHeight);
        size.value.height = newHeight;
      }
      break;
    case 'top-left':
      const newWidthTL = Math.max(MIN_WIDTH, startSize.width - dx);
      const newHeightTL = Math.max(MIN_HEIGHT, startSize.height - dy);
      if (newWidthTL !== size.value.width) {
        position.value.x = startResizePos.x + (startSize.width - newWidthTL);
        size.value.width = newWidthTL;
      }
      if (newHeightTL !== size.value.height) {
        position.value.y = startResizePos.y + (startSize.height - newHeightTL);
        size.value.height = newHeightTL;
      }
      break;
    case 'top-right':
      size.value.width = Math.max(MIN_WIDTH, startSize.width + dx);
      const newHeightTR = Math.max(MIN_HEIGHT, startSize.height - dy);
      if (newHeightTR !== size.value.height) {
        position.value.y = startResizePos.y + (startSize.height - newHeightTR);
        size.value.height = newHeightTR;
      }
      break;
    case 'bottom-left':
      const newWidthBL = Math.max(MIN_WIDTH, startSize.width - dx);
      if (newWidthBL !== size.value.width) {
        position.value.x = startResizePos.x + (startSize.width - newWidthBL);
        size.value.width = newWidthBL;
      }
      size.value.height = Math.max(MIN_HEIGHT, startSize.height + dy);
      break;
    case 'bottom-right':
      size.value.width = Math.max(MIN_WIDTH, startSize.width + dx);
      size.value.height = Math.max(MIN_HEIGHT, startSize.height + dy);
      break;
  }
};

// Stop resizing
const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
};

onUnmounted(() => {
  stopCollection();
  document.removeEventListener('mousemove', startDrag);
  document.removeEventListener('mouseup', stopResize);
});

// 暴露方法供外部使用
defineExpose({
  sendComment,
  webviewRef,
});

// 添加对 welcomeGuide 和 productQA 的监听
watch([() => props.welcomeGuide, () => props.productQA], ([newWelcomeGuide, newProductQA]) => {
  // 如果两个功能都关闭，停止自动回复
  if (!newWelcomeGuide && !newProductQA) {
    stopAutoReply();
  } else if (!autoReplyInterval.value) {
    // 如果至少有一个功能开启，且当前没有运行自动回复，则启动
    startAutoReply();
  }
});
</script> 

<style scoped>
.arco-layout-header {
  display: none !important;
}

.arco-layout-sider {
  display: none !important;
}

.draggable-window {
  position: fixed;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.window-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border);
  cursor: move;
  user-select: none;
}

.title {
  font-weight: 500;
}

.controls {
  display: flex;
  gap: 8px;
}

.window-content {
  flex: 1;
  overflow: auto;
  position: relative;
}

.live-room {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 600px;
}

.arco-layout {
  height: 100%;
  background: transparent;
  display: flex;
}

.comment-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  margin: 10px;
}

.comment-header {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
}

.comments {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  height: calc(100% - 120px);
  max-height: none;
}

.comment-item {
  margin-bottom: 10px;
  padding: 5px;
  border-bottom: 1px solid var(--color-border-2);
}

.username {
  color: rgb(var(--primary-6));
  font-weight: bold;
}

.content {
  margin-left: 5px;
}

.time {
  display: block;
  font-size: 12px;
  color: var(--color-text-3);
}

.comment-input {
  padding: 10px;
  display: flex;
  gap: 10px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-1);
}

.webview-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: var(--color-bg-2);
  position: relative;
  overflow: auto;
}

webview {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
}

.arco-layout-content {
  padding: 0;
  position: relative;
  overflow: hidden;
  flex: 1;
}

.arco-layout-sider {
  border-left: 1px solid var(--color-border);
  background: var(--color-bg-1);
  width: 300px !important;
  min-width: 300px !important;
}

/* 添加自定义滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 添加缩放控制点样式 */
.resize-handle {
  position: absolute;
  background: transparent;
  z-index: 1;
}

.resize-handle.top {
  top: -3px;
  left: 3px;
  right: 3px;
  height: 6px;
  cursor: n-resize;
}

.resize-handle.right {
  top: 3px;
  right: -3px;
  bottom: 3px;
  width: 6px;
  cursor: e-resize;
}

.resize-handle.bottom {
  bottom: -3px;
  left: 3px;
  right: 3px;
  height: 6px;
  cursor: s-resize;
}

.resize-handle.left {
  top: 3px;
  left: -3px;
  bottom: 3px;
  width: 6px;
  cursor: w-resize;
}

.resize-handle.top-left {
  top: -3px;
  left: -3px;
  width: 6px;
  height: 6px;
  cursor: nw-resize;
}

.resize-handle.top-right {
  top: -3px;
  right: -3px;
  width: 6px;
  height: 6px;
  cursor: ne-resize;
}

.resize-handle.bottom-left {
  bottom: -3px;
  left: -3px;
  width: 6px;
  height: 6px;
  cursor: sw-resize;
}

.resize-handle.bottom-right {
  bottom: -3px;
  right: -3px;
  width: 6px;
  height: 6px;
  cursor: se-resize;
}
</style> 