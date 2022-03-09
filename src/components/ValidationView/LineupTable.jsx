import React from 'react';
import { Table, Tag, Radio, Space } from 'antd';




const data = [
  {
    key: '1',
    Schemes: 'Scheme #1',
    budget: [4, 5, 6],
    cluster: [3, 3, 3, 6],
    correlation: [5],
    order: [5, 9],
  },
  {
    key: '2',
    Schemes: 'Scheme #2',
    budget: [4, 5, 6, 8],
    cluster: [3, 3, 3, 3],
    correlation: [5],
    order: [5, 6],
  },
  {
    key: '3',
    Schemes: 'Scheme #3',
    budget: [4, 5, 6, 1, 1],
    cluster: [3, 3, 3, 3],
    correlation: [5],
    order: [5, 6],
  },
];

const LineupTable = (props) => {

  // data数据扩充最大值
  data.forEach(obj => {
    obj.budgetSum = obj.budget.reduce((pre, cur) => pre + cur);
    obj.clusterSum = obj.cluster.reduce((pre, cur) => pre + cur);
    obj.correlationSum = obj.correlation.reduce((pre, cur) => pre + cur);
    obj.orderSum = obj.order.reduce((pre, cur) => pre + cur);
  })

  // 计算每一项最大值，用于归一化
  const calcMax = (data) => {
    const ans = {
      budget: 0,
      cluster: 0,
      correlation: 0,
      order: 0,
    };
    data.forEach(obj => {
      ans.budget = Math.max(ans.budget, obj.budgetSum);
      ans.cluster = Math.max(ans.cluster, obj.clusterSum);
      ans.correlation = Math.max(ans.correlation, obj.correlationSum);
      ans.order = Math.max(ans.order, obj.orderSum);
    })
    return ans;
  }
  const everyMax = calcMax(data);

  // 列
  const renderItem = (array, pattern) => {
    const sum = array.reduce((pre, cur) => pre + cur);
    const newArray = [];
    let nowVal = 0;
    array.forEach(item => {
      nowVal += item;
      newArray.push(nowVal)
    })
    const nowWidth = sum / everyMax[pattern] * 150;

    return <svg style={{ backgroundColor: '#82c6e8', height: 20 }} width={nowWidth}>
      {newArray.map((item, index) => {
        return <line
          x1={item * nowWidth / sum}
          y1={0}
          x2={item * nowWidth / sum}
          y2={20}
          strokeWidth={1}
          stroke='#fff'
        ></line>
      })}
    </svg>
  };
  const columns = [
    {
      title: 'Schemes',
      dataIndex: 'Schemes',
      key: 'schemes',
    },
    {
      // title: <div><div>'Privacy budget'</div><div>C1 C2</div></div>,
      title: 'Privacy budget',
      dataIndex: 'budget',
      key: 'budget',
      render: array => renderItem(array, 'budget'),
      sorter: (a, b) => a.budgetSum - b.budgetSum,
    },
    {
      title: 'Cluster',
      // title: <div>Cluster</div>
      dataIndex: 'cluster',
      key: 'cluster',
      render: array => renderItem(array, 'cluster'),
      sorter: (a, b) => a.clusterSum - b.clusterSum,
    },
    {
      title: 'Correlation',
      dataIndex: 'correlation',
      key: 'correlation',
      render: array => renderItem(array, 'correlation'),
      sorter: (a, b) => a.correlationSum - b.correlationSum,
    },
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      render: array => renderItem(array, 'order'),
      sorter: (a, b) => a.orderSum - b.orderSum,
    },
  ];

  return (
    <div>
        <Table
          columns={columns}
          pagination={false}
          dataSource={data}
        />
    </div>
  )
}

export default LineupTable;