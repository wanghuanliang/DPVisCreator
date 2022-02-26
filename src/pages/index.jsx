import React, { useState } from "react";
import "./index.less";
import DataView from "../components/DataView/DataView";
import ChartsView from "../components/ChartsView/ChartsView";
import url from "../assets/system.png";
import picture from "../assets/system-icon.svg";
import { ReactComponent as Logo } from "../assets/system-icon.svg";
import { ReactComponent as Title } from "../assets/title.svg";
import { ReactComponent as DataViewIcon } from "../assets/data-view-icon.svg";
import { ReactComponent as ChartsViewIcon } from "../assets/charts-view-icon.svg";
import { ReactComponent as ModalViewIcon } from "../assets/modal-view-icon.svg";
import { ReactComponent as ValidationViewIcon } from "../assets/validation-view-icon.svg";
// 原始数据
import { originalData } from "../data/originalData";

const IndexPage = () => {
  // 不使用redux，直接在此处定义全局数据
  // 过滤操作数据，属性名为键[{'attribute': 'age, 'attributeType': '1'}]
  // 过滤条件数据{'age': {attributeType: '1', max: '55', min: '10'}, 'sex': {attributeType: '0', value: ['male', 'female']}}
  const [filterData, setFilterData] = useState({}); 
  const [afterFilterData, setAfterFilterData] = useState(originalData);
  return (
    <>
      <Title />
      <div className="system-content">
        <div className="block data-view">
          <div className="view-title">
            <DataViewIcon className="view-icon" />
            Data View
          </div>
          <div
            style={{ width: "100%", height: "4px", backgroundColor: "#e9e9e9" }}
          ></div>
          <DataView
            originalData={originalData}
            filterData={filterData}
            setFilterData={setFilterData}
          ></DataView>
        </div>
        <div className="block charts-view">
          <div className="view-title">
            <ChartsViewIcon className="view-icon" />
            Charts View
          </div>
          <div
            style={{ width: "100%", height: "4px", backgroundColor: "#e9e9e9" }}
          ></div>
          <ChartsView></ChartsView>
        </div>
        <div className="view-box">
          <div className="block modal-view">
            <div className="view-title">
              <ModalViewIcon className="view-icon" />
              Modal View
            </div>
            <div
              style={{
                width: "100%",
                height: "4px",
                backgroundColor: "#e9e9e9",
              }}
            ></div>
          </div>
          <div className="block validation-view">
            <div className="view-title">
              <ValidationViewIcon className="view-icon" />
              Validation View
            </div>
            <div
              style={{
                width: "100%",
                height: "4px",
                backgroundColor: "#e9e9e9",
              }}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IndexPage;
