import React from 'react';
import * as d3 from 'd3';

const RingPlot = (props) => {
  const {
    size,
    proportion,
    needText,
  } = props;

  const backgroundArc = d3.arc()
    .innerRadius(size / 2 / 5 * 3)
    .outerRadius(size / 2 / 5 * 4)
    .startAngle(0)
    .endAngle(Math.PI * 2);
  
  const priorArc = d3.arc()
    .innerRadius(size / 2 / 5 * 3)
    .outerRadius(size / 2 / 5 * 4)
    .startAngle(0)
    .endAngle(Math.PI * 2 * proportion)


  return <>
    <g transform={`translate(${size/2}, ${size/2})`}>
      <path
        d={backgroundArc()}
        fill='#d8d8d8'
      ></path>
      <path
        d={priorArc()}
        fill='#9fd4fb'
      ></path>
      { needText && <text
        textAnchor='middle'
        alignmentBaseline='middle'
      >{(proportion * 100).toFixed() + '%'}</text>}
    </g>
  </>
}

export default RingPlot;