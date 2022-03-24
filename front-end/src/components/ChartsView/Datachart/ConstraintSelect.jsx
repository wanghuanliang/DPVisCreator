import { Component } from "react";
import * as d3 from "d3";
import { Button, Radio, Space } from "antd";
import { CaretDownFilled, CaretUpFilled } from "@ant-design/icons";
import { ReactComponent as TagSelectedIcon } from "../../../assets/tag-selected.svg";
import { ReactComponent as TagUnselectedIcon } from "../../../assets/tag-unselected.svg";
import "./ConstraintSelect.less";
const activeColor = "#ff9845";
const staticColor = "#5d7092";
export default class ConstraintSelect extends Component {
  constructor(props) {
    super(props);
    this.state = { start: 0 };
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
      <Space
        direction="vertical"
        align="center"
        style={{ width: 102 }}
        className="no-gap"
      >
        <div
          onClick={() => {
            const start = this.state.start;
            if (start > 0) this.setState({ start: start - 1 });
          }}
        >
          <svg
            viewBox="-100 -50 200 50"
            focusable="false"
            data-icon="caret-up"
            width="88px"
            height="24px"
            fill="#ced4de"
            aria-hidden="true"
          >
            <polygon points="-100,-10 0,-40 100,-10"></polygon>
          </svg>
        </div>

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
                    this.props.constraintId === constraint.id
                      ? activeColor
                      : staticColor,
                }}
                onClick={() => {
                  this.setState({ value: index });
                  this.selectConstraint(index);
                }}
              >
                <div className="constraint-select-item-label">
                  {constraint.id}
                </div>
                <div
                  id={"constraint-select-" + constraint.id + "-images"}
                ></div>
                {constraint.selected ? (
                  <TagSelectedIcon
                    className="constraint-select-item-tag"
                    width="30"
                    height="30"
                    fill={"#ced4de"}
                    onClick={() => {
                      constraint.selected = false;
                      this.updateConstraint(constraint);
                    }}
                  />
                ) : (
                  <TagUnselectedIcon
                    className="constraint-select-item-tag"
                    width="30"
                    height="30"
                    fill={"#ced4de"}
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
        <div
          onClick={() => {
            const start = this.state.start;
            if (start < this.props.constraints.length - 3)
              this.setState({ start: start + 1 });
          }}
        >
          <svg
            viewBox="-100 0 200 50"
            focusable="false"
            data-icon="caret-up"
            width="88px"
            height="24px"
            fill="#ced4de"
            aria-hidden="true"
          >
            <polygon points="-100,20 0,50 100,20"></polygon>
          </svg>
        </div>
      </Space>
    );
  }
}
