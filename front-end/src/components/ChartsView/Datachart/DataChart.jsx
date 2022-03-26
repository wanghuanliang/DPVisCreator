import * as echarts from "echarts";
import { Component } from "react";
import * as ecStat from "echarts-stat";
import * as d3 from "d3";
import { chart_constraint } from "../constants";
import { isArray, mean } from "lodash";
const globalColor = [
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
const thumbnailHeight = 56;
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
function getYAxisOption(attribute) {
  return {
    type: "value",
    id: attribute.name,
    name: attribute.name,
    nameGap: "45",
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
export default class DataChart extends Component {
  constructor(props) {
    super(props);
    this.width = 345;
    this.mapper = {};
    this.params = {};
    this.selectedSeriesData = [];
    this.selectBar = {};
    this.selectedLegend = {};
    this.brushArea = {};
  }
  updateParams(params) {
    this.params = { ...this.params, ...params };
    this.generateData();
    const constraint = {
      ...this.props.constraint,
      ...this.convertToImages(),
      selectedLegend: this.selectedLegend,
    };
    this.props.updateConstraintParams(constraint, this.params);
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
  convertToImages() {
    function reEncode(data) {
      return decodeURIComponent(
        encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, (match, p1) => {
          const c = String.fromCharCode(`0x${p1}`);
          return c === "%" ? "%25" : c;
        })
      );
    }
    const canvas = document.getElementById("canvas-" + this.props.name);
    const canvasImage = new Image();
    canvasImage.src = canvas.toDataURL("image/png");
    canvasImage.width = this.width / 6;
    canvasImage.height = thumbnailHeight;
    canvasImage.style = "margin:-" + this.width / 6 + "px";
    const serializer = new XMLSerializer();
    const svgSource = serializer.serializeToString(this.svg.node());
    const svgImage = new Image();
    svgImage.setAttribute(
      "src",
      "data:image/svg+xml;base64," + btoa(reEncode(svgSource))
    );
    svgImage.width = this.width / 6;
    svgImage.height = thumbnailHeight;

    return { canvasImage, svgImage };
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
    this.chart.on("brushSelected", (params) => {
      const seriesData = [];
      params.batch[0]?.selected.forEach((series) => {
        const name = series.seriesName;
        const data = self.props.data.filter((data) => data[2] == name); // 仅比较值
        const selectedData = [];
        series.dataIndex.forEach((index) => {
          selectedData.push(data[index]);
        });
        seriesData.push(...selectedData);
      });
      this.selectedSeriesData = seriesData;
    });
    this.chart.on("legendSelectChanged", (params) => {
      this.selectedLegend = params.selected;
    });
    this.chart.on("brushEnd", (params) => {
      const area = params.areas[0];
      if (area) {
        this.brushArea = { type: area.brushType, range: area.range };
      }
      const type = this.props.type;
      const data = JSON.parse(JSON.stringify(this.selectedSeriesData));
      if (type === "scatter") this.initCluster();
      else if (type === "line") this.initCorrelation();
      this.props.onSelected(data);
      this.generateData();
    });
    this.chart.on("click", (params) => {
      if (this.props.type === "bar" && this.props.name === "original-chart") {
        if (this.selectBar[params.data[0]])
          delete this.selectBar[params.data[0]];
        else
          this.selectBar[params.data[0]] = self.props.data.filter(
            (d) => d[0] == params.data[0]
          )[0];
        d3.selectAll("#container-" + this.props.name + " > svg > *").remove();
        self.updateParams({ values: Object.keys(self.selectBar) });
        this.props.onSelected(Object.values(self.selectBar));
        this.getOrder();
      }
    });
    const divDom = document.getElementById("container-" + this.props.name);
    this.width = 345;
    this.generateData();
  }
  getSnapshotBeforeUpdate(prevProps, prevState) {
    if (
      prevProps.type !== this.props.type ||
      prevProps.attributes[0].name !== this.props.attributes[0].name ||
      prevProps.attributes[1].name !== this.props.attributes[1].name ||
      prevProps.attributes[2].name !== this.props.attributes[2].name ||
      (!isNaN(this.props.constraint.x_step) &&
        prevProps.constraint.x_step !== this.props.constraint.x_step) // 确保step修改后重置
    ) {
      this.selectBar = {};
      this.selectedSeriesData = [];
      const selected = {};
      this.props.attributes[2].values.forEach((value) => {
        selected[value] = true;
      });
      this.selectedLegend = selected;
      this.params = {};
      this.brushArea = {};
    }
    return null;
  }
  componentDidUpdate() {
    let mapper = {};
    // 解决枚举类型为数字后，被echarts解析为数值索引的问题
    this.props.data.forEach((d, index) => {
      if (!mapper[d[0]]) {
        mapper[d[0]] = index;
      }
    });
    this.mapper = mapper;
    const divDom = document.getElementById("container-" + this.props.name);
    this.width = 345;
    this.generateData();
    const type = this.props.type;
    if (type === "scatter") this.getCluster();
    else if (type === "line") this.getCorrelation();
    else if (type === "bar") this.getOrder();
  }
  getLegendOption() {
    const values = this.props.attributes[2].values;
    let show = true;
    if (values.length === 1 && values[0] === "default") {
      show = false;
    }
    return {
      data: values.map((value) => value.toString()), // echarts数字0123……无法正常显示，需转成字符
      show,
      left: "10%",
      width: "60%",
      top: "3%",
      selected: this.selectedLegend,
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
        top: "2%",
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
      legend: this.getLegendOption(),
      grid,
      toolbox: {
        top: "2%",
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
        ...getSeriesOption(
          "line",
          this.props.attributes[2],
          this.props.data,
          2
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
      yAxis: getYAxisOption(this.props.attributes[1], "y"),
      series: getSeriesOption("bar", this.props.attributes[2], this.props.data),
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
        params.padding_top &&
        params.padding_bottom &&
        params.range &&
        params.fitting
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
    function dragEllipseStart(d) {
      const event = d3.event;
      d3.select(this).attr("cx", event.x);
      d3.select(this).attr("cy", event.y);
    }
    function dragEllipseDragging(d) {
      const event = d3.event;
      d3.select(this).attr("cx", event.x);
      d3.select(this).attr("cy", event.y);
    }
    function dragEllipseEnd(d) {
      const event = d3.event;
      const mean = self.convertFromPixel([event.x, event.y]);
      self.updateParams({ mean });
    }
    if (type === "rect") {
      const [x, y] = [range[0][0], range[0][1]];
      const [width, height] = [
        range[1][0] - range[0][0],
        range[1][1] - range[0][1],
      ];
      this.svg
        .append("rect")
        .attr("opacity", "0.4")
        .attr("fill-opacity", "0.5")
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
        .attr("fill-opacity", "0.5")
        .attr("fill", "#d9d9d9")
        .attr("stroke", "#5D7092")
        .attr("stroke-width", 2)
        .attr("points", range);
    }
  }
  initCluster() {
    const self = this;
    const data = self.selectedSeriesData;
    const type = self.brushArea.type;
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
      self.updateParams({
        type,
        area:
          type === "rect"
            ? [
                self.convertFromPixel([
                  self.brushArea.range[0][0],
                  self.brushArea.range[1][0],
                ]),
                self.convertFromPixel([
                  self.brushArea.range[0][1],
                  self.brushArea.range[1][1],
                ]),
              ]
            : self.brushArea.range.map((point) => self.convertFromPixel(point)),
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
    } else {
      self.initCluster();
    }
  }
  createCorrelation(points, paddingTop, paddingBottom) {
    const path = points.map((point) => this.convertToPixel(point));
    const self = this;
    function dragLineStart(d) {
      const event = d3.event;
      d3.select(this).attr("cy", event.y);
    }
    function dragLineDragging(d) {
      const event = d3.event;
      const width = Math.abs(parseFloat(d3.select(this).attr("cy")) - event.y);
      const values = d3.select(this).attr("points").split(",");
      const path = [];
      for (let i = 0; i < values.length / 2; i++) {
        path.push([values[i * 2], values[i * 2 + 1]]);
      }
      const pathData = [];
      for (let i = 0; i < path.length; i++) {
        const [x, y] = path[i];
        pathData.push({ x, y: parseFloat(y) - width });
      }
      for (let i = path.length - 1; i >= 0; i--) {
        const [x, y] = path[i];
        pathData.push({ x, y: parseFloat(y) + width });
      }
      pathData.push({ x: path[0][0], y: path[0][1] - width });
      const line = d3
        .line()
        .curve(d3.curveCardinal.tension(0.5))
        .x((d) => d.x)
        .y((d) => d.y);
      d3.select(this).datum(pathData).attr("d", line);
    }
    function dragLineEnd(d) {
      const event = d3.event;
      const padding = Math.abs(
        self.convertFromPixel([
          event.x,
          parseFloat(d3.select(this).attr("cy")),
        ])[1] - self.convertFromPixel([event.x, event.y])[1]
      );
      self.updateParams({ padding });
    }
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
      .attr("opacity", 0.2)
      .attr("stroke", "#5D7092")
      .attr("stroke-width", 2)
      .attr("d", pathString);
  }
  updateCorrelation() {
    const self = this;
    const constraint = self.props.constraint;
    const params = constraint.params;
    const fitting = this.props.constraint.params.fitting;
    const data = self.props.data.filter(
      (data) => data[0] >= params.range[0] && data[0] <= params.range[1]
    );
    if (data.length > 0) {
      const regression = ecStat.regression(
        "polynomial",
        data.map((d) => [d[0], d[1]]),
        fitting
      );
      const padding = params.padding;
      const path = regression.points;
      const upper = [];
      const lower = [];
      for (let i = 0; i < data.length; i++) {
        const dist = data[i][1] - path[i][1];
        if (dist >= 0) upper.push(dist);
        else lower.push(-dist);
      }
      const paddingTop = Math.max(...upper);
      const paddingBottom = Math.max(...lower);
      self.createCorrelation(path, paddingTop, paddingBottom);
      self.updateParams({
        polynomial_params: regression.parameter.reverse(),
        range: [
          regression.points[0][0],
          regression.points[regression.points.length - 1][0],
        ],
        fitting,
        path,
        padding,
        padding_top: paddingTop,
        padding_bottom: paddingBottom,
      });
    }
  }
  initCorrelation() {
    const self = this;
    const data = self.selectedSeriesData;
    const fitting = this.props.constraint.params.fitting;
    if (data.length > 0) {
      const regression = ecStat.regression(
        "polynomial",
        data.map((d) => [d[0], d[1]]),
        fitting
      );
      const path = regression.points;
      const upper = [];
      const lower = [];
      for (let i = 0; i < data.length; i++) {
        const dist = data[i][1] - path[i][1];
        if (dist >= 0) upper.push(dist);
        else lower.push(-dist);
      }
      const paddingTop = Math.max(...upper);
      const paddingBottom = Math.max(...lower);
      const pixel = self.convertToPixel(path[0]);
      const value = self.convertFromPixel([pixel[0], pixel[1] - 20]);
      const padding = value[1] - path[0][1];
      self.createCorrelation(path, paddingTop, paddingBottom);
      self.updateParams({
        polynomial_params: regression.parameter.reverse(),
        range: [
          regression.points[0][0],
          regression.points[regression.points.length - 1][0],
        ],
        fitting,
        path,
        padding,
        padding_top: paddingTop,
        padding_bottom: paddingBottom,
      });
    }
  }
  getCorrelation() {
    this.clearSvg();
    const self = this;
    if (this.checkConstraint()) {
      if (self.props.constraint.params.fitting !== self.params.fitting)
        self.updateCorrelation();
      else {
        const path = self.props.constraint.params.path;
        const paddingTop = self.props.constraint.params.padding_top;
        const paddingBottom = self.props.constraint.params.padding_bottom;
        self.createCorrelation(path, paddingTop, paddingBottom);
      }
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
        let width = (self.width * 0.78) / Object.keys(self.mapper).length;
        width *= 0.9;
        width = width > 48 ? 48 : width;
        self.svg
          .append("rect")
          .attr("x", x - width / 2)
          .attr("y", y)
          .attr("value", point[0])
          .attr("width", width)
          .attr("height", chart_height * 0.88 - y)
          .style("fill", "#d9d9d9")
          .attr("stroke", "#5D7092")
          .attr("stroke-width", 1)
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
        const data = self.props.data.filter((d) => d[0] == value)[0];
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
