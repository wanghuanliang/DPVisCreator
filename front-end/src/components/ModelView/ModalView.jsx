import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ModalView.less';
import { Switch, Slider, InputNumber, Row, Col, Space } from 'antd';
import { CheckCircleOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons';
import * as d3 from 'd3'
import ClockBlock from './ClockBlock/ClockBlock';
import BayesianNetwork from './BayesianNetwork/BayyesianNetWork';
import ParallelPlot from './ParallelPlot';
import SankeyPlot from './SankeyPlot';
import Matrix from './Matrix';
import { debounce } from 'lodash';

const ModalView = (props) => {
  const [privacyBudgetValue, setPrivacyBudget] = useState(0.8)
  // 光标的水平的位置
  const [clientX, setClientX] = useState(0)
  // 是否在拖动
  const [isResizing, setIsResizing] = useState(false);
  // 左侧宽度
  const [menuWidth, setMenuWidth] = useState(100);
  // 开始、移动、结束拖拽事件
  const handleStartResize = useCallback((e) => {
    console.log(e);
    setClientX(e.clientX)
    setIsResizing(true)
  }, []);
  const handleResize = useCallback(debounce(e => {
    if (!isResizing) return;
    const offset = e.clientX - clientX;
    const width = menuWidth + offset;
    setMenuWidth(width);
  }, 10), [menuWidth, clientX]);
  const handleStopResize = useCallback(() => {
    setIsResizing(false);
  })
  //监听光标移动
  useEffect(() => {
    document.addEventListener('mousemove', handleResize)
    return () => {
      document.removeEventListener('mousemove', handleResize)
    }
  }, [handleResize])
  //监听鼠标松开
  useEffect(() => {
    document.addEventListener('mouseup', handleStopResize)
    return () => {
      document.removeEventListener('mouseup', handleStopResize)
    }
  }, [handleStopResize])
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
          {/* <div style={{position: 'absolute', left: '0', width: 200}}>
            <div style={{float: 'left'}}>123</div>
            <div>456</div>
            <div style={{float: 'right'}}>789</div>
          </div> */}
          <div className="constraints-block" style={{ backgroundColor: '#f2d1cc', width: `${menuWidth}px` }}>Cluster</div>
          <div className="resizeHandle" onMouseDown={handleStartResize}> 1</div>
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
      <div style={{display:'flex'}}>
        {/* <ClockBlock></ClockBlock> */}
        {/* <BayesianNetwork></BayesianNetwork> */}
        {/* <SankeyPlot></SankeyPlot> */}
        <Matrix></Matrix>
        <ParallelPlot></ParallelPlot>
      </div>
    </div>
  );
};

export default ModalView;