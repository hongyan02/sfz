'use client';

import React, { useEffect, useState } from 'react';
import { Table, Spin, Empty } from 'antd';
import { useSearchStore } from '../store';
import { fetchCoreBagCode, fetchMaterialEnd } from '../services/api';

/**
 * 基于芯包码的物料终点表格组件
 * 
 * 工作流程：
 * 1. 使用当前电芯条码和S010工艺调用fetchCoreBagCode获取芯包码
 * 2. 使用获取到的芯包码作为material_lot_code调用fetchMaterialEnd获取物料终点数据
 * 3. 显示最终的物料终点数据
 * 
 * @param {Object} props
 * @param {string} props.workcell_id - 工作单元ID
 * @param {Object} [props.style] - 自定义样式
 * 
 * @example
 * // 基本使用
 * <MaterialEndWithCoreBagTable workcell_id="CELL_001" />
 * 
 * // 带自定义样式
 * <MaterialEndWithCoreBagTable 
 *   workcell_id="CELL_001" 
 *   style={{ marginTop: '16px' }} 
 * />
 */
const MaterialEndWithCoreBagTable = ({ workcell_id, style = {} }) => {
  const { material_lot_code } = useSearchStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [noMaterial, setNoMaterial] = useState(false);
  const [coreBagCodes, setCoreBagCodes] = useState([]);
  const [coreBagLoading, setCoreBagLoading] = useState(false);

  // 获取数据的完整流程
  useEffect(() => {
    const fetchData = async () => {
      if (!material_lot_code || !workcell_id) {
        setData([]);
        setNoMaterial(false);
        setCoreBagCodes([]);
        return;
      }

      setLoading(true);
      setCoreBagLoading(true);
      setError(null);
      setNoMaterial(false);

      try {
        // 第一步：获取芯包码
        console.log('第一步：获取芯包码', {
          material_lot_code,
          operation_name: 'S010'
        });
        
        const coreBagResult = await fetchCoreBagCode(material_lot_code, 'S010');
        console.log('芯包码API响应:', coreBagResult);
        
        if (!coreBagResult || !coreBagResult.coreBagCode || coreBagResult.coreBagCode.length === 0) {
          console.log('未获取到芯包码');
          setCoreBagCodes([]);
          setNoMaterial(true);
          setData([]);
          return;
        }

        const coreBagCodeList = coreBagResult.coreBagCode;
        setCoreBagCodes(coreBagCodeList);
        setCoreBagLoading(false);

        console.log('获取到芯包码:', coreBagCodeList);

        // 第二步：使用第一个芯包码获取物料终点数据
        // 如果有多个芯包码，可以根据需求调整逻辑
        const firstCoreBagCode = coreBagCodeList[0];
        
        console.log('第二步：获取物料终点数据', {
          material_lot_code: firstCoreBagCode,
          workcell_id
        });

        const materialEndResult = await fetchMaterialEnd(firstCoreBagCode, workcell_id);
        console.log('物料终点API响应:', materialEndResult);
        
        // 处理返回的数据
        if (materialEndResult && materialEndResult.Material === null) {
          // 当 Material 为 null 时，设置 noMaterial 为 true
          setNoMaterial(true);
          setData([]);
        } else if (materialEndResult && materialEndResult.Material && Array.isArray(materialEndResult.Material)) {
          // 处理 Material 数组格式
          const tableData = materialEndResult.Material.map((item, index) => ({
            key: index,
            name: item.MATERIAL_NAME || '-',
            value: item.MATERIAL_LOT_CODE || '-'
          }));
          
          setData(tableData);
        } else if (materialEndResult && typeof materialEndResult === 'object') {
          // 备用处理：如果不是预期的 Material 数组格式，尝试处理普通对象格式
          const tableData = Object.entries(materialEndResult).map(([key, value], index) => {
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
        console.error('获取数据失败:', err);
        setError('获取数据失败，请稍后重试');
      } finally {
        setLoading(false);
        setCoreBagLoading(false);
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
    if (loading || coreBagLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <Spin size="small" />
          <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
            {coreBagLoading ? '正在获取芯包码...' : '正在获取物料数据...'}
          </div>
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
      <div>
        {/* 显示使用的芯包码信息 */}
        {/* {coreBagCodes.length > 0 && (
          <div style={{ 
            marginBottom: '8px', 
            padding: '4px 8px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '4px',
            fontSize: '11px',
            color: '#0369a1'
          }}>
            使用芯包码: {coreBagCodes[0]}
            {coreBagCodes.length > 1 && ` (共${coreBagCodes.length}个)`}
          </div>
        )} */}
        
        <Table 
          columns={columns} 
          dataSource={data} 
          pagination={false}
          size="small"
          bordered
          showHeader={false}
          style={{ width: '100%' }}
        />
      </div>
    );
  };

  return (
    <div style={{ width: '100%', ...style }}>
      {renderContent()}
    </div>
  );
};

export default MaterialEndWithCoreBagTable;

/*
使用说明：

1. 数据流程：
   电芯条码 → fetchCoreBagCode(S010) → 芯包码 → fetchMaterialEnd → 物料终点数据

2. 组件特性：
   - 自动处理两步API调用
   - 显示详细的加载状态
   - 显示使用的芯包码信息
   - 完整的错误处理
   - 与MaterialEndTable相同的表格样式

3. 使用场景：
   - 需要通过芯包码获取物料终点数据的场景
   - 电芯追溯到芯包再到物料的数据链路
   - 工艺S010相关的物料终点查询

4. 注意事项：
   - 如果获取到多个芯包码，默认使用第一个
   - 可以根据业务需求修改芯包码选择逻辑
   - 保持与原MaterialEndTable组件相同的UI风格
*/ 