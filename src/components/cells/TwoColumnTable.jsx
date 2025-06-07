import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Table, Spin, Button } from "antd";
import { CaretRightOutlined, CaretDownOutlined } from "@ant-design/icons";
import { useSearchStore } from "../../store";
import MaterialTableNew from "./MaterialTableNew";
import { fetchBatchCellData } from "../../services/api";

/**
 * 全局数据缓存 - 按需加载的数据缓存
 * 性能优化：避免重复API调用，提高分页切换速度
 */
const globalDataCache = new Map();

/**
 * 预处理数据缓存 - 避免重复计算
 */
const processedDataCache = new Map();

/**
 * 缓存清理机制 - 避免内存泄露
 */
const MAX_CACHE_SIZE = 100; // 最大缓存100个电芯数据

const addToCache = (key, data) => {
    // 如果缓存超出限制，删除最早的数据
    if (globalDataCache.size >= MAX_CACHE_SIZE) {
        const firstKey = globalDataCache.keys().next().value;
        globalDataCache.delete(firstKey);
        processedDataCache.delete(firstKey);
    }
    globalDataCache.set(key, data);
};

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

/**
 * 预处理数据 - 将复杂计算移到渲染外
 * @param {Object} batchData - 原始批量数据
 * @param {string} materialLotCode - 电芯条码
 * @returns {Object} 预处理后的数据
 */
const preprocessBatchData = (batchData, materialLotCode) => {
    // 检查缓存
    const cacheKey = `${materialLotCode}_processed`;
    if (processedDataCache.has(cacheKey)) {
        return processedDataCache.get(cacheKey);
    }

    const processed = {
        materialData: batchData?.materialData || {},
        processData: {},
    };

    // 预处理所有工艺数据
    if (batchData?.coreBagCodes && batchData?.resultParams) {
        Object.keys(batchData.coreBagCodes).forEach((processKey) => {
            const coreBagData = batchData.coreBagCodes[processKey] || { coreBagCode: [] };
            const resultParamsData = batchData.resultParams[processKey] || {
                resultParameters: [],
            };

            // 预处理芯包码数据
            let coreBagCodes = [];
            if (coreBagData && Array.isArray(coreBagData)) {
                coreBagCodes = coreBagData;
            } else if (
                coreBagData &&
                coreBagData.coreBagCode &&
                Array.isArray(coreBagData.coreBagCode)
            ) {
                coreBagCodes = coreBagData.coreBagCode;
            } else if (coreBagData && coreBagData.core_bag_code) {
                coreBagCodes = [coreBagData.core_bag_code];
            } else if (coreBagData && Array.isArray(coreBagData.data)) {
                coreBagCodes = coreBagData.data;
            }

            // 预处理结果参数数据
            const resultParameters = resultParamsData.resultParameters || [];
            const processedParams = {
                columns: [],
                dataRows: [],
            };

            if (resultParameters.length > 0) {
                resultParameters.forEach((item, itemIndex) => {
                    if (item.columns && item.rows && Array.isArray(item.rows)) {
                        processedParams.columns.push({
                            title: item.columns,
                            dataIndex: `param_${itemIndex}`,
                            key: `param_${itemIndex}`,
                            width: 120,
                        });
                    }
                });

                // 预生成数据行
                if (processedParams.columns.length > 0) {
                    const maxRows = Math.max(
                        ...resultParameters.map((item) =>
                            item.rows && Array.isArray(item.rows) ? item.rows.length : 1
                        ),
                        1
                    );

                    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
                        const rowData = { key: `result_row_${rowIndex}` };

                        resultParameters.forEach((item, itemIndex) => {
                            if (item.rows && Array.isArray(item.rows)) {
                                rowData[`param_${itemIndex}`] = item.rows[rowIndex] || "-";
                            } else {
                                rowData[`param_${itemIndex}`] = "-";
                            }
                        });

                        processedParams.dataRows.push(rowData);
                    }
                }
            }

            processed.processData[processKey] = {
                coreBagCodes,
                resultParams: processedParams,
                hasData: coreBagCodes.length > 0 || processedParams.columns.length > 0,
            };
        });
    }

    // 缓存预处理结果
    processedDataCache.set(cacheKey, processed);
    return processed;
};

