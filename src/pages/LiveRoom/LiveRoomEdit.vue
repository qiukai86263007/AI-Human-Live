<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import PlatformSelector from './PlatformSelector.vue';
import PlatformSettings from './PlatformSettings.vue';
import CreateProductDialog from '../../components/Product/CreateProductDialog.vue';
import LiveBroadcastService, { LiveBroadcastRecord } from '../../service/LiveBroadcastService';
import LiveProductService, { LiveProductRecord } from '../../service/LiveProductService';
import ProductService, { ProductRecord } from '../../service/ProductService';
import AnchorService, { AnchorRecord } from '../../service/AnchorService';

const router = useRouter();
const route = useRoute();
const currentTab = ref('主播选择');
const currentPage = ref(1);
const createProductDialog = ref();
const pageSize = 4; // 每页显示4个主播
const isEditing = ref(false);
const roomName = ref('');
const searchText = ref('');
const manualText = ref('');
const aiKeyword = ref('');
const aiGeneratedText = ref('');
const scriptList = ref([]);
const scriptSearchText = ref('');
const questionSearchText = ref('');
const replyDelay = ref(60);
const replyMode = ref('1');
const showPlatformDialog = ref(false);
const showPlatformSettings = ref(false);
const selectedPlatform = ref('');
const liveRoom = ref<LiveBroadcastRecord | null>(null);
const anchors = ref<AnchorRecord[]>([]);
const selectedAnchor = ref<AnchorRecord | null>(null);

const tabs = [
  { key: '主播选择', icon: 'icon-user' },
  { key: '产品台词', icon: 'icon-file' },
  { key: '产品问答', icon: 'icon-question' },
  { key: '商品讲解', icon: 'icon-shopping' }
];

// 获取主播列表
const loadAnchors = async () => {
  anchors.value = await AnchorService.list();
};

