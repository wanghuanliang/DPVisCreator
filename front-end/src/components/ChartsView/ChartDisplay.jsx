import { index } from "d3";
import { Component } from "react";
import { constraint_chart } from "./constants";
import DataChart from "./Datachart/DataChart";

export default class ChartDisplay extends Component {
  constructor(props) {
    super(props);
    this.insertConstraint = props.insertConstraint;
    this.updateConstraint = props.updateConstraint;
    this.updateConstraintParams = props.updateConstraintParams;
    this.state = {
      constraint: this.props.constraint,
    };
    this.selected_data = [];
  }
  onSelected(selected_data) {
    const constraint = this.props.constraint;
    const indexes = [];
    selected_data.forEach((data) => {
      indexes.push(...data[3]);
    });
    constraint.data = indexes;
    this.updateConstraint(constraint);
  }
  render() {
    const attributes = [
      {
        name: this.props.constraint.x_axis,
        ...this.props.attributes[this.props.constraint.x_axis],
      },
      this.props.constraint.computation === "count"
        ? {
            name: "count",
            attribute_type: "Measures",
          }
        : {
            name: this.props.constraint.y_axis,
            ...this.props.attributes[this.props.constraint.y_axis],
          },
      {
        name: this.props.constraint.color,
        ...(this.props.constraint.color
          ? this.props.attributes[this.props.constraint.color]
          : { attribute_type: "Dimensions", values: ["default"] }),
      },
    ];
    return (
      <DataChart
        name={this.props.name}
        type={constraint_chart[this.props.constraint.type]}
        attributes={attributes}
        data={this.props.data}
        constraint={this.props.constraint}
        showConstraint={this.props.showConstraint}
        updateConstraintParams={this.props.updateConstraintParams}
        onSelected={(selected) => {
          this.onSelected(selected);
        }}
      ></DataChart>
    );
  }
}
