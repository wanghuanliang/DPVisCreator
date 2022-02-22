import { Component } from "react";
import { Col, Form, Input, Row, Select, Tag } from "antd";
import {
  BarsOutlined,
  BgColorsOutlined,
  DotChartOutlined,
} from "@ant-design/icons";
import DataChart from "./DataChart";
import { AttributeType } from "random-mock";

const { Option } = Select;
export default class MenuChart extends Component {
  constructor(props) {
    super(props);
    this.chartTypes = ["scatter", "line", "bar"];
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
    return this.props.dataset.map((data) => {
      const [x, y, color] = [
        this.props.attributes[this.state.columnIndex],
        this.props.attributes[this.state.rowIndex],
        this.props.attributes[this.state.colorIndex],
      ];
      if (color.type !== AttributeType.Discrete)
        throw Error("color should be dimensions");
      return [
        x.type === AttributeType.Discrete
          ? x.distribution.range.indexOf(data[x.name])
          : data[x.name],
        y.type === AttributeType.Discrete
          ? y.distribution.range.indexOf(data[y.name])
          : data[y.name],
        data[color.name],
      ];
    });
  }
  render() {
    let self = this;
    function getColorSelect() {
      let select = [];
      self.props.attributes.forEach((attribute, index) => {
        if (attribute.type === AttributeType.Discrete)
          select.push({ attribute, index });
      });
      return select;
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
            {this.props.attributes.map((attribute, index) => (
              <Option value={index} key={"column" + index}>
                {attribute.name}
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
            {this.props.attributes.map((attribute, index) => (
              <Option value={index} key={"row" + index}>
                {attribute.name}
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
            <Option value={0} key={"type0"}>
              Scatter Plot
            </Option>
          </Select>
        </Col>
        <Col span={24}>{this.renderDataChart()}</Col>
      </Row>
    );
  }
}
