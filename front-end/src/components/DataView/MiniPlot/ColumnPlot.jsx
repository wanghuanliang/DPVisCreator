import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { Checkbox } from 'antd';

// {female: 662, male: 676} 
// bugfix: children的kind为数值型，作为键会转化为字符型，改用map,还能保证有序
// [{sex: female, value: 662}, {sex: male, value: 676}]
// 需要按照attributeCharacter里的value顺序整理
const countArr = (arr, attr, character) => {
  const map = new Map();
  character[attr].values.forEach(kind => map.set(kind, 0));
  arr.forEach((obj) => {
    map.set(obj[attr], map.get(obj[attr]) + 1);
    // if (!hash[obj[attr]]) {
    //   hash[obj[attr]] = 1;
    // } else {
    //   hash[obj[attr]]++;
    // }
  })
  // return hash;
  // 转成对象数组
  // return Object.entries(hash).map(([key, value]) => {
  //   return { [attr]: key, 'value': value };
  // })
  const ans = [];
  for (let [key, value] of map) {
    ans.push({ [attr]: key, 'value': value });
  }
  return ans;
}

const ColumnPlot = (props) => {
  const {
    originalData,
    attribute,
    svgWidth,
    filterData,
    setFilterData,
    attributeCharacter,
  } = props;

  const svgHeight = 120;
  const margin = {top: 20, right: 20, bottom: 35, left: 20},
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;
  
  const data = useMemo(() => {
    return countArr(originalData, attribute, attributeCharacter);
  }, [originalData, attribute, attributeCharacter]);

  // x axis
  const xScale = d3.scaleBand()
    .domain(data.map(d => d[attribute]))
    .range([0, width])
    .padding(0.5);
  
  // y axis
  const yMax = Math.max(...data.map(d => d.value));
  const yScale = d3.scaleLinear()
    .domain([0, yMax])
    .range([height, 0]);
  
  return <svg width={svgWidth} height={svgHeight}>
    <g transform={`translate(${margin.left}, ${margin.top})`}>
      {
        data.map((obj, index) => {
          const kind = obj[attribute];
          const value = obj.value;
          return <g key={String(kind)}>
            <rect
              x={xScale(kind)}
              y={yScale(value)}
              width={xScale.bandwidth()}
              height={height - yScale(value)}
              fill="#92B0C9"
            ></rect>
            <text
              x={xScale(kind) + xScale.bandwidth() / 2}
              y={height}
              textAnchor='middle'
              alignmentBaseline='middle'
              dy={10}
              fontSize={10}
            >{kind}</text>
            <foreignObject
              x={xScale(kind) + xScale.bandwidth() / 2 - 8}
              y={height + 14}
              width={20}
              height={20}
            >
              <Checkbox
                // defaultChecked={true}
                checked={filterData[attribute].values.includes(kind)}
                onChange={(e) => {
                  if (e.target.checked) { 
                    // 之前false，点击为true，加上这一项
                    filterData[attribute].values.splice(index, 0, kind);
                  } else {
                    // const pos = filterData[attribute].values.indexOf(kind);
                    filterData[attribute].values.splice(index, 1);
                  }
                  setFilterData({ ...filterData });
                }}
              ></Checkbox>
            </foreignObject>
          </g>
        })
      }
    </g>
  </svg>
}

export default ColumnPlot;