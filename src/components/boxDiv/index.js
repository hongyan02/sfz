import React from "react";
import "./index.css";

// BoxDiv 组件 - 用于包裹多个子组件并显示统一的表头
const BoxDiv = ({ title, children }) => {
  return (
    <div className="box-container">
      {/* 表头部分 */}
      <div className="box-header">{title}</div>

      {/* 内容部分 - 包裹传入的子组件 */}
      <div className="box-content">{children}</div>
    </div>
  );
};

export default BoxDiv;
