'use client';
import '@ant-design/v5-patch-for-react-19'; 
import React, { useState } from 'react';
import { Input, Button, Space, Form, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useSearchStore, useProcessDataStore } from '../store';

/**
 * 搜索组件
 * @param {Object} props
 * @param {Object} [props.style] - 自定义样式
 */
const SearchBar = ({ style = {} }) => {
  // 从不同的 store 获取状态和方法
  const { material_lot_code, setMaterialLotCode } = useSearchStore();
  const { clearProcessData } = useProcessDataStore();
  
  const [inputValue, setInputValue] = useState(material_lot_code);
  const [messageApi, contextHolder] = message.useMessage();
  
  const handleSearch = () => {
    if (!inputValue.trim()) {
      messageApi.warning('请输入电芯条码');
      return;
    }
    
    // 如果输入值与当前值不同，则清空之前的数据
    if (inputValue !== material_lot_code) {
      clearProcessData();
    }
    
    // 更新全局状态
    setMaterialLotCode(inputValue.trim());
    
    messageApi.success('正在查询数据...');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ padding: '16px 0', ...style }}>
      {contextHolder}
      <Form layout="inline">
        <Space size="middle">
          <Form.Item label="电芯条码:" style={{ marginBottom: 0 }}>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入电芯条码"
              style={{ width: 250 }}
              allowClear
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              type="primary" 
              icon={<SearchOutlined />} 
              onClick={handleSearch}
            >
              查询
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </div>
  );
};

export default SearchBar; 