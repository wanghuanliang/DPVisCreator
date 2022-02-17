import React, {useEffect, useRef} from 'react';
import * as d3 from 'd3';

const ScatterPlot = (props) => {
  const { data } = props;

  // // 绘制坐标轴
  // const axisRef = useRef(null);

  // const _renderAxis = () => {
  //   return (
  //     <>
  //       <g ref={axisRef}></g>  
  //     </>
  //   )
  // }

  // 比例尺
  const scaleX = d3
    .scaleLinear()
    .domain([0, 50])
    .range([0, 100]);
  
  const scaleY = d3
    .scaleLinear()
    .domain([0, 50])
    .range([0, 100]);

  
  useEffect(() => {
    d3.select('.scatter')
  })
  return (
    <svg width='150' height='150' className='scatter'>
      {/* <g className='axis'></g> */}
    </svg>
  )
}

export default ScatterPlot;

