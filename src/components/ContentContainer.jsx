'use client';
import '@ant-design/v5-patch-for-react-19'; 
import React from 'react';
import { Typography, Card } from 'antd';

const { Title } = Typography;

/**
 * 内容容器组件
 * @param {Object} props
 * @param {string} props.title - 容器标题
 * @param {React.ReactNode} props.children - 子组件内容
 * @param {Object} [props.style] - 自定义样式
 */

const ContentContainer = ({ title, children, style = {} }) => {
  return (
    <Card 
      title={
        <div style={{ textAlign: 'center', width: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>{title}</Title>
        </div>
      } 
      style={{ 
        height: 'auto',
        padding: 0,
        ...style
      }}
      styles={{
        body: { 
          padding: '12px',
          height: 'auto',
          overflow: 'visible'
        },
        header: {
          padding: '8px 16px'
        }
      }}
    >
      {children}
    </Card>
  );
};

export default ContentContainer; 