import React, { useEffect, useRef } from "react";
import "./ValidationView.less";
import * as d3 from "d3";
import { Table, Tag, Radio, Space } from "antd";
import LineupTable from "./LineupTable";
import ProtectedDataDisplay from "./ProtectedDataDisplay";

const arr = [
  {
    "Privacy Budget": 0.5,
    Cluster: 10,
    Correlation: 8,
    Order: 9,
  },
  {
    "Privacy Budget": 1,
    Cluster: 8,
    Correlation: 6,
    Order: 7,
  },
  {
    "Privacy Budget": 2,
    Cluster: 5,
    Correlation: 3,
    Order: 4,
  },
];
const ValidationView = (props) => {
  return (
    <div style={{ display: "flex", margin: 10 }}>
      <div style={{ width: "60%" }}>
        <LineupTable></LineupTable>
      </div>
      {/* 保护后的视图放这里 */}
      <div style={{ width: "40%" }}>
        <ProtectedDataDisplay
          attributeCharacter={props.attributeCharacter}
          originalData={props.originalData}
          protectedData={[]}
          constraints={props.constraints || []}
        ></ProtectedDataDisplay>
      </div>
    </div>
  );
};

export default ValidationView;
