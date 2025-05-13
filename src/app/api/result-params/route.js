// Next.js API 路由处理函数
export async function POST(request) {
  try {
    // 解析请求体
    const body = await request.json();
    const { material_lot_code, operation_name } = body;
    
    // 验证必要参数
    if (!material_lot_code || !operation_name) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 调用实际的 API
    const response = await fetch('http://10.22.161.62:8083/api/5m1e/result-params', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material_lot_code,
        operation_name
      }),
    });
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }
    
    // 获取响应数据
    const data = await response.json();
    
    // 返回响应
    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    // 处理错误
    return new Response(
      JSON.stringify({ error: error.message || '服务器错误' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}