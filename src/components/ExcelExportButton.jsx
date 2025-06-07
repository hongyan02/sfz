"use client";

import React, { useState, useCallback } from "react";
import { Button, message, Modal, Table, Tag, Progress, Space, Divider } from "antd";
import { DownloadOutlined, FileExcelOutlined, EyeOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx-js-style";
import { fetchBatchCellData } from "../services/api";

/**
 * Excel导出按钮组件
 * @param {Object} props - 组件属性
 * @param {Array} props.exportData - 要导出的数据数组，格式：[{barcode: string, tableData: Array}]
 * @param {string} [props.filename='电芯数据'] - 导出文件名
 * @param {string} [props.buttonText='导出Excel'] - 按钮文本
 * @param {Object} [props.style={}] - 按钮样式
 * @param {boolean} [props.showPreview=false] - 是否显示预览功能
 * @returns {JSX.Element} Excel导出按钮组件
 */
const ExcelExportButton = ({
    exportData = [],
    filename = "电芯数据",
    buttonText = "导出Excel",
    style = {},
    showPreview = false,
}) => {
    const [loading, setLoading] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [currentProcessing, setCurrentProcessing] = useState({ index: 0, barcode: "", total: 0 });
    const [previewData, setPreviewData] = useState([]);
    const [fetchedData, setFetchedData] = useState(new Map()); // 缓存从API获取的数据

    /**
     * 从API获取单个电芯的完整数据
     * @param {string} barcode - 电芯条码
     * @returns {Promise<Object>} API数据
     */
    const _fetchCellData = useCallback(async (barcode) => {
        try {
            console.log(`开始获取电芯数据: ${barcode}`);
            const batchData = await fetchBatchCellData(barcode);

            // 详细调试：打印完整数据结构
            console.log(`电芯 ${barcode} 原始数据:`, batchData);

            // 检查各个数据部分
            const hasCoreBagCodes =
                batchData?.coreBagCodes && Object.keys(batchData.coreBagCodes).length > 0;
            const hasResultParams =
                batchData?.resultParams && Object.keys(batchData.resultParams).length > 0;
            const hasMaterialData = batchData?.materialData;

            console.log(`电芯 ${barcode} 数据检查:`, {
                hasCoreBagCodes,
                hasResultParams,
                hasMaterialData,
                coreBagCodesCount: hasCoreBagCodes ? Object.keys(batchData.coreBagCodes).length : 0,
                resultParamsCount: hasResultParams ? Object.keys(batchData.resultParams).length : 0,
            });

            // 详细检查每个工艺的数据
            if (hasCoreBagCodes) {
                Object.entries(batchData.coreBagCodes).forEach(([processCode, data]) => {
                    const coreBagCodes = data?.coreBagCode || [];
                    console.log(
                        `工艺 ${processCode} 芯包码数量:`,
                        coreBagCodes.length,
                        coreBagCodes
                    );
                });
            }

            if (hasResultParams) {
                Object.entries(batchData.resultParams).forEach(([processCode, data]) => {
                    const params = data?.resultParameters || [];
                    console.log(`工艺 ${processCode} 结果参数数量:`, params.length, params);
                });
            }

            // 确保返回的数据具有必要的结构
            return {
                coreBagCodes: batchData?.coreBagCodes || {},
                resultParams: batchData?.resultParams || {},
                materialData: batchData?.materialData || {
                    positive: [],
                    ceramic: [],
                    negative: [],
                },
            };
        } catch (error) {
            console.error(`获取电芯 ${barcode} 数据失败:`, error);
            return {
                coreBagCodes: {},
                resultParams: {},
                materialData: {
                    positive: [],
                    ceramic: [],
                    negative: [],
                },
            };
        }
    }, []);

    /**
     * 将API数据转换为Excel格式 - 横向展开表格格式
     * @param {Object} apiData - 从API获取的数据
     * @param {string} barcode - 电芯条码
     * @param {Array} tableData - 基础表格结构数据
     * @returns {Array} Excel行数据
     */
    const _convertApiDataToExcelRows = useCallback((apiData, barcode, tableData) => {
        const rows = [];

        console.log(`开始转换电芯 ${barcode} 的数据到Excel格式（横向展开）`);
        console.log(`API数据:`, apiData);

        // 添加电芯条码标题（带样式标记）
        rows.push([
            {
                v: `电芯条码: ${barcode}`,
                s: {
                    font: { bold: true, sz: 16 },
                    alignment: { horizontal: "center" },
                },
            },
        ]);

        tableData.forEach((section, sectionIndex) => {
            console.log(`处理分组: ${section.title}`);

            // 添加分组标题（带样式标记）
            rows.push([
                {
                    v: section.title,
                    s: {
                        font: { bold: true, sz: 14 },
                        alignment: { horizontal: "center" },
                        fill: { fgColor: { rgb: "E3F2FD" } },
                    },
                },
            ]);

            // 处理分组下的每个工序
            if (section.content && Array.isArray(section.content)) {
                // 如果是原材料，单独处理（保持原有格式）
                if (
                    section.content.length === 1 &&
                    section.content[0].processName === null &&
                    section.content[0].title === "原材料"
                ) {
                    console.log(`处理原材料数据:`, apiData.materialData);
                    console.log(`电芯 ${barcode} 完整API数据:`, apiData);

                    // 详细检查原材料数据结构
                    if (apiData && apiData.materialData) {
                        console.log(`正极浆料数据:`, apiData.materialData.positive);
                        console.log(`陶瓷浆料数据:`, apiData.materialData.ceramic);
                        console.log(`负极浆料数据:`, apiData.materialData.negative);
                    } else {
                        console.error(`电芯 ${barcode} 原材料数据为空或格式错误:`, apiData);
                    }

                    if (apiData && apiData.materialData) {
                        // 准备三种浆料的数据
                        const materialTypes = [];

                        // 收集正极浆料数据
                        console.log(`检查正极浆料数据:`, apiData.materialData.positive);
                        if (
                            apiData.materialData.positive &&
                            Array.isArray(apiData.materialData.positive) &&
                            apiData.materialData.positive.length > 0
                        ) {
                            const materials = apiData.materialData.positive.map((material) => {
                                console.log(`正极浆料项:`, material);
                                return {
                                    name: material.MATERIAL_NAME || material.material_name || "",
                                    code:
                                        material.MATERIAL_LOT_CODE ||
                                        material.material_number ||
                                        "",
                                };
                            });
                            materialTypes.push({
                                title: "正极浆料",
                                materials: materials,
                            });
                        }

                        // 收集陶瓷浆料数据
                        console.log(`检查陶瓷浆料数据:`, apiData.materialData.ceramic);
                        if (
                            apiData.materialData.ceramic &&
                            Array.isArray(apiData.materialData.ceramic) &&
                            apiData.materialData.ceramic.length > 0
                        ) {
                            const materials = apiData.materialData.ceramic.map((material) => {
                                console.log(`陶瓷浆料项:`, material);
                                return {
                                    name: material.MATERIAL_NAME || material.material_name || "",
                                    code:
                                        material.MATERIAL_LOT_CODE ||
                                        material.material_number ||
                                        "",
                                };
                            });
                            materialTypes.push({
                                title: "陶瓷浆料",
                                materials: materials,
                            });
                        }

                        // 收集负极浆料数据
                        console.log(`检查负极浆料数据:`, apiData.materialData.negative);
                        if (
                            apiData.materialData.negative &&
                            Array.isArray(apiData.materialData.negative) &&
                            apiData.materialData.negative.length > 0
                        ) {
                            const materials = apiData.materialData.negative.map((material) => {
                                console.log(`负极浆料项:`, material);
                                return {
                                    name: material.MATERIAL_NAME || material.material_name || "",
                                    code:
                                        material.MATERIAL_LOT_CODE ||
                                        material.material_number ||
                                        "",
                                };
                            });
                            materialTypes.push({
                                title: "负极浆料",
                                materials: materials,
                            });
                        }

                        // 横向排布原材料数据
                        if (materialTypes.length > 0) {
                            // 第一行：工序标题横向排列
                            const titleRow = [];
                            materialTypes.forEach((materialType, index) => {
                                // 添加工序标题，占据该工序的所有列
                                titleRow.push({
                                    v: materialType.title,
                                    s: {
                                        font: { bold: true, sz: 12 },
                                        alignment: { horizontal: "center" },
                                        fill: { fgColor: { rgb: "FFF3E0" } },
                                    },
                                });

                                // 填充该工序的其余列（每个物料名称占一列）
                                for (let i = 1; i < materialType.materials.length; i++) {
                                    titleRow.push({ v: "", s: {} });
                                }

                                // 在工序之间添加分隔列
                                if (index < materialTypes.length - 1) {
                                    titleRow.push({ v: "", s: {} });
                                }
                            });
                            rows.push(titleRow);

                            // 第二行：物料名称横向排列
                            const nameRow = [];
                            materialTypes.forEach((materialType, index) => {
                                materialType.materials.forEach((material) => {
                                    nameRow.push({
                                        v: material.name,
                                        s: {
                                            font: { bold: true, sz: 10 },
                                            fill: { fgColor: { rgb: "FFF9C4" } },
                                            alignment: { horizontal: "center" },
                                        },
                                    });
                                });

                                // 在工序之间添加分隔列
                                if (index < materialTypes.length - 1) {
                                    nameRow.push({ v: "", s: {} });
                                }
                            });
                            rows.push(nameRow);

                            // 第三行：批次号横向排列
                            const codeRow = [];
                            materialTypes.forEach((materialType, index) => {
                                materialType.materials.forEach((material) => {
                                    codeRow.push({
                                        v: material.code,
                                        s: {
                                            font: { sz: 10 },
                                            alignment: { horizontal: "center" },
                                        },
                                    });
                                });

                                // 在工序之间添加分隔列
                                if (index < materialTypes.length - 1) {
                                    codeRow.push({ v: "", s: {} });
                                }
                            });
                            rows.push(codeRow);

                            console.log(
                                `完成原材料横向排布，浆料类型数量: ${materialTypes.length}`
                            );
                        }
                    }
                } else {
                    // 横向排布多个工序
                    console.log(`横向排布 ${section.content.length} 个工序`);

                    // 收集所有工序的数据
                    const processesData = [];
                    section.content.forEach((item) => {
                        const processName = item.title || "";
                        const processCode = item.processName || item.codeName || "";

                        const processData = {
                            name: processName,
                            code: processCode,
                            coreBagCodes: [],
                            resultParams: [],
                        };

                        if (processCode) {
                            // 获取芯包码数据
                            const coreBagData =
                                apiData.coreBagCodes && apiData.coreBagCodes[processCode];
                            if (
                                coreBagData &&
                                coreBagData.coreBagCode &&
                                coreBagData.coreBagCode.length > 0
                            ) {
                                processData.coreBagCodes = coreBagData.coreBagCode;
                            }

                            // 获取结果参数数据
                            const resultParamsData =
                                apiData.resultParams && apiData.resultParams[processCode];
                            if (
                                resultParamsData &&
                                resultParamsData.resultParameters &&
                                resultParamsData.resultParameters.length > 0
                            ) {
                                processData.resultParams = resultParamsData.resultParameters;
                            }
                        }

                        processesData.push(processData);
                    });

                    // 为每个工序创建数据块
                    const processBlocks = processesData.map((processData) => {
                        const block = [];

                        // 工序标题（带样式）
                        block.push([
                            {
                                v: processData.name,
                                s: {
                                    font: { bold: true, sz: 12 },
                                    alignment: { horizontal: "center" },
                                    fill: { fgColor: { rgb: "FFF3E0" } },
                                },
                            },
                        ]);

                        // 芯包码部分
                        if (processData.coreBagCodes.length > 0) {
                            // 芯包码标题和数据横向排列
                            const coreBagRow = [
                                {
                                    v: "芯包码:",
                                    s: {
                                        font: { bold: true, sz: 11 },
                                        fill: { fgColor: { rgb: "FFF9C4" } },
                                    },
                                },
                                ...processData.coreBagCodes.map((code) => ({
                                    v: code,
                                    s: { font: { sz: 10 } },
                                })),
                            ];
                            block.push(coreBagRow);
                        }

                        // 结果参数部分 - 每个工序内部横向排列
                        if (processData.resultParams.length > 0) {
                            // 收集所有采集项名称
                            const paramNames = processData.resultParams
                                .filter((param) => param.columns)
                                .map((param) => param.columns);

                            if (paramNames.length > 0) {
                                // 采集项名称行 - 横向排列（带样式）
                                const styledParamNames = paramNames.map((name) => ({
                                    v: name,
                                    s: {
                                        font: { bold: true, sz: 11 },
                                        fill: { fgColor: { rgb: "E8F5E8" } },
                                        alignment: { horizontal: "center" },
                                    },
                                }));
                                block.push(styledParamNames);

                                // 找出最大数据行数
                                const maxDataRows = Math.max(
                                    ...processData.resultParams.map((param) =>
                                        param.rows && Array.isArray(param.rows)
                                            ? param.rows.length
                                            : 1
                                    ),
                                    1
                                );

                                // 创建参数数据行 - 每行横向排列对应参数的值（带样式）
                                for (let i = 0; i < maxDataRows; i++) {
                                    const dataRow = processData.resultParams.map((param) => {
                                        const value =
                                            param.rows && Array.isArray(param.rows)
                                                ? param.rows[i] || ""
                                                : "";
                                        return {
                                            v: value,
                                            s: {
                                                font: { sz: 10 },
                                                alignment: { horizontal: "center" },
                                            },
                                        };
                                    });
                                    block.push(dataRow);
                                }
                            }
                        }

                        return block;
                    });

                    // 计算所有工序块的最大行数
                    const maxBlockRows = Math.max(...processBlocks.map((block) => block.length), 1);

                    // 计算每个工序块的最大列数
                    const blockMaxCols = processBlocks.map((block) =>
                        Math.max(...block.map((row) => row.length), 1)
                    );

                    // 合并所有工序块为最终的Excel行
                    for (let rowIndex = 0; rowIndex < maxBlockRows; rowIndex++) {
                        const mergedRow = [];

                        processBlocks.forEach((block, blockIndex) => {
                            const blockRow = block[rowIndex] || [];
                            const maxCols = blockMaxCols[blockIndex];

                            // 添加当前块的数据
                            for (let colIndex = 0; colIndex < maxCols; colIndex++) {
                                mergedRow.push(blockRow[colIndex] || "");
                            }

                            // 在工序块之间添加分隔列（除了最后一个工序）
                            if (blockIndex < processBlocks.length - 1) {
                                mergedRow.push(""); // 分隔列
                            }
                        });

                        rows.push(mergedRow);
                    }

                    console.log(`完成横向排布，工序数量: ${processesData.length}`);
                }
            } else {
                // 如果没有内容，添加提示
                rows.push(["暂无数据"]);
                console.log(`分组 ${section.title} 暂无数据`);
            }
        });

        console.log(`电芯 ${barcode} Excel数据转换完成，共 ${rows.length} 行`);
        return rows;
    }, []);

    /**
     * 生成Excel工作簿 - 使用真实API数据，添加调试信息
     * @param {Map} dataMap - 电芯数据Map，如果不传则使用状态中的数据
     * @returns {Object} Excel工作簿对象
     */
    const _generateWorkbook = useCallback(
        (dataMap = null) => {
            // 使用传入的数据或状态中的数据
            const currentFetchedData = dataMap || fetchedData;

            console.log("开始生成Excel工作簿");
            console.log("导出数据:", exportData);
            console.log("使用的数据来源:", dataMap ? "传入参数" : "状态数据");
            console.log("已获取的数据Map大小:", currentFetchedData.size);
            console.log("已获取的数据详情:", Array.from(currentFetchedData.entries()));

            const workbook = XLSX.utils.book_new();

            if (!exportData || exportData.length === 0) {
                console.log("没有数据可导出，创建空工作表");
                // 如果没有数据，创建一个空的工作表
                const emptySheet = XLSX.utils.aoa_to_sheet([["暂无数据"]]);
                XLSX.utils.book_append_sheet(workbook, emptySheet, "电芯数据");
                return workbook;
            }

            // 收集所有电芯的数据到一个数组中
            const allSheetData = [];

            exportData.forEach((item, index) => {
                console.log(`\n--- 处理第 ${index + 1} 个电芯: ${item.barcode} ---`);

                // 获取该电芯的API数据
                const apiData = currentFetchedData.get(item.barcode);
                console.log(
                    `电芯 ${item.barcode} 在缓存中存在:`,
                    currentFetchedData.has(item.barcode)
                );
                console.log(`电芯 ${item.barcode} 的API数据:`, apiData);

                // 创建当前电芯的数据
                let currentCellData = [];

                // 添加表格数据
                if (item.tableData && Array.isArray(item.tableData)) {
                    console.log(
                        `电芯 ${item.barcode} 表格数据结构:`,
                        item.tableData.length,
                        "个分组"
                    );
                    if (apiData) {
                        console.log(`使用API数据生成Excel内容`);
                        currentCellData = _convertApiDataToExcelRows(
                            apiData,
                            item.barcode,
                            item.tableData
                        );
                    } else {
                        console.warn(`电芯 ${item.barcode} 没有API数据，使用提示信息`);
                        currentCellData = [
                            [
                                {
                                    v: `电芯条码: ${item.barcode}`,
                                    s: {
                                        font: { bold: true, sz: 14 },
                                        alignment: { horizontal: "center" },
                                        fill: { fgColor: { rgb: "FFCDD2" } },
                                    },
                                },
                            ],
                            [
                                {
                                    v: "API数据获取失败",
                                    s: { font: { sz: 12, color: { rgb: "D32F2F" } } },
                                },
                            ],
                            [{ v: "可能原因:", s: { font: { bold: true, sz: 11 } } }],
                            [{ v: "1. 网络连接问题", s: { font: { sz: 10 } } }],
                            [{ v: "2. API接口返回空数据", s: { font: { sz: 10 } } }],
                            [{ v: "3. 电芯条码不存在", s: { font: { sz: 10 } } }],
                        ];
                    }
                } else {
                    console.warn(`电芯 ${item.barcode} 没有表格数据结构`);
                    currentCellData = [
                        [
                            {
                                v: `电芯条码: ${item.barcode || "未知"}`,
                                s: {
                                    font: { bold: true, sz: 14 },
                                    alignment: { horizontal: "center" },
                                    fill: { fgColor: { rgb: "FFCDD2" } },
                                },
                            },
                        ],
                        [{ v: "暂无数据结构", s: { font: { sz: 12, color: { rgb: "D32F2F" } } } }],
                    ];
                }

                console.log(`电芯 ${item.barcode} 最终Excel数据行数:`, currentCellData.length);
                console.log(`前5行数据预览:`, currentCellData.slice(0, 5));

                // 将当前电芯的数据添加到总数据中
                allSheetData.push(...currentCellData);

                // 在电芯之间添加分隔行（除了最后一个电芯）
                if (index < exportData.length - 1) {
                    allSheetData.push([{ v: "", s: {} }]); // 空行分隔
                    allSheetData.push([
                        {
                            v: "─".repeat(50),
                            s: {
                                font: { sz: 10, color: { rgb: "BDBDBD" } },
                                alignment: { horizontal: "center" },
                            },
                        },
                    ]); // 分隔线
                    allSheetData.push([{ v: "", s: {} }]); // 空行分隔
                }
            });

            console.log(`合并后的总数据行数: ${allSheetData.length}`);

            // 创建工作表
            const worksheet = XLSX.utils.aoa_to_sheet(allSheetData);

            // 设置列宽 - 动态计算列数，考虑到单元格可能是对象格式
            const maxCols = Math.max(
                ...allSheetData.map((row) => (Array.isArray(row) ? row.length : 1)),
                1
            );
            const cols = [];
            for (let i = 0; i < maxCols; i++) {
                let maxWidth = 10; // 最小宽度
                // 计算该列的最大宽度
                for (let j = 0; j < allSheetData.length; j++) {
                    if (allSheetData[j] && allSheetData[j][i]) {
                        const cellContent =
                            typeof allSheetData[j][i] === "object"
                                ? allSheetData[j][i].v || ""
                                : allSheetData[j][i];
                        const cellLength = cellContent.toString().length;
                        if (cellLength > maxWidth) {
                            maxWidth = cellLength;
                        }
                    }
                }
                cols.push({ width: Math.min(maxWidth + 2, 50) }); // 限制最大宽度为50
            }
            worksheet["!cols"] = cols;

            XLSX.utils.book_append_sheet(workbook, worksheet, "电芯数据");
            console.log(
                `工作表 "电芯数据" 创建完成，总行数: ${allSheetData.length}，列数: ${maxCols}`
            );

            console.log("Excel工作簿生成完成，总工作表数:", workbook.SheetNames.length);
            return workbook;
        },
        [exportData, fetchedData, _convertApiDataToExcelRows]
    );

    /**
     * 处理导出操作 - 先获取API数据再导出，添加详细的错误处理和调试
     */
    const _handleExport = useCallback(async () => {
        if (!exportData || exportData.length === 0) {
            message.warning("暂无数据可导出");
            return;
        }

        setLoading(true);
        setExportProgress(0);

        try {
            // 第一阶段：获取所有电芯的API数据
            const totalCells = exportData.length;
            const fetchedDataMap = new Map();

            console.log("=== 开始导出流程 ===");
            console.log("导出数据:", exportData);
            message.info(`开始导出 ${totalCells} 个电芯的数据...`);

            // 初始化处理状态
            setCurrentProcessing({ index: 0, barcode: "", total: totalCells });

            for (let i = 0; i < exportData.length; i++) {
                const item = exportData[i];

                // 数据获取阶段占85%，每个电芯处理开始时更新进度
                const dataFetchProgress = Math.floor((i / totalCells) * 85);
                setExportProgress(dataFetchProgress);

                // 更新当前处理状态
                setCurrentProcessing({
                    index: i + 1,
                    barcode: item.barcode,
                    total: totalCells,
                });

                console.log(
                    `\n--- 处理第 ${i + 1}/${totalCells} 个电芯: ${
                        item.barcode
                    } (${dataFetchProgress}%) ---`
                );

                // 显示当前处理进度（每10个电芯或最后一个显示一次消息）
                if (i % 10 === 0 || i === totalCells - 1) {
                    message.info(
                        `正在处理第 ${i + 1}/${totalCells} 个电芯... (${dataFetchProgress}%)`
                    );
                }

                try {
                    // 检查是否已有缓存数据
                    if (fetchedData.has(item.barcode)) {
                        console.log(`使用缓存数据获取电芯 ${item.barcode} 的数据`);
                        const cachedData = fetchedData.get(item.barcode);
                        fetchedDataMap.set(item.barcode, cachedData);
                        console.log(`电芯 ${item.barcode} 使用缓存数据完成`);

                        // 缓存数据处理完成后更新进度
                        const completedProgress = Math.floor(((i + 1) / totalCells) * 85);
                        setExportProgress(completedProgress);
                        continue;
                    }

                    console.log(`调用API获取电芯 ${item.barcode} 的数据...`);
                    const apiData = await _fetchCellData(item.barcode);

                    console.log(`电芯 ${item.barcode} API调用完成，返回数据:`, apiData);

                    // 检查数据是否有效
                    const hasValidData =
                        (apiData.coreBagCodes && Object.keys(apiData.coreBagCodes).length > 0) ||
                        (apiData.resultParams && Object.keys(apiData.resultParams).length > 0) ||
                        (apiData.materialData &&
                            ((apiData.materialData.positive &&
                                apiData.materialData.positive.length > 0) ||
                                (apiData.materialData.ceramic &&
                                    apiData.materialData.ceramic.length > 0) ||
                                (apiData.materialData.negative &&
                                    apiData.materialData.negative.length > 0)));

                    console.log(`电芯 ${item.barcode} 数据有效性检查:`, hasValidData);

                    fetchedDataMap.set(item.barcode, apiData);
                    console.log(`已保存电芯 ${item.barcode} 的数据到缓存`);

                    if (hasValidData) {
                        console.log(`✅ 电芯 ${item.barcode} 数据获取成功`);
                    } else {
                        console.warn(`⚠️ 电芯 ${item.barcode} 数据为空`);
                    }

                    // API数据处理完成后更新进度
                    const completedProgress = Math.floor(((i + 1) / totalCells) * 85);
                    setExportProgress(completedProgress);
                } catch (error) {
                    console.error(`❌ 获取电芯 ${item.barcode} 数据失败:`, error);
                    // 即使失败也继续，使用空数据
                    const emptyData = {
                        coreBagCodes: {},
                        resultParams: {},
                        materialData: { positive: [], ceramic: [], negative: [] },
                    };
                    fetchedDataMap.set(item.barcode, emptyData);
                    console.log(`使用空数据填充电芯 ${item.barcode}`);

                    // 错误处理完成后也更新进度
                    const completedProgress = Math.floor(((i + 1) / totalCells) * 85);
                    setExportProgress(completedProgress);
                }
            }

            console.log("\n=== 数据获取阶段完成 ===");
            console.log("获取到的数据缓存:", fetchedDataMap);
            console.log("缓存大小:", fetchedDataMap.size);

            // 保存获取的数据（用于下次导出的缓存）
            setFetchedData(fetchedDataMap);

            // 第二阶段：生成Excel文件 (85%-95%)
            setExportProgress(88);
            message.info("正在生成Excel文件...");

            console.log("\n=== 开始生成Excel工作簿 ===");

            // 直接使用获取的数据生成工作簿，不依赖状态更新
            const workbook = _generateWorkbook(fetchedDataMap);

            // 第三阶段：文件导出 (95%-100%)
            setExportProgress(95);

            // 生成文件名
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
            const fileName = `${filename}_${timestamp}.xlsx`;

            console.log(`准备导出Excel文件: ${fileName}`);
            message.info("正在保存Excel文件...");

            // 导出文件
            XLSX.writeFile(workbook, fileName);

            setExportProgress(100);
            console.log("=== Excel导出完成 ===");
            message.success(`成功导出 ${exportData.length} 条电芯数据到 ${fileName}`);
        } catch (error) {
            console.error("=== Excel导出失败 ===", error);
            message.error(`Excel导出失败: ${error.message}`);
        } finally {
            setLoading(false);
            setExportProgress(0);
            setCurrentProcessing({ index: 0, barcode: "", total: 0 });
        }
    }, [exportData, filename, _fetchCellData, _generateWorkbook]);

    /**
     * 处理预览操作
     */
    const _handlePreview = useCallback(() => {
        if (!exportData || exportData.length === 0) {
            message.warning("暂无数据可预览");
            return;
        }

        // 准备预览数据
        const preview = exportData.map((item, index) => {
            const groupCount = item.tableData ? item.tableData.length : 0;
            const processCount = item.tableData
                ? item.tableData.reduce(
                      (total, section) => total + (section.content ? section.content.length : 0),
                      0
                  )
                : 0;

            // 检查是否有缓存的API数据
            const hasApiData = fetchedData.has(item.barcode);
            const apiData = fetchedData.get(item.barcode);
            const hasValidData =
                hasApiData &&
                apiData &&
                ((apiData.coreBagCodes && Object.keys(apiData.coreBagCodes).length > 0) ||
                    (apiData.resultParams && Object.keys(apiData.resultParams).length > 0) ||
                    (apiData.materialData &&
                        ((apiData.materialData.positive &&
                            apiData.materialData.positive.length > 0) ||
                            (apiData.materialData.ceramic &&
                                apiData.materialData.ceramic.length > 0) ||
                            (apiData.materialData.negative &&
                                apiData.materialData.negative.length > 0))));

            return {
                key: index,
                序号: index + 1,
                电芯条码: item.barcode || "未知",
                数据状态: hasValidData ? "有数据" : hasApiData ? "无有效数据" : "待获取",
                工序分组: groupCount,
                工序总数: processCount,
                备注: `${groupCount}个分组，${processCount}个工序，包含芯包码和参数数据`,
            };
        });

        setPreviewData(preview);
        setPreviewVisible(true);
    }, [exportData, fetchedData]);

    /**
     * 预览表格列配置
     */
    const previewColumns = [
        {
            title: "序号",
            dataIndex: "序号",
            key: "序号",
            width: 80,
            align: "center",
        },
        {
            title: "电芯条码",
            dataIndex: "电芯条码",
            key: "电芯条码",
            width: 200,
            render: (text) => (
                <code
                    style={{
                        backgroundColor: "#f5f5f5",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "12px",
                    }}
                >
                    {text}
                </code>
            ),
        },
        {
            title: "数据状态",
            dataIndex: "数据状态",
            key: "数据状态",
            width: 100,
            align: "center",
            render: (text) => <Tag color="processing">{text}</Tag>,
        },
        {
            title: "工序分组",
            dataIndex: "工序分组",
            key: "工序分组",
            width: 100,
            align: "center",
            render: (count) => <Tag color={count > 0 ? "blue" : "default"}>{count} 个</Tag>,
        },
        {
            title: "工序总数",
            dataIndex: "工序总数",
            key: "工序总数",
            width: 100,
            align: "center",
            render: (count) => <Tag color={count > 0 ? "success" : "default"}>{count} 个</Tag>,
        },
        {
            title: "备注",
            dataIndex: "备注",
            key: "备注",
            ellipsis: true,
        },
    ];

    return (
        <>
            <Space>
                <Button
                    type="primary"
                    icon={<FileExcelOutlined />}
                    loading={loading}
                    onClick={_handleExport}
                    disabled={!exportData || exportData.length === 0}
                    style={{
                        borderRadius: "6px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        ...style,
                    }}
                >
                    {loading ? (
                        <span>
                            {exportProgress < 85
                                ? `正在获取数据... ${exportProgress}%`
                                : exportProgress < 95
                                ? `正在生成Excel... ${exportProgress}%`
                                : `正在保存文件... ${exportProgress}%`}
                        </span>
                    ) : (
                        buttonText
                    )}
                </Button>

                {showPreview && (
                    <Button
                        icon={<EyeOutlined />}
                        onClick={_handlePreview}
                        disabled={!exportData || exportData.length === 0}
                        style={{
                            borderRadius: "6px",
                        }}
                    >
                        预览数据
                    </Button>
                )}
            </Space>

            {/* 预览模态框 */}
            <Modal
                title={
                    <Space>
                        <FileExcelOutlined />
                        <span>Excel导出预览</span>
                        <Tag color="blue">{previewData.length} 条数据</Tag>
                    </Space>
                }
                open={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setPreviewVisible(false)}>
                        取消
                    </Button>,
                    <Button
                        key="export"
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={() => {
                            setPreviewVisible(false);
                            _handleExport();
                        }}
                    >
                        确认导出
                    </Button>,
                ]}
                width={800}
                destroyOnClose
            >
                <div style={{ marginBottom: "16px" }}>
                    <Space split={<Divider type="vertical" />}>
                        <span>
                            文件名：<code>{filename}_时间戳.xlsx</code>
                        </span>
                        <span>工作表数量：{previewData.length + 1}</span>
                        <span>包含汇总表：是</span>
                    </Space>
                </div>

                <Table
                    columns={previewColumns}
                    dataSource={previewData}
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                    }}
                    size="small"
                    scroll={{ y: 400 }}
                />
            </Modal>
        </>
    );
};

export default ExcelExportButton;
