import { Component } from "react";
import { Button, Col, Radio, Space } from "antd";
import BorderText from "../../common/BorderText";
import Title from "antd/lib/typography/Title";
import "./ConstraintSelect.less";
const patternColor = {
  cluster: "#9cb0a2",
  correlation: "#c39b83",
  order: "#bbafd1",
};
export default class ConstraintSelect extends Component {
  render() {
    const self = this;
    return (
      <Col span={24} className="validation-constraint-select">
        <div className="validation-constraint-select-title">Pattern</div>
        <div className="validation-constraint-select-content">
          {this.props.constraints.map((constraint, index) => (
            <Button
              size="small"
              key={"scheme-constraint-" + constraint.id}
              style={{ "border-color": patternColor[constraint.type] }}
              onClick={() => {
                self.props.selectConstraint(constraint);
              }}
            >
              {constraint.id}
            </Button>
          ))}
        </div>
      </Col>
    );
  }
}
