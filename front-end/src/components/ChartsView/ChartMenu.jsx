import { Component } from "react";
import {
  Button,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Statistic,
  Tag,
} from "antd";
import {
  BarsOutlined,
  BgColorsOutlined,
  DotChartOutlined,
  FunctionOutlined,
} from "@ant-design/icons";
import { chart_type, computation_type } from "./constants";
import Title from "antd/lib/typography/Title";
import { getModelData } from "../../services/api";
// 布局变成右侧缩略图
const { Option } = Select;
const chartLabels = {
  scatter: "Scatter Plot",
  line: "Line Chart",
  bar: "Bar Chart",
};
const chartFitnesses = [
  ["Normal", "Beta"],
  [1, 2, 3, 4, 5],
  ["Normal", "Beta"],
];
const chartFittingMap = {
  cluster: ["Normal", "Beta"],
  correlation: [1, 2, 3, 4, 5],
  order: ["Normal", "Beta"],
};
export default class ChartMenu extends Component {
  constructor(props) {
    super(props);
    this.initConstraint = props.initConstraint;
    this.saveConstraint = props.saveConstraint;
    this.removeConstraint = props.removeConstraint;
    this.updateConstraintParams = props.updateConstraintParams;
    this.state = {
      columnIndex: -1,
      rowTagIndex: -1,
      rowComputeIndex: 0,
      colorIndex: -1,
      typeIndex: -1,
      step: NaN,
    };
  }
  checkState() {
    if (
      this.state.columnIndex >= 0 &&
      this.state.typeIndex >= 0 &&
      ((chart_type[this.state.typeIndex] === "scatter" &&
        this.state.rowTagIndex >= 0) ||
        (this.state.rowTagIndex >= 0 && this.state.rowComputeIndex >= 0) ||
        this.state.rowComputeIndex === 0)
    ) {
      const settings = this.getSettings();
      this.initConstraint(settings);
    }
  }
  getSettings() {
    const attributes = Object.keys(this.props.attributes);
    return {
      color:
        this.state.colorIndex >= 0 ? attributes[this.state.colorIndex] : null,
      chart_type: chart_type[this.state.typeIndex],
      x_axis: attributes[this.state.columnIndex],
      y_axis:
        this.state.rowTagIndex >= 0 ? attributes[this.state.rowTagIndex] : null,
      computation:
        this.state.rowComputeIndex >= 0
          ? computation_type[this.state.rowComputeIndex]
          : null,
      x_step: this.state.step,
      fitting: this.state.typeIndex === 1 ? 3 : "Normal",
    };
  }
  render() {
    let self = this;
    const attributes = Object.keys(this.props.attributes);
    function getSpecificTypeOfAttributes(type) {
      let select = [];
      if (type === "all") {
        attributes.forEach((attributeName, index) => {
          const attribute = self.props.attributes[attributeName];
          select.push({ attribute, name: attributeName, index });
        });
      } else
        attributes.forEach((attributeName, index) => {
          const attribute = self.props.attributes[attributeName];
          if (type === attribute.attribute_type)
            select.push({ attribute, name: attributeName, index });
        });
      return select;
    }
    function getColorSelect() {
      // if (self && chart_type[self.state.typeIndex] === "bar") return [];
      const attributes = getSpecificTypeOfAttributes("Dimensions");
      return attributes;
    }
    function getRowTagSelect() {
      return getSpecificTypeOfAttributes("Measures");
    }
    function getColumnSelect() {
      if (self && chart_type[self.state.typeIndex] === "bar")
        return getSpecificTypeOfAttributes("all");
      return getSpecificTypeOfAttributes("Measures");
    }
    function getRowComputeSelect() {
      return computation_type.map((computation, index) => {
        return { attribute: computation, index };
      });
    }
    function changeStep(value) {
      self.setState({ step: value }, self.checkState);
    }
    function getXAxisElements() {
      return (
        <Row>
          <Col span={12} className="menu-item-content-menu-label">
            Value
          </Col>
          <Col span={12}>
            <Select
              value={self.state.columnIndex < 0 ? null : self.state.columnIndex}
              size="small"
              placeholder="x-axis"
              onChange={(value) => {
                self.setState(
                  { columnIndex: value, step: NaN },
                  self.checkState
                );
              }}
              disabled={self.state.typeIndex < 0 ? true : false}
            >
              {getColumnSelect().map((select) => (
                <Option value={select.index} key={"row" + select.index}>
                  {select.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={12} className="menu-item-content-menu-label">
            Step
          </Col>
          <Col span={12}>
            <InputNumber
              value={isNaN(self.state.step) ? null : self.state.step}
              min={1}
              onChange={changeStep}
              size="small"
              disabled={
                self.state.columnIndex < 0 ||
                self.props.attributes[attributes[self.state.columnIndex]]
                  .attribute_type === "Dimensions"
                  ? true
                  : false
              }
            />
          </Col>
        </Row>
      );
    }
    function getYAxisElements() {
      return (
        <Row>
          <Col span={12} className="menu-item-content-menu-label">
            Value
          </Col>
          <Col span={12}>
            <Select
              value={self.state.rowTagIndex < 0 ? null : self.state.rowTagIndex}
              size="small"
              placeholder="y-axis"
              onChange={(value) => {
                self.setState({ rowTagIndex: value }, self.checkState);
              }}
              disabled={
                self.state.typeIndex < 0 || self.state.rowComputeIndex === 0
                  ? true
                  : false
              }
            >
              {getRowTagSelect().map((select) => (
                <Option value={select.index} key={"row" + select.index}>
                  {select.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={12} className="menu-item-content-menu-label">
            Computation
          </Col>
          <Col span={12}>
            <Select
              size="small"
              placeholder="computation"
              value={
                self.state.rowComputeIndex < 0
                  ? null
                  : self.state.rowComputeIndex
              }
              onChange={(value) => {
                self.setState({ rowComputeIndex: value }, self.checkState);
              }}
              disabled={
                self.state.typeIndex < 0 ||
                chart_type[self.state.typeIndex] === "scatter"
                  ? true
                  : false
              }
            >
              {getRowComputeSelect().map((select) => (
                <Option value={select.index} key={"computation" + select.index}>
                  {select.attribute}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      );
    }
    function getAvaliableCharts() {
      return chart_type.map((type, index) => {
        return { type, index };
      });
    }
    return (
      <>
        <Col span={18}>
          <Title level={5}>Chart settings</Title>
        </Col>
        <Col span={6} style={{ marginTop: 3 }}>
          <Button size="small" block>
            Recommend
          </Button>
        </Col>
        <Col span={12}>
          <Row>
            <Col span={8} className="menu-item-label">
              <div className="menu-item-label-1">
                <DotChartOutlined />
                Type
              </div>
            </Col>
            <Col span={16} className="menu-item-content">
              <Select
                size="small"
                placeholder="Select type"
                value={self.state.typeIndex < 0 ? null : self.state.typeIndex}
                onChange={(value) => {
                  let state = { typeIndex: value, step: NaN };
                  if (chart_type[value] === "scatter")
                    state.rowComputeIndex = -1;
                  else state.rowComputeIndex = 0;
                  if (chart_type[value] === "bar") state.colorIndex = -1;
                  self.setState(state, self.checkState);
                }}
              >
                {getAvaliableCharts().map((chart) => (
                  <Option value={chart.index} key={"chart-type-" + chart.index}>
                    {chartLabels[chart.type]}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={8} className="menu-item-label">
              <div className="menu-item-label-2">
                <BarsOutlined rotate={90} />
                X-axis
              </div>
            </Col>
            <Col span={16} className="menu-item-content">
              {getXAxisElements()}
            </Col>
          </Row>
        </Col>
        <Col span={12}>
          <Row>
            <Col span={8} className="menu-item-label">
              <div className="menu-item-label-1">
                <BgColorsOutlined />
                Color
              </div>
            </Col>
            <Col span={16} className="menu-item-content">
              <Select
                value={self.state.colorIndex < 0 ? null : self.state.colorIndex}
                allowClear
                onClear={() => {
                  self.setState({ colorIndex: -1 }, self.checkState);
                }}
                size="small"
                placeholder="Select color"
                onChange={(value) => {
                  self.setState({ colorIndex: value }, self.checkState);
                }}
                // disabled={
                //   self.state.typeIndex < 0 ||
                //   chart_type[self.state.typeIndex] === "bar"
                //     ? true
                //     : false
                // }
              >
                {getColorSelect().map((select) => (
                  <Option value={select.index} key={"color" + select.index}>
                    {select.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={8} className="menu-item-label">
              <div className="menu-item-label-2">
                <BarsOutlined />
                Y-axis
              </div>
            </Col>
            <Col span={16} className="menu-item-content">
              {getYAxisElements()}
            </Col>
          </Row>
        </Col>
      </>
    );
  }
}
