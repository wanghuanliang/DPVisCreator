import React, { useEffect, useRef, useState } from "react";
import "./ValidationView.less";
import * as d3 from "d3";
import { Table, Tag, Radio, Space, Select, Switch, Button } from "antd";
import LineupTable from "./LineupTable";
import ProtectedDataDisplay from "./ProtectedDataDisplay";
import "./ValidationView.less";
import { ExportOutlined } from "@ant-design/icons";

const { Option } = Select;

const staticMetrics = {
  statistical: {
    title: "Statistical",
    options: ["KSTest", "CSTest"],
  },
  // detection: {
  //   title: "Detection",
  //   options: ["LogisticDetection"],
  // },
  // privacy: {
  //   title: "Privacy",
  //   options: ["CAP", "MLP"],
  // },
  cluster: {
    title: "Cluster",
    options: ["Concentration", "Dots stability"],
  },
  correlation: {
    title: "Correlation",
    options: ["DTW", "Euclidean", "Pearson Correlation Diff", "Dots stability"],
  },
  order: {
    title: "Order",
    options: ["NDCG", "Euclidean", "Dots stability"],
  },
};

const ValidationView = (props) => {
  const {
    attributeCharacter,
    originalData,
    constraints,
    schemes,
    changeSchemeId,
  } = props;
  const [selectedSchemeId, setSelectedSchemeId] = useState(0);

  const [selectedMetrics, setSelectedMetrics] = useState({
    statistical: ["KSTest"],
    cluster: ["Concentration"],
    correlation: ["DTW", "Euclidean"],
    order: ["NDCG", "Euclidean"],
  }); // 选中的展示指标

  // schemes变化时候，默认选中schemes最后一项
  useEffect(() => {
    setSelectedSchemeId(schemes.length - 1);
  }, [schemes]);

  const [shouldMerge, setShouldMerge] = useState(true);
  const renderSolutionControlPanel = () => {
    return (
      <div className="solution-control-panel">
        <Space>
          <span style={{ marginLeft: 10 }}>Merge</span>
          <Switch
            checkedChildren="Merge"
            unCheckedChildren="Unmerge"
            defaultChecked
            size="small"
            style={{ width: 80 }}
            onChange={(checked) => {
              setShouldMerge(checked);
            }}
          />
          {Object.keys(staticMetrics).map((metrics) => (
            <>
              <span key={"span-" + metrics}>
                {staticMetrics[metrics].title}
              </span>
              <Select
                key={"select-" + metrics}
                size="small"
                mode="multiple"
                allowClear
                style={{ width: 138, flexWrap: "nowrap" }}
                maxTagCount={1}
                maxTagTextLength={4}
                defaultValue={selectedMetrics[metrics]}
                onChange={(value) =>
                  setSelectedMetrics({ ...selectedMetrics, [metrics]: value })
                }
              >
                {staticMetrics[metrics].options.map((option) => (
                  <Option key={option}>{option}</Option>
                ))}
              </Select>
            </>
          ))}
          <Button
            size="small"
            icon={<ExportOutlined />}
            style={{ marginLeft: 140 }}
          >
            Export
          </Button>
        </Space>
      </div>
    );
  };

  const scheme = schemes[selectedSchemeId];
  const patternConstraints = (scheme.pattern || []).map((patternConstraint) => {
    const search = props.constraints.filter(
      (globalConstraint) => patternConstraint.id === globalConstraint.id
    )?.[0];
    return {
      ...search,
      protectedData: patternConstraint.data,
    };
  });

  const [selectedConstraint, setSelectedConstraint] = useState(
    patternConstraints.length > 0 ? patternConstraints[0] : {}
  );

  return (
    <div style={{ position: "relative" }}>
      {renderSolutionControlPanel()}
      <div style={{ display: "flex" }}>
        <div style={{ width: 1200, margin: 10 }}>
          <LineupTable
            schemes={schemes}
            selectedSchemeId={selectedSchemeId}
            setSelectedSchemeId={setSelectedSchemeId}
            selectedMetrics={selectedMetrics}
            constraints={props.constraints}
            selectedConstraint={selectedConstraint}
            selectConstraint={(constraint) => {
              setSelectedConstraint(constraint);
            }}
            merge={shouldMerge}
            changeSchemeId={changeSchemeId}
          ></LineupTable>
        </div>
        {/* 保护后的视图放这里 */}
        <div style={{ width: 380 }}>
          <ProtectedDataDisplay
            attribute_character={attributeCharacter}
            originalData={originalData}
            selectedSchemeId={selectedSchemeId}
            protectedData={scheme.protected_data}
            baselineData={
              schemes.length > 0 ? schemes[0].protected_data : originalData
            }
            constraints={patternConstraints || []}
            constraint={selectedConstraint}
          ></ProtectedDataDisplay>
        </div>
      </div>
    </div>
  );
};

export default ValidationView;
