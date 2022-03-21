import { Component } from "react";
import * as d3 from "d3";
import { Button, Radio, Space } from "antd";
import {
  BookFilled,
  BookOutlined,
  EditOutlined,
  RestOutlined,
} from "@ant-design/icons";
import BorderText from "../../common/BorderText";
import Title from "antd/lib/typography/Title";
export default class ConstraintSelect extends Component {
  render() {
    return (
      <Space direction="vertical">
        <Title level={5}>Pattern</Title>
        {this.props.constraints.map((constraint, index) => (
          <BorderText type={constraint.type} text={constraint.id}></BorderText>
        ))}
      </Space>
    );
  }
}
