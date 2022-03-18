import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './ModelView.less';
import { Switch, Slider, InputNumber, Row, Col, Space, Button } from 'antd';
import { CheckCircleOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons';
import * as d3 from 'd3'
import ClockBlock from './ClockBlock/ClockBlock';
import BayesianNetwork from './BayesianNetwork/BayyesianNetWork';
import ParallelPlot from './ParallelPlot';
import SankeyPlot from './SankeyPlot';
import Matrix from './Matrix/Matrix';
import Legend from './Matrix/Legend';
import AlluvialPlot from './AlluvialPlot';
import { debounce } from 'lodash';

const [svgWidth, svgHeight] = [1118, 540];
const margin = {
  left: 0,
  top: 50,
  right: 0,
  bottom: 0
}
// const constraints = [{
//   id: 'C0',
//   type: 'cluster',
// }, {
//   id: 'C1',
//   type: 'correlation'
//   }, {
//   id: 'C2',
//   type: 'order'
// }];
// 约束模式颜色
const patternColor = {
  original: '#dedede',
  cluster: '#9cb0a2',
  correlation: '#c39b83',
  order: '#bbafd1',
}
// 约束距离渐变色
const [startColor, endColor] = ['#c4ccdf', '#436b92']
const computeColor = d3.interpolate(startColor, endColor);

const ModelView = (props) => {
  const { setWeights, modelData } = props;
  const {
    total_num: totalNum,
    axis_order: axisOrder,
    proportion_data: proportionData,
    flow_data: flowData,
    constraints,
    matrix_data: matrixData,
    sankey_data: sankeyData,
  } = modelData;

  const [privacyBudgetValue, setPrivacyBudget] = useState(0.8);
  const initialPatternWeight = useMemo(() => {
    const initial = {};
    constraints.forEach(constraint => initial[constraint.id] = 0.8);
    return initial;
  }, [constraints])
  const [patternWeights, setPatternWeights] = useState(initialPatternWeight); //{'c1': 1, 'c2': 1}
  
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
          <div style={{ display: 'inline-block', width: 20 }}></div>
          <div className="constraints-block">
            <div style={{ backgroundColor: patternColor.original }}>Original</div>
            <div style={{ backgroundColor: patternColor.cluster }}>Cluster</div>
            <div style={{ backgroundColor: patternColor.correlation }}>Correlation</div>
            <div style={{ backgroundColor: patternColor.order }}>Order</div>
          </div>
          <div style={{display: 'inline-block', width: 20}}></div>
          <Button size='small' onClick={handleRecordClick}>Record</Button>
        </Space>
      </div>
    )
  }

  return (
    <div>
      {renderModelControlPanel()}
      {/* 一个大的svg放置小svg */}
      {modelData && <svg width={svgWidth} height={svgHeight}>
        {/* <Matrix
          constraints={constraints}
          matrixData={matrixData}
          computeColor={computeColor}
          patternColor={patternColor}
          patternWeights={patternWeights}
          setPatternWeights={setPatternWeights}
        ></Matrix>
        <g transform='translate(50, 480)'>
          <Legend
            computeColor={computeColor}
          ></Legend>
        </g> */}
        <g transform='translate(400,0)'>
          <SankeyPlot
            totalNum={totalNum}
            axisOrder={axisOrder}
            proportionData={proportionData}
            sankeyData={sankeyData}
            constraints={constraints}
          ></SankeyPlot>
        </g>
        
        {/* <ClockBlock></ClockBlock> */}
        {/* <BayesianNetwork></BayesianNetwork> */}
        {/* <SankeyPlot></SankeyPlot> */}
        {/* <ParallelPlot></ParallelPlot> */}
      </svg>}
    </div>
  );
};

export default ModelView;