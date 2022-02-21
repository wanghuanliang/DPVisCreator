import React from 'react';
import './AttributeBlock.less';
import { SettingOutlined, FilterFilled, PlusOutlined } from '@ant-design/icons';

const AttributeBlock = (props) => {
  const { data, title, color } = props;

  const num = data.length;

  return (
    <div style={{margin: '5px 0px'}}>
      <div className='attribute-block-title'>
        <span>{`${title} (${num})`}</span>
        <span style={{textDecoration: 'underline', fontSize: 12}}>hide</span>
      </div>
      {
        data.map((attr) => {
          return (
            <div className='attribute-block-line' style={{ backgroundColor: color}} key={attr}>
              <span>
                <span style={{ padding: '0px 5px' }}><SettingOutlined /></span>
                <span style={{ padding: '0px 5px' }}>{attr}</span>
              </span>
              <span>
                <span style={{ padding: '0px 5px' }}><FilterFilled /></span>
                <span style={{ padding: '0px 5px' }}><PlusOutlined /></span>
              </span>
            </div>
          )
        })
      }
    </div>
  )
}

export default AttributeBlock;