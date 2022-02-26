import React, { useState} from 'react';
import './DataView.less';
import { attributesData } from '../../data/attributes';
import { Upload, Button, DatePicker, Space } from 'antd'
import { UploadOutlined } from '@ant-design/icons';
import AttributeBlock from './AttributeBlock/AttributeBlock';
import FilterBlock from './FilterBlock/FilterBlock';

const defaultFilterSet = [];

const DataView = (props) => {

  const { originalData, filterData, setFilterData } = props;
  console.log('fff', filterData);

  // filter窗口
  const [filterSet, setFilterSet] = useState(defaultFilterSet);
  const changeFilterSet = (opera, attr) => {
    console.log('father', opera,attr);
    if (opera === 'open') {
      setFilterSet([...filterSet, attr]);
    } else if (opera === 'close') {
      // 数组/对象中移除一项,并赋值为新数组/对象
      let newFilterSet = filterSet.filter(value => value !== attr);
      setFilterSet(newFilterSet);
    }
  }

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
      <AttributeBlock
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
      ></AttributeBlock>
      <div>
        <div>Filter</div>
        {
          Object.keys(filterData).map((attribute, index) => {
            return (
              <FilterBlock
                key={attribute}
                attribute={attribute}
                filterData={filterData}
                setFilterData={setFilterData}
              ></FilterBlock>
            )
          })
        }
        {/* {
          filterSet.map((attr) => {
            console.log(filterSet);
            return (
              <FilterBlock
                key={attr}
                attributeName={attr}
                changeFilterSet={changeFilterSet}
              ></FilterBlock>
            )
          })
        } */}
      </div>
    </div>
  );
};

export default DataView;