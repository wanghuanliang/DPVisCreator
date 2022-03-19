import { Component } from "react";
import * as d3 from "d3";
import { Button, Radio, Space } from "antd";
import {
  BookFilled,
  BookOutlined,
  EditOutlined,
  RestOutlined,
} from "@ant-design/icons";
export default class ConstraintSelect extends Component {
  constructor(props) {
    super(props);
    this.state = { value: 0 };
    this.selectConstraint = props.selectConstraint;
    this.updateConstraint = props.updateConstraint;
  }
  componentDidUpdate() {
    this.props.constraints.forEach((constraint, index) => {
      document
        .getElementById("constraint-select-" + constraint.id)
        .append(constraint.svgImage, constraint.canvasImage);
    });
  }
  render() {
    return (
      <Space direction="vertical">
        {this.props.constraints.map((constraint, index) => (
          <Space
            direction="horizontal"
            key={"constraint-select-" + constraint.id}
            id={"constraint-select-" + constraint.id}
            onClick={() => {
              this.selectConstraint(index);
            }}
          >
            {constraint.id}
            {constraint.selected ? (
              <BookFilled
                onClick={() => {
                  console.log(constraint);
                  constraint.selected = false;
                  this.updateConstraint(constraint);
                }}
              />
            ) : (
              <BookOutlined
                onClick={() => {
                  console.log(constraint);
                  constraint.selected = true;
                  this.updateConstraint(constraint);
                }}
              />
            )}
          </Space>
        ))}
      </Space>
    );
  }
}
