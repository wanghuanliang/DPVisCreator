import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

// const [svgWidth, svgHeight] = [400, 400];
const margin = {
  top: 10,
  right: 20,
  bottom: 20,
  left: 20,
}
// const width = svgWidth - margin.left - margin.right,
//   height = svgHeight - margin.top - margin.bottom;

const width = 360, height = 290;
const svgWidth = width + margin.left + margin.right,
  svgHeight = height + margin.bottom + margin.top;

const Projection = (props) => {
  const {
    constraints,
    patternColor,
    selectedId,
    setSelectedId,
    matrixData,
  } = props;

  // 暂存点坐标，画边用
  const patternPos = useMemo(() => {
    const patternPos = {};
    constraints.forEach(constraint => {
      patternPos[constraint.id] = constraint.pos;
    })
    return patternPos;
  }, [constraints]);

  const xScale = d3.scaleLinear()
    .domain([0, 124])
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);
  
  const rScale = xScale;
  
  const xGrid = [0,124];
  const yGrid = [0,100];
  
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
            {/* <text
              x={xScale(x)}
              y={yScale(0)}
              textAnchor='middle'
              dy={20}
              fill='#888'
            >{x}</text> */}
          </g>
        })}

      </g>
      {/* y轴 */}
      <g className='xAxis'>
        {yGrid.map(y => {
          return <g key={y}>
            <line
              x1={xScale(0)}
              x2={xScale(124)}
              y1={yScale(y)}
              y2={yScale(y)}
              stroke='#ccc'
            ></line>   
            {/* <text
              x={xScale(0)}
              y={yScale(y)}
              alignmentBaseline='central'
              textAnchor='end'
              dx={-10}
              fill='#888'
            >{y}</text> */}
          </g>
        })}
      </g>
      {/* 图例 */}
      {/* <PlotLegend
        style={{ width: 50, height: 50}}
      ></PlotLegend> */}
      <g transform='translate(255,0)'>
        <defs>
          <marker
            id="triangle"
            markerUnits="strokeWidth"
            markerWidth="1"
            markerHeight="1"
            refX="1"
            refY="0.5"
            orient="auto"
          >
            <path
              fill="#5D7092"
              d="M 0 0 L 1 0.5 L 0 1 z"
            />
          </marker>
        </defs>
        <g>
          <circle
            cx={10}
            cy={10}
            r={5}
            fill='#CED4DE'
          ></circle>
          <circle
            cx={30}
            cy={10}
            r={5}
            fill='#CED4DE'
          ></circle>
          <line
            x1={10}
            y1={10}
            x2={30}
            y2={10}
            stroke='#5D7092'
            markerEnd='url(#triangle)'
          ></line>
          <text
            x={40}
            y={9}
            fontSize={8}
          >Data distribution</text>
          <text
            x={40}
            y={18}
            fontSize={8}
          >distance</text>
        </g>
        <g>
          <rect
            x={7}
            y={25}
            width={26}
            height={8}
            fill='#CED4DE'
          ></rect>
          <line
            x1={20}
            y1={25}
            x2={20}
            y2={33}
            stroke='#5D7092'
          ></line>
          <text
            x={40}
            y={32}
            fontSize={8}
          >MI influence</text>
        </g>
        <g>
          <rect
            x={7}
            y={40}
            width={26}
            height={8}
            fill='#CDF3E4'
          ></rect>
          <text
            x={40}
            y={47}
            fontSize={8}
          >Positive</text>
        </g>
        <g>
        <rect
            x={7}
            y={54}
            width={26}
            height={8}
            fill='#F8D0CB'
          ></rect>
          <text
             x={40}
             y={61}
             fontSize={8}
          >Negative</text>
        </g>
      </g>
     {/* 边 */}
     <g className='link'>
        {patternPos && matrixData.map((link, index) => {
          const startPos = patternPos?.[link.source],
            endPos = patternPos?.[link.target];
          
          return <line
            key={index}
            x1={xScale(startPos[0])}
            y1={yScale(startPos[1])}
            x2={xScale(endPos[0])}
            y2={yScale(endPos[1])}
            stroke={link.value > 0 ? '#CDF3E4' : '#F8D0CB'}
            strokeWidth={Math.abs(link.value * 4)}
          ></line>
        })}
      </g>
      {/* 圆点 */}
      <g className='circle'>
        {
          constraints.map(constraint => {
            const x = constraint.pos[0],
              y = constraint.pos[1];
            const id = constraint.id;
            const type = constraint.type;
            return <g key={constraint.id}>
              <circle
                cx={xScale(x)}
                cy={yScale(y)}
                r={rScale(constraint.r)}
                fill={patternColor[type]}
                stroke='#f0943d'
                strokeWidth={2}
                strokeOpacity={selectedId.indexOf(id) === -1 ? 0 : 1}
              ></circle>
              <text
                x={xScale(x)}
                y={yScale(y)}
                textAnchor='middle'
                alignmentBaseline='central'
                fill='#333'
              >{constraint.id}</text>
              {/* 点击区域 */}
              <circle
                cx={xScale(x)}
                cy={yScale(y)}
                r={rScale(constraint.r)}
                fill={patternColor[type]}
                opacity={0}
                onClick={() => {
                  const index = selectedId.indexOf(id);
                  if (index === -1) {
                    selectedId.push(id);
                    setSelectedId([...selectedId]);
                  } else {
                    selectedId.splice(index, 1);
                    setSelectedId([...selectedId]);
                  }
                }}
                style={{cursor: 'pointer'}}
              ></circle>
            </g>
          })  
        }
      </g>
      
    </g>
    
  </svg>

}

export default Projection;