import React from 'react';
import * as d3 from 'd3';

const CloumnPlot = (props) => {
  const {
    originalData,
    attribute,
    svgWidth,
  } = props;

  const svgHeight = 150;
  const margin = {top: 20, right: 20, bottom: 65, left: 20},
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;
  
  return <svg width={svgWidth} height={svgHeight}>

  </svg>
}