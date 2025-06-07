'use client';

import React, { useState, useRef } from 'react';
import { Button, message, Upload, Modal, Table, Tag, Checkbox, Spin, Progress, Space, Descriptions, Typography } from 'antd';
import { UploadOutlined, FileExcelOutlined, LoadingOutlined, EyeOutlined, HistoryOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import '@ant-design/v5-patch-for-react-19'; 

const { Text, Title } = Typography;

/**
 * Excel导入按钮组件
 * @param {Object} props
 * @param {Function} [props.onDataImported] - 数据导入成功后的回调函数，接收解析出的条码数组
 * @param {Object} [props.style] - 按钮样式
 * @param {string} [props.buttonText] - 按钮文本
 */
const ExcelImportButton = ({ 
  onDataImported,
  style = {},
  buttonText = '导入Excel文件'
}) => {
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [detailVisible, setDetailVisible] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [barcodeData, setBarcodeData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [skippedHeaders, setSkippedHeaders] = useState(0);
  const [importHistory, setImportHistory] = useState([]);
  const fileInputRef = useRef(null);

  // 检测是否为标题行
  const isLikelyHeader = (text) => {
    if (!text || typeof text !== 'string') return false;
    
    const headerKeywords = [
      '条码', '编号', 'ID', 'id', 'Id', 'iD',
      '序号', '名称', '标题', 'barcode', 'code',
      '电芯', '批次', '型号', '规格'
    ];
    
    const textStr = text.toString().trim();
    
    // 检查是否包含标题关键词
    const hasHeaderKeyword = headerKeywords.some(keyword => 
      textStr.includes(keyword)
    );
    
    // 检查是否为短文本（可能是标题）
    const isShortText = textStr.length <= 10;
    
    // 检查是否主要是中文且较短
    const chineseRegex = /[\u4e00-\u9fa5]/g;
    const chineseMatches = textStr.match(chineseRegex);
    const isChineseTitle = chineseMatches && chineseMatches.length > 0 && textStr.length <= 15;
    
    return hasHeaderKeyword || (isShortText && isChineseTitle);
  };

  // 验证是否为有效条码
  const isValidBarcode = (text) => {
    if (!text || typeof text !== 'string') return false;
    
    const textStr = text.toString().trim();
    
    // 长度检查（条码通常在5-50字符之间）
    if (textStr.length < 5 || textStr.length > 50) return false;
    
    // 检查是否主要由数字和字母组成
    const alphanumericRegex = /^[A-Za-z0-9]+$/;
    const mixedRegex = /^[A-Za-z0-9\-_\.]+$/; // 允许一些特殊字符
    
    if (!mixedRegex.test(textStr)) return false;
    
    // 排除纯中文
    const chineseRegex = /[\u4e00-\u9fa5]/;
    if (chineseRegex.test(textStr)) return false;
    
    // 排除常见的非条码文本
    const excludePatterns = [
      /^(test|demo|example|样例|测试)$/i,
      /^(null|undefined|none|空|无)$/i
    ];
    
    return !excludePatterns.some(pattern => pattern.test(textStr));
  };

  // 模拟导入进度
  const simulateImportProgress = (selectedBarcodes) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5; // 每次增加5-20%
        if (progress >= 100) {
          progress = 100;
          setImportProgress(100);
          clearInterval(interval);
          // 模拟最后的处理时间
          setTimeout(() => {
            resolve(selectedBarcodes);
          }, 500);
        } else {
          setImportProgress(Math.floor(progress));
        }
      }, 200);
    });
  };

  // 处理文件选择
  const handleFileSelect = (file) => {
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 解析所有工作表
        const allBarcodes = [];
        const previewTableData = [];
        let totalSkippedHeaders = 0;
        
        workbook.SheetNames.forEach((sheetName, sheetIndex) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, // 使用数组格式，保留所有单元格
            defval: '' // 空单元格默认值
          });
          
          // 只处理A列数据
          jsonData.forEach((row, rowIndex) => {
            if (Array.isArray(row) && row.length > 0) {
              const cellValue = row[0]; // 只取A列（第一列）
              
              if (cellValue && cellValue.toString().trim()) {
                const cellText = cellValue.toString().trim();
                
                // 检查是否为标题行（通常在前几行）
                if (rowIndex < 3 && isLikelyHeader(cellText)) {
                  totalSkippedHeaders++;
                  console.log(`跳过标题行: ${cellText}`);
                  return;
                }
                
                // 验证是否为有效条码
                if (isValidBarcode(cellText)) {
                  allBarcodes.push(cellText);
                  
                  // 为预览表格准备数据
                  const uniqueKey = `${sheetIndex}-${rowIndex}-0`;
                  previewTableData.push({
                    key: uniqueKey,
                    sheet: sheetName,
                    row: rowIndex + 1,
                    column: 'A', // 固定为A列
                    barcode: cellText
                  });
                } else {
                  console.log(`跳过无效条码: ${cellText}`);
                }
              }
            }
          });
        });
        
        // 去重
        const uniqueBarcodes = [...new Set(allBarcodes)];
        
        // 创建去重后的预览数据
        const uniquePreviewData = [];
        const seenBarcodes = new Set();
        
        previewTableData.forEach(item => {
          if (!seenBarcodes.has(item.barcode)) {
            seenBarcodes.add(item.barcode);
            uniquePreviewData.push(item);
          }
        });
        
        setBarcodeData(uniqueBarcodes);
        setPreviewData(uniquePreviewData);
        setSelectedRowKeys(uniquePreviewData.map(item => item.key)); // 默认全选
        setSkippedHeaders(totalSkippedHeaders);
        setPreviewVisible(true);
        
        message.success(
          `成功解析Excel文件，跳过 ${totalSkippedHeaders} 个标题行，共找到 ${uniqueBarcodes.length} 个有效条码`
        );
        
      } catch (error) {
        console.error('Excel解析失败:', error);
        message.error('Excel文件解析失败，请检查文件格式');
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      message.error('文件读取失败');
      setLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
    
    // 阻止默认上传行为
    return false;
  };

  // 确认导入数据
  const handleConfirmImport = async () => {
    // 获取选中的条码
    const selectedBarcodes = previewData
      .filter(item => selectedRowKeys.includes(item.key))
      .map(item => item.barcode);
    
    if (selectedBarcodes.length === 0) {
      message.warning('请至少选择一个条码进行导入');
      return;
    }
    
    try {
      setImportLoading(true);
      setImportProgress(0);
      
      // 模拟导入过程
      await simulateImportProgress(selectedBarcodes);
      
      // 记录导入历史
      const importRecord = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        fileName: '导入文件.xlsx', // 可以从文件对象获取真实文件名
        totalCount: selectedBarcodes.length,
        barcodes: selectedBarcodes,
        status: 'success'
      };
      
      setImportHistory(prev => [importRecord, ...prev]);
      
    if (onDataImported && typeof onDataImported === 'function') {
        onDataImported(selectedBarcodes);
    }
      
    setPreviewVisible(false);
      message.success(`已成功导入 ${selectedBarcodes.length} 个电芯条码`);
      
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败，请重试');
    } finally {
      setImportLoading(false);
      setImportProgress(0);
    }
  };

  // 取消导入
  const handleCancelImport = () => {
    if (importLoading) {
      // 如果正在导入，询问是否确认取消
      Modal.confirm({
        title: '确认取消导入？',
        content: '导入正在进行中，确认要取消吗？',
        okText: '确认取消',
        cancelText: '继续导入',
        onOk: () => {
          setImportLoading(false);
          setImportProgress(0);
          setPreviewVisible(false);
          setBarcodeData([]);
          setPreviewData([]);
          setSelectedRowKeys([]);
          setSkippedHeaders(0);
        }
      });
    } else {
    setPreviewVisible(false);
    setBarcodeData([]);
    setPreviewData([]);
      setSelectedRowKeys([]);
      setSkippedHeaders(0);
    }
  };

  // 显示导入详情
  const handleShowDetails = () => {
    setDetailVisible(true);
  };

  // 处理行选择变化
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // 全选/取消全选
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRowKeys(previewData.map(item => item.key));
    } else {
      setSelectedRowKeys([]);
    }
  };

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    onSelectAll: (selected, selectedRows, changeRows) => {
      // 这个会自动处理全选逻辑
    },
    getCheckboxProps: (record) => ({
      name: record.barcode,
      disabled: importLoading, // 导入时禁用选择
    }),
  };

  // 预览表格列配置
  const previewColumns = [
    {
      title: '工作表',
      dataIndex: 'sheet',
      key: 'sheet',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '行',
      dataIndex: 'row',
      key: 'row',
      width: 60,
      align: 'center'
    },
    {
      title: '列',
      dataIndex: 'column',
      key: 'column',
      width: 60,
      align: 'center',
      render: () => <Tag color="green">A</Tag>
    },
    {
      title: '条码数据',
      dataIndex: 'barcode',
      key: 'barcode',
      ellipsis: true,
      render: (text) => <code style={{ fontSize: '12px' }}>{text}</code>
    }
  ];

  // 导入历史表格列配置
  const historyColumns = [
    {
      title: '导入时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '条码数量',
      dataIndex: 'totalCount',
      key: 'totalCount',
      width: 100,
      align: 'center',
      render: (count) => <Tag color="blue">{count}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status === 'success' ? '成功' : '失败'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => showBarcodeDetails(record)}
        >
          查看详情
        </Button>
      )
    }
  ];

  // 显示条码详情
  const showBarcodeDetails = (record) => {
    Modal.info({
      title: '条码详情',
      width: 600,
      content: (
        <div>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="导入时间">{record.timestamp}</Descriptions.Item>
            <Descriptions.Item label="文件名">{record.fileName}</Descriptions.Item>
            <Descriptions.Item label="条码数量">{record.totalCount}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={record.status === 'success' ? 'green' : 'red'}>
                {record.status === 'success' ? '导入成功' : '导入失败'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
          
          <Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>条码列表：</Title>
          <div style={{ 
            maxHeight: 300, 
            overflow: 'auto', 
            border: '1px solid #d9d9d9', 
            borderRadius: 4,
            padding: 8,
            backgroundColor: '#fafafa'
          }}>
            {record.barcodes.map((barcode, index) => (
              <div key={index} style={{ marginBottom: 4 }}>
                <Text code copyable style={{ fontSize: '12px' }}>
                  {barcode}
                </Text>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  };

  const uploadProps = {
    accept: '.xlsx,.xls',
    beforeUpload: handleFileSelect,
    showUploadList: false,
    multiple: false,
    disabled: importLoading, // 导入时禁用上传
  };

  // 渲染导入进度页面
  const renderImportProgress = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <Spin 
        indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />}
        style={{ marginBottom: 24 }}
      />
      <h3 style={{ marginBottom: 16, color: '#1890ff' }}>正在导入电芯条码...</h3>
      <Progress 
        percent={importProgress} 
        status="active"
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
        style={{ marginBottom: 16 }}
      />
      <p style={{ color: '#666', fontSize: '14px' }}>
        正在处理 {selectedRowKeys.length} 个条码，请稍候...
      </p>
      <p style={{ color: '#999', fontSize: '12px' }}>
        请不要关闭此窗口
      </p>
    </div>
  );

  // 计算总导入数量
  const totalImportedCount = importHistory.reduce((sum, record) => 
    record.status === 'success' ? sum + record.totalCount : sum, 0
  );

  return (
    <>
      <Space>
      <Upload {...uploadProps}>
        <Button 
          type="primary" 
          icon={<FileExcelOutlined />}
          loading={loading}
            disabled={importLoading}
          style={style}
        >
          {buttonText}
        </Button>
      </Upload>

        {importHistory.length > 0 && (
          <Button 
            icon={<EyeOutlined />}
            onClick={handleShowDetails}
            disabled={importLoading}
          >
            查看已导入
          </Button>
        )}
      </Space>

      {/* 预览和导入Modal */}
      <Modal
        title={importLoading ? "导入进度" : "Excel数据预览"}
        open={previewVisible}
        onOk={handleConfirmImport}
        onCancel={handleCancelImport}
        width={900}
        okText={importLoading ? "导入中..." : `确认导入 (${selectedRowKeys.length})`}
        cancelText={importLoading ? "取消导入" : "取消"}
        okButtonProps={{ 
          disabled: selectedRowKeys.length === 0 || importLoading,
          loading: importLoading
        }}
        cancelButtonProps={{
          danger: importLoading
        }}
        closable={!importLoading}
        maskClosable={!importLoading}
      >
        {importLoading ? renderImportProgress() : (
          <>
        <div style={{ marginBottom: 16 }}>
          <p>
            <strong>解析结果：</strong>
                {skippedHeaders > 0 && (
                  <span>
                    跳过 <Tag color="orange">{skippedHeaders}</Tag> 个标题行，
                  </span>
                )}
                共找到 <Tag color="green">{barcodeData.length}</Tag> 个有效的电芯条码
          </p>
          <p style={{ fontSize: '12px', color: '#666' }}>
                以下是从Excel文件A列中解析出的有效条码数据，请选择要导入的条码：
          </p>
              
              {/* 全选控制 */}
              <div style={{ marginBottom: 12, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
                <Checkbox
                  indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < previewData.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={selectedRowKeys.length === previewData.length && previewData.length > 0}
                  disabled={importLoading}
                >
                  全选 ({selectedRowKeys.length}/{previewData.length})
                </Checkbox>
                <span style={{ marginLeft: 16, fontSize: '12px', color: '#666' }}>
                  已选择 <strong>{selectedRowKeys.length}</strong> 个条码
                </span>
              </div>
        </div>
        
        <Table
              rowSelection={rowSelection}
          columns={previewColumns}
          dataSource={previewData}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据 (已选择 ${selectedRowKeys.length} 条)`,
                disabled: importLoading
          }}
          size="small"
          scroll={{ y: 400 }}
        />
        
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            <strong>提示：</strong>
                系统只会读取Excel文件中所有工作表的A列数据，自动跳过标题行（如"条码号"、"电芯编号"等），
                并验证条码格式有效性，最后自动去重。您可以通过复选框选择要导入的条码，确认导入后，
                选中的条码将传递给父组件进行后续处理。
          </p>
            </div>
          </>
        )}
      </Modal>

      {/* 导入详情Modal */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            导入历史记录
          </Space>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Descriptions column={3} bordered size="small">
            <Descriptions.Item label="总导入次数">
              <Tag color="blue">{importHistory.length}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="成功导入条码数">
              <Tag color="green">{totalImportedCount}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="最近导入时间">
              {importHistory.length > 0 ? importHistory[0].timestamp : '暂无记录'}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Table
          columns={historyColumns}
          dataSource={importHistory}
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
            showQuickJumper: false,
            showTotal: (total) => `共 ${total} 条导入记录`
          }}
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>
    </>
  );
};

export default ExcelImportButton; 