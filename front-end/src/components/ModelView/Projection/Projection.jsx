import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// const [svgWidth, svgHeight] = [400, 400];
const margin = {
  top: 20,
  right: 20,
  bottom: 100,
  left: 50,
}
// const width = svgWidth - margin.left - margin.right,
//   height = svgHeight - margin.top - margin.bottom;

const width = 300, height = 300;
const svgWidth = width + margin.left + margin.right,
  svgHeight = height + margin.bottom + margin.top;

const Projection = (props) => {
  const {
    constraints,
    patternColor,
  } = props;
  console.log('lalala', constraints);

  const xAxisRef = useRef(null);
  const xScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);
  
  const rScale = xScale;
  
  const xGrid = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const yGrid = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  
  return <svg width={svgWidth} height={svgHeight}>
    {/* 散点图 */}
    <g transform={`translate(${margin.left}, ${margin.top})`}>
      {/* x轴 */}
      <g className='xAxis'>
        {xGrid.map(x => {
          return <g key={x}>
            <line
              x1={xScale(x)}
              x2={xScale(x)}
              y1={yScale(0)}
              y2={yScale(100)}
              stroke='#ccc'
            ></line>   
            <text
              x={xScale(x)}
              y={yScale(0)}
              textAnchor='middle'
              dy={20}
              fill='#888'
            >{x}</text>
          </g>
        })}

      </g>
      {/* y轴 */}
      <g className='xAxis'>
        {yGrid.map(y => {
          return <g key={y}>
            <line
              x1={xScale(0)}
              x2={xScale(100)}
              y1={yScale(y)}
              y2={yScale(y)}
              stroke='#ccc'
            ></line>   
            <text
              x={xScale(0)}
              y={yScale(y)}
              alignmentBaseline='central'
              textAnchor='end'
              dx={-10}
              fill='#888'
            >{y}</text>
          </g>
        })}
      </g>
      {/* 图例 */}
      {/* 圆点 */}
      <g className='circle'>
        {
          constraints.map(constraint => {
            const x = constraint.pos[0],
              y = constraint.pos[1];
            const type = constraint.type;
            return <g key={constraint.id}>
              <circle
                cx={xScale(x)}
                cy={yScale(y)}
                r={rScale(constraint.r)}
                fill={patternColor[type]}
              ></circle>
              <text
                x={xScale(x)}
                y={yScale(y)}
                textAnchor='middle'
                alignmentBaseline='central'
                fill='#333'
              >{constraint.id}</text>
            </g>
          })  
        }
    </g>
    </g>
    
  </svg>

}

export default Projection;