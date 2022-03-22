import React, { useEffect, useRef, useState } from "react";
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
  const scheme =
    props.schemes.length > 0
      ? props.schemes[0]
      : { metrics: {}, pattern: [], protected_data: [] };
  // const [scheme, setScheme] = useState(temp_scheme);
  const patternConstraints = scheme.pattern?.map((patternConstraint) => {
    const search = props.constraints.filter(
      (globalConstraint) => patternConstraint.id === globalConstraint.id
    )?.[0];
    return {
      ...search,
      protectedData: patternConstraint.data,
    };
  });
  return (
    <div style={{ display: "flex", margin: 10 }}>
      <div style={{ width: "60%" }}>
        <LineupTable></LineupTable>
      </div>
      {/* 保护后的视图放这里 */}
      <div style={{ width: "40%" }}>
        <ProtectedDataDisplay
          attribute_character={props.attributeCharacter}
          originalData={props.originalData}
          protectedData={scheme.protected_data}
          constraints={patternConstraints || []}
        ></ProtectedDataDisplay>
      </div>
    </div>
  );
};

export default ValidationView;
