<template>
  <!-- 手动输入表单 -->
  <n-form ref="importFormRef" :model="importForm" :rules="importRules" :label-placement="'top'" :size="'large'"
    :show-label="true">
    <n-form-item :label="'游戏角色名称'" :path="'name'" :show-label="true">
      <n-input v-model:value="importForm.name" placeholder="例如：主号战士" clearable />
    </n-form-item>

    <n-form-item :label="'bin文件'" :path="'base64Token'" :show-label="true">
      <a-upload multiple accept="*.bin,*.dmp" @before-upload="uploadBin" draggable dropzone placeholder="粘贴Token字符串..."
        clearable>
        <!-- <div class="dropzone-content">
          请点击上传或将bind文件拖拽到此处
        </div> -->
      </a-upload>
    </n-form-item>
    <a-list>
      <a-list-item v-for="(role, index) in roleList" :key="index">
        <div>
          <strong>角色名称:</strong> {{ role.name || '未命名角色' }}<br />
          <strong>服务器:</strong> {{ role.server || '未指定' }}<br />
          <strong>Token:</strong> <span style="word-break: break-all;">{{ role.base64Token }}</span>
        </div>
      </a-list-item>
    </a-list>

    <!-- 角色详情 -->
    <n-collapse>
      <n-collapse-item title="角色详情 (可选)" name="optional">
        <div class="optional-fields">
          <n-form-item label="服务器">
            <n-input v-model:value="importForm.server" placeholder="服务器名称" />
          </n-form-item>

          <n-form-item label="自定义连接地址">
            <n-input v-model:value="importForm.wsUrl" placeholder="留空使用默认连接" />
          </n-form-item>
        </div>
      </n-collapse-item>
    </n-collapse>


    <div class="form-actions">
      <n-button type="primary" size="large" block :loading="isImporting" @click="handleImport">
        <template #icon>
          <n-icon>
            <CloudUpload />
          </n-icon>
        </template>
        添加Token
      </n-button>

      <n-button v-if="tokenStore.hasTokens" size="large" block @click="cancel">
        取消
      </n-button>
    </div>
  </n-form>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { useTokenStore } from '@/stores/tokenStore';
import { CloudUpload } from '@vicons/ionicons5';

import { NForm, NFormItem, NInput, NButton, NIcon, NCollapse, NCollapseItem, useMessage } from 'naive-ui';
import axios from 'axios';
import { g_utils } from '../../utils/bonProtocol';
import PQueue from 'p-queue';
// import { useI18n } from 'vue-i18n';

const $emit = defineEmits(['cancel', 'ok']);

const cancel = () => {
  $emit('cancel');
};

const tokenStore = useTokenStore();
const message = useMessage();
const importFormRef = ref();
const isImporting = ref(false);
const importForm = reactive({
  name: '',
  base64Token: '',
  server: '',
  wsUrl: ''
});
const roleList = ref<Array<{ name: string; base64Token: string; server: string; wsUrl: string }>>([]);

const importRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '名称长度应在2到20个字符之间', trigger: 'blur' }
  ],
  base64Token: [
    { required: true, message: '请粘贴Token字符串', trigger: 'blur' },
    { min: 50, message: 'Token字符串长度过短', trigger: 'blur' }
  ]
};

const tQueue = new PQueue({ concurrency: 1, interval: 1000, });

const transformToken = async (arrayBuffer: ArrayBuffer) => {
  // 如果是data URL格式，提取base64部分
  const res = await axios.post('https://xxz-xyzw.hortorgames.com/login/authuser', arrayBuffer, {
    params: {
      _seq: 1,
    },
    headers: {
      'Content-Type': 'application/octet-stream',
      "referrerPolicy": "no-referrer",
    },
    responseType: 'arraybuffer'
  })
  console.log('转换Token:', typeof res.data);

  const msg = g_utils.parse(res.data);
  console.log('解析结果:', msg);


  const data = msg.getData();
  console.log('数据内容:', data);

  const currentTime = Date.now();
  const sessId = currentTime * 100 + Math.floor(Math.random() * 100);
  const connId = currentTime + Math.floor(Math.random() * 10);

  return JSON.stringify({
    ...data,
    sessId,
    connId,
    isRestore: 0
  });
};

const initName = (fileName: string) => {
  if (!fileName) return;
  fileName = fileName.trim();
  let binRes = fileName.match(/^bin-(.*?)服-([0-2])-([0-9]{6,12})-(.*)\.bin$/);
  console.log(binRes)
  if (binRes) {
    importForm.name = `${binRes[1]}_${binRes[2]}_${binRes[4]}`
    return {
      server: binRes[1],
      roleIndex: binRes[2],
      roleId: binRes[3],
      roleName: binRes[4]
    };
  }
  return {}
}

const uploadBin = (binFile: File) => {
  tQueue.add(async () => {
    console.log('上传文件数据:', binFile);
    const roleMeta = initName(binFile.name) as any;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const userToken = e.target?.result as ArrayBuffer;
      const roleToken = await transformToken(userToken);
      message.success('Token读取成功，请检查角色名称等信息后提交');

      roleList.value.push({
        name: roleMeta.roleName || '',
        token: roleToken,
        server: roleMeta.server + '-' + roleMeta.roleIndex || '',
        wsUrl: importForm.wsUrl || ''
      });
    };
    reader.onerror = () => {
      message.error('读取文件失败，请重试');
    };
    reader.readAsArrayBuffer(binFile);
  });
  return false; // 阻止自动上传
};

const handleImport = async () => {
  roleList.value.forEach(role => {
    tokenStore.addToken({
      ...role
    });
  });
  console.log('当前Token列表:', tokenStore.tokens);
  message.success('Token添加成功');
  roleList.value = [];
  $emit('ok');
};
</script>

<style scoped lang="scss">
.optional-fields {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;

  n-form-item {
    flex: 1;
    min-width: 200px;
  }
}

.form-actions {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dropzone-content {
  width: 100%;
  border: 1px dashed #fcc;
  border-radius: 8px;
  text-align: center;
  color: #888;
  padding: 40px 20px;
  font-size: 12px;
}
</style>