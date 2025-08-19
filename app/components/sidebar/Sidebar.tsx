import React from 'react';
import './sidebar.css';
import { FiGrid, FiClipboard, FiTrendingUp, FiBarChart2, FiHelpCircle, FiBookOpen, FiCheckSquare, FiBell, FiSettings, FiLogOut } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa'; 

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="logo">
        <h2>AKADEMOS</h2>
        <p>Your Smart Education Hub</p>
      </div>
      <nav className="menu">
        <p className="menu-label">MENU</p>
        <ul>
          <li><a href="#"><FiGrid /> Dashboard</a></li>
          <li className="active"><a href="#"><FiClipboard /> Class Management</a></li>
          <li><a href="#"><FiTrendingUp /> Evaluation</a></li>
          <li><a href="#"><FiBarChart2 /> Student Progress</a></li>
          <li><a href="#"><FiHelpCircle /> Question Bank</a></li>
          <li><a href="#"><FiBookOpen /> Module Master</a></li>
          <li><a href="#"><FiCheckSquare /> Exam Test</a></li>
          <li><a href="#"><FiBell /> Announcement</a></li>
          <li><a href="#"><FiSettings /> Settings</a></li>
        </ul>
      </nav>
      <div className="user-profile">
        <FaUserCircle size={40} className="avatar-icon" />
        <div className="user-info">
          <p>Richard</p>
          <span>9394lay@gmail.com</span>
        </div>
        <FiLogOut className="logout-icon" />
      </div>
    </div>
  );
};

export default Sidebar;
