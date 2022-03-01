import React, { useState, useRef, useEffect } from 'react';
import './ModalView.less';
import { Switch, Slider, InputNumber, Row, Col, Space } from 'antd';
import { CheckCircleOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons';
import * as d3 from 'd3'

const ModalView = (props) => {
  const [privacyBudgetValue, setPrivacyBudget] = useState(0.8)
  const chordDiagramRef = useRef(null);
  
  useEffect(() => {
    const svg = d3.select(chordDiagramRef.current)
      .append("svg")
        .attr("width", 440)
        .attr("height", 440)
      .append("g")
        .attr("transform", "translate(220,220)");
    const matrix = [
      [11975,  5871, 8916, 2868],
      [ 1951, 10048, 2060, 6171],
      [ 8010, 16145, 8090, 8045],
      [ 1013,   990,  940, 6907]
    ];
    var res = d3.chord()
    .padAngle(0.05)     // padding between entities (black arc)
    .sortSubgroups(d3.descending)
    (matrix)

// add the groups on the inner part of the circle
svg
  .datum(res)
  .append("g")
  .selectAll("g")
  .data(function(d) { return d.groups; })
  .enter()
  .append("g")
  .append("path")
    .style("fill", "grey")
    .style("stroke", "black")
    .attr("d", d3.arc()
      .innerRadius(200)
      .outerRadius(210)
    )

// Add the links between groups
svg
  .datum(res)
  .append("g")
  .selectAll("path")
  .data(function(d) { return d; })
  .enter()
  .append("path")
    .attr("d", d3.ribbon()
      .radius(200)
    )
    .style("fill", "#69b3a2")
    .style("stroke", "black");
    
  },[])


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



  return (
    <div>
      {renderModalControlPanel()}
      <div className="flow-path">
        <span>
          {/* <CheckOutlined style={{color: '#000'}}/> */}
          <CheckCircleOutlined style={{width:30, height: 30}}/>
          Constraints
        </span>
        <span><RightOutlined /></span>
        <span>
          <CheckCircleOutlined style={{width:30, height: 30}}/>
          Structure
        </span>
        <span><RightOutlined /></span>
        <span>
          <CheckCircleOutlined style={{width:30, height: 30}}/>
          Parameter
        </span>
        <span><RightOutlined /></span>
        <span>
          <CheckCircleOutlined style={{width:30, height: 30}}/>
          Sampling
        </span>
      </div>
      <div ref={chordDiagramRef}></div>
    </div>
  );
};

export default ModalView;