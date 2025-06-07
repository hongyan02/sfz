"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Table, Typography, Spin, Empty } from "antd";
import { useSearchStore } from "../store";
import { fetchResultParams } from "../services/api";

const { Text } = Typography;

/**
 * 工序表格组件
 *
 * 功能特性：
 * - 支持多工艺流程数据展示
 * - 自动分组显示，每组数据用不同颜色区分
 * - 单元格合并优化显示效果
 * - 响应式表格布局
 *
 * @param {Object} props
 * @param {string|string[]} props.processName - 工艺流程代码，可以是单个值或数组
 * @param {Object} [props.style] - 自定义样式
 */
const ProcessTable = ({ processName, style = {} }) => {
    const { material_lot_code } = useSearchStore();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);

    // 使用 useMemo 缓存 processNames 数组，避免每次渲染都创建新数组
    const processNames = useMemo(() => {
        return Array.isArray(processName) ? processName : [processName];
    }, [processName]);

    // 获取数据
    useEffect(() => {
        const fetchData = async () => {
            if (!material_lot_code) {
                setData([]);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // 为每个 processName 获取实际数据
                const allData = [];

                for (const name of processNames) {
                    try {
                        // 调用 API 获取结果参数数据
                        const result = await fetchResultParams(name, material_lot_code);

                        if (
                            result &&
                            result.resultParameters &&
                            Array.isArray(result.resultParameters)
                        ) {
                            // 根据工艺代码获取工艺名称
                            const processDisplayName = getProcessName(name);

                            // 处理新的数据结构：将列式数据转换为行式数据
                            const transformedData = transformColumnDataToRows(
                                result.resultParameters,
                                processDisplayName
                            );
                            allData.push(...transformedData);
                        } else {
                            console.warn(`工艺 ${name} 返回的数据结构不符合预期:`, result);
                        }
                    } catch (err) {
                        console.error(`获取工艺 ${name} 的数据失败:`, err);
                        // 继续处理其他工艺，不中断整个循环
                    }
                }

                setData(allData);
            } catch (err) {
                console.error("获取工序数据失败:", err);
                setError("获取数据失败，请稍后重试");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [material_lot_code, processNames]);

    // 处理单元格合并
    const mergedCellsConfig = useMemo(() => {
        const config = {};

        // 计算需要合并的单元格
        if (data.length > 0) {
            // 按工序和参数类型分组，计算每个工序的总行数
            const processGroups = {};

            data.forEach((item, index) => {
                const processKey = item.process;
                if (!processGroups[processKey]) {
                    processGroups[processKey] = {
                        startIndex: index,
                        count: 0,
                    };
                }
                processGroups[processKey].count++;
            });

            // 设置工序列的合并配置
            config.processOnCell = (record, rowIndex) => {
                const processKey = record.process;
                const group = processGroups[processKey];

                if (rowIndex === group.startIndex) {
                    return {
                        rowSpan: group.count,
                        style: {
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                        },
                    };
                }

                if (rowIndex > group.startIndex && rowIndex < group.startIndex + group.count) {
                    return { rowSpan: 0 };
                }

                return { style: { whiteSpace: "nowrap" } };
            };

            // 设置参数类型列的合并配置（与工序列相同）
            config.paramTypeOnCell = (record, rowIndex) => {
                const processKey = record.process;
                const group = processGroups[processKey];

                if (rowIndex === group.startIndex) {
                    return {
                        rowSpan: group.count,
                        style: {
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                        },
                    };
                }

                if (rowIndex > group.startIndex && rowIndex < group.startIndex + group.count) {
                    return { rowSpan: 0 };
                }

                return { style: { whiteSpace: "nowrap" } };
            };

            // 设置数据组列的合并配置
            const groupMergeConfig = {};
            data.forEach((item, index) => {
                const groupKey = `${item.process}-${item.groupIndex}`;
                if (!groupMergeConfig[groupKey]) {
                    groupMergeConfig[groupKey] = {
                        startIndex: index,
                        count: 0,
                    };
                }
                groupMergeConfig[groupKey].count++;
            });

            config.groupOnCell = (record, rowIndex) => {
                const groupKey = `${record.process}-${record.groupIndex}`;
                const group = groupMergeConfig[groupKey];

                if (rowIndex === group.startIndex) {
                    // 为每组数据设置不同的背景色
                    const colors = ["#f6ffed", "#fff2e8", "#f0f5ff", "#fff1f0", "#fcffed"];
                    const backgroundColor = colors[record.groupIndex % colors.length];

                    return {
                        rowSpan: group.count,
                        style: {
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                            backgroundColor: backgroundColor,
                            borderLeft: `3px solid ${getGroupBorderColor(record.groupIndex)}`,
                            fontWeight: "bold",
                        },
                    };
                }

                if (rowIndex > group.startIndex && rowIndex < group.startIndex + group.count) {
                    return { rowSpan: 0 };
                }

                const colors = ["#f6ffed", "#fff2e8", "#f0f5ff", "#fff1f0", "#fcffed"];
                return {
                    style: {
                        whiteSpace: "nowrap",
                        backgroundColor: colors[record.groupIndex % colors.length],
                        borderLeft: `3px solid ${getGroupBorderColor(record.groupIndex)}`,
                    },
                };
            };
        }

        return config;
    }, [data]);

    // 表格列定义
    const columns = useMemo(
        () => [
            {
                title: "工序",
                dataIndex: "process",
                key: "process",
                width: "auto",
                ellipsis: false,
                onCell:
                    mergedCellsConfig.processOnCell ||
                    (() => ({ style: { whiteSpace: "nowrap" } })),
            },
            // {
            //   title: '参数类型',
            //   dataIndex: 'paramType',
            //   key: 'paramType',
            //   width: 'auto',
            //   ellipsis: false,
            //   onCell: mergedCellsConfig.paramTypeOnCell || (() => ({ style: { whiteSpace: 'nowrap' } })),
            // },
            {
                title: "数据组",
                dataIndex: "groupIndex",
                key: "groupIndex",
                width: 80,
                ellipsis: false,
                render: (groupIndex) => (
                    <Text
                        style={{
                            whiteSpace: "nowrap",
                            fontWeight: "bold",
                            color: "#1890ff",
                        }}
                    >
                        第{groupIndex + 1}组
                    </Text>
                ),
                onCell:
                    mergedCellsConfig.groupOnCell ||
                    ((record) => {
                        // 为每组数据设置不同的背景色
                        const colors = ["#f6ffed", "#fff2e8", "#f0f5ff", "#fff1f0", "#fcffed"];
                        const backgroundColor = colors[record.groupIndex % colors.length];

                        return {
                            style: {
                                whiteSpace: "nowrap",
                                backgroundColor: backgroundColor,
                                borderLeft: `3px solid ${getGroupBorderColor(record.groupIndex)}`,
                            },
                        };
                    }),
            },
            {
                title: "采集项名称",
                dataIndex: "name",
                key: "name",
                width: "auto",
                ellipsis: false,
                onCell: (record) => {
                    // 为每组数据设置不同的背景色
                    const colors = ["#f6ffed", "#fff2e8", "#f0f5ff", "#fff1f0", "#fcffed"];
                    const backgroundColor = colors[record.groupIndex % colors.length];

                    return {
                        style: {
                            whiteSpace: "nowrap",
                            backgroundColor: backgroundColor,
                        },
                    };
                },
            },
            {
                title: "数据结果",
                dataIndex: "value",
                key: "value",
                width: "auto",
                ellipsis: false,
                render: (text) => <Text style={{ whiteSpace: "nowrap" }}>{text}</Text>,
                onCell: (record) => {
                    // 为每组数据设置不同的背景色
                    const colors = ["#f6ffed", "#fff2e8", "#f0f5ff", "#fff1f0", "#fcffed"];
                    const backgroundColor = colors[record.groupIndex % colors.length];

                    return {
                        style: {
                            whiteSpace: "nowrap",
                            backgroundColor: backgroundColor,
                        },
                    };
                },
            },
        ],
        [mergedCellsConfig]
    );

    // 渲染表格或加载状态
    const renderContent = () => {
        if (loading) {
            return (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <Spin size="default" />
                </div>
            );
        }

        if (error) {
            return (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#ff4d4f" }}>
                    {error}
                </div>
            );
        }

        if (!material_lot_code) {
            return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请输入电芯条码" />;
        }

        if (data.length === 0) {
            return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无数据" />;
        }

        return (
            <Table
                columns={columns}
                dataSource={data}
                pagination={false}
                size="small"
                bordered
                style={{ width: "auto" }}
                scroll={{ x: "max-content" }}
                tableLayout="auto"
            />
        );
    };

    return <div style={{ width: "100%", overflow: "auto", ...style }}>{renderContent()}</div>;
};

/**
 * 将列式数据转换为行式数据
 *
 * 输入数据格式：
 * {
 *   "resultParameters": [
 *     { "columns": "工单编号", "rows": ["50076449", "50076449", "50076451"] },
 *     { "columns": "产出条码", "rows": ["60CESM02MB56CE01TF5J1", "60CESM02MB56CE01TF5J3", "60CESM02MB56CE01TF5L6"] }
 *   ]
 * }
 *
 * 输出数据格式（按行展开，包含分组信息）：
 * [
 *   { name: "工单编号", value: "50076449", groupIndex: 0 },     // 第一组第一列
 *   { name: "产出条码", value: "60CESM02MB56CE01TF5J1", groupIndex: 0 }, // 第一组第二列
 *   { name: "工单编号", value: "50076449", groupIndex: 1 },     // 第二组第一列
 *   { name: "产出条码", value: "60CESM02MB56CE01TF5J3", groupIndex: 1 }, // 第二组第二列
 *   ...
 * ]
 *
 * @param {Array} resultParameters - API返回的结果参数数组
 * @param {string} processDisplayName - 工艺显示名称
 * @returns {Array} - 转换后的表格数据
 */
function transformColumnDataToRows(resultParameters, processDisplayName) {
    if (!resultParameters || !Array.isArray(resultParameters) || resultParameters.length === 0) {
        return [];
    }

    const transformedData = [];

    // 找出最大的行数（所有columns中rows数组的最大长度）
    const maxRows = Math.max(
        ...resultParameters.map((param) => (param.rows ? param.rows.length : 0))
    );

    // 按行遍历，每一行包含所有列的对应数据
    // 这样确保数据按照：第一行所有列 -> 第二行所有列 -> 第三行所有列 的顺序排列
    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        // 为当前行的每个列创建一条记录
        resultParameters.forEach((param, colIndex) => {
            const columnName = param.columns || `列${colIndex + 1}`;
            const rowValue =
                param.rows && param.rows[rowIndex] !== undefined ? param.rows[rowIndex] : "";

            transformedData.push({
                key: `${processDisplayName}-结果参数-${columnName}-${rowIndex}-${colIndex}`,
                process: processDisplayName,
                paramType: "结果参数",
                name: columnName,
                value: rowValue,
                rowIndex: rowIndex, // 添加行索引用于分组
                colIndex: colIndex, // 添加列索引用于排序
                groupIndex: rowIndex, // 添加分组索引，用于区分不同组的数据
                sortOrder: rowIndex * 1000 + colIndex, // 添加排序字段确保正确顺序
            });
        });
    }

    // 按照排序字段排序，确保数据顺序正确
    return transformedData.sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * 获取分组边框颜色
 * @param {number} groupIndex - 分组索引
 * @returns {string} - 边框颜色
 */
function getGroupBorderColor(groupIndex) {
    const borderColors = ["#52c41a", "#fa8c16", "#1890ff", "#f5222d", "#a0d911"];
    return borderColors[groupIndex % borderColors.length];
}

/**
 * 获取工艺名称
 * @param {string} code - 工艺代码
 * @returns {string} - 工艺名称
 */
function getProcessName(code) {
    const processMap = {
        C021: "正极搅拌",
        C022: "陶瓷搅拌",
        C023: "底涂搅拌",
        C030: "正极涂布",
        C040: "正极辊分",
        A020: "负极搅拌",
        A030: "负极涂布",
        A040: "负极辊分",
        S010: "切叠热压",
        E010: "X-Ray01",
        E020: "极耳预焊",
        E030: "极耳终焊",
        E040: "盖板&连接片焊接前",
        E050: "包PET膜",
        E060: "入壳预焊",
        E070: "盖板满焊",
        E080: "X-Ray02",
        E090: "前氦检",
        E100: "真空烘烤",
        E110: "一次注液",
        F010: "高温静置1",
        F020: "OCV0",
        F030: "拔化成钉",
        F040: "化成",
        F050: "入化成钉",
        F060: "高温静置2",
        F070: "OCV1",
        F080: "二次注液",
        F090: "密封钉焊接",
        F100: "后氦检",
        F110: "加拘束1",
        F120: "SOC调整",
        F130: "高温静置3",
        F140: "常温静置1",
        F150: "OCV2",
        F160: "常温静置2",
        F170: "OCV3",
        F180: "加拘束2",
        F190: "分容",
        F200: "常温静置3",
        F210: "OCV4",
        F220: "常温静置4",
        F230: "OCV5",
        F240: "常温静置5",
        F250: "OCV6",
        F260: "DCIR",
        F270: "常温静置6",
        P010: "焊缝辊压检测",
        P020: "电芯清洗1",
        P030: "电芯清洗2",
        P040: "UV喷涂A",
        P050: "UV喷涂B",
        P060: "外观检测",
    };

    return processMap[code] || code;
}

export default ProcessTable;
