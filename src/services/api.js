/**
 * API 服务层 - 直接调用外部API
 * 提供与后端 API 交互的方法，绕过 Next.js API 路由
 */

import { API_CONFIG } from "../config/api";

/**
 * 请求缓存 - 避免重复请求相同的数据
 */
const requestCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

/**
 * 请求队列管理 - 已移除并发限制，直接执行请求
 */

/**
 * 生成缓存键
 * @param {string} url - 请求URL
 * @param {Object} body - 请求体
 * @returns {string} 缓存键
 */
const getCacheKey = (url, body) => {
    return `${url}_${JSON.stringify(body)}`;
};

/**
 * 检查缓存是否有效
 * @param {Object} cacheItem - 缓存项
 * @returns {boolean} 是否有效
 */
const isCacheValid = (cacheItem) => {
    return cacheItem && Date.now() - cacheItem.timestamp < CACHE_TTL;
};

/**
 * 通用的API请求函数，带重试机制、缓存和请求队列管理
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 * @param {number} retries - 重试次数
 * @param {boolean} useCache - 是否使用缓存
 * @returns {Promise<Response>} - 响应对象
 */
const fetchWithRetry = async (
    url,
    options = {},
    retries = API_CONFIG.REQUEST.DEFAULT_RETRIES,
    useCache = true
) => {
    // 检查缓存
    if (useCache && options.method === "POST") {
        const cacheKey = getCacheKey(url, options.body);
        const cachedItem = requestCache.get(cacheKey);

        if (isCacheValid(cachedItem)) {
            console.log(`使用缓存数据: ${cacheKey}`);
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(cachedItem.data),
            });
        }
    }

    // 直接执行请求，无并发限制
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers,
                },
            });

            if (response.ok) {
                // 缓存成功的响应
                if (useCache && options.method === "POST") {
                    const data = await response.clone().json();
                    const cacheKey = getCacheKey(url, options.body);
                    requestCache.set(cacheKey, {
                        data,
                        timestamp: Date.now(),
                    });

                    // 清理过期缓存
                    if (requestCache.size > 100) {
                        const now = Date.now();
                        for (const [key, item] of requestCache.entries()) {
                            if (now - item.timestamp > CACHE_TTL) {
                                requestCache.delete(key);
                            }
                        }
                    }
                }

                return response;
            }

            // 如果是最后一次重试，抛出错误
            if (i === retries) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }

            // 等待一段时间后重试，使用指数退避
            const delay = Math.min(
                API_CONFIG.REQUEST.RETRY_DELAY_BASE * (i + 1),
                API_CONFIG.REQUEST.MAX_RETRY_DELAY
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
        } catch (error) {
            if (i === retries) {
                throw error;
            }
            // 等待一段时间后重试
            const delay = Math.min(
                API_CONFIG.REQUEST.RETRY_DELAY_BASE * (i + 1),
                API_CONFIG.REQUEST.MAX_RETRY_DELAY
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
};

/**
 * 获取芯包码数据 - 直接调用外部API
 * @param {string} material_lot_code - 电芯条码
 * @param {string} operation_name - 工艺代码
 * @returns {Promise<{coreBagCode: string[]}>} - 芯包码数据
 */
export const fetchCoreBagCode = async (material_lot_code, operation_name) => {
    try {
        const response = await fetchWithRetry(
            API_CONFIG.buildUrl(API_CONFIG.ENDPOINTS.CORE_BAG_CODE),
            {
                method: "POST",
                body: JSON.stringify({
                    material_lot_code,
                    operation_name,
                }),
            }
        );

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("获取芯包码数据失败:", error);
        // 返回空数据，避免前端报错
        return { coreBagCode: [] };
    }
};

/**
 * 获取结果参数数据 - 直接调用外部API
 * @param {string} processName - 工艺流程代码
 * @param {string} material_lot_code - 电芯条码
 * @returns {Promise<Object>} - 结果参数数据
 */
export async function fetchResultParams(processName, material_lot_code) {
    try {
        const response = await fetchWithRetry(
            API_CONFIG.buildUrl(API_CONFIG.ENDPOINTS.RESULT_PARAMS),
            {
                method: "POST",
                body: JSON.stringify({
                    material_lot_code,
                    operation_name: processName,
                }),
            }
        );

        const data = await response.json();

        // 保持与前端组件的兼容性
        return {
            resultParameters: data.resultParameters || [],
        };
    } catch (error) {
        console.error("获取结果参数数据失败:", error);
        return { resultParameters: [] };
    }
}

/**
 * 获取物料生产数据 - 直接调用外部API（连环调用）
 * 先调用 coreBagCode 接口获取芯包码，再调用 material-pro 接口获取物料数据
 * @param {string} material_lot_code - 电芯条码
 * @param {string} operation_name - 工艺代码
 * @returns {Promise<Object>} - 物料生产数据
 */
export async function fetchMaterialPro(material_lot_code, operation_name) {
    try {
        console.log(`fetchMaterialPro 开始: 电芯=${material_lot_code}, 工艺=${operation_name}`);

        // 第一步：获取芯包码
        const coreBagCodeResponse = await fetchWithRetry(
            API_CONFIG.buildUrl(API_CONFIG.ENDPOINTS.CORE_BAG_CODE),
            {
                method: "POST",
                body: JSON.stringify({
                    material_lot_code,
                    operation_name,
                }),
            }
        );

        const coreBagCodeData = await coreBagCodeResponse.json();
        console.log(
            `fetchMaterialPro 芯包码API响应: 电芯=${material_lot_code}, 工艺=${operation_name}`,
            coreBagCodeData
        );

        // 提取芯包码数组
        let coreBagCodes = [];
        if (coreBagCodeData && Array.isArray(coreBagCodeData)) {
            coreBagCodes = coreBagCodeData;
        } else if (
            coreBagCodeData &&
            coreBagCodeData.coreBagCode &&
            Array.isArray(coreBagCodeData.coreBagCode)
        ) {
            // 处理 {coreBagCode: [...]} 格式
            coreBagCodes = coreBagCodeData.coreBagCode;
        } else if (coreBagCodeData && coreBagCodeData.core_bag_code) {
            coreBagCodes = [coreBagCodeData.core_bag_code];
        } else if (coreBagCodeData && Array.isArray(coreBagCodeData.data)) {
            coreBagCodes = coreBagCodeData.data;
        } else {
            // 尝试从响应中提取所有可能的芯包码字段
            const extractCoreBagCodes = (obj) => {
                const codes = [];
                if (typeof obj === "object" && obj !== null) {
                    Object.values(obj).forEach((value) => {
                        if (typeof value === "string" && value.length > 0) {
                            codes.push(value);
                        } else if (Array.isArray(value)) {
                            codes.push(...value);
                        } else if (typeof value === "object") {
                            codes.push(...extractCoreBagCodes(value));
                        }
                    });
                }
                return codes;
            };
            coreBagCodes = extractCoreBagCodes(coreBagCodeData);
        }

        // 如果没有获取到芯包码，返回空结果
        if (!coreBagCodes.length) {
            console.warn(
                `fetchMaterialPro 没有获取到芯包码: 电芯=${material_lot_code}, 工艺=${operation_name}`
            );
            return { Material: [] };
        }

        console.log(
            `fetchMaterialPro 提取到芯包码: 电芯=${material_lot_code}, 工艺=${operation_name}`,
            coreBagCodes
        );

        // 第二步：使用每个芯包码调用 material-pro 接口
        const materialProPromises = coreBagCodes.map(async (coreBagCode) => {
            try {
                const response = await fetchWithRetry(
                    API_CONFIG.buildUrl(API_CONFIG.ENDPOINTS.MATERIAL_PRO),
                    {
                        method: "POST",
                        body: JSON.stringify({
                            core_bag_code: coreBagCode,
                        }),
                    }
                );

                const data = await response.json();
                return data;
            } catch (error) {
                console.warn(`material-pro API 请求错误 (芯包码: ${coreBagCode}):`, error);
                return { Material: [] };
            }
        });

        // 等待所有请求完成
        const materialProResults = await Promise.all(materialProPromises);

        // 合并所有结果
        const allMaterials = [];
        materialProResults.forEach((result) => {
            if (result && result.Material && Array.isArray(result.Material)) {
                allMaterials.push(...result.Material);
            }
        });

        // 返回合并后的结果
        const result = {
            Material: allMaterials,
            metadata: {
                coreBagCodesUsed: coreBagCodes,
                totalMaterials: allMaterials.length,
                requestsCount: coreBagCodes.length,
            },
        };

        console.log(
            `fetchMaterialPro 完成: 电芯=${material_lot_code}, 工艺=${operation_name}`,
            result
        );
        return result;
    } catch (error) {
        console.error("获取物料生产数据失败:", error);
        return { Material: [] };
    }
}

/**
 * 获取物料终点数据 - 直接调用外部API
 * @param {string} material_lot_code - 电芯条码
 * @param {string} [workcell_id] - 工作单元ID（可选）
 * @returns {Promise<Object>} - 物料终点数据
 */
export async function fetchMaterialEnd(material_lot_code, workcell_id = "") {
    try {
        const response = await fetchWithRetry(
            API_CONFIG.buildUrl(API_CONFIG.ENDPOINTS.MATERIAL_END),
            {
                method: "POST",
                body: JSON.stringify({
                    material_lot_code,
                    workcell_id,
                }),
            }
        );

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("获取物料终点数据失败:", error);
        return { materialEnd: [] };
    }
}

/**
 * 获取工艺流程数据 - 直接调用外部API
 * @param {string} processName - 工艺流程代码
 * @param {string} material_lot_code - 电芯条码
 * @returns {Promise<Array>} - 工艺流程数据
 */
export async function fetchProcessData(processName, material_lot_code) {
    try {
        // 注意：这个API可能需要根据实际的外部API调整
        const response = await fetchWithRetry(
            API_CONFIG.buildUrl(API_CONFIG.ENDPOINTS.PROCESS_DATA),
            {
                method: "POST",
                body: JSON.stringify({
                    material_lot_code,
                    operation_name: processName,
                }),
            }
        );

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("获取工艺流程数据失败:", error);
        return [];
    }
}

/**
 * 批量获取电芯数据 - 优化版本，减少API调用和OPTIONS请求
 * @param {string} material_lot_code - 电芯条码
 * @returns {Promise<Object>} - 包含所有需要的数据
 */
export const fetchBatchCellData = async (material_lot_code) => {
    try {
        console.log(`开始批量获取电芯数据: ${material_lot_code}`);

        // 定义需要获取的工艺列表
        const processNames = [
            "C021",
            "C022",
            "A020", // 原材料相关
            "C030",
            "C040",
            "A030",
            "A040", // 涂布卷相关
            "S010",
            "E010",
            "E020",
            "E030", // 芯包相关
            "E040",
            "E050",
            "E060",
            "E070",
            "E080",
            "E090",
            "E100",
            "E110", // 裸电芯相关
            "F010",
            "F020",
            "F030",
            "F040",
            "F050",
            "F060",
            "F070",
            "F080",
            "F090", // 裸电芯相关
            "F100",
            "F110",
            "F120",
            "F130",
            "F140",
            "F150",
            "F160",
            "F170",
            "F180",
            "F190", // 电芯相关
            "F200",
            "F210",
            "F220",
            "F230",
            "F240",
            "F250",
            "F260",
            "F270",
            "F280",
            "F290", // 电芯相关
            "F300",
            "F310",
            "F320",
            "P010",
            "P020",
            "P030",
            "P040",
            "P050",
            "P060", // 电芯相关
        ];

        // 完全并行处理所有请求，无并发限制
        const results = {
            coreBagCodes: {},
            resultParams: {},
            materialData: {},
        };

        // 创建所有工艺的并行请求
        const allProcessPromises = processNames.map(async (processName) => {
            try {
                // 并行获取芯包码和结果参数
                const [coreBagCodeData, resultParamsData] = await Promise.all([
                    fetchCoreBagCode(material_lot_code, processName),
                    fetchResultParams(processName, material_lot_code),
                ]);

                return {
                    processName,
                    coreBagCodeData,
                    resultParamsData,
                };
            } catch (error) {
                console.warn(`批量获取 ${processName} 数据失败:`, error);
                return {
                    processName,
                    coreBagCodeData: { coreBagCode: [] },
                    resultParamsData: { resultParameters: [] },
                };
            }
        });

        // 等待所有工艺请求完成
        const allResults = await Promise.all(allProcessPromises);

        // 整理所有结果
        allResults.forEach(({ processName, coreBagCodeData, resultParamsData }) => {
            results.coreBagCodes[processName] = coreBagCodeData;
            results.resultParams[processName] = resultParamsData;
        });

        // 获取原材料数据 - 并行处理
        try {
            console.log(`开始获取电芯 ${material_lot_code} 的原材料数据...`);

            // 并行获取所有原材料数据
            const [positiveData, ceramicData, negativeData] = await Promise.all([
                fetchMaterialPro(material_lot_code, "C021"), // 正极浆料
                fetchMaterialPro(material_lot_code, "C022"), // 陶瓷浆料
                fetchMaterialPro(material_lot_code, "A020"), // 负极浆料
            ]);

            console.log(`电芯 ${material_lot_code} 原材料API调用完成:`);
            console.log(`正极浆料数据:`, positiveData);
            console.log(`陶瓷浆料数据:`, ceramicData);
            console.log(`负极浆料数据:`, negativeData);

            results.materialData = {
                positive: positiveData.Material || [],
                ceramic: ceramicData.Material || [],
                negative: negativeData.Material || [],
            };

            console.log(`电芯 ${material_lot_code} 最终原材料数据:`, results.materialData);
        } catch (error) {
            console.error(`获取电芯 ${material_lot_code} 原材料数据失败:`, error);
            results.materialData = {
                positive: [],
                ceramic: [],
                negative: [],
            };
        }

        console.log(`批量获取电芯数据完成: ${material_lot_code}`);
        return results;
    } catch (error) {
        console.error("批量获取电芯数据失败:", error);
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
};
