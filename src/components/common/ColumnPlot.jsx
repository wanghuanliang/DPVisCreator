import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// {female: 662, male: 676}
// [{sex: female, value: 662}, {sex: male, value: 676}]
const countArr = (arr, attr) => {
  const hash = {};
  arr.forEach((obj) => {
    if (!hash[obj[attr]]) {
      hash[obj[attr]] = 1;
    } else {
      hash[obj[attr]]++;
    }
  })
  // return hash;
  // 转成对象数组
  return Object.entries(hash).map(([key, value]) => {
    return { [attr]: key, 'value': value };
  })
}

const ColumnPlot = (props) => {
  const { originalData, attribute } = props;

  const columnPlotRef = useRef(null);
  const margin = {top: 30, right: 30, bottom: 0, left: 50},
    width = 350 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;
  
  useEffect(() => {
    const data = countArr(originalData, attribute);
    const svg = d3.select(columnPlotRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // x axis
    const xScale = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d[attribute]))
      .padding(0.2);
    // y axis
    const yMax = Math.max(...data.map(d => d.value));
    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([height, 0]);
    
    // bars
    svg.selectAll("myBar")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d[attribute]))
      .attr("y", d => yScale(d.value))
      .attr("width", xScale.bandwidth())
      .attr("height", d => height - yScale(d.value))
      .attr("fill", "#d0ddfa");
    
  }, []);

  return <div ref={columnPlotRef}></div>
}

export default ColumnPlot;