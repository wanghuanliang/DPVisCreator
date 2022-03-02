import * as echarts from "echarts";
import { Component } from "react";
import { attributeType } from "../../data/attributes";
function getAxisOption(attribute) {
  return "Dimensions" === attributeType[attribute.type]
    ? {
        type: "category",
        name: attribute.name,
        data: attribute.value,
        nameLocation: "center",
        scale: true,
        splitLine: {
          show: false,
        },
      }
    : {
        type: "value",
        name: attribute.name,
        nameLocation: "center",
        scale: true,
        splitLine: {
          show: false,
        },
      };
}
function getXAxisOption(attribute, dataset) {
  const values = [];
  dataset.forEach((data) => {
    if (!values.includes(data[0])) values.push(data[0]); // 去重
  });
  return {
    type: "category",
    name: attribute.name,
    data: values,
    nameLocation: "center",
    scale: true,
    splitLine: {
      show: false,
    },
  };
}
function getSeriesOption(type, attribute, data) {
  if (type === "scatter") {
    return attribute.value.map((name) => {
      return {
        name,
        type: type,
        data: data
          .filter((data) => data[2] === name)
          .map((data) => [data[0], data[1]]),
      };
    });
  } else {
    return attribute.value.map((name) => {
      return {
        name,
        type,
        data: data.filter((data) => data[2] === name).map((data) => data[1]),
      };
    });
  }
}
const grid = {
  top: "12%",
  left: "1%",
  right: "10%",
};
const dataZoom = [
  {
    show: true,
    start: 15,
    end: 85,
  },
  {
    type: "inside",
    start: 15,
    end: 85,
  },
  {
    show: true,
    yAxisIndex: 0,
    filterMode: "empty",
    width: 30,
    height: "80%",
    showDataShadow: false,
    left: "93%",
  },
];
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
      grid,
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
        data: this.props.attributes[2].value,
        left: "10%",
        top: "10%",
      },
      dataZoom,
      xAxis: getAxisOption(this.props.attributes[0]),
      yAxis: getAxisOption(this.props.attributes[1]),
      series: getSeriesOption(
        "scatter",
        this.props.attributes[2],
        this.props.data
      ),
    };
    return option;
  }
  getLineChartOption() {
    const option = {
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: this.props.attributes[2].value,
        left: "10%",
        top: "10%",
      },
      grid,
      dataZoom,
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      xAxis: getXAxisOption(this.props.attributes[0], this.props.data),
      yAxis: getAxisOption(this.props.attributes[1]),
      series: getSeriesOption(
        "line",
        this.props.attributes[2],
        this.props.data
      ),
    };
    return option;
  }
  getBarChartOption() {
    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
          label: {
            show: true,
          },
        },
      },
      toolbox: {
        show: true,
        feature: {
          mark: { show: true },
          dataView: { show: true, readOnly: false },
          magicType: { show: true, type: ["line", "bar"] },
          restore: { show: true },
          saveAsImage: { show: true },
        },
      },
      calculable: true,
      legend: {
        data: this.props.attributes[2].value,
        left: "10%",
        top: "10%",
      },
      grid,
      xAxis: getXAxisOption(this.props.attributes[0], this.props.data),
      yAxis: getAxisOption(this.props.attributes[1]),
      dataZoom,
      series: getSeriesOption("bar", this.props.attributes[2], this.props.data),
    };
    return option;
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
