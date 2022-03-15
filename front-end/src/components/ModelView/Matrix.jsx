import React, { memo } from 'react';

// const matrixData = [[1, 0.2, 0.3], [0.8, 1, 0.5], [0.9, 0.1, 1]];

const Matrix = memo((props) => {
  const { matrixData } = props;

  const [width, height] = [400, 400];
  const margin = {
    left: 50,
    top: 50,
  }
  const matrixSize = 300
  const rectPadding = 3,
    rectSize = parseInt(matrixSize / matrixData.length) - rectPadding;
  const cellSize = rectSize + rectPadding;

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {
          matrixData && matrixData.map((row, r_index) => {

            return row.map((column, c_index) => {
              const x = c_index * cellSize;
              const y = r_index * cellSize;
              return (
                <g key={`${r_index}-${c_index}`}>
                  <rect
                    x={x}
                    y={y}
                    width={rectSize}
                    height={rectSize}
                    fill='#333'
                    fillOpacity={column}
                  ></rect>
                </g>
              )
            })
          })
        }
      </g>
    </svg>
  )
})

export default Matrix;