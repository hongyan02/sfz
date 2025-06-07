"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Space, Tag, Divider, Card, Pagination, InputNumber } from "antd";
import TwoColumnTable from "../../components/cells/TwoColumnTable";
import ExcelImportButton from "../../components/ExcelImportButton";
import ExcelExportButton from "../../components/ExcelExportButton";
import { useSearchStore, useProcessDataStore } from "../../store";

/**
 * 自定义滚动条样式定义
 * @type {string}
 */
const customScrollbarStyles = `
  .custom-table-scroll {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }
  
  .custom-table-scroll::-webkit-scrollbar {
    height: 10px;
    width: 10px;
  }
  
  .custom-table-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 5px;
    margin: 2px;
  }
  
  .custom-table-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 5px;
    border: 2px solid #f1f5f9;
    min-height: 20px;
  }
  
  .custom-table-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  .custom-table-scroll::-webkit-scrollbar-corner {
    background: #f1f5f9;
    border-radius: 5px;
  }
  
  /* 确保滚动条始终可见 */
  .custom-table-scroll::-webkit-scrollbar-thumb:vertical {
    min-height: 30px;
  }
  
  .custom-table-scroll::-webkit-scrollbar-thumb:horizontal {
    min-width: 30px;
  }
`;

/**
 * 优化的表格卡片组件
 * @param {Object} props - 组件属性
 * @param {string} props.barcode - 电芯条码
 * @param {number} props.index - 索引
 * @param {Array} props.tableData - 表格数据
 * @returns {JSX.Element} 表格卡片组件
 */
const OptimizedTableCard = React.memo(({ barcode, index, tableData }) => {
    return (
        <Card
            title={
                <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">
                        电芯条码:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {barcode}
                        </code>
                    </span>
                    <Tag color="green">第 {index + 1} 个</Tag>
                </div>
            }
            size="small"
            style={{
                marginBottom: "16px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                width: "100%",
                minWidth: "100%",
            }}
            styles={{
                header: {
                    backgroundColor: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                },
                body: {
                    padding: "0",
                    width: "100%",
                },
            }}
        >
            <div
                style={{
                    width: "100%",
                    overflowX: "auto",
                    overflowY: "auto",
                    maxHeight: "70vh", // 使用视口高度，更灵活
                    minHeight: "300px", // 最小高度
                    padding: "12px",
                    paddingBottom: "20px", // 为滚动条留出空间
                    paddingRight: "20px", // 为垂直滚动条留出空间
                }}
                className="custom-table-scroll"
            >
                <TwoColumnTable data={tableData} material_lot_code={barcode} />
            </div>
        </Card>
    );
});

OptimizedTableCard.displayName = "OptimizedTableCard";

/**
 * 电芯身份证多条码查询页面
 * @returns {JSX.Element} 页面组件
 */