// 过滤后的主播列表
const filteredAnchors = computed(() => {
  if (!searchText.value) return anchors.value;
  return anchors.value.filter(anchor => 
    anchor.anchor_name.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 计算当前页显示的主播
const currentAnchors = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredAnchors.value.slice(start, start + pageSize);
});

const toggleEdit = async () => {
  if (isEditing.value) {
    // 保存逻辑
    if (liveRoom.value?.id) {
      try {
        await LiveBroadcastService.update(liveRoom.value.id, {
          live_name: roomName.value,
          updater: 'current_user'  // 这里需要替换为实际的用户ID
        });
      } catch (error) {
        console.error('保存直播间名称失败:', error);
      }
    }
    isEditing.value = false;
  } else {
    isEditing.value = true;
  }
};

// 处理搜索
const handleSearch = (value: string) => {
  searchText.value = value;
  currentPage.value = 1; // 重置页码
};

// 添加到列表
const addToList = (type: 'manual' | 'ai') => {
  if (!currentProduct.value) {
    Message.warning('请先选择产品');
    return;
  }

  const text = type === 'manual' ? manualText.value : aiGeneratedText.value;
  if (!text.trim()) {
    Message.warning('请输入内容');
    return;
  }

  // 添加到当前产品的台词列表中
  currentProduct.value.scripts.push({
    id: Date.now(),
    content: text,
    type
  });

  // 清空输入
  if (type === 'manual') {
    manualText.value = '';
  } else {
    aiGeneratedText.value = '';
    aiKeyword.value = '';
  }
  
  Message.success('添加成功');
};

// 处理脚本搜索
const handleScriptSearch = (value: string) => {
  scriptSearchText.value = value;
  currentPage.value = 1; // 重置页码
};

// 生成AI内容
const generateAiContent = () => {
  if (!aiKeyword.value) return;
  // TODO: 调用AI生成接口
  aiGeneratedText.value = `基于关键词"${aiKeyword.value}"生成的AI内容...`;
};

// 处理问题搜索
const handleQuestionSearch = (value: string) => {
  questionSearchText.value = value;
};

interface QA {
  id: number;
  question: string;
  answer: string;
}

interface QuestionCategory {
  id: number;
  name: string;
  qas: QA[];
}

// 新增问题种类
const addNewCategory = () => {
  if (!currentProduct.value) {
    Message.warning('请先选择产品');
    return;
  }

  editingCategory.value = {
    id: Date.now(),
    name: '',
    qas: []
  };
  showEditCategoryDialog.value = true;
};

// 添加新的Q&A
const addQA = (categoryId: number) => {
  if (!currentProduct.value) {
    Message.warning('请先选择产品');
    return;
  }

  const category = currentProduct.value.questionCategories.find(c => c.id === categoryId);
  if (category) {
    editingQA.value = {
      id: Date.now(),
      question: '',
      answer: ''
    };
    // 保存当前操作的分类ID
    editingQA.value._categoryId = categoryId;
    showEditQADialog.value = true;
  }
};

// 编辑状态
const editingQA = ref<QA>({ id: 0, question: '', answer: '' });
const editingCategory = ref<QuestionCategory>({ id: 0, name: '', qas: [] });
const showEditQADialog = ref(false);
const showEditCategoryDialog = ref(false);

// 编辑问题种类
const editCategory = (category: QuestionCategory) => {
  editingCategory.value = JSON.parse(JSON.stringify(category));
  showEditCategoryDialog.value = true;
};

// 删除问题种类
const deleteCategory = (categoryId: number) => {
  questionCategories.value = questionCategories.value.filter(c => c.id !== categoryId);
};

// 编辑Q&A
const editQA = (categoryId: number, qa: QA) => {
  if (!currentProduct.value) return;

  const category = currentProduct.value.questionCategories.find(c => c.id === categoryId);
  if (category) {
    editingQA.value = JSON.parse(JSON.stringify(qa));
    editingQA.value._categoryId = categoryId;
    showEditQADialog.value = true;
  }
};

// 删除Q&A
const deleteQA = (categoryId: number, qaId: number) => {
  if (!currentProduct.value) return;

  const category = currentProduct.value.questionCategories.find(c => c.id === categoryId);
  if (category) {
    category.qas = category.qas.filter(qa => qa.id !== qaId);
  }
};

// 保存编辑的Q&A
const saveQA = () => {
  if (!currentProduct.value) return;

  // 如果问题和答案都为空，则不保存
  if (!editingQA.value.question.trim() || !editingQA.value.answer.trim()) {
    showEditQADialog.value = false;
    editingQA.value = { id: 0, question: '', answer: '' };
    return;
  }
  
  currentProduct.value.questionCategories = currentProduct.value.questionCategories.map(category => {
    // 只在对应的分类中添加或更新Q&A
    if (category.id === editingQA.value._categoryId) {
      const qaIndex = category.qas.findIndex(qa => qa.id === editingQA.value?.id);
      if (qaIndex !== -1) {
        category.qas[qaIndex] = { ...editingQA.value };
      } else {
        // 如果找不到现有的QA，说明是新增
        category.qas.push({ ...editingQA.value });
      }
    }
    return category;
  });
  
  showEditQADialog.value = false;
  editingQA.value = { id: 0, question: '', answer: '' };
  Message.success('保存成功');
};

// 保存编辑的问题种类
const saveCategory = () => {
  if (!currentProduct.value) return;
  
  if (!editingCategory.value.name.trim()) {
    showEditCategoryDialog.value = false;
    editingCategory.value = { id: 0, name: '', qas: [] };
    return;
  }
  
  const index = currentProduct.value.questionCategories.findIndex(c => c.id === editingCategory.value?.id);
  if (index !== -1) {
    currentProduct.value.questionCategories[index] = { ...editingCategory.value };
  } else {
    // 如果找不到现有的种类，说明是新增
    currentProduct.value.questionCategories.push({ ...editingCategory.value });
  }
  
  showEditCategoryDialog.value = false;
  editingCategory.value = { id: 0, name: '', qas: [] };
};

// 处理平台选择
const handlePlatformSelect = (platform: any) => {
  selectedPlatform.value = platform.name;
  showPlatformDialog.value = false;
  showPlatformSettings.value = true;
};

// 处理设置返回
const handleSettingsBack = () => {
  showPlatformSettings.value = false;
  showPlatformDialog.value = true;
};

interface ProductExtend extends LiveProductRecord {
  currentTab?: string;
  scripts: Array<{
    id: number;
    content: string;
    type: 'manual' | 'ai';
  }>;
  questionCategories: Array<{
    id: number;
    name: string;
    qas: Array<{
      id: number;
      question: string;
      answer: string;
    }>;
  }>;
}

// 产品列表数据
const productList = ref<ProductRecord[]>([]);
const currentProduct = ref<ProductExtend | null>(null);
// 选择模式
const isMultiSelect = ref(false);
// 选中的产品ID列表
const selectedProducts = ref<string[]>([]);
// 是否全选
const isAllSelected = computed(() => {
  return productList.value.length > 0 && selectedProducts.value.length === productList.value.length;
});

// 加载产品列表
const loadProducts = async () => {
  const id = route.query.id as string;
  if (!id) return;
  
  try {
    productList.value = await LiveProductService.listByLiveId(id);
  } catch (error) {
    Message.error('加载产品列表失败');
  }
};

// 处理新建产品
const handleCreateProduct = () => {
  createProductDialog.value?.show();
};

// 处理产品创建成功
const handleProductCreated = async (productId: string) => {
  const liveId = route.query.id as string;
  if (!liveId) return;

  try {
    console.log('Creating live product relation:', { liveId, productId });
    // 创建直播间-产品关联
    await LiveProductService.create({
      live_id: liveId,
      product_id: productId,
      ording: productList.value.length,
      state: 'active',
      creator: 'current_user',
      updater: 'current_user',
      script_index: 0
    });

    await loadProducts();
    Message.success('创建成功');
  } catch (error) {
    console.error('关联产品失败:', error);
    Message.error('关联产品失败');
  }
};

// 处理选择产品
const handleSelectProduct = (product: ProductRecord) => {
  if (isMultiSelect.value) {
    // 多选模式：切换选中状态
    const index = selectedProducts.value.indexOf(product.id!);
    if (index > -1) {
      selectedProducts.value.splice(index, 1);
    } else {
      selectedProducts.value.push(product.id!);
    }
  } else {
    // 单选模式：切换到产品对应的选项卡
    const extendedProduct: ProductExtend = {
      id: product.id,
      live_id: route.query.id as string,
      product_id: product.id!,
      ording: 0,
      state: 'active',
      creator: 'current_user',
      updater: 'current_user',
      script_index: 0,
      scripts: [],
      questionCategories: []
    };
    currentProduct.value = extendedProduct;
    selectedProducts.value = [product.id!];
    currentTab.value = '主播选择';
  }
};

// 处理全选
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedProducts.value = productList.value.map(product => product.id!).filter(Boolean);
  } else {
    selectedProducts.value = [];
  }
};

