"use client";

import React, { useEffect, useState } from "react";
import { Table, Empty, Spin } from "antd";
import { useSearchStore } from "../store";
import { fetchMaterialPro } from "../services/api";

/**
 * 工艺名称表格组件
 * @param {Object} props
 * @param {string|Array} props.processName - 工艺名称，可能是字符串或数组（作为operation_name使用）
 * @param {boolean} [props.loading] - 加载状态
 * @param {Object} [props.style] - 自定义样式
 */
const ProcessNameTable = ({ processName, loading = false, style = {} }) => {
    const { material_lot_code } = useSearchStore();
    const [apiLoading, setApiLoading] = useState(false);
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);

    // 数据排序函数
    const sortTableData = (tableData) => {
        return [...tableData].sort((a, b) => {
            const nameA = (a.name || "").toString().toLowerCase();
            const nameB = (b.name || "").toString().toLowerCase();
            return nameA.localeCompare(nameB, "zh-CN", { numeric: true });
        });
    };

    // 获取API数据
    useEffect(() => {
        const fetchData = async () => {
            if (!material_lot_code || !processName) {
                setData([]);
                return;
            }

            // 处理 processName，支持数组和单个值
            let operationNames = [];
            if (Array.isArray(processName)) {
                // 如果是数组，处理所有元素
                operationNames = processName
                    .map((name) => {
                        if (typeof name === "object" && name !== null) {
                            // 如果是对象，尝试提取字符串值
                            const values = Object.values(name);
                            return values.find((v) => typeof v === "string") || "";
                        }
                        return typeof name === "string" ? name : "";
                    })
                    .filter((name) => name); // 过滤掉空字符串
            } else {
                // 如果是单个值
                let finalOperationName = processName;
                if (typeof processName === "object" && processName !== null) {
                    // 如果是对象，尝试提取字符串值
                    const values = Object.values(processName);
                    finalOperationName = values.find((v) => typeof v === "string") || "";
                }
                if (finalOperationName && typeof finalOperationName === "string") {
                    operationNames = [finalOperationName];
                }
            }

            if (operationNames.length === 0) {
                setData([]);
                return;
            }

            setApiLoading(true);
            setError(null);

            try {
                // 对所有 operationName 并行调用 API
                const promises = operationNames.map((operationName) =>
                    fetchMaterialPro(material_lot_code, operationName)
                );

                const results = await Promise.all(promises);

                // 合并所有结果
                let allMaterials = [];
                results.forEach((result) => {
                    if (result && result.Material && Array.isArray(result.Material)) {
                        allMaterials = allMaterials.concat(result.Material);
                    }
                });

                // 去重处理（基于 MATERIAL_LOT_CODE）
                const uniqueMaterials = allMaterials.reduce((acc, item) => {
                    const key = item.MATERIAL_LOT_CODE || "";
                    if (!acc.some((existing) => existing.MATERIAL_LOT_CODE === key)) {
                        acc.push(item);
                    }
                    return acc;
                }, []);

                // 处理返回的数据
                const tableData = uniqueMaterials.map((item, index) => ({
                    key: index,
                    name: item.MATERIAL_NAME || "-",
                    value: item.MATERIAL_LOT_CODE || "-",
                }));

                // 对数据进行排序
                setData(sortTableData(tableData));
            } catch (err) {
                console.error("获取物料生产数据失败:", err);
                setError("获取数据失败，请稍后重试");
                setData([]);
            } finally {
                setApiLoading(false);
            }
        };

        fetchData();
    }, [material_lot_code, processName]);

    const isLoading = loading || apiLoading;

    // 表格列定义 - 两列，无表头
    const columns = [
        {
            dataIndex: "name",
            key: "name",
            width: "50%",
            render: (text) => <span className="font-medium text-xs">{text}</span>,
            title: "", // 空标题，不显示表头
        },
        {
            dataIndex: "value",
            key: "value",
            width: "50%",
            render: (text) => <span className="text-xs">{text}</span>,
            title: "", // 空标题，不显示表头
        },
    ];

    // 渲染表格或加载状态
    const renderContent = () => {
        if (isLoading) {
            return (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                    <Spin size="small" />
                </div>
            );
        }

        if (error) {
            return (
                <div style={{ textAlign: "center", padding: "10px 0", color: "#ff4d4f" }}>
                    {error}
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

        if (data.length === 0) {
            return (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="无数据"
                    style={{ margin: "8px 0" }}
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
                style={{ width: "100%" }}
            />
        );
    };

    return <div style={{ width: "100%", ...style }}>{renderContent()}</div>;
};

export default ProcessNameTable;
