import React, { useEffect, useRef, useState } from "react";
import "./ValidationView.less";
import * as d3 from "d3";
import { Table, Tag, Radio, Space, Select } from "antd";
import LineupTable from "./LineupTable";
import ProtectedDataDisplay from "./ProtectedDataDisplay";
import "./ValidationView.less";

const { Option } = Select;

const ValidationView = (props) => {
  const { attributeCharacter, originalData, constraints, schemes } = props;
  console.log("props", props);

  const [selectedSchemeId, setSelectedSchemeId] = useState(0);

  const [selectedMetrics, setSelectedMetrics] = useState({
    statistical: ["KSTest"],
    detection: ["LogisticDetection"],
    privacy: ["CAP"],
  }); // 选中的展示指标

  // schemes变化时候，默认选中schemes最后一项
  useEffect(() => {
    setSelectedSchemeId(schemes.length - 1);
  }, [schemes]);

  const renderSolutionControlPanel = () => {
    return (
      <div className="solution-control-panel">
        <Space>
          <span>Statistical metrics</span>
          <Select
            size="small"
            mode="multiple"
            allowClear
            style={{ width: 200 }}
            defaultValue={selectedMetrics.statistical}
          >
            <Option key="KSTest">KSTest</Option>
            <Option key="CSTest">CSTest</Option>
          </Select>
          <span>Detection metrics</span>
          <Select
            size="small"
            mode="multiple"
            allowClear
            style={{ width: 200 }}
            defaultValue={selectedMetrics.detection}
          >
            <Option key="LogisticDetection">LogisticDetection</Option>
          </Select>
          <span>Privacy metrics</span>
          <Select
            size="small"
            mode="multiple"
            allowClear
            style={{ width: 200 }}
            defaultValue={selectedMetrics.privacy}
          >
            <Option key="CAP">CAP</Option>
            <Option key="MLP">MLP</Option>
          </Select>
        </Space>
      </div>
    );
  };

  const scheme = schemes[selectedSchemeId];
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
    <div style={{ position: "relative" }}>
      {renderSolutionControlPanel()}
      <div style={{ display: "flex", margin: 10 }}>
        <div style={{ width: "60%" }}>
          <LineupTable
            schemes={schemes}
            selectedSchemeId={selectedSchemeId}
            setSelectedSchemeId={setSelectedSchemeId}
            selectedMetrics={selectedMetrics}
          ></LineupTable>
        </div>
        {/* 保护后的视图放这里 */}
        <div style={{ width: "40%" }}>
          <ProtectedDataDisplay
            attribute_character={attributeCharacter}
            originalData={originalData}
            protectedData={scheme.protected_data}
            constraints={patternConstraints || []}
          ></ProtectedDataDisplay>
        </div>
      </div>
    </div>
  );
};

export default ValidationView;
