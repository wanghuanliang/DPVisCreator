import React, { memo, useMemo } from 'react';
import * as d3 from 'd3';
import { ReactComponent as FocusIcon } from "../../assets/focus.svg";

const svgWidth = 700, svgHeight = 540;
const margin = { top: 60, right: 50, bottom: 30, left: 60 };
const width = svgWidth - margin.left - margin.right,
  height = svgHeight - margin.top - margin.bottom;

const lineTotalHeight = height - 20;
const lineWidth = 10; // 每根柱子的宽度
const intervalTotalHeight = 20; // 柱子间总间隔相同

const constraints = [{
  id: 'C0',
  type: 'cluster',
}, {
  id: 'C2',
  type: 'order'
}];

const SankeyPlot = (props) => {
  const {
    totalNum,
    axisOrder,
    proportionData,
    sankeyData,
    constraints,
    patternColor,
    patternType,
    selectedId,
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

  // backgroundSankeyPos: [d, d, d, d, d......]
  // constraintsSankeyPos: {c1: [d, d, d, d......], c2: [d, d, d, d......]}
  // constraintsSankeyPos: {c1: [{d: d, gather: true}, d, d, d......], c2: [d, d, d, d......]} 
  // 新增需求，显示聚焦pattern文字，focusPattern=[{source: '',target: '', pattern: [P1、P2]}]
  const [backgroundSankeyPos, constraintsSankeyPos, focusPattern] = useMemo(() => {
    const backgroundSankeyPos = [];
    const constraintsSankeyPos = {};
    const focusPattern = [];
    constraints.forEach(constraint => {
      const constraintId = constraint.id;
      constraintsSankeyPos[constraintId] = []
    });
    // 遍历每一个间隔
    sankeyData.forEach(obj => {
      const currentFocusPattern = []; // 当前间隔的聚焦pattern
      const x1 = xScale(obj.source_attr) + lineWidth; // source x坐标
      const x2 = xScale(obj.target_attr); // target x坐标
      // 当前每根小柱子起点坐标 [, , ,] [, , ,], 每个间隔初始化为0, 深拷贝
      const sourceStartPos = [...currentStartPos[obj.source_attr]];
      const targetStartPos = [...currentStartPos[obj.target_attr]];
      // y二维数组，source的i，target的j对应的起始坐标
      const sourceLength = proportionData[obj.source_attr].length;
      const targetLength = proportionData[obj.target_attr].length;
      const ySource = new Array(sourceLength).fill().map(() => new Array(targetLength).fill(0));
      const yTarget = new Array(sourceLength).fill().map(() => new Array(targetLength).fill(0));
      // 遍历每一个间隔内的背景桑基
      obj.background.forEach(sankey => {
        // 计算每个点的坐标
        const sankeyHeight = sankey.num / totalNum * lineTotalHeight; // 一条sankey高度
        // const x1 = x1;
        const y1 = sourceStartPos[sankey.source];
        // const x2 = x2;
        const y2 = targetStartPos[sankey.target];
        const x3 = x2;
        const y3 = y2 + sankeyHeight;
        const x4 = x1;
        const y4 = y1 + sankeyHeight;
        const p = d3.path();
        p.moveTo(x1, y1);
        // p.lineTo(x2, y2);
        // 二次贝塞尔
        p.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2);
        p.lineTo(x3, y3);
        // p.lineTo(x4, y4);
        // 二次贝塞尔
        p.bezierCurveTo((x3 + x4) / 2, y3, (x3 + x4) / 2, y4, x4, y4);
        p.closePath();
        backgroundSankeyPos.push(p._);
        // 更新y二维数组, 记录每根sankey位置
        ySource[sankey.source][sankey.target] = y1;
        yTarget[sankey.source][sankey.target] = y2;
        // 更新每根小柱子下一个起点
        sourceStartPos[sankey.source] += sankeyHeight;
        targetStartPos[sankey.target] += sankeyHeight;
      })
      // 遍历每一个间隔内的约束桑基
      constraints.forEach(constraint => {
        const constraintId = constraint.id;
        // 新增需求，一个间隔内的约束桑基，只绘制topN的, 对约束进行原地排序
        // const n = 2;
        // (obj.constraints?.[constraintId] || []).sort((a, b) => b.num - a.num);
        // 新增需求，同一个source，判断流向的target。计算一下每一个source的总和num, [20, 50];
        const sourceTotalNum = new Array(10).fill(0);
        (obj.constraints?.[constraintId] || []).forEach((sankey, i) => {
          const index = sankey.source;
          sourceTotalNum[index] += sankey.num;
        });
        // modelData.constraints内可能缺失桑基？（好像不可能）
        (obj.constraints?.[constraintId] || []).forEach((sankey, index) => {
          // if (index >= n) return;
          // 计算每个点坐标
          const sankeyHeight = sankey.num / totalNum * lineTotalHeight; // 一条sankey高度
          // const x1 = x1;
          const y1 = ySource[sankey.source][sankey.target];
          // const x2 = x2;
          const y2 = yTarget[sankey.source][sankey.target];
          const x3 = x2;
          const y3 = y2 + sankeyHeight;
          const x4 = x1;
          const y4 = y1 + sankeyHeight;
          const p = d3.path();
          p.moveTo(x1, y1);
          // p.lineTo(x2, y2);
          // 二次贝塞尔
          p.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2);
          p.lineTo(x3, y3);
          // p.lineTo(x4, y4);
          // 二次贝塞尔
          p.bezierCurveTo((x3 + x4) / 2, y3, (x3 + x4) / 2, y4, x4, y4);
          p.closePath();
          let gather = false;
          if (sankey.num / sourceTotalNum[sankey.source] > 0.8) { // 调整占比
            gather = true;
            // 还没有则加入currentFocusPattern
            if (currentFocusPattern.indexOf(constraintId) === -1) {
              currentFocusPattern.push(constraintId);
            }
          }
          // constraintsSankeyPos[constraintId].push(p._);
          constraintsSankeyPos[constraintId].push({
            d: p._,
            gather: gather,
          });
        })
      })
      focusPattern.push({
        source: obj.source_attr,
        target: obj.target_attr,
        pattern: currentFocusPattern,
      })
    })

    return [backgroundSankeyPos, constraintsSankeyPos, focusPattern];
  }, [sankeyData, proportionData, currentStartPos, totalNum, xScale]);

  return (
    <svg width={svgWidth} height={svgHeight}>
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* 背景桑基 */}
        <g key="background">
          {
            backgroundSankeyPos.map((d, i) => {
              let color = "#ccc";
              return <path
                key={i}
                d={d}
                fill={color}
                fillOpacity={0.3}
                // stroke="#333"
                // strokeOpacity={0.5}
              ></path>
            })
          }
        </g>
        {/* 约束桑基 */}
        {
          Object.keys(constraintsSankeyPos).map((constraintId, i) => {
            // let colorArray = ['#d0c7df', '#e0cdc1'];
            // let color = colorArray[i];
            return <g key={constraintId}>
              {
                constraintsSankeyPos[constraintId].map((obj, i) => {
                  // let color = "#000";
                  const d = obj.d,
                    gather = obj.gather;
                  const selected = selectedId.indexOf(constraintId) !== -1;
                  return <path
                    key={i}
                    d={d}
                    fill={patternColor[patternType[constraintId]]}
                    fillOpacity={selected ? 0.6 : 0}
                    stroke="#FF9845"
                    strokeOpacity={selected && gather ? 1 : 0}
                    // strokeOpacity={0}
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
                    stroke='#999'
                  ></rect>
                })
              }
            </g>
          })
        }
        {/* 绘制focus */}
        <g transform='translate(0, -8)'>
          {/* <text
            x={-25}
            y={0}
            // alignmentBaseline='central'
            textAnchor='middle'
          >focus</text> */}
          {
            focusPattern.map((obj, index) => {
              const { source, target, pattern } = obj;
              if (selectedId.length === 0) return null;
              if (pattern.length === 0) return null;
              let text = '', length = 0; // length表示能显示的个数
              pattern.forEach(id => {
                if (selectedId.indexOf(id) !== -1) {
                  text += String(id + ' ');
                  length++;
                }
              })
              if (text === '') return null;
              const x = (xScale(source) + lineWidth + xScale(target)) / 2;
              return <g key={source + '-' + target}>
                {/* <foreignObject></foreignObject> */}
                {length >=2 && <g transform={`translate(${x-12.5}, -40)`}>
                  <FocusIcon></FocusIcon>
                </g>}
                <text
                  x={x}
                  y={0}
                  textAnchor='middle'
                  fill='#333'
                >{text}</text>
              </g>
            })
          }
        </g>
      </g>
    </svg>
  )
}

export default SankeyPlot;