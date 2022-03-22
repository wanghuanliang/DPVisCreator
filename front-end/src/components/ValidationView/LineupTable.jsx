import React, { useMemo } from 'react';
import { Table, Tag, Radio, Space } from 'antd';

// const data = [
//   {
//     key: '1',
//     Schemes: 'Scheme #1',
//     budget: [4, 5, 6],
//     cluster: [3, 3, 3, 6],
//     correlation: [5],
//     order: [5, 9],
//   },
//   {
//     key: '2',
//     Schemes: 'Scheme #2',
//     budget: [4, 5, 6, 8],
//     cluster: [3, 3, 3, 3],
//     correlation: [5],
//     order: [5, 6],
//   },
//   {
//     key: '3',
//     Schemes: 'Scheme #3',
//     budget: [4, 5, 6, 1, 1],
//     cluster: [3, 3, 3, 3],
//     correlation: [5],
//     order: [5, 6],
//   },
// ];

const schemes = [
  {
    id: 0,
    key: 0,
    statistical: {
      "KSTest": 0.9123692077727952,
      "CSTest": 0.9393205745638467
    },
    detection: {
      "LogisticDetection": 0.8124266859712977
    },
    privacy: {
      "MLP": 0.11019587037579194,
      "CAP": 0.7476792585968235
    }
  }
];

const LineupTable = (props) => {
  const {
    schemes,
    selectedSchemeId,
    setSelectedSchemeId,
    selectedMetrics,
  } = props;

  // schemes变化后重新计算表格数据
  const tableData = useMemo(() => {
    const tableData = [];
    schemes.forEach((scheme, index) => {
      const record = {};
      record.key = index;
      record.id = index;
      record.budget = scheme.metrics.privacy_budget; //为值
      record.statistical = scheme.metrics.statistical_metrics;
      record.detection = scheme.metrics.detection_metrics;
      record.privacy = scheme.metrics.privacy_metrics;
      tableData.push(record);
    })
    return tableData;
  }, [schemes])
  
  // data数据扩充最大值
  // data.forEach(obj => {
  //   obj.budgetSum = obj.budget.reduce((pre, cur) => pre + cur);
  //   obj.clusterSum = obj.cluster.reduce((pre, cur) => pre + cur);
  //   obj.correlationSum = obj.correlation.reduce((pre, cur) => pre + cur);
  //   obj.orderSum = obj.order.reduce((pre, cur) => pre + cur);
  // })

  // 计算每一项最大值，用于归一化
  // const calcMax = (data) => {
  //   const ans = {
  //     budget: 0,
  //     cluster: 0,
  //     correlation: 0,
  //     order: 0,
  //   };
  //   data.forEach(obj => {
  //     ans.budget = Math.max(ans.budget, obj.budgetSum);
  //     ans.cluster = Math.max(ans.cluster, obj.clusterSum);
  //     ans.correlation = Math.max(ans.correlation, obj.correlationSum);
  //     ans.order = Math.max(ans.order, obj.orderSum);
  //   })
  //   return ans;
  // }
  // const everyMax = calcMax(data);

  // 列
  // const renderItem = (array, pattern) => {
  //   const sum = array.reduce((pre, cur) => pre + cur);
  //   const newArray = [];
  //   let nowVal = 0;
  //   array.forEach(item => {
  //     nowVal += item;
  //     newArray.push(nowVal)
  //   })
  //   const nowWidth = sum / everyMax[pattern] * 150;

  //   return <svg style={{ backgroundColor: '#82c6e8', height: 20 }} width={nowWidth}>
  //     {newArray.map((item, index) => {
  //       return <line
  //         key={index}
  //         x1={item * nowWidth / sum}
  //         y1={0}
  //         x2={item * nowWidth / sum}
  //         y2={20}
  //         strokeWidth={1}
  //         stroke='#fff'
  //       ></line>
  //     })}
  //   </svg>
  // };
  
  const totalWidth = 150;
  const divHeight = 20;
  // obj: {CAP: 0.5, MLP: 0.6}
  // title: privacy
  // selectedMetrics {privacy: ['CAP]}
  const renderItem = (obj, title) => {
    const n = selectedMetrics[title].length;
    if (n === 0) return;
    const divWidth = totalWidth / n;
    return <div style={{width: totalWidth, height: divHeight, display: 'flex'}}>
      {selectedMetrics[title].map(kind => {
        return <div
          style={{
            width: divWidth * obj[kind],
            height: divHeight,
            backgroundColor: '#8ab0d0',
            marginRight: 3
          }}
          onHov
        ></div>
      })}
    </div>
  }

  const columns = [
    {
      title: 'Schemes',
      dataIndex: 'id',
      key: 'id',
      render: id => <div
        style={{
          color: id === selectedSchemeId ? '#f0943d' : '#000',
          cursor: 'pointer'
        }}
        onClick={() => id === selectedSchemeId ? null : setSelectedSchemeId(id)}
      >Scheme #{id}</div>
    },
    {
      title: 'Privacy budget',
      dataIndex: 'budget',
      key: 'budget',
      width: 200,
      render: v => <div style={{
        width: 20 / 20 * totalWidth,
        height: divHeight,
        backgroundColor: '#8ab0d0'
      }}></div>
      // render: array => renderItem(array, 'budget'),
      // sorter: (a, b) => a.budgetSum - b.budgetSum,
    },
    {
      // title: 'Cluster',
      title: <div>
        <div>Statistical metrics</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal' }}>
          {(selectedMetrics.statistical || []).map(name => <div>{name}</div>)}
        </div>
      </div>,
      dataIndex: 'statistical',
      key: 'statistical',
      width: 200,
      render: obj => renderItem(obj, 'statistical'),
      // render: array => renderItem(array, 'cluster'),
      // sorter: (a, b) => a.clusterSum - b.clusterSum,
    },
    {
      title: <div>
        <div>Detection metrics</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal' }}>
          {(selectedMetrics.detection || []).map(name => <div>{name}</div>)}
        </div>
      </div>,
      dataIndex: 'detection',
      key: 'detection',
      width: 200,
      render: obj => renderItem(obj, 'detection'),
      // render: array => renderItem(array, 'correlation'),
      // sorter: (a, b) => a.correlationSum - b.correlationSum,
    },
    {
      title: <div>
        <div>Privacy metrics</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal' }}>
          {(selectedMetrics.privacy || []).map(name => <div>{name}</div>)}
        </div>
      </div>,
      dataIndex: 'privacy',
      key: 'privacy',
      width: 200,
      render: obj => renderItem(obj, 'privacy'),
      // render: array => renderItem(array, 'order'),
      // sorter: (a, b) => a.orderSum - b.orderSum,
    },
  ];

  return (
    <Table
      columns={columns}
      pagination={false}
      dataSource={tableData}
    />
  )
}

export default LineupTable;