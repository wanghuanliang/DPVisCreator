import React, { useEffect, useRef } from 'react';
import './ValidationView.less';
import * as d3 from 'd3';
// import * as geometric from 'geometric';

// const nodeData = [['charges'], ['bmi', 'age', 'smoker'], ['sex', 'children', 'region']];
const nodeData = [['charges'], ['age'], ['bmi', 'smoker'],['sex', 'children', 'region']];
const linkData = [
  ['charges', 'bmi'],
  ['charges', 'age'],
  ['charges', 'smoker'],
  ['age', 'bmi'],
  ['age', 'smoker'],
  ['bmi', 'sex'],
  ['bmi', 'children'],
  ['bmi', 'region'],
  ['age', 'sex'],
  ['age', 'children'],
  ['age', 'region'],
]

const ValidationView = (props) => {
  // const ref = useRef(null);
  const margin = { top: 30, right: 30, bottom: 50, left: 50 },
    width = 500,
    height = 200;
  // useEffect(() => {
  //   const svg = d3.select(ref.current)
  //     .append("svg")
  //     .attr("width", width + margin.left + margin.right)
  //     .attr("height", height + margin.top + margin.bottom)
  //     .append("g")
  //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  // },[])
  // return <div ref={ref}></div>
  const r = 5;

  const calcNodePosition = (nodeData) => {
    const res = {};
    const n = nodeData.length; // 树层数
    //if (n === 1)
    const w = width / (n - 1); // 每层宽度
    for (let i = 0; i < n; i++) {
      const levelData = nodeData[i];
      const m = levelData.length; // 每层个数
      if (m === 1) {
        res[nodeData[i][0]] = [w * i, height / 2];
        continue;
      }
      const h = height / (m - 1); // 每层每个高度
      for (let j = 0; j < m; j++) {
        const name = nodeData[i][j];
        const x = w * i;
        const y = h * j;
        res[name] = [x, y];
      }
    }
    return res;
  }

  const nodePosition = calcNodePosition(nodeData);
  

  return (
    <div>
      <svg
        width={width + margin.left + margin.right}
        height={height + margin.top + margin.bottom}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {
            Object.entries(nodePosition).map(([attribute, position]) => {
              return <circle
                key={attribute}
                cx={position[0]}
                cy={position[1]}
                r={10}
                fill="#82c6e8"
              ></circle>
            })
          }
          {
            linkData.map(([start, end], index) => {
              const startPos = nodePosition[start],
                endPos = nodePosition[end];
              const bezier1Pos = [startPos[0] + (endPos[0] - startPos[0])/3*2, startPos[1]];
              const bezier2Pos = [startPos[0] + (endPos[0] - startPos[0]) / 3, endPos[1]];
              const d = `M ${startPos[0]} ${startPos[1]} C ${bezier1Pos[0]} ${bezier1Pos[1]} ${bezier2Pos[0]} ${bezier2Pos[1]} ${endPos[0]} ${endPos[1]}`
              return <path
                key={index}
                d={d}
                stroke="#a5b1be"
                strokeWidth={2}
                fill='none'
              ></path>
              // return <path
              //   d={`M ${startPos[0]} ${startPos[1]} L ${endPos[0]} ${endPos[1]}`}
              //   stroke="#a5b1be"
              //   strokeWidth={2}
              //   fill='none'
              // ></path>
              // return <line
              //   x1={startPos[0]}
              //   y1={startPos[1]}
              //   x2={endPos[0]}
              //   y2={endPos[1]}
              //   stroke="#a5b1be"
              //   strokeWidth={2}
              // ></line>
            })
          }
          {/* <path id="lineAB" d="M 100 350 l 150 -300" stroke="red"
          stroke-width="3" fill="none" />
          <path id="lineBC" d="M 250 50 l 150 300" stroke="red"
          stroke-width="3" fill="none" />
          <path d="M 175 200 l 150 0" stroke="green" stroke-width="3"
          fill="none" />
          <path d="M 100 350 q 150 -300 300 0" stroke="blue"
          stroke-width="5" fill="none" /> */}
        </g>
      </svg>
    </div>
  )
}

export default ValidationView;