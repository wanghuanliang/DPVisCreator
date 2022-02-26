import React from 'react';
import './FilterBlock.less'
import { Slider, Checkbox } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { attributeCharacter } from '../../../data/attributes';
import { cloneDeep } from 'lodash';

const CheckboxGroup = Checkbox.Group;

const FilterBlock = (props) => {
  const { attribute, filterData, setFilterData } = props;

  const handleCloseClick = () => {
    const temp = cloneDeep(filterData)
    delete temp[attribute]
    console.log(temp)
    setFilterData(temp);
  }

  const renderCheckbox = (attr) => {
    const plainOptions = attributeCharacter[attr]?.range;
    return (
      <CheckboxGroup
        options={plainOptions}
        defaultValue={plainOptions}
      ></CheckboxGroup>
    )
  }

  const renderSlider = (attr) => {
    const min = attributeCharacter[attr]?.range[0];
    const max = attributeCharacter[attr]?.range[1];
    return (
      <Slider
        style={{width: '100%'}}
        range
        min={min}
        max={max}
        defaultValue={[min, max]}
      ></Slider>
    )
  }

  return (
    <div className='filter-block-box'>
      <div className='filter-block-title'>
        <span>{attribute}</span>
        <span
          onClick={handleCloseClick}
          style={{cursor: 'pointer'}}
        ><CloseOutlined /></span>
      </div>
      <div className='filter-block-content-box'>
        <div className='filter-block-content'>
          {
            attributeCharacter[attribute].character === '0' ?
              renderCheckbox(attribute) : renderSlider(attribute)
          }
        </div>
      </div>
    </div>
  )
}

export default FilterBlock;