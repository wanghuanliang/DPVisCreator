import { Component } from "react";
import { Button, Col, Radio, Space } from "antd";
import BorderText from "../../common/BorderText";
import Title from "antd/lib/typography/Title";
import "./ConstraintSelect.less";
export default class ConstraintSelect extends Component {
  render() {
    const self = this;
    return (
      <Col span={24} className="validation-constraint-select">
        <div className="validation-constraint-select-title">Pattern</div>
        <div className="validation-constraint-select-content">
          {this.props.constraints.map((constraint, index) => (
            <Button
              key={"scheme-constraint-" + constraint.id}
              onClick={() => {
                self.props.selectConstraint(constraint);
              }}
              icon={
                <BorderText
                  type={constraint.type}
                  text={constraint.id}
                ></BorderText>
              }
            ></Button>
          ))}
        </div>
      </Col>
    );
  }
}
