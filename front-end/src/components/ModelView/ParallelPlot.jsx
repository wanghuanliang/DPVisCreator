import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as echarts from 'echarts';
import { originalData } from '../../data/originalData';
import { attributeCharacter } from '../../data/attributes';
import { svg } from 'd3';

const margin = {top: 50, right: 50, bottom: 10, left: 300},
  width = 1000 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

const ParallelPlot = (props) => {
  const [patternWidth, setPatternWidth] = useState(100);
  const chartRef = useRef(null);
  const data = [];
  // 指定dimensions， 表示轴的先后顺序
  const dimensions = Object.keys(attributeCharacter);
  // 计算需要的data
  originalData.forEach(obj => {
    let now = [];
    dimensions.forEach(attribute => {
      now.push(obj[attribute]);
    })
    data.push(now);
  })
  // console.log(data);
  // 每个维度数据设计yScale
  const yScale = {};
  Object.keys(attributeCharacter).forEach(attribute => {
    //类别型数据, 数值型数据
    if (attributeCharacter[attribute]?.attributeType === "0") {
      yScale[attribute] = d3.scalePoint()
        .domain(attributeCharacter[attribute]?.value)
        .range([height, 0])
    } else if (attributeCharacter[attribute]?.attributeType === "1") {
      yScale[attribute] = d3.scaleLinear()
        .domain([attributeCharacter[attribute]?.min, attributeCharacter[attribute]?.max])
        .range([height, 0])
    }
  })
  // xScale
  const xScale = d3.scalePoint()
    .domain(dimensions)
    .range([0, width])
    
  // path function
  function path(d) {
    return d3.line()(dimensions.map((p, index) => {
      // console.log(p, yScale[p](d[index]));
      return [xScale(p), yScale[p](d[index])]
    }))
  }
  // ------------------------ pattern 相关 ---------------------------------
  useEffect(() => {
    // 绘制轴
    const svg = d3.select()
    svg.selectAll("axis")
      .data(dimensions)
      .enter()
      .append("g")
      .attr("transform", d => "translate(" + xScale(d) + ")")
      .each(function (d) { d3.select(this).call(d3.axisRight().ticks(5).scale(yScale[d])); })
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(d => d)
      .style("fill", "black")
    
    // 绘制线
    svg.selectAll("myPath")
      .data(data)
      .enter()
      .append("path")
      .attr("d", path)
      .style("fill", "none")
      .style("stroke", "#69b3a2")
      .style("opacity", 0.5)
    
    return () => svg.remove();
  })
  return (
    <svg
      width={width + margin.left + margin.right}
      height={height + margin.top + margin.bottom}
      
    >
      <foreignObject
        width={margin.left-100}
        height={height}
        x={0}
        y={margin.top}
      >
        <span
          style={{ backgroundColor: 'red', position: 'absolute', right: 0, width: {patternWidth} }}
        >123</span>
        <span style={{ backgroundColor: '#ccc', width: 20, float: 'right', cursor: 'col-resize', right: {} }}>
          bar
        </span>
      </foreignObject>
      <g
        transform={`translate(${margin.left}, ${margin.top})`}
        ref={chartRef}
      >
        {/* {
          dimensions.map(d => {
            d3.axisLeft().ticks(5).scale(yScale[d])
            return (
              <g
                transform={"translate(" + xScale(d) + ")"}
              >
                <text
                  textAnchor='middle'
                  y={-9}
                  text={d}
                  fill="black"
                >{d}</text>
              </g>
            )
          })
        } */}
      </g>
    </svg>
  )
}

export default ParallelPlot;

// import React, { useEffect, useRef } from 'react';
// import * as d3 from 'd3';
// import * as echarts from 'echarts';
// import { originalData  } from '../../data/originalData';

// const ParallelPlot = (props) => {
//   const chartRef = useRef();
//   const data = [];
//   originalData.forEach(obj => {
//     let now = [];
//     now.push(obj.age);
//     now.push(obj.sex);
//     now.push(obj.bmi);
//     now.push(obj.children);
//     now.push(obj.smoker);
//     now.push(obj.region);
//     now.push(obj.charges);
//     data.push(now);
//   })

