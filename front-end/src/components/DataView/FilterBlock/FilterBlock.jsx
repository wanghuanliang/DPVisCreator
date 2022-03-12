import React, { useState, useEffect } from 'react';
import './FilterBlock.less'
import { Slider, Checkbox } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';

const CheckboxGroup = Checkbox.Group;

const FilterBlock = (props) => {
  const { attributeCharacter, attribute, filterData, setFilterData } = props;
  const [sliderValue, setSliderValue] = useState(null);
  const [checkValue, setCheckValue] = useState(null);
  useEffect(() => {
    if (sliderValue === null) return;
    // 深拷贝效率低，使用解构赋值浅比较更新了state的地址，react浅比较认为state更改触发重新渲染
    // const temp = cloneDeep(filterData);
    // state值不能改，但是对象的话不修改地址即可
    filterData[attribute] = {attributeType: '1', min: sliderValue[0], max: sliderValue[1]}
    setFilterData({...filterData});
  }, [sliderValue]);

  useEffect(() => {
    if (checkValue === null) return;
    filterData[attribute] = {attributeType: '0', value: checkValue}
    setFilterData({...filterData});
  }, [checkValue])

  const handleCloseClick = () => {
    delete filterData[attribute]
    setFilterData({...filterData});
  }

  const renderCheckbox = (attr) => {
    const plainOptions = attributeCharacter[attr]?.values;
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
          {attributeCharacter[attribute].attribute_type === 'Dimensions' && renderCheckbox(attribute)}
          {attributeCharacter[attribute].attribute_type === 'Measures' && renderSlider(attribute)}
        </div>
      </div>
    </div>
  )
}

export default FilterBlock;