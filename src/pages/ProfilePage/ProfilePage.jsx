import React from "react";
import { useAuth } from "../../components/Auth/AuthContext";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";
import MagicBento from "../../components/MagicBento/MagicBento";

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <MagicBento/>
  );
}

export default ProfilePage;
