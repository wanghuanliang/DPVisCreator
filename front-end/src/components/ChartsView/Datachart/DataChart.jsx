import * as echarts from "echarts";
import { Component } from "react";
import { attributeType } from "../../../data/attributes";
import * as ecStat from "echarts-stat";
import * as d3 from "d3";
import { createEllipseController } from "../Constraints/controller";
import { chart_constraint } from "../constants";
import { isArray, mean } from "lodash";
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
const chart_height = 400;
const thumbnailHeight = 60;
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
        min: "dataMin",
        max: "dataMax",
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
function getYAxisOption(attribute) {
  return {
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

const grid = {
  top: "12%",
  left: "10%",
  right: "10%",
};
export default class DataChart extends Component {
  constructor(props) {
    super(props);
    this.width = 300;
    this.mapper = {};
    this.params = props.constraint.params;
    this.selectedSeriesData = {};
    this.selectBar = {};
  }
  updateParams(params) {
    this.params = { ...this.params, ...params };
    const constraint = { ...this.props.constraint, ...this.convertToImages() };
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
    canvasImage.width = this.width / 4;
    canvasImage.height = thumbnailHeight;
    canvasImage.style = "margin:-" + (this.width / 4 + 7) + "px";
    const serializer = new XMLSerializer();
    const svgSource = serializer.serializeToString(this.svg.node());
    const svgImage = new Image();
    svgImage.setAttribute(
      "src",
      "data:image/svg+xml;base64," + btoa(reEncode(svgSource))
    );
    svgImage.width = this.width / 4;
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
      this.clearSvg();
      const type = this.props.type;
      this.props.onSelected(this.selectedSeriesData);
      if (type === "scatter") this.getCluster();
      else if (type === "line") this.getCorrelation();
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
        this.props.onSelected({ default: Object.values(self.selectBar) });
        this.getOrder();
      }
    });
    const divDom = document.getElementById("container-" + this.props.name);
    this.width = divDom.offsetWidth;
    this.generateData();
  }
  getSnapshotBeforeUpdate(prevProps, prevState) {
    if (
      prevProps.attributes[0].name !== this.props.attributes[0].name ||
      prevProps.attributes[1].name !== this.props.attributes[1].name ||
      prevProps.attributes[2].name !== this.props.attributes[2].name
    ) {
      this.selectBar = {};
      this.selectedSeriesData = {};
    }
    return prevProps;
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
    const divDom = document.getElementById("container-" + this.props.name);
    this.width = divDom.offsetWidth;
    this.generateData();
    const type = this.props.type;
    if (type === "scatter") this.getCluster();
    else if (type === "line") this.getCorrelation();
    else if (type === "bar") this.getOrder();
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
      legend: {
        data: this.props.attributes[2].values,
        left: "10%",
        top: "10%",
      },
      xAxis: getAxisOption(this.props.attributes[0]),
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
        data: this.props.attributes[2].values,
        left: "10%",
        top: "10%",
      },
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
      xAxis: getAxisOption(this.props.attributes[0], this.props.data),
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
        feature: {},
      },
      calculable: true,
      legend: {
        data: this.props.attributes[2].values,
        left: "10%",
        top: "10%",
      },
      grid,
      xAxis: getXAxisOption(this.props.attributes[0], this.props.data),
      yAxis: getYAxisOption(this.props.attributes[1]),
      series: getSeriesOption("bar", this.props.attributes[2], this.props.data),
    };
    return option;
  }
  checkConstraint() {
    // 检查约束是否完整
    const type = this.props.type;
    const constraint = this.props.constraint;
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
  getCluster() {
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
    if (this.checkConstraint()) {
      const [meanx, meany] = self.props.constraint.params.mean;
      const [cx, cy] = self.convertToPixel([meanx, meany]);
      let [rx, ry] = self.convertToPixel([meanx + 1, meany - 1]);
      rx -= cx;
      ry -= cy;
      const [radiusx, radiusy] = self.props.constraint.params.radius;
      rx *= radiusx;
      ry *= radiusy;
      this.svg
        .append("ellipse")
        .attr("opacity", "0.4")
        .attr("fill", "none")
        .attr("stroke", "#111111")
        .attr("stroke-width", 5)
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("rx", rx)
        .attr("ry", ry)
        .style("pointer-events", "auto")
        .call(
          d3
            .drag()
            .on("start", dragEllipseStart)
            .on("drag", dragEllipseDragging)
            .on("end", dragEllipseEnd)
        );
    } else {
      this.props.attributes[2].values.forEach((name) => {
        const data = self.selectedSeriesData[name];
        if (data) {
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
          this.svg
            .append("ellipse")
            .attr("opacity", "0.4")
            .attr("fill", "none")
            .attr("stroke", "#111111")
            .attr("stroke-width", 5)
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("rx", rx)
            .attr("ry", ry)
            .style("pointer-events", "auto")
            .call(
              d3
                .drag()
                .on("start", dragEllipseStart)
                .on("drag", dragEllipseDragging)
                .on("end", dragEllipseEnd)
            );
          self.updateParams({
            mean: [meanx, meany],
            radius: [Math.sqrt(varx) * 2, Math.sqrt(vary) * 2],
          });
        }
      });
    }
  }
  getCorrelation() {
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
    if (this.checkConstraint()) {
      const pathData = [];
      const path = self.props.constraint.params.path;
      const padding = self.props.constraint.params.padding;
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
        .attr("fill", "none")
        .attr("stroke-width", 5)
        .attr("stroke", "#111111")
        .attr("opacity", 0.5)
        .attr("d", line)
        .style("pointer-events", "auto")
        .call(
          d3
            .drag()
            .on("start", dragLineStart)
            .on("drag", dragLineDragging)
            .on("end", dragLineEnd)
        );
    } else {
      this.props.attributes[2].values.forEach((name, index) => {
        const data = self.selectedSeriesData[name];
        if (data) {
          const padding = 1;
          const pathData = [];
          const regression = ecStat.regression(
            "polynomial",
            data.map((d) => [d[0], d[1]]),
            this.params.fitting
          );
          const d0 = self.convertToPixel([
            regression.points[0][0],
            regression.points[0][1] + padding,
          ])[1];
          const d1 = self.convertToPixel([
            regression.points[0][0],
            regression.points[0][1],
          ])[1];
          const width = Math.abs(d0 - d1);
          const path = regression.points.map((point) =>
            this.convertToPixel(point)
          );
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
            .attr("fill", "none")
            .attr("stroke-width", 5)
            .attr("stroke", "#111111")
            .attr("opacity", 0.5)
            .attr("d", line)
            .style("pointer-events", "auto")
            .call(
              d3
                .drag()
                .on("start", dragLineStart)
                .on("drag", dragLineDragging)
                .on("end", dragLineEnd)
            );
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
      });
    }
  }
  getOrder() {
    const self = this;
    if (this.checkConstraint()) {
      self.selectBar = {};
      self.props.constraint.params.values.forEach((value) => {
        const data = self.props.data.filter((d) => d[0] == value)[0];
        self.selectBar[value] = data;
      });
      const data = Object.values(self.selectBar);
      if (data) {
        data.forEach((point) => {
          const [x, y] = self.convertToPixel(point);
          const width = (self.width * 0.8) / Object.keys(self.mapper).length;
          self.svg
            .append("rect")
            .attr("x", x - width / 2)
            .attr("y", y)
            .attr("value", point[0])
            .attr("width", width)
            .attr("height", chart_height * 0.85 - y)
            .style("fill", "#111111")
            .attr("opacity", 0.5);
        });
      }
    } else {
      const data = Object.values(self.selectBar);
      if (data) {
        data.forEach((point) => {
          const [x, y] = self.convertToPixel(point);
          const width = (self.width * 0.8) / Object.keys(self.mapper).length;
          self.svg
            .append("rect")
            .attr("x", x - width / 2)
            .attr("y", y)
            .attr("value", point[0])
            .attr("width", width)
            .attr("height", chart_height * 0.85 - y)
            .style("fill", "#111111")
            .attr("opacity", 0.5);
          self.updateParams({ values: Object.keys(self.selectBar) });
        });
      }
    }
  }
  generateData() {
    const type = this.props.type;
    let option = {
      color: globalColor,
    };
    this.clearSvg();
    if (type === "scatter") {
      option = { ...option, ...this.getScatterChartOption() };
    } else if (type === "line") {
      option = { ...option, ...this.getLineChartOption() };
    } else if (type === "bar") {
      option = { ...option, ...this.getBarChartOption() };
    }
    this.svg.style("width", this.width);
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
