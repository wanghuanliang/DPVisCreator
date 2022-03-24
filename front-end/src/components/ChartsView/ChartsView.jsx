import React, { Component } from "react";
import { Col, Row } from "antd";
import ChartMenu from "./ChartMenu";
import ChartDisplay from "./ChartDisplay";
import ConstraintSelect from "./Datachart/ConstraintSelect";
import { chart_constraint, constraint_chart } from "./constants";
import "./ChartsView.less";
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
      original_chart_data: [],
      protected_chart_data: [],
    };
  }
  initConstraint(settings) {
    const constraint = {
      type: chart_constraint[settings.chart_type],
      selected: true,
      computation: settings.computation,
      x_axis: settings.x_axis,
      y_axis: settings.y_axis,
      color: settings.color,
      x_step: settings.x_step,
      params: {
        fitting: settings.fitting,
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
    if (chartType === "line" || chartType === "scatter")
      dataset.sort((a, b) => a[0] - b[0]);
    // 折线图按x值从小到大
    else if (chartType === "bar") dataset.sort((a, b) => b[1] - a[1]); // 条形图按y值从大到小
    if (type === "original") {
      this.setState({
        original_constraint: constraint,
        original_chart_data: dataset,
      });
    }
  }
  insertConstraint(constraint) {
    const constraints = this.state.constraints;
    constraints.push({ ...constraint, id: "C" + this.constraintId });
    this.constraintId++;
    const index = constraints.length - 1;
    this.setState({ constraints, original_constraint: constraints[index] });
    this.setConstraints();
  }
  updateConstraint(constraint) {
    const constraints = this.state.constraints;
    const index = constraints.findIndex((value) => value.id === constraint.id);
    if (index >= 0) {
      constraints[index] = { ...constraints[index], ...constraint };
      this.getData("original", this.props.original_data, constraint);
      this.setState({ constraints });
      this.setConstraints();
    } else {
      this.setState({ original_constraint: constraint });
    }
  }
  updateConstraintParams(constraint, params) {
    constraint.params = { ...constraint.params, ...params };
    const constraints = this.state.constraints;
    const index = constraints.findIndex((value) => value.id === constraint.id);
    if (index >= 0) {
      constraints[index] = { ...constraints[index], ...constraint };
      this.getData("original", this.props.original_data, constraint);
      this.setState({ constraints });
    } else {
      this.setState({ original_constraint: constraint });
    }
  }
  removeConstraint(constraint) {
    const constraints = this.state.constraints;
    const index = constraints.findIndex((value) => value.id === constraint.id);
    constraints.splice(index, 1);
    this.setState({ constraints });
    this.setConstraints();
  }
  selectConstraint(type, index) {
    if (type === "original") {
      this.getData(
        type,
        this.props.original_data,
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
          constraint={this.state.original_constraint}
          updateConstraintParams={(params) => {
            const constraint = this.state.original_constraint;
            const newParams = { ...constraint.params, ...params };
            constraint.params = newParams;
            this.updateConstraint(constraint);
          }}
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
        <Col span={6} style={{ paddingLeft: 4 }}>
          <ConstraintSelect
            constraints={this.state.constraints}
            constraintId={this.state.original_constraint.id}
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
