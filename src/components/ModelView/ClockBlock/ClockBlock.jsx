import React from 'react';
import * as d3 from 'd3';

const ClockBlock = () => {

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
    <svg width={200} height={200}>
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
      </g>
    </svg> 
  )
}

export default ClockBlock;