# API直接调用迁移文档

## 概述

本次更新将应用从使用Next.js API路由中转的方式改为直接从客户端调用外部API，以提高性能和减少中间层的复杂性。

## 主要变更

### 1. 新增配置文件

**文件**: `src/config/api.js`
- 统一管理外部API地址和配置
- 提供API URL构建器
- 配置重试机制参数

### 2. 更新API服务层

**文件**: `src/services/api.js`
- 移除对Next.js API路由的依赖
- 直接调用外部API: `http://10.22.161.62:8083`
- 增强的重试机制，支持指数退避
- 统一的错误处理

### 3. 更新组件

以下组件已更新为使用新的API服务层：

#### `src/components/cells/TwoColumnTable.jsx`
- 移除本地的`fetchWithRetry`和`throttledRequest`函数
- 使用新的API服务层函数
- 简化错误处理逻辑

#### `src/components/cells/MaterialTableNew.jsx`
- 更新原材料数据获取逻辑
- 使用新的API服务层

#### `src/components/ExcelExportButton.jsx`
- 更新所有数据获取函数
- 使用新的API服务层
- 改进错误处理

## API端点映射

| 功能 | 原Next.js路由 | 新外部API端点 |
|------|---------------|---------------|
| 芯包码 | `/api/coreBagCode` | `/api/5m1e/coreBagCode` |
| 结果参数 | `/api/resultParams` | `/api/5m1e/result-params` |
| 物料生产 | `/api/materialPro` | `/api/5m1e/material-pro` |
| 物料终点 | `/api/materialEnd` | `/api/5m1e/material-end` |
| 工艺数据 | `/api/process-data` | `/api/5m1e/process-data` |

## 性能优化

### 1. 重试机制
- 默认重试3次
- 指数退避算法，避免服务器过载
- 最大重试延迟5秒

### 2. 错误处理
- 统一的错误处理逻辑
- 友好的用户错误提示
- 详细的控制台日志

### 3. 网络优化
- 移除中间层延迟
- 减少服务器负载
- 直接的客户端-服务器通信

## 配置说明

### API配置 (`src/config/api.js`)

```javascript
// 外部API基础地址
export const EXTERNAL_API_BASE_URL = 'http://10.22.161.62:8083';

// 请求配置
export const REQUEST_CONFIG = {
  DEFAULT_TIMEOUT: 10000,  // 10秒超时
  DEFAULT_RETRIES: 3,      // 默认重试3次
  RETRY_DELAY_BASE: 1000,  // 重试延迟基数(毫秒)
  MAX_RETRY_DELAY: 5000    // 最大重试延迟(毫秒)
};
```

## 使用示例

### 获取芯包码数据
```javascript
import { fetchCoreBagCode } from '../services/api';

const data = await fetchCoreBagCode(material_lot_code, operation_name);
```

### 获取结果参数
```javascript
import { fetchResultParams } from '../services/api';

const data = await fetchResultParams(processName, material_lot_code);
```

### 获取物料生产数据
```javascript
import { fetchMaterialPro } from '../services/api';

const data = await fetchMaterialPro(material_lot_code, operation_name);
```

## 注意事项

1. **CORS配置**: 确保外部API服务器配置了正确的CORS策略
2. **网络安全**: 直接调用外部API可能需要额外的安全考虑
3. **错误监控**: 建议添加错误监控和日志记录
4. **缓存策略**: 考虑添加客户端缓存以提高性能

## 回滚方案

如果需要回滚到Next.js API路由方式：

1. 恢复`src/services/api.js`中的fetch调用到`/api/*`路径
2. 确保`src/app/api/`目录下的路由文件正常工作
3. 更新组件中的导入语句

## 测试建议

1. 测试所有API调用功能
2. 验证错误处理机制
3. 检查网络异常情况下的表现
4. 确认重试机制正常工作
5. 验证数据格式兼容性

## 维护说明

- API地址变更时，只需修改`src/config/api.js`文件
- 重试策略调整可在配置文件中进行
- 新增API端点时，在配置文件中添加相应条目 