import React, { useMemo } from "react";
import { Table, Tag, Radio, Space, Button } from "antd";
import "./LineupTable.less";
// const data = [
//   {
//     key: '1',
//     Schemes: 'Scheme #1',
//     budget: [4, 5, 6],
//     cluster: [3, 3, 3, 6],
//     correlation: [5],
//     order: [5, 9],
//   },
//   {
//     key: '2',
//     Schemes: 'Scheme #2',
//     budget: [4, 5, 6, 8],
//     cluster: [3, 3, 3, 3],
//     correlation: [5],
//     order: [5, 6],
//   },
//   {
//     key: '3',
//     Schemes: 'Scheme #3',
//     budget: [4, 5, 6, 1, 1],
//     cluster: [3, 3, 3, 3],
//     correlation: [5],
//     order: [5, 6],
//   },
// ];
const titleStyle = { fontWeight: "bold", fontSize: 18 };
// 标题到对象的映射
const NameMap = {
  KL: "KL",
  Wasserstein: "WDis",
  DTW: "DTW",
  Euclidean: "Euc",
  PearsonCorrelation: "PCD",
  NDCG: "NDCG",
  mAP: "mAP",
};

const schemes = [
  {
    id: 0,
    key: 0,
    statistical: {
      KSTest: 0.9123692077727952,
      CSTest: 0.9393205745638467,
    },
    detection: {
      LogisticDetection: 0.8124266859712977,
    },
    privacy: {
      MLP: 0.11019587037579194,
      CAP: 0.7476792585968235,
    },
  },
];

