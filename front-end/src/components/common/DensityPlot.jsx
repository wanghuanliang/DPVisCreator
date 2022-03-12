import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Function to compute density
function kernelDensityEstimator(kernel, X) {
  return function(V) {
    return X.map(function(x) {
      return [x, d3.mean(V, function(v) { return kernel(x - v); })];
    });
  };
}
function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  };
}

const DensityPlot = (props) => {

  const { originalData, attribute, svgWidth } = props;
  const svgHeight = 100;

  const densitySvgRef = useRef(null);
  const margin = {top: 20, right: 20, bottom: 15, left: 20},
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;

  useEffect(() => {
    // get the data
    const data = originalData.map(d => d[attribute]);

    // append the svg object to the body of the page
    const svg = d3.select(densitySvgRef.current)
      .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    
    
    // calculate min max of x
    const xMin = Math.min(...data);
    const xMax = Math.max(...data);
    // add the x Axis
    var x = d3.scaleLinear()
              .domain([xMin-(xMax-xMin)/4, xMax+(xMax-xMin)/4])
              .range([0, width]);
    // svg.append("g")
    //     .attr("transform", "translate(0," + height + ")")
    //     .call(d3.axisBottom(x));

    // Compute kernel density estimation
    const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40))
    const density = kde(data);
    console.log(kde(data));
    let sum = 0
    density.forEach((array, index) => sum += array[1]);
    console.log('sum', sum);

    // calculate min max of y
    const minY = 0;
    const maxY = Math.max(...density.map(d => d[1]))
    // add the y Axis
    const y = d3.scaleLinear()
              .range([height, 0])
              .domain([minY, maxY]);
    // svg.append("g")
    //     .call(d3.axisLeft(y));

    // Plot the area
    svg.append("path")
        .attr("class", "mypath")
        .datum(density)
        .attr("fill", "#daf1e6")
        .attr("opacity", "0.8")
        .attr("stroke", "#8ab0d0")
        .attr("stroke-width", 1)
        .attr("stroke-linejoin", "round")
        .attr("d",  d3.line()
          .curve(d3.curveBasis)
            .x(d => x(d[0]))
            .y(d => y(d[1]))
    );
    svg.on("mouseenter", (e) => {
      console.log(d3.event)
      return null;
    })
  }, [])

  // const [data, setData] = useState(originalData.map(d => d[attribute]));
  // const [xMin, setXMin] = useState(Math.min(...data));
  // const [xMax, setXMax] = useState(Math.max(...data));

  // const xScale = d3.scaleLinear()
  //   .domain([xMin-(xMax-xMin)/4, xMax+(xMax-xMin)/4])
  //   .range([0, width]);
  return (
    <div ref={densitySvgRef}>
      {/* <svg
        width={svgWidth}
        height={svgHeight}
      >
        <g transform={ "translate(" + margin.left + "," + margin.top + ")"}>

        </g>
      </svg> */}
    </div>
  )
}

export default DensityPlot;