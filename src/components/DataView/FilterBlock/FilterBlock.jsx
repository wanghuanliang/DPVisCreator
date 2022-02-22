import React from 'react';
import './FilterBlock.less'
import { CloseOutlined } from '@ant-design/icons';

const FilterBlock = (props) => {
  const { attributeName, arrtibuteType } = props;

  return (
    <div className='filter-block-box'>
      <div className='filter-block-title'>
        <span>{attributeName}</span>
        <span><CloseOutlined /></span>
      </div>
      <div className='filter-block-content-box'>
        <div className='filter-block-content'>
          123
        </div>
      </div>
    </div>
  )
}

export default FilterBlock;