// 处理多选切换
const handleMultiSelect = (checked: boolean) => {
  isMultiSelect.value = checked;
  if (!checked) {
    // 退出多选模式时，清空选择
    selectedProducts.value = [];
  }
};

// 处理删除
const handleDelete = async () => {
  if (selectedProducts.value.length === 0) return;
  
  try {
    // 如果当前选中的产品被删除，清空currentProduct
    if (currentProduct.value && selectedProducts.value.includes(currentProduct.value.id!)) {
      currentProduct.value = null;
    }

    const liveId = route.query.id as string;
    const liveProducts = await LiveProductService.listByLiveId(liveId);
    const toDelete = liveProducts.filter(lp => {
      return selectedProducts.value.includes(lp.id!);
    });
    
    for (const liveProduct of toDelete) {
      await ProductService.delete({ id: liveProduct.product_id });
      await LiveProductService.delete(liveProduct);
    }

    await loadProducts();
    selectedProducts.value = [];
    Message.success('删除成功');
  } catch (error) {
    Message.error('删除失败');
  }
};

// 添加选项卡切换处理函数
const handleTabChange = (tab: string) => {
  if (!currentProduct.value) {
    Message.warning('请先选择产品');
    return;
  }
  currentTab.value = tab;
  currentProduct.value.currentTab = tab;
};

// 加载直播间数据
const loadLiveRoom = async () => {
  const id = route.query.id as string;
  if (!id) return;
  
  try {
    liveRoom.value = await LiveBroadcastService.get(id);
    if (liveRoom.value) {
      roomName.value = liveRoom.value.live_name;
    }
  } catch (error) {
    console.error('加载直播间数据失败:', error);
  }
};

// 获取图片路径
const getImagePath = (path: string) => {
  if (!path) return '';
  return `file://${path}`;
};

// 处理主播选择
const handleAnchorSelect = (anchor: AnchorRecord) => {
  selectedAnchor.value = anchor;
};

// 组件挂载时加载数据
onMounted(() => {
  loadLiveRoom();
  loadProducts();
  loadAnchors();
});

