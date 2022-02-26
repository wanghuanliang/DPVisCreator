import React, { useEffect, useRef } from 'react';
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

  const { originalData, attribute } = props;

  const densitySvgRef = useRef(null);
  const margin = {top: 30, right: 30, bottom: 0, left: 50},
    width = 350 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;

  useEffect(() => {
    // get the data
    const data = originalData.map(d => d[attribute]);

    // append the svg object to the body of the page
    const svg = d3.select(densitySvgRef.current)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
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
        .attr("opacity", ".8")
        .attr("stroke", "#daf1e6")
        .attr("stroke-width", 1)
        .attr("stroke-linejoin", "round")
        .attr("d",  d3.line()
          .curve(d3.curveBasis)
            .x(d => x(d[0]))
            .y(d => y(d[1]))
        );
  }, [])
  
  return <div ref={densitySvgRef}></div>
}

export default DensityPlot;