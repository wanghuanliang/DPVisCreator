import React, { useEffect, useRef } from 'react';
import './ValidationView.less';
import * as d3 from 'd3';
import { Taggle, LineUp, LineUpStringColumnDesc, LineUpCategoricalColumnDesc, LineUpNumberColumnDesc, LineUpRanking, LineUpSupportColumn, LineUpColumn, LineUpImposeColumn } from 'lineupjsx';
import { Table, Tag, Radio, Space } from 'antd';
import LineupTable from './LineupTable';

// const arr = [];
// const cats = ['c1', 'c2', 'c3'];
// for (let i = 0; i < 10; ++i) {
//   arr.push({
//     a: Math.random() * 10,
//     d: 'Row ' + i,
//     cat: cats[Math.floor(Math.random() * 3)],
//     cat2: cats[Math.floor(Math.random() * 3)],
//   });
// };

const arr = [
    {
      'Privacy Budget': 0.5,
      'Cluster': 10,
      'Correlation': 8,
      'Order': 9,
    },
    {
      'Privacy Budget': 1,
      'Cluster': 8,
      'Correlation': 6,
      'Order': 7,
    },
    {
      'Privacy Budget': 2,
      'Cluster': 5,
      'Correlation': 3,
      'Order': 4,
    },
  ]
const ValidationView = (props) => {

  return (
    // <LineUp data={arr} />
    // <LineUp data={arr} sidePanel sidePanelCollapsed defaultRanking>
    //   <LineUpStringColumnDesc column="d" label="Label" width={100} />
    //   <LineUpCategoricalColumnDesc column="cat" categories={cats} color="green" />
    //   <LineUpCategoricalColumnDesc column="cat2" categories={cats} color="blue" />
    //   <LineUpNumberColumnDesc column="a" domain={[0, 10]} color="blue" />

    //   <LineUpRanking groupBy="cat" sortBy="a:desc">
    //     <LineUpSupportColumn type="*" />
    //     <LineUpColumn column="*" />
    //     <LineUpImposeColumn label="a+cat" column="a" categeoricalColumn="cat2" />
    //   </LineUpRanking>
    // </LineUp>
    <div style={{display: 'flex'}}>
      <div style={{width: '70%'}}>
        <LineupTable></LineupTable>
      </div>
      {/* 保护后的视图放这里 */}
      <div style={{width: '30%'}}>

      </div>
    </div>
    
  )
}

export default ValidationView;