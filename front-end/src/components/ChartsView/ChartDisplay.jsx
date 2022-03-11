import { Component } from "react";
import { constraint_chart } from "./constants";
import DataChart from "./Datachart/DataChart";

export default class ChartDisplay extends Component {
  constructor(props) {
    super(props);
    this.insertConstraint = props.insertConstraint;
    this.updateConstraint = props.updateConstraint;
    this.attributes = [
      {
        name: this.props.constraint.x_axis,
        ...this.props.attributes[this.props.constraint.x_axis],
      },
      {
        name: this.props.constraint.y_axis,
        ...this.props.attributes[this.props.constraint.y_axis],
      },
      {
        name: this.props.constraint.color,
        ...this.props.attributes[this.props.constraint.color],
      },
    ];
  }
  render() {
    return (
      <div>
        <DataChart
          id={this.props.id}
          type={constraint_chart[this.props.constraint.type]}
          attributes={this.attributes}
          data={this.props.data}
        ></DataChart>
      </div>
    );
  }
}