</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- 顶部导航栏 -->
    <div class="h-[60px] flex items-center justify-between px-4 border-b border-gray-800">
      <div class="flex items-center flex-1">
        <a-button type="text" class="text-gray-400 w-24" @click="router.push('/live')">
          <template #icon>
            <icon-left />
          </template>
          返回主页
        </a-button>
        <div class="mx-4 flex items-center">
          <a-input
            v-model="roomName"
            :readonly="!isEditing"
            class="w-48 bg-transparent"
            :class="{ 'cursor-default': !isEditing }"
          />
          <a-button type="text" class="text-gray-400 ml-2" @click="toggleEdit">
            <template #icon>
              <icon-edit v-if="!isEditing" />
              <icon-check v-else />
            </template>
            {{ isEditing ? '保存' : '编辑' }}
          </a-button>
        </div>
      </div>
      <div class="flex-shrink-0">
        <a-button 
          type="outline" 
          status="success"
          @click="showPlatformDialog = true"
        >
          <template #icon>
            <icon-robot />
          </template>
          AI智能互动设置
        </a-button>
      </div>
    </div>
    
    <div class="flex-1 flex">
      <!-- 左侧产品列表 -->
      <div class="w-60 flex-shrink-0 border-r border-gray-800 flex flex-col">
        <div class="px-4 pt-4 pb-2">
          <div class="text-lg mb-2 font-medium">产品列表</div>
          <div class="flex items-center gap-4">
            <a-checkbox
              :model-value="isAllSelected"
              :disabled="productList.length === 0"
              @change="handleSelectAll"
            >
              全选
            </a-checkbox>
            <a-checkbox
              v-model="isMultiSelect"
              :disabled="productList.length === 0"
              @change="handleMultiSelect"
            >
              多选
            </a-checkbox>
            <a-button 
              size="mini" 
              status="danger"
              :disabled="selectedProducts.length === 0"
              @click="handleDelete"
            >
              <template #icon>
                <icon-delete />
              </template>
              删除
            </a-button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto">
          <template v-if="productList.length === 0">
            <div class="h-full flex items-center justify-center text-gray-500">
              <div class="text-center">
                <div class="mb-4">
                  <icon-box class="text-4xl" />
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div 
              v-for="product in productList" 
              :key="product.id"
              class="px-4 py-2 cursor-pointer text-[14px] hover:bg-[#E5E6EB]"
              :class="{
                'bg-[#E5E6EB]': !isMultiSelect && currentProduct?.id === product.id,
                'bg-blue-50': isMultiSelect && selectedProducts.includes(product.id!)
              }"
              @click="handleSelectProduct(product)"
            >
              {{ product.product_name }}
            </div>
          </template>
        </div>
        <div class="p-4">
          <a-button 
            type="primary" 
            class="w-full mb-2"
            status="primary"
            @click="handleCreateProduct"
          >
            <template #icon>
              <icon-plus />
            </template>
            新建产品
          </a-button>
          <a-button type="primary" class="w-full">
            <template #icon>
              <icon-play />
            </template>
            开始克隆
          </a-button>
        </div>
      </div>

      <!-- 左侧导航栏 -->
      <div class="w-20 flex-shrink-0 border-r border-gray-800">
        <div v-for="tab in tabs" 
             :key="tab.key"
             class="py-4 px-2 cursor-pointer flex flex-col items-center"
             :class="{
               'bg-blue-500/10 text-blue-500': currentTab === tab.key,
               'text-gray-400': currentTab !== tab.key,
               'cursor-not-allowed': !currentProduct
             }"
             @click="handleTabChange(tab.key)"
        >
          <i :class="tab.icon" class="text-xl mb-1"></i>
          <span class="text-xs">{{ tab.key }}</span>
        </div>
      </div>

      <!-- 中间主内容区 -->
      <div class="flex-grow p-4">
        <!-- 主播选择面板 -->
        <div v-if="currentTab === '主播选择'">
          <div class="flex items-center mb-4">
            <div>当前主播 / {{ selectedAnchor?.anchor_name || '未选择' }}</div>
          </div>
          <div class="aspect-video rounded-lg flex items-center justify-center bg-gray-50">
            <template v-if="selectedAnchor">
              <img :src="getImagePath(selectedAnchor.anchor_backgroud)"
                   :alt="selectedAnchor.anchor_name"
                   class="h-full object-contain"
              />
            </template>
            <template v-else>
              <div class="text-gray-500">请选择主播</div>
            </template>
          </div>
          <div class="mt-4 flex justify-center">
            <a-button type="outline">
              保存当前设置
            </a-button>
          </div>
        </div>
        
        <!-- 其他选项卡的内容 -->
        <div v-else-if="currentTab === '产品台词'" class="flex flex-col h-full">
          <!-- 主要内容区域 -->
          <div class="flex flex-grow -mt-4">
            <!-- 左侧台词列表 -->
            <div class="flex-grow pr-4 pt-4">
              <div class="bg-white rounded-lg p-4 mb-4 shadow">
                <!-- 操作按钮和搜索框 -->
                <div class="flex items-center gap-2 mb-4">
                  <a-checkbox>全选</a-checkbox>
                  <a-checkbox>多选</a-checkbox>
                  <a-button size="mini" status="danger">
                    <template #icon>
                      <icon-delete />
                    </template>
                    删除
                  </a-button>
                </div>
                <!-- 搜索框 -->
                <div class="mt-4 mb-4">
                  <a-input-search
                    v-model="scriptSearchText"
                    placeholder="搜索台词内容"
                    allow-clear
                    @search="handleScriptSearch"
                    @clear="handleScriptSearch('')"
                  />
                </div>
                <!-- 台词列表 -->
                <div class="grid grid-cols-2 gap-4">
                  <template v-if="currentProduct?.scripts.length">
                    <div 
                      v-for="script in currentProduct.scripts" 
                      :key="script.id" 
                      class="bg-white rounded-lg p-4 shadow"
                    >
                      <div class="flex items-center justify-between mb-4">
                        <div>{{ script.content }}</div>
                        <div class="flex items-center gap-2">
                          <a-tag>{{ script.type === 'manual' ? '文本' : 'AI' }}</a-tag>
                          <a-button size="mini">
                            <template #icon>
                              <icon-play />
                            </template>
                            试听
                          </a-button>
                        </div>
                      </div>
                      <div class="text-gray-400">
                        AI解析: {{ script.type === 'ai' ? 1 : 0 }}
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="col-span-2 text-center text-gray-400 py-8">
                      暂无台词内容
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <!-- 右侧面板 -->
            <div class="w-96 flex-shrink-0 border-l border-gray-800 pl-4 pt-4 min-h-full">
              <!-- 台词编辑 -->
              <div>
                <div class="mb-2">台词编辑</div>
                <!-- 文本/音频台词编辑选项卡 -->
                <a-tabs>
                  <!-- 文本台词编辑选项卡 -->
                  <a-tab-pane key="text" title="文本台词编辑">
                    <!-- 主播选择 -->
                    <div class="mb-4">
                      <div class="mb-2">当前主播</div>
                      <div class="bg-white rounded-lg p-4 shadow">
                        <div class="flex items-center gap-4">
                          <img src="" alt="" class="w-16 h-16 rounded-lg bg-gray-700" />
                          <div>
                            <div class="mb-1">小范/女/普通话</div>
                            <a-button size="mini" type="outline">
                              更换主播
                            </a-button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 手动/AI撰写选项卡 -->
                    <div class="mb-4">
                      <a-tabs class="w-full">
                        <a-tab-pane key="manual" title="手动撰写">
                          <div class="bg-white rounded-lg p-4 shadow">
                            <a-textarea
                              v-model="manualText"
                              placeholder="在此输入您的台词"
                              :auto-size="{ minRows: 12, maxRows: 16 }"
                              class="w-full"
                              style="min-height: 300px;"
                            />
                            <div class="flex justify-end mt-4">
                              <a-button type="primary" size="small" @click="addToList('manual')">
                                添加到列表
                              </a-button>
                            </div>
                          </div>
                        </a-tab-pane>
                        <a-tab-pane key="ai" title="AI撰写">
                          <div class="bg-white rounded-lg p-4 shadow">
                            <div class="flex items-center gap-2 mb-4">
                              <img src="" alt="" class="w-8 h-8 rounded-full bg-gray-200" />
                              <div class="text-gray-400">AI启动中...</div>
                            </div>
                            <!-- AI生成内容显示区域 -->
                            <div class="bg-[#1D1E2B] rounded-lg p-4 min-h-[200px] mb-4">
                              <div class="text-gray-300">
                                {{ aiGeneratedText || '等待生成内容...' }}
                              </div>
                            </div>
                            <!-- 关键词输入区域 -->
                            <div class="mb-4 flex gap-2">
                              <a-input
                                v-model="aiKeyword"
                                placeholder="请输入关键字"
                                class="flex-grow"
                              />
                              <a-button type="primary" @click="generateAiContent">
                                发送
                              </a-button>
                            </div>
                            <div class="flex justify-end">
                              <a-button 
                                type="primary" 
                                size="small"
                                @click="addToList('ai')"
                                :disabled="!aiGeneratedText"
                              >
                                添加到列表
                              </a-button>
                            </div>
                          </div>
                        </a-tab-pane>
                      </a-tabs>
                    </div>
                  </a-tab-pane>
                  
                  <!-- 音频台词编辑选项卡 -->
                  <a-tab-pane key="audio" title="音频台词编辑">
                    <div class="bg-white rounded-lg p-4 shadow">
                      <!-- 音频编辑相关内容 -->
                      <div class="text-gray-400">
                        音频编辑功能开发中...
                      </div>
                    </div>
                  </a-tab-pane>
                </a-tabs>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="currentTab === '产品问答'" class="flex flex-col h-full">
          <!-- 主要内容区域 -->
          <div class="flex flex-grow -mt-4">
            <!-- 左侧问答列表 -->
            <div class="flex-grow pr-4 pt-4 min-h-full">
              <!-- 标题 -->
              <div class="mb-4">添加关键词问答</div>
              
              <!-- 内容区域 -->
              <div class="bg-white rounded-lg p-4 mb-4 shadow">
                <!-- 操作按钮和搜索框 -->
                <div class="flex items-center gap-2 mb-4">
                  <a-input-search
                    v-model="questionSearchText"
                    placeholder="搜索内容"
                    allow-clear
                    @search="handleQuestionSearch"
                    @clear="handleQuestionSearch('')"
                  />
                  <a-button type="primary" size="small" @click="addNewCategory">
                    新增问题
                  </a-button>
                  <a-button type="primary" size="small">
                    选择问题
                  </a-button>
                </div>
                
                <!-- 问答列表 -->
                <div class="space-y-4">
                  <!-- 问题种类列表 -->
                  <div v-for="category in currentProduct?.questionCategories" 
                       :key="category.id" 
                       class="bg-[#1D1E2B] rounded-lg p-4"
                  >
                    <div class="flex items-center justify-between mb-4">
                      <div class="text-gray-300 font-medium">{{ category.name }}</div>
                      <div class="flex items-center gap-2">
                        <a-button type="text" size="mini" @click="addQA(category.id)">
                          <template #icon>
                            <icon-plus />
                          </template>
                          添加Q&A
                        </a-button>
                        <a-button type="text" size="mini" @click="editCategory(category)">
                          <template #icon>
                            <icon-edit />
                          </template>
                        </a-button>
                        <a-button type="text" size="mini" status="danger" @click="deleteCategory(category.id)">
                          <template #icon>
                            <icon-delete />
                          </template>
                        </a-button>
                      </div>
                    </div>
                    <!-- Q&A列表 -->
                    <div class="space-y-2 pl-4">
                      <div v-for="qa in category.qas" 
                           :key="qa.id" 
                           class="flex flex-col gap-2 py-2">
                        <div class="flex items-center justify-between">
                          <div class="text-gray-400">Q: {{ qa.question }}</div>
                          <div class="flex items-center gap-2">
                            <a-button type="text" size="mini" @click="editQA(category.id, qa)">
                              <template #icon>
                                <icon-edit />
                              </template>
                            </a-button>
                            <a-button type="text" size="mini" status="danger" @click="deleteQA(category.id, qa.id)">
                              <template #icon>
                                <icon-delete />
                              </template>
                            </a-button>
                          </div>
                        </div>
                        <div class="text-gray-500 pl-4">
                          A: {{ qa.answer }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧面板 -->
            <div class="w-96 flex-shrink-0 border-l border-gray-800 p-4 min-h-full">
              <div class="mb-2">回答设置</div>
              <!-- 回答设置选项 -->
              <div class="bg-white rounded-lg p-4 shadow">
                <div class="mb-4">回复源设置</div>
                <div class="mb-4">
                  <a-checkbox>关键词问答</a-checkbox>
                </div>
                <div class="mb-4">
                  回复设置
                  <div class="flex items-center gap-2 mt-2">
                    <a-input-number
                      v-model="replyDelay"
                      :min="0"
                      :max="100"
                      class="w-24"
                    />
                    <span>秒内一次关键词不重复回复</span>
                  </div>
                </div>
                <div class="mb-4">
                  选择回答方式
                  <div class="mt-2">
                    <a-radio-group v-model="replyMode">
                      <a-radio value="1">弹幕</a-radio>
                      <a-radio value="2">弹幕和助播</a-radio>
                      <a-radio value="3">助播</a-radio>
                    </a-radio-group>
                  </div>
                </div>
                <div class="flex justify-end">
                  <a-button type="primary">
                    保存当前设置
                  </a-button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="currentTab === '商品讲解'">
          商品讲解内容
        </div>
      </div>

      <!-- 右侧主播列表 -->
      <div v-if="currentTab === '主播选择'" class="w-72 flex-shrink-0 border-l border-gray-800 p-4">
        <div class="mb-4">
          <a-tabs>
            <a-tab-pane key="1" title="主播广场" />
            <a-tab-pane key="2" title="我的主播" />
          </a-tabs>
        </div>
        <div>
          <a-input-search 
            placeholder="搜索主播" 
            allow-clear
            v-model="searchText"
            @search="handleSearch"
            @clear="handleSearch('')"
          />
        </div>
        
        <!-- 主播列表 -->
        <div class="grid grid-cols-2 min-h-[500px]">
          <div v-for="anchor in currentAnchors" 
               :key="anchor.id" 
               class="flex flex-col cursor-pointer"
               @click="handleAnchorSelect(anchor)">
            <div class="aspect-[3/4] rounded-lg overflow-hidden relative">
              <img :src="getImagePath(anchor.anchor_backgroud)" 
                   :alt="anchor.anchor_name"
                   class="w-full h-full object-cover" 
              />
              <div v-if="selectedAnchor?.id === anchor.id"
                   class="absolute inset-0 ring-4 ring-blue-500 ring-opacity-75">
                <div class="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                  <i class="text-white text-lg icon-check"></i>
                </div>
              </div>
            </div>
            <div class="text-center">
              <div class="text-sm">{{ anchor.anchor_name }}</div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="flex justify-center mt-4">
          <a-pagination
            v-model:current="currentPage"
            :total="filteredAnchors.length"
            :page-size="pageSize"
            size="small"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- 编辑Q&A对话框 -->
  <a-modal
    v-model:visible="showEditQADialog"
    title="编辑问答"
    @ok="saveQA"
    @cancel="showEditQADialog = false"
  >
    <div class="space-y-4">
      <a-input
        v-model="editingQA.question"
        placeholder="请输入问题"
      />
      <a-textarea
        v-model="editingQA.answer"
        placeholder="请输入回答"
        :auto-size="{ minRows: 3, maxRows: 6 }"
      />
    </div>
  </a-modal>

  <!-- 编辑问题种类对话框 -->
  <a-modal
    v-model:visible="showEditCategoryDialog"
    title="编辑问题种类"
    @ok="saveCategory"
    @cancel="showEditCategoryDialog = false"
  >
    <a-input
      v-model="editingCategory.name"
      placeholder="请输入问题种类名称"
    />
  </a-modal>

  <!-- 平台选择对话框 -->
  <PlatformSelector
    v-model:visible="showPlatformDialog"
    @select="handlePlatformSelect"
  />

  <!-- 平台设置对话框 -->
  <PlatformSettings
    v-model:visible="showPlatformSettings"
    :platform="selectedPlatform"
    @back="handleSettingsBack"
    @close="showPlatformSettings = false"
  />

  <!-- 添加创建产品对话框 -->
  <CreateProductDialog 
    ref="createProductDialog"
    @success="handleProductCreated"
  />
</template>

<style scoped>
:deep(.arco-tabs-nav) {
  padding: 0;
}

:deep(.arco-pagination) {
  background-color: transparent;
  color: #fff;
}

:deep(.arco-pagination-item) {
  background-color: transparent;
  color: #86909c;
}

:deep(.arco-pagination-item:hover),
:deep(.arco-pagination-item.arco-pagination-item-active) {
  background-color: #165DFF;
  color: #fff;
}
</style> 