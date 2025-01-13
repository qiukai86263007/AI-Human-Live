<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import PlatformSelector from './PlatformSelector.vue';
import PlatformSettings from './PlatformSettings.vue';
import CreateProductDialog from '../../components/Product/CreateProductDialog.vue';
import LiveBroadcastService, { LiveBroadcastRecord } from '../../service/LiveBroadcastService';
import LiveProductService, { LiveProductRecord } from '../../service/LiveProductService';
import ProductService, { ProductRecord } from '../../service/ProductService';
import AnchorService, { AnchorRecord } from '../../service/AnchorService';
import ProductSceneService, { ProductSceneRecord } from '../../service/ProductSceneService';
import ProductScriptService, {ProductScriptRecord} from '../../service/ProductScriptService';
import QAndAService, { QAndARecord } from '../../service/QAndAService';
import QAndAConfigService, { QAndAConfigRecord } from '../../service/QAndAConfigService';
import GiftThankConfigService from '../../service/GiftThankConfigService';
import RegularInteractionConfigService from '../../service/RegularInteractionConfigService';
import LiveParameterService from '../../service/LiveParameterService';

const router = useRouter();
const route = useRoute();
const emit = defineEmits(['refresh']);
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
const currentProductScene = ref<ProductSceneRecord | null>(null);
const maxTextLength = 500;
const selectedScripts = ref<string[]>([]); // 选中的台词ID列表
const isScriptMultiSelect = ref(false); // 台词多选模式
const selectedScriptId = ref<string>(''); // 当前选中的台词ID
const editingScript = ref<ProductScriptRecord | null>(null);
const showEditScriptDialog = ref(false);
const qaConfig = ref<QAndAConfigRecord | null>(null);

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

// 添加需要的响应式数据
const selectedPlatformDemo = ref('');
const roomIdDemo = ref('');
const anchorNameDemo = ref('');
const rulesDemo = ref({
  productQA: 0,
  giftThanks: 0,
  welcomeGuide: 0,
  popularActivity: true,
  smartScript: true
});
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
  id?: string;
  question: string;
  answer: string;
  _categoryId?: string;
}

interface QuestionCategory {
  id: string;
  name: string;
  qas: QA[];
}