export default function CellsPage() {
    // 从不同的 store 获取数据和方法
    const { material_lot_code } = useSearchStore();
    const { error } = useProcessDataStore();

    // 新增状态来存储导入的电芯条码数据
    const [importedBarcodes, setImportedBarcodes] = useState([]);

    // 分页相关状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5); // 默认每页5条

    // 按需加载状态跟踪
    const [loadingPages, setLoadingPages] = useState(new Set()); // 正在加载的页面
    const [loadedPages, setLoadedPages] = useState(new Set()); // 已加载完成的页面
    const [isPageChanging, setIsPageChanging] = useState(false); // 分页切换状态

    /**
     * useEffect hook 用于样式注入和清理，防止内存泄露
     */
    useEffect(() => {
        // 只在客户端环境下执行
        if (typeof document === "undefined") return;

        // 检查是否已经存在样式元素
        const existingStyle = document.head.querySelector("style[data-custom-scrollbar]");
        if (existingStyle) return;

        // 创建并注入样式元素
        const styleElement = document.createElement("style");
        styleElement.textContent = customScrollbarStyles;
        styleElement.setAttribute("data-custom-scrollbar", "true");
        document.head.appendChild(styleElement);

        // 清理函数：组件卸载时移除样式元素
        return () => {
            const elementToRemove = document.head.querySelector("style[data-custom-scrollbar]");
            if (elementToRemove) {
                document.head.removeChild(elementToRemove);
            }
        };
    }, []);

    /**
     * useEffect hook 用于组件卸载时清理store状态，防止内存泄露
     */
    useEffect(() => {
        // 组件卸载时的清理函数
        return () => {
            // 如果有需要，可以在这里清理 processDataStore 的状态
            // 但通常 Zustand 的状态在应用级别持久化，这里不需要清理
            // 除非你想在每次进入页面时都从头开始
        };
    }, []);

    /**
     * 处理Excel导入的回调函数
     * @param {Array<string>} barcodes - 导入的条码数组
     */
    const handleDataImported = useCallback((barcodes) => {
        setImportedBarcodes(barcodes);
        setCurrentPage(1); // 重置到第一页
        // 重置加载状态
        setLoadingPages(new Set());
        setLoadedPages(new Set());
    }, []);

    /**
     * 处理翻页的回调函数
     * @param {number} page - 目标页码
     * @param {number} size - 每页大小
     */
    const handlePageChange = useCallback(
        (page, size) => {
            // 添加分页切换加载状态
            setIsPageChanging(true);

            setCurrentPage(page);
            if (size !== pageSize) {
                setPageSize(size);
                // 页面大小改变时重置加载状态
                setLoadingPages(new Set());
                setLoadedPages(new Set());
            }

            // 短暂延迟后移除加载状态，让用户感知到切换过程
            setTimeout(() => {
                setIsPageChanging(false);
            }, 300);
        },
        [pageSize]
    );

    /**
     * 监听当前页面数据加载状态 - 优化版
     */
    useEffect(() => {
        // 直接计算当前页面数据，避免依赖paginatedData造成循环
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const currentPageData = importedBarcodes.slice(startIndex, endIndex);

        if (currentPageData.length > 0) {
            // 如果页面已经加载过，直接标记为已加载
            if (loadedPages.has(currentPage)) {
                return;
            }

            // 标记当前页面开始加载
            setLoadingPages((prev) => new Set(prev).add(currentPage));

            // 优化：减少加载时间，因为数据可能已经缓存
            const loadingTime = loadedPages.size > 0 ? 500 : 1000; // 首次加载1秒，后续加载0.5秒

            const timer = setTimeout(() => {
                setLoadingPages((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(currentPage);
                    return newSet;
                });
                setLoadedPages((prev) => new Set(prev).add(currentPage));
            }, loadingTime);

            return () => clearTimeout(timer);
        }
    }, [currentPage, pageSize, importedBarcodes, loadedPages]); // 添加loadedPages到依赖

    /**
     * 简化的数据结构 - 只需要 title 和基本的 processName、title 参数
     */
    const tableData = useMemo(
        () => [
            {
                title: "原材料",
                content: [{ processName: null, title: "原材料" }],
            },
            {
                title: "浆料",
                content: [
                    { processName: "C021", title: "正极浆料" },
                    { processName: "C022", title: "陶瓷浆料" },
                    { processName: "A020", title: "负极浆料" },
                ],
            },
            {
                title: "涂布卷",
                content: [
                    { processName: "C030", title: "正极涂布卷" },
                    { processName: "A030", title: "负极涂布卷" },
                ],
            },
            {
                title: "辊分卷",
                content: [
                    { processName: "C040", title: "正极辊分卷" },
                    { processName: "A040", title: "负极辊分卷" },
                ],
            },
            {
                title: "A芯包",
                content: [
                    { processName: "S010", codeName: "E030", title: "切叠热压" },
                    { processName: "E010", codeName: "E010", title: "X-Ray01" },
                    { processName: "E020", codeName: "E020", title: "极耳预焊" },
                ],
            },
            {
                title: "B芯包",
                content: [
                    { processName: "S010", codeName: "Z100", title: "切叠热压" },
                    { processName: "E010", codeName: "E010", title: "X-Ray01" },
                    { processName: "E020", codeName: "E020", title: "极耳预焊" },
                ],
            },
            {
                title: "双芯包",
                content: [{ processName: "E030", title: "极耳终焊" }],
            },
            {
                title: "裸电芯",
                content: [
                    { processName: "E040", title: "盖板&连接片焊接前" },
                    { processName: "E050", title: "包PET膜" },
                    { processName: "E060", title: "入壳预焊" },
                    { processName: "E070", title: "盖板满焊" },
                    { processName: "E080", title: "X-Ray02" },
                    { processName: "E090", title: "前氦检" },
                    { processName: "E100", title: "真空烘烤" },
                    { processName: "E110", title: "一次注液" },
                    { processName: "F010", title: "高温静置1" },
                    { processName: "F020", title: "OCV0" },
                    { processName: "F030", title: "拔化成钉" },
                    { processName: "F040", title: "化成" },
                    { processName: "F050", title: "入化成钉" },
                    { processName: "F060", title: "高温静置2" },
                    { processName: "F070", title: "OCV1" },
                    { processName: "F080", title: "二次注液" },
                    { processName: "F090", title: "密封钉焊接" },
                ],
            },
            {
                title: "电芯",
                content: [
                    { processName: "F100", title: "后氦检" },
                    { processName: "F110", title: "加拘束1" },
                    { processName: "F120", title: "SOC调整" },
                    { processName: "F130", title: "高温静置3" },
                    { processName: "F140", title: "常温静置1" },
                    { processName: "F150", title: "OCV2" },
                    { processName: "F160", title: "常温静置2" },
                    { processName: "F170", title: "OCV3" },
                    { processName: "F180", title: "加拘束2" },
                    { processName: "F190", title: "分容" },
                    { processName: "F200", title: "常温静置3" },
                    { processName: "F210", title: "OCV4" },
                    { processName: "F220", title: "常温静置4" },
                    { processName: "F230", title: "OCV5" },
                    { processName: "F240", title: "常温静置5" },
                    { processName: "F250", title: "OCV6" },
                    { processName: "F260", title: "DCIR" },
                    { processName: "F270", title: "常温静置6" },
                    { processName: "F280", title: "OCV7" },
                    { processName: "F290", title: "常温静置7" },
                    { processName: "F300", title: "OCV8" },
                    { processName: "F310", title: "常温静置8" },
                    { processName: "F320", title: "OCV9" },
                    { processName: "P010", title: "焊缝辊压检测" },
                    { processName: "P020", title: "电芯清洗1" },
                    { processName: "P030", title: "电芯清洗2" },
                    { processName: "P040", title: "UV喷涂A" },
                    { processName: "P050", title: "UV喷涂B" },
                    { processName: "P060", title: "外观检测" },
                ],
            },
        ],
        []
    );

    /**
     * 准备导出数据格式
     * @returns {Array<Object>} 导出数据
     */
    const prepareExportData = useCallback(() => {
        return importedBarcodes.map((barcode) => ({
            barcode: barcode,
            tableData: tableData,
        }));
    }, [importedBarcodes, tableData]);

    /**
     * 优化的导出数据，使用 useMemo 缓存结果
     */
    const exportData = useMemo(() => prepareExportData(), [prepareExportData]);

    /**
     * 分页数据计算
     */
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return importedBarcodes.slice(startIndex, endIndex);
    }, [importedBarcodes, currentPage, pageSize]);

    /**
     * 渲染条码卡片
     * @returns {Array<JSX.Element>} 卡片组件数组
     */
    const renderBarcodeCards = useCallback(() => {
        return paginatedData.map((barcode, index) => {
            const actualIndex = (currentPage - 1) * pageSize + index;

            return (
                <OptimizedTableCard
                    key={`barcode-${actualIndex}-${barcode}`}
                    barcode={barcode}
                    index={actualIndex}
                    tableData={tableData}
                />
            );
        });
    }, [paginatedData, currentPage, pageSize, tableData]);

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* 顶部固定区域 - 紧凑布局 */}
            <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200">
                <div className="w-full">
                    {/* 页面标题和操作按钮区域 */}
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-bold text-gray-800">电芯身份证多条码查询</h1>
                        <div className="flex gap-3">
                            <ExcelImportButton
                                onDataImported={handleDataImported}
                                buttonText="导入电芯条码"
                                style={{ fontSize: "14px" }}
                            />
                            <ExcelExportButton
                                exportData={exportData}
                                filename="电池数据管理"
                                buttonText="导出Excel"
                                style={{ fontSize: "14px" }}
                            />
                        </div>
                    </div>

                    {/* 分页控制面板 */}
                    {importedBarcodes.length > 0 && (
                        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">总计:</span>
                                <Tag color="blue">{importedBarcodes.length} 条</Tag>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">每页显示:</span>
                                <InputNumber
                                    min={5}
                                    max={50}
                                    value={pageSize}
                                    onChange={setPageSize}
                                    size="small"
                                    style={{ width: "80px" }}
                                    disabled={isPageChanging} // 切换中禁用
                                />
                            </div>

                            <div className="text-sm text-gray-500">
                                第 {currentPage} 页，共{" "}
                                {Math.ceil(importedBarcodes.length / pageSize)} 页
                            </div>

                            {/* 分页切换状态显示 */}
                            {isPageChanging && (
                                <div className="flex items-center gap-2">
                                    <Tag color="processing" icon={<span>🔄</span>}>
                                        正在切换页面...
                                    </Tag>
                                </div>
                            )}

                            {/* 按需加载状态显示 */}
                            <div className="flex items-center gap-2">
                                {loadingPages.has(currentPage) && !isPageChanging && (
                                    <Tag color="orange" icon={<span>⏳</span>}>
                                        当前页加载中
                                    </Tag>
                                )}
                                {loadedPages.has(currentPage) &&
                                    !loadingPages.has(currentPage) &&
                                    !isPageChanging && (
                                        <Tag color="green" icon={<span>✓</span>}>
                                            当前页已加载
                                        </Tag>
                                    )}
                                <span className="text-xs text-gray-400">
                                    已缓存 {loadedPages.size} 页
                                </span>
                            </div>
                        </div>
                    )}

                    <Divider style={{ margin: "0" }} />
                </div>
            </div>

            {/* 表格区域 - 占满剩余屏幕 */}
            <div className="flex-1 overflow-hidden">
                <div
                    className="overflow-y-auto w-full h-full"
                    style={{
                        height: "100%",
                        width: "100%",
                        overflowX: "hidden",
                    }}
                >
                    <div className="p-4 w-full">
                        {/* 根据导入的条码动态创建表格组件 */}
                        {importedBarcodes.length > 0 ? (
                            <>
                                <div className="space-y-6 w-full">
                                    {/* 分页切换遮罩 */}
                                    {isPageChanging && (
                                        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
                                            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                                <span className="text-gray-600">
                                                    正在切换到第 {currentPage} 页...
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {renderBarcodeCards()}
                                </div>

                                {/* 分页控件 */}
                                <div className="flex justify-center mt-6">
                                    <Pagination
                                        current={currentPage}
                                        total={importedBarcodes.length}
                                        pageSize={pageSize}
                                        onChange={(page) => handlePageChange(page, pageSize)}
                                        onShowSizeChange={(current, size) => {
                                            handlePageChange(1, size); // 改变页面大小时回到第一页
                                        }}
                                        showSizeChanger
                                        showQuickJumper
                                        showTotal={(total, range) =>
                                            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                                        }
                                        pageSizeOptions={["5", "10", "20", "50"]}
                                        disabled={isPageChanging} // 切换中禁用分页器
                                    />
                                </div>
                            </>
                        ) : (
                            /* 提示用户导入Excel文件 */
                            <div className="text-center py-16 w-full h-full flex items-center justify-center">
                                <div className="max-w-md">
                                    <div className="text-6xl mb-4">📊</div>
                                    <h3 className="text-xl font-medium text-gray-600 mb-2">
                                        暂无数据
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        请点击上方的&ldquo;导入电芯条码&rdquo;按钮,导入Excel文件中的电芯条码数据
                                    </p>
                                    <div className="text-sm text-gray-400">
                                        <p>支持的文件格式：.xlsx, .xls</p>
                                        <p>系统将自动解析所有工作表中A1列的条码数据</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
