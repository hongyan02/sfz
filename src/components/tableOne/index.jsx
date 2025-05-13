import React from 'react';
import { Table } from 'antd';
import './index.css';

const dataSource = [
  {
    key: '1',
    workSection: '投料',
    level1: '正极浆料原材料',
    level2: '磷酸铁锂',
    barcodeNumber: 'JM60JOUT25012300108',
  },
  {
    key: '2',
    workSection: '投料',
    level1: '正极浆料原材料',
    level2: 'NPM溶剂',
    barcodeNumber: 'JM60JOUT25011000114',
  },
  {
    key: '3',
    workSection: '投料',
    level1: '正极浆料原材料',
    level2: 'PVDF粘贴剂',
    barcodeNumber: '2024122902',
  },
  {
    key: '4',
    workSection: '投料',
    level1: '正极浆料原材料',
    level2: '炭黑-导电剂',
    barcodeNumber: 'JM60JOUT25020500145',
  },
  {
    key: '5',
    workSection: '投料',
    level1: '正极浆料原材料',
    level2: 'CNT导电剂',
    barcodeNumber: '60CIPC01MB56CE01PF2J1A',
  },
  {
    key: '6',
    workSection: '投料',
    level1: '负极浆料原材料',
    level2: '石墨',
    barcodeNumber: '60ACOM02MB56',
  },
  {
    key: '7',
    workSection: '投料',
    level1: '负极浆料原材料',
    level2: 'NMP粘连剂',
    barcodeNumber: '12504-1M1401260300210',
  },
  {
    key: '8',
    workSection: '投料',
    level1: '负极浆料原材料',
    level2: 'SBR粘结剂',
    barcodeNumber: '60A01MB5601F1E71676',
  },
  {
    key: '9',
    workSection: '投料',
    level1: '负极浆料原材料',
    level2: '炭黑-导电剂',
    barcodeNumber: '60A01MB5601F1E71743',
  },
  {
    key: '10',
    workSection: '投料',
    level1: '陶瓷浆料原材料',
    level2: 'PVDF粘结剂',
    barcodeNumber: '04QCB3060100JF2M0000016',
  },
  {
    key: '11',
    workSection: '投料',
    level1: '陶瓷浆料原材料',
    level2: 'NMP溶剂',
    barcodeNumber: 'JM7140OUT241230001',
  },
  {
    key: '12',
    workSection: '投料',
    level1: '陶瓷浆料原材料',
    level2: '勃母石',
    barcodeNumber: 'JM60JPL25011700025',
  },
  {
    key: '13',
    workSection: '极片',
    level1: '浆料',
    level2: '正极浆料1',
    barcodeNumber: 'JM60JPL25011700025',
  },
  {
    key: '14',
    workSection: '极片',
    level1: '浆料',
    level2: '正极浆料2',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '15',
    workSection: '极片',
    level1: '浆料',
    level2: '负极浆料',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '16',
    workSection: '极片',
    level1: '浆料',
    level2: '陶瓷浆料',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '17',
    workSection: '极片',
    level1: '铝箔',
    level2: '铝箔',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '18',
    workSection: '极片',
    level1: '铜箔',
    level2: '铜箔',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '19',
    workSection: '极片',
    level1: '涂布卷',
    level2: '正极涂布卷1',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '20',
    workSection: '极片',
    level1: '涂布卷',
    level2: '正极涂布卷2',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '21',
    workSection: '极片',
    level1: '涂布卷',
    level2: '负极涂布卷',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '22',
    workSection: '极片',
    level1: '辊分卷',
    level2: '正极辊分卷1',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '23',
    workSection: '极片',
    level1: '辊分卷',
    level2: '正极辊分卷2',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '24',
    workSection: '极片',
    level1: '辊分卷',
    level2: '负极辊分卷',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '25',
    workSection: '极片',
    level1: '涂覆隔膜1',
    level2: '涂覆隔膜1',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '26',
    workSection: '极片',
    level1: '涂覆隔膜2',
    level2: '涂覆隔膜2',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '27',
    workSection: '叠片',
    level1: '芯包1',
    level2: '芯包1',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '28',
    workSection: '叠片',
    level1: '芯包2',
    level2: '芯包2',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '29',
    workSection: '组装',
    level1: 'A芯包',
    level2: 'A芯包',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '30',
    workSection: '组装',
    level1: 'B芯包',
    level2: 'B芯包',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '31',
    workSection: '组装',
    level1: '裸电芯',
    level2: '裸电芯',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '32',
    workSection: '组装',
    level1: '盖组',
    level2: '盖组',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '33',
    workSection: '组装',
    level1: '壳体',
    level2: '壳体',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '34',
    workSection: '化成',
    level1: '化成钉',
    level2: '化成钉',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '35',
    workSection: '化成',
    level1: '电解液A',
    level2: '电解液A',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '36',
    workSection: '化成',
    level1: '密封胶粒',
    level2: '密封胶粒',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '37',
    workSection: '化成',
    level1: '电解液B',
    level2: '电解液B',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '38',
    workSection: '化成',
    level1: '密封钉铝片',
    level2: '密封钉铝片',
    barcodeNumber: 'JM10JPL241229000251',
  },
  {
    key: '39',
    workSection: '包装',
    level1: '电芯',
    level2: '电芯',
    barcodeNumber: 'JM10JPL241229000251',
  },
];