// 新增问题种类
const addNewCategory = async () => {
  if (!currentProduct.value) {
    Message.warning('请先选择产品');
    return;
  }

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
      id: 0,
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
const editQA = (categoryId: string, qa: QA) => {
  if (!currentProduct.value) return;

  const category = currentProduct.value.questionCategories.find(c => c.id === categoryId);
  if (category) {
    editingQA.value = JSON.parse(JSON.stringify(qa));
    editingQA.value._categoryId = categoryId;
    showEditQADialog.value = true;
  }
};

// 删除Q&A
const deleteQA = async (categoryId: string, qaId: string) => {
  if (!currentProduct.value) return;
  try {
    // 获取问题种类数据
    const category = await QAndAService.get(categoryId);
    console.log('category', category);
    if (!category) return;

    // 从 qaId 中解析出索引 (格式为 "categoryId-index")
    const index = parseInt(qaId.split('-').pop() || '');
    console.log('index', index);
    if (isNaN(index)) return;
    console.log('qaId', qaId);
    // 从数组中移除对应索引的问答对
    const like_problems = Array.isArray(category.like_problems)
      ? category.like_problems
      : JSON.parse(category.like_problems as string || '[]');
    const replys = Array.isArray(category.replys)
      ? category.replys
      : JSON.parse(category.replys as string || '[]');
    console.log('like_problems', like_problems);
    console.log('replys', replys);
    like_problems.splice(index, 1);
    replys.splice(index, 1);

    // 更新数据库
    await QAndAService.update(categoryId, {
      like_problems,
      replys,
      updater: 'current_user'
    });

    await loadProductQAs(currentProduct.value.id);
    Message.success('删除成功');
  } catch (error) {
    console.error('删除问答失败:', error);
    Message.error('删除失败');
  }
};

  // 添加计算属性判断是否显示开始直播按钮
  const showStartLiveButton = computed(() => {
    return liveRoom.value?.state === 'created' || liveRoom.value?.state === 'live';
  });

  const isLiveButtonText = computed(() => {
    return liveRoom.value?.state === 'created' ? '开始直播' : '停止直播';
  });

  const canEditAISettings = computed(() => {
    return liveRoom.value?.state === 'created';
  });
// 添加开始直播方法
const handleStartLive = async () => {
  const liveId = route.query.id as string;
  if (!liveId) {
    Message.warning('直播间ID未设置');
    return;
  }

  try {
    const newState = liveRoom.value?.state === 'created' ? 'live' : 'created';
    const actionText = newState === 'live' ? '启动' : '停止';
    
    Message.loading(`正在${actionText}直播...`);
    await LiveBroadcastService.update(liveId, {
      state: newState,
      update_date: new Date().toISOString(),
      updater: 'current_user'
    });

    await loadLiveRoom(); // 重新加载直播间信息
    Message.success(`直播已${actionText}`);
  } catch (error) {
    console.error('启动直播失败:', error);
    Message.error('启动直播失败');
  }
};

// 保存编辑的Q&A
const saveQA = async () => {
  if (!currentProduct.value) return;

  if (!editingQA.value.question.trim() || !editingQA.value.answer.trim()) {
    Message.warning('问题和回答不能为空');
    showEditQADialog.value = false;
    editingQA.value = { id: 0, question: '', answer: '' };
    return;
  }

  try {
    const categoryId = editingQA.value._categoryId;
    if (!categoryId) return;

    const category = await QAndAService.get(categoryId);
    if (!category) return;
    console.log('editingQA.value.id', editingQA.value.id);
    // 如果是编辑现有问答
    if (editingQA.value.id) {

      const index = parseInt(editingQA.value.id.split('-').pop() || '');
      if (!isNaN(index)) {
        const like_problems = Array.isArray(category.like_problems)
          ? category.like_problems
          : JSON.parse(category.like_problems as string || '[]');
        const replys = Array.isArray(category.replys)
          ? category.replys
          : JSON.parse(category.replys as string || '[]');

        // 更新对应索引的问答
        like_problems[index] = editingQA.value.question;
        replys[index] = editingQA.value.answer;

        await QAndAService.update(categoryId, {
          like_problems,
          replys,
          updater: 'current_user'
        });
      }
    } else {
      // 添加新问答
      const like_problems = Array.isArray(category.like_problems)
        ? category.like_problems
        : JSON.parse(category.like_problems as string || '[]');
      const replys = Array.isArray(category.replys)
        ? category.replys
        : JSON.parse(category.replys as string || '[]');

      like_problems.push(editingQA.value.question);
      replys.push(editingQA.value.answer);

      await QAndAService.update(categoryId, {
        like_problems,
        replys,
        updater: 'current_user'
      });
    }

    await loadProductQAs(currentProduct.value.id);

    showEditQADialog.value = false;
    editingQA.value = { id: 0, question: '', answer: '' };
    Message.success('保存成功');
  } catch (error) {
    console.error('保存问答失败:', error);
    Message.error('保存失败');
  }
};

// 保存编辑的问题种类
const saveCategory = async () => {
  if (!currentProduct.value) return;

  if (!editingCategory.value.name.trim()) {
    showEditCategoryDialog.value = false;
    editingCategory.value = { id: 0, name: '', qas: [] };
    return;
  }

  try {
    // 创建新的问题种类
    await QAndAService.createCategory(
      currentProduct.value.id!,
      editingCategory.value.name
    );

    // 重新加载问答列表
    await loadProductQAs(currentProduct.value.id!);

    showEditCategoryDialog.value = false;
    editingCategory.value = { id: 0, name: '', qas: [] };
    Message.success('创建成功');
  } catch (error) {
    console.error('创建问题种类失败:', error);
    Message.error('创建失败');
  }
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

interface ProductExtend extends ProductRecord {
  live_id?: string;
  product_id?: string;
  ording?: number;
  currentTab?: string;
  scripts: Script[];
  questionCategories: QuestionCategory[];
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
const handleSelectProduct = async (product: ProductRecord) => {
  if (isMultiSelect.value) {
    // 多选模式：切换选中状态
    const index = selectedProducts.value.indexOf(product.id!);
    if (index > -1) {
      selectedProducts.value.splice(index, 1);
    } else {
      selectedProducts.value.push(product.id!);
    }
    return;
  }

  // 重置主播选择
  selectedAnchor.value = null;
  currentProductScene.value = null;

  currentProduct.value = {
    ...product,
    live_id: route.query.id as string,
    product_id: product.id!,
    ording: 0,
    scripts: [],
    questionCategories: [],
    currentTab: currentTab.value
  } as ProductExtend;

  currentTab.value = '主播选择';
  selectedProducts.value = [product.id!];

  // 加载该产品关联的主播场景
  await loadProductScene(product.id!);

  // 加载产品关联的脚本列表
  await loadProductScripts(product.id!);
};

// 加载产品场景
const loadProductScene = async (productId: string) => {
  if (!productId) return;
  try {
    const scenes = await ProductSceneService.listByProductId(productId);
    if (scenes.length > 0) {
      currentProductScene.value = scenes[0];
      // 如果存在场景，自动选中对应的主播
      const anchor = await AnchorService.get(scenes[0].anchor_id);
      if (anchor) {
        selectedAnchor.value = anchor;
      }
    }
  } catch (error) {
    console.error('加载产品场景失败:', error);
  }
};

// 保存当前设置
const saveCurrentSettings = async () => {
  if (!currentProduct.value?.id || !selectedAnchor.value) {
    Message.warning('请先选择产品和主播');
    return;
  }

  try {
    if (currentProductScene.value) {
      // 更新现有场景
      await ProductSceneService.update(currentProductScene.value.id!, {
        anchor_id: selectedAnchor.value.id,
        anchor_url: selectedAnchor.value.anchor_backgroud,
        scene_name: selectedAnchor.value.anchor_name,
        updater: 'system'
      });
    } else {
      // 创建新场景
      await ProductSceneService.create({
        scene_name: selectedAnchor.value.anchor_name,
        anchor_url: selectedAnchor.value.anchor_backgroud,
        anchor_id: selectedAnchor.value.id,
        product_id: currentProduct.value.id,
        ording: 1,
        gender: 'unknown',
        anchor_video_url: '',
        creator: 'system',
        updater: 'system'
      });
    }
    Message.success('保存成功');
    await loadProductScene(currentProduct.value.id);
  } catch (error) {
    Message.error('保存失败');
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

// 计算剩余可输入字符数
const remainingChars = computed(() => {
  return maxTextLength - manualText.value.length;
});

// 添加台词到列表
const addScript = async () => {
  if (!currentProduct.value?.id) {
    Message.warning('请先选择产品');
    return;
  }

  if (!manualText.value.trim()) {
    Message.warning('请输入台词内容');
    return;
  }

  try {
    await ProductScriptService.create({
      script_type_id: 'manual',
      product_id: currentProduct.value.id,
      text_content: manualText.value,
      audio_content: '',
      gender: 0,
      audio_url: '',
      script_index: currentProduct.value.scripts.length,
      video_duration: '',
      pay_url: '',
      creator: 'system',
      updater: 'system'
    });

    await loadProductScripts(currentProduct.value.id);
    manualText.value = '';
    Message.success('添加成功');
  } catch (error) {
    console.error('添加台词失败:', error);
    Message.error('添加失败');
  }
};

// 加载产品脚本列表
const loadProductScripts = async (productId: string) => {
  try {
    const scripts = await ProductScriptService.listByProductId(productId);
    if (currentProduct.value) {
      currentProduct.value.scripts = scripts;
    }
  } catch (error) {
    console.error('加载脚本列表失败:', error);
  }
};

// 是否全选台词
const isAllScriptsSelected = computed(() => {
  return filteredScripts.value.length > 0 &&
         selectedScripts.value.length === filteredScripts.value.length;
});

// 处理台词多选切换
const handleScriptMultiSelect = (checked: boolean) => {
  isScriptMultiSelect.value = checked;
  if (!checked) {
    selectedScripts.value = [];
  }
};

// 处理台词选择
const handleScriptSelect = (script: ProductScriptRecord) => {
  selectedScriptId.value = selectedScriptId.value === script.id ? '' : script.id!;
};

// 删除选中的台词
const handleDeleteScript = async () => {
  if (!selectedScriptId.value) {
    Message.warning('请先选择要删除的台词');
    return;
  }

  try {
    await ProductScriptService.delete(selectedScriptId.value);
    if (currentProduct.value) {
      await loadProductScripts(currentProduct.value.id!);
    }
    selectedScriptId.value = ''; // 清空选中
    Message.success('删除成功');
  } catch (error) {
    console.error('删除台词失败:', error);
    Message.error('删除失败');
  }
};

// 处理台词搜索
const handleScriptSearch = (value: string) => {
  scriptSearchText.value = value;
};

// 处理台词全选
const handleSelectAllScripts = (checked: boolean) => {
  if (checked) {
    selectedScripts.value = filteredScripts.value.map(script => script.id!);
  } else {
    selectedScripts.value = [];
  }
};

// 过滤后的台词列表
const filteredScripts = computed(() => {
  if (!currentProduct.value?.scripts) return [];
  if (!scriptSearchText.value) return currentProduct.value.scripts;
  return currentProduct.value.scripts.filter(script =>
    script.text_content.toLowerCase().includes(scriptSearchText.value.toLowerCase())
  );
});
// 处理台词编辑
const handleEditScript = async (script: ProductScriptRecord, event: Event) => {
  event.stopPropagation();
  const fullScript = await ProductScriptService.get(script.id!);
  if (fullScript) {
    editingScript.value = fullScript;
    showEditScriptDialog.value = true;
  } else {
    Message.error('获取台词数据失败');
  }
};

const handleCancelEdit = () => {
  editingScript.value = null;
  showEditScriptDialog.value = false;
};

const handleSaveScript = async () => {
  if (!editingScript.value?.id) return;
  try {
    await ProductScriptService.update(editingScript.value.id, {
      text_content: editingScript.value.text_content,
      script_type_id: editingScript.value.script_type_id,
      updater: 'current_user'
    });
    if (currentProduct.value) {
      await loadProductScripts(currentProduct.value.id!);
    }
    handleCancelEdit();
    Message.success('保存成功');
  } catch (error) {
    console.error('保存台词失败:', error);
    Message.error('保存失败');
  }
};

// 加载产品的问答列表
const loadProductQAs = async (productId: string) => {
  try {
    const qas = await QAndAService.listByProduct(productId);
    if (currentProduct.value) {
      // 将数据库记录转换为界面所需的格式
      currentProduct.value.questionCategories = qas.map(qa => ({
        id: qa.id!,
        name: qa.problem!,
        qas: qa.like_problems!.map((q, index) => ({
          id: `${qa.id}-${index}`,
          question: q,
          answer: qa.replys![index] || '',
          _categoryId: qa.id
        }))
      }));
    }
  } catch (error) {
    console.error('加载问答列表失败:', error);
    Message.error('加载问答失败');
  }
};

// 在产品切换时加载问答列表
watch(() => currentProduct.value?.id, async (newId) => {
  if (newId) {
    await loadProductQAs(newId);
  }
});

// 加载问答配置
const loadQAConfig = async () => {
  if (!liveRoom.value?.id) return;

  try {
    const config = await QAndAConfigService.getByLiveId(liveRoom.value.id);
    if (config) {
      qaConfig.value = config;
      // 同步配置到界面
      replyDelay.value = config.appoint_within_do_not_reply || 60;
      replyMode.value = String(config.reply_way || 1);
    } else {
      // 创建新配置
      const id = await QAndAConfigService.create({
        live_id: liveRoom.value.id,
        enable: 1,
        reply_way: 1,
        appoint_within_do_not_reply: 60,
        creator: 'system'
      });
      qaConfig.value = await QAndAConfigService.get(id);
    }
  } catch (error) {
    console.error('加载问答配置失败:', error);
    Message.error('加载配置失败');
  }
};

// 监听配置变化并保存
watch(replyDelay, async (newValue) => {
  if (qaConfig.value?.id) {
    try {
      await QAndAConfigService.update(qaConfig.value.id, {
        appoint_within_do_not_reply: newValue,
        updater: 'system'
      });
    } catch (error) {
      console.error('更新回复延迟失败:', error);
    }
  }
});

watch(replyMode, async (newValue) => {
  if (qaConfig.value?.id) {
    try {
      await QAndAConfigService.update(qaConfig.value.id, {
        reply_way: parseInt(newValue),
        updater: 'system'
      });
    } catch (error) {
      console.error('更新回复方式失败:', error);
    }
  }
});

// 在直播间加载时加载配置
watch(() => liveRoom.value?.id, async (newId) => {
  if (newId) {
    await loadQAConfig();
  }
});

// 加载规则设置
const loadRuleSettings = async () => {
  const liveId = route.query.id as string;
  if (!liveId) return;
  
  try {
    // 加载产品问答配置
    const qaConfig = await QAndAConfigService.getByLiveId(liveId);
    rulesDemo.value.productQA = qaConfig?.enable ?? 0;
    // 加载礼物感谢配置
    const giftConfig = await GiftThankConfigService.getByLiveId(liveId);
    rulesDemo.value.giftThanks = giftConfig?.enable ?? 0;
    // 加载定时引导配置
    const regularConfig = await RegularInteractionConfigService.getByLiveId(liveId);
    rulesDemo.value.welcomeGuide = regularConfig?.enable ?? 0;
  } catch (error) {
    console.error('加载规则设置失败:', error);
  }
};

// 监听规则设置变化
watch(() => rulesDemo.value.productQA, async (newValue) => {
  const liveId = route.query.id as string;
  if (!liveId) return;
  
  try {
    const config = await QAndAConfigService.getByLiveId(liveId);
    if (config?.id) {
      await QAndAConfigService.update(config.id, { enable: newValue });
    }
  } catch (error) {
    console.error('更新产品问答配置失败:', error);
  }
});

watch(() => rulesDemo.value.giftThanks, async (newValue) => {
  const liveId = route.query.id as string;
  if (!liveId) return;
  
  try {
    const config = await GiftThankConfigService.getByLiveId(liveId);
    if (config?.id) {
      await GiftThankConfigService.update(config.id, { enable: newValue });
    }
  } catch (error) {
    console.error('更新礼物感谢配置失败:', error);
  }
});

watch(() => rulesDemo.value.welcomeGuide, async (newValue) => {
  const liveId = route.query.id as string;
  if (!liveId) return;
  
  try {
    const config = await RegularInteractionConfigService.getByLiveId(liveId);
    if (config?.id) {
      await RegularInteractionConfigService.update(config.id, { enable: newValue });
    }
  } catch (error) {
    console.error('更新定时引导配置失败:', error);
  }
});

// 监听直播平台、房间ID和主播名称的变化
watch([selectedPlatformDemo, roomIdDemo, anchorNameDemo], async () => {
  const liveId = route.query.id as string;
  if (!liveId) return;
  
  try {
    // 获取现有配置
    let config = await LiveParameterService.getByLiveId(liveId);
    
    const updateData = {
      platform: selectedPlatformDemo.value,
      live_room_id: roomIdDemo.value,
      anchor_name: anchorNameDemo.value,
      updater: 'current_user'
    };
    
    if (config) {
      // 更新现有配置
      await LiveParameterService.update(config.id!, updateData);
    } else {
      // 创建新配置
      await LiveParameterService.create({
        live_id: liveId,
        ...updateData,
        creator: 'current_user'
      });
    }
  } catch (error) {
    console.error('更新直播参数失败:', error);
    Message.error('更新配置失败');
  }
});

// 加载直播参数
const loadLiveParameter = async () => {
  const liveId = route.query.id as string;
  if (!liveId) return;
  
  try {
    const config = await LiveParameterService.getByLiveId(liveId);
    if (config) {
      selectedPlatformDemo.value = config.platform || '';
      roomIdDemo.value = config.live_room_id || '';
      anchorNameDemo.value = config.anchor_name || '';
    }
  } catch (error) {
    console.error('加载直播参数失败:', error);
  }
};

// 在组件挂载时加载数据
onMounted(() => {
  loadLiveRoom();
  loadProducts();
  loadAnchors();
  loadRuleSettings();
  loadLiveParameter();
});

// 打开平台设置
const handleOpenSettings = () => {
  if (!liveRoom.value?.id) {
    Message.warning('请先创建直播间');
    return;
  }
  showPlatformSettings.value = true;
};

// 开始克隆
const handleStartClone = async () => {
  const liveId = route.query.id as string;
  if (!liveId) {
    Message.warning('直播间ID未设置');
    return;
  }

  try {
    Message.loading('正在上传素材并克隆中...');

    // 调用克隆接口
    await LiveBroadcastService.update(liveId, {
      state: 'created',
      update_date: new Date().toISOString(),
      updater: 'current_user'
    });
    Message.success('克隆成功');
    // 通知父组件刷新列表
    emit('refresh');
  } catch (error) {
    console.error('克隆失败:', error);
    Message.error('克隆失败');
  }
};

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
          <a-button type="primary" class="w-full" @click="handleStartClone">
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
        <div v-if="currentTab === '主播选择'" class="flex flex-col h-full">
          <div class="flex items-center mb-4">
            <div>当前主播 / {{ selectedAnchor?.anchor_name || '未选择' }}</div>
          </div>
          <!-- 修改图片容器和图片的样式 -->
          <div class="w-[600px] mx-auto">
            <div class="aspect-video rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
              <template v-if="selectedAnchor">
                <img :src="getImagePath(selectedAnchor.anchor_backgroud)"
                    :alt="selectedAnchor.anchor_name"
                    class="w-full h-full object-contain" 
                />
              </template>
              <template v-else>
                <div class="text-gray-500">请选择主播</div>
              </template>
            </div>
          </div>
          <div class="mt-4 flex justify-center">
            <a-button
              type="outline"
              :disabled="!currentProduct || !selectedAnchor"
              @click="saveCurrentSettings"
            >
              保存当前设置
            </a-button>
          </div>
          <div class="mt-4 flex justify-center">
              <a-button
                  v-if="showStartLiveButton"
                  type="primary"
                  :status="liveRoom?.state === 'created' ? 'success' : 'danger'"
                  :disabled="!currentProduct || !selectedAnchor"
                  @click="handleStartLive"
                >
                  {{ isLiveButtonText }}
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
                  <a-checkbox
                    :model-value="isAllScriptsSelected"
                    :disabled="!currentProduct?.scripts.length"
                    @change="handleSelectAllScripts"
                  >
                    全选
                  </a-checkbox>
                  <a-checkbox
                    v-model="isScriptMultiSelect"
                    :disabled="!currentProduct?.scripts.length"
                    @change="handleScriptMultiSelect"
                  >
                    多选
                  </a-checkbox>
                  <a-button
                    size="mini"
                    status="danger"
                    :disabled="!selectedScriptId"
                    @click="handleDeleteScript"
                  >
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
                  <template v-if="filteredScripts.length">
                    <div
                      v-for="script in filteredScripts"
                      :key="script.id"
                      class="bg-white rounded-lg p-4 shadow cursor-pointer h-[120px] flex flex-col"
                      :class="{'ring-2 ring-blue-500': selectedScriptId === script.id}"
                      @click="handleScriptSelect(script)"
                    >
                      <div class="flex items-center justify-between mb-4">
                        <div class="flex-1 truncate" :title="script.text_content">
                          {{ script.text_content.length > 20
                             ? script.text_content.slice(0, 20) + '...'
                             : script.text_content }}
                        </div>
                        <div class="flex items-center gap-2 ml-2 flex-shrink-0">
                          <a-tag>{{ script.script_type_id === 'manual' ? '文本' : 'AI' }}</a-tag>
                          <a-button
                            size="mini"
                            @click="(e) => handleEditScript(script, e)"
                          >
                            <template #icon>
                              <icon-edit />
                            </template>
                          </a-button>
                          <a-button size="mini">
                            <template #icon>
                              <icon-play />
                            </template>
                            试听
                          </a-button>
                        </div>
                      </div>
                      <div class="text-gray-400 mt-auto">
                        AI解析: {{ script.script_type_id === 'ai' ? 1 : 0 }}
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="col-span-2 text-center text-gray-400 py-8">
                      {{ currentProduct?.scripts.length ? '未找到匹配的台词' : '暂无台词内容' }}
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
                              :maxLength="maxTextLength"
                              :showWordLimit="true"
                              class="w-full"
                              style="min-height: 300px;"
                            />
                            <div class="mt-2 flex justify-between text-gray-400 text-sm">
                              <span>剩余可输入字符数: {{ remainingChars }}</span>
                              <a-button
                                type="primary"
                                size="small"
                                :disabled="!manualText.trim() || !currentProduct"
                                @click="addScript"
                              >
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
                  <a-checkbox
                    :model-value="true"
                    :disabled="true"
                  >
                    关键词问答
                  </a-checkbox>
                </div>
                <div class="mb-4">
                  回复设置
                  <div class="flex items-center gap-4">
                    <span class="w-20">回复设置:</span>
                    <a-input-number
                      v-model="replyDelay"
                      :min="0"
                      :max="3600"
                      class="w-32"
                    />
                    <span>秒内不重复回复相同问题</span>
                  </div>
                </div>
                <div class="mb-4">
                  回答方式
                  <div class="mt-2">
                    <a-radio-group v-model="replyMode">
                      <a-radio value="0">弹幕</a-radio>
                      <a-radio value="1">弹幕和助播</a-radio>
                      <a-radio value="2">助播</a-radio>
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
      <div v-if="currentTab === '主播选择'" class="w-96 flex-shrink-0 border-l border-gray-800 pl-4 pt-4 min-h-full">
        <template v-if="!showStartLiveButton">
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
        </template>
        <template v-else>
          <div class="h-full">
            <div class="text-lg font-medium mb-4">
              AI智能互动
            </div>
            <!-- AI智能互动设置表单 -->
            <div>
              <!-- 直播平台选择 -->
              <div class="mb-4">
                <div class="flex items-center gap-4 mb-2">
                  <span class="w-20">直播平台</span>
                  <a-select class="flex-1" v-model="selectedPlatformDemo" :disabled="!canEditAISettings">
                    <!-- <template #prefix>
                      <img src="`/platform-icons/${selectedPlatform}.png`" class="w-5 h-5 rounded-full" />
                    </template> -->
                    <a-option value="快手">快手</a-option>
                    <a-option value="抖音">抖音</a-option>
                    <a-option value="视频号">视频号</a-option>
                    <a-option value="Tiktok">TikTok</a-option>
                    <a-option value="美团">美团</a-option>
                    <a-option value="淘宝">淘宝</a-option>
                  </a-select>
                </div>
              </div>

              <!-- 房间信息 -->
              <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="flex items-center gap-4">
                  <span class="w-20">房间号ID</span>
                  <a-input class="flex-1" v-model="roomIdDemo" :disabled="!canEditAISettings" />
                </div>
                <div class="flex items-center gap-4">
                  <span class="w-20">主播名称</span>
                  <a-input class="flex-1" v-model="anchorNameDemo" :disabled="!canEditAISettings"/>
                </div>
              </div>

              <!-- 规则设置 -->
              <div class="mb-6">
                <div class="text-base mb-4">规则设置</div>
                <div class="grid grid-cols-2 gap-4">
                  <a-checkbox v-model="rulesDemo.productQA" :disabled="!canEditAISettings">产品问答</a-checkbox>
                  <a-checkbox v-model="rulesDemo.giftThanks" :disabled="!canEditAISettings">礼物感谢</a-checkbox>
                  <a-checkbox v-model="rulesDemo.welcomeGuide" :disabled="!canEditAISettings">定时引导</a-checkbox>
                  <a-checkbox v-model="rulesDemo.popularActivity" :disabled="!canEditAISettings">人气互动</a-checkbox>
                </div>
                <div class="mt-2">
                  <a-checkbox v-model="rulesDemo.smartScript" :disabled="!canEditAISettings">
                    智能剧本(该话术和剧本随机选取一个播放)
                  </a-checkbox>
                </div>
              </div>
            </div>
            <!-- 直播间公屏 -->
            <div>
              <div class="mb-6">
                <div class="text-base mb-4">直播间公屏</div>
                <div class="h-60 bg-[#2A2B3C] rounded flex items-center justify-center">
                  <div class="text-center text-gray-400">
                    <div class="mb-2">
                      <icon-monitor class="text-3xl" />
                    </div>
                    <div>暂无公屏信息</div>
                  </div>
                </div>
              </div>

              <!-- 底部按钮 -->
              <div class="flex gap-4 justify-center">
                <a-button class="w-32" :disabled="canEditAISettings">
                  <template #icon>
                    <icon-voice />
                  </template>
                  语音设置
                </a-button>
                <a-button class="w-32" :disabled="canEditAISettings">
                  <template #icon>
                    <icon-file />
                  </template>
                  文本设置
                </a-button>
              </div>
            </div>
          </div>
        </template>
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
    :live-id="liveRoom?.id"
    @back="handleSettingsBack"
    @close="showPlatformSettings = false"
  />

  <!-- 添加创建产品对话框 -->
  <CreateProductDialog
    ref="createProductDialog"
    @success="handleProductCreated"
  />

 <!-- 编辑台词对话框 -->
 <a-modal
    v-model:visible="showEditScriptDialog"
    title="编辑台词"
    :width="600"
    @cancel="handleCancelEdit"
  >
    <div v-if="editingScript" style="padding: 16px;">
      <a-form-item label="台词内容">
        <a-textarea
          v-model="editingScript.text_content"
          placeholder="请输入台词内容"
          :auto-size="{ minRows: 3, maxRows: 5 }"
          :max-length="500"
          show-word-limit
          allow-clear
        />
      </a-form-item>
      <a-form-item label="台词类型">
        <a-tag>{{ editingScript.script_type_id === 'manual' ? '文本' : 'AI' }}</a-tag>
      </a-form-item>
    </div>
    <template #footer>
      <a-button @click="handleCancelEdit">取消</a-button>
      <a-button type="primary" @click="handleSaveScript">保存</a-button>
    </template>
  </a-modal>
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

:deep(.arco-select) {
  background-color: transparent;
  border: none;
}

:deep(.arco-input) {
  background-color: transparent;
  border: none;
}

:deep(.arco-checkbox) {
  color: white;
}
</style>
