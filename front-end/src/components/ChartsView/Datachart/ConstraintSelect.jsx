import { Component } from "react";
import * as d3 from "d3";
import { Button, Radio, Space } from "antd";
import {
  BookFilled,
  BookOutlined,
  DownOutlined,
  EditOutlined,
  RestOutlined,
  UpOutlined,
} from "@ant-design/icons";
import "./ConstraintSelect.less";
const activeColor = "#f6bd17";
const staticColor = "#74cbed";
export default class ConstraintSelect extends Component {
  constructor(props) {
    super(props);
    this.state = { value: 0, start: 0 };
    this.selectConstraint = props.selectConstraint;
    this.updateConstraint = props.updateConstraint;
  }
  componentDidUpdate() {
    this.props.constraints.forEach((constraint, index) => {
      document
        .getElementById("constraint-select-" + constraint.id + "-images")
        ?.replaceChildren(constraint.svgImage, constraint.canvasImage);
    });
  }
  render() {
    return (
      <Space direction="vertical" align="center" style={{ width: 102 }}>
        <Button
          size="small"
          icon={<UpOutlined />}
          onClick={() => {
            const start = this.state.start;
            if (start > 0) this.setState({ start: start - 1 });
          }}
        ></Button>
        <div style={{ height: 246 }}>
          {this.props.constraints.map((constraint, index) =>
            index >= this.state.start && index < this.state.start + 3 ? (
              <Space
                direction="horizontal"
                key={"constraint-select-" + constraint.id}
                id={"constraint-select-" + constraint.id}
                className={"constraint-select-item"}
                style={{
                  borderColor:
                    this.state.value === index ? activeColor : staticColor,
                }}
                onClick={() => {
                  this.setState({ value: index });
                  this.selectConstraint(index);
                }}
              >
                <div
                  id={"constraint-select-" + constraint.id + "-images"}
                ></div>
                {constraint.id}
                {constraint.selected ? (
                  <BookFilled
                    onClick={() => {
                      constraint.selected = false;
                      this.updateConstraint(constraint);
                    }}
                  />
                ) : (
                  <BookOutlined
                    onClick={() => {
                      constraint.selected = true;
                      this.updateConstraint(constraint);
                    }}
                  />
                )}
              </Space>
            ) : (
              <></>
            )
          )}
        </div>
        <Button
          size="small"
          icon={<DownOutlined />}
          onClick={() => {
            const start = this.state.start;
            if (start < this.props.constraints.length - 3)
              this.setState({ start: start + 1 });
          }}
        ></Button>
      </Space>
    );
  }
}
