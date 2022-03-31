import * as echarts from "echarts";
import { Component } from "react";
import * as ecStat from "echarts-stat";
import * as d3 from "d3";
import {
  chart_constraint,
  constraint_chart,
  RENDER_MODE,
} from "../../ChartsView/constants";
import { isArray, mean } from "lodash";
const renderMode = RENDER_MODE;
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
    show: true,
  },
  axisPointer: {
    show: false,
  },
};
const grid = {
  top: "18%",
  left: "20%",
  right: "2%",
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
function getXAxisOption(attribute, step = NaN, width = 0) {
  return {
    type: "category",
    id: attribute.name,
    name: attribute.name,
    nameGap: "18",
    axisLabel: {
      padding: isNaN(step) ? [0, 0, 0, 0] : [0, 0, 0, -width],
      fontSize: 10,
    },
    axisPointer: {
      show: true,
      label: {
        formatter: function (params) {
          const value = params.value;
          const end = parseInt(value) + step - 1;
          return isNaN(step) || step <= 1 ? value : "" + value + "-" + end;
        },
      },
    },
    ...axisOption,
  };
}
function getYAxisOption(attribute, min = null, computation = "count") {
  return {
    type: "value",
    id: attribute.name,
    name: attribute.name,
    nameGap: "45",
    min: function (value) {
      const axisMin = min ? Math.min(value.min, min) : value.min;
      let parse = axisMin - (value.max - axisMin) * 0.2;
      if (computation === "count") parse = parseInt(parse);
      return axisMin >= 0 ? (parse >= 0 ? parse : 0) : parse;
    },
    axisLine: {
      show: true,
    },
    axisTick: {
      show: true,
    },
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
    this.width = 345;
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
    this.chart =
      renderMode === "canvas"
        ? echarts.init(chartDom)
        : echarts.init(chartDom, "", { renderer: "svg" });
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
    this.width = 345;
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
    this.width = 345;
    this.generateData();
    const type = this.props.type;
    if (this.props.showConstraint) {
      if (type === "scatter") this.getCluster();
      else if (type === "line") this.getCorrelation();
      else if (type === "bar") this.getOrder();
    } else {
      this.clearSvg();
    }
  }
  getLegendOption() {
    const values = this.props.attributes[2].values;
    let show = true;
    if (values.length === 1 && values[0] === "default") {
      show = false;
    }
    const names = values.map((value) => value.toString());
    const data =
      this.props.type === "bar" ? names : ["original_data", ...names]; // echarts数字0123……无法正常显示，需转成字符
    return {
      data,
      show,
      left: "10%",
      width: "60%",
      top: "3%",
      selected: {
        original_data: this.props.showConstraint ? true : false,
        ...this.selectedLegend,
      },
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
    const originalDataY = this.props.originalData.map((d) => d[1]);
    const dataMin = Math.min(...originalDataY);
    const dataMax = Math.max(...originalDataY);
    const axisYMin = parseInt(dataMin - (dataMax - dataMin) * 0.2);
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
      barMaxWidth: "40",
      xAxis: getXAxisOption(
        this.props.attributes[0],
        this.props.constraint.x_step,
        (this.width * 0.78) / Object.keys(this.mapper).length
      ),
      yAxis: getYAxisOption(
        this.props.attributes[1],
        axisYMin,
        this.props.constraint.computation
      ),
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
      if (params.type && isArray(params.area) && params.area.length >= 2)
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
  createCluster(type, range) {
    const self = this;
    if (type === "rect") {
      const [x, y] = [range[0][0], range[0][1]];
      const [width, height] = [
        range[1][0] - range[0][0],
        range[1][1] - range[0][1],
      ];
      this.svg
        .append("rect")
        .attr("opacity", "0.4")
        .attr("fill-opacity", "0")
        .attr("fill", "#d9d9d9")
        .attr("stroke", "#5D7092")
        .attr("stroke-width", 2)
        .attr("x", x)
        .attr("y", y)
        .attr("width", width)
        .attr("height", height);
    } else if (type === "polygon") {
      this.svg
        .append("polygon")
        .attr("opacity", "0.4")
        .attr("fill-opacity", "0")
        .attr("fill", "#d9d9d9")
        .attr("stroke", "#5D7092")
        .attr("stroke-width", 2)
        .attr("points", range);
    }
  }
  getCluster() {
    this.clearSvg();
    const self = this;
    if (this.checkConstraint()) {
      const [meanx, meany] = self.props.constraint.params.mean;
      const { type, area } = self.props.constraint.params;
      const [cx, cy] = self.convertToPixel([meanx, meany]);
      let [rx, ry] = self.convertToPixel([meanx + 1, meany - 1]);
      rx -= cx;
      ry -= cy;
      const [radiusx, radiusy] = self.props.constraint.params.radius;
      rx *= radiusx;
      ry *= radiusy;
      self.createCluster(
        type,
        area.map((value) => self.convertToPixel(value))
      );
    }
  }
  createCorrelation(points, paddingTop, paddingBottom) {
    const path = points.map((point) => this.convertToPixel(point));
    const self = this;
    const pathData = [];
    const d0 = self.convertToPixel([
      self.props.data[0][0],
      self.props.data[0][1],
    ])[1];
    const d1 = self.convertToPixel([
      self.props.data[0][0],
      self.props.data[0][1] + paddingTop,
    ])[1];
    const d2 = self.convertToPixel([
      self.props.data[0][0],
      self.props.data[0][1] + paddingBottom,
    ])[1];
    const topWidth = Math.abs(d1 - d0);
    const bottomWidth = Math.abs(d2 - d0);
    const topPath = [];
    for (let i = 0; i < path.length; i++) {
      const [x, y] = path[i];
      topPath.push({ x, y: y - topWidth });
    }
    const bottomPath = [];
    for (let i = path.length - 1; i >= 0; i--) {
      const [x, y] = path[i];
      bottomPath.push({ x, y: y + bottomWidth });
    }
    const line1 = d3
      .line()
      .curve(d3.curveCardinal.tension(0.5))
      .x((d) => d.x)
      .y((d) => d.y);
    const line2 = d3
      .line()
      .curve(d3.curveCardinal.tension(0.5))
      .x((d) => d.x)
      .y((d) => d.y);
    const p1 = this.svg
      .append("path")
      .datum(topPath)
      .attr("d", line1)
      .attr("d");
    const p2 = this.svg
      .append("path")
      .datum(bottomPath)
      .attr("d", line2)
      .attr("d");
    const pathString = p1 + "L" + p2.substring(1) + "Z";
    this.clearSvg();
    this.svg
      .append("path")
      .attr("points", path)
      .attr("fill", "#d9d9d9")
      .attr("fill-opacity", "0")
      .attr("opacity", 0.2)
      .attr("stroke", "#5D7092")
      .attr("stroke-width", 2)
      .attr("d", pathString);
  }
  getCorrelation() {
    this.clearSvg();
    const self = this;
    if (this.checkConstraint()) {
      const path = self.props.constraint.params.path;
      const paddingTop = self.props.constraint.params.padding_top;
      const paddingBottom = self.props.constraint.params.padding_bottom;
      self.createCorrelation(path, paddingTop, paddingBottom);
    }
  }
  createOrder() {
    const self = this;
    const data = Object.values(self.selectBar);
    if (data) {
      data.forEach((point) => {
        const [x, y] = self.convertToPixel(point);
        let width = (self.width * 0.68) / Object.keys(self.mapper).length;
        width *= 0.9;
        width = width > 48 ? 48 : width;
        self.svg
          .append("rect")
          .attr("x", x - width / 2)
          .attr("y", y)
          .attr("value", point[0])
          .attr("width", width)
          .attr("height", chart_height * 0.88 - y)
          .style("fill", "#b3b3b3")
          // .attr("stroke", "#5D7092")
          // .attr("stroke-width", 1)
          .attr("opacity", 0.5);
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
        {renderMode === "canvas" ? (
          <canvas
            width={"100%"}
            height={chart_height}
            id={"canvas-" + this.props.name}
          ></canvas>
        ) : (
          <div
            width={"100%"}
            height={chart_height}
            id={"canvas-" + this.props.name}
          ></div>
        )}
      </div>
    );
  }
}
