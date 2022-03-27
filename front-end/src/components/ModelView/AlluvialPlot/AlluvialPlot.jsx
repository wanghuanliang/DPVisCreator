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
  // flowPos: [{flowIndex: 0, constraintId: c1, pos: ['d', 'd', 'd']}]
  const flowPos = useMemo(() => {
    const flowPos = [];
    flowData.forEach(obj => {
      const currentPos = {};
      currentPos.flowIndex = obj.flow_index
      currentPos.constraintId = obj.constraint_id;
      currentPos.pos = []
      const pos = obj.pos;  // 该flow的每个维度坐标数据
      const flowHeight = obj.num / totalNum * lineTotalHeight; //flow宽度
      // fix: axisOrder.length 为1时候处理
      for (let i = 0; i < axisOrder.length - 1; i++) {
        const startAttr = axisOrder[i];
        const endAttr = axisOrder[i + 1];
        const startRowIndex = pos[startAttr]; //一根大柱子中的第几根小柱子
        const endRowIndex = pos[endAttr];
        // 计算每个点的坐标
        const firstX = xScale(startAttr) + lineWidth;
        const firstY = currentStartPos[startAttr][startRowIndex];
        const secondX = xScale(endAttr);
        const secondY = currentStartPos[endAttr][endRowIndex];
        const thirdX = secondX;
        const thirdY = secondY + flowHeight;
        const fourthX = firstX;
        const fourthY = firstY + flowHeight;
        const p = d3.path();
        p.moveTo(firstX, firstY);
        p.lineTo(secondX, secondY);
        p.lineTo(thirdX, thirdY);
        p.lineTo(fourthX, fourthY);
        p.closePath();
        currentPos.pos.push(p._);
      }
      // 修改currentStartPos
      // for (let i = 0; i < axisOrder.length; i++) {
      //   const rowIndex = pos[axisOrder[i]];
      //   currentStartPos
      // }
      axisOrder.forEach(attr => {
        const rowIndex = pos[attr];
        currentStartPos[attr][rowIndex] += flowHeight;
      })
      flowPos.push(currentPos);
    })
    return flowPos;
  // currentStartPOs对象更改，浅比较也是没有变得
  }, [axisOrder, totalNum, flowData, xScale]);

  return (
    <svg width={svgWidth} height={svgHeight}>
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* 绘制flow，先直线 */}
        {
          flowPos.map(obj => {
            let color = "#ccc";
            if (obj.constraintId === "C0") color = "#dcd6e7";
            else if (obj.constraintId === "C2") color = "#cdd7d0";
            return <g key={obj.flowIndex}>
              {
                obj.pos.map((d, i) => {
                  return <path
                    key={i}
                    d={d}
                    fill={color}
                    stroke={color}
                    // strokeOpacity={0.5}
                  ></path>
                })
              }
            </g>
          })
        }
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
      </g>
    </svg>
  )

})

export default AlluvialPlot;