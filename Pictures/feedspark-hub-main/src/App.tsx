import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./components/HomePage";
import FeedPage from "./components/FeedPage";
import ProfilePage from "./components/ProfilePage";
import EditProfilePage from "./components/EditProfile";
import CreatePost from "./components/CreatePost";
import "./App.css";

export default function App() {
  const isMobileOrTablet = window.innerWidth <= 1024;

  if (!isMobileOrTablet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          This application is only available on mobile and tablet devices.
        </h1>
      </div>
    );
  }

  return (
    <Router>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/edit-profile" element={<EditProfilePage />} />
      <Route path="/create-post" element={<CreatePost />} />
    </Routes>
  </Router>
  );
}
