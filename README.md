# XYZW Web Helper

<div align="center">

![XYZW Logo](public/xiaoyugan.png)

**🎮 咸鱼自动化web平台**

[![Vue 3](https://img.shields.io/badge/Vue-3.4+-4FC08D?style=flat&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Naive UI](https://img.shields.io/badge/Naive%20UI-2.38+-18A058?style=flat&logo=vue.js&logoColor=white)](https://www.naiveui.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-BON%20Protocol-FF6B6B?style=flat&logo=websocket&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![License](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg?style=flat)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

基于Vue 3 + Vite的现代化XYZW游戏辅助工具，支持Token管理、WebSocket通信、游戏自动化等功能。

</div>

---

## ✨ 核心特性

### 🔐 Token管理系统
- **双重导入方式**：支持手动输入和URL接口获取两种Token导入方式
- **Base64解码支持**：自动识别和解析多种Base64格式的游戏Token
- **多角色管理**：同时管理多个游戏账号，支持角色信息展示
- **本地存储**：安全的本地数据存储，无需后端服务器
- **Token验证**：自动验证Token有效性和格式完整性
- **自动刷新**：支持URL获取的Token自动刷新功能

### 🌐 WebSocket通信
- **BON协议支持**：内置Binary Object Notation协议编解码
- **多重加密**：支持LX、X、XTM等多种加密方式
- **自动重连**：智能断线重连机制，确保连接稳定
- **消息队列**：内置消息队列系统，支持批量发送和响应处理

### 🎮 游戏功能
- **日常任务管理**：自动化日常任务执行和奖励领取
- **角色状态监控**：实时显示角色等级、职业、服务器等信息
- **团队管理**：队伍状态查看和管理功能
- **爬塔进度**：爬塔状态追踪和数据分析

### 🛠️ 开发工具
- **消息测试器**：BON协议消息编码/解码测试工具
- **WebSocket调试**：实时WebSocket连接和消息调试
- **协议验证**：游戏协议消息格式验证工具

---

## 🏗️ 技术架构

### 前端技术栈
```
Vue 3.4+          # 渐进式JavaScript框架
├── Composition API    # Vue 3组合式API
├── <script setup>     # 单文件组件语法糖
└── Reactive System    # 响应式数据系统

Vite 5.0+         # 现代化构建工具
├── HMR               # 热模块替换
├── ES6+             # 现代JavaScript支持
└── SCSS             # CSS预处理器

Naive UI 2.38+    # Vue 3组件库
├── Theme System     # 主题系统
├── Icon Library     # 图标库
└── Responsive      # 响应式设计

Pinia 2.1+        # 状态管理
├── Store Pattern    # 存储模式
├── DevTools        # 开发工具
└── Composition API  # 组合式API支持
```

### 核心架构设计

```
src/
├── 🎯 stores/              # Pinia状态管理
│   ├── tokenStore.js      # Token管理核心
│   ├── gameRoles.js       # 游戏角色数据
│   └── localTokenManager.js # 本地存储管理
│
├── 🌐 utils/               # 核心工具库
│   ├── bonProtocol.js     # BON协议实现
│   ├── xyzwWebSocket.js   # WebSocket客户端
│   ├── gameCommands.js    # 游戏命令封装
│   └── wsAgent.js         # 连接代理
│
├── 📱 views/               # 主要页面
│   ├── TokenImport.vue    # Token导入管理
│   ├── Dashboard.vue      # 主控制台
│   ├── DailyTasks.vue     # 日常任务
│   ├── GameFeatures.vue   # 游戏功能
│   └── Profile.vue        # 用户设置
│
└── 🧩 components/         # 可复用组件
    ├── TokenManager.vue   # Token管理器
    ├── GameStatus.vue     # 游戏状态组件
    ├── DailyTaskCard.vue  # 任务卡片
    ├── MessageTester.vue  # 消息测试器
    └── WebSocketTester.vue # WebSocket调试器
```

---

## 🚀 快速开始

### 环境要求

```bash
Node.js >= 16.0.0
npm >= 7.0.0
```

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/your-repo/xyzw-web-helper.git
cd xyzw-web-helper

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 开发命令

```bash
npm run dev      # 启动开发服务器 (端口3000)
npm run build    # 构建生产版本
npm run preview  # 预览生产构建
npm run lint     # 代码检查和修复
npm run format   # 代码格式化
```

---

## 📖 使用指南

### 1. Token导入与管理

#### 支持的导入方式

##### 方式一：手动输入
支持多种Base64格式的Token字符串：

```javascript
// 纯Base64格式
"eyJ0b2tlbiI6ImFiY2QxMjM0In0="

// 带前缀格式
"token:eyJ0b2tlbiI6ImFiY2QxMjM0In0="
```

##### 方式二：URL接口获取
通过API接口自动获取Token，支持定时刷新：

```javascript
// API接口返回格式
{
  "token": "eyJ0b2tlbiI6ImFiY2QxMjM0In0=",  // 必需字段
  "server": "风云服"                        // 可选字段
}
```

#### 导入步骤
1. 进入 **Token管理** 页面
2. 选择导入方式：
   - **手动输入**：粘贴Base64编码的Token字符串
   - **URL获取**：输入Token获取接口地址
3. 系统自动解析和验证Token格式
4. 设置角色名称和基本信息
5. 保存到本地存储

#### Token刷新功能
- 通过URL方式导入的Token支持一键刷新
- 刷新时会重新请求原API接口获取最新Token
- 自动重新建立WebSocket连接
- 保持角色信息和配置不变

### 2. WebSocket连接配置

纯本地连接存储，不用担心封号及账号泄漏风险

### 3. BON协议消息处理

```javascript
import { bon, GameMessages } from '@/utils/bonProtocol.js';

// 编码消息
const message = GameMessages.getRoleInfo(0, 12345);
const encoded = bon.encode(message.body);

// 解码消息
const decoded = bon.decode(receivedData);
```

### 4. 游戏功能使用

#### 日常任务自动化
- 自动签到奖励领取
- 日常任务完成状态检查
- 奖励自动领取
- 任务进度实时追踪

#### 角色状态监控
- 实时等级和经验显示
- 职业和技能信息
- 服务器状态监控
- 在线时长统计

---

## 🔧 配置说明

### Vite配置 (vite.config.js)

```javascript
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@stores': path.resolve(__dirname, 'src/stores')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://xyzw.my',
        changeOrigin: true
      }
    }
  }
});
```

### 环境变量

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=wss://game.xyzw.my/ws

# .env.production
VITE_API_BASE_URL=https://api.xyzw.my
VITE_WS_URL=wss://game.xyzw.my/ws
```

---

## 🧪 测试与调试

### 内置测试工具

#### 1. 消息测试器 (MessageTester.vue)
- BON协议编码/解码测试
- 消息格式验证
- 加密/解密功能测试

#### 2. WebSocket调试器 (WebSocketTester.vue)
- 实时连接状态监控
- 消息发送和接收测试
- 连接参数配置

#### 3. 协议验证工具
```javascript
// 测试BON编码
const testData = { cmd: "test", data: { id: 123 } };
const encoded = bon.encode(testData);
const decoded = bon.decode(encoded);
console.log('编码测试:', decoded);

// 测试加密
const encrypted = getEnc('x').encrypt(encoded);
const decrypted = getEnc('x').decrypt(encrypted);
```

### 调试技巧

1. **浏览器开发工具**：使用Vue DevTools监控组件状态
2. **网络面板**：监控WebSocket消息传输
3. **控制台日志**：查看详细的协议处理日志
4. **本地存储检查**：验证Token和配置存储

---

## 📦 项目结构详解

### 状态管理架构

```javascript
// tokenStore.js - 核心Token管理
const useTokenStore = defineStore('tokens', () => {
  const gameTokens = ref([]);           // Token列表
  const selectedTokenId = ref(null);    // 当前选中Token
  const wsConnections = ref({});        // WebSocket连接池
  
  // Token管理方法
  const addToken = (tokenData) => { /* ... */ };
  const updateToken = (id, updates) => { /* ... */ };
  const removeToken = (id) => { /* ... */ };
  
  // WebSocket管理
  const connectWebSocket = (tokenId) => { /* ... */ };
  const disconnectWebSocket = (tokenId) => { /* ... */ };
  
  return { 
    gameTokens, selectedTokenId, wsConnections,
    addToken, updateToken, removeToken,
    connectWebSocket, disconnectWebSocket
  };
});
```

### 路由守卫系统

```javascript
// router/index.js
router.beforeEach((to, from, next) => {
  const tokenStore = useTokenStore();
  
  if (to.meta.requiresToken && !tokenStore.hasTokens) {
    next('/tokens'); // 重定向到Token管理页
  } else {
    next();
  }
});
```

### 组件通信模式

```javascript
// 父子组件通信
// Parent.vue
<TokenManager 
  :tokens="tokens" 
  @token-selected="handleTokenSelect"
  @token-updated="handleTokenUpdate" />

// 兄弟组件通信（通过Store）
const tokenStore = useTokenStore();
const gameData = computed(() => tokenStore.gameData);
```

---

## 🔐 安全特性

### 数据安全
- **本地存储**：所有敏感数据仅存储在浏览器本地
- **Token掩码**：界面显示时自动掩码处理（显示首尾4位）
- **加密传输**：WebSocket消息使用多重加密协议
- **会话隔离**：每个Tab页面独立的连接会话

### 协议安全
```javascript
// 多重加密支持
const encryptors = {
  lx: lzCompressionWithMask,      // LZ4压缩+头部掩码
  x: randomHeaderWithXOR,         // 随机头部+XOR加密
  xtm: xxteaEncryption           // XXTEA加密算法
};

// 自动加密检测和解密
const autoDecrypt = (data) => {
  if (isLXFormat(data)) return lx.decrypt(data);
  if (isXFormat(data)) return x.decrypt(data);
  if (isXTMFormat(data)) return xtm.decrypt(data);
  return data;
};
```

---

## 🚀 性能优化

### 前端优化
- **代码分割**：路由级别的懒加载
- **Tree Shaking**：自动删除未使用代码
- **资源压缩**：Gzip压缩和资源优化
- **缓存策略**：智能缓存Token和游戏数据

### WebSocket优化
- **连接池**：复用WebSocket连接
- **消息队列**：批量处理和发送优化
- **心跳机制**：智能心跳保持连接活跃
- **断线重连**：指数退避重连算法

### 内存优化
```javascript
// 响应式数据优化
const gameData = computed(() => {
  return tokenStore.gameData || {};
});

// 组件卸载时清理
onUnmounted(() => {
  if (wsClient.value) {
    wsClient.value.disconnect();
  }
});
```

---

## 🤝 贡献指南

### 开发规范
1. **代码风格**：使用ESLint + Prettier统一代码风格
2. **组件命名**：使用PascalCase命名Vue组件
3. **提交规范**：遵循Conventional Commits规范
4. **文档注释**：关键功能使用JSDoc注释

### 提交流程
```bash
# 1. Fork项目并克隆到本地
git clone https://github.com/your-username/xyzw-web-helper.git

# 2. 创建功能分支
git checkout -b feature/new-feature

# 3. 提交更改
git commit -m "feat: 添加新功能描述"

# 4. 推送分支
git push origin feature/new-feature

# 5. 创建Pull Request
```

### Issue反馈
- 🐛 **Bug报告**：描述问题复现步骤和环境信息
- 💡 **功能建议**：详细说明需求场景和预期效果
- 📖 **文档改进**：指出文档不准确或缺失的部分
- ❓ **使用问题**：提供详细的使用场景和问题描述

---

## 📋 更新日志

### v2.0.0 (Current)
- 🎉 重构Token管理系统，支持多角色管理
- 🔧 升级WebSocket客户端，支持更多游戏协议
- 🎨 全新UI设计，基于Naive UI组件库
- ⚡ 优化BON协议处理，提升消息编解码性能
- 🛡️ 增强安全性，支持多种加密方式
- 🧪 添加完整的测试和调试工具

### v1.x.x (Legacy)
- 基础Token管理功能
- 简单WebSocket连接
- 基础游戏功能支持

---

## 🗓️ 版本更新计划

### v2.1.0 (计划中 - Q4 2025)
- 🎯 **自动化增强**
  - [ ] 智能任务调度系统
  - [ ] 增加账号批量管理界面
  - [ ] 界面已有bug修复

- 🔧 **功能扩展**
  - [ ] 支持每日任务一件完成
  - [x] 支持远端获取Token（URL接口方式）
  - [x] 支持Token自动刷新功能
  - [ ] 支持定时任务抢购符咒
  - [ ] 支持自定义脚本生成

## 📄 许可证

本项目基于 [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](LICENSE) 许可证。

**⚠️ 重要声明：**
- ✅ **允许**：个人学习、研究、修改和分享
- ❌ **禁止**：商业用途、销售、商业化运营
- 📝 **要求**：署名、相同许可证分享、标注修改

详细许可条款请查看 [LICENSE](LICENSE) 文件。

---

## 📞 联系方式

- **项目主页**：[GitHub Repository](https://github.com/w1249178256/xyzw_web_helper)
- **问题反馈**：[GitHub Issues](https://github.com/w1249178256/xyzw_web_helper/issues)
- **联系邮箱**：[发邮件给我](mailto:stevefeng59@gmail.com)

---

## 👏 赞赏
<img src="https://github.com/w1249178256/xyzw_web_helper/blob/main/public/IMG_8007.JPG" width="200" height="200">

<div align="center">

**⭐ 如果这个项目对你有帮助，请给它一个星标！**

Made with ❤️ by FF Team

</div>
