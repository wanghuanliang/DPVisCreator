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
import WeightsTable from './WeightsTable/WeightsTable';
import Projection from './Projection/Projection';
import { getMetrics } from '../../services/api';

const [svgWidth, svgHeight] = [1118, 550];
const margin = {
  left: 0,
  top: 50,
  right: 0,
  bottom: 0
}
const constraints = [{
  id: 'C0',
  type: 'cluster',
}, {
  id: 'C1',
  type: 'correlation'
  }, {
  id: 'C2',
  type: 'order'
}];
// 约束模式颜色
const patternColor = {
  original: '#dedede',
  cluster: '#9cb0a2',
  correlation: '#c39b83',
  order: '#bbafd1',
}

const ModelView = (props) => {
  const {
    setWeights,
    modelData,
    setProtectedData,
  } = props;
  const {
    total_num: totalNum,
    axis_order: axisOrder,
    proportion_data: proportionData,
    // flow_data: flowData,
    constraints,
    // matrix_data: matrixData,
    sankey_data: sankeyData,
  } = modelData;

  const [privacyBudgetValue, setPrivacyBudget] = useState(0.8); // 整体隐私预算
  const [patternWeights, setPatternWeights] = useState(null); // 权重{'c1': 1, 'c2': 1}
  const [constraintsPos, setConstraintsPos] = useState(null); // 约束坐标
  const [selectedId, setSelectedId] = useState([]); // 选中点亮的约束
  
  // modelData修改，更新patternWeights、constraintsPos, 清空selectedId
  const [initialPatternWeight, patternType] = useMemo(() => {
    const initial = {}, patternType = {};
    constraints.forEach(constraint => {
      initial[constraint.id] = 0.8
      patternType[constraint.id] = constraint.type;
    });
    initial.others = 0.8
    patternType.others = 'others';
    return [initial, patternType];
  }, [constraints]);
  useEffect(() => {
    setPatternWeights(initialPatternWeight);
    setConstraintsPos(constraints);
    setSelectedId([]);
  }, [constraints, initialPatternWeight]);
  
  // 点击update，更新constraintsPos
  const handleUpdateClick = () => {
    const data = {}
    data.bayes_budget = privacyBudgetValue;
    data.weights = [];
    Object.entries(patternWeights).forEach(([key, value]) => {
      data.weights.push({ id: key, weight: value });
    })
    console.log('updateClick', data);
    setWeights(data)
      .then(res => setConstraintsPos(res.data.constraints))
      .catch(e => console.log('e', e));
  }

  // 点击record，发送请求
  const handleRecordClick = () => {
    getMetrics()
      .then(res => console.log('res', res.data.scheme))
      .catch(e => console.log(e));
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
        <foreignObject
          x={30}
          y={10}
          width={350}
          height={200}
        >
          {patternWeights && <WeightsTable
            patternWeights={patternWeights}
            setPatternWeights={setPatternWeights}
            handleUpdateClick={handleUpdateClick}
            patternType={patternType}
          ></WeightsTable>}
        </foreignObject>
        <g transform='translate(0, 200)'>
          {constraintsPos && <Projection
            constraints={constraintsPos}
            patternColor={patternColor}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          ></Projection>}
        </g>
        <g transform='translate(400,0)'>
          <SankeyPlot
            totalNum={totalNum}
            axisOrder={axisOrder}
            proportionData={proportionData}
            sankeyData={sankeyData}
            constraints={constraints}
            patternColor={patternColor}
            patternType={patternType}
            selectedId={selectedId}
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