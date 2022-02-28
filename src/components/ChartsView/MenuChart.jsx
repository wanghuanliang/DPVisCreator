import { Component } from "react";
import { Col, Form, Input, Row, Select, Tag } from "antd";
import {
  BarsOutlined,
  BgColorsOutlined,
  DotChartOutlined,
} from "@ant-design/icons";
import DataChart from "./DataChart";
import { attributeType } from "../../data/attributes";

const { Option } = Select;
const chartLabels = {
  scatter: "Scatter Plot",
  line: "Line Chart",
  bar: "Bar Chart",
};

export default class MenuChart extends Component {
  constructor(props) {
    super(props);
    this.chartTypes = this.props.avaliable;
    this.state = {
      columnIndex: -1,
      rowIndex: -1,
      colorIndex: -1,
      typeIndex: -1,
    };
  }
  renderDataChart() {
    if (
      this.state.columnIndex >= 0 &&
      this.state.rowIndex >= 0 &&
      this.state.colorIndex >= 0 &&
      this.state.typeIndex >= 0
    ) {
      const attributes = this.getAttributes();
      const data = this.getData();
      return (
        <DataChart
          attributes={attributes}
          data={data}
          type={this.chartTypes[this.state.typeIndex]}
          id={"data-" + this.props.id}
        ></DataChart>
      );
    } else return <div style={{ height: 300 }}></div>;
  }
  getAttributes() {
    return [
      this.props.attributes[this.state.columnIndex],
      this.props.attributes[this.state.rowIndex],
      this.props.attributes[this.state.colorIndex],
    ];
  }
  getData() {
    const [x, y, color] = [
      this.props.attributes[this.state.columnIndex],
      this.props.attributes[this.state.rowIndex],
      this.props.attributes[this.state.colorIndex],
    ];
    const data = this.props.dataset.map((data) => {
      if ("Dimensions" !== attributeType[color.attributeType])
        throw Error("color should be dimensions");
      return [
        "Dimensions" === attributeType[x.attributeType]
          ? x.value.indexOf(data[x.name])
          : data[x.name],
        "Dimensions" === attributeType[y.attributeType]
          ? y.value.indexOf(data[y.name])
          : data[y.name],
        data[color.name],
      ];
    });
    data.sort((a, b) => a[0] - b[0]);
    return data;
  }
  render() {
    let self = this;
    function getColorSelect() {
      let select = [];
      self.props.attributes.forEach((attribute, index) => {
        if ("Dimensions" === attributeType[attribute.attributeType])
          select.push({ attribute, index });
      });
      return select;
    }
    function getSelectByIndex(index) {
      if (
        self.state.typeIndex >= 0 && // type should be selected
        self.props.avaliable[self.state.typeIndex] !== "scatter" && // not a scatter chart
        index >= 0 &&
        "Measures" === attributeType[self.props.attributes[index].attributeType]
      )
        return getColorSelect();
      else
        return self.props.attributes.map((attribute, index) => {
          return { attribute, index };
        });
    }
    function getRowSelect() {
      return getSelectByIndex(self.state.columnIndex); // if column is continous, row should be discrete
    }
    function getColumnSelect() {
      return getSelectByIndex(self.state.rowIndex); // if row is continous, column should be discrete
    }
    function getAvaliableCharts() {
      if (
        self.state.rowIndex >= 0 &&
        "Measures" ===
          attributeType[
            self.props.attributes[self.state.rowIndex].attributeType
          ] &&
        self.state.columnIndex >= 0 &&
        "Measures" ===
          attributeType[
            self.props.attributes[self.state.columnIndex].attributeType
          ]
      )
        // one of axis is continuous, only scatter is avaliable
        for (let index in self.chartTypes) {
          if (self.chartTypes[index] === "scatter")
            return [{ type: "scatter", index }];
        }
      else
        return self.chartTypes.map((type, index) => {
          return { type, index };
        });
    }
    return (
      <Row gutter={24}>
        <Col span={12}>
          <BarsOutlined rotate={90} />
          Column
          <Select
            placeholder="Select column"
            onChange={(value) => {
              self.setState({ columnIndex: value });
            }}
          >
            {getColumnSelect().map((select) => (
              <Option value={select.index} key={"column" + select.index}>
                {select.attribute.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={12}>
          <BarsOutlined />
          Row
          <Select
            placeholder="Select row"
            onChange={(value) => {
              self.setState({ rowIndex: value });
            }}
          >
            {getRowSelect().map((select) => (
              <Option value={select.index} key={"row" + select.index}>
                {select.attribute.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={12}>
          <BgColorsOutlined />
          Color
          <Select
            placeholder="Select color"
            onChange={(value) => {
              self.setState({ colorIndex: value });
            }}
          >
            {getColorSelect().map((select) => (
              <Option value={select.index} key={"color" + select.index}>
                {select.attribute.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={12}>
          <DotChartOutlined />
          Type
          <Select
            placeholder="Select type"
            onChange={(value) => {
              self.setState({ typeIndex: value });
            }}
          >
            {getAvaliableCharts().map((chart) => (
              <Option value={chart.index} key={"chart-type-" + chart.index}>
                {chartLabels[chart.type]}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={24}>{this.renderDataChart()}</Col>
      </Row>
    );
  }
}
