import React from "react";
import { Link } from "react-router-dom";
import "./CatalogBtn.css";

function CatalogBtn() {
  return (
    <Link to="/catalog" className="nav-btn" title="Каталог">
      <span>Каталог</span>
    </Link>
  );
}

export default CatalogBtn;
