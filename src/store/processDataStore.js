import { create } from 'zustand';
import { fetchCoreBagCode } from '../services/api';
import useSearchStore from './searchStore';

/**
 * 工艺数据相关的状态管理
 */
const useProcessDataStore = create((set) => ({
  // 工艺数据
  processData: {},
  isLoading: {},
  error: null,
  
  // 获取芯包码数据
  fetchProcessData: async (operation_name) => {
    // 从搜索 store 获取电芯条码
    const material_lot_code = useSearchStore.getState().material_lot_code;
    
    // 如果没有电芯条码，不发起请求
    if (!material_lot_code) return;
    
    // 设置该工艺的加载状态
    set((state) => ({
      isLoading: {
        ...state.isLoading,
        [operation_name]: true
      },
      error: null
    }));
    
    try {
      const data = await fetchCoreBagCode(material_lot_code, operation_name);
      
      // 更新数据，使用操作名称作为键
      set((state) => ({
        processData: {
          ...state.processData,
          [operation_name]: data.coreBagCode || []
        },
        isLoading: {
          ...state.isLoading,
          [operation_name]: false
        }
      }));
    } catch (error) {
      set((state) => ({ 
        error: `获取 ${operation_name} 数据失败: ${error.message}`,
        isLoading: {
          ...state.isLoading,
          [operation_name]: false
        }
      }));
    }
  },
  
  // 清空数据
  clearProcessData: () => set({ processData: {}, isLoading: {}, error: null })
}));

export default useProcessDataStore; 