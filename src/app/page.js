"use client";
import { Input, Button } from 'antd';
import { useState } from 'react';
import BoxDiv from '../components/boxDiv/index';
import TableOne from '../components/tableOne/index';
import ExpandTable from '../components/expandTable/index';
import useCellCodeStore from '../store/cellCodeStore';
import useTableStore from '../store/tableStore';
import '@ant-design/v5-patch-for-react-19';


export default function Home() {
    // 使用 Zustand store
    const { 
      cellCode, 
      searchByCellCode, 
      isLoading, 
      error,
      searchResults
    } = useCellCodeStore();
    
    // 使用表格数据 store
    const { updateTableByCellCode } = useTableStore();
    
    // 本地状态用于输入框
    const [inputValue, setInputValue] = useState('');
    
    // 定义工序列表
    const operations = ["C021", "C022", "A020", "C030", "A030", "C040", "A040", "S010", "E010", "E020", "E030", "E040", "E050", "E060", "E070", "E080", "E090", "E100", "E110", "F010", "F100", "F120", "F130", "F140", "F150", "F160", "F170"];
    
    // 处理查询 - 使用动态工序列表
    const handleSearch = async () => {
      if (inputValue.trim()) {
        // 使用循环遍历所有工序进行查询
        for (const operation of operations) {
          const results = await searchByCellCode(inputValue, operation);
          if (results && results.resultParameters) {
            updateTableByCellCode(inputValue, operation, results);
          }
        }
      }
    };
    
    // 处理输入变化
    const handleInputChange = (e) => {
      setInputValue(e.target.value);
    };
    
    // 处理按键事件 (回车键查询)
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    };
    
    return ( 
      <div className="h-screen flex flex-col p-4">
        {/* 顶部搜索区域 - 使用最小高度 */}
        <div className="min-h-[60px] mb-2 flex items-center">
          <div className="mr-2 font-bold">电芯条码：</div>
          <Input 
            placeholder="请输入电芯条码" 
            style={{ width: '300px' }} 
            className="mr-2"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button 
            type="primary" 
            onClick={handleSearch}
            loading={isLoading}
          >
            查询
          </Button>
        </div>
        
        {/* 错误信息区域 - 只在有错误时显示 */}
        {error && (
          <div className="mb-2 text-red-500">
            错误: {error}
          </div>
        )}
        
        {/* 表格区域 - 使用flex-grow占据剩余空间 */}
        <div className="flex-grow overflow-x-auto overflow-y-auto whitespace-nowrap full-height-container">
          <div className="inline-flex h-full" style={{ columnGap: 0 }}>
            <TableOne />
            <BoxDiv title="浆料">
              <ExpandTable operationName="C021" tableTitle="正极浆料" />
              <ExpandTable operationName="C022" tableTitle="陶瓷浆料" />
              <ExpandTable operationName="A020" tableTitle="负极浆料" />
            </BoxDiv>
        
            <BoxDiv title="涂布卷">
              <ExpandTable operationName="C030" tableTitle="正极涂布卷" />
              <ExpandTable operationName="A030" tableTitle="负极涂布卷" />
            </BoxDiv>
        
            <BoxDiv title="辊分卷">
              <ExpandTable operationName="C040" tableTitle="正极辊分卷" />
              <ExpandTable operationName="A040" tableTitle="负极辊分卷" />
            </BoxDiv>
        
            <BoxDiv title="芯包">
              <ExpandTable operationNames={["S010", "E010", "E020"]}  tableTitle="A芯包" />
              <ExpandTable operationNames={["S010", "E010", "E020"]}  tableTitle="B芯包" />
              <ExpandTable operationNames={["E030"]}  tableTitle="双芯包" />
            </BoxDiv>
        
          <BoxDiv title="裸电芯">
            <ExpandTable operationNames={["E040", "E050", "E060", "E070", "E080", "E090", "E100"]}  tableTitle="裸电芯" />
          </BoxDiv>
        
          <BoxDiv title="电芯">
            <ExpandTable operationNames={["F100", "F120", "F130", "F140", "F150", "F160", "F170"]}  tableTitle="电芯" />
          </BoxDiv>
          
          </div>
        </div>
      </div>
    );
}