import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import "./ModelView.less";
import { Switch, Slider, InputNumber, Row, Col, Space, Button } from "antd";
import * as d3 from "d3";
import ClockBlock from "./ClockBlock/ClockBlock";
import BayesianNetwork from "./BayesianNetwork/BayyesianNetWork";
import ParallelPlot from "./ParallelPlot";
import SankeyPlot from "./SankeyPlot";
import Matrix from "./Matrix/Matrix";
import Legend from "./Matrix/Legend";
import AlluvialPlot from "./AlluvialPlot/AlluvialPlot";
import WeightsTable from "./WeightsTable/WeightsTable";
import Projection from "./Projection/Projection";
import { setWeights, getNetwork, getMetrics } from "../../services/api";
import { cloneDeep } from "lodash";

const [svgWidth, svgHeight] = [1118, 550];
const margin = {
  left: 0,
  top: 50,
  right: 0,
  bottom: 0,
};
// 约束模式颜色
const patternColor = {
  original: "#dedede",
  cluster: "#9cb0a2",
  correlation: "#c39b83",
  order: "#bbafd1",
  others: '#ccc',
};

const ModelView = (props) => {
  const {
    modelData,
    setProtectedData,
    schemes,
    setSchemes,
    networkData,
    setNetworkData,
    modelViewData,
    setModelViewData,
    weightsData,
    setWeightsData,
  } = props;
  const {
    total_num: totalNum,
    axis_order: axisOrder,
    proportion_data: proportionData,
    // flow_data: flowData,
    constraints,
    sankey_data: sankeyData,
    matrix_data: matrixData, //绘制边用
  } = modelData;
  console.log('networkData', networkData);

  const [privacyBudgetValue, setPrivacyBudget] = useState(10); // 整体隐私预算,0-20,默认10
  const [patternWeights, setPatternWeights] = useState(null); // 权重{'c1': 1, 'c2': 1}
  // const [constraintsPos, setConstraintsPos] = useState(null); // 约束坐标，改成坐标不变，边权重matrix_data改变
  const [selectedId, setSelectedId] = useState([]); // 选中点亮的约束
  const [showSankey, setShowSankey] = useState(true); //是否展示桑基图

  // modelData修改，更新patternWeights、constraintsPos, 清空selectedId
  // 用于绘制weightsTable，initialPatternWeight, patternType, 
  const [initialPatternWeight, patternType] = useMemo(() => {
    const initial = {},
      patternType = {};
    constraints.forEach((constraint) => {
      initial[constraint.id] = 0.5;
      patternType[constraint.id] = constraint.type;
    });
    // initial.others = 0.5;
    // patternType.others = "others";
    return [initial, patternType];
  }, [constraints]);
  useEffect(() => {
    if (weightsData === null) {
      setPrivacyBudget(10);
      setPatternWeights(initialPatternWeight);
    } else {
      // 有weightsData值，根据传过来的值初始化
      setPrivacyBudget(weightsData.bayes_budget);
      const initial = {};
      weightsData.weights.forEach(obj => {
        initial[obj.id] = obj.weight;
      });
      setPatternWeights(initial);
    }
    
    // setConstraintsPos(constraints);
    setSelectedId([]);
  }, [constraints, initialPatternWeight, weightsData]);

  // 点击update，更新constraintsPos, 更新matrixData, 再发送getNetwork请求
  const handleUpdateClick = () => {
    const data = {};
    data.bayes_budget = privacyBudgetValue;
    data.weights = [];
    Object.entries(patternWeights).forEach(([key, value]) => {
      data.weights.push({ id: key, weight: value });
    });
    setWeights(data)
      .then((res) => {
        // setConstraintsPos(res.data.constraints)
        console.log('res', res);
        getNetwork()
          .then(res => setNetworkData(res.data.data.network))
          .catch(e => console.log(e));
      })
      .catch((e) => console.log("e", e));
  };

  // 点击record，发送请求, 并且需要记录下这一份scheme和modelViewData数据
  const handleRecordClick = () => {
    const currentModelViewData = {};
    const weightsData = {};
    weightsData.bayes_budget = privacyBudgetValue;
    weightsData.weights = [];
    Object.entries(patternWeights).forEach(([key, value]) => {
      weightsData.weights.push({ id: key, weight: value });
    });
    currentModelViewData.modelData = cloneDeep(modelData);
    currentModelViewData.networkData = cloneDeep(networkData);
    currentModelViewData.weightsData = cloneDeep(weightsData);
    setModelViewData([...modelViewData, currentModelViewData])
    getMetrics()
      .then((res) => {
        setSchemes([...schemes, res.data.scheme]);
      })
      .catch((e) => console.log(e));
  };

  // 渲染上部控制面板
  const renderModelControlPanel = () => {
    return (
      <div className="model-control-panel">
        <Space>
          <span>Privacy Budget</span>
          <Slider
            min={0}
            max={20}
            step={0.1}
            style={{ width: 100 }}
            value={privacyBudgetValue}
            onChange={(value) => setPrivacyBudget(value)}
          ></Slider>
          <InputNumber
            size="small"
            min={0}
            max={20}
            step={0.1}
            style={{ width: 60 }}
            value={privacyBudgetValue}
            onChange={(value) => setPrivacyBudget(value)}
          ></InputNumber>
          <div style={{ display: "inline-block", width: 20 }}></div>
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <div
              className="exchange-button"
              onClick={() => setShowSankey(true)}
              style={{borderColor: showSankey ? '#FF9845' : '#F5F5F5'}}
            >Sankey diagram</div>
            <div
              className="exchange-button"
              onClick={() => setShowSankey(false)}
              style={{borderColor: showSankey ? '#F5F5F5' : '#FF9845'}}
            >Bayesian network</div>
            </div>
          <div style={{ display: "inline-block", width: 20 }}></div>
          <Button size="small" onClick={handleRecordClick}>
            Record
          </Button>
        </Space>
      </div>
    );
  };

  return (
    <div>
      {renderModelControlPanel()}
      {/* 一个大的svg放置小svg */}
      {modelData && (
        <svg width={svgWidth} height={svgHeight}>
          <foreignObject x={0} y={0} width={400} height={230}>
            {patternWeights && (
              <WeightsTable
                patternWeights={patternWeights}
                setPatternWeights={setPatternWeights}
                handleUpdateClick={handleUpdateClick}
                patternType={patternType}
                patternColor={patternColor}
              ></WeightsTable>
            )}
          </foreignObject>
          {/* 投影视图 */}
          <g transform="translate(0, 230)">
            <Projection
              constraints={constraints}
              patternColor={patternColor}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              matrixData={matrixData}
              patternWeights={patternWeights}
            ></Projection>
          </g>
          <g transform="translate(400,0)">
            {showSankey ?
              <SankeyPlot
                totalNum={totalNum}
                axisOrder={axisOrder}
                proportionData={proportionData}
                sankeyData={sankeyData}
                constraints={constraints}
                patternColor={patternColor}
                patternType={patternType}
                selectedId={selectedId}
              ></SankeyPlot> :
              <BayesianNetwork
                networkData={networkData}
              ></BayesianNetwork>
            }
          </g>

          {/* <ClockBlock></ClockBlock> */}
          {/* <BayesianNetwork></BayesianNetwork> */}
          {/* <SankeyPlot></SankeyPlot> */}
          {/* <ParallelPlot></ParallelPlot> */}
        </svg>
      )}
    </div>
  );
};

export default ModelView;
