import React, { useEffect, useState } from "react";
import "./index.less";
import DataView from "../components/DataView/DataView";
import ChartsView from "../components/ChartsView/ChartsView";
import ModalView from "../components/ModelView/ModalView";
import Validation from "../components/ValidationView/ValidationView";
import LineupTable from "../components/ValidationView/LineupTable";
import { ReactComponent as Title } from "../assets/title.svg";
import { ReactComponent as DataViewIcon } from "../assets/data-view-icon.svg";
import { ReactComponent as ChartsViewIcon } from "../assets/charts-view-icon.svg";
import { ReactComponent as ModalViewIcon } from "../assets/modal-view-icon.svg";
import { ReactComponent as ValidationViewIcon } from "../assets/validation-view-icon.svg";
// 原始数据, 后端返回(或者只返回原是数据，别的自己计算)
import { original_data, originalData } from "../data/originalData"; // 原始数据
import { attributeData, attributeCharacter } from "../data/attributes"; // 原始数据属性、数据属性特镇
import { modalData } from "../data/modalData";
import { setWeights, setPattern, getModalData } from "../services/api";

const IndexPage = () => {
  // 不使用redux，直接在此处定义全局数据，通过props传递
  const [originalData, setOriginalData] = useState(null);
  const [attributeData, setAttributeData] = useState(null);
  const [attributeCharacter, setAttributeCharacter] = useState(null);
  // 过滤条件数据{'age': {attributeType: '1', max: '55', min: '10'}, 'sex': {attributeType: '0', value: ['male', 'female']}}
  const [filterData, setFilterData] = useState({});
  const [afterFilterData, setAfterFilterData] = useState(originalData);
  // 约束
  const [augmentedData, setAugmentedData] = useState(null);
  const [protectedData, setProtectedData] = useState(null);
  // model
  // const [modalData, setModalData] = useState(null);

  // useEffect(() => {
  //   if (!originalData) return;
  //   getModalData()
  //     .then(res => setModalData(res.data))
  //     .catch(e => console.log(e));
  // }, [originalData])

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
  console.log("protectedData", protectedData);
  return (
    <>
      <Title />
      <div className="system-content">
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
        <div className="block charts-view">
          <div className="view-title">
            <ChartsViewIcon className="view-icon" />
            Charts View
          </div>
          <div className="cross-line"></div>
          <ChartsView
            original_data={originalData}
            protected_data={protectedData}
            attribute_data={attributeData}
            attribute_character={attributeCharacter}
            setPattern={setPattern}
            setAugmentedData={setAugmentedData}
            setProtectedData={setProtectedData}
          ></ChartsView>
        </div>
        <div className="view-box">
          <div className="block modal-view">
            <div className="view-title">
              <ModalViewIcon className="view-icon" />
              Modal View
            </div>
            <div className="cross-line"></div>
            {modalData && <ModalView
              setWeights={setWeights}
              modalData={modalData}
            ></ModalView>}
          </div>
          <div className="block validation-view">
            <div className="view-title">
              <ValidationViewIcon className="view-icon" />
              Validation View
            </div>
            <div className="cross-line"></div>
            {/* <Validation></Validation> */}
            <LineupTable></LineupTable>
          </div>
        </div>
      </div>
    </>
  );
};

export default IndexPage;
