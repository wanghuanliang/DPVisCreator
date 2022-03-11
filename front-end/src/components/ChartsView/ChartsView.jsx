import React, { Component } from "react";
import { Col, Row } from "antd";
import ChartMenu from "./ChartMenu";
import ChartDisplay from "./ChartDisplay";
import ConstraintSelect from "./Datachart/ConstraintSelect";
import { chart_constraint, constraint_chart } from "./constants";
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
      x_axis: settings.x_axis,
      y_axis: settings.y_axis,
      color: settings.color,
    };
    this.getData(this.state.original_data, constraint);
  }
  getData(type_data, constraint) {
    const [x, y, compute, color, fitting, chartType] = [
      this.state.attribute_character[constraint.x_axis],
      constraint.y_axis
        ? this.state.attribute_character[constraint.y_axis]
        : null,
      constraint.compute,
      constraint.color
        ? this.state.attribute_character[constraint.color]
        : { attribute_type: "Dimensions", value: ["default"] },
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
          data[constraint.x_axis],
          data[constraint.y_axis],
          constraint.color ? data[constraint.color] : "default",
        ]);
      });
    }
    if (chartType === "line" || chartType === "scatter")
      dataset.sort((a, b) => a[0] - b[0]);
    // 折线图按x值从小到大
    else if (chartType === "bar") dataset.sort((a, b) => b[1] - a[1]); // 条形图按y值从大到小
    this.setState({ original_chart_data: dataset });
    this.forceUpdate();
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
          initConstraint={(settings) => {
            this.initConstraint(settings);
          }}
        ></ChartMenu>
        <Col span={18}>
          <ChartDisplay
            id="original-chart"
            data={this.state.original_chart_data}
            attributes={this.state.attribute_character}
            constraint={this.state.original_constraint}
            insertConstraint={(constraint) => this.insertConstraint(constraint)}
            updateConstraint={(constraint) => this.updateConstraint(constraint)}
          ></ChartDisplay>
        </Col>
        <Col span={6}>
          <ConstraintSelect
            constraints={this.state.constraints}
            removeConstraint={(constraint) => this.removeConstraint(constraint)}
            selectConstraint={(index) =>
              this.selectConstraint("original", index)
            }
          ></ConstraintSelect>
        </Col>
        <Col span={18}>
          <ChartDisplay
            id="protected-chart"
            data={this.state.protected_chart_data}
            attributes={this.state.attribute_character}
            constraint={this.state.protected_constraint}
            updateConstraint={(constraint) => this.updateConstraint(constraint)}
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
