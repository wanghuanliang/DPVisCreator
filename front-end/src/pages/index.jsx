import React, { useEffect, useState } from "react";
import "./index.less";
import DataView from "../components/DataView/DataView";
import ChartsView from "../components/ChartsView/ChartsView";
import ModelView from "../components/ModelView/ModelView";
import Validation from "../components/ValidationView/ValidationView";
import LineupTable from "../components/ValidationView/LineupTable";
import { ReactComponent as Title } from "../assets/title2.svg";
import { ReactComponent as DataViewIcon } from "../assets/data-view-icon.svg";
import { ReactComponent as ChartsViewIcon } from "../assets/charts-view-icon.svg";
import { ReactComponent as ModelViewIcon } from "../assets/model-view-icon.svg";
import { ReactComponent as ValidationViewIcon } from "../assets/validation-view-icon.svg";
// 原始数据, 后端返回(或者只返回原是数据，别的自己计算)
import { original_data as initialOriginalData } from "../data/originalData"; // 原始数据
import {
  attributeData as initialAttributeData,
  attributeCharacter as initialAttributeCharacter,
} from "../data/attributes"; // 原始数据属性、数据属性特镇
import { networkData as initialNetworkData } from "../data/networkData";
import { modelData as tempModelData } from "../data/modelData";
import {
  servicesInit,
  servicesDestroy,
  setWeights,
  getModelData,
} from "../services/api";
import { Button, message } from "antd";

const IndexPage = () => {
  // 不使用redux，直接在此处定义全局数据，通过props传递
  // 原始数据
  const [originalData, setOriginalData] = useState(initialOriginalData);
  const [attributeData, setAttributeData] = useState(initialAttributeData);
  const [attributeCharacter, setAttributeCharacter] = useState(
    initialAttributeCharacter
  );
  // 过滤条件数据{'age': {attributeType: '1', max: '55', min: '10'}, 'sex': {attributeType: '0', value: ['male', 'female']}}
  const [filterData, setFilterData] = useState({});
  const [filterOriginalData, setFilterOriginalData] =
    useState(initialOriginalData);
  const [filterAttributeCharacter, setFilterAttributeCharacter] = useState(
    initialAttributeCharacter
  );
  // 约束
  const [constraints, setConstraints] = useState(null); // 全局constraints
  const [augmentedData, setAugmentedData] = useState(null);
  const [protectedData, setProtectedData] = useState(null);
  // model 开关，是否使用临时数据
  const [modelData, setModelData] = useState(null); // null
  const [networkData, setNetworkData] = useState(null); // 贝叶斯网络数据
  const [weightsData, setWeightsData] = useState(null); // pattern权重
  const [modelViewData, setModelViewData] = useState([null]); // model view相关数据前端存起来，包括modelData、networkData，weightData
  // 指标
  const [schemes, setSchemes] = useState([]); // 初始化为数组，否则会出现iterable问题
  const changeSchemeId = (id) => {
    setModelData(modelViewData[id].modelData);
    setNetworkData(modelViewData[id].networkData);
    setWeightsData(modelViewData[id].weightsData);
  }
  
  const handleNextClick = () => {
    const jcts = JSON.parse(JSON.stringify(constraints));
    const cts = [];
    for (let i = 0; i < constraints.length; i++) {
      if (jcts[i].selected) {
        let constraint = jcts[i];
        delete constraint.selected;
        delete constraint.svgImage;
        delete constraint.canvasImage;
        delete constraint.params.fitting;
        delete constraint.params.path;
        cts.push(constraint);
      }
    }
    getModelData({ constraints: cts })
      .then((res) => {
        setModelData(res.data.data);
      })
      .catch((e) => {
        console.log(e);
        setModelData(null);
      });
  };
  // useEffect(() => {
  //   if (!augmentedData) return;
  //   getModelData({ slice_methods: {}})
  //     .then(res => setModelData(res.data))
  //     .catch(e => console.log(e));
  // }, [augmentedData])

  // service init destroy
  useEffect(() => {
    servicesInit()
      .then((res) => message.success("后端连接成功"))
      .catch((e) => message.error("后端连接失败"));
  }, []);
  window.addEventListener("beforeunload", async (event) => {
    await servicesDestroy().then().catch();
  });

  //打印数据查看变化
  console.log("originalData", originalData);
  console.log("attributeData", attributeData);
  console.log("attributeCharacter", attributeCharacter);
  console.log("filterData", filterData);
  console.log("augmentedData", augmentedData);
  // console.log("protectedData", protectedData);
  console.log("modelData", modelData);
  console.log("networkData", networkData);
  console.log("modelViewData", modelViewData);

  return (
    <>
      <Title />
      <div className="system-content">
        {/* Data View */}
        <div className="block data-view">
          <div className="view-title">
            <DataViewIcon className="view-icon" />
            Data View
          </div>
          <div className="cross-line"></div>
          <DataView
            originalData={originalData}
            setOriginalData={setOriginalData}
            attributeData={attributeData}
            setAttributeData={setAttributeData}
            attributeCharacter={attributeCharacter}
            setAttributeCharacter={setAttributeCharacter}
            filterData={filterData}
            setBase={(base) => {
              if (schemes.length > 0) schemes.shift();
              setSchemes([base, ...schemes]);
            }}
            setFilterData={setFilterData}
            setFilterOriginalData={setFilterOriginalData}
            setFilterAttributeCharacter={setFilterAttributeCharacter}
          ></DataView>
        </div>

        <div className="view-box">
          <div className="view-inner-box">
            {/* Charts View */}
            <div className="block charts-view">
              <div className="view-title">
                <ChartsViewIcon className="view-icon" />
                Pattern View
                {/* 暂时加个按钮，用于进入model view */}
                {/* <Button
                  size="small"
                  style={{ float: "right", top: 2 }}
                  onClick={handleNextClick}
                >
                  Next
                </Button> */}
              </div>
              <div className="cross-line"></div>
              <ChartsView
                original_data={filterOriginalData}
                attribute_character={filterAttributeCharacter}
                constraints={constraints}
                setConstraints={setConstraints}
                setModelData={setModelData}
                setNetworkData={setNetworkData}
                setWeightsData={setWeightsData}
              ></ChartsView>
            </div>
            {/* model view */}
            <div className="block model-view">
              <div className="view-title">
                <ModelViewIcon className="view-icon" />
                Model View
              </div>
              <div className="cross-line"></div>
              {modelData && (
                <ModelView
                  modelData={modelData}
                  setModelData={setModelData}
                  schemes={schemes}
                  setSchemes={setSchemes}
                  networkData={networkData}
                  setNetworkData={setNetworkData}
                  modelViewData={modelViewData}
                  setModelViewData={setModelViewData}
                  weightsData={weightsData}
                  setWeightsData={setWeightsData}
                  globalConstraints={constraints}
                ></ModelView>
              )}
            </div>
          </div>

          {/* validation view */}
          <div className="block validation-view">
            <div className="view-title">
              <ValidationViewIcon className="view-icon" />
              Solution View
            </div>
            <div className="cross-line"></div>
            {!!schemes.length && (
              <Validation
                attributeCharacter={filterAttributeCharacter}
                originalData={filterOriginalData}
                constraints={constraints}
                schemes={schemes}
                setSchemes={setSchemes}
                changeSchemeId={changeSchemeId}
              ></Validation>
            )}
            {/* <LineupTable></LineupTable> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default IndexPage;
