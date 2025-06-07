'use client';

import React, { useEffect, useState } from 'react';
import { Table, Spin, Empty } from 'antd';
import { useSearchStore } from '../store';
import { fetchMaterialEnd } from '../services/api';

/**
 * 物料终点表格组件
 * @param {Object} props
 * @param {string} props.workcell_id - 工作单元ID
 * @param {Object} [props.style] - 自定义样式
 */
const MaterialEndTable = ({ workcell_id, style = {} }) => {
  const { material_lot_code } = useSearchStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [noMaterial, setNoMaterial] = useState(false);

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      if (!material_lot_code || !workcell_id) {
        setData([]);
        setNoMaterial(false);
        return;
      }

      setLoading(true);
      setError(null);
      setNoMaterial(false);

      try {
        // 调用 API 获取物料终点数据
        const result = await fetchMaterialEnd(material_lot_code, workcell_id);
        
        // 处理返回的数据
        if (result && result.Material === null) {
          // 当 Material 为 null 时，设置 noMaterial 为 true
          setNoMaterial(true);
          setData([]);
        } else if (result && result.Material && Array.isArray(result.Material)) {
          // 处理 Material 数组格式
          const tableData = result.Material.map((item, index) => ({
            key: index,
            name: item.MATERIAL_NAME || '-',
            value: item.MATERIAL_LOT_CODE || '-'
          }));
          
          setData(tableData);
        } else if (result && typeof result === 'object') {
          // 备用处理：如果不是预期的 Material 数组格式，尝试处理普通对象格式
          const tableData = Object.entries(result).map(([key, value], index) => {
            // 检查值是否为数组或对象，如果是则转换为字符串
            let displayValue = value;
            if (typeof value === 'object' && value !== null) {
              displayValue = JSON.stringify(value);
            }
            
            return {
              key: index,
              name: key,
              value: displayValue !== null && displayValue !== undefined ? String(displayValue) : '-'
            };
          });
          
          setData(tableData);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error('获取物料终点数据失败:', err);
        setError('获取数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [material_lot_code, workcell_id]);

  // 表格列定义 - 只有两列，没有表头
  const columns = [
    {
      dataIndex: 'name',
      key: 'name',
      width: '50%',
      render: (text) => <span className="font-medium text-xs">{text}</span>,
      title: '', // 空标题，不显示表头
    },
    {
      dataIndex: 'value',
      key: 'value',
      width: '50%',
      render: (text) => <span className="text-xs">{text}</span>,
      title: '', // 空标题，不显示表头
    }
  ];

  // 渲染表格或加载状态
  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <Spin size="small" />
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '10px 0', color: '#ff4d4f' }}>
          {error}
        </div>
      );
    }

    if (!material_lot_code) {
      return (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="请输入电芯条码"
          style={{ margin: '8px 0' }}
        />
      );
    }

    if (noMaterial) {
      return (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="暂无数据"
          style={{ margin: '8px 0' }}
        />
      );
    }

    if (data.length === 0) {
      return (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="无数据"
          style={{ margin: '8px 0' }}
        />
      );
    }

    return (
      <Table 
        columns={columns} 
        dataSource={data} 
        pagination={false}
        size="small"
        bordered
        showHeader={false}
        style={{ width: '100%' }}
      />
    );
  };

  return (
    <div style={{ width: '100%', ...style }}>
      {renderContent()}
    </div>
  );
};

export default MaterialEndTable; 