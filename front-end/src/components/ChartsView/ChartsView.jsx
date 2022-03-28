import React, { Component } from "react";
import { Button, Col, Row, Switch } from "antd";
import ChartMenu from "./ChartMenu";
import ChartDisplay from "./ChartDisplay";
import ConstraintSelect from "./Datachart/ConstraintSelect";
import { chart_constraint, constraint_chart } from "./constants";
import "./ChartsView.less";
import Title from "antd/lib/typography/Title";
import { getModelData } from "../../services/api";
class ChartsView extends Component {
  constructor(props) {
    super(props);
    this.setConstraints = () => {
      this.props.setConstraints(this.state.constraints);
    };
    this.constraintId = 0;
    this.state = {
      constraints: [],
      shouldShowShadow: true,
      original_constraint: {},
      original_chart_data: [],
      protected_chart_data: [],
    };
  }
  initConstraint(settings) {
    const constraint = {
      type: chart_constraint[settings.chart_type],
      selected: true,
      computation: settings.computation,
      x_axis: settings.x_axis,
      y_axis: settings.y_axis,
      color: settings.color,
      x_step: settings.x_step,
      params: {
        fitting: settings.fitting,
      },
    };
    this.getData("original", this.props.original_data, constraint);
  }
  getData(type, type_data, constraint) {
    const [x, y, computation, color, fitting, chartType, step] = [
      this.props.attribute_character[constraint.x_axis],
      constraint.y_axis
        ? this.props.attribute_character[constraint.y_axis]
        : null,
      constraint.computation,
      constraint.color
        ? this.props.attribute_character[constraint.color]
        : { attribute_type: "Dimensions", values: ["default"] },
      null,
      constraint_chart[constraint.type],
      constraint.x_step,
    ];
    const dataset = [];
    if (computation !== null) {
      const range = [];
      if (isNaN(step)) {
        type_data.forEach((data) => {
          if (!range.includes(data[constraint.x_axis])) {
            range.push(data[constraint.x_axis]);
          }
        });
        if (x.attribute_type === "Measures")
          range.push(this.props.attribute_character[constraint.x_axis].max + 1);
        range.sort((a, b) => a - b);
      } else {
        let { min, max } = this.props.attribute_character[constraint.x_axis];
        for (let i = min; i <= max + step; i += step) {
          range.push(i);
        }
      }
      const cart = []; // 笛卡尔积
      range.forEach((value) => {
        color.values.forEach((colorName) => {
          cart.push({
            value,
            color: colorName,
          });
        });
      });
      if (x.attribute_type === "Measures") {
        const colors = color.values.length;
        for (let i = 0; i < cart.length - colors; i++) {
          let current = cart[i];
          let next = cart[i + colors];
          let sum = 0;
          const arr = type_data.filter(
            (data) =>
              data[constraint.x_axis] >= current.value &&
              data[constraint.x_axis] < next.value &&
              (current.color === "default" ||
                current.color === data[constraint.color])
          );
          if (arr.length === 0) continue;
          arr.forEach((element) => (sum += element[constraint.y_axis]));
          dataset.push([
            current.value,
            computation === "count"
              ? arr.length
              : sum / (arr.length === 0 ? 1 : arr.length),
            current.color,
            arr.map((element) => element.index),
          ]);
        }
      } else {
        for (let i = 0; i < cart.length; i++) {
          let current = cart[i];
          let sum = 0;
          const arr = type_data.filter(
            (data) =>
              data[constraint.x_axis] === current.value &&
              (current.color === "default" ||
                current.color === data[constraint.color])
          );
          arr.forEach((element) => (sum += element[constraint.y_axis]));
          dataset.push([
            current.value,
            computation === "count"
              ? arr.length
              : sum / (arr.length === 0 ? 1 : arr.length),
            current.color,
            arr.map((element) => element.index),
          ]);
        }
      }
    } else {
      const dataMap = [];
      type_data.forEach((data) => {
        let d = [];
        if (isNaN(step)) {
          d = [
            data[constraint.x_axis],
            data[constraint.y_axis],
            constraint.color ? data[constraint.color] : "default",
          ];
        } else {
          d = [
            x.attribute_type === "Measures"
              ? data[constraint.x_axis] -
                ((data[constraint.x_axis] -
                  this.props.attribute_character[constraint.x_axis].min) %
                  step)
              : data[constraint.x_axis],
            data[constraint.y_axis],
            constraint.color ? data[constraint.color] : "default",
          ];
        }
        const target = dataMap.filter(
          (value) => value[0] === d[0] && value[1] === d[1] && value[2] === d[2]
        );
        if (target.length === 0) {
          dataMap.push([...d, [data.index]]);
        } else {
          target[0][3].push(data.index);
        }
      });
      dataset.push(...dataMap);
    }
    dataset.sort((a, b) => a[0] - b[0]);
    // if (chartType === "line" || chartType === "scatter")
    //   dataset.sort((a, b) => a[0] - b[0]);
    // // 折线图按x值从小到大
    // else if (chartType === "bar") dataset.sort((a, b) => b[1] - a[1]); // 条形图按y值从大到小
    if (type === "original") {
      this.setState({
        original_constraint: constraint,
        original_chart_data: dataset,
      });
    }
  }
  insertConstraint(constraint) {
    const constraints = this.state.constraints;
    constraints.push({
      ...constraint,
      id: "P" + this.constraintId,
      newly: true,
    });
    this.constraintId++;
    const index = constraints.length - 1;
    this.creatingNewConstraint = true;
    this.setState({
      constraints,
      original_constraint: constraints[index],
    });
    this.setConstraints();
  }
  updateConstraint(constraint) {
    const constraints = this.state.constraints;
    const index = constraints.findIndex((value) => value.id === constraint.id);
    if (index >= 0) {
      constraints[index] = { ...constraints[index], ...constraint };
      this.getData("original", this.props.original_data, constraint);
      this.setState({ constraints });
      this.setConstraints();
    } else {
      this.setState({ original_constraint: constraint });
    }
  }
  updateConstraintParams(constraint, params) {
    constraint.params = { ...constraint.params, ...params };
    const constraints = this.state.constraints;
    const index = constraints.findIndex((value) => value.id === constraint.id);
    if (index >= 0) {
      constraints[index] = { ...constraints[index], ...constraint };
      this.getData("original", this.props.original_data, constraint);
      this.setState({ constraints });
    } else {
      this.setState({ original_constraint: constraint });
    }
  }
  removeConstraint(constraint) {
    const constraints = this.state.constraints;
    const index = constraints.findIndex((value) => value.id === constraint.id);
    constraints.splice(index, 1);
    this.setState({ constraints });
    this.setConstraints();
  }
  selectConstraint(type, index) {
    if (type === "original") {
      this.getData(
        type,
        this.props.original_data,
        this.state.constraints[index]
      );
    }
  }
  getShowingParameters() {
    const total = this.props.original_data.length;
    const currentSelected = this.state.original_constraint.data
      ? this.state.original_constraint.data.length
      : 0;
    const totalSelectedData = [];
    const constraints = this.state.constraints;
    const patterns = constraints.filter((constraint) => constraint.selected);
    const attributes = [];
    patterns.forEach((pattern) => {
      const selectedData = pattern.data;
      selectedData.forEach((d) => {
        if (!totalSelectedData.includes(d)) totalSelectedData.push(d);
      });
      if (!attributes.includes(pattern.x_axis)) attributes.push(pattern.x_axis);
      if (!attributes.includes(pattern.y_axis)) attributes.push(pattern.y_axis);
      if (pattern.color && !attributes.includes(pattern.color))
        attributes.push(pattern.color);
    });
    const totalSelected = totalSelectedData.length;
    return {
      current: {
        "Currently selected records": "" + currentSelected + "/" + total,
      },
      total: {
        "Total selected records": "" + totalSelected + "/" + total,
        "Total selected attributes":
          attributes.length +
          "/" +
          Object.keys(this.props.attribute_character).length,
        "Total selected patterns": patterns.length,
      },
    };
  }
  render() {
    const showingParameters = this.getShowingParameters();
    return (
      <Row gutter={24}>
        <ChartMenu
          attributes={this.props.attribute_character || {}}
          initConstraint={(settings) => this.initConstraint(settings)}
          constraint={this.state.original_constraint}
          constraints={this.props.constraints}
          setModelData={this.props.setModelData}
          showingParameters={this.getShowingParameters()}
          updateConstraintParams={(params) => {
            const constraint = this.state.original_constraint;
            const newParams = { ...constraint.params, ...params };
            constraint.params = newParams;
            this.updateConstraint(constraint);
          }}
          removeConstraint={() =>
            this.removeConstraint(this.state.original_constraint)
          }
        ></ChartMenu>
        <Col span={18}>
          <Title level={5}>Pattern selection</Title>
        </Col>
        <Col span={6}>
          <Switch
            checkedChildren="Show Shadow"
            unCheckedChildren="Hide Shadow"
            defaultChecked
            size="default"
            style={{}}
            onChange={(checked) => {
              this.setState({ shouldShowShadow: checked });
            }}
          />
        </Col>
        <Col span={12}>
          <Row>
            <Col span={24} className="config-item-content-parameters-left">
              {Object.keys(showingParameters.current).map((key) => {
                const label = "#" + key + ":";
                let param = showingParameters.current[key];
                return (
                  <div
                    key={"config-parameters-" + key}
                    className="config-item-content-parameters-line"
                  >
                    {label}
                    <br />
                    {param}
                  </div>
                );
              })}
            </Col>
            <Col span={11} style={{ marginRight: 18 }}>
              <Button
                size="small"
                block
                onClick={() => {
                  if (this.state.original_constraint.id)
                    this.updateConstraint(this.state.original_constraint);
                  else this.insertConstraint(this.state.original_constraint);
                }}
              >
                Save
              </Button>
            </Col>
            <Col span={11}>
              <Button
                size="small"
                block
                onClick={() => {
                  const self = this;
                  const jcts = JSON.parse(
                    JSON.stringify(self.state.constraints)
                  );
                  const cts = [];
                  for (let i = 0; i < self.state.constraints.length; i++) {
                    if (jcts[i].selected) {
                      let constraint = jcts[i];
                      delete constraint.selected;
                      delete constraint.svgImage;
                      delete constraint.canvasImage;
                      delete constraint.params.path;
                      cts.push(constraint);
                    }
                  }
                  getModelData({ constraints: cts })
                    .then((res) => {
                      self.props.setModelData(res.data.data);
                    })
                    .catch((e) => {
                      console.log(e);
                      self.props.setModelData(null);
                    });
                }}
              >
                Finish
              </Button>
            </Col>
          </Row>
        </Col>
        <Col span={12} className="config-item-content-parameters-right">
          {Object.keys(showingParameters.total).map((key) => {
            const label = "#" + key + ":";
            let param = showingParameters.total[key];
            const str = label + param;
            return (
              <div
                key={"config-parameters-" + key}
                className="config-item-content-parameters-line"
              >
                {str}
                <br />
              </div>
            );
          })}
        </Col>
        <Col span={18}>
          <ChartDisplay
            name="original-chart"
            data={this.state.original_chart_data}
            showConstraint={this.state.shouldShowShadow}
            attributes={this.props.attribute_character || {}}
            constraint={this.state.original_constraint}
            updateConstraint={(constraint) => this.updateConstraint(constraint)}
            updateConstraintParams={(id, params) =>
              this.updateConstraintParams(id, params)
            }
          ></ChartDisplay>
        </Col>
        <Col span={6} style={{ paddingLeft: 4 }}>
          <ConstraintSelect
            constraints={this.state.constraints}
            constraintId={this.state.original_constraint.id}
            updateConstraint={(constraint) => {
              this.updateConstraint(constraint);
            }}
            selectConstraint={(index) =>
              this.selectConstraint("original", index)
            }
          ></ConstraintSelect>
        </Col>
      </Row>
    );
  }
}

export default ChartsView;
