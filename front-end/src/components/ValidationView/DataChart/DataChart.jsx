import * as echarts from "echarts";
import { Component } from "react";
import * as ecStat from "echarts-stat";
import * as d3 from "d3";
import { chart_constraint } from "../../ChartsView/constants";
import { isArray, mean } from "lodash";
const globalColor = [
  "#d9d9d9",
  "#74cbed",
  "#f6bd17",
  "#5470c6",
  "#91cc75",
  "#ee6666",
  "#3ba272",
  "#fc8452",
  "#9a60b4",
  "#ea7ccc",
];
const chart_height = 320;
const axisOption = {
  nameTextStyle: {
    fontSize: 18,
    color: "#111111",
  },
  nameLocation: "center",
  scale: true,
  splitLine: {
    show: false,
  },
  axisPointer: {
    show: false,
  },
};
const grid = {
  top: "18%",
  left: "20%",
  right: "7%",
  bottom: "12%",
};
function isInteger(number) {
  return parseInt(number) == parseFloat(number);
}
function getAxisOption(attribute, axis = "x") {
  return "Dimensions" === attribute.attribute_type
    ? {
        type: "category",
        id: attribute.name,
        name: attribute.name,
        nameGap: axis === "x" ? "18" : "45",
        ...axisOption,
      }
    : {
        type: "value",
        id: attribute.name,
        name: attribute.name,
        nameGap: axis === "x" ? "18" : "45",
        axisLabel: {
          formatter: function (value, index) {
            return isInteger(value) ? value : value.toPrecision(4);
          },
        },
        ...axisOption,
      };
}
function getXAxisOption(attribute) {
  return {
    type: "category",
    id: attribute.name,
    name: attribute.name,
    nameGap: "18",
    ...axisOption,
  };
}
function getYAxisOption(attribute) {
  return {
    type: "value",
    id: attribute.name,
    name: attribute.name,
    nameGap: "45",
    axisLabel: {
      formatter: function (value, index) {
        return isInteger(value) ? value : value.toPrecision(4);
      },
    },
    ...axisOption,
  };
}
function getSeriesOption(type, attribute, data, pointSize) {
  return attribute.values.map((name) => {
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
function getOriginalSeriesOption(type, attribute, oldData, pointSize) {
  return [
    {
      name: "original_data",
      type,
      symbolSize: pointSize,
      data: oldData.map((data) => [data[0], data[1]]),
    },
  ];
}
export default class DataChart extends Component {
  constructor(props) {
    super(props);
    this.width = 300;
    this.mapper = {};
    this.params = props.constraint.params;
  }
  convertToPixel(point) {
    return this.chart.convertToPixel(
      {
        xAxisName: this.props.attributes[0].name,
        yAxisName: this.props.attributes[1].name,
        seriesName: point[2],
      },
      [
        this.props.type === "bar" ? this.mapper[point[0]] : point[0],
        point[1],
        point[2],
      ]
    );
  }
  clearSvg() {
    // 清空
    d3.selectAll("#container-" + this.props.name + " > svg > *").remove();
    this.svg.style("width", this.width);
  }
  convertFromPixel(point) {
    const values = this.chart.convertFromPixel(
      {
        xAxisName: this.props.attributes[0].name,
        yAxisName: this.props.attributes[1].name,
        seriesName: point[2],
      },
      point
    );
    return [
      this.props.attributes[0].attribute_type === "Dimensions"
        ? this.mapper[point[0]]
        : values[0],
      values[1],
    ];
  }
  componentDidMount() {
    let self = this;
    const chartDom = document.getElementById("canvas-" + this.props.name);
    this.chart = echarts.init(chartDom);
    this.svg = d3
      .select("#container-" + this.props.name)
      .append("svg")
      .style("width", this.width)
      .style("height", chart_height)
      .style("position", "absolute")
      .style("left", 12)
      .style("top", 0)
      .style("pointer-events", "none");
    const divDom = document.getElementById("container-" + this.props.name);
    this.width = divDom.offsetWidth;
    this.generateData();
  }
  componentDidUpdate() {
    let mapper = {};
    this.params = this.props.constraint.params;
    // 解决枚举类型为数字后，被echarts解析为数值索引的问题
    this.props.data.forEach((d, index) => {
      if (!mapper[d[0]]) {
        mapper[d[0]] = index;
      }
    });
    this.mapper = mapper;
    this.selectBar = {};
    this.selectedSeriesData = [];
    const selected = {};
    this.props.attributes[2].values.forEach((value) => {
      selected[value] = true;
    });
    this.selectedLegend = selected;
    const divDom = document.getElementById("container-" + this.props.name);
    this.width = divDom.offsetWidth;
    this.generateData();
    const type = this.props.type;
    if (type === "scatter") this.getCluster();
    else if (type === "line") this.getCorrelation();
    else if (type === "bar") this.getOrder();
  }
  getLegendOption() {
    const names = this.props.attributes[2].values.map((value) =>
      value.toString()
    );
    const data =
      this.props.type === "bar" ? names : ["original_data", ...names]; // echarts数字0123……无法正常显示，需转成字符
    return {
      data,
      left: "10%",
      width: "60%",
      top: "3%",
      selected: { original_data: true, ...this.selectedLegend },
    };
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
          brush: {
            type:
              this.props.name === "protected-chart"
                ? []
                : ["rect", "polygon", "clear"],
          },
        },
      },
      brush: { throttleType: "debounce" },
      legend: this.getLegendOption(),
      xAxis: getAxisOption(this.props.attributes[0]),
      yAxis: getAxisOption(this.props.attributes[1], "y"),
      series: [
        ...getOriginalSeriesOption(
          "scatter",
          this.props.attributes[2],
          this.props.oldData,
          5
        ),
        ...getSeriesOption(
          "scatter",
          this.props.attributes[2],
          this.props.data,
          5
        ),
      ],
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
      legend: this.getLegendOption(),
      grid,
      toolbox: {
        feature: {
          brush: {
            type:
              this.props.name === "protected-chart" ? [] : ["lineX", "clear"],
          },
        },
      },
      brush: {
        throttleType: "debounce",
      },
      calculable: true,
      xAxis: getAxisOption(this.props.attributes[0]),
      yAxis: getAxisOption(this.props.attributes[1], "y"),
      series: [
        ...getOriginalSeriesOption(
          "line",
          this.props.attributes[2],
          this.props.oldData,
          2
        ),
        ...getSeriesOption(
          "line",
          this.props.attributes[2],
          this.props.data,
          2
        ),
      ],
    };
    return option;
  }
  getBarChartOption() {
    const option = {
      color: [
        "#74cbed",
        "#d9d9d9",
        "#f6bd17",
        "#5470c6",
        "#91cc75",
        "#ee6666",
        "#3ba272",
        "#fc8452",
        "#9a60b4",
        "#ea7ccc",
      ],
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
        feature: {},
      },
      calculable: true,
      legend: this.getLegendOption(),
      grid,
      xAxis: getXAxisOption(this.props.attributes[0]),
      yAxis: getYAxisOption(this.props.attributes[1], "y"),
      series: [
        ...getSeriesOption("bar", this.props.attributes[2], this.props.data),
      ],
    };
    return option;
  }
  checkConstraint() {
    // 检查约束是否完整
    const type = this.props.type;
    const constraint = this.props.constraint;
    if (!constraint.selectedLegend) return false;
    const params = constraint.params;
    if (type === "scatter") {
      if (constraint.type !== chart_constraint["scatter"]) return false;
      if (
        params.mean &&
        isArray(params.mean) &&
        params.mean.length === 2 &&
        params.radius &&
        isArray(params.radius) &&
        params.radius.length === 2
      )
        return true;
    } else if (type === "line") {
      if (constraint.type !== chart_constraint["line"]) return false;
      if (
        params.polynomial_params &&
        params.padding &&
        params.range &&
        params.path
      )
        return true;
    } else if (type === "bar") {
      if (constraint.type !== chart_constraint["bar"]) return false;
      if (params.values) return true;
    }
    return false;
  }
  createCluster(cx, cy, rx, ry) {
    const self = this;
    this.svg
      .append("ellipse")
      .attr("opacity", "0.2")
      .attr("fill", "#d9d9d9")
      .attr("stroke", "#5D7092")
      .attr("stroke-width", 2)
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("rx", rx)
      .attr("ry", ry);
  }
  initCluster() {
    const self = this;
    const data = self.selectedSeriesData;
    if (data.length > 0) {
      const xSamples = data.map((d) => d[0]);
      const ySamples = data.map((d) => d[1]);
      const meanx = ecStat.statistics.mean(xSamples);
      const varx = ecStat.statistics.sampleVariance(xSamples);
      const meany = ecStat.statistics.mean(ySamples);
      const vary = ecStat.statistics.sampleVariance(ySamples);
      const [cx, cy] = self.convertToPixel([meanx, meany]);
      let [rx, ry] = self.convertToPixel([meanx + 1, meany - 1]);
      rx = (rx - cx) * Math.sqrt(varx);
      ry = (ry - cy) * Math.sqrt(vary);
      rx *= 2;
      ry *= 2;
      self.createCluster(cx, cy, rx, ry);
      self.updateParams({
        mean: [meanx, meany],
        radius: [Math.sqrt(varx) * 2, Math.sqrt(vary) * 2],
      });
    }
  }
  getCluster() {
    this.clearSvg();
    const self = this;
    if (this.checkConstraint()) {
      const [meanx, meany] = self.props.constraint.params.mean;
      const [cx, cy] = self.convertToPixel([meanx, meany]);
      let [rx, ry] = self.convertToPixel([meanx + 1, meany - 1]);
      rx -= cx;
      ry -= cy;
      const [radiusx, radiusy] = self.props.constraint.params.radius;
      rx *= radiusx;
      ry *= radiusy;
      self.createCluster(cx, cy, rx, ry);
    } else {
      self.initCluster();
    }
  }
  createCorrelation(points, padding) {
    const path = points.map((point) => this.convertToPixel(point));
    const self = this;
    const pathData = [];
    const d0 = self.convertToPixel([
      self.props.data[0][0],
      self.props.data[0][1] + padding,
    ])[1];
    const d1 = self.convertToPixel([
      self.props.data[0][0],
      self.props.data[0][1],
    ])[1];
    const width = Math.abs(d0 - d1);
    for (let i = 0; i < path.length; i++) {
      const [x, y] = path[i];
      pathData.push({ x, y: y - width });
    }
    for (let i = path.length - 1; i >= 0; i--) {
      const [x, y] = path[i];
      pathData.push({ x, y: y + width });
    }
    pathData.push({ x: path[0][0], y: path[0][1] - width });
    const line = d3
      .line()
      .curve(d3.curveCardinal.tension(0.5))
      .x((d) => d.x)
      .y((d) => d.y);
    this.svg
      .append("path")
      .datum(pathData)
      .attr("points", path)
      .attr("fill", "#d9d9d9")
      .attr("opacity", 0.2)
      .attr("stroke", "#5D7092")
      .attr("stroke-width", 2)
      .attr("d", line);
  }
  initCorrelation() {
    const self = this;
    const data = self.selectedSeriesData;
    if (data.length > 0) {
      const padding = 1;
      const regression = ecStat.regression(
        "polynomial",
        data.map((d) => [d[0], d[1]]),
        this.params.fitting
      );
      const path = regression.points;
      self.createCorrelation(path, padding);
      self.updateParams({
        polynomial_params: regression.parameter.reverse(),
        range: [
          regression.points[0][0],
          regression.points[regression.points.length - 1][0],
        ],
        path,
        padding,
      });
    }
  }
  getCorrelation() {
    this.clearSvg();
    const self = this;
    if (this.checkConstraint()) {
      const path = self.props.constraint.params.path;
      const padding = self.props.constraint.params.padding;
      self.createCorrelation(path, padding);
    } else {
      self.initCorrelation();
    }
  }
  createOrder() {
    const self = this;
    const data = Object.values(self.selectBar);
    if (data) {
      data.forEach((point) => {
        const [x, y] = self.convertToPixel(point);
        const width = (self.width * 0.7) / Object.keys(self.mapper).length;
        self.svg
          .append("rect")
          .attr("x", x - width / 2)
          .attr("y", y)
          .attr("value", point[0])
          .attr("width", width)
          .attr("height", chart_height * 0.88 - y)
          .style("fill", "#d9d9d9")
          .attr("stroke", "#5D7092")
          .attr("stroke-width", 2)
          .attr("opacity", 0.4);
      });
    }
  }
  getOrder() {
    this.clearSvg();
    const self = this;
    if (this.checkConstraint()) {
      self.selectBar = {};
      self.props.constraint.params.values.forEach((value) => {
        const data = self.props.originalData.filter((d) => d[0] == value)[0];
        self.selectBar[value] = data;
      });
      self.createOrder();
    } else {
      self.createOrder();
    }
  }
  generateData() {
    if (this.checkConstraint())
      this.selectedLegend = this.props.constraint.selectedLegend;
    const type = this.props.type;
    let option = {
      color: globalColor,
      animation: false,
    };
    if (type === "scatter") {
      option = { ...option, ...this.getScatterChartOption() };
    } else if (type === "line") {
      option = { ...option, ...this.getLineChartOption() };
    } else if (type === "bar") {
      option = { ...option, ...this.getBarChartOption() };
    }
    this.chart.clear();
    this.chart.resize({ width: this.width, height: chart_height });
    option && this.chart.setOption(option);
  }
  render() {
    return (
      <div id={"container-" + this.props.name}>
        <canvas
          width={"100%"}
          height={chart_height}
          id={"canvas-" + this.props.name}
        ></canvas>
      </div>
    );
  }
}
