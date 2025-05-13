import { Table, Row, Col } from "antd";
import "./index.css";
import useTableStore from "../../store/tableStore";
import operationMapping from "../../operationMapping";

// 修改组件接收 operationNames 数组或单个 operationName
const ExpandTable = ({ operationName, operationNames, tableTitle }) => {
  // 使用 Zustand store 获取数据
  const { getTableDataByOperation } = useTableStore();
  
  // 处理操作名称，支持单个名称或数组
  const operations = operationNames || (operationName ? [operationName] : []);

  // 处理表格合并
  const components = {
    body: {
      row: (props) => <tr {...props} />,
      cell: (props) => <td {...props} />,
    },
  };

  // 合并所有操作的数据到一个表格
  const getMergedTableData = () => {
    // 收集所有操作的表格数据
    let allTableData = [];
    let headerInfo = { positiveSlurry: "", cellCode: "" };

    // 遍历所有操作，获取数据并合并
    operations.forEach((opName) => {
      const operationData = getTableDataByOperation(opName);
      
      // 如果有数据，添加到合并数据中
      if (operationData.tableData && operationData.tableData.length > 0) {
        allTableData = [...allTableData, ...operationData.tableData];
        
        // 使用第一个有效的 headerInfo
        if (!headerInfo.cellCode && operationData.headerInfo.cellCode) {
          headerInfo = operationData.headerInfo;
        }
      }
    });

    return { tableData: allTableData, headerInfo };
  };

  // 获取合并后的数据
  const { tableData, headerInfo } = getMergedTableData();

  // 如果没有数据，显示空表格
  if (!tableData || tableData.length === 0) {
    return (
      <div className="table-container">
        <div className="table-header">{tableTitle}</div>
        <Row gutter={0} style={{ display: "flex", flexWrap: "nowrap" }}>
          <Col style={{ flex: "1 0 auto", minWidth: "fit-content" }}>
            <div style={{ display: "flex", margin: "10px" }}>
              <div style={{ flex: 1 }}>{headerInfo.positiveSlurry}</div>
              <div style={{ flex: 1 }}>{headerInfo.cellCode}</div>
            </div>
            <Table
              columns={[
                {
                  title: "工序",
                  dataIndex: "process",
                  key: "process",
                  width: 100,
                  render: (text) => operationMapping[text] || text,
                },
                { title: "参数类型", dataIndex: "paramType", key: "paramType", width: 120 },
                { title: "采集项名称", dataIndex: "item", key: "item", width: 150},
                { title: "数据结果", dataIndex: "result", key: "result", width: 180 },
              ]}
              dataSource={[]}
              pagination={false}
              size="small"
              bordered
              className="custom-table"
              style={{ width: "auto", minWidth: "fit-content" }}
            />
          </Col>
        </Row>
      </div>
    );
  }

  // 计算合并单元格
  const mergedCellsInfo = [];
  let processSpanIndex = 0;
  let paramTypeSpanIndex = 0;

  // 对合并后的数据进行排序，确保相同工序和参数类型的行相邻
  const sortedTableData = [...tableData].sort((a, b) => {
    if (a.process !== b.process) {
      return a.process.localeCompare(b.process);
    }
    return a.paramType.localeCompare(b.paramType);
  });

  // 处理工序列的合并
  for (let i = 0; i < sortedTableData.length; i++) {
    if (i === 0) {
      mergedCellsInfo[i] = {
        process: { rowSpan: 1 },
        paramType: { rowSpan: 1 },
      };
      continue;
    }

    // 处理工序列
    if (sortedTableData[i].process === sortedTableData[processSpanIndex].process) {
      // 当前工序与之前的相同，增加之前行的 rowSpan
      mergedCellsInfo[processSpanIndex].process.rowSpan++;
      // 当前行不显示
      mergedCellsInfo[i] = {
        ...mergedCellsInfo[i],
        process: { rowSpan: 0 },
      };
    } else {
      // 当前工序与之前的不同，开始新的合并
      processSpanIndex = i;
      mergedCellsInfo[i] = {
        ...mergedCellsInfo[i],
        process: { rowSpan: 1 },
      };
    }

    // 处理参数类型列
    if (
      sortedTableData[i].process === sortedTableData[paramTypeSpanIndex].process &&
      sortedTableData[i].paramType === sortedTableData[paramTypeSpanIndex].paramType
    ) {
      // 当前参数类型与之前的相同，增加之前行的 rowSpan
      mergedCellsInfo[paramTypeSpanIndex].paramType.rowSpan++;
      // 当前行不显示
      mergedCellsInfo[i] = {
        ...mergedCellsInfo[i],
        paramType: { rowSpan: 0 },
      };
    } else {
      // 当前参数类型与之前的不同，开始新的合并
      paramTypeSpanIndex = i;
      mergedCellsInfo[i] = {
        ...mergedCellsInfo[i],
        paramType: { rowSpan: 1 },
      };
    }
  }

  // 设置单元格属性
  const getRowCellProps = (record, rowIndex) => {
    return {
      style: { padding: "8px" },
    };
  };

  // 设置工序列的单元格属性
  const getProcessCellProps = (record, rowIndex) => {
    if (mergedCellsInfo[rowIndex] && mergedCellsInfo[rowIndex].process) {
      return {
        rowSpan: mergedCellsInfo[rowIndex].process.rowSpan,
        style: { padding: "8px" },
      };
    }
    return getRowCellProps(record, rowIndex);
  };

  // 设置参数类型列的单元格属性
  const getParamTypeCellProps = (record, rowIndex) => {
    if (mergedCellsInfo[rowIndex] && mergedCellsInfo[rowIndex].paramType) {
      return {
        rowSpan: mergedCellsInfo[rowIndex].paramType.rowSpan,
        style: { padding: "8px" },
      };
    }
    return getRowCellProps(record, rowIndex);
  };

  return (
    <div className="table-container">
      <div className="table-header">{tableTitle}</div>
      <Row gutter={0} style={{ display: "flex", flexWrap: "nowrap" }}>
        <Col style={{ flex: "1 0 auto", minWidth: "fit-content" }}>
          <div style={{ display: "flex", margin: "10px" }}>
            <div style={{ flex: 1 }}>{headerInfo.positiveSlurry}</div>
            <div style={{ flex: 1 }}>{headerInfo.cellCode}</div>
          </div>
          <Table
            components={components}
            columns={[
              {
                title: "工序",
                dataIndex: "process",
                key: "process",
                render: (text) => operationMapping[text] || text,
                onCell: (record, rowIndex) => getProcessCellProps(record, rowIndex),
              },
              {
                title: "参数类型",
                dataIndex: "paramType",
                key: "paramType",
                onCell: (record, rowIndex) => getParamTypeCellProps(record, rowIndex),
              },
              {
                title: "采集项名称",
                dataIndex: "item",
                key: "item",
                onCell: getRowCellProps,
              },
              {
                title: "数据结果",
                dataIndex: "result",
                key: "result",
                onCell: getRowCellProps,
              },
            ]}
            dataSource={sortedTableData}
            pagination={false}
            rowKey="key"
            size="small"
            bordered
            className="custom-table"
            style={{ width: "auto", minWidth: "fit-content" }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ExpandTable;
