import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const [svgWidth, svgHeight] = [400, 400];
const margin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
}
const width = svgWidth - margin.left - margin.right,
  height = svgHeight - margin.top - margin.bottom;

const Projection = (props) => {

  const xAxisRef = useRef(null);

  const xScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);
  
  useEffect(() => {
    d3.select(xAxisRef.current)
      .call(d3.axisBottom(xScale).ticks(10))
      .selectAll('line').remove()
  },[])

  return <svg width={svgWidth} height={svgHeight}>
    {/* 散点图 */}
    <g transform={`translate(${margin.left}, ${margin.top})`}>
      {/* x轴 */}
      <g ref={xAxisRef} transform={`translate(0,${height})`}></g>
      {/* y轴 */}
      <g></g>
    </g>
    {/* 图例 */}
  </svg>

}

export default Projection;