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
  } = props;

  const color = patternColor?.[type];

  return <div
    style={{
      textAlign: 'center',
      color: color,
      border: `1px solid ${color}`,
      borderRadius: '3px',
      width: 50,
      // height: 20,
      // lineHeight: 20,
    }}
  >{text}</div>
}

export default BorderText;