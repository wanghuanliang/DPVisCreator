import React, { useState} from 'react';
import './DataView.less';
// import { attributesData } from '../../data/attributes';
import { Upload, Button, DatePicker, Space } from 'antd'
import { UploadOutlined } from '@ant-design/icons';
import AttributeBlock from './AttributeBlock/AttributeBlock';
import FilterBlock from './FilterBlock/FilterBlock';
import { session } from '../../services/api';

const colorArray = ['#d0ddfa', '#d4f2e5', '#f6c3cb'];

const DataView = (props) => {

  const {
    originalData,
    setOriginalData,
    attributeData,
    setAttributeData,
    attributeCharacter,
    setAttributeCharacter,
    filterData,
    setFilterData,
  } = props;

  const prop = {
    action: 'http://101.43.188.187:30010/api/getOriginalData',
    data: { session_id: session },
    maxCount: 1,
    onChange({ file, fileList }) {
      if (file.status === 'done') {
        // console.log(file.response.data);
        const data = file.response.data;
        setOriginalData(data.original_data);
        setAttributeData(data.attribute_data);
        setAttributeCharacter(data.attribute_character);
      }
    },
    defaultFileList: [
      {
        uid: '1',
        name: 'insurance.csv',
        status: 'done',
        response: 'Server Error 500', // custom error message to show
      },
    ],
    showUploadList: {
      showRemoveIcon: false,
    }
  };

  return (
    <>
      <div className='data-view-box'>
        <div className='upload-box'>
          <div style={{fontWeight: 'bold', marginBottom: '0.5em'}}>Select data</div>
          <Upload {...prop}>
            <Button icon={<UploadOutlined />} size='small'>Change</Button>
          </Upload>
        </div>
        {
          attributeData && Object.keys(attributeData).map((type, index) => {
            return (
              <AttributeBlock
                key={type}
                originalData={originalData}
                data={attributeData[type]}
                title={type}
                attributeType={String(index)}
                color={colorArray[index]}
                filterData={filterData}
                setFilterData={setFilterData}
              ></AttributeBlock>
            )
          })
        }
        <div>
          {filterData && Object.keys(filterData).length !== 0 && <div>Filter</div>}
          {
            Object.keys(filterData).map((attribute, index) => {
              return (
                <FilterBlock
                  key={attribute}
                  attributeCharacter={attributeCharacter}
                  attribute={attribute}
                  filterData={filterData}
                  setFilterData={setFilterData}
                ></FilterBlock>
              )
            })
          }
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', margin: 10 }}>
        <Button style={{width: 250}} size='large'>Confirm</Button>
      </div>
    </>
    
  );
};

export default DataView;