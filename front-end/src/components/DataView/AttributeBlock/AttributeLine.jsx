import React, { useEffect, useState, useRef } from 'react';
import './AttributeLine.less';
// import DensityPlot from '../../common/DensityPlot';
// import ColumnPlot from '../../common/ColumnPlot';
import { ReactComponent as DropIcon } from "../../../assets/drop-icon.svg";
import { ReactComponent as FilterIcon } from "../../../assets/filter-icon.svg";
import { ReactComponent as HighlightFilterIcon } from "../../../assets/highlight-filter-icon.svg";
import { ReactComponent as OverviewExpandView } from "../../../assets/overview-expand-icon.svg";
import { ReactComponent as OverviewFoldView } from "../../../assets/overview-fold-icon.svg";
import ColumnPlot from '../MiniPlot/ColumnPlot';
import DensityPlot from '../MiniPlot/DensityPlot';
const AttributeLine = (props) => {
  const {
    originalData,
    attribute,
    attributeType,
    color,
    filterData,
    setFilterData,
    attributeCharacter,
    drops,
    setDrops,
  } = props;

  const [isShowOverview, setIsShowOverview] = useState(false);
  const divRef = useRef(null);

  // 
  const handleDropClick = () => {
    const pos = drops.indexOf(attribute);
    if (pos === -1) {
      // 删除某个属性，需要将其过滤条件也删除
      drops.push(attribute);
      if (filterData.hasOwnProperty(attribute))
        delete filterData[attribute];
    } else {
      drops.splice(pos, 1);
    }
    setDrops([...drops]);
  }

  // 点击后，删除筛选项
  const handleFilterClick = () => {
    if (filterData.hasOwnProperty(attribute))
      delete filterData[attribute];
    setFilterData({ ...filterData });
  }

  const handleOverviewClick = () => {
    setIsShowOverview(!isShowOverview);
  }

  return (
    <div>
      <div
        className='attribute-block-line'
        ref={divRef}
        style={{ backgroundColor: drops.includes(attribute) ? '#ccc' : color }}
      >
        <span>
          {/* <span style={{ padding: '0px 5px' }}><SettingOutlined /></span> */}
          <span style={{ padding: '0px 5px' }}>{attribute}</span>
        </span>
        {attributeType !== 'Computations' && <span>
          <span style={{ padding: '0px 5px' }} onClick={handleDropClick}>
            <DropIcon className='small-icon'/>
          </span>
          <span style={{ padding: '0px 5px' }} onClick={handleFilterClick}>
            {
              filterData.hasOwnProperty(attribute) ? 
                <HighlightFilterIcon className='small-icon'/> :
                <FilterIcon className='small-icon' />
            }
          </span>
          <span style={{ padding: '0px 5px' }} onClick={handleOverviewClick}>
            {isShowOverview ? <OverviewFoldView className='small-icon' /> : <OverviewExpandView className='small-icon' />}
          </span>
        </span>}
      </div>
      {isShowOverview && attributeType === 'Dimensions' && <ColumnPlot
        originalData={originalData}
        attribute={attribute}
        svgWidth={divRef.current.offsetWidth}
        filterData={filterData}
        setFilterData={setFilterData}
        attributeCharacter={attributeCharacter}
       ></ColumnPlot>}
      {isShowOverview && attributeType === 'Measures' && <DensityPlot
        originalData={originalData}
        attribute={attribute}
        svgWidth={divRef.current.offsetWidth}
        filterData={filterData}
        setFilterData={setFilterData}
        attributeCharacter={attributeCharacter}
      ></DensityPlot>}
    </div>
  )

}

export default AttributeLine;