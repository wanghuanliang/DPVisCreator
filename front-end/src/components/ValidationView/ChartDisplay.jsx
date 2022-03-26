import { Component } from "react";
import { constraint_chart } from "../ChartsView/constants";
import DataChart from "./DataChart/DataChart";

export default class ChartDisplay extends Component {
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
        oldData={this.props.oldData}
        originalData={this.props.originalData}
        constraint={this.props.constraint}
        showConstraint={this.props.showConstraint}
      ></DataChart>
    );
  }
}
