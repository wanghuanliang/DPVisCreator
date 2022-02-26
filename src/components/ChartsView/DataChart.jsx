import * as echarts from "echarts";
import { AttributeType } from "random-mock";
import { Component } from "react";
function isDimension(type) {
  return (
    type === AttributeType.Discrete ||
    type === AttributeType.Category ||
    type === AttributeType.Primary ||
    type === AttributeType.Unique
  );
}
export default class DataChart extends Component {
  constructor(props) {
    super(props);
    this.width = 300;
  }
  componentDidMount() {
    const chartDom = document.getElementById(this.props.id);
    this.chart = echarts.init(chartDom);
    const divDom = document.getElementById("container-" + this.props.id);
    this.width = divDom.offsetWidth;
    this.generateData();
  }
  componentDidUpdate() {
    const divDom = document.getElementById("container-" + this.props.id);
    this.width = divDom.offsetWidth;
    this.generateData();
  }
  getScatterChartOption() {
    const option = {
      grid: {
        left: "3%",
        right: "7%",
        bottom: "7%",
        containLabel: true,
      },
      tooltip: {
        // trigger: 'axis',
        showDelay: 0,
        axisPointer: {
          show: true,
          type: "cross",
          lineStyle: {
            type: "dashed",
            width: 1,
          },
        },
      },
      toolbox: {
        feature: {
          dataZoom: {},
          brush: {
            type: ["rect", "polygon", "clear"],
          },
        },
      },
      brush: {},
      legend: {
        data: this.props.attributes[2].range,
        left: "10%",
        top: "10%",
      },
      xAxis: isDimension(this.props.attributes[0].type)
        ? {
            type: "category",
            name: this.props.attributes[0].name,
            data: this.props.attributes[0].range,
            nameLocation: "center",
            scale: true,
            splitLine: {
              show: false,
            },
          }
        : {
            type: "value",
            name: this.props.attributes[0].name,
            nameLocation: "center",
            scale: true,
            splitLine: {
              show: false,
            },
          },
      yAxis: isDimension(this.props.attributes[1].type)
        ? {
            type: "category",
            name: this.props.attributes[1].name,
            data: this.props.attributes[1].range,
            nameLocation: "center",
            scale: true,
            splitLine: {
              show: false,
            },
          }
        : {
            type: "value",
            name: this.props.attributes[1].name,
            nameLocation: "center",
            scale: true,
            splitLine: {
              show: false,
            },
          },
      series: this.props.attributes[2].range.map((name) => {
        return {
          name,
          type: "scatter",
          data: this.props.data
            .filter((data) => data[2] === name)
            .map((data) => [data[0], data[1]]),
        };
      }),
    };
    return option;
  }
  getLineChartOption() {
    const option = {
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: this.props.attributes[2].range,
        left: "10%",
        top: "10%",
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      xAxis: isDimension(this.props.attributes[0].type)
        ? {
            type: "category",
            name: this.props.attributes[0].name,
            data: this.props.attributes[0].range,
            nameLocation: "center",
            scale: true,
            splitLine: {
              show: false,
            },
          }
        : {
            type: "value",
            name: this.props.attributes[0].name,
            nameLocation: "center",
            scale: true,
            splitLine: {
              show: false,
            },
          },
      yAxis: isDimension(this.props.attributes[1].type)
        ? {
            type: "category",
            name: this.props.attributes[1].name,
            data: this.props.attributes[1].range,
            nameLocation: "center",
            scale: true,
            splitLine: {
              show: false,
            },
          }
        : {
            type: "value",
            name: this.props.attributes[1].name,
            nameLocation: "center",
            scale: true,
            splitLine: {
              show: false,
            },
          },
      series: this.props.attributes[2].range.map((name) => {
        return {
          name,
          type: "line",
          data: this.props.data
            .filter((data) => data[2] === name)
            .map((data) => data[1]),
        };
      }),
    };
    return option;
  }
  getBarChartOption() {
    return {};
  }
  generateData() {
    const type = this.props.type;
    const option =
      type === "scatter"
        ? this.getScatterChartOption()
        : type === "line"
        ? this.getLineChartOption()
        : this.getBarChartOption();
    this.chart.clear();
    this.chart.resize({ width: this.width, height: 300 });
    option && this.chart.setOption(option);
  }
  render() {
    return (
      <div width={"100%"} height={300} id={"container-" + this.props.id}>
        <canvas id={this.props.id}></canvas>
      </div>
    );
  }
}
