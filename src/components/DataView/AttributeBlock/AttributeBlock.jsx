import React from 'react';
import './AttributeBlock.less';

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
            <div style={{backgroundColor: color, margin: '5px 0px', fontSize: 14}} key={attr}>
              <span>{attr}</span>
            </div>
          )
        })
      }
    </div>
  )
}

export default AttributeBlock;