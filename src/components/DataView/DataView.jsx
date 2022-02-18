import React from 'react';
import './DataView.less';
import { attributesData } from '../../data/attributes';
import { Upload, Button } from 'antd'
import AttributeBlock from './AttributeBlock/AttributeBlock';

const DataView = () => {

  return (
    <div className='data-view-box'>
      <div>
        <Upload>
          <Button>Click to Upload Data</Button>
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
      <div>Filter</div>
    </div>
  )
}

export default DataView;