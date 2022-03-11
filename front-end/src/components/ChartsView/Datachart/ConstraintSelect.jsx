import { Component } from "react";
import { Radio, Space } from "antd";
import { EditOutlined, RestOutlined } from "@ant-design/icons";
export default class ConstraintSelect extends Component {
  constructor(props) {
    super(props);
    this.state = { value: 0 };
    this.selectConstraint = props.selectConstraint;
  }
  onChange(e) {
    this.setState({
      id: e.target.value,
    });
    this.selectConstraint(
      this.props.constraints.filter(
        (constraint) => constraint.id === this.state.id
      )[0]
    );
  }
  render() {
    const { id } = this.state;
    return (
      <Radio.Group onChange={this.onChange} value={id}>
        <Space direction="vertical">
          {this.props.constraints.map((constraint) => (
            <Space direction="horizontal">
              {constraint.id}
              <Radio.Button
                value={constraint.id}
                key={"constraint-select-" + constraint.id}
              >
                <EditOutlined />
              </Radio.Button>
              <Radio.Button
                value={constraint.id}
                key={"constraint-select-" + constraint.id}
              >
                <RestOutlined />
              </Radio.Button>
            </Space>
          ))}
        </Space>
      </Radio.Group>
    );
  }
}
