import React, { useEffect, useState, useRef } from 'react';
import './AttributeLine.less';
import { Histogram } from '@ant-design/plots';
import DensityPlot from '../../common/DensityPlot';
import ColumnPlot from '../../common/ColumnPlot';
import { ReactComponent as FilterIcon } from "../../../assets/filter-icon.svg";
import { ReactComponent as OverviewExpandView } from "../../../assets/overview-expand-icon.svg";
import { ReactComponent as OverviewFoldView } from "../../../assets/overview-fold-icon.svg";
import { cloneDeep } from 'lodash';

const AttributeLine = (props) => {
  const { originalData, attribute, attributeType, color, filterData, setFilterData } = props;

  const [isShowOverview, setIsShowOverview] = useState(false);

  const handleOverviewClick = () => {
    setIsShowOverview(!isShowOverview);
  }

  const handleFilterClick = () => {

    const temp = cloneDeep(filterData);
    console.log('add', attribute, filterData);
    temp[attribute] = {};
    setFilterData(temp);
  }

  
  useEffect(() => {

  }, [])

  return (
    <div>
      <div className='attribute-block-line' style={{ backgroundColor: color}}>
        <span>
          {/* <span style={{ padding: '0px 5px' }}><SettingOutlined /></span> */}
          <span style={{ padding: '0px 5px' }}>{attribute}</span>
        </span>
        {attributeType !== '2' &&<span>
          <span style={{ padding: '0px 5px' }} onClick={handleFilterClick}>
            <FilterIcon className='small-icon' />
          </span>
          <span style={{ padding: '0px 5px' }} onClick={handleOverviewClick}>
            {isShowOverview ? <OverviewExpandView className='small-icon' /> : <OverviewFoldView className='small-icon' />}
          </span>
        </span>}
      </div>
      {isShowOverview && attributeType === '0' && <ColumnPlot originalData={originalData} attribute={attribute}></ColumnPlot>}
      {isShowOverview && attributeType === '1' && <DensityPlot originalData={originalData} attribute={attribute}></DensityPlot>}
    </div>
  )

}

export default AttributeLine;