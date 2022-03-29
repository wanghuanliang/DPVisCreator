import React from 'react';

// const nodeData = [['charges'], ['bmi', 'age', 'smoker'], ['sex', 'children', 'region']];
// const nodeData = [['charges'], ['age'], ['bmi', 'smoker'],['sex', 'children', 'region']];
// const linkData = [
//   ['charges', 'bmi'],
//   ['charges', 'age'],
//   ['charges', 'smoker'],
//   ['age', 'bmi'],
//   ['age', 'smoker'],
//   ['bmi', 'sex'],
//   ['bmi', 'children'],
//   ['bmi', 'region'],
//   ['age', 'sex'],
//   ['age', 'children'],
//   ['age', 'region'],
// ];

const svgWidth = 700, svgHeight = 540;
const margin = { top: 30, right: 50, bottom: 30, left: 60 };
const width = svgWidth - margin.left - margin.right,
  height = svgHeight - margin.top - margin.bottom;

const circleRadius = 15; // 圆点半径

const BayesianNetwork = (props) => {
  const { networkData } = props;
  const { nodeData, linkData } = networkData;

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
    <svg
      width={width + margin.left + margin.right}
      height={height + margin.top + margin.bottom}
    >
      {/* 定义箭头 */}
      <defs>
        <marker
          id="triangle0"
          markerUnits="strokeWidth"
          markerWidth="5"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <path
            fill="#CED4DE"
            d="M 0 0 L 5 2 L 0 4 z"
          />
        </marker>
      </defs>
      {/* 画线 */}
      <g transform={`translate(${margin.left},${margin.top})`}>
        
        {
          linkData.map(([start, end], index) => {
            const startPos = nodePosition[start],
              endPos = nodePosition[end];
            const startX = startPos[0] + circleRadius,
              startY = startPos[1],
              endX = endPos[0] - circleRadius,
              endY = endPos[1];
            // x坐标需要加减半径
            const bezier1Pos = [startX + (endX - startX)/3*2, startY];
            const bezier2Pos = [startX + (endX - startX) / 3, endY];
            const d = `M ${startX} ${startY} C ${bezier1Pos[0]} ${bezier1Pos[1]} ${bezier2Pos[0]} ${bezier2Pos[1]} ${endX} ${endY}`
            return <path
              key={index}
              d={d}
              stroke="#CED4DE"
              strokeWidth={2}
              fill='none'
              style={{markerEnd: 'url(#triangle0)'}}
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
        {/* 画点、属性 */}
        {
          Object.entries(nodePosition).map(([attribute, position]) => {
            return <g key={attribute}>
              <circle
                cx={position[0]}
                cy={position[1]}
                r={circleRadius}
                fill="#82c6e8"
              ></circle>
              <text
                x={position[0]}
                y={position[1]}
                textAnchor='middle'
                alignmentBaseline='middle'
                dy={circleRadius + 10}
              >{attribute}</text>
            </g>
          })
        }
      </g>
    </svg>
  )
}

export default BayesianNetwork;