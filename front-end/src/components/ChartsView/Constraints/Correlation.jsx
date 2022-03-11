import React, { Component } from "react";
import * as d3 from "d3";
import * as ecStat from "echarts-stat";
class Correlation extends Component {
  constructor(props) {
    super(props);
    this.id = props.id;
    this.callback = props.callback;
  }
  componentDidMount() {
    const pathData = [];
    const regression = ecStat.regression(
      "polynomial",
      this.props.data,
      this.props.fit
    );
    regression.points.forEach((point) => {
      const [x, y] = this.props.convertToPixel(point);
      pathData.push({ x, y });
    });
    const line = d3
      .line()
      .curve(d3.curveCardinal.tension(0.5))
      .x((d) => d.x)
      .y((d) => d.y);
    this.svg = d3.select("#" + this.id);
    this.svg
      .append("path")
      .datum(pathData)
      .attr("fill", "none")
      .attr("stroke", "#111111")
      .attr("stroke-width", 10)
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
  }
  render() {
    return <svg id={this.id}></svg>;
  }
}
function dragLineStart(event, d) {
  d3.select(this).attr("cy", event.y);
}
function dragLineDragging(event, d) {
  const width = Math.abs(parseFloat(d3.select(this).attr("cy")) - event.y);
  d3.select(this).attr("stroke-width", width);
}
function dragLineEnd(event, d) {
  const width = Math.abs(parseFloat(d3.select(this).attr("cy")) - event.y);
  console.log(width);
}
