import React from 'react';
import './index.less';
import DataView from '../components/DataView/DataView';
import ChartsView from '../components/ChartsView/ChartsView';

const IndexPage = () => {

  return (
    <>
      {/* <ChartsView></ChartsView> */}
      <div className='system-title'>DPVisCreator</div>
      <div className='system-content'>
        <div className='block data-view'>
          <div className='view-title'>Data View</div>
          <DataView></DataView>
        </div>
        <div className='block charts-view'>
          <div className='view-title'>Charts View</div>
          <ChartsView></ChartsView>
        </div>
        <div className='view-box'>
          <div className='block modal-view'>
            <div className='view-title'>Modal View</div>
          </div>
          <div className='block validation-view'>
          <div className='view-title'>Validation View</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default IndexPage;