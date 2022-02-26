import React, { useState} from 'react';
import './DataView.less';
// import { attributesData } from '../../data/attributes';
import { Upload, Button, DatePicker, Space } from 'antd'
import { UploadOutlined } from '@ant-design/icons';
import AttributeBlock from './AttributeBlock/AttributeBlock';
import FilterBlock from './FilterBlock/FilterBlock';

const colorArray = ['#d0ddfa', '#d4f2e5', '#f6c3cb'];

const DataView = (props) => {

  const {
    originalData,
    attributeData,
    attributeCharacter,
    filterData,
    setFilterData,
  } = props;

  const prop = {
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange({ file, fileList }) {
      if (file.status !== 'uploading') {
        console.log(file, fileList);
      }
    },
    defaultFileList: [
      {
        uid: '1',
        name: 'xxx.csv',
        status: 'done',
        response: 'Server Error 500', // custom error message to show
        url: 'http://www.baidu.com/xxx.png',
      },
      // {
      //   uid: '2',
      //   name: 'yyy.png',
      //   status: 'done',
      //   url: 'http://www.baidu.com/yyy.png',
      // },
      // {
      //   uid: '3',
      //   name: 'zzz.png',
      //   status: 'error',
      //   response: 'Server Error 500', // custom error message to show
      //   url: 'http://www.baidu.com/zzz.png',
      // },
    ],
  };

  return (
    <div className='data-view-box'>
      <div>
        <div>Upload Data</div>
        <Upload {...prop}>
          <Button icon={<UploadOutlined />} size='small'>select file</Button>
        </Upload>
      </div>
      {
        Object.keys(attributeData).map((type, index) => {
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
      {/* <AttributeBlock
        originalData={originalData}
        data={attributesData['Dimensions']}
        title='Dimensions'
        attributeType='0'
        color='#d0ddfa'
        filterData={filterData}
        setFilterData={setFilterData}
      ></AttributeBlock>
      <AttributeBlock
        originalData={originalData}
        data={attributesData['Measures']}
        title='Measures'
        attributeType='1'
        color='#d4f2e5'
        filterData={filterData}
        setFilterData={setFilterData}
      ></AttributeBlock>
      <AttributeBlock
        originalData={originalData}
        data={attributesData['Computation']}
        title='Computation'
        attributeType='2'
        color='#f6c3cb'
        filterData={filterData}
        setFilterData={setFilterData}
      ></AttributeBlock> */}
      <div>
        <div>Filter</div>
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
  );
};

export default DataView;