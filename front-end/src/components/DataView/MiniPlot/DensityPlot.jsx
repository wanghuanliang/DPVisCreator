import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { Slider } from 'antd';
import { debounce, cloneDeep } from 'lodash';

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
  const {
    originalData,
    attribute,
    svgWidth,
    filterData,
    setFilterData,
    attributeCharacter,
  } = props;

  const svgHeight = 130;
  const margin = {top: 20, right: 20, bottom: 45, left: 20},
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;

  const gRef = useRef(null);
  
  
  const [data, xMin, xMax, xScale, density, minY, maxY, yScale, dPath] = useMemo(() => {
    // get the data
    const data = originalData.map(d => d[attribute]);

    // calculate min max of x
    const xMin = Math.floor(Math.min(...data));
    const xMax = Math.ceil(Math.max(...data));
    // add the x Axis
    var xScale = d3.scaleLinear()
      .domain([xMin, xMax])
      .range([0, width]);
    
    const kde = kernelDensityEstimator(kernelEpanechnikov(4), xScale.ticks(40))
    const density = kde(data);
    // density视情况，补充第一项和最后一项
    if (density[0][0] > xMin) {
      density.unshift([xMin, 0]);
    }
    if (density[density.length - 1][0] < xMax) {
      density.push([xMax, 0]);
    }

    // calculate min max of y
    const minY = 0;
    const maxY = Math.max(...density.map(d => d[1]))
    // add the y Axis
    const yScale = d3.scaleLinear()
              .range([height, 0])
              .domain([minY, maxY]);

    const pathD = d3.line()
      .curve(d3.curveBasis)
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]));
    
    const dPath = pathD(density)
    
    return [data, xMin, xMax, xScale, density, minY, maxY, yScale, dPath]
  }, [originalData, attribute, width, height]);

  const [sliderValue, setSliderValue] = useState([xMin, xMax]);

  useEffect(() => {
    if (sliderValue[0] === xMin && sliderValue[1] === xMax) {
      // 全选
      // if (filterData.hasOwnProperty(attribute))
        delete filterData[attribute];
    } else {
      if (!filterData.hasOwnProperty(attribute)) 
        filterData[attribute] = cloneDeep(attributeCharacter[attribute]);
      filterData[attribute].min = sliderValue[0];
      filterData[attribute].max = sliderValue[1];
    }
    setFilterData({ ...filterData });
  }, [sliderValue, attribute, attributeCharacter, xMax, xMin])

  const renderSlider = () => {
    // const min = xMin;
    // const max = xMax;
    return (
      <Slider
        style={{ width: width, marginLeft: margin.left }}
        range
        min={xMin}
        max={xMax}
        // defaultValue={[min, max]}
        value={sliderValue}
        onChange={debounce((value) => setSliderValue(value), 10)}
        marks={{
          [xMin]: xMin,
          [xMax]: xMax,
          [sliderValue[0]]: sliderValue[0],
          [sliderValue[1]]: sliderValue[1],
        }}
        tooltipVisible={false}
      ></Slider>
    )
  }
  
  return <svg width={svgWidth} height={svgHeight}>
    <g transform={`translate(${margin.left}, ${margin.top})`} ref={gRef}>
      {/* 线条 */}
      <path
        fill='#fff'
        stroke='#8ab0d0'
        strokeWidth={2}
        d={dPath}
      ></path>
      {/* 选中框 */}
      <rect
        x={xScale(sliderValue[0])}
        y={-5}
        width={xScale(sliderValue[1]) - xScale(sliderValue[0])}
        height={height + 5}
        // fill='#92B0C9'
        fill='#92B0C9'
        opacity={0.5}
        stroke='#92B0C9'
        strokeOpacity={0.5}
      ></rect>
      {/* 隐藏框 */}
      <rect
        x={xScale[xMin]}
        y={0}
        width={xScale(sliderValue[0])}
        height={height}
        fill='#fff'
        opacity={0.8}
      ></rect>
      <rect
        x={xScale(sliderValue[1])}
        y={0}
        width={xScale(xMax) - xScale(sliderValue[1])}
        height={height}
        fill='#fff'
        opacity={0.8}
      ></rect>
    </g>
    <foreignObject
      x={0}
      y={height+margin.top}
      width={svgWidth}
      height={50}
    >
      {renderSlider()}
    </foreignObject>
  </svg>
}

export default DensityPlot;