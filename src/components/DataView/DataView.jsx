import React from 'react';
import './DataView.less';
import { attributesData } from '../../data/attributes';
import { Upload, Button, DatePicker, Space } from 'antd'
import { UploadOutlined } from '@ant-design/icons';
import AttributeBlock from './AttributeBlock/AttributeBlock';

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
        color='#96ccf6'
      ></AttributeBlock>
      <AttributeBlock
        data={attributesData['Measure']}
        title='Measure'
        color='#60b077'
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
        {/* <RangePicker></RangePicker> */}
        {/* <Input placeholder="Basic usage" style={{width: 500}}></Input> */}
        <Space direction="vertical">
          <DatePicker onChange={onChange} />
        </Space>
      </div>
    </div>
  )
}

export default DataView;