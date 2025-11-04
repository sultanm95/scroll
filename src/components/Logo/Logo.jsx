import React from "react";
import { Link } from "react-router-dom";
import "./Logo.css";

function Logo() {
  return (
    <div className="logo">
      <Link to="/" title="Главная">
        <img
          src="/whitelogo.svg"
              alt="Logo"
              onError={(e) => (e.target.src = "https://via.placeholder.com/120x60?text=Logo")}
            />
      </Link>
</div>
  );
}

export default Logo;