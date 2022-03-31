import React from 'react';
import './AttributeBlock.less';
import AttributeLine from './AttributeLine';

const AttributeBlock = (props) => {
  const {
    originalData,
    data,
    title,
    attributeType,
    color,
    filterData,
    setFilterData,
    attributeCharacter,
    drops,
    setDrops,
  } = props;
  
  const num = data.length;

  return (
    <div style={{margin: '5px 0px 20px 0px'}}>
      {title !== 'Computations' && <div className='attribute-block-title'>
        <span>{`${title} (${num})`}</span>
      </div>}
      {
        data.map((attr) => {
          return (
            <AttributeLine
              originalData={originalData}
              key={attr}
              attribute={attr}
              attributeType={attributeType}
              color={color}
              filterData={filterData}
              setFilterData={setFilterData}
              attributeCharacter={attributeCharacter}
              drops={drops}
              setDrops={setDrops}
            ></AttributeLine>
          )
        })
      }
    </div>
  )
}

export default AttributeBlock;