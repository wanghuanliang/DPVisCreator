import React, {useMemo} from 'react';
import { Table, Button, InputNumber } from 'antd';
import BorderText from '../../common/BorderText';

const patternWeights = [
  {
      "key": "C0",
      "id": "others",
      "type": "cluster",
      "weights": 0.8
  },
  {
      "key": "C2",
      "id": "C2",
      "type": "order",
      "weights": 0.8
  },
  {
    "key": "C3",
    "id": "C3",
    "type": "order",
    "weights": 0.8
  },
  // {
  //   "key": "C5",
  //   "id": "C5",
  //   "type": "order",
  //   "weights": 0.8
  // },
  // {
  //     "key": "Others",
  //     "id": "Others",
  //     "type": "others",
  //     "weights": 0.8
  // }
]

const WeightsTable = (props) => {
  const {
    patternWeights,
    setPatternWeights,
    handleUpdateClick,
  } = props;
  
  // 表格数据
  const tableData = useMemo(() => {
    const tableData = [];
    Object.keys(patternWeights).forEach(constraint => {
      tableData.push({
        key: constraint,
        id: constraint,
        weights: patternWeights[constraint]
      })
    })
    return tableData
  }, [patternWeights])

  const columns = [
    {
      title: 'Importance constraints',
      dataIndex: 'id',
      // width: 180,
      render: (id, record) => {
        return <BorderText
          text={id}
          type='order' //后面写一个函数获取类型
        ></BorderText>
      }
    },
    {
      title: 'Weights',
      dataIndex: 'weights',
      render: (value, record) => {
        return <InputNumber
          size='small'
          min={0}
          max={1}
          step={0.1}
          style={{ width: 60 }}
          value={value}
          onChange={(value) => {
            patternWeights[record.id] = value;
            setPatternWeights({...patternWeights})
          }}
        ></InputNumber>
      }
    }
  ]

  return <>
    <div style={{height: 200}}>
      <Table
        size='small'
        columns={columns}
        dataSource={tableData}
        scroll='true'
        pagination={false}
        // scroll={{y: 500}}
      ></Table>
    </div>
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <Button size='small' onClick={handleUpdateClick}>Update</Button>
    </div>
  </>
}

export default WeightsTable;