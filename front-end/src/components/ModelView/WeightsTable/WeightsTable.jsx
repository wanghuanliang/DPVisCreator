import React, {useMemo} from 'react';
import { Table, Button, InputNumber } from 'antd';
import BorderText from '../../common/BorderText';
import './WeightsTable.less'
import { cluster } from 'd3';

const tableData = [
  {
    "key": "C0",
    "id": "C0",
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
  {
    "key": "C5",
    "id": "C5",
    "type": "order",
    "weights": 0.8
  },
  // {
  //     "key": "Others",
  //     "id": "Others",
  //     "type": "others",
  //     "weights": 0.8
  // }
];
const totalHeight = 150;
const typeOrder = ['order', 'correlation', 'cluster', 'others'];

const WeightsTable = (props) => {
  const {
    patternWeights, // 权重{'c1': 1, 'c2': 1}
    setPatternWeights,
    handleUpdateClick,
    patternType,
    patternColor,
  } = props;
  console.log('props', props);
  
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
  }, [patternWeights]);

  // 图例数据 {'order': [{id: 'C1', proportion: 0.2 }]}
  const legendData = useMemo(() => {
    const legendData = {};
    legendData.order = [];
    legendData.correlation = [];
    legendData.cluster = [];
    legendData.others = [];
    const weightsSum = Object.values(patternWeights).reduce((pre, cur) => pre + cur, 0);
    console.log(patternWeights);
    Object.keys(patternWeights).forEach(id => {
      const type = patternType[id];
      const weight = patternWeights[id];
      console.log('patternType', patternType);
      console.log('id', id);
      legendData[type].push({
        id: id,
        proportion: weight / weightsSum,
      })
    })
    return legendData
  }, [patternWeights]); //放入patternType会出问题，patternType更新完成后，patternWeights还没有更新
  console.log('patternWeights', legendData);
  //图例总长度
  const totalHeight = useMemo(() => {
    return 170 - (Object.keys(patternWeights).length - 1) * 1; //总长度150
  }, [patternWeights]);
  // 图例字体位置 [{type: 'cluster', pos: 20}, ]
  const legendFontPos = useMemo(() => {
    const legendFontPos = []
    let nowPos = 0;
    typeOrder.forEach(type => {
      if (legendData[type].length === 0) return;
      // let sumHeight = legendData[type].reduce((pre, cur) => (pre.proportion + cur.proportion) * totalHeight + 1, { "proportion": 0 });
      let sumHeight = 0;
      for (let i = 0; i < legendData[type].length; i++) {
        sumHeight += legendData[type][i].proportion * totalHeight + 1;
      }
      console.log('sumHeight', sumHeight);
      let pos = (nowPos + sumHeight - 1 + nowPos) / 2;
      legendFontPos.push({
        type: type,
        pos: pos,
      })
      nowPos = nowPos + sumHeight;
    })
    return legendFontPos;
  }, [legendData, totalHeight, patternWeights]);


  const columns = [
    {
      title: 'Data patterns',
      dataIndex: 'id',
      width: 100,
      render: (id, record) => {
        return <BorderText
          text={id}
          type={patternType[id]} //后面写一个函数获取类型
        ></BorderText>
      }
    },
    {
      title: 'Importance weights',
      dataIndex: 'weights',
      width: 100,
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

  return <div className='model-left-top'>
    <div style={{display: 'flex'}}>
      <div className='table-box' style={{ marginBottom: 10, width: 250 }}>
        <Table
          size='small'
          columns={columns}
          dataSource={tableData}
          pagination={false}
          scroll={{y: 123}}
        ></Table>
      </div>
      <div>
        {
          typeOrder.map(type => {
            return legendData[type].map(obj => {
              return <div className='legend-div' key={obj.id} style={{
                height: obj.proportion * totalHeight,
                backgroundColor: patternColor[type]
              }}></div>
            })
          })
        }
      </div>
      <div style={{position: 'relative'}}>
        {
          legendFontPos.map(obj => {
            const type = obj.type;
            const pos = obj.pos;
            console.log(type, pos);
            return <div key={type} className='legend-font' style={{
              top: pos - 7
            }}>{type}</div>
          })
        }
      </div>
      {/* <svg>
        <g transform='translate(10,0)'>
          {
            ['order', 'correlation', 'cluster', 'others'].map(type => {
              return legendData[type].map(obj => {
                return <rect
                  x=
                ></rect>
              })
            })
          }
        </g>
      </svg> */}
    </div>
    <Button
      size='small'
      onClick={handleUpdateClick}
      style={{margin: '10px 50px', position: 'absolute', bottom: '0px', left: '40px'}}
    >Construct pattern constraints</Button>
  </div>
}

export default WeightsTable;