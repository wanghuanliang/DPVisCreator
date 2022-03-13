import React, { Component } from "react";
import { Col, Row } from "antd";
import ChartMenu from "./ChartMenu";
import ChartDisplay from "./ChartDisplay";
import ConstraintSelect from "./Datachart/ConstraintSelect";
import { chart_constraint, constraint_chart } from "./constants";
class ChartsView extends Component {
  constructor(props) {
    super(props);
    this.setAugmentedData = props.setAugmentedData;
    this.setProtectedData = props.setProtectedData;
    this.setPattern = () => {
      const self = this;
      this.props
        .setPattern({ constraints: this.state.constraints })
        .then((body) => {
          const data = body.data;
          if (data.status === "success") {
            self.setAugmentedData(data.augmented_data);
            self.setProtectedData(data.protected_data);
          }
        });
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
      params: {
        fitting: settings.fitting ? settings.fitting : 2,
      },
    };
    this.getData("original", this.props.original_data, constraint);
    this.getData(
      "protected",
      this.props.protected_data || this.props.original_data,
      constraint
    );
  }
  getData(type, type_data, constraint) {
    const [x, y, computation, color, fitting, chartType] = [
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
    ];
    const dataset = [];
    if (computation !== null) {
      const range = [];
      type_data.forEach((data) => {
        if (!range.includes(data[constraint.x_axis])) {
          range.push(data[constraint.x_axis]);
        }
      });
      const cart = []; // 笛卡尔积
      range.forEach((value) => {
        color.values.forEach((colorName) => {
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
            data[constraint.x_axis] === condition.value &&
            (condition.color === "default" ||
              condition.color === data[constraint.color])
        );
        arr.forEach((element) => (sum += element[constraint.y_axis]));
        dataset.push([
          condition.value,
          computation === "count"
            ? arr.length
            : sum / (arr.length === 0 ? 1 : arr.length),
          condition.color,
          arr.map((element) => element.index),
        ]);
      });
    } else {
      type_data.forEach((data) => {
        dataset.push([
          data[constraint.x_axis],
          data[constraint.y_axis],
          constraint.color ? data[constraint.color] : "default",
          data.index,
        ]);
      });
    }
    if (chartType === "line" || chartType === "scatter")
      dataset.sort((a, b) => a[0] - b[0]);
    // 折线图按x值从小到大
    else if (chartType === "bar") dataset.sort((a, b) => b[1] - a[1]); // 条形图按y值从大到小
    if (type === "original") {
      this.setState({
        original_chart_data: dataset,
        original_constraint: constraint,
      });
    } else if (type === "protected") {
      this.setState({
        protected_chart_data: dataset,
        protected_constraint: constraint,
      });
    }
  }
  insertConstraint(constraint) {
    const constraints = this.state.constraints;
    constraints.push({ ...constraint, id: "C" + this.constraintId });
    this.constraintId++;
    this.setState({ constraints });
    console.log({ constraints: this.state.constraints });
    this.setPattern();
  }
  updateConstraint(constraint) {
    const constraints = this.state.constraints;
    const index = constraints.findIndex((value) => value.id === constraint.id);
    if (index >= 0) {
      constraints[index] = { ...constraints[index], ...constraint };
      this.getData("original", this.state.original_data, constraint);
      this.setState({ constraints });
      this.setPattern();
    } else {
      this.setState({ original_constraint: constraint });
    }
    console.log({ constraints: this.state.constraints });
  }
  updateConstraintParams(constraint, params) {
    constraint.params = { ...constraint.params, ...params };
    this.updateConstraint(constraint);
  }
  removeConstraint(constraint) {
    const constraints = this.state.constraints;
    const index = constraints.findIndex((value) => value.id === constraint.id);
    constraints.splice(index, 1);
    this.setState({ constraints });
    console.log({ constraints: this.state.constraints });
    this.setPattern();
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
          insertConstraint={() =>
            this.insertConstraint(this.state.original_constraint)
          }
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
            removeConstraint={(index) =>
              this.removeConstraint(this.state.constraints[index])
            }
            selectConstraint={(index) =>
              this.selectConstraint("original", index)
            }
          ></ConstraintSelect>
        </Col>
        <Col span={18}>
          <ChartDisplay
            name="protected-chart"
            data={this.state.protected_chart_data}
            attributes={this.props.attribute_character || {}}
            constraint={this.state.protected_constraint}
            updateConstraint={(constraint) => this.updateConstraint(constraint)}
            updateConstraintParams={(id, params) =>
              this.updateConstraintParams(id, params)
            }
          ></ChartDisplay>
        </Col>
        <Col span={6}>
          <ConstraintSelect
            constraints={this.state.constraints}
            removeConstraint={(constraint) => this.removeConstraint(constraint)}
            selectConstraint={(index) =>
              this.selectConstraint("protected", index)
            }
          ></ConstraintSelect>
        </Col>
      </Row>
    );
  }
}

export default ChartsView;
