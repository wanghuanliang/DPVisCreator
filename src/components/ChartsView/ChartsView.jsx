import React, { Component } from "react";
import { Button, Row, TimePicker } from "antd";
import MenuChart from "./MenuChart";
import Mocker, { AttributeType, DataMode, Distribution } from "random-mock";
import { PlusOutlined } from "@ant-design/icons";
class ChartsView extends Component {
  constructor(props) {
    super(props);
    const attributes = [
      {
        name: "Age",
        type: AttributeType.Continuous,
        distribution: new Distribution.Discrete.Standard(
          (function () {
            const ages = [];
            for (let i = 1; i < 100; i++) ages.push(i);
            return ages;
          })()
        ),
      },
      {
        name: "Bmi",
        type: AttributeType.Continuous,
        distribution: new Distribution.Continuous.Normal(22, 3),
      },
      {
        name: "Charges",
        type: AttributeType.Continuous,
        distribution: new Distribution.Continuous.Exponential(5, 5),
      },
      {
        name: "Sex",
        type: AttributeType.Discrete,
        distribution: new Distribution.Discrete.Standard(
          ["male", "female"],
          [0.55, 0.45]
        ),
      },
      {
        name: "Smoker",
        type: AttributeType.Discrete,
        distribution: new Distribution.Discrete.Standard(
          ["smoker", "non-smoker"],
          [0.3, 0.7]
        ),
      },
      {
        name: "Region",
        type: AttributeType.Discrete,
        distribution: new Distribution.Discrete.Standard([
          "USA",
          "UK",
          "CHN",
          "RUS",
          "FRA",
        ]),
      },
    ];
    const mocker = new Mocker({
      attributes,
      rules: [
        {
          dependent: "Smoker",
          arguments: ["Sex"],
          effect: (Sex) =>
            Sex === "male"
              ? Distribution.Discrete.Standard.Random(
                  ["smoker", "non-smoker"],
                  [0.4, 0.6]
                )
              : Distribution.Discrete.Standard.Random(
                  ["smoker", "non-smoker"],
                  [0.2, 0.8]
                ),
          confidence: 0.95,
        },
        {
          dependent: "Charges",
          arguments: ["Age", "Sex", "Region", "Smoker"],
          effect: (Age, Sex, Region, Smoker) => {
            const map = {
              USA: 60000,
              UK: 40000,
              CHN: 15000,
              RUS: 10000,
              FRA: 30000,
            };
            let offset = Sex === "male" ? 1.02 : 1.05;
            offset -= Smoker === "smoker" ? 0.05 : 0;
            const base = map[Region] + 500 * Math.pow(offset, Age);
            return Distribution.Continuous.Normal.Random(base, 3000);
          },
          confidence: 0.95,
        },
        {
          dependent: "Bmi",
          arguments: ["Age", "Sex", "Charges"],
          effect: (Age, Sex, Charges) => {
            return Sex === "male"
              ? Distribution.Continuous.Normal.Random(
                  16 + Age * 0.12,
                  2 + Charges / 30000
                )
              : Distribution.Continuous.Normal.Random(
                  12 + Age * 0.1,
                  2 + Charges / 30000
                );
          },
          confidence: 0.95,
        },
      ],
    });
    const dataset = mocker.create({
      count: 200,
      mode: DataMode.Object,
    });
    this.state = {
      chartList: [],
      attributes,
      dataset,
    };
  }
  createCharts() {
    return this.state.chartList.map((chart, index) => (
      <Row key={"chart-" + index}>
        <MenuChart
          dataset={this.state.dataset}
          attributes={this.state.attributes}
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
            this.setState({ chartList: this.state.chartList.concat([""]) })
          }
        >
          Add new chart
        </Button>
      </div>
    );
  }
}

export default ChartsView;
