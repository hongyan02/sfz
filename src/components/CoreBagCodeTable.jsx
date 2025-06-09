"use client";

import React, { useEffect, useState } from "react";
import { Table, Empty, Spin } from "antd";
import { useSearchStore } from "../store";
import { fetchCoreBagCode } from "../services/api";

/**
 * 芯包条码表格组件
 * @param {Object} props
 * @param {string|Array} props.processName - 工艺名称，可能是字符串或数组（作为operation_name使用）
 * @param {string} props.column1 - 第一列的名称（如：正极浆料），当有column参数时此参数无效
 * @param {string|Array<string>} [props.column] - 第一列的内容，可以是字符串（所有行使用相同名称）或数组（每行使用对应的名称），如果提供则不添加序号
 * @param {boolean} [props.loading] - 加载状态
 * @param {Object} [props.style] - 自定义样式
 */
const CoreBagCodeTable = ({
    processName,
    column1 = "条码项目",
    column,
    loading = false,
    style = {},
}) => {
    const { material_lot_code } = useSearchStore();
    const [apiLoading, setApiLoading] = useState(false);
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);

    /**
     * 数据排序函数
     * @param {Array} tableData - 表格数据
     * @returns {Array} 排序后的数据
     */
    const _sortTableData = (tableData) => {
        return [...tableData].sort((a, b) => {
            const nameA = (a.name || "").toString().toLowerCase();
            const nameB = (b.name || "").toString().toLowerCase();
            return nameA.localeCompare(nameB, "zh-CN", { numeric: true });
        });
    };

    // 获取API数据
    useEffect(() => {
        /**
         * 获取条码数据
         */
        const _fetchData = async () => {
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
                    fetchCoreBagCode(material_lot_code, operationName)
                );

                const results = await Promise.all(promises);

                // 合并所有结果
                let allCoreBagCodes = [];
                results.forEach((result) => {
                    if (result && result.coreBagCode && Array.isArray(result.coreBagCode)) {
                        allCoreBagCodes = allCoreBagCodes.concat(result.coreBagCode);
                    }
                });

                // 去重处理
                const uniqueCoreBagCodes = [...new Set(allCoreBagCodes)].filter(
                    (code) => code && code.trim()
                );

                // 处理返回的数据，格式化为表格数据
                const tableData = uniqueCoreBagCodes.map((code, index) => ({
                    key: index,
                    name: column
                        ? Array.isArray(column) && column[index]
                            ? column[index]
                            : typeof column === "string"
                            ? column
                            : `${column1}${index + 1}`
                        : `${column1}${index + 1}`,
                    value: code,
                }));

                // 对数据进行排序
                setData(_sortTableData(tableData));
            } catch (err) {
                console.error("获取芯包条码数据失败:", err);
                setError("获取数据失败，请稍后重试");
                setData([]);
            } finally {
                setApiLoading(false);
            }
        };

        _fetchData();
    }, [material_lot_code, processName, column1, column]);

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

    /**
     * 渲染表格内容
     * @returns {JSX.Element} 表格内容
     */
    const _renderContent = () => {
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

    return <div style={{ width: "100%", ...style }}>{_renderContent()}</div>;
};

export default CoreBagCodeTable;
