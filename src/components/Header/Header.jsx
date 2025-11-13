  import React from "react";
  import { Link } from "react-router-dom";
  import { ProfileButton } from "../Auth/ProfileButton";
  import "./Header.css";
  import Logo from "../Header/Logo/Logo";
  import Catalog from "../Catalog/Catalog";
  import CatalogBtn from "./CatalogBtn";
  import CardNav from "../CardNav/CardNav";
  import MusicButton from "./MusicButton/MusicButton";
  import SearchBar from "./SearchBar/SearchBar";
  import RandomButton from "./RandomButton/RandomButton";
  import Border from "../ui/border/border";
  import AuthModals from "../Auth/AuthModals";


  function Header() {
    return (
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">
            <Logo />
          </div>
          <div className="left-section">
            <CatalogBtn />
            <MusicButton />
            <SearchBar />
      </div>

      <div className="center-section">
      </div>

      <div className="right-section">
        <RandomButton />
        <ProfileButton />
      </div>
    </div>
  </header>
    );
  }

  export default Header;
