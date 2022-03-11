import { Component } from "react";
import DataChart from "./Datachart/DataChart";

export default class ChartDisplay extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div>
        <DataChart id={this.props.id}></DataChart>
      </div>
    );
  }
}