/**
 * 双列表格组件 - 高性能版本
 * @param {Object} props - 组件属性
 * @param {Array} props.data - 表格数据
 * @param {string} props.material_lot_code - 电芯条码
 * @returns {JSX.Element} 表格组件
 */
const TwoColumnTable = ({ data, material_lot_code }) => {
    const { material_lot_code: storeMaterialLotCode } = useSearchStore();

    // 按需加载的数据状态
    const [batchData, setBatchData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 懒加载状态 - 哪些行已展开
    const [expandedRows, setExpandedRows] = useState(new Set());

    // 统一的单元格背景色
    const cellBackgroundColor = "#f8fafc";

    const effectiveMaterialLotCode = material_lot_code || storeMaterialLotCode;

    // 按需加载数据 - 优化版
    const fetchDataOnDemand = useCallback(async () => {
        if (!effectiveMaterialLotCode) {
            return;
        }

        // 检查全局缓存 - 性能优化关键点
        if (globalDataCache.has(effectiveMaterialLotCode)) {
            setBatchData(globalDataCache.get(effectiveMaterialLotCode));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await fetchBatchCellData(effectiveMaterialLotCode);

            // 存储到全局缓存 - 使用优化的缓存函数
            addToCache(effectiveMaterialLotCode, result);
            setBatchData(result);
        } catch (err) {
            console.error("❌ 按需加载数据失败:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [effectiveMaterialLotCode, material_lot_code, storeMaterialLotCode]);

    useEffect(() => {
        fetchDataOnDemand();
    }, [fetchDataOnDemand]);

    // 预处理数据 - 使用 useMemo 缓存结果
    const processedData = useMemo(() => {
        if (!batchData || !effectiveMaterialLotCode) return null;
        return preprocessBatchData(batchData, effectiveMaterialLotCode);
    }, [batchData, effectiveMaterialLotCode]);

    // 切换行展开状态
    const toggleRowExpansion = useCallback((rowKey) => {
        setExpandedRows((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(rowKey)) {
                newSet.delete(rowKey);
            } else {
                newSet.add(rowKey);
            }
            return newSet;
        });
    }, []);

    // 定义主表格列
    const columns = [
        {
            title: "工艺名称",
            dataIndex: "title",
            key: "title",
            width: 150,
            onCell: () => ({
                style: {
                    backgroundColor: cellBackgroundColor,
                    padding: "8px",
                    verticalAlign: "top",
                },
            }),
            render: (text, record) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Button
                        type="text"
                        size="small"
                        icon={
                            expandedRows.has(record.key) ? (
                                <CaretDownOutlined />
                            ) : (
                                <CaretRightOutlined />
                            )
                        }
                        onClick={() => toggleRowExpansion(record.key)}
                        style={{
                            padding: 0,
                            width: "auto",
                            height: "auto",
                            border: "none",
                            background: "none",
                        }}
                    />
                    <span className="font-medium text-gray-700">{text}</span>
                </div>
            ),
        },
    ];

    // 优化的原材料表格组件 - 轻量级版本
    const MaterialTable = React.memo(() => {
        if (loading) {
            return (
                <div style={{ width: "600px", textAlign: "left", padding: "20px" }}>
                    <Spin size="small" />
                    <span style={{ marginLeft: "8px" }}>正在加载原材料数据...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div style={{ width: "600px", textAlign: "left", padding: "20px", color: "red" }}>
                    加载失败: {error}
                </div>
            );
        }

        if (!processedData?.materialData) {
            return (
                <div style={{ width: "600px", textAlign: "left", padding: "20px" }}>
                    暂无原材料数据
                </div>
            );
        }

        return (
            <MaterialTableNew
                material_lot_code={material_lot_code}
                storeMaterialLotCode={storeMaterialLotCode}
            />
        );
    });

    MaterialTable.displayName = "MaterialTable";

    /**
     * 优化的嵌套表格组件 - 使用预处理数据
     */
    const NestedTable = React.memo(({ processName, codeName, title }) => {
        if (loading) {
            return (
                <div style={{ padding: "20px", textAlign: "left" }}>
                    <Spin size="small" />
                    <span style={{ marginLeft: "8px" }}>正在加载数据...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div style={{ padding: "20px", textAlign: "left", color: "red" }}>
                    加载失败: {error}
                </div>
            );
        }

        // 优先使用 codeName，如果没有则使用 processName
        const dataKey = codeName || processName;

        // 获取数据，如果没有数据则使用空结构
        const processData = processedData?.processData[dataKey] || {
            coreBagCodes: [],
            resultParams: { columns: [], dataRows: [] },
            hasData: false,
        };

        const { coreBagCodes, resultParams } = processData;

        // 生成条码表格列
        const coreBagColumns = [
            {
                title: "芯包码",
                dataIndex: "code",
                key: "code",
                width: 120,
                onCell: () => ({
                    style: {
                        backgroundColor: cellBackgroundColor,
                        fontSize: "12px",
                        padding: "6px 8px",
                        textAlign: "left",
                        verticalAlign: "top",
                    },
                }),
            },
        ];

        // 生成条码数据源
        const coreBagDataSource =
            coreBagCodes.length > 0
                ? coreBagCodes.map((code, index) => ({
                      key: `coreBag_${index}`,
                      code: code || "暂无数据",
                  }))
                : [{ key: "no_data", code: "暂无数据" }];

        // 渲染结果参数表格
        const renderResultParamsTable = () => {
            if (resultParams.columns.length === 0) {
                // 即使没有数据，也显示基本的表格结构
                const defaultColumns = [];

                const defaultDataSource = [
                    {
                        key: "no_data",
                        code: "暂无数据",
                        time: "暂无数据",
                        result: "暂无数据",
                    },
                ];

                return (
                    <div>
                        <div
                            style={{
                                padding: "8px 12px",
                                backgroundColor: "#e0f2fe",
                                border: "1px solid #d1d5db",
                                borderBottom: "none",
                                fontSize: "13px",
                                fontWeight: "bold",
                                textAlign: "left",
                                color: "#0369a1",
                            }}
                        >
                            {title}
                        </div>
                        <Table
                            columns={defaultColumns}
                            dataSource={defaultDataSource}
                            pagination={false}
                            showHeader={true}
                            size="small"
                            bordered
                            scroll={{ x: defaultColumns.length * 120 }}
                            style={{
                                marginTop: "0px",
                                borderTop: "none",
                            }}
                        />
                    </div>
                );
            }

            // 为所有列添加样式
            const styledColumns = resultParams.columns.map((col) => ({
                ...col,
                onCell: () => ({
                    style: {
                        backgroundColor: cellBackgroundColor,
                        fontSize: "12px",
                        padding: "6px 8px",
                        textAlign: "left",
                        verticalAlign: "top",
                    },
                }),
            }));

            return (
                <div>
                    <div
                        style={{
                            padding: "8px 12px",
                            backgroundColor: "#e0f2fe",
                            border: "1px solid #d1d5db",
                            borderBottom: "none",
                            fontSize: "13px",
                            fontWeight: "bold",
                            textAlign: "left",
                            color: "#0369a1",
                        }}
                    >
                        {title}
                    </div>
                    <Table
                        columns={styledColumns}
                        dataSource={resultParams.dataRows}
                        pagination={false}
                        showHeader={true}
                        size="small"
                        bordered
                        scroll={{ x: styledColumns.length * 120 }}
                        style={{
                            marginTop: "0px",
                            borderTop: "none",
                        }}
                    />
                </div>
            );
        };

        return (
            <div style={{ width: "100%" }}>
                {/* 芯包码表格 */}
                <div>
                    <div
                        style={{
                            padding: "8px 12px",
                            backgroundColor: "#fef3c7",
                            border: "1px solid #d1d5db",
                            borderBottom: "none",
                            fontSize: "13px",
                            fontWeight: "bold",
                            textAlign: "left",
                            color: "#92400e",
                        }}
                    >
                        {title}
                    </div>
                    <Table
                        columns={coreBagColumns}
                        dataSource={coreBagDataSource}
                        pagination={false}
                        showHeader={true}
                        size="small"
                        bordered
                        scroll={false}
                        style={{
                            marginBottom: "8px",
                            borderTop: "none",
                        }}
                    />
                </div>

                {/* 结果参数表格 */}
                {renderResultParamsTable()}
            </div>
        );
    });

    NestedTable.displayName = "NestedTable";

    /**
     * 懒加载的多数据源表格组件
     */
    const LazyMultiSourceTable = React.memo(({ content, rowKey }) => {
        // 只有在展开时才渲染
        if (!expandedRows.has(rowKey)) {
            return null;
        }

        if (!content || !Array.isArray(content) || content.length === 0) {
            return <div>暂无数据</div>;
        }

        return (
            <div style={{ display: "flex", gap: "16px", width: "max-content" }}>
                {content.map((item, index) => (
                    <div key={index} style={{ flex: "none" }}>
                        {item.processName === null && item.title === "原材料" ? (
                            <MaterialTable />
                        ) : (
                            <NestedTable
                                processName={item.processName}
                                codeName={item.codeName}
                                title={item.title}
                            />
                        )}
                    </div>
                ))}
            </div>
        );
    });

    LazyMultiSourceTable.displayName = "LazyMultiSourceTable";

    // 转换数据格式 - 支持新的数组结构
    const dataSource = useMemo(() => {
        return data.map((row, index) => ({
            key: index,
            title: row.title,
            content: row.content,
        }));
    }, [data]);

    return (
        <div style={{ width: "max-content", minWidth: "100%" }}>
            <div style={{ position: "relative" }}>
                {/* 固定的第一列 - 绝对定位 */}
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "300px",
                        backgroundColor: cellBackgroundColor,
                        border: "1px solid #d1d5db",
                        borderRight: "1px solid #d1d5db",
                        zIndex: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "100%",
                        boxSizing: "border-box",
                    }}
                    className="absolute-material-column"
                >
                    <div className="font-bold text-gray-800 text-center px-2 break-words">
                        {material_lot_code || "暂无批次号"}
                    </div>
                </div>

                {/* 主表格部分 */}
                <div style={{ marginLeft: "300px", width: "max-content" }}>
                    <Table
                        columns={columns}
                        dataSource={dataSource}
                        pagination={false}
                        showHeader={false}
                        size="small"
                        bordered
                        scroll={false}
                        style={{ width: "max-content" }}
                        tableLayout="auto"
                        rowClassName="hover:bg-gray-50"
                        expandable={{
                            expandedRowRender: (record) => (
                                <div style={{ margin: 0, padding: 0, width: "max-content" }}>
                                    <LazyMultiSourceTable
                                        content={record.content}
                                        rowKey={record.key}
                                    />
                                </div>
                            ),
                            rowExpandable: () => true,
                            expandedRowKeys: Array.from(expandedRows),
                            onExpand: (expanded, record) => {
                                // 这个方法会被 Table 调用，但我们已经通过按钮控制了
                            },
                            expandIcon: () => null, // 隐藏默认的展开图标
                            expandRowByClick: false,
                            showExpandColumn: false,
                        }}
                    />
                </div>
            </div>

            {/* CSS 样式 */}
            <style jsx>{`
                .absolute-material-column {
                    height: 100% !important;
                }

                .ant-table-tbody > tr > td:first-child {
                    border-left: none !important;
                }
            `}</style>
        </div>
    );
};

export default TwoColumnTable;