//   let myChart = null;
//   const option = {
//     parallelAxis: [
//       { dim: 6, name: 'charges' },
//       { dim: 0, name: 'age' },
//       {
//         dim: 1,
//         name: 'sex',
//         type: 'category',
//         data: ['male', 'female']
//       },
//       { dim: 2, name: 'bmi' },
//       { dim: 3, name: 'children' },
//       {
//         dim: 4,
//         name: 'smoker',
//         type: 'category',
//         data: ['yes', 'no']
//       },
//       {
//         dim: 5,
//         name: 'region',
//         type: 'category',
//         data: ['northeast', 'northwest', 'southeast', 'southwest']
//       },
      
//     ],
//     series: {
//       type: 'parallel',
//       lineStyle: {
//         width: 4
//       },
//       data: data
//     },
//     dispatchAction({
//       type: 'highlight',
//     })
//   };

//   const renderChart = () => {
//     const chart = echarts.getInstanceByDom(chartRef.current)
//     if (chart) {
//       myChart = chart;
//     } else {
//       myChart = echarts.init(chartRef.current);
//     }
//     myChart.setOption(option);
//   }

//   useEffect(() => {
//     renderChart();
//     return () => {
//       myChart && myChart.dispose();
//     }
//   })
  
  
//   return (
//     <>
//       <div ref={chartRef} id='main' style={{width: 800, height: 500}}></div>
//     </>
    
//   )
// }

// export default ParallelPlot;

// import React, { useEffect } from 'react';
// import * as d3 from 'd3';

// const ParallelPlot = (props) => {

//   useEffect(() => {
//     // set the dimensions and margins of the graph
// const margin = {top: 30, right: 10, bottom: 10, left: 0},
// width = 500 - margin.left - margin.right,
// height = 400 - margin.top - margin.bottom;

// // append the svg object to the body of the page
// const svg = d3.select("#my_dataviz")
// .append("svg")
// .attr("width", width + margin.left + margin.right)
// .attr("height", height + margin.top + margin.bottom)
// .append("g")
// .attr("transform",
//       `translate(${margin.left},${margin.top})`);

// // Parse the Data
// d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/iris.csv").then( function(data) {

// // Extract the list of dimensions we want to keep in the plot. Here I keep all except the column called Species
// const dimensions = Object.keys(data[0]).filter(function(d) { return d != "Species" })

// // For each dimension, I build a linear scale. I store all in a y object
// const y = {}
// for (let i in dimensions) {
//   let name = dimensions[i]
//   y[name] = d3.scaleLinear()
//     .domain( d3.extent(data, function(d) { return +d[name]; }) )
//     .range([height, 0])
// }

// // Build the X scale -> it find the best position for each Y axis
// let x = d3.scalePoint()
//   .range([0, width])
//   .padding(1)
//   .domain(dimensions);

// // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
// function path(d) {
//     return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
// }

// // Draw the lines
// svg
//   .selectAll("myPath")
//   .data(data)
//   .join("path")
//   .attr("d",  path)
//   .style("fill", "none")
//   .style("stroke", "#69b3a2")
//   .style("opacity", 0.5)

// // Draw the axis:
// svg.selectAll("myAxis")
//   // For each dimension of the dataset I add a 'g' element:
//   .data(dimensions).enter()
//   .append("g")
//   // I translate this element to its right position on the x axis
//   .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
//   // And I build the axis with the call function
//   .each(function(d) { d3.select(this).call(d3.axisRight().scale(y[d])); })
//   // Add axis title
//   .append("text")
//     .style("text-anchor", "middle")
//     .attr("y", -9)
//     .text(function(d) { return d; })
//     .style("fill", "black")

// })

// })

//   return (
//     <div id='my_dataviz'></div>
//   )
// }

// export default ParallelPlot;