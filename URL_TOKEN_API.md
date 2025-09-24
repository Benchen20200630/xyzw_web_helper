# URL直接添加Token功能使用指南

## 功能概述

新增的URL参数功能允许用户通过特定的URL直接完成游戏token的添加流程，无需在页面上手动操作。

## 支持的URL格式

### 1. 直接token参数（最简单）

```
http://localhost:3001/tokens?token=base64_token_string&name=角色名称
```

**参数说明：**
- `token`: Base64编码的token字符串（必需）
- `name`: 角色名称（必需）

**示例：**
```
http://localhost:3001/tokens?token=eyJhbGciOiJIUzI1NiJ9...&name=主号战士
```

### 2. 完整参数（推荐）

```
http://localhost:3001/tokens?token=base64_token_string&name=角色名称&server=服务器名&wsUrl=自定义连接&auto=true
```

**参数说明：**
- `token`: Base64编码的token字符串（必需）
- `name`: 角色名称（必需）
- `server`: 服务器名称（可选）
- `wsUrl`: 自定义WebSocket连接地址（可选）
- `auto`: 是否自动选择token并跳转到控制台（可选，true/false）

**示例：**
```
http://localhost:3001/tokens?token=eyJhbGciOiJIUzI1NiJ9...&name=主号战士&server=风云服&auto=true
```

### 3. API端点获取（动态获取）

```
http://localhost:3001/tokens?api=http://api.example.com/token&name=角色名称&auto=true
```

**参数说明：**
- `api`: API端点地址，返回包含token字段的JSON数据（必需）
- `name`: 角色名称（可选，如果API返回了name字段会优先使用API的）
- `server`: 服务器名称（可选，如果API返回了server字段会优先使用API的）
- `wsUrl`: 自定义WebSocket连接地址（可选）
- `auto`: 是否自动选择token并跳转到控制台（可选，true/false）

**API返回格式要求：**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "name": "角色名称",
  "server": "服务器名"
}
```

**示例：**
```
http://localhost:3001/tokens?api=http://localhost:3001/api/token&name=主号战士&auto=true
```

## 功能特性

### 1. 自动导入
- 页面加载时自动检测URL参数
- 支持Base64 token解析和验证
- 支持跨域API调用（需要服务器支持CORS）

### 2. 智能处理
- 自动判断token类型和格式
- 支持多种Base64编码格式
- 错误处理和用户友好提示

### 3. 状态管理
- 导入后自动清除URL参数
- 支持自动选择token并跳转
- 保持与现有token管理流程兼容

### 4. 安全性
- 仅在页面加载时处理一次URL参数
- 自动清除敏感参数避免泄露
- 支持HTTPS加密传输

## 使用场景

### 场景1：快速分享token
用户可以生成包含token的链接，其他用户点击即可快速添加token。

### 场景2：自动化脚本集成
外部脚本可以生成token后，通过URL参数直接导入到系统中。

### 场景3：第三方系统集成
其他系统可以通过API端点方式，动态提供token给用户。

## 测试示例

### 测试直接token导入

```bash
# 打开浏览器访问以下URL（替换为实际的token）
http://localhost:3001/tokens?token=test_token_base64&name=测试角色&auto=true
```

### 测试API获取token

先创建一个简单的测试API端点，然后访问：

```bash
# 如果有本地测试API
http://localhost:3001/tokens?api=http://localhost:3001/api/test-token&name=API测试角色&auto=true
```

## 错误处理

系统会处理以下错误情况：

1. **无效token格式**：提示token格式错误
2. **API请求失败**：提示网络错误或API不可用
3. **跨域问题**：提示CORS配置问题
4. **参数缺失**：提示必需参数缺失

## 注意事项

1. **安全性**：不要在公共场所或不安全的网络环境下使用包含token的URL
2. **有效性**：token的有效性取决于游戏服务器的设置
3. **兼容性**：功能与现有的手动导入完全兼容，不影响现有流程
4. **跨域**：使用API模式时，确保目标服务器支持CORS

## 后续扩展

该功能为未来的自动化和集成功能奠定了基础，后续可以扩展：

- 支持批量token导入
- 支持token模板和预设
- 支持更多的参数传递
- 支持webhook回调机制