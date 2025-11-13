import React from "react";
import "./border.css";

const Border = ({ orientation = 'vertical' }) => {
  return (
    <div className={`border-line ${orientation}`} />
  );
};

export default Border;