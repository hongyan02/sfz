"use client";

import React from "react";
import { Typography } from "antd";

const { Title } = Typography;

/**
 * 卡片组件，左右结构
 * @param {Object} props
 * @param {string} props.title - 卡片标题
 * @param {string} [props.workcell_id] - 工作单元ID
 * @param {React.ReactNode} props.children - 卡片内容
 * @param {Object} [props.style] - 自定义样式
 * @param {Object} [props.titleStyle] - 标题自定义样式
 * @param {Object} [props.contentStyle] - 内容区域自定义样式
 */
const Card = ({ title, workcell_id, children, style = {}, titleStyle = {}, contentStyle = {} }) => {
    return (
        <div
            className="flex bg-white"
            style={{
                width: "100%",
                minWidth: "350px",
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                ...style,
            }}
            data-workcell-id={workcell_id}
        >
            {/* 左侧标题区域 */}
            <div
                className="flex items-center justify-center p-4"
                style={{
                    minWidth: "120px",
                    backgroundColor: "#fafafa",
                    borderRight: "1px solid #d9d9d9",
                    ...titleStyle,
                }}
            >
                <Title level={4} style={{ margin: 0, fontSize: "16px", color: "#262626" }}>
                    {title}
                </Title>
            </div>

            {/* 右侧内容区域 */}
            <div
                className="flex-1 p-4"
                style={{
                    minWidth: "200px",
                    ...contentStyle,
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default Card;