function mergeRowSpan(data, dataIndex) {
  const rowSpanArr = new Array(data.length).fill(1);
  let lastValue = null;
  let lastIndex = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i][dataIndex] !== lastValue) {
      if (i - lastIndex > 1) {
        rowSpanArr[lastIndex] = i - lastIndex;
        for (let j = lastIndex + 1; j < i; j++) {
          rowSpanArr[j] = 0;
        }
      }
      lastValue = data[i][dataIndex];
      lastIndex = i;
    }
  }
  // 处理最后一组
  if (data.length - lastIndex > 1) {
    rowSpanArr[lastIndex] = data.length - lastIndex;
    for (let j = lastIndex + 1; j < data.length; j++) {
      rowSpanArr[j] = 0;
    }
  }
  return rowSpanArr;
}

function mergeLevel2RowSpan(data) {
  const rowSpanArr = new Array(data.length).fill(1);
  let lastLevel1 = null;
  let lastLevel2 = null;
  let lastIndex = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].level1 !== lastLevel1 || data[i].level2 !== lastLevel2) {
      if (i - lastIndex > 1) {
        rowSpanArr[lastIndex] = i - lastIndex;
        for (let j = lastIndex + 1; j < i; j++) {
          rowSpanArr[j] = 0;
        }
      }
      lastLevel1 = data[i].level1;
      lastLevel2 = data[i].level2;
      lastIndex = i;
    }
  }
  // 处理最后一组
  if (data.length - lastIndex > 1) {
    rowSpanArr[lastIndex] = data.length - lastIndex;
    for (let j = lastIndex + 1; j < data.length; j++) {
      rowSpanArr[j] = 0;
    }
  }
  return rowSpanArr;
}

const workSectionRowSpan = mergeRowSpan(dataSource, 'workSection');
const level1RowSpan = mergeRowSpan(dataSource, 'level1');
const level2RowSpan = mergeLevel2RowSpan(dataSource);

const columns = [
  {
    title: "工段",
    dataIndex: "workSection",
    key: "workSection",
    width: 100,
    fixed: "left",
    onCell: (row, index) => ({
      rowSpan: workSectionRowSpan[index]
    }),
  },
  {
    title: "追溯层级",
    children: [
      {
        title: "层级1",
        dataIndex: "level1",
        key: "level1",
        onCell: (row, index) => {
          const sameValue = row.level1 === row.level2;
          return {
            rowSpan: level1RowSpan[index],
            colSpan: sameValue ? 2 : 1
          };
        }
      },
      {
        title: "层级2",
        dataIndex: "level2",
        key: "level2",
        onCell: (row, index) => {
          const sameValue = row.level1 === row.level2;
          return {
            rowSpan: level2RowSpan[index],
            colSpan: sameValue ? 0 : 1
          };
        }
      }
    ]
  },  
  {
    title: "条码号",
    dataIndex: "barcodeNumber",
    key: "barcodeNumber",
    width: 150,
  },
];

const TableOne = () => (
  <div className="table-container">
    <Table
      dataSource={dataSource}
      columns={columns}
      bordered
      pagination={false}
      className="custom-table"
    />
  </div>
);

export default TableOne;