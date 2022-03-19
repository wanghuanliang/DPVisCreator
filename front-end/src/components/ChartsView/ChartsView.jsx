import React, { Component } from "react";
import { Col, Row } from "antd";
import ChartMenu from "./ChartMenu";
import ChartDisplay from "./ChartDisplay";
import ConstraintSelect from "./Datachart/ConstraintSelect";
import { chart_constraint, constraint_chart } from "./constants";
class ChartsView extends Component {
  constructor(props) {
    super(props);
    this.setConstraints = () => {
      this.props.setConstraints(this.state.constraints);
    };
    this.constraintId = 0;
    this.state = {
      constraints: [],
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
      x_axis: settings.x_axis,
      y_axis: settings.y_axis,
      color: settings.color,
      x_step: settings.x_step,
      params: {
        fitting: settings.fitting ? settings.fitting : 2,
      },
    };
    this.getData("original", this.props.original_data, constraint);
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
    if (type === "original") {
      this.setState({
        original_chart_data: dataset,
        original_constraint: constraint, // 同步修改
        protected_constraint: constraint,
      });
    } else if (type === "protected") {
      this.setState({
        protected_chart_data: dataset,
        original_constraint: constraint,
        protected_constraint: constraint,
      });
    }
  }
  insertConstraint(constraint) {
    const constraints = this.state.constraints;
    constraints.push({ ...constraint, id: "C" + this.constraintId });
    this.constraintId++;
    this.setState({ constraints });
    this.setConstraints();
  }
  updateConstraint(constraint) {
    const constraints = this.state.constraints;
    const index = constraints.findIndex((value) => value.id === constraint.id);
    if (index >= 0) {
      constraints[index] = { ...constraints[index], ...constraint };
      this.getData("original", this.state.original_data, constraint);
      this.setState({ constraints });
      this.setConstraints();
    } else {
      this.setState({
        original_constraint: constraint,
        protected_constraint: constraint,
      });
    }
  }
  updateConstraintParams(constraint, params) {
    constraint.params = { ...constraint.params, ...params };
    const constraints = this.state.constraints;
    const index = constraints.findIndex((value) => value.id === constraint.id);
    if (index >= 0) {
      constraints[index] = { ...constraints[index], ...constraint };
      this.getData("original", this.state.original_data, constraint);
      this.setState({ constraints });
    } else {
      this.setState({
        original_constraint: constraint,
        protected_constraint: constraint,
      });
    }
  }
  removeConstraint(constraint) {
    const constraints = this.state.constraints;
    const index = constraints.findIndex((value) => value.id === constraint.id);
    constraints.splice(index, 1);
    this.setState({ constraints });
    console.log({ constraints: this.state.constraints });
    this.setConstraints();
  }
  selectConstraint(type, index) {
    if (type === "original") {
      this.getData(
        type,
        this.props.original_data,
        this.state.constraints[index]
      );
    } else if (type === "protected") {
      this.getData(
        type,
        this.props.protected_data || this.props.original_data,
        this.state.constraints[index]
      );
    }
  }
  render() {
    return (
      <Row gutter={24}>
        <ChartMenu
          attributes={this.props.attribute_character || {}}
          initConstraint={(settings) => this.initConstraint(settings)}
          constraintParams={this.state.original_constraint.params}
          removeConstraint={() =>
            this.removeConstraint(this.state.original_constraint)
          }
          saveConstraint={() => {
            if (this.state.original_constraint.id)
              this.updateConstraint(this.state.original_constraint);
            else this.insertConstraint(this.state.original_constraint);
          }}
        ></ChartMenu>
        <Col span={18}>
          <ChartDisplay
            name="original-chart"
            data={this.state.original_chart_data}
            attributes={this.props.attribute_character || {}}
            constraint={this.state.original_constraint}
            updateConstraint={(constraint) => this.updateConstraint(constraint)}
            updateConstraintParams={(id, params) =>
              this.updateConstraintParams(id, params)
            }
          ></ChartDisplay>
        </Col>
        <Col span={6}>
          <ConstraintSelect
            constraints={this.state.constraints}
            updateConstraint={(constraint) => {
              this.updateConstraint(constraint);
            }}
            selectConstraint={(index) =>
              this.selectConstraint("original", index)
            }
          ></ConstraintSelect>
        </Col>
      </Row>
    );
  }
}

export default ChartsView;
