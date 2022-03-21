import { Col, Space } from "antd";
import Title from "antd/lib/skeleton/Title";
import { Component } from "react";
import "./ParameterDisplay.less";
export default class ParameterDisplay extends Component {
  render() {
    return (
      <Col span={24} className="validation-parameter-display">
        <div className="validation-parameter-display-title">Parameters</div>
        <div className="validation-parameter-display-content">
          {Object.keys(this.props.params).map((key) => {
            return (
              <div key={"validation-parameters-" + key}>
                {"" + key + ":" + this.props.params[key]}
              </div>
            );
          })}
        </div>
      </Col>
    );
  }
}
