/**
 * API配置文件
 * 统一管理外部API地址和相关配置
 */

// 外部API基础地址
export const EXTERNAL_API_BASE_URL = 'http://10.22.161.62:8083';

// API端点配置
export const API_ENDPOINTS = {
  CORE_BAG_CODE: '/api/5m1e/coreBagCode',
  RESULT_PARAMS: '/api/5m1e/result-params',
  MATERIAL_PRO: '/api/5m1e/material-pro',
  MATERIAL_END: '/api/5m1e/material-end',
  PROCESS_DATA: '/api/5m1e/process-data'
};

// 请求配置
export const REQUEST_CONFIG = {
  DEFAULT_TIMEOUT: 10000,  // 10秒超时
  DEFAULT_RETRIES: 3,      // 默认重试3次
  RETRY_DELAY_BASE: 1000,  // 重试延迟基数(毫秒)
  MAX_RETRY_DELAY: 5000    // 最大重试延迟(毫秒)
};

// 完整的API URL构建器
export const buildApiUrl = (endpoint) => {
  return `${EXTERNAL_API_BASE_URL}${endpoint}`;
};

// 导出完整配置对象
export const API_CONFIG = {
  BASE_URL: EXTERNAL_API_BASE_URL,
  ENDPOINTS: API_ENDPOINTS,
  REQUEST: REQUEST_CONFIG,
  buildUrl: buildApiUrl
}; 