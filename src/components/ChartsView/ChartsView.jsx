import React, { Component } from "react";
import { Button, Row, TimePicker } from "antd";
import MenuChart from "./MenuChart";
import { PlusOutlined } from "@ant-design/icons";
import { attributeCharacter } from "../../data/attributes";
class ChartsView extends Component {
  constructor(props) {
    super(props);
    this.dataset = props.dataset;
    // console.log(this.dataset);
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
    const attributes = Object.keys(attributeCharacter).map((name) => {
      return {
        name,
        ...attributeCharacter[name],
      };
    });
    return (
      <div>
        {this.createCharts()}
        <Button
          block
          icon={<PlusOutlined />}
          onClick={() =>
            this.setState({
              chartList: this.state.chartList.concat([
                {
                  dataset: this.dataset,
                  attributes,
                  avaliable: ["scatter", "line", "bar"],
                },
              ]),
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
