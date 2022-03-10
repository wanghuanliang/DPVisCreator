import React, { useState, useRef, useEffect } from 'react';
import './ModalView.less';
import { Switch, Slider, InputNumber, Row, Col, Space } from 'antd';
import { CheckCircleOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons';
import * as d3 from 'd3'
import ClockBlock from './ClockBlock/ClockBlock';
import BayesianNetwork from './BayesianNetwork/BayyesianNetWork';
import ParallelPlot from './ParallelPlot';
import SankeyPlot from './SankeyPlot';

const ModalView = (props) => {
  const [privacyBudgetValue, setPrivacyBudget] = useState(0.8)

  const renderModalControlPanel = () => {
    return (
      <div className="modal-control-panel">
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
          <div className="constraints-block" style={{backgroundColor: '#f2d1cc'}}>Cluster</div>
          <div className="constraints-block" style={{backgroundColor: '#fae1ca'}}>Correlation</div>
          <div className="constraints-block" style={{ backgroundColor: '#fae1ec' }}>Order</div>
          <div style={{display: 'inline-block', width: 20}}></div>
          <span>Show CPT</span>
          <Switch></Switch>
        </Space>
      </div>
    )
  }

  // const renderFlowChart = () => {
  //   return (
  //     <div className="flow-path">
  //       <span>
  //         {/* <CheckOutlined style={{color: '#000'}}/> */}
  //       <CheckCircleOutlined style={{width:30, height: 30}}/>
  //       Constraints
  //       </span>
  //       <span><RightOutlined /></span>
  //       <span>
  //         <CheckCircleOutlined style={{width:30, height: 30}}/>
  //         Structure
  //       </span>
  //       <span><RightOutlined /></span>
  //       <span>
  //         <CheckCircleOutlined style={{width:30, height: 30}}/>
  //         Parameter
  //       </span>
  //       <span><RightOutlined /></span>
  //       <span>
  //         <CheckCircleOutlined style={{width:30, height: 30}}/>
  //       Sampling
  //       </span>
  //     </div>
  //   )
  // }

  return (
    <div>
      {renderModalControlPanel()}
      {/* {renderFlowChart} */}
      {/* <ClockBlock></ClockBlock> */}
      {/* <BayesianNetwork></BayesianNetwork> */}
      {/* <ParallelPlot></ParallelPlot> */}
      <SankeyPlot></SankeyPlot>
    </div>
  );
};

export default ModalView;