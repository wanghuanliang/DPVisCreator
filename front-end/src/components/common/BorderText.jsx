import React from 'react';

const patternColor = {
  original: '#dedede',
  cluster: '#9cb0a2',
  correlation: '#c39b83',
  order: '#bbafd1',
  others: '#ccc'
}

const BorderText = (props) => {
  const {
    text,
    type,
    selected,
    handleClick,
  } = props;

  const color = patternColor?.[type];

  return <div
    style={{
      textAlign: 'center',
      color: selected ? '#fff' : color,
      backgroundColor: selected ? color : '#fff',
      border: `1px solid ${color}`,
      borderRadius: '3px',
      width: 50,
      cursor: 'pointer',
      // height: 20,
      // lineHeight: 20,
    }}
    onClick={handleClick}
  >{text}</div>
}

export default BorderText;