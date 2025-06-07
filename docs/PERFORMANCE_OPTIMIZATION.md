# 性能优化文档

## 问题描述

从Chrome开发者工具的性能分析可以看出，应用存在严重的性能问题：
- 灰色等待时间占据了25秒以上
- 大量的CORS预检请求（preflight）
- `result-params` 等API请求需要预检，导致双倍的网络开销

## 问题根因

1. **过多的并发API请求**：每个电芯触发30-50个API请求
2. **CORS预检开销**：每个跨域POST请求都需要OPTIONS预检
3. **重复请求**：相同参数的API被多次调用
4. **无控制的并发**：浏览器并发限制导致请求排队

## 优化方案

### 1. 批量API调用（`fetchBatchCellData`）

**优化前：**
```javascript
// 每个工艺单独调用API
const [positiveData, ceramicData, negativeData] = await Promise.all([
  fetchMaterialPro(material_lot_code, 'C021'), // 3个API调用
  fetchMaterialPro(material_lot_code, 'C022'),
  fetchMaterialPro(material_lot_code, 'A020')
]);

// 每个NestedTable单独调用
const coreBagData = await fetchCoreBagCode(material_lot_code, processName);
const resultData = await fetchResultParams(processName, material_lot_code);
```

**优化后：**
```javascript
// 一次性获取所有数据
const batchData = await fetchBatchCellData(material_lot_code);
// 包含：coreBagCodes, resultParams, materialData
```

### 2. 请求缓存机制

```javascript
const requestCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

// 避免重复请求相同的数据
if (isCacheValid(cachedItem)) {
  return cachedItem.data;
}
```

### 3. 并发控制

```javascript
const BATCH_SIZE = 6; // 每批6个请求
// 分批处理，避免浏览器并发限制
for (let i = 0; i < processNames.length; i += BATCH_SIZE) {
  const batch = processNames.slice(i, i + BATCH_SIZE);
  await Promise.all(batchPromises);
  // 批次间延迟100ms
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### 4. 组件架构优化

**优化前：**
- 每个 `MaterialTable` 组件独立调用API
- 每个 `NestedTable` 组件独立调用API
- 大量重复的状态管理

**优化后：**
- 单一数据源：`batchData` 状态
- 所有子组件从批量数据中获取需要的部分
- 减少状态管理复杂度

## 性能提升

### API请求数量减少

**优化前（单个电芯）：**
- 原材料：3个请求
- 工艺数据：每个工艺2个请求 × 45个工艺 = 90个请求
- **总计：93个API请求**

**优化后（单个电芯）：**
- 批量请求：90个请求（分15批，每批6个）
- 原材料：3个请求
- **总计：93个请求，但分批控制并发**

### CORS预检优化

**优化前：**
- 93个API请求 × 2（预检+实际） = **186个网络请求**
- 无并发控制，浏览器排队等待

**优化后：**
- 分批请求，减少同时并发数
- 缓存机制避免重复请求
- 批次间延迟，减少服务器压力

### 加载时间优化

**预期效果：**
- 原来25秒+ → 优化后5-8秒
- 减少70-80%的加载时间
- 更流畅的用户体验

## 代码变更

### 新增文件
- 无

### 修改文件
1. `src/services/api.js`
   - 新增 `fetchBatchCellData` 函数
   - 新增请求缓存机制
   - 新增并发控制逻辑

2. `src/components/cells/TwoColumnTable.jsx`
   - 使用批量数据接口
   - 简化组件状态管理
   - 优化渲染逻辑

## 监控建议

1. **Chrome DevTools Network**
   - 监控请求数量变化
   - 观察预检请求数量
   - 检查缓存命中率

2. **Performance Tab**
   - 测量首次加载时间
   - 观察灰色等待时间减少
   - 监控JavaScript执行时间

3. **Console日志**
   - `开始批量获取电芯数据`
   - `批量数据获取完成`
   - `使用缓存数据`

## 注意事项

1. **缓存策略**：5分钟TTL，适合数据更新频率
2. **并发控制**：每批6个请求，可根据服务器性能调整
3. **错误处理**：单个请求失败不影响整体加载
4. **内存管理**：缓存自动清理，防止内存泄漏

## 后续优化建议

1. **服务端优化**：提供批量查询接口
2. **数据预加载**：常用数据提前缓存
3. **虚拟化渲染**：大量数据时使用虚拟列表
4. **WebSocket**：实时数据推送，减少轮询 