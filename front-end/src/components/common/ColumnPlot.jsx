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
  const { originalData, attribute, svgWidth } = props;
  const svgHeight = 100;

  const columnPlotRef = useRef(null);
  const margin = {top: 20, right: 20, bottom: 15, left: 20},
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;
  
  useEffect(() => {
    // data预处理成[{}, {}]
    const data = countArr(originalData, attribute);
    const svg = d3.select(columnPlotRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // x axis
    const xScale = d3.scaleBand()
      .domain(data.map(d => d[attribute]))
      .range([0, width])
      .padding(0.2);

    // 绘制x轴
    const axis = svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale))
    // 仅保留x轴文本
    axis.selectAll(".domain").attr("opacity", 0);
    axis.selectAll("line").attr("opacity", 0);
    axis.selectAll("text").attr("transform", "translate(0,-5)")
      
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
      .attr("fill", "#d0ddfa")
      .on('mouseover', (d, i) => {
        svg.append("text")
          .attr("class", "tooltip")
          .attr("x", xScale(d[attribute])+xScale.bandwidth()/2)
          .attr("y", yScale(d.value))
          .attr('dy', '-3px')
          .attr('text-anchor', 'middle')
          .attr('fill', '#333')
          .text(d.value)
      })
      .on("mouseout", () => {
        d3.selectAll(".tooltip").remove();
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={columnPlotRef}></div>
}

export default ColumnPlot;