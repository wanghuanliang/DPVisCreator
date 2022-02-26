import React, { Component } from "react";
import { Button, Row, TimePicker } from "antd";
import MenuChart from "./MenuChart";
import { PlusOutlined } from "@ant-design/icons";
import getDatasets from "./dataset";
class ChartsView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chartList: [],
    };
  }
  createCharts() {
    return this.state.chartList.map((chart, index) => (
      <Row key={"chart-" + index}>
        <MenuChart
          dataset={chart.dataset}
          attributes={chart.attributes}
          avaliable={chart.avaliable}
          id={"chart-" + index}
        ></MenuChart>
      </Row>
    ));
  }
  render() {
    return (
      <div>
        {this.createCharts()}
        <Button
          block
          icon={<PlusOutlined />}
          onClick={() =>
            this.setState({
              chartList: getDatasets(),
            })
          }
        >
          Add new chart
        </Button>
      </div>
    );
  }
}

export default ChartsView;
