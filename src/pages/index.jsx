import React from 'react';
import './index.less';

const IndexPage = () => {

  return (
    <div className='system' >
      <div className='system-title' style={{width: 15}}>DPVisCreator</div>
      <div className='system-content' style={{content: 'flex'}}>
        <div className='data-view'>Data View</div>
        <div className='charts-view'>Charts View</div>
        <div className='modal-view'>Modal View</div>
        <div className='validation-view'>Validation View</div>
      </div>
    </div>
  )
}

export default IndexPage;