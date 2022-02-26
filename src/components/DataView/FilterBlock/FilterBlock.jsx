import React, { useState, useEffect } from 'react';
import './FilterBlock.less'
import { Slider, Checkbox } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { cloneDeep, debounce } from 'lodash';

const CheckboxGroup = Checkbox.Group;

const FilterBlock = (props) => {
  const { attributeCharacter, attribute, filterData, setFilterData } = props;
  const [sliderValue, setSliderValue] = useState(null);
  const [checkValue, setCheckValue] = useState(null);
  useEffect(() => {
    if (sliderValue === null) return;
    const temp = cloneDeep(filterData);
    temp[attribute] = {attributeType: '1', min: sliderValue[0], max: sliderValue[1]}
    setFilterData(temp);
  }, [sliderValue]);

  useEffect(() => {
    if (checkValue === null) return;
    const temp = cloneDeep(filterData);
    temp[attribute] = {attributeType: '0', value: checkValue}
    setFilterData(temp);
  }, [checkValue])

  const handleCloseClick = () => {
    const temp = cloneDeep(filterData)
    delete temp[attribute]
    setFilterData(temp);
  }

  const renderCheckbox = (attr) => {
    const plainOptions = attributeCharacter[attr]?.value;
    return (
      <CheckboxGroup
        options={plainOptions}
        defaultValue={plainOptions}
        onChange={(value) => setCheckValue(value)}
      ></CheckboxGroup>
    )
  }

  const renderSlider = (attr) => {
    const min = attributeCharacter[attr]?.min;
    const max = attributeCharacter[attr]?.max;
    return (
      <Slider
        style={{width: '100%'}}
        range
        min={min}
        max={max}
        defaultValue={[min, max]}
        onChange={debounce((value) => setSliderValue(value), 500)}
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
            attributeCharacter[attribute].attributeType === '0' ?
              renderCheckbox(attribute) : renderSlider(attribute)
          }
        </div>
      </div>
    </div>
  )
}

export default FilterBlock;