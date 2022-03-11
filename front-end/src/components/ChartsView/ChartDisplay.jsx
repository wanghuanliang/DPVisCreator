import { Component } from "react";
import { constraint_chart } from "./constants";
import Cluster from "./Constraints/Cluster";
import Correlation from "./Constraints/Correlation";
import Order from "./Constraints/Order";
import DataChart from "./Datachart/DataChart";

export default class ChartDisplay extends Component {
  constructor(props) {
    super(props);
    this.insertConstraint = props.insertConstraint;
    this.updateConstraint = props.updateConstraint;
    this.constraint = props.constraint;
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
  getConstraintElement() {
    const type = this.props.constraint.type;
    if (type === "cluster") {
      return (
        <Cluster
          params={this.constraint.params}
          updateConstraint={this.updateConstraint}
        ></Cluster>
      );
    } else if (type === "correlation") {
      return (
        <Correlation
          params={this.constraint.params}
          updateConstraint={this.updateConstraint}
        ></Correlation>
      );
    } else if (type === "order") {
      return (
        <Order
          params={this.constraint.params}
          updateConstraint={this.updateConstraint}
        ></Order>
      );
    }
  }
  render() {
    return (
      <div id={"container-" + this.props.id}>
        <DataChart
          id={this.props.id}
          type={constraint_chart[this.props.constraint.type]}
          attributes={this.attributes}
          data={this.props.data}
        ></DataChart>
        {this.getConstraintElement()}
      </div>
    );
  }
}
