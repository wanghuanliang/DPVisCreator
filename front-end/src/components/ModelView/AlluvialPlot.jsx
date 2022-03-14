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
    axisOrder,
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
  // currentStartPos {charges: [0, 0, 0, 0], bmi: [,,,]}
  const [linePos, currentStartPos] = useMemo(() => {
    let linePos = {}, currentStartPos = {};
    axisOrder.forEach(attr => {
      linePos[attr] = [];
      currentStartPos[attr] = [];
      let start = 0;
      // 间隔高度
      let intervalHeight = proportionData[attr].length > 1 ?
        intervalTotalHeight / (proportionData[attr].length - 1) : 0;
      
      proportionData[attr].forEach(obj=> {
        let num = obj.num;
        let height = num / totalNum * lineTotalHeight;
        linePos[attr].push({ start: start, height: height })
        currentStartPos[attr].push(start);
        start += height + intervalHeight;
      })
    })
    return [linePos, currentStartPos];
  }, [proportionData, totalNum, axisOrder])
  console.log("linePos", linePos);

  //相关约束属性集合
  const attrArray = Object.keys(proportionData);

  // flowPos: [{flowIndex: 0, patternId: c1, pos: ['d', 'd', 'd']}]
  // const flowPos = useMemo(() => {
  //   const flowPos = [];
  //   flowData.forEach(obj => {
  //     const currentPos = {};
  //     currentPos.flowIndex = obj.flowIndex
  //     currentPos.pos = []
  //     const pos = obj.pos;
  //     const flowHeight = obj.num / totalNum * lineTotalHeight;
  //     // fix: attrArray.length 为1时候处理
  //     for (let i = 0; i < attrArray.length - 1; i++) {
  //       // 计算每个点的坐标
  //       const firstX = xScale(attrArray[i]) + lineWidth;
  //       const firstY = currentPos[attrArray[i]][pos[i]];
  //       const secondX = xScale(attrArray[i + 1]);
  //       const secondY = currentPos[attrArray[i + 1]][pos[i + 1]];
  //       const thirdX = secondX;
  //       const thirdY = secondY + flowHeight;
  //       const fourthX = firstX;
  //       const fourthY = firstY + flowHeight;
  //       const p = d3.path();
  //       p.moveTo(firstX, firstY);
  //       p.lineTo(secondX, secondY);
  //       p.lineTo(thirdX, thirdY);
  //       p.lineTo(fourthX, fourthY);
  //       currentPos.pos.push(p._);
  //     }
  //     flowPos.push(currentPos);
  //   })
  //   return flowPos;
  // });
  // console.log(flowPos);
  // const p = d3.path();
  // p.moveTo(0, 0);
  // p.lineTo(200, 0);
  // p.lineTo(200, 50);
  // p.lineTo(0, 50);
  // p.closePath();
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
        {/* {
          <path
            d={p._}
          ></path>
        } */}
        {/* {
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
        } */}
      </g>
    </svg>
  )

})

export default AlluvialPlot;