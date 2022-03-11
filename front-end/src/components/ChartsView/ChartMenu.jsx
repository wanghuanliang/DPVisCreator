import { Component } from "react";
import { Col, Form, Input, Row, Select, Statistic, Tag } from "antd";
import {
  BarsOutlined,
  BgColorsOutlined,
  DotChartOutlined,
  FunctionOutlined,
} from "@ant-design/icons";
import DataChart from "./OriginalDataChart";
import { attributeType } from "../../data/attributes";
import { chart_type, computation_type } from "./constants";
// 布局变成右侧缩略图
const { Option } = Select;
const chartLabels = {
  scatter: "Scatter Plot",
  line: "Line Chart",
  bar: "Bar Chart",
};
const computations = {
  count: "Count",
  average: "Average",
};
const chartFitnesses = [
  ["Normal", "Beta"],
  [1, 2, 3, 4, 5],
  ["Normal", "Beta"],
];
export default class ChartMenu extends Component {
  constructor(props) {
    super(props);
    this.initConstraint = props.initConstraint;
    this.attributes = Object.keys(props.attributes);
    this.state = {
      columnIndex: -1,
      rowTagIndex: -1,
      rowComputeIndex: -1,
      colorIndex: -1,
      typeIndex: -1,
      fitIndex: -1,
    };
  }
  componentDidUpdate() {
    if (
      this.state.columnIndex >= 0 &&
      this.state.typeIndex >= 0 &&
      ((this.chartTypes[this.state.typeIndex] === "scatter" &&
        this.state.rowTagIndex >= 0) ||
        (this.state.rowTagIndex >= 0 && this.state.rowComputeIndex >= 0))
    ) {
      const settings = this.getSettings();
      this.initConstraint(settings);
    }
  }
  getSettings() {
    return {
      x_axis: this.attributes[this.state.columnIndex],
      y_axis:
        this.state.rowTagIndex >= 0
          ? this.attributes[this.state.rowTagIndex]
          : null,
      computation:
        this.state.rowComputeIndex >= 0
          ? computation_type[this.state.rowComputeIndex]
          : null,
      color:
        this.state.colorIndex >= 0
          ? this.attributes[this.state.colorIndex]
          : null,
      chart_type: chart_type[this.state.typeIndex],
      fitting:
        this.state.fitIndex >= 0
          ? chartFitnesses[this.state.typeIndex][this.state.fitIndex]
          : null,
    };
  }
  render() {
    let self = this;
    function getSpecificTypeOfAttributes(type) {
      let select = [];
      self.attributes.forEach((attributeName, index) => {
        const attribute = self.props.attributes[attributeName];
        if (type === attribute.type) select.push({ attribute, index });
      });
      return select;
    }
    function getColorSelect() {
      if (self && chart_type[self.state.typeIndex] === "bar") return [];
      return getSpecificTypeOfAttributes("Dimensions");
    }
    function getRowTagSelect() {
      return getSpecificTypeOfAttributes("Measures");
    }
    function getColumnSelect() {
      if (self && chart_type[self.state.typeIndex] === "bar")
        return getSpecificTypeOfAttributes("Dimensions");
      return getSpecificTypeOfAttributes("Measures");
    }
    function getRowComputeSelect() {
      return computation_type.map((computation, index) => {
        return { attribute: computation, index };
      });
    }
    function getRowSelectElements() {
      return chart_type[self.state.typeIndex] === "scatter" ? (
        <Col span={12}>
          <BarsOutlined />
          Row
          <Select
            placeholder="Select row"
            onChange={(value) => {
              self.setState({ rowTagIndex: value });
            }}
          >
            {getRowTagSelect().map((select) => (
              <Option value={select.index} key={"row" + select.index}>
                {select.attribute.name}
              </Option>
            ))}
          </Select>
        </Col>
      ) : (
        <Col span={12}>
          <BarsOutlined />
          Row
          <Select
            placeholder="Select computation"
            onChange={(value) => {
              self.setState({ rowComputeIndex: value });
            }}
          >
            {getRowComputeSelect().map((select) => (
              <Option value={select.index} key={"computation" + select.index}>
                {select.attribute}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Select row"
            onChange={(value) => {
              self.setState({ rowTagIndex: value });
            }}
          >
            {getRowTagSelect().map((select) => (
              <Option value={select.index} key={"row" + select.index}>
                {select.attribute.name}
              </Option>
            ))}
          </Select>
        </Col>
      );
    }
    function getAvaliableCharts() {
      return self.chartTypes.map((type, index) => {
        return { type, index };
      });
    }
    function getChartFitnesses() {
      if (self.state.typeIndex >= 0)
        return chartFitnesses[self.state.typeIndex].map((type, index) => {
          return { type, index };
        });
      else return [];
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
        {getRowSelectElements()}
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
              let state = { typeIndex: value };
              if (self.chartTypes[value] === "scatter")
                state.rowComputeIndex = -1;
              if (self.chartTypes[value] === "bar") state.colorIndex = -1;
              self.setState(state);
            }}
          >
            {getAvaliableCharts().map((chart) => (
              <Option value={chart.index} key={"chart-type-" + chart.index}>
                {chartLabels[chart.type]}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={12}>
          <FunctionOutlined />
          Fitting
          <Select
            placeholder="Fit by"
            onChange={(value) => {
              self.setState({ fitIndex: value });
            }}
          >
            {getChartFitnesses().map((fit) => (
              <Option value={fit.index} key={"chart-fit-" + fit.index}>
                {fit.type}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={12}>
          <Statistic title="Points" value={this.props.dataset.length} />
        </Col>
      </Row>
    );
  }
}
