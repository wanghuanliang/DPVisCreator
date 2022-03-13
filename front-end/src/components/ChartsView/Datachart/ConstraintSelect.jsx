import { Component } from "react";
import { Button, Radio, Space } from "antd";
import { EditOutlined, RestOutlined } from "@ant-design/icons";
export default class ConstraintSelect extends Component {
  constructor(props) {
    super(props);
    this.state = { value: 0 };
    this.selectConstraint = props.selectConstraint;
    this.removeConstraint = props.removeConstraint;
  }
  render() {
    return (
      <Space direction="vertical">
        {this.props.constraints.map((constraint, index) => (
          <Space direction="horizontal" key={"constraint-" + constraint.id}>
            {constraint.id}
            <Button
              value={constraint.id}
              key={"constraint-edit-" + constraint.id}
              icon={<EditOutlined />}
              onClick={() => {
                this.selectConstraint(index);
              }}
            ></Button>
            <Button
              value={constraint.id}
              key={"constraint-delete-" + constraint.id}
              icon={<RestOutlined />}
              onClick={() => {
                this.removeConstraint(index);
              }}
            ></Button>
          </Space>
        ))}
      </Space>
    );
  }
}
