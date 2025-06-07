import { create } from 'zustand';

/**
 * 搜索相关的状态管理
 */
const useSearchStore = create((set) => ({
  // 电芯条码搜索
  material_lot_code: '',
  setMaterialLotCode: (code) => set({ material_lot_code: code }),
}));

export default useSearchStore; 