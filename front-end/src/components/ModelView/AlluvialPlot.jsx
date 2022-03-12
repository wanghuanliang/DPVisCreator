import React, { memo, useMemo } from 'react';
import * as d3 from 'd3';

const svgWidth = 700, svgHeight = 500;
const margin = { top: 30, right: 50, bottom: 30, left: 30 };
const width = svgWidth - margin.left - margin.right,
  height = svgHeight - margin.top - margin.bottom;

const lineTotalHeight = 400
const lineWidth = 20; //每根柱子的宽度
const intervalTotalHeight = 20; //柱子上下间隔高度，暂定都相同

const AlluvialPlot = memo((props) => {
  const {
    totalNum,
    proportionData,
    flowData,
  } = props;

  // xScale
  const xScale = useMemo(() => {
    return d3.scalePoint()
      .domain(Object.keys(proportionData))
      .range([0, width]);
  }, [proportionData])


  // linePos {charges: [{start: 0  height: 100}, {}, {}]}
  // flowPos {charges: [0, 0, 0, 0], bmi: [,,,]}
  const [linePos, flowPos] = useMemo(() => {
    let linePos = {}, flowPos = {};
    Object.keys(proportionData).forEach(attr => {
      linePos[attr] = [];
      flowPos[attr] = [];
      let start = 0;
      let intervalHeight = proportionData[attr].length > 1 ?
        intervalTotalHeight / (proportionData[attr].length - 1) : 0;
      proportionData[attr].forEach((num, index) => {
        let height = num / totalNum * lineTotalHeight;
        linePos[attr].push({ start: start, height: height })
        flowPos[attr].push(start);
        start += height + intervalHeight;
      })
    })
    return [linePos, flowPos];
  }, [proportionData, totalNum])

  // console.log(xScale.bandwidth())
  // console.log(xScale('charges'))
  return (
    <svg width={svgWidth} height={svgHeight}>
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* 绘制柱子 */}
        {
          Object.keys(linePos).map(attr => {
            const x = xScale(attr);
            return <g key={attr + '-axis'}>
              <text
                x={x}
                y={lineTotalHeight+intervalTotalHeight}
                textAnchor='middle'
                dx={lineWidth / 2}
                dy={20}
                fontSize={16}
              >{attr}</text>
              {/* 绘制每段柱子 */}
              {
                linePos[attr].map(info => {
                  const y = info.start;
                  const height = info.height;
                  return <rect
                    key={attr+info.start}
                    x={x}
                    y={y}
                    width={lineWidth}
                    height={height}
                    fill='#fff'
                    stroke='#333'
                  ></rect>
                })
              }
            </g>
            
          })
        }
        {/* 绘制flow，先直线 */}
        {
          flowData.map(flow => {
            const height = flow.num / totalNum * lineTotalHeight;
            return <g key={flow.flowIndex}>
              <line
                x1={xScale('charges')}
                y1={0}
                x2={xScale('bmi')}
                y2={100}
                fill='#333'
              ></line>
            </g>
          })
        }
      </g>
    </svg>
  )

})

export default AlluvialPlot;