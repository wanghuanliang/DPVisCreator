import React, { useState, useRef, useEffect } from 'react';
import './ModalView.less';
import { Switch, Slider, InputNumber, Row, Col, Space } from 'antd';
import { CheckCircleOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons';
import * as d3 from 'd3'

const ModalView = (props) => {
  const [privacyBudgetValue, setPrivacyBudget] = useState(0.8)
  const arcRef = useRef(null);

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

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(10)
      .startAngle(0)
      .endAngle(Math.PI / 2);
    const arc2 = d3.arc()
    .innerRadius(10)
    .outerRadius(15)
    .startAngle(Math.PI / 4)
    .endAngle(Math.PI);

  return (
    // <div>
    //   {renderModalControlPanel()}
    //   <div className="flow-path">
    //     <span>
    //       {/* <CheckOutlined style={{color: '#000'}}/> */}
    //       <CheckCircleOutlined style={{width:30, height: 30}}/>
    //       Constraints
    //     </span>
    //     <span><RightOutlined /></span>
    //     <span>
    //       <CheckCircleOutlined style={{width:30, height: 30}}/>
    //       Structure
    //     </span>
    //     <span><RightOutlined /></span>
    //     <span>
    //       <CheckCircleOutlined style={{width:30, height: 30}}/>
    //       Parameter
    //     </span>
    //     <span><RightOutlined /></span>
    //     <span>
    //       <CheckCircleOutlined style={{width:30, height: 30}}/>
    //       Sampling
    //     </span>
    //   </div>
    //   <div ref={chordDiagramRef}></div>
    // </div>
    <div>
      {renderModalControlPanel()}
      <svg width={600} height={400}>
        <g transform='translate(100,100)'>
          <circle
            r={10}
            stroke="#cfd4dd"
            fill='none'
          ></circle>
          <circle
            r={15}
            stroke="#cfd4dd"
            fill='none'
          ></circle>
          <path d={arc()} stroke="#cfd4dd" fill='#f2d1cc' strokeWidth="1"></path>
          <path d={arc2()} stroke="#cfd4dd" fill='#d4f2e5' strokeWidth="1"></path>
          {/* <path d="M 100 100 m 75 0 a 75 75 0 0 1 -75 75"
          fill="red" stroke="green" stroke-width="10"/> */}
        </g>
      </svg>
    </div>
  );
};

export default ModalView;