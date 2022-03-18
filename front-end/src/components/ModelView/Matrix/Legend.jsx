import React from 'react';
import RingPlot from './RingPlot';

const colorBlockWidth = 150;
const colorBlockHeight = 20;
const ringSize = 100;
const intervalWidth = 100;
const fontSize =16

// 当前定位为色块左上角为（0，0）
const Legend = (props) => {
  const {
    computeColor
  } = props;

  return <>
    <defs>
      <linearGradient id="color-gradient">
        <stop offset="0%" stopColor={computeColor(0)}></stop>
        <stop offset="100%" stopColor={computeColor(1)}></stop>
      </linearGradient>
    </defs>
    <rect
      x={0}
      y={0}
      width={150}
      height={20}
      fill="url(#color-gradient)"
    ></rect>
    <text
      dx={-12}
      dy={10}
      textAnchor="middle"
      alignmentBaseline='middle'
      fontSize={fontSize}
    >0</text>
    <text
      dx={150 + 12}
      dy={10}
      textAnchor="middle"
      alignmentBaseline='middle'
      fontSize={fontSize}
    >1</text>
    <text
      dx={150 / 2}
      dy={-15}
      textAnchor="middle"
      alignmentBaseline='middle'
      fontSize={18}
    >Distance</text>
    {/* 圆环 */}
    <g transform={`translate(${colorBlockWidth + intervalWidth},${colorBlockHeight/2 -ringSize/2})`}>
      <RingPlot
        size={ringSize}
        proportion={0.4}
        needText={false}
      ></RingPlot>
    </g>
    <text
      dx={colorBlockWidth + intervalWidth - 12}
      dy={colorBlockHeight / 2}
      textAnchor="middle"
      alignmentBaseline='middle'
      fontSize={fontSize}
    >Data</text>
    <text
      dx={colorBlockWidth + intervalWidth + ringSize + 12}
      dy={colorBlockHeight / 2}
      textAnchor="middle"
      alignmentBaseline='middle'
      fontSize={fontSize}
    >Prior</text>
  </>
}

export default Legend;