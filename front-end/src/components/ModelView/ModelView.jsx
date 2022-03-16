import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './ModelView.less';
import { Switch, Slider, InputNumber, Row, Col, Space, Button } from 'antd';
import { CheckCircleOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons';
import * as d3 from 'd3'
import ClockBlock from './ClockBlock/ClockBlock';
import BayesianNetwork from './BayesianNetwork/BayyesianNetWork';
import ParallelPlot from './ParallelPlot';
import SankeyPlot from './SankeyPlot';
import Matrix from './Matrix';
import AlluvialPlot from './AlluvialPlot';
import { debounce } from 'lodash';

const patternData = ["c1", "c2", "c3"]
const [svgWidth, svgHeight] = [1000, 500];
const margin = {
  left: 0,
  top: 0,
  right: 0,
  bottom: 0
}

const ModelView = (props) => {
  const { setWeights, modelData } = props;
  const {
    total_num: totalNum,
    axis_order: axisOrder,
    proportion_data: proportionData,
    flow_data: flowData,
    matrix_data:  matrixData
  } = modelData;

  const [privacyBudgetValue, setPrivacyBudget] = useState(0.8);
  const initialPatternWeight = useMemo(() => {
    const initial = {};
    patternData.forEach(id => initial[id] = 0.8);
    return initial;
  }, [])
  const [patternWeights, setPatternWeights] = useState(initialPatternWeight); //{'c1': 1, 'c2': 1}
  // 光标的水平的位置
  // const [clientX, setClientX] = useState(0)
  // // 是否在拖动
  // const [isResizing, setIsResizing] = useState(false);
  // // 左侧宽度
  // const [menuWidth, setMenuWidth] = useState(100);
  // // 开始、移动、结束拖拽事件
  // const handleStartResize = useCallback((e) => {
  //   console.log(e);
  //   setClientX(e.clientX)
  //   setIsResizing(true)
  // }, []);
  // const handleResize = useCallback(debounce(e => {
  //   if (!isResizing) return;
  //   const offset = e.clientX - clientX;
  //   const width = menuWidth + offset;
  //   setMenuWidth(width);
  // }, 10), [menuWidth, clientX]);
  // const handleStopResize = useCallback(() => {
  //   setIsResizing(false);
  // })
  // //监听光标移动
  // useEffect(() => {
  //   document.addEventListener('mousemove', handleResize)
  //   return () => {
  //     document.removeEventListener('mousemove', handleResize)
  //   }
  // }, [handleResize])
  // //监听鼠标松开
  // useEffect(() => {
  //   document.addEventListener('mouseup', handleStopResize)
  //   return () => {
  //     document.removeEventListener('mouseup', handleStopResize)
  //   }
  // }, [handleStopResize])
  
  const handleRecordClick = () => {
    const data = {}
    data.bayes_budget = privacyBudgetValue;
    data.weights = [];
    Object.entries(patternWeights).forEach(([key, value]) => {
      data.weights.push({ id: key, weight: value });
    })
    console.log('data', data);
    setWeights(data)
      .then(res => console.log('res', res))
      .catch(e => console.log('e', e));
  }

  // 渲染上部控制面板
  const renderModelControlPanel = () => {
    return (
      <div className="model-control-panel">
        <Space>
          <span>Privacy Budget</span>
          <Slider
            min={0}
            max={1}
            step={0.1}
            style={{ width: 100 }}
            value={privacyBudgetValue}
            onChange={value => setPrivacyBudget(value)}
          ></Slider>
          <InputNumber
            size='small'
            min={0}
            max={1}
            step={0.1}
            style={{ width: 60 }}
            value={privacyBudgetValue}
            onChange={value => setPrivacyBudget(value)}
          ></InputNumber>
          <div style={{display: 'inline-block', width: 20}}></div>
          <span>Constraints</span>
          {/* <div style={{position: 'absolute', left: '0', width: 200}}>
            <div style={{float: 'left'}}>123</div>
            <div>456</div>
            <div style={{float: 'right'}}>789</div>
          </div> */}
          <div className="constraints-block" style={{ backgroundColor: '#f2d1cc', width: `80px` }}>Cluster</div>
          {/* <div className="resizeHandle" onMouseDown={handleStartResize}> 1</div> */}
          <div className="constraints-block" style={{backgroundColor: '#fae1ca'}}>Correlation</div>
          <div className="constraints-block" style={{ backgroundColor: '#fae1ec' }}>Order</div>
          <div style={{display: 'inline-block', width: 20}}></div>
          <Button size='small' onClick={handleRecordClick}>Record</Button>
        </Space>
      </div>
    )
  }

  return (
    <div>
      {renderModelControlPanel()}
      <Space>
        {patternData.map(id => {

          return <InputNumber
            key={id}
            size='small'
            min={0}
            max={1}
            step={0.1}
            style={{ width: 60 }}
            value={patternWeights?.[id]}
            onChange={value => {
              patternWeights[id] = value;
              setPatternWeights({...patternWeights})
            }}
          ></InputNumber>
        })}
      </Space>
      {/* 整理放入一个svg */}
      {/* <svg width={svgWidth} height={svgHeight}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <Matrix
              matrixData={matrixData}
          ></Matrix>
          <AlluvialPlot
            totalNum={totalNum}
            axisOrder={axisOrder}
            proportionData={proportionData}
            flowData={flowData}
          ></AlluvialPlot> */}
          {/* <ClockBlock></ClockBlock> */}
          {/* <BayesianNetwork></BayesianNetwork> */}
          {/* <SankeyPlot></SankeyPlot> */}
          {/* <ParallelPlot></ParallelPlot> */}
        {/* </g>
      </svg> */}
      {modelData && <div style={{display:'flex'}}>
        <Matrix
          matrixData={matrixData}
        ></Matrix>
        <AlluvialPlot
          totalNum={totalNum}
          axisOrder={axisOrder}
          proportionData={proportionData}
          flowData={flowData}
        ></AlluvialPlot>
        {/* <SankeyPlot></SankeyPlot> */}
      </div>}
    </div>
  );
};

export default ModelView;