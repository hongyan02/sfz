import { create } from 'zustand';
import { fetchCellCodeParams } from '../services/api';

// 创建电芯条码状态管理 store
const useCellCodeStore = create((set, get) => ({
  // 状态
  cellCode: '',
  operationResults: {}, // 存储不同工序的结果
  isLoading: false,
  error: null,

  // 动作
  setCellCode: (code) => set({ cellCode: code }),
  
  // 查询动作 - 使用服务层 API
  searchByCellCode: async (code, operationName) => {
    if (!operationName) {
      set({ error: '工序名称不能为空', isLoading: false });
      return null;
    }
    
    // 设置加载状态
    set({ isLoading: true, error: null });
    
    try {
      // 使用服务层 API 调用
      const data = await fetchCellCodeParams(code, operationName);
      
      // 更新状态 - 使用操作名称作为键存储结果
      set((state) => ({ 
        operationResults: {
          ...state.operationResults,
          [operationName]: data
        },
        isLoading: false,
        cellCode: code
      }));
      
      return data;
    } catch (error) {
      // 处理错误
      set({ 
        error: error.message || '查询失败', 
        isLoading: false 
      });
      return null;
    }
  },
  
  // 获取特定工序的结果
  getOperationResult: (operationName) => {
    const state = get();
    return state.operationResults[operationName] || null;
  },
  
  // 重置状态
  resetSearch: () => set({ 
    operationResults: {}, 
    error: null 
  }),
}));

export default useCellCodeStore;