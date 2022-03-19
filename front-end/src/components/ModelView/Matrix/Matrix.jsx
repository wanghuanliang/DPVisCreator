import React, { memo } from 'react';
import RingPlot from './RingPlot';
import { Button, InputNumber } from 'antd';

// 临时数据
const matrixData = [[0.5, 0.2, 1], [0.7, 0.75, 0.5], [0.1, 0.1, 0.25255]];
const constraints = [{
  id: 'C0',
  type: 'cluster',
}, {
  id: 'C1',
  type: 'correlation'
  }, {
  id: 'C2',
  type: 'order'
}];
// 绘图相关全局变量
const [width, height] = [400, 400];
const margin = {
  left: 100,
  top: 100,
}

const Matrix = memo((props) => {
  const {
    constraints,
    matrixData,
    computeColor,
    patternColor,
    patternWeights,
    setPatternWeights,
  } = props;

  const matrixSize = 300;
  const cellSize = parseInt(matrixSize / matrixData.length);
  const rectPadding = 1.5,
    rectSize = cellSize - rectPadding * 2;

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {
          matrixData && matrixData.map((row, r_index) => {

            return row.map((value, c_index) => {
              const x = c_index * cellSize;
              const y = r_index * cellSize;
              return (
                <g key={`${r_index}-${c_index}`}>
                  {
                    r_index === c_index ? 
                      <g transform={`translate(${x}, ${y})`}>
                        <RingPlot
                          x={x}
                          y={y}
                          size={cellSize}
                          proportion={value}
                          needText={true}
                        ></RingPlot>
                      </g>
                      :
                      <rect
                        x={x + rectPadding}
                        y={y + rectPadding}
                        width={rectSize}
                        height={rectSize}
                        fill={computeColor(value)}
                        // fillOpacity={value}
                      ></rect>
                  }
                </g>
              )
            })
          })
        }
        {/* 绘制横向文本 */}
        {
          constraints.map((constraint, index) => {
            const constraintId = constraint?.id;
            const constraintType = constraint?.type;
            const color = patternColor[constraintType];
            const x = index * cellSize + cellSize / 2;
            const y = -14;
            const fontWidth = 30;
            const fontHeight = 20;
            return <g key={constraintId}>
              <rect
                x={x - fontWidth / 2}
                y={y - fontHeight / 2}
                width={fontWidth}
                height={fontHeight}
                fill='white'
                stroke={color}
                strokeWidth={2}
                rx='1%'
                ry='1%'
              ></rect>
              <text
                x={x}
                y={y}
                textAnchor="middle"
                alignmentBaseline='central'
                fill={color}
                fontWeight='bold'
              >{constraintId}</text>
            </g>
          })
        }
        {/* 绘制纵向文本 */}
        {
          constraints.map((constraint, index) => {
            const constraintId = constraint?.id;
            const constraintType = constraint?.type; 
            const color = patternColor[constraintType];
            const x = -20;
            const y = index * cellSize + cellSize / 2;
            const fontWidth = 30;
            const fontHeight = 20;
            return <g key={constraintId}>
              <rect
                x={x - fontWidth / 2}
                y={y - fontHeight / 2}
                width={fontWidth}
                height={fontHeight}
                fill='white'
                stroke={color}
                strokeWidth={2}
                rx='1%'
                ry='1%'
              ></rect>
              <text
                x={x}
                y={y}
                textAnchor="middle"
                alignmentBaseline='central'
                fill={color}
                fontWeight='bold'
              >{constraintId}</text>
              <foreignObject
                width={100}
                height={100}
                x={x - 80}
                y={y - 12}
              >
                <InputNumber
                  size='small'
                  min={0}
                  max={1}
                  step={0.1}
                  style={{ width: 60 }}
                  value={patternWeights?.[constraintId]}
                  onChange={value => {
                    patternWeights[constraintId] = value;
                    setPatternWeights({...patternWeights})
                  }}
                ></InputNumber>
              </foreignObject>
            </g>
          })
        }
      </g>
    </svg>
  )
})

export default Matrix;