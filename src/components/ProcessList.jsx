"use client";
import "@ant-design/v5-patch-for-react-19";
import React, { useEffect } from "react";
import { List, Typography, Card, Spin, Empty } from "antd";
import { useSearchStore, useProcessDataStore } from "../store";

const { Title, Text } = Typography;

/**
 * 工艺流程列表组件
 * @param {Object} props
 * @param {string} props.processName - 工艺流程代码，不作为标题显示
 * @param {string} [props.title] - 显示的标题文本
 * @param {Object} [props.style] - 自定义样式
 * @param {string} [props.excludeProcessName] - 需要排除的工艺流程代码
 */
const ProcessList = ({ processName, title = "", style = {}, excludeProcessName = "" }) => {
    // 从不同的 store 获取数据和方法
    const { material_lot_code } = useSearchStore();
    const { processData, isLoading, fetchProcessData } = useProcessDataStore();

    // 当前工艺的原始数据和加载状态
    const rawCurrentData = processData[processName] || [];
    const isLoadingCurrent = isLoading[processName] || false;

    // 需要排除的工艺数据
    const excludeData = excludeProcessName ? processData[excludeProcessName] || [] : [];

    // 过滤后的当前数据（去除排除工艺的数据）
    const currentData = excludeProcessName
        ? rawCurrentData.filter((item) => !excludeData.includes(item))
        : rawCurrentData;

    // 当电芯条码变化时，获取数据
    useEffect(() => {
        if (material_lot_code) {
            fetchProcessData(processName);
            // 如果有需要排除的工艺，也要获取其数据用于过滤
            if (excludeProcessName) {
                fetchProcessData(excludeProcessName);
            }
        }
    }, [material_lot_code, processName, excludeProcessName, fetchProcessData]);

    // 如果没有提供标题，则使用工艺代码作为标题
    const displayTitle = title || processName;

    // 渲染列表项
    const renderListItems = () => {
        if (isLoadingCurrent) {
            return (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                    <Spin size="small" />
                </div>
            );
        }

        if (!material_lot_code) {
            return (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="请输入电芯条码"
                    style={{ margin: "8px 0" }}
                />
            );
        }

        if (currentData.length === 0) {
            return (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="无数据"
                    style={{ margin: "8px 0" }}
                />
            );
        }

        return (
            <List
                size="small"
                dataSource={currentData}
                renderItem={(item) => (
                    <List.Item
                        style={{ padding: "4px 0", textAlign: "center", justifyContent: "center" }}
                    >
                        <Text style={{ wordBreak: "break-all", textAlign: "center" }}>{item}</Text>
                    </List.Item>
                )}
                style={{ width: "100%" }}
            />
        );
    };

    return (
        <Card
            title={
                <div style={{ textAlign: "center", width: "100%" }}>
                    <Title level={4} style={{ margin: 0, fontSize: "16px" }}>
                        {displayTitle}
                    </Title>
                </div>
            }
            style={{
                width: "100%",
                ...style,
            }}
            styles={{
                body: {
                    padding: "4px 8px",
                    height: "auto",
                    overflow: "hidden",
                },
                header: {
                    padding: "0 8px",
                    minHeight: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                },
            }}
            size="small"
        >
            {renderListItems()}
        </Card>
    );
};

export default ProcessList;
