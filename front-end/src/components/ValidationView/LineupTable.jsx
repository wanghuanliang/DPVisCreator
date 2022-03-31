import React, { useMemo, useState } from "react";
import { Table, Tag, Radio, Space, Button, Popover, Slider } from "antd";
import "./LineupTable.less";
import {
  CaretDownOutlined,
  CaretUpOutlined,
  FilterOutlined,
} from "@ant-design/icons";

// 标题到对象的映射
const NameMap = {
  Concentration: "Concentration",
  "Dots stability": "dots_stab",
  DTW: "DTW",
  Euclidean: "Euc",
  "Pearson Correlation Diff": "PCD",
  NDCG: "NDCG",
};

const LineupTable = (props) => {
  const {
    schemes,
    selectedSchemeId,
    setSelectedSchemeId,
    selectedMetrics,
    constraints,
    selectedConstraint,
    selectConstraint,
    merge,
    changeSchemeId,
  } = props;
  const [_, setSettings] = useState({});
  const { settings, tableData } = useMemo(() => {
    const constraintsSettings = {};
    (constraints || []).forEach((constraint) => {
      constraintsSettings[constraint.id] = {
        access: (record) => calcConstraintSum(record, constraint),
        order: "none",
        range: "all",
        children:
          constraint.type === "cluster"
            ? {
                Concentration: {
                  access: (record) =>
                    record[constraint.id].Concentration.protected,
                  order: "none",
                  range: "all",
                },
                dots_stab: {
                  access: (record) => record[constraint.id].dots_stab.protected,
                  order: "none",
                  range: "all",
                },
              }
            : constraint.type === "correlation"
            ? {
                DTW: {
                  access: (record) => record[constraint.id].DTW.protected,
                  order: "none",
                  range: "all",
                },
                Euc: {
                  access: (record) => record[constraint.id].Euc.protected,
                  order: "none",
                  range: "all",
                },
                PCD: {
                  access: (record) => record[constraint.id].PCD.protected,
                  order: "none",
                  range: "all",
                },
                dots_stab: {
                  access: (record) => record[constraint.id].dots_stab.protected,
                  order: "none",
                  range: "all",
                },
              }
            : {
                NDCG: {
                  access: (record) => record[constraint.id].NDCG.protected,
                  order: "none",
                  range: "all",
                },
                Euc: {
                  access: (record) => record[constraint.id].Euc.protected,
                  order: "none",
                  range: "all",
                },
                dots_stab: {
                  access: (record) => record[constraint.id].dots_stab.protected,
                  order: "none",
                  range: "all",
                },
              },
      };
    });
    const settings = {
      id: {
        access: (record) => record.id,
        order: "none",
        range: "all",
      },
      budget: {
        access: (record) => record.budget,
        order: "none",
        range: "all",
      },
      statistical: {
        access: (record) => calcSum(record.statistical, "statistical"),
        order: "none",
        range: "all",
        children: {
          CSTest: {
            access: (record) => record.statistical.CSTest,
            order: "none",
            range: "all",
          },
          KSTest: {
            access: (record) => record.statistical.KSTest,
            order: "none",
            range: "all",
          },
        },
      },
      // detection: {
      //   access: (record) => calcSum(record.detection, "detection"),
      //   order: "none",
      //   range: "all",
      //   children: {
      //     LogisticDetection: {
      //       access: (record) => record.detection.LogisticDetection,
      //       order: "none",
      //       range: "all",
      //     },
      //   },
      // },
      ...constraintsSettings,
      ..._,
    };
    const records = [];
    schemes.forEach((scheme, index) => {
      const record = {};
      const patterns = {};
      (scheme.pattern || []).forEach((constraint) => {
        patterns[constraint.id] = constraint;
      });
      record.key = "scheme" + index;
      record.id = index;
      record.budget = scheme.metrics.privacy_budget; //为值
      record.statistical = scheme.metrics.statistical_metrics;
      // record.detection = scheme.metrics.detection_metrics;
      (constraints || []).forEach((constraint) => {
        record[constraint.id] = {
          ...(constraint.type === "cluster"
            ? {
                Concentration: {},
                dots_stab: {},
              }
            : constraint.type === "correlation"
            ? { DTW: {}, Euc: {}, PCD: {}, dots_stab: {} }
            : { NDCG: {}, Euc: {}, dots_stab: {} }),
          ...patterns[constraint.id],
        };
      });
      records.push(record);
    });
    let filteredData = records;
    // 过滤数据
    for (let metrics in settings) {
      const range = settings[metrics].range;
      if (range !== "all") {
        const access = settings[metrics].access;
        filteredData = filteredData.filter((record) => {
          const num = access(record);
          return num >= range[0] && num <= range[1];
        });
      }
      const children = settings[metrics].children;
      if (children) {
        for (let subMetrics in children) {
          const range = children[subMetrics].range;
          if (range !== "all") {
            const access = children[subMetrics].access;
            filteredData = filteredData.filter((record) => {
              const num = access(record);
              return num >= range[0] && num <= range[1];
            });
          }
        }
      }
    }
    // 数据排序
    for (let metrics in settings) {
      const order = settings[metrics].order;
      const access = settings[metrics].access;
      if (order === "ascending") {
        filteredData.sort((a, b) => access(b) - access(a));
      } else if (order === "descending") {
        filteredData.sort((a, b) => access(a) - access(b));
      }
      const children = settings[metrics].children;
      if (children) {
        for (let subMetrics in children) {
          const order = children[subMetrics].order;
          const access = children[subMetrics].access;
          if (order === "ascending") {
            filteredData.sort((a, b) => access(b) - access(a));
          } else if (order === "descending") {
            filteredData.sort((a, b) => access(a) - access(b));
          }
        }
      }
    }
    return { settings, tableData: filteredData };
  });
  const switchOrderState = (state, outer, inner) => {
    const temp = { ...settings };
    for (let metrics in settings) {
      if (!inner && metrics === outer) {
        temp[metrics].order = state;
      } else temp[metrics].order = "none";
      if (settings[metrics].children) {
        const children = temp[metrics].children;
        for (let subMetrics in children) {
          if (inner === subMetrics && outer === metrics) {
            children[subMetrics].order = state;
          } else children[subMetrics].order = "none";
        }
      }
    }
    setSettings(temp);
  };
  const singleWidth = 125;
  const singleColumnWidth = singleWidth + 32;
  const divHeight = 20;
  const originalColor = "#8ab0d0";
  const risingColor = "#cdf3e4";
  const fallingColor = "#f8d0cb";
  const unselectedColor = "#ced4de";
  const renderMergeConstraintItem = (obj, title) => {
    const n = selectedMetrics[title].length;
    if (n === 0) return;
    const divWidth = singleWidth * n;
    return (
      <div style={{ width: divWidth, height: divHeight, display: "flex" }}>
        {selectedMetrics[title].map((kind) => {
          if (!obj || !obj[NameMap[kind]].protected) {
            return (
              <div
                style={{
                  width: singleWidth,
                  height: divHeight,
                  backgroundColor: unselectedColor,
                  marginRight: 3,
                }}
              ></div>
            );
          } else
            return (
              <div
                style={{
                  width: singleWidth * obj[NameMap[kind]].protected,
                  height: divHeight,
                  backgroundColor: originalColor,
                  marginRight: 3,
                }}
              ></div>
            );
        })}
      </div>
    );
  };
  const renderSingleConstraintItem = (obj) => {
    if (!obj) {
      return (
        <div style={{ width: singleWidth, height: divHeight, display: "flex" }}>
          <div
            style={{
              width: singleWidth,
              height: divHeight,
              backgroundColor: unselectedColor,
            }}
          ></div>
        </div>
      );
    }
    const original_rate = obj.original;
    const protected_rate = obj.protected;
    if (
      typeof original_rate === "undefined" ||
      typeof protected_rate === "undefined"
    ) {
      return (
        <div style={{ width: singleWidth, height: divHeight, display: "flex" }}>
          <div
            style={{
              width: singleWidth,
              height: divHeight,
              backgroundColor: unselectedColor,
            }}
          ></div>
        </div>
      );
    }
    const originalWidth = singleWidth * Math.min(original_rate, protected_rate);
    const ratingWidth =
      singleWidth * Math.max(original_rate, protected_rate) - originalWidth;
    return (
      <div style={{ width: singleWidth, height: divHeight, display: "flex" }}>
        <div
          style={{
            width: originalWidth,
            height: divHeight,
            backgroundColor: originalColor,
          }}
        ></div>
        <div
          style={{
            width: Math.abs(ratingWidth),
            height: divHeight,
            backgroundColor:
              original_rate < protected_rate ? risingColor : fallingColor,
          }}
        ></div>
      </div>
    );
  };
  const renderSingleMetricItem = (num) => {
    return (
      <div
        style={{
          width: singleWidth * num,
          height: divHeight,
          backgroundColor: "#8ab0d0",
          marginRight: 3,
        }}
      ></div>
    );
  };
  // obj: {CAP: 0.5, MLP: 0.6}
  // title: privacy
  // selectedMetrics {privacy: ['CAP]}
  const renderMergeMetricItem = (obj, title) => {
    const n = selectedMetrics[title].length;
    if (n === 0) return;
    const divWidth = singleWidth * n;
    return (
      <div style={{ width: divWidth, height: divHeight, display: "flex" }}>
        {selectedMetrics[title].map((kind) => {
          return (
            <div
              style={{
                width: divWidth * obj[kind],
                height: divHeight,
                backgroundColor: "#8ab0d0",
                marginRight: 3,
              }}
            ></div>
          );
        })}
      </div>
    );
  };

  const calcSum = (obj, title) => {
    let sum = 0;
    (selectedMetrics[title] || []).forEach((kind) => {
      sum += obj[kind];
    });
    return sum;
  };
  const calcConstraintSum = (obj, constraint) => {
    let sum = 0;
    (selectedMetrics[constraint.type] || []).forEach((kind) => {
      const protected_metrics = obj[constraint.id][NameMap[kind]].protected;
      if (protected_metrics) sum += protected_metrics;
    });
    return sum;
  };
  const createConstraintFilter = (constraint, inner = null) => {
    const outer = constraint.id;
    const max = inner
      ? 1.0
      : selectedMetrics[constraint.type]
      ? selectedMetrics[constraint.type].length * 1.0
      : 1.0;
    const range = inner
      ? settings[outer].children[inner].range
      : settings[outer].range;
    const order = inner
      ? settings[outer].children[inner].order
      : settings[outer].order;
    return (
      <>
        <Popover
          content={
            <div>
              <Slider
                range
                min={0.0}
                max={max}
                defaultValue={[0.0, max]}
                step={0.01}
                onAfterChange={(value) => {
                  if (inner) settings[outer].children[inner].range = value;
                  else settings[outer].range = value;
                  setSettings({ ...settings });
                }}
              />
              <Button
                size="small"
                onClick={() => {
                  if (inner) settings[outer].children[inner].range = "all";
                  else settings[outer].range = "all";
                  setSettings({ ...settings });
                }}
              >
                Cancel
              </Button>
            </div>
          }
          title={outer}
          trigger="click"
        >
          <FilterOutlined
            style={{ color: range === "all" ? "#000000" : "#ff9845" }}
          />
        </Popover>
        <div className="sorter-buttons">
          <CaretUpOutlined
            style={{ color: order === "descending" ? "#ff9845" : "#000000" }}
            onClick={() => {
              switchOrderState(
                order === "descending" ? "none" : "descending",
                outer,
                inner
              );
            }}
          />
          <CaretDownOutlined
            style={{ color: order === "ascending" ? "#ff9845" : "#000000" }}
            onClick={() => {
              switchOrderState(
                order === "ascending" ? "none" : "ascending",
                outer,
                inner
              );
            }}
          />
        </div>
      </>
    );
  };
  const createFilter = (outer, inner = null) => {
    const max = inner
      ? 1.0
      : selectedMetrics[outer]
      ? selectedMetrics[outer].length * 1.0
      : 1.0;
    const range = inner
      ? settings[outer].children[inner].range
      : settings[outer].range;
    const order = inner
      ? settings[outer].children[inner].order
      : settings[outer].order;
    return (
      <>
        <Popover
          content={
            <div>
              <Slider
                range
                min={0.0}
                max={max}
                defaultValue={[0.0, max]}
                step={0.01}
                onAfterChange={(value) => {
                  if (inner) settings[outer].children[inner].range = value;
                  else settings[outer].range = value;
                  setSettings({ ...settings });
                }}
              />
              <Button
                size="small"
                onClick={() => {
                  if (inner) settings[outer].children[inner].range = "all";
                  else settings[outer].range = "all";
                  setSettings({ ...settings });
                }}
              >
                Cancel
              </Button>
            </div>
          }
          title={outer}
          trigger="click"
        >
          <FilterOutlined
            style={{ color: range === "all" ? "#000000" : "#ff9845" }}
          />
        </Popover>
        <div className="sorter-buttons">
          <CaretUpOutlined
            style={{ color: order === "descending" ? "#ff9845" : "#000000" }}
            onClick={() => {
              switchOrderState(
                order === "descending" ? "none" : "descending",
                outer,
                inner
              );
            }}
          />
          <CaretDownOutlined
            style={{ color: order === "ascending" ? "#ff9845" : "#000000" }}
            onClick={() => {
              switchOrderState(
                order === "ascending" ? "none" : "ascending",
                outer,
                inner
              );
            }}
          />
        </div>
      </>
    );
  };
  const createMaxFilter = (outer, max = 1.0) => {
    const range = settings[outer].range;
    const order = settings[outer].order;
    return (
      <>
        <Popover
          content={
            <div>
              <Slider
                range
                min={0.0}
                max={max}
                defaultValue={[0.0, max]}
                step={0.01}
                onAfterChange={(value) => {
                  settings[outer].range = value;
                  setSettings({ ...settings });
                }}
              />
              <Button
                size="small"
                onClick={() => {
                  settings[outer].range = "all";
                  setSettings({ ...settings });
                }}
              >
                Cancel
              </Button>
            </div>
          }
          title={outer}
          trigger="click"
        >
          <FilterOutlined
            style={{ color: range === "all" ? "#000000" : "#ff9845" }}
          />
        </Popover>
        <CaretUpOutlined
          style={{ color: order === "descending" ? "#ff9845" : "#000000" }}
          onClick={() => {
            switchOrderState(
              order === "descending" ? "none" : "descending",
              outer
            );
          }}
        />
        <CaretDownOutlined
          style={{ color: order === "ascending" ? "#ff9845" : "#000000" }}
          onClick={() => {
            switchOrderState(
              order === "ascending" ? "none" : "ascending",
              outer
            );
          }}
        />
      </>
    );
  };
  const constraintColumns = (constraints || []).map((constraint) => {
    const patternColor = {
      cluster: "#9cb0a2",
      correlation: "#c39b83",
      order: "#bbafd1",
    };
    return merge
      ? {
          title: (
            <div style={{ textAlign: "center" }}>
              <Space direction="horizontal" className="lineup-table-main">
                {constraint.id === selectedConstraint.id ? (
                  <Button
                    size="small"
                    key={"scheme-constraint-" + constraint.id}
                    style={{
                      borderColor: patternColor[constraint.type],
                      color: "#ffffff",
                      background: patternColor[constraint.type],
                    }}
                    className="validation-constraint-select-button"
                    onClick={() => {
                      selectConstraint(constraint);
                    }}
                  >
                    {constraint.id}
                  </Button>
                ) : (
                  <Button
                    size="small"
                    key={"scheme-constraint-" + constraint.id}
                    style={{
                      borderColor: patternColor[constraint.type],
                      color: patternColor[constraint.type],
                    }}
                    className="validation-constraint-select-button"
                    onClick={() => {
                      selectConstraint(constraint);
                    }}
                  >
                    {constraint.id}
                  </Button>
                )}
                {createConstraintFilter(constraint)}
              </Space>
              <div
                style={{
                  paddingTop: 15,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {(selectedMetrics[constraint.type] || []).map((name, index) => (
                  <div style={{ marginRight: 12 }}>{name}</div>
                ))}
              </div>
            </div>
          ),
          dataIndex: constraint.id,
          key: constraint.id,
          width: singleColumnWidth * selectedMetrics[constraint.type].length,
          render: (obj) => renderMergeConstraintItem(obj, constraint.type),
        }
      : {
          title: (
            <div style={{ textAlign: "center" }}>
              <Space direction="horizontal" className="lineup-table-main">
                {constraint.id === selectedConstraint.id ? (
                  <Button
                    size="small"
                    key={"scheme-constraint-" + constraint.id}
                    style={{
                      borderColor: patternColor[constraint.type],
                      color: "#ffffff",
                      background: patternColor[constraint.type],
                    }}
                    className="validation-constraint-select-button"
                    onClick={() => {
                      selectConstraint(constraint);
                    }}
                  >
                    {constraint.id}
                  </Button>
                ) : (
                  <Button
                    size="small"
                    key={"scheme-constraint-" + constraint.id}
                    style={{
                      borderColor: patternColor[constraint.type],
                      color: patternColor[constraint.type],
                    }}
                    className="validation-constraint-select-button"
                    onClick={() => {
                      selectConstraint(constraint);
                    }}
                  >
                    {constraint.id}
                  </Button>
                )}
                {createConstraintFilter(constraint)}
              </Space>
            </div>
          ),
          dataIndex: constraint.id,
          key: constraint.id,
          children: (selectedMetrics[constraint.type] || []).map((name) => {
            return {
              title: (
                <Space direction="horizontal" className="lineup-table-children">
                  {name}
                  {createConstraintFilter(constraint, NameMap[name])}
                </Space>
              ),
              dataIndex: [constraint.id, NameMap[name]],
              key: constraint.id + ":" + name,
              width: singleColumnWidth,
              render: (obj) => renderSingleConstraintItem(obj),
            };
          }),
        };
  });

  const columns = [
    {
      title: (
        <Space direction="horizontal" className="lineup-table-main">
          Schemes{createFilter("id")}
        </Space>
      ),
      dataIndex: "id",
      key: "id",
      fixed: "left",
      width: singleColumnWidth,
      render: (id) => (
        <div
          style={{
            color: id === selectedSchemeId ? "#f0943d" : "#000",
            cursor: "pointer",
          }}
          onClick={() => {
            if (id !== selectedSchemeId) {
              setSelectedSchemeId(id);
              // 需要同时更新modelViewData
              changeSchemeId(id);
            }
          }}
        >
          {id === 0 ? "PrivBayes" : "Scheme #" + id}
        </div>
      ),
    },
    {
      title: (
        <Space direction="horizontal" className="lineup-table-main">
          Privacy budget{createFilter("budget")}
        </Space>
      ),
      dataIndex: "budget",
      key: "budget",
      width: singleColumnWidth,
      fixed: "left",
      render: (v) => (
        <div
          style={{
            width: (v / 20) * singleWidth, // 不同于totalWidth
            height: divHeight,
            backgroundColor: "#8ab0d0",
          }}
        ></div>
      ),
    },
    {
      dataIndex: "statistical",
      key: "statistical",
      fixed: "left",
      width: singleColumnWidth * selectedMetrics.statistical.length,
      ...(merge
        ? {
            title: (
              <div style={{ textAlign: "center" }}>
                <Space direction="horizontal" className="lineup-table-main">
                  Statistical metrics{createFilter("statistical")}
                </Space>
                <div
                  style={{
                    paddingTop: 15,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  {(selectedMetrics.statistical || []).map((name) => (
                    <div style={{ marginRight: 12 }}>{name}</div>
                  ))}
                </div>
              </div>
            ),
            render: (obj) => renderMergeMetricItem(obj, "statistical"),
          }
        : {
            title: (
              <div>
                <Space direction="horizontal" className="lineup-table-main">
                  Statistical metrics{createFilter("statistical")}
                </Space>
              </div>
            ),
            children: (selectedMetrics.statistical || []).map((name) => {
              return {
                title: (
                  <Space
                    direction="horizontal"
                    className="lineup-table-children"
                  >
                    {name}
                    {createFilter("statistical", name)}
                  </Space>
                ),
                dataIndex: ["statistical", name],
                key: "statistical:" + name,
                width: singleColumnWidth,
                fixed: "left",
                render: (num) => renderSingleMetricItem(num),
              };
            }),
          }),
    },
    // {
    //   dataIndex: "detection",
    //   key: "detection",
    //   fixed: "left",
    //   width: singleColumnWidth * selectedMetrics.detection.length,
    //   ...(merge
    //     ? {
    //         title: (
    //           <div style={{ textAlign: "center" }}>
    //             <Space direction="horizontal" className="lineup-table-main">
    //               Detection metrics{createFilter("detection")}
    //             </Space>
    //             <div
    //               style={{
    //                 display: "flex",
    //                 justifyContent: "center",
    //                 paddingTop: 15,
    //               }}
    //             >
    //               {(selectedMetrics.detection || []).map((name, index) => (
    //                 <div style={{ marginRight: 12 }}>{name}</div>
    //               ))}
    //             </div>
    //           </div>
    //         ),
    //         render: (obj) => renderMergeMetricItem(obj, "detection"),
    //       }
    //     : {
    //         title: (
    //           <div>
    //             <Space direction="horizontal" className="lineup-table-main">
    //               Detection metrics{createFilter("detection")}
    //             </Space>
    //           </div>
    //         ),
    //         children: (selectedMetrics.detection || []).map((name) => {
    //           return {
    //             title: (
    //               <Space
    //                 direction="horizontal"
    //                 className="lineup-table-children"
    //               >
    //                 {name}
    //                 {createFilter("detection", name)}
    //               </Space>
    //             ),
    //             dataIndex: "detection",
    //             key: "detection:" + name,
    //             width: singleColumnWidth,
    //             fixed: "left",
    //             render: (num) => renderSingleMetricItem(num),
    //           };
    //         }),
    //       }),
    // },
    // {
    //   title: (
    //     <div>
    //       <div>Privacy metrics</div>
    //       <div
    //         style={{
    //           display: "flex",
    //           justifyContent: "space-between",
    //           fontWeight: "normal",
    //         }}
    //       >
    //         {(selectedMetrics.privacy || []).map((name) => (
    //           <div>{name}</div>
    //         ))}
    //       </div>
    //     </div>
    //   ),
    //   dataIndex: "privacy",
    //   key: "privacy",
    //   fixed: "left",
    //   width: 200,
    //   render: (obj) => renderItem(obj, "privacy"),
    //   sorter: (a, b) =>
    //     calcSum(a.privacy, "privacy") - calcSum(b.privacy, "privacy"),
    // },
    ...constraintColumns,
  ];

  return (
    <Table
      className="lineup-table"
      columns={columns}
      pagination={false}
      dataSource={tableData}
      scroll={{ y: tableData.length > 4 && 220 }}
    />
  );
};

export default LineupTable;
