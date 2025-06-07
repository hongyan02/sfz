'use client';

import React, { useState } from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

/**
 * PDF导出按钮组件
 * @param {Object} props
 * @param {string} [props.filename] - 导出文件名
 * @param {Object} [props.style] - 按钮样式
 * @param {string} [props.targetId] - 要导出的元素ID，默认导出整个页面
 */
const ExportButton = ({ 
  filename = '电池生产线监控数据', 
  style = {},
  targetId = null
}) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    
    try {
      // 获取要导出的元素
      const element = targetId ? document.getElementById(targetId) : document.body;
      
      if (!element) {
        message.error('未找到要导出的内容');
        return;
      }

      // 动态导入所需库
      const htmlToImage = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      // 保存原始状态
      const originalStyles = await prepareForCapture(element);

      try {
        // 获取元素完整尺寸
        const scrollWidth = element.scrollWidth;
        const scrollHeight = element.scrollHeight;

        console.log('捕获尺寸:', { scrollWidth, scrollHeight });

        // html-to-image 配置选项
        const options = {
          quality: 1.0,
          pixelRatio: 1,
          width: scrollWidth,
          height: scrollHeight,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
            width: scrollWidth + 'px',
            height: scrollHeight + 'px',
            overflow: 'visible',
            position: 'static'
          },
          useCORS: true,
          allowTaint: true
        };

        // 生成高质量PNG图片
        const dataUrl = await htmlToImage.toPng(element, options);
        
        // 计算PDF尺寸（转换为mm）
        const pixelToMm = 0.264583; // 1 pixel = 0.264583 mm (96 DPI)
        const pdfWidth = Math.max(scrollWidth * pixelToMm, 210);
        const pdfHeight = Math.max(scrollHeight * pixelToMm, 297);
        
        console.log('PDF尺寸:', { pdfWidth, pdfHeight });
        
        // 创建PDF
        const pdf = new jsPDF({
          orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [pdfWidth, pdfHeight]
        });

        // 将图片添加到PDF
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        // 保存PDF
        pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);

        message.success('PDF导出成功！');

      } finally {
        // 恢复原始样式
        await restoreOriginalStyles(originalStyles);
      }
      
    } catch (error) {
      console.error('PDF导出失败:', error);
      
      // 提供更详细的错误信息
      if (error.message.includes('html-to-image')) {
        message.error('请先安装依赖：npm install html-to-image jspdf');
      } else {
        message.error('PDF导出失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 准备捕获：修改所有相关样式
  const prepareForCapture = async (element) => {
    const originalStyles = {
      element: {},
      body: {},
      html: {},
      scrollContainers: []
    };

    // 保存并修改目标元素样式
    const elementStyles = ['overflow', 'overflowX', 'overflowY', 'maxWidth', 'maxHeight', 'width', 'height'];
    elementStyles.forEach(prop => {
      originalStyles.element[prop] = element.style[prop];
    });
    
    element.style.overflow = 'visible';
    element.style.overflowX = 'visible';
    element.style.overflowY = 'visible';
    element.style.maxWidth = 'none';
    element.style.maxHeight = 'none';

    // 保存并修改body样式
    const bodyStyles = ['overflow', 'overflowX', 'overflowY', 'width', 'height'];
    bodyStyles.forEach(prop => {
      originalStyles.body[prop] = document.body.style[prop];
    });
    
    document.body.style.overflow = 'visible';
    document.body.style.overflowX = 'visible';
    document.body.style.overflowY = 'visible';

    // 保存并修改html样式
    const htmlStyles = ['overflow', 'overflowX', 'overflowY'];
    htmlStyles.forEach(prop => {
      originalStyles.html[prop] = document.documentElement.style[prop];
    });
    
    document.documentElement.style.overflow = 'visible';
    document.documentElement.style.overflowX = 'visible';
    document.documentElement.style.overflowY = 'visible';

    // 查找并修改所有可能的滚动容器
    const scrollContainers = element.querySelectorAll('*');
    scrollContainers.forEach((container, index) => {
      const computedStyle = window.getComputedStyle(container);
      if (computedStyle.overflow === 'hidden' || 
          computedStyle.overflowX === 'hidden' || 
          computedStyle.overflowY === 'hidden' ||
          computedStyle.overflow === 'auto' ||
          computedStyle.overflowX === 'auto' ||
          computedStyle.overflowY === 'auto' ||
          computedStyle.overflow === 'scroll' ||
          computedStyle.overflowX === 'scroll' ||
          computedStyle.overflowY === 'scroll') {
        
        originalStyles.scrollContainers.push({
          element: container,
          overflow: container.style.overflow,
          overflowX: container.style.overflowX,
          overflowY: container.style.overflowY
        });
        
        container.style.overflow = 'visible';
        container.style.overflowX = 'visible';
        container.style.overflowY = 'visible';
      }
    });

    // 等待DOM更新
    await new Promise(resolve => setTimeout(resolve, 100));

    return originalStyles;
  };

  // 恢复原始样式
  const restoreOriginalStyles = async (originalStyles) => {
    // 恢复目标元素样式
    Object.entries(originalStyles.element).forEach(([prop, value]) => {
      const element = targetId ? document.getElementById(targetId) : document.body;
      if (element) {
        element.style[prop] = value || '';
      }
    });

    // 恢复body样式
    Object.entries(originalStyles.body).forEach(([prop, value]) => {
      document.body.style[prop] = value || '';
    });

    // 恢复html样式
    Object.entries(originalStyles.html).forEach(([prop, value]) => {
      document.documentElement.style[prop] = value || '';
    });

    // 恢复滚动容器样式
    originalStyles.scrollContainers.forEach(({ element, overflow, overflowX, overflowY }) => {
      element.style.overflow = overflow || '';
      element.style.overflowX = overflowX || '';
      element.style.overflowY = overflowY || '';
    });

    // 等待DOM更新
    await new Promise(resolve => setTimeout(resolve, 50));
  };

  return (
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      loading={loading}
      onClick={handleExport}
      style={{
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        ...style
      }}
    >
      {loading ? '导出中...' : '导出PDF'}
    </Button>
  );
};

export default ExportButton; 
