import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { Col, Space, Statistic } from "antd";
import Title from "antd/lib/skeleton/Title";
import { Component } from "react";
import "./ParameterDisplay.less";
export default class ParameterDisplay extends Component {
  render() {
    const { Original, Protected } = this.props.params;
    function getStatistic() {
      if (Original === 0 || Protected === 0) {
        return <></>;
      }
      const value = Protected - Original;
      const percentage = ((Math.abs(value) / Original) * 100.0).toFixed(2);
      return value >= 0 ? (
        <Statistic
          title="Changed"
          value={percentage}
          precision={2}
          valueStyle={{ color: "#3f8600" }}
          prefix={<ArrowUpOutlined />}
          suffix="%"
        />
      ) : (
        <Statistic
          title="Changed"
          value={percentage}
          precision={2}
          valueStyle={{ color: "#cf1322" }}
          prefix={<ArrowDownOutlined />}
          suffix="%"
        />
      );
    }
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
          {getStatistic()}
        </div>
      </Col>
    );
  }
}
