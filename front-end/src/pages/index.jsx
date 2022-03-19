import React, { useEffect, useState } from "react";
import "./index.less";
import DataView from "../components/DataView/DataView";
import ChartsView from "../components/ChartsView/ChartsView";
import ModelView from "../components/ModelView/ModelView";
import Validation from "../components/ValidationView/ValidationView";
import LineupTable from "../components/ValidationView/LineupTable";
import { ReactComponent as Title } from "../assets/title.svg";
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
import { modelData as tempModelData } from "../data/modelData";
import { setWeights, setPattern, getModelData } from "../services/api";
import { Button } from "antd";

const IndexPage = () => {
  // 不使用redux，直接在此处定义全局数据，通过props传递
  const [originalData, setOriginalData] = useState(initialOriginalData);
  const [attributeData, setAttributeData] = useState(initialAttributeData);
  const [attributeCharacter, setAttributeCharacter] = useState(
    initialAttributeCharacter
  );
  // 过滤条件数据{'age': {attributeType: '1', max: '55', min: '10'}, 'sex': {attributeType: '0', value: ['male', 'female']}}
  const [filterData, setFilterData] = useState({});
  const [afterFilterData, setAfterFilterData] = useState(originalData);
  // 约束
  const [constraints, setConstraints] = useState(null);
  const [augmentedData, setAugmentedData] = useState(null);
  const [protectedData, setProtectedData] = useState(null);
  // model 开关，是否使用临时数据
  const [modelData, setModelData] = useState(tempModelData); // null
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
      .then((res) => setModelData(res.data))
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

  //接口测试
  useEffect(() => {
    // const data = {
    //   "weights": [
    //     {
    //       "id": "C1",           // 约束编号：e.g. C1 constraint
    //       "weight": 0.3, 	      // 每个约束的budget，后端设置点的budget，采点
    //     },
    //   ],
    //   "bayes_budget": 1.5,
    // }
    // setWeights(data)
    //   .then(res => console.log(res))
    //   .catch(e => console.log(e));
  });
  //打印数据查看变化
  console.log("originalData", originalData);
  console.log("attributeData", attributeData);
  console.log("attributeCharacter", attributeCharacter);
  console.log("filterData", filterData);
  console.log("augmentedData", augmentedData);
  // console.log("protectedData", protectedData);
  console.log("modelData", modelData);

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
            setFilterData={setFilterData}
          ></DataView>
        </div>

        <div className="view-box">
          <div className="view-inner-box">
            {/* Charts View */}
            <div className="block charts-view">
              <div className="view-title">
                <ChartsViewIcon className="view-icon" />
                Charts View
                {/* 暂时加个按钮，用于进入model view */}
                <Button
                  size="small"
                  style={{ float: "right", top: 2 }}
                  onClick={handleNextClick}
                >
                  next
                </Button>
              </div>
              <div className="cross-line"></div>
              <ChartsView
                original_data={originalData}
                attribute_character={attributeCharacter}
                setConstraints={setConstraints}
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
                  setWeights={setWeights}
                  modelData={modelData}
                  setProtectedData={setProtectedData}
                ></ModelView>
              )}
            </div>
          </div>

          {/* validation view */}
          <div className="block validation-view">
            <div className="view-title">
              <ValidationViewIcon className="view-icon" />
              Validation View
            </div>
            <div className="cross-line"></div>
            <Validation></Validation>
            {/* <LineupTable></LineupTable> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default IndexPage;
