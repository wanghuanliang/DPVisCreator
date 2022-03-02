import { Component } from "react";
import { Col, Form, Input, Row, Select, Statistic, Tag } from "antd";
import {
  BarsOutlined,
  BgColorsOutlined,
  DotChartOutlined,
  FunctionOutlined,
} from "@ant-design/icons";
import DataChart from "./DataChart";
import { attributeType } from "../../data/attributes";

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
export default class MenuChart extends Component {
  constructor(props) {
    super(props);
    this.chartTypes = this.props.avaliable;
    this.computation = this.props.computation;
    this.state = {
      columnIndex: -1,
      rowTagIndex: -1,
      rowComputeIndex: -1,
      colorIndex: -1,
      typeIndex: -1,
      fitIndex: -1,
    };
  }
  onSelected(selected) {}
  renderDataChart() {
    if (
      this.state.columnIndex >= 0 &&
      this.state.typeIndex >= 0 &&
      ((this.chartTypes[this.state.typeIndex] === "scatter" &&
        this.state.rowTagIndex >= 0) ||
        (this.state.rowTagIndex >= 0 && this.state.rowComputeIndex >= 0))
    ) {
      const attributes = this.getAttributes();
      const data = this.getData();
      return (
        <DataChart
          attributes={attributes}
          data={data}
          type={this.chartTypes[this.state.typeIndex]}
          id={"data-" + this.props.id}
          fit={
            this.state.fitIndex >= 0
              ? chartFitnesses[this.state.typeIndex][this.state.fitIndex]
              : undefined
          }
          onSelected={this.onSelected}
        ></DataChart>
      );
    } else return <div style={{ height: 300 }}></div>;
  }
  getAttributes() {
    return [
      this.props.attributes[this.state.columnIndex],
      this.state.rowTagIndex >= 0
        ? this.props.attributes[this.state.rowTagIndex]
        : null,
      this.state.colorIndex >= 0
        ? this.props.attributes[this.state.colorIndex]
        : { attributeType: "0", value: ["default"] },
      this.state.fitIndex >= 0
        ? this.props.attributes[this.state.fitIndex]
        : null,
    ];
  }
  getData() {
    const [x, y, compute, color, fit] = [
      this.props.attributes[this.state.columnIndex],
      this.state.rowTagIndex >= 0
        ? this.props.attributes[this.state.rowTagIndex]
        : null,
      this.state.rowComputeIndex >= 0
        ? this.computation[this.state.rowComputeIndex]
        : null,
      this.state.colorIndex >= 0
        ? this.props.attributes[this.state.colorIndex]
        : { attributeType: "0", value: ["default"] },
      this.state.fitIndex >= 0
        ? this.props.attributes[this.state.fitIndex]
        : null,
    ];
    const dataset = [];
    if (compute != null) {
      const range = [];
      this.props.dataset.forEach((data) => {
        if (!range.includes(data[x.name])) {
          range.push(data[x.name]);
        }
      });
      const cart = []; // 笛卡尔积
      range.forEach((value) => {
        color.value.forEach((colorName) => {
          cart.push({
            value,
            color: colorName,
          });
        });
      });
      cart.forEach((condition) => {
        let sum = 0;
        const arr = this.props.dataset.filter(
          (data) =>
            data[x.name] === condition.value &&
            (condition.color === "default" ||
              condition.color === data[color.name])
        );
        arr.forEach((element) => (sum += element[y.name]));
        dataset.push([
          condition.value,
          compute === "count"
            ? arr.length
            : sum / (arr.length === 0 ? 1 : arr.length),
          condition.color,
        ]);
      });
    } else {
      this.props.dataset.forEach((data) => {
        dataset.push([
          data[x.name],
          data[y.name],
          data[color.name] ? data[color.name] : "default",
        ]);
      });
    }
    if (this.chartTypes[this.state.typeIndex] === "line")
      dataset.sort((a, b) => a[0] - b[0]);
    // 折线图按x值从小到大
    else if (this.chartTypes[this.state.typeIndex] === "bar")
      dataset.sort((a, b) => b[1] - a[1]); // 条形图按y值从大到小
    return dataset;
  }
  render() {
    let self = this;
    function getSpecificTypeOfAttributes(type) {
      let select = [];
      self.props.attributes.forEach((attribute, index) => {
        if (type === attributeType[attribute.attributeType])
          select.push({ attribute, index });
      });
      return select;
    }
    function getColorSelect() {
      return getSpecificTypeOfAttributes("Dimensions");
    }
    function getRowTagSelect() {
      return getSpecificTypeOfAttributes("Measures");
    }
    function getColumnSelect() {
      return getSpecificTypeOfAttributes("Measures");
    }
    function getRowComputeSelect() {
      return self.computation.map((computation, index) => {
        return { attribute: computation, index };
      });
    }
    function getRowSelectElements() {
      return self.chartTypes[self.state.typeIndex] === "scatter" ? (
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
          Fit
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
        <Col span={24}>{this.renderDataChart()}</Col>
      </Row>
    );
  }
}
