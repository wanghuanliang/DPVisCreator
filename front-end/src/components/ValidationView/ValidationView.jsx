import React, { useState, useEffect, useRef } from "react";
import "./ValidationView.less";
import * as d3 from "d3";
import { Table, Tag, Radio, Space, Select } from "antd";
import LineupTable from "./LineupTable";
import ProtectedDataDisplay from "./ProtectedDataDisplay";
import "./ValidationView.less";

const { Option } = Select;

const ValidationView = (props) => {
  const {
    attributeCharacter,
    originalData,
    constraints,
    schemes,
  } = props;
  console.log(schemes);

  const [selectedSchemeId, setSelectedSchemeId] = useState();

  const [selectedMetrics, setSelectedMetrics] = useState({
    statistical: ['KSTest'],
    detection: ['LogisticDetection'],
    privacy: ['CAP']
  }); // 选中的展示指标

  // schemes变化时候，默认选中schemes最后一项
  useEffect(() => {
    setSelectedSchemeId(schemes.length - 1);
  }, [schemes])

  const renderSolutionControlPanel = () => {
    return <div className="solution-control-panel">
      <Space>
        <span>Statistical metrics</span>
        <Select
          size="small"
          mode="multiple"
          allowClear
          style={{ width: 200}}
          defaultValue={selectedMetrics.statistical}
        >
          <Option key='KSTest'>KSTest</Option>
          <Option key='CSTest'>CSTest</Option>
        </Select>
        <span>Detection metrics</span>
        <Select
          size="small"
          mode="multiple"
          allowClear
          style={{ width: 200 }}
          defaultValue={selectedMetrics.detection}
        >
          <Option key='LogisticDetection'>LogisticDetection</Option>
        </Select>
        <span>Privacy metrics</span>
        <Select
          size="small"
          mode="multiple"
          allowClear
          style={{ width: 200 }}
          defaultValue={selectedMetrics.privacy}
        >
          <Option key='CAP'>CAP</Option>
          <Option key='MLP'>MLP</Option>
        </Select>
      </Space>
    </div>
  }

  return (
    <div style={{position: 'relative'}}>
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
            attributeCharacter={attributeCharacter}
            originalData={originalData}
            protectedData={[]}
            constraints={constraints || []}
          ></ProtectedDataDisplay>
        </div>
      </div>
    </div>
  );
};

export default ValidationView;
