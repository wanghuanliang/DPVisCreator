import React, { Component } from "react";
import { Col, Row, Space } from "antd";
import ChartDisplay from "./ChartDisplay";
import ConstraintSelect from "./DataChart/ConstraintSelect";
import { chart_constraint, constraint_chart } from "../ChartsView/constants";
import ParameterDisplay from "./DataChart/ParameterDisplay";
export default class ProtectedDataDisplay extends Component {
  constructor(props) {
    super(props);
    this.constraint = {};
    this.state = {
      data: [],
    };
  }
  getData(type, type_data, constraint) {
    const [x, y, computation, color, fitting, chartType, step] = [
      this.props.attribute_character[constraint.x_axis],
      constraint.y_axis
        ? this.props.attribute_character[constraint.y_axis]
        : null,
      constraint.computation,
      constraint.color
        ? this.props.attribute_character[constraint.color]
        : { attribute_type: "Dimensions", values: ["default"] },
      null,
      constraint_chart[constraint.type],
      constraint.x_step,
    ];
    const dataset = [];
    if (computation !== null) {
      const range = [];
      if (isNaN(step)) {
        type_data.forEach((data) => {
          if (!range.includes(data[constraint.x_axis])) {
            range.push(data[constraint.x_axis]);
          }
        });
        if (x.type === "Measures")
          range.push(this.props.attribute_character[constraint.x_axis].max + 1);
        range.sort((a, b) => a - b);
      } else {
        let { min, max } = this.props.attribute_character[constraint.x_axis];
        for (let i = min; i <= max + step; i += step) {
          range.push(i);
        }
      }
      const cart = []; // 笛卡尔积
      range.forEach((value) => {
        color.values.forEach((colorName) => {
          cart.push({
            value,
            color: colorName,
          });
        });
      });
      if (x.type === "Measures") {
        for (let i = 0; i < cart.length - 1; i++) {
          let current = cart[i];
          let next = cart[i + 1];
          let sum = 0;
          const arr = type_data.filter(
            (data) =>
              data[constraint.x_axis] >= current.value &&
              data[constraint.x_axis] < next.value &&
              (current.color === "default" ||
                current.color === data[constraint.color])
          );
          arr.forEach((element) => (sum += element[constraint.y_axis]));
          dataset.push([
            current.value,
            computation === "count"
              ? arr.length
              : sum / (arr.length === 0 ? 1 : arr.length),
            current.color,
            arr.map((element) => element.index),
          ]);
        }
      } else {
        for (let i = 0; i < cart.length; i++) {
          let current = cart[i];
          let sum = 0;
          const arr = type_data.filter(
            (data) =>
              data[constraint.x_axis] === current.value &&
              (current.color === "default" ||
                current.color === data[constraint.color])
          );
          arr.forEach((element) => (sum += element[constraint.y_axis]));
          dataset.push([
            current.value,
            computation === "count"
              ? arr.length
              : sum / (arr.length === 0 ? 1 : arr.length),
            current.color,
            arr.map((element) => element.index),
          ]);
        }
      }
    } else {
      type_data.forEach((data) => {
        if (isNaN(step)) {
          dataset.push([
            data[constraint.x_axis],
            data[constraint.y_axis],
            constraint.color ? data[constraint.color] : "default",
            data.index,
          ]);
        } else {
          dataset.push([
            x.type === "Measures"
              ? data[constraint.x_axis] -
                ((data[constraint.x_axis] -
                  this.props.attribute_character[constraint.x_axis].min) %
                  step)
              : data[constraint.x_axis],
            data[constraint.y_axis],
            constraint.color ? data[constraint.color] : "default",
            data.index,
          ]);
        }
      });
    }
    if (type === "protected") {
      constraint.data.forEach((id) => {
        const index = this.props.original_data.findIndex(
          (data) => data.index === id
        );
        const data = this.props.original_data[index];
        dataset.push([
          data[constraint.x_axis],
          data[constraint.y_axis],
          "selected_original_data",
          data.index,
        ]);
      });
    }
    if (chartType === "line" || chartType === "scatter")
      dataset.sort((a, b) => a[0] - b[0]);
    // 折线图按x值从小到大
    else if (chartType === "bar") dataset.sort((a, b) => b[1] - a[1]); // 条形图按y值从大到小
    if (!isNaN(step) && chartType === "line") {
      constraint.color.values.forEach((value) => {
        dataset.pop();
      });
    }
    this.constraint = constraint;
    this.setState({ data: dataset });
  }
  selectConstraint(type, index) {
    if (type === "original") {
      this.getData(
        type,
        this.props.original_data,
        this.props.constraints[index]
      );
    }
  }
  render() {
    const self = this;
    return (
      <Row gutter={24}>
        <Col span={6}>
          <Space>
            <ConstraintSelect
              constraints={this.props.constraints}
              selectConstraint={(constraint) => {
                self.constraint = constraint;
              }}
            ></ConstraintSelect>
            <ParameterDisplay
              params={self.constraint.params || {}}
            ></ParameterDisplay>
          </Space>
        </Col>
        <Col span={18}>
          <ChartDisplay
            name="protected-chart"
            data={this.state.data}
            attributes={this.props.attributeCharacter || {}}
            constraint={this.constraint}
          ></ChartDisplay>
        </Col>
      </Row>
    );
  }
}
