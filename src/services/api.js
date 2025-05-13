/**
 * API 服务层 - 处理所有 API 调用
 */

// 查询电芯条码相关参数
export async function fetchCellCodeParams(code, operationName) {
  try {
    const response = await fetch('/api/result-params', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material_lot_code: code,
        operation_name: operationName
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API 调用错误:', error);
    throw error;
  }
}

// 可以添加更多 API 调用函数...