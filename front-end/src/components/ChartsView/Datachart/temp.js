// getScatterCluster() {
//     const self = this;
//     this.props.attributes[2].value.forEach((name) => {
//       const data = self.selectedSeriesData[name];
//       if (data) {
//         const xSamples = data.map((d) => d[0]);
//         const ySamples = data.map((d) => d[1]);
//         const meanx = ecStat.statistics.mean(xSamples);
//         const varx = ecStat.statistics.sampleVariance(xSamples);
//         const meany = ecStat.statistics.mean(ySamples);
//         const vary = ecStat.statistics.sampleVariance(ySamples);
//         const [cx, cy] = self.convertToPixel([meanx, meany]);
//         let [rx, ry] = self.convertToPixel([
//           meanx + 1,
//           meany - Math.sqrt(vary),
//         ]);
//         rx = (rx - cx) * Math.sqrt(varx);
//         ry -= cy;
//         const controller = createEllipseController(cx, cy, rx, ry);
//         this.svg.node().appendChild(controller.node());
//       }
//     });
//   }
//   getLineCluster() {
//     const regressions = [];
//     const self = this;
//     this.props.attributes[2].value.forEach((name, index) => {
//       const data = self.selectedSeriesData[name];
//       if (data) {
//       }
//     });
//   }
//   getBarCluster() {
//     const self = this;
//     this.props.attributes[2].value.forEach((name, index) => {
//       const data = self.selectedSeriesData[name];
//       if (data) {
//         data.forEach((point) => {
//           const [x, y] = self.convertToPixel(point);
//           self.svg
//             .append("circle")
//             .attr("cx", x)
//             .attr("cy", y)
//             .attr("r", 5)
//             .style("fill", globalColor[index])
//             .attr("opacity", 0.5)
//             .style("pointer-events", "auto")
//             .call(d3.drag().on("drag", dragBarY));
//         });
//       }
//     });
//   }
// this.svg = d3
//   .select("#container-" + this.props.id)
//   .append("svg")
//   .style("width", this.width)
//   .style("height", 300)
//   .style("position", "absolute")
//   .style("left", 12)
//   .style("pointer-events", "none");
// d3.selectAll("#container-" + this.props.id + " > svg > *").remove();
