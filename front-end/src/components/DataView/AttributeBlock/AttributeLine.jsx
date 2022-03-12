import React, { useEffect, useState, useRef } from 'react';
import './AttributeLine.less';
import DensityPlot from '../../common/DensityPlot';
import ColumnPlot from '../../common/ColumnPlot';
import { ReactComponent as FilterIcon } from "../../../assets/filter-icon.svg";
import { ReactComponent as OverviewExpandView } from "../../../assets/overview-expand-icon.svg";
import { ReactComponent as OverviewFoldView } from "../../../assets/overview-fold-icon.svg";

const AttributeLine = (props) => {
  const { originalData, attribute, attributeType, color, filterData, setFilterData } = props;
  const [isShowOverview, setIsShowOverview] = useState(false);
  const divRef = useRef(null);

  const handleOverviewClick = () => {
    setIsShowOverview(!isShowOverview);
  }

  const handleFilterClick = () => {
    // filterData展示筛选条件，
    if (filterData[attribute]) {
      return;
    } else {
      filterData[attribute] = [];
      setFilterData({...filterData});
    }
  }

  return (
    <div>
      <div className='attribute-block-line' ref={divRef} style={{ backgroundColor: color}}>
        <span>
          {/* <span style={{ padding: '0px 5px' }}><SettingOutlined /></span> */}
          <span style={{ padding: '0px 5px' }}>{attribute}</span>
        </span>
        {attributeType !== '2' &&<span>
          <span style={{ padding: '0px 5px' }} onClick={handleFilterClick}>
            <FilterIcon className='small-icon' />
          </span>
          <span style={{ padding: '0px 5px' }} onClick={handleOverviewClick}>
            {isShowOverview ? <OverviewFoldView className='small-icon' /> : <OverviewExpandView className='small-icon' />}
          </span>
        </span>}
      </div>
      {isShowOverview && attributeType === '0' && <ColumnPlot originalData={originalData} attribute={attribute} svgWidth={divRef.current.offsetWidth}></ColumnPlot>}
      {isShowOverview && attributeType === '1' && <DensityPlot originalData={originalData} attribute={attribute} svgWidth={divRef.current.offsetWidth}></DensityPlot>}
    </div>
  )

}

export default AttributeLine;