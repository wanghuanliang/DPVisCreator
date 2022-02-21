import React from 'react';
import './index.less';
import DataView from '../components/DataView/DataView';
import ChartsView from '../components/ChartsView/ChartsView';
import url from '../assets/system.png'
import picture from '../assets/system-icon.svg'
import { ReactComponent as Logo } from '../assets/system-icon.svg'
import { ReactComponent as Title } from '../assets/title.svg';
import { ReactComponent as DataViewIcon } from '../assets/data-view-icon.svg';
import { ReactComponent as ChartsViewIcon } from '../assets/charts-view-icon.svg';
import { ReactComponent as ModalViewIcon } from '../assets/modal-view-icon.svg';
import { ReactComponent as ValidationViewIcon } from '../assets/validation-view-icon.svg';

const IndexPage = () => {

  return (
    <>
      {/* <div className='system-title'> */}
        {/* <Logo width='30' height='30' position='10 10' /> */}
        {/* <span><Logo width='30' height='30' position='10 10' /></span> */}
        {/* <img src={picture} alt='logo' width='30' height='30'/> */}
        {/* <img src={url} alt='logo' /> */}
        {/* <span>DPVisCreator</span>
        <span>Imposing Visualization-inspired Prior Constraints to Differential Privacy Data Publishing</span> */}
      {/* </div> */}
      <Title />
      <div className='system-content'>
        <div className='block data-view'>
          <div className='view-title'>
            <DataViewIcon className='view-icon'/>
            Data View
          </div>
          <div style={{width: '100%', height: '4px', backgroundColor: '#e9e9e9'}}></div>
          <DataView></DataView>
        </div>
        <div className='block charts-view'>
          <div className='view-title'>
            <ChartsViewIcon className='view-icon'/>
            Charts View
          </div>
          <div style={{width: '100%', height: '4px', backgroundColor: '#e9e9e9'}}></div>
          {/* <ChartsView></ChartsView> */}
        </div>
        <div className='view-box'>
          <div className='block modal-view'>
            <div className='view-title'>
              <ModalViewIcon className='view-icon'/>
              Modal View
            </div>
            <div style={{width: '100%', height: '4px', backgroundColor: '#e9e9e9'}}></div>
          </div>
          <div className='block validation-view'>
            <div className='view-title'>
              <ValidationViewIcon className='view-icon'/>
              Validation View
            </div>
            <div style={{width: '100%', height: '4px', backgroundColor: '#e9e9e9'}}></div>
          </div>
        </div>
      </div>
    </>
  )
}

export default IndexPage;