"use client";

import { useEffect } from "react";
import ContentContainer from "../components/ContentContainer";
import ProcessList from "../components/ProcessList";
import ProcessTable from "../components/ProcessTable";
import SearchBar from "../components/SearchBar";
import Card from "../components/Card";
import MaterialEndWithCoreBagTable from "../components/MaterialEndWithCoreBagTable";
import ProcessNameTable from "../components/ProcessNameTable";
import MaterialEndTable from "../components/MaterialEndTable";
import ExportButton from "../components/ExportButton";
import { useSearchStore, useProcessDataStore } from "../store";

export default function Home() {
    // 从不同的 store 获取数据和方法
    const { material_lot_code } = useSearchStore();
    const { error } = useProcessDataStore();

    // 使用自适应宽度
    const columnStyle = {
        minWidth: "350px", // 最小宽度
        flex: "1 1 auto", // 弹性布局，自动伸缩
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* 顶部操作栏 */}
            <div className="p-8 pb-0 flex justify-between items-center gap-4 flex-shrink-0">
                <div className="flex-1">
                    <SearchBar />
                </div>
                <div className="flex-shrink-0">
                    <ExportButton filename="电池生产线监控数据" targetId="export-content" />
                </div>
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="mx-8 mt-6 p-2 bg-red-50 text-red-600 rounded flex-shrink-0">
                    {error}
                </div>
            )}

            {/* 主要内容区域 - 用于PDF导出 */}
            <div id="export-content" className="flex-1 flex flex-col min-h-0 p-8 pt-6">
                {/* 横向滚动容器 - 填满剩余视口空间，允许垂直滚动 */}
                <div
                    className="flex-1 overflow-auto"
                    style={{
                        scrollbarWidth: "thin",
                        WebkitOverflowScrolling: "touch",
                    }}
                >
                    <div
                        className="flex gap-4"
                        style={{ minWidth: "max-content", minHeight: "100%" }}
                    >
                        {/* Card 纵向排布容器 - 自适应宽度 */}
                        <div
                            className="flex flex-col gap-4"
                            style={{
                                // minWidth: '350px',
                                maxWidth: "800px",
                                width: "100%",
                                flex: "1 1 auto",
                                maxHeight: "none", // 移除高度限制
                            }}
                        >
                            <Card title="投料">
                                <Card title="正极浆料原材料">
                                    <ProcessNameTable processName="C021" />
                                </Card>
                                <Card title="负极浆料原材料">
                                    <ProcessNameTable processName="A020" />
                                </Card>
                                <Card title="陶瓷浆料原材料">
                                    <ProcessNameTable processName="C022" />
                                </Card>
                            </Card>

                            <Card title="极片">
                                <Card title="涂布卷">
                                    <ProcessNameTable processName={["C030", "A030"]} />
                                </Card>
                                <Card title="辊分卷">
                                    <ProcessNameTable processName={["C040", "A040"]} />
                                </Card>
                                {/* <Card title="切叠">
                                    <ProcessNameTable processName="S010" />
                                </Card> */}
                            </Card>
                            <Card title="叠片">
                                {/* <ProcessNameTable processName="S010" /> */}
                                <MaterialEndWithCoreBagTable workcell_id="51723.2" />
                            </Card>

                            <Card title="组装" workcell_id="51724.2">
                                <MaterialEndTable workcell_id="51724.2" />
                            </Card>

                            <Card title="化成" workcell_id="51725.2">
                                <MaterialEndTable workcell_id="51725.2" />
                            </Card>

                            <Card title="包装" workcell_id="51726.2">
                                <MaterialEndTable workcell_id="51726.2" />
                            </Card>
                        </div>

                        <ContentContainer
                            title="浆料"
                            style={{ margin: "0", width: "fit-content", height: "fit-content" }}
                        >
                            <div className="flex gap-3" style={{ width: "fit-content" }}>
                                {/* 使用flex布局，每列包含一个ProcessList和对应的ProcessTable */}
                                <div className="flex flex-col" style={columnStyle}>
                                    <ProcessList
                                        processName="C021"
                                        title="正极浆料"
                                        style={{ width: "100%" }}
                                    />
                                    <div className="mt-4 overflow-visible">
                                        <ProcessTable
                                            processName="C021"
                                            style={{ width: "100%", overflow: "visible" }}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col" style={columnStyle}>
                                    <ProcessList
                                        processName="C022"
                                        title="陶瓷浆料"
                                        style={{ width: "100%" }}
                                    />
                                    <div className="mt-4 overflow-visible">
                                        <ProcessTable
                                            processName="C022"
                                            style={{ width: "100%", overflow: "visible" }}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col" style={columnStyle}>
                                    <ProcessList
                                        processName="A020"
                                        title="负极浆料"
                                        style={{ width: "100%" }}
                                    />
                                    <div className="mt-4 overflow-visible">
                                        <ProcessTable
                                            processName="A020"
                                            style={{ width: "100%", overflow: "visible" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </ContentContainer>

                        <ContentContainer
                            title="涂布卷"
                            style={{ margin: "0", width: "fit-content", height: "fit-content" }}
                        >
                            <div className="flex gap-3" style={{ width: "fit-content" }}>
                                <div className="flex flex-col" style={columnStyle}>
                                    <ProcessList
                                        processName="C030"
                                        title="正极涂布卷"
                                        style={{ width: "100%" }}
                                    />
                                    <div className="mt-4 overflow-visible">
                                        <ProcessTable
                                            processName="C030"
                                            style={{ width: "100%", overflow: "visible" }}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col" style={columnStyle}>
                                    <ProcessList
                                        processName="A030"
                                        title="负极涂布卷"
                                        style={{ width: "100%" }}
                                    />
                                    <div className="mt-4 overflow-visible">
                                        <ProcessTable
                                            processName="A030"
                                            style={{ width: "100%", overflow: "visible" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </ContentContainer>

                        <ContentContainer
                            title="辊分卷"
                            style={{ margin: "0", width: "fit-content", height: "fit-content" }}
                        >
                            <div className="flex gap-3" style={{ width: "fit-content" }}>
                                <div className="flex flex-col" style={columnStyle}>
                                    <ProcessList
                                        processName="C040"
                                        title="正极辊分卷"
                                        style={{ width: "100%" }}
                                    />
                                    <div className="mt-4 overflow-visible">
                                        <ProcessTable
                                            processName="C040"
                                            style={{ width: "100%", overflow: "visible" }}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col" style={columnStyle}>
                                    <ProcessList
                                        processName="A040"
                                        title="负极辊分卷"
                                        style={{ width: "100%" }}
                                    />
                                    <div className="mt-4 overflow-visible">
                                        <ProcessTable
                                            processName="A040"
                                            style={{ width: "100%", overflow: "visible" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </ContentContainer>

                        <ContentContainer
                            title="芯包"
                            style={{ margin: "0", width: "fit-content", height: "fit-content" }}
                        >
                            <div className="flex gap-3" style={{ width: "fit-content" }}>
                                <div className="flex flex-col" style={columnStyle}>
                                    <ProcessList
                                        processName="E030"
                                        title="A芯包"
                                        style={{ width: "100%" }}
                                    />
                                    <div className="mt-4 overflow-visible">
                                        <ProcessTable
                                            processName={["S010", "E010", "E020"]}
                                            style={{ width: "100%", overflow: "visible" }}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col" style={columnStyle}>
                                    <ProcessList
                                        processName="Z100"
                                        title="B芯包"
                                        excludeProcessName="E030"
                                        style={{ width: "100%" }}
                                    />
                                    <div className="mt-4 overflow-visible">
                                        <ProcessTable
                                            processName={["S010", "E010", "E020"]}
                                            style={{ width: "100%", overflow: "visible" }}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col" style={columnStyle}>
                                    <ProcessList
                                        processName="E030"
                                        title="双芯包"
                                        style={{ width: "100%" }}
                                    />
                                    <div className="mt-4 overflow-visible">
                                        <ProcessTable
                                            processName="E030"
                                            style={{ width: "100%", overflow: "visible" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </ContentContainer>

                        <ContentContainer
                            title="裸电芯"
                            style={{ margin: "0", width: "fit-content", height: "fit-content" }}
                        >
                            <div className="flex gap-3" style={{ width: "fit-content" }}>
                                <div className="flex flex-col" style={columnStyle}>
                                    <ProcessList
                                        processName="E040"
                                        title="裸电芯"
                                        style={{ width: "100%" }}
                                    />
                                    <div className="mt-4 overflow-visible">
                                        <ProcessTable
                                            processName={[
                                                "E040",
                                                "E050",
                                                "E060",
                                                "E070",
                                                "E080",
                                                "E090",
                                                "E100",
                                                "E110",
                                                "F010",
                                                "F020",
                                                "F030",
                                                "F040",
                                                "F050",
                                                "F060",
                                                "F070",
                                                "F080",
                                                "F090",
                                            ]}
                                            style={{ width: "100%", overflow: "visible" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </ContentContainer>

                        <ContentContainer
                            title="电芯"
                            style={{ margin: "0", width: "fit-content", height: "fit-content" }}
                        >
                            <div className="flex gap-3" style={{ width: "fit-content" }}>
                                <div className="flex flex-col" style={columnStyle}>
                                    <ProcessList
                                        processName="F100"
                                        title="电芯"
                                        style={{ width: "100%" }}
                                    />
                                    <div className="mt-4 overflow-visible">
                                        <ProcessTable
                                            processName={[
                                                "F100",
                                                "F120",
                                                "F130",
                                                "F140",
                                                "F150",
                                                "F160",
                                                "F170",
                                                "F190",
                                                "F200",
                                                "F210",
                                                "F220",
                                                "F230",
                                                "F240",
                                                "F250",
                                                "F260",
                                                "F270",
                                                "P010",
                                                "P020",
                                                "P030",
                                                "P040",
                                                "P050",
                                                "P060",
                                            ]}
                                            style={{ width: "100%", overflow: "visible" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </ContentContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
