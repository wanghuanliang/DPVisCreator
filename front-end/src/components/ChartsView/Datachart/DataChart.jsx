import * as echarts from "echarts";
import { Component } from "react";
import { attributeType } from "../../../data/attributes";
import * as ecStat from "echarts-stat";
import * as d3 from "d3";
const globalColor = [
  "#5470c6",
  "#91cc75",
  "#fac858",
  "#ee6666",
  "#73c0de",
  "#3ba272",
  "#fc8452",
  "#9a60b4",
  "#ea7ccc",
];
// 散点图选择之后聚类，生成椭圆 柱状图单独选择柱子 折线图生成的拟合曲线可调整宽度，纵向，背景全部调成灰色
function getAxisOption(attribute) {
  return "Dimensions" === attributeType[attribute.attributeType]
    ? {
        type: "category",
        id: attribute.name,
        name: attribute.name,
        nameLocation: "center",
        scale: true,
        splitLine: {
          show: false,
        },
      }
    : {
        type: "value",
        id: attribute.name,
        name: attribute.name,
        nameLocation: "center",
        scale: true,
        splitLine: {
          show: false,
        },
      };
}
function getXAxisOption(attribute) {
  return {
    type: "category",
    id: attribute.name,
    name: attribute.name,
    nameLocation: "center",
    scale: true,
    splitLine: {
      show: false,
    },
  };
}
function getSeriesOption(type, attribute, data, pointSize) {
  return attribute.value.map((name) => {
    return {
      name,
      type: type,
      symbolSize: pointSize,
      data: data
        .filter((data) => data[2] === name)
        .map((data) => [data[0], data[1]]),
    };
  });
}

const grid = {
  top: "12%",
  left: "10%",
  right: "10%",
};
export default class DataChart extends Component {
  constructor(props) {
    super(props);
    let mapper = {};
    if (props.attributes[0].attribute_type === "Dimensions") {
      // 解决枚举类型为数字后，被echarts解析为数值索引的问题
      let index = 0;
      props.data.forEach((d) => {
        if (!mapper[d[0]]) {
          mapper[d[0]] = index;
          index++;
        }
      });
    }
    this.mapper = mapper;
    this.width = 300;
    this.selectedSeriesData = {};
  }
  convertToPixel(point) {
    return this.chart.convertToPixel(
      {
        xAxisName: this.props.attributes[0].name,
        yAxisName: this.props.attributes[1].name,
        seriesName: point[2],
      },
      [
        attributeType[this.props.attributes[0].attributeType] === "Dimensions"
          ? this.props.attributes[0].mapper[point[0]]
          : point[0] - this.props.attributes[0].min,
        point[1],
        point[2],
      ]
    );
  }
  componentDidMount() {
    let self = this;
    const chartDom = document.getElementById(this.props.id);
    this.chart = echarts.init(chartDom);
    this.chart.on("brushSelected", (params) => {
      const seriesData = {};
      params.batch[0]?.selected.forEach((series) => {
        const name = series.seriesName;
        const data = self.props.data.filter((data) => data[2] === name);
        const selectedData = [];
        series.dataIndex.forEach((index) => {
          selectedData.push(data[index]);
        });
        seriesData[name] =
          selectedData.length > 0 ? selectedData : seriesData[name];
      });
      this.selectedSeriesData = seriesData;
    });
    this.chart.on("brushEnd", (params) => {
      this.props.onSelected(this.selectedSeriesData);
      this.generateData();
    });
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
      brush: { throttleType: "debounce" },
      legend: {
        data: this.props.attributes[2].value,
        left: "10%",
        top: "10%",
      },
      xAxis: getXAxisOption(this.props.attributes[0]),
      yAxis: getAxisOption(this.props.attributes[1]),
      series: getSeriesOption(
        "scatter",
        this.props.attributes[2],
        this.props.data,
        5
      ),
    };
    return option;
  }
  getLineChartOption() {
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
      legend: {
        data: this.props.attributes[2].value,
        left: "10%",
        top: "10%",
      },
      grid,
      toolbox: {
        feature: {
          dataZoom: {},
          brush: {
            type: ["lineX", "clear"],
          },
        },
      },
      brush: {
        throttleType: "debounce",
      },
      calculable: true,
      xAxis: getXAxisOption(this.props.attributes[0], this.props.data),
      yAxis: getAxisOption(this.props.attributes[1]),
      series: [
        ...getSeriesOption(
          "line",
          this.props.attributes[2],
          this.props.data,
          5
        ),
        ...getSeriesOption(
          "scatter",
          this.props.attributes[2],
          this.props.data,
          0
        ),
      ],
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
        feature: {
          dataZoom: {},
          brush: {
            type: ["lineX", "clear"],
          },
        },
      },
      brush: { throttleType: "debounce" },
      calculable: true,
      legend: {
        data: this.props.attributes[2].value,
        left: "10%",
        top: "10%",
      },
      grid,
      xAxis: getXAxisOption(this.props.attributes[0], this.props.data),
      yAxis: getAxisOption(this.props.attributes[1]),
      series: getSeriesOption("bar", this.props.attributes[2], this.props.data),
    };
    return option;
  }

  generateData() {
    const type = this.props.type;
    let option = {
      color: globalColor,
    };

    if (type === "scatter") {
      option = { ...option, ...this.getScatterChartOption() };
      this.getScatterCluster();
    } else if (type === "line") {
      option = { ...option, ...this.getLineChartOption() };
      this.getLineCluster();
    } else if (type === "bar") {
      option = { ...option, ...this.getBarChartOption() };
      this.getBarCluster();
    }
    this.chart.clear();
    this.chart.resize({ width: this.width, height: 300 });
    option && this.chart.setOption(option);
  }
  render() {
    return <canvas width={"100%"} height={300} id={this.props.id}></canvas>;
  }
}
function dragBarY(event, d) {
  d3.select(this).attr("cy", event.y);
}
