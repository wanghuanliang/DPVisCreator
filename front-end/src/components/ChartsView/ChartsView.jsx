import React, { Component } from "react";
import { Button, Col, Row, TimePicker } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { attributeCharacter } from "../../data/attributes";
import ChartMenu from "./ChartMenu";
import ChartDisplay from "./ChartDisplay";
import ConstraintSelect from "./Datachart/ConstraintSelect";
const chart_type = ["scatter", "line", "bar"];
const computation_type = ["average", "count"];
const chart_constraint = {
  scatter: "cluster",
  line: "correlation",
  bar: "order",
};
const constraint_chart = {
  cluster: "scatter",
  correlation: "line",
  order: "bar",
};
class ChartsView extends Component {
  constructor(props) {
    super(props);
    this.constraintId = 0;
    this.state = {
      attribute_character: props.data.attribute_character,
      constraints: [],
      original_data: props.data.original_data,
      protected_data: props.data.original_data, // 暂时设为原始值
      original_constraint: {},
      protected_constraint: {},
      original_chart_data: [],
      protected_chart_data: [],
    };
  }
  initConstraint(settings) {
    const constraint = {
      type: chart_constraint[settings.chart_type],
      computation: settings.computation,
      x_axis: this.state.attribute_character[settings.x_axis],
      y_axis: settings.y_axis
        ? this.state.attribute_character[settings.y_axis]
        : null,
      color: settings.color
        ? this.state.attribute_character[settings.color]
        : { type: "Dimensions", value: ["default"] },
    };
    this.getData(this.state.original_data, constraint);
  }
  getData(type_data, constraint) {
    const [x, y, compute, color, fitting, chartType] = [
      this.state.attribute_character[constraint.x_axis],
      this.state.attribute_character[constraint.y_axis],
      constraint.computation,
      this.state.attribute_character[constraint.color],
      null,
      constraint_chart[constraint.type],
    ];
    const dataset = [];
    if (compute != null) {
      const range = [];
      type_data.forEach((data) => {
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
        const arr = type_data.filter(
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
      type_data.forEach((data) => {
        dataset.push([
          data[x.name],
          data[y.name],
          data[color.name] ? data[color.name] : "default",
        ]);
      });
    }
    if (chartType === "line" || chartType === "scatter")
      dataset.sort((a, b) => a[0] - b[0]);
    // 折线图按x值从小到大
    else if (chartType === "bar") dataset.sort((a, b) => b[1] - a[1]); // 条形图按y值从大到小
    return dataset;
  }
  insertConstraint(constraint) {
    const constraints = this.state.constraints;
    constraints.push({ id: "C" + this.constraintId, ...constraint });
    this.constraintId++;
    this.setState({ constraints });
  }
  updateConstraint(constraint) {
    const constraints = this.state.constraints;
    const index = constraints.findIndex((value) => value.id === constraint.id);
    constraints.splice(index, 1);
    constraints.push(constraint);
    constraints.sort(
      (a, b) => parseInt(a.id.substring(1)) - parseInt(b.id.substring(1))
    );
    this.setState({ constraints });
  }
  removeConstraint(constraint) {
    const constraints = this.state.constraints;
    const index = constraints.findIndex((value) => value.id === constraint.id);
    constraints.splice(index, 1);
    this.setState({ constraints });
  }
  selectConstraint(type, index) {
    if (type === "original") {
      this.setState({ original_constraint: this.state.constraints[index] });
    } else if (type === "protected") {
      this.setState({ protected_constraint: this.state.constraints[index] });
    }
  }
  render() {
    return (
      <Row gutter={24}>
        <ChartMenu
          attributes={this.state.attribute_character}
          initConstraint={this.initConstraint}
        ></ChartMenu>
        <Col span={18}>
          <ChartDisplay
            id="original-chart"
            data={this.state.original_chart_data}
            constraint={this.state.original_constraint}
            insertConstraint={this.insertConstraint}
            updateConstraint={this.updateConstraint}
          ></ChartDisplay>
        </Col>
        <Col span={6}>
          <ConstraintSelect
            constraints={this.state.constraints}
            removeConstraint={this.removeConstraint}
            selectConstraint={this.selectConstraint}
          ></ConstraintSelect>
        </Col>
        <Col span={18}>
          <ChartDisplay
            id="protected-chart"
            data={this.state.protected_chart_data}
            constraint={this.state.protected_constraint}
            updateConstraint={this.updateConstraint}
          ></ChartDisplay>
        </Col>
        <Col span={6}>
          <ConstraintSelect
            constraints={this.state.constraints}
            removeConstraint={this.removeConstraint}
            selectConstraint={this.selectConstraint}
          ></ConstraintSelect>
        </Col>
      </Row>
    );
  }
}

export default ChartsView;
