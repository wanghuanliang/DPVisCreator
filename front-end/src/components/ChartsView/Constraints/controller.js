import * as d3 from "d3";
import * as _ from "lodash";
export function createEllipseController(selector, meanx, meany, varx, vary) {
  const cx = meanx;
  const cy = meany;
  const rx = 2 * varx;
  const ry = 2 * vary;
  let scaleX = 1.0;
  let scaleY = 1.0;
  let rotate = 0;
  let dx = 0;
  let dy = 0;
  let startX = 0;
  let startY = 0;
  function onStart(d) {
    const event = d3.event;
    [startX, startY] = [event.x, event.y];
  }
  function dragScatterEllipse(d) {
    const event = d3.event;
    console.log(event.x, event.y);
    [dx, dy] = [event.x - startX, event.y - startY];
    setTransform();
  }
  _.debounce(dragScatterEllipse, 100);
  function dragXScale(d) {
    const event = d3.event;
    setScaleX(event.x, event.y);
    setTransform();
  }
  function dragYScale(d) {
    const event = d3.event;
    setScaleY(event.x, event.y);
    setTransform();
  }
  function dragScale(d) {
    const event = d3.event;
    const [x, y] = getPrerotated(event.x, event.y);
    scaleX = x / rx;
    scaleY = y / ry;
    setTransform();
  }
  function dragRotate(d) {
    const event = d3.event;
    const [x, y] = [event.x, event.y];
    setRotate(x, y);
    setTransform();
  }
  function setRotate(x, y) {
    const diffX = x - cx;
    const diffY = cy - y;
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);
    const acos = Math.acos(diffY / distance);
    const angle = diffX > 0 ? acos : -acos;
    rotate = (angle * 180) / Math.PI;
  }
  function setTransform(d) {
    d3.select(selector + " > g").attr(
      "transform",
      `translate(${dx},${dy}) rotate(${rotate},${cx + dx},${
        cy + dy
      }) scale(${scaleX} ${scaleY})`
    );
  }
  function getPrerotated(x, y) {
    const diffX = x - cx;
    const diffY = y - cy;
    return [
      Math.abs(diffX * Math.cos(rotate) - diffY * Math.sin(rotate)),
      Math.abs(diffX * Math.sin(rotate) + diffY * Math.cos(rotate)),
    ];
  }
  function setScaleX(x, y) {
    scaleX = getPrerotated(x, y)[0] / rx;
    return scaleX;
  }
  function setScaleY(x, y) {
    scaleY = getPrerotated(x, y)[1] / ry;
    return scaleY;
  }
  const ellipse = (d) =>
    d
      .append("ellipse")
      .attr("fill", "#111111")
      .attr("opacity", "0.4")
      .attr("stroke", "#111111")
      .attr("stroke-width", 1.5)
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("rx", rx)
      .attr("ry", ry)
      .style("pointer-events", "auto")
      .call(d3.drag().on("start", onStart).on("drag", dragScatterEllipse));
  const right = getRectForPoint(
    cx + rx,
    cy,
    d3.drag().on("start", onStart).on("drag", dragXScale)
  );
  const left = getRectForPoint(
    cx - rx,
    cy,
    d3.drag().on("start", onStart).on("drag", dragXScale)
  );
  const top = getRectForPoint(
    cx,
    cy - ry,
    d3.drag().on("start", onStart).on("drag", dragYScale)
  );
  const bottom = getRectForPoint(
    cx,
    cy + ry,
    d3.drag().on("start", onStart).on("drag", dragYScale)
  );
  const rightTop = getRectForPoint(
    cx + rx,
    cy - ry,
    d3.drag().on("start", onStart).on("drag", dragScale)
  );
  const leftTop = getRectForPoint(
    cx - rx,
    cy - ry,
    d3.drag().on("start", onStart).on("drag", dragScale)
  );
  const rightBottom = getRectForPoint(
    cx + rx,
    cy + ry,
    d3.drag().on("drag", dragScale)
  );
  const leftBottom = getRectForPoint(
    cx - rx,
    cy + ry,
    d3.drag().on("drag", dragScale)
  );
  const rotater = getRectForPoint(
    cx,
    cy - ry - 20,
    d3.drag().on("drag", dragRotate)
  );
  return (d) =>
    d
      .append("g")
      .call(ellipse)
      .call(right)
      .call(left)
      .call(top)
      .call(bottom)
      .call(rightTop)
      .call(leftTop)
      .call(rightBottom)
      .call(leftBottom);
}

function getRectForPoint(x, y, caller, width = 5) {
  return (d) =>
    d
      .append("rect")
      .attr("x", x - width)
      .attr("y", y - width)
      .attr("width", 2 * width)
      .attr("height", 2 * width)
      .attr("stroke", "#111111")
      .attr("stroke-width", 2)
      .style("pointer-events", "auto")
      .call(caller);
}
