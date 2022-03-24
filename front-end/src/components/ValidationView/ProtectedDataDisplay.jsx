import React, { Component } from "react";
import { Col, Row, Space } from "antd";
import ChartDisplay from "./ChartDisplay";
import ConstraintSelect from "./DataChart/ConstraintSelect";
import { chart_constraint, constraint_chart } from "../ChartsView/constants";
import ParameterDisplay from "./DataChart/ParameterDisplay";
export default class ProtectedDataDisplay extends Component {
  constructor(props) {
    super(props);
    this.original_chart_data = [];
    this.protected_chart_data = [];
    this.state = {
      constraint: {},
    };
  }
  getSnapshotBeforeUpdate(prevProps, prevState) {
    if (prevProps.defaultConstraint !== this.props.defaultConstraint) {
      this.setState({ constraint: this.props.defaultConstraint });
    }
    return null;
  }
  getData(type_data, constraint) {
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
        if (x.attribute_type === "Measures")
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
      if (x.attribute_type === "Measures") {
        const colors = color.values.length;
        for (let i = 0; i < cart.length - colors; i++) {
          let current = cart[i];
          let next = cart[i + colors];
          let sum = 0;
          const arr = type_data.filter(
            (data) =>
              data[constraint.x_axis] >= current.value &&
              data[constraint.x_axis] < next.value &&
              (current.color === "default" ||
                current.color === data[constraint.color])
          );
          if (arr.length === 0) continue;
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
            x.attribute_type === "Measures"
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
    dataset.sort((a, b) => a[0] - b[0]);
    // if (chartType === "line" || chartType === "scatter")
    //   dataset.sort((a, b) => a[0] - b[0]);
    // // 折线图按x值从小到大
    // else if (chartType === "bar") dataset.sort((a, b) => b[1] - a[1]); // 条形图按y值从大到小
    return dataset;
  }
  render() {
    const self = this;
    const constraint = this.state.constraint;
    const originalData = [];
    this.props.originalData.forEach((data) => {
      originalData[data.index] = data;
    });
    const selectedOriginalData =
      constraint.data?.map((id) => originalData[id]) || [];
    const original_chart_data = constraint.x_axis
      ? this.getData(selectedOriginalData, constraint)
      : [];
    const protected_chart_data = constraint.x_axis
      ? this.getData(this.props.protectedData, constraint)
      : [];
    const original_data = constraint.x_axis
      ? this.getData(this.props.originalData, constraint)
      : [];
    return (
      <Row gutter={24}>
        <Col span={8}>
          <Row>
            <ConstraintSelect
              constraints={this.props.constraints}
              selectConstraint={(constraint) => {
                self.setState({ constraint });
              }}
            ></ConstraintSelect>
            <ParameterDisplay
              params={{
                Original: this.state.constraint.data
                  ? this.state.constraint.data.length
                  : 0,
                Protected: this.state.constraint.protectedData
                  ? this.state.constraint.protectedData.length
                  : 0,
              }}
            ></ParameterDisplay>
          </Row>
        </Col>
        <Col span={16}>
          <ChartDisplay
            name="protected-chart"
            oldData={original_chart_data}
            data={protected_chart_data}
            originalData={original_data}
            attributes={this.props.attribute_character || {}}
            constraint={constraint}
          ></ChartDisplay>
        </Col>
      </Row>
    );
  }
}
