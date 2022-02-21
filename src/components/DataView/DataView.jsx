import React from 'react';
import './DataView.less';
import { attributesData } from '../../data/attributes';
import { Upload, Button, DatePicker, Space } from 'antd'
import { UploadOutlined } from '@ant-design/icons';
import AttributeBlock from './AttributeBlock/AttributeBlock';
import FilterBlock from './FilterBlock/FilterBlock';

const { RangePicker } = DatePicker;

function onChange(date, dateString) {
  console.log(date, dateString);
}


const DataView = () => {

  return (
    <div className='data-view-box'>
      <div>
        <Upload>
          <Button icon={<UploadOutlined/>}>Click to Upload Data</Button>
        </Upload>
      </div>
      <AttributeBlock
        data={attributesData['Dimension']}
        title='Dimension'
        color='#d0ddfa'
      ></AttributeBlock>
      <AttributeBlock
        data={attributesData['Measure']}
        title='Measure'
        color='#d4f2e5'
      ></AttributeBlock>
      <AttributeBlock
        data={attributesData['Time']}
        title='Time'
        color='#f6c3cb'
      ></AttributeBlock>
      <AttributeBlock
        data={attributesData['Template Fields']}
        title='Template Fields'
        color='#d4c0d6'
      ></AttributeBlock>
      <div>
        <div>Filter</div>
        <FilterBlock
          attributeName='Age'
          attributeType='measure'
        ></FilterBlock>
        <div style={{height: 10}}></div>
        <FilterBlock
          attributeName='Region'
          attributeType='dimension'
        ></FilterBlock>
        {/* <RangePicker></RangePicker> */}
        {/* <Input placeholder="Basic usage" style={{width: 500}}></Input> */}
        {/* <Space direction="vertical">
          <DatePicker onChange={onChange} />
        </Space> */}
      </div>
    </div>
  )
}

export default DataView;