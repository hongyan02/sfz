import React, { useState, useEffect } from 'react';
import { Table, Spin, Alert } from 'antd';
import { fetchMaterialPro } from '../../services/api';

const MaterialTableNew = ({ material_lot_code = '', storeMaterialLotCode = '' }) => {
  const [materialData, setMaterialData] = useState({
    positive: null, // 正极浆料
    ceramic: null,  // 陶瓷浆料
    negative: null  // 负极浆料
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const effectiveMaterialLotCode = material_lot_code || storeMaterialLotCode;
  const cellBackgroundColor = '#f8fafc';

  // 获取原材料数据
  const fetchMaterialData = async () => {
    if (!effectiveMaterialLotCode) {
      console.log('缺少 material_lot_code，跳过原材料API调用');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 并行调用三种浆料的数据 - 使用新的API服务层
      const [positiveData, ceramicData, negativeData] = await Promise.all([
        fetchMaterialPro(effectiveMaterialLotCode, 'C021'), // 正极浆料
        fetchMaterialPro(effectiveMaterialLotCode, 'C022'), // 陶瓷浆料
        fetchMaterialPro(effectiveMaterialLotCode, 'A020')  // 负极浆料
      ]);

      setMaterialData({
        positive: positiveData.Material || [],
        ceramic: ceramicData.Material || [],
        negative: negativeData.Material || []
      });

    } catch (err) {
      setError(err.message);
      console.error('获取原材料数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterialData();
  }, [effectiveMaterialLotCode]);

  // 生成动态列结构
  const generateDynamicColumns = () => {
    if (loading || error) {
      return [
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          width: 200,
          render: (text) => text,
          onCell: () => ({
            style: { 
              backgroundColor: cellBackgroundColor,
              padding: '8px',
              textAlign: 'left',
              verticalAlign: 'top'
            }
          }),
        }
      ];
    }

    const columns = [];
    
    // 为每种浆料类型创建分组
    const groupHeaders = [
      { title: '正极浆料', data: materialData.positive || [] },
      { title: '陶瓷浆料', data: materialData.ceramic || []},
      { title: '负极浆料', data: materialData.negative || [] }
    ];

    groupHeaders.forEach((group) => {
      if (group.data.length === 0) {
        // 如果该组无数据，显示一个空列
        columns.push({
          title: group.title,
          dataIndex: `${group.title}_empty`,
          key: `${group.title}_empty`,
          width: 200,
          render: () => (
            <div style={{ textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>
              暂无数据
            </div>
          ),
          onCell: () => ({
            style: { 
              backgroundColor: cellBackgroundColor,
              padding: '8px',
              textAlign: 'left',
              verticalAlign: 'top'
            }
          }),
        });
      } else {
        // 为每个物料项目创建独立列
        group.data.forEach((material, index) => {
          columns.push({
            title: index === 0 ? group.title : '', // 只在第一列显示组标题
            dataIndex: `${group.title}_${index}`,
            key: `${group.title}_${index}`,
            width: 180,
            render: (text, record) => {
              if (record.rowType === 'name') {
                return (
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: 'bold',
                    wordBreak: 'break-all',
                    lineHeight: '1.3'
                  }}>
                    {material.MATERIAL_NAME || '暂无数据'}
                  </div>
                );
              } else if (record.rowType === 'code') {
                return (
                  <div style={{ 
                    fontSize: '11px',
                    wordBreak: 'break-all',
                    lineHeight: '1.3'
                  }}>
                    {material.MATERIAL_LOT_CODE || '暂无数据'}
                  </div>
                );
              }
              return '';
            },
            onCell: (record) => ({
              style: { 
                backgroundColor: record.rowType === 'name' ? group.color : cellBackgroundColor,
                padding: '8px',
                verticalAlign: 'top',
                textAlign: 'left',
                borderRight: '1px solid #e5e7eb',
                width: '180px !important',
                minWidth: '180px !important',
                maxWidth: '180px !important',
                boxSizing: 'border-box'
              }
            }),
          });
        });
      }
    });

    return columns;
  };

  // 生成数据源
  const generateDataSource = () => {
    if (loading) {
      return [
        { key: 'loading', rowType: 'loading', status: '正在加载...' }
      ];
    }

    if (error) {
      return [
        { key: 'error', rowType: 'error', status: `加载失败: ${error}` }
      ];
    }

    // 创建两行：物料名称和物料批次
    const dataSource = [
      { key: 'name', rowType: 'name' },
      { key: 'code', rowType: 'code' }
    ];

    return dataSource;
  };

  const columns = generateDynamicColumns();
  const dataSource = generateDataSource();
  
  // 计算总宽度
  const totalWidth = columns.length * 180;
  const containerWidth = Math.max(totalWidth, 600); // 最小宽度600px

  return (
    <div style={{ width: `${containerWidth}px`, minWidth: `${containerWidth}px` }}>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        showHeader={true}
        size="small"
        bordered
        scroll={false}
        style={{ 
          tableLayout: 'fixed',
          width: `${containerWidth}px`
        }} 
        tableLayout="fixed"
        components={{
          header: {
            cell: (props) => {
              const { children, ...restProps } = props;
              return (
                <th 
                  {...restProps}
                  style={{
                    ...restProps.style,
                    backgroundColor: '#f9fafb',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '12px 8px',
                    fontSize: '12px'
                  }}
                >
                  {children}
                </th>
              );
            },
          },
        }}
      />
    </div>
  );
};

export default MaterialTableNew; 