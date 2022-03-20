import { Space } from "antd";
import Title from "antd/lib/skeleton/Title";
import { Component } from "react";

export default class ParameterDisplay extends Component {
  render() {
    return (
      <Space direction="vertical">
        <Title level={5}>Parameters</Title>
      </Space>
    );
  }
}
