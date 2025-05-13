import { create } from "zustand";
import operationMapping from "../operationMapping";

// 创建表格数据状态管理 store - 简化数据结构
const useTableStore = create((set, get) => ({
  // 表格数据状态 - 按工序存储，使用扁平化结构
  operationData: {
    // 去掉所有模拟数据，保持为空对象
  },

  // 获取特定工序的表格数据
  getTableDataByOperation: (operationName) => {
    return (
      get().operationData[operationName] || {
        tableHeader: "",
        headerInfo: {
          positiveSlurry: "",
          cellCode: "",
        },
        tableData: [],
      }
    );
  },

  // 更新表格数据 - 简化数据结构
  updateTableByCellCode: (cellCode, operationName, apiData) => {
    set((state) => {
      // 深拷贝当前状态
      const newState = { ...state };

      // 确保该工序的数据存在
      if (!newState.operationData[operationName]) {
        newState.operationData[operationName] = {
          tableHeader: operationMapping[operationName] || operationName,
          headerInfo: {
            positiveSlurry: "",
            cellCode: cellCode,
          },
          tableData: [],
        };
      }

      // 更新电芯条码
      newState.operationData[operationName].headerInfo.cellCode = cellCode;

      // 如果有 API 数据，直接格式化为表格数据
      if (
        apiData &&
        apiData.resultParameters &&
        apiData.resultParameters.length > 0
      ) {
        const formattedData = apiData.resultParameters.map((item, index) => ({
          key: `${operationName}-${index}`,
          process: operationName,
          paramType: "结果加工参数",
          item: item.columns,
          result: item.rows,
        }));

        newState.operationData[operationName].tableData = formattedData;
      }

      return newState;
    });
  },

  // 批量更新表格数据
  updateTableByCellCodeBatch: (cellCode, operationNames, apiDataMap) => {
    set((state) => {
      // 深拷贝当前状态
      const newState = { ...state };
  
      // 遍历所有操作名称
      operationNames.forEach(operationName => {
        const apiData = apiDataMap[operationName];
        
        // 确保该工序的数据存在
        if (!newState.operationData[operationName]) {
          newState.operationData[operationName] = {
            tableHeader: operationMapping[operationName] || operationName,
            headerInfo: {
              positiveSlurry: "",
              cellCode: cellCode,
            },
            tableData: [],
          };
        }
  
        // 更新电芯条码
        newState.operationData[operationName].headerInfo.cellCode = cellCode;
  
        // 如果有 API 数据，直接格式化为表格数据
        if (
          apiData &&
          apiData.resultParameters &&
          apiData.resultParameters.length > 0
        ) {
          const formattedData = apiData.resultParameters.map((item, index) => ({
            key: `${operationName}-${index}`,
            process: operationName,
            paramType: "结果加工参数",
            item: item.columns,
            result: item.rows,
          }));
  
          newState.operationData[operationName].tableData = formattedData;
        }
      });
  
      return newState;
    });
  },
}));

export default useTableStore;