const LineupTable = (props) => {
  const {
    prevBayes,
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

  // schemes变化后重新计算表格数据
  const tableData = useMemo(() => {
    const tableData = [];
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
      record.detection = scheme.metrics.detection_metrics;
      (constraints || []).forEach((constraint) => {
        record[constraint.id] = {
          ...(constraint.type === "cluster"
            ? {
                KL: { original: 0.85, protected: 0.82 },
                WDis: { original: 0.74, protected: 0.82 },
              }
            : constraint.type === "correlation"
            ? { DTW: {}, Euc: {}, PCD: {} }
            : { NDCG: {}, mAP: {} }),
          ...patterns[constraint.id],
        };
      });
      tableData.push(record);
    });
    return tableData;
  }, [schemes]);

  // data数据扩充最大值
  // data.forEach(obj => {
  //   obj.budgetSum = obj.budget.reduce((pre, cur) => pre + cur);
  //   obj.clusterSum = obj.cluster.reduce((pre, cur) => pre + cur);
  //   obj.correlationSum = obj.correlation.reduce((pre, cur) => pre + cur);
  //   obj.orderSum = obj.order.reduce((pre, cur) => pre + cur);
  // })

  // 计算每一项最大值，用于归一化
  // const calcMax = (data) => {
  //   const ans = {
  //     budget: 0,
  //     cluster: 0,
  //     correlation: 0,
  //     order: 0,
  //   };
  //   data.forEach(obj => {
  //     ans.budget = Math.max(ans.budget, obj.budgetSum);
  //     ans.cluster = Math.max(ans.cluster, obj.clusterSum);
  //     ans.correlation = Math.max(ans.correlation, obj.correlationSum);
  //     ans.order = Math.max(ans.order, obj.orderSum);
  //   })
  //   return ans;
  // }
  // const everyMax = calcMax(data);

  // 列
  // const renderItem = (array, pattern) => {
  //   const sum = array.reduce((pre, cur) => pre + cur);
  //   const newArray = [];
  //   let nowVal = 0;
  //   array.forEach(item => {
  //     nowVal += item;
  //     newArray.push(nowVal)
  //   })
  //   const nowWidth = sum / everyMax[pattern] * 150;

  //   return <svg style={{ backgroundColor: '#82c6e8', height: 20 }} width={nowWidth}>
  //     {newArray.map((item, index) => {
  //       return <line
  //         key={index}
  //         x1={item * nowWidth / sum}
  //         y1={0}
  //         x2={item * nowWidth / sum}
  //         y2={20}
  //         strokeWidth={1}
  //         stroke='#fff'
  //       ></line>
  //     })}
  //   </svg>
  // };

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
    if (!original_rate || !protected_rate) {
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
  const calcConstraintSum = (constraint) => {
    let sum = 0;
    (selectedMetrics[constraint.type] || []).forEach((kind) => {
      sum += constraint[NameMap[kind]].protected;
    });
    return sum;
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
            <>
              <div style={{ textAlign: "center" }}>
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
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "normal",
                  paddingTop: 35,
                }}
              >
                {(selectedMetrics[constraint.type] || []).map((name, index) => (
                  <div>{name}</div>
                ))}
              </div>
            </>
          ),
          dataIndex: constraint.id,
          key: constraint.id,
          width: singleColumnWidth * selectedMetrics[constraint.type].length,
          render: (obj) => renderMergeConstraintItem(obj, constraint.type),
          sorter: (a, b) =>
            calcConstraintSum(a[constraint.id]) -
            calcConstraintSum(b[constraint.id]),
        }
      : {
          title: (
            <div style={{ textAlign: "center" }}>
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
            </div>
          ),
          dataIndex: constraint.id,
          key: constraint.id,
          sorter: (a, b) =>
            calcConstraintSum(a[constraint.id]) -
            calcConstraintSum(b[constraint.id]),
          children: (selectedMetrics[constraint.type] || []).map((name) => {
            return {
              title: name,
              dataIndex: [constraint.id, NameMap[name]],
              key: constraint.id + ":" + name,
              width: singleColumnWidth,
              render: (obj) => renderSingleConstraintItem(obj),
              sorter: (a, b) => a - b,
            };
          }),
        };
  });

  const columns = [
    {
      title: <div style={titleStyle}>Schemes</div>,
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
          Scheme #{id}
        </div>
      ),
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: <div style={titleStyle}>Privacy budget</div>,
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
      sorter: (a, b) => a.budget - b.budget,
    },
    {
      dataIndex: "statistical",
      key: "statistical",
      fixed: "left",
      width: singleColumnWidth * selectedMetrics.statistical.length,
      sorter: (a, b) =>
        calcSum(a.statistical, "statistical") -
        calcSum(b.statistical, "statistical"),
      ...(merge
        ? {
            title: (
              <div style={{ textAlign: "center" }}>
                <div style={titleStyle}>Statistical metrics</div>
                <div
                  style={{
                    paddingTop: 35,
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
                <div style={titleStyle}>Statistical metrics</div>
              </div>
            ),
            children: (selectedMetrics.statistical || []).map((name) => {
              return {
                title: name,
                dataIndex: ["statistical", name],
                key: "statistical:" + name,
                width: singleColumnWidth,
                fixed: "left",
                render: (num) => renderSingleMetricItem(num),
                sorter: (a, b) => a.statistical[name] - b.statistical[name],
              };
            }),
          }),
    },
    {
      dataIndex: "detection",
      key: "detection",
      fixed: "left",
      width: singleColumnWidth * selectedMetrics.detection.length,
      sorter: (a, b) =>
        calcSum(a.detection, "detection") - calcSum(b.detection, "detection"),
      ...(merge
        ? {
            title: (
              <div style={{ textAlign: "center" }}>
                <div style={titleStyle}>Detection metrics</div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: 35,
                  }}
                >
                  {(selectedMetrics.detection || []).map((name, index) => (
                    <div style={{ marginRight: 12 }}>{name}</div>
                  ))}
                </div>
              </div>
            ),
            render: (obj) => renderMergeMetricItem(obj, "detection"),
          }
        : {
            title: (
              <div>
                <div style={titleStyle}>Detection metrics</div>
              </div>
            ),
            children: (selectedMetrics.detection || []).map((name) => {
              return {
                title: name,
                dataIndex: "detection",
                key: "detection:" + name,
                width: singleColumnWidth,
                fixed: "left",
                render: (num) => renderSingleMetricItem(num),
                sorter: (a, b) => a.detection[name] - b.detection[name],
              };
            }),
          }),
    },
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
