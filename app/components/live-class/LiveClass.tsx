"use client";

import React, { useState } from 'react';
import './live-class.css';
import {
  FiInfo, FiBookOpen, FiClipboard, FiAward, FiPlayCircle, FiUpload, FiUsers
} from 'react-icons/fi';
import { BsThreeDots, BsMicMuteFill, BsMicFill, BsViewList } from 'react-icons/bs';
import { MdOutlineMonitor, MdOutlineVideocam, MdOutlineScreenShare, MdOutlineChat, MdOutlinePanTool } from 'react-icons/md';
import { AiOutlinePushpin } from 'react-icons/ai';
import { FaMicrophoneSlash, FaDesktop, FaUser, FaRegCommentDots } from 'react-icons/fa';
import { IoMdPeople } from 'react-icons/io';

// Original participants for Video Room
const videoParticipants = [
  { name: 'ANDA', muted: true },
  { name: 'Kathryn Murphy', muted: true },
  { name: 'Jane Cooper', muted: true },
  { name: 'Floyd Miles', muted: true },
  { name: 'Savannah Nguyen', muted: true },
  { name: 'Jerome Bell', muted: true },
  { name: 'Eleanor Pena', muted: true },
  { name: 'Marvin McKinney', muted: false },
  { name: 'Kristin Watson', muted: false },
  { name: 'Ralph Edwards', muted: false },
  { name: 'Bessie Cooper', muted: false },
  { name: 'Irsan', muted: false },
  { name: 'Jacob Jones', muted: false },
  { name: 'Devon Lane', muted: false },
  { name: 'Cody Fisher', muted: false },
];

// New data for Monitoring Mode
const monitoringParticipants = [
  { name: 'Shawn', image: 'https://placehold.co/400x225/e2e8f0/4a5568?text=Spreadsheet' },
  { name: 'Greg', image: 'https://placehold.co/400x225/e2e8f0/4a5568?text=Spreadsheet' },
  { name: 'Kristin', image: 'https://placehold.co/400x225/e2e8f0/4a5568?text=Spreadsheet' },
  { name: 'Marjorie', image: 'https://placehold.co/400x225/e2e8f0/4a5568?text=Spreadsheet' },
  { name: 'Cameron', image: 'https://placehold.co/400x225/e2e8f0/4a5568?text=Spreadsheet' },
  { name: 'Arthur', image: 'https://placehold.co/400x225/e2e8f0/4a5568?text=Spreadsheet' },
  { name: 'Dianne', image: 'https://placehold.co/400x225/fed7d7/9b2c2c?text=Presentation' },
  { name: 'Kyle', image: 'https://placehold.co/400x225/e2e8f0/4a5568?text=Spreadsheet' },
  { name: 'Courtney', image: 'https://placehold.co/400x225/e2e8f0/4a5568?text=Spreadsheet' },
  { name: 'Arlene', image: 'https://placehold.co/400x225/fed7d7/9b2c2c?text=Presentation' },
  { name: 'Mitchell', image: 'https://placehold.co/400x225/e2e8f0/4a5568?text=Spreadsheet' },
  { name: 'Eduardo', image: 'https://placehold.co/400x225/e2e8f0/4a5568?text=Spreadsheet' },
];

const LiveClass = () => {
  const [activeMode, setActiveMode] = useState('video'); // 'video' or 'monitoring'

  // Component for Video Room View
  const VideoRoomView = () => (
    <div className="video-room-view">
      <div className="video-grid">
        {videoParticipants.map((participant, index) => (
          <div key={index} className="participant-tile">
            <div className="participant-video-placeholder">
              <FaUser className="participant-avatar-icon" />
            </div>
            <div className="participant-overlay">
              <span className="participant-name">{participant.name}</span>
              <div className="participant-icons">
                <button className="icon-button options-button"><BsThreeDots /></button>
                <button className={`icon-button mic-button ${participant.muted ? 'muted' : 'unmuted'}`}>
                  {participant.muted ? <BsMicMuteFill /> : <BsMicFill />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="class-controls">
        <div className="control-group">
            <button className="control-button primary"><BsMicFill /></button>
            <button className="control-button primary"><MdOutlineVideocam /></button>
            <button className="control-button secondary"><FiUpload /></button>
            <button className="control-button record-button"></button>
            <button className="control-button secondary"><MdOutlineChat /></button>
            <button className="control-button secondary"><MdOutlinePanTool /></button>
            <button className="control-button secondary"><BsViewList /></button>
        </div>
        <button className="end-call-button">End Call</button>
      </div>
    </div>
  );

  // Component for Monitoring Mode View
  const MonitoringModeView = () => (
    <div className="monitoring-mode-view">
      <div className="monitoring-grid">
        {monitoringParticipants.map((participant, index) => (
          <div key={index} className="monitoring-tile">
            <img src={participant.image} alt={participant.name} className="monitoring-screenshot" />
            <div className="monitoring-overlay">
              <span className="monitoring-name">{participant.name}</span>
              <button className="mic-button muted"><BsMicMuteFill /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="monitoring-footer">
        <div className="footer-left">
          <span className="live-indicator"><span className="live-dot"></span>Live Class</span>
          <span className="timer">00:01:32</span>
          <div className="participant-count">
            <IoMdPeople />
            <span>{monitoringParticipants.length}</span>
          </div>
        </div>
        <div className="footer-center">
          <button className="footer-button speak"><FaRegCommentDots /> Speak to Student</button>
          <button className="footer-button screen-control"><FiUpload /> Screen Control</button>
          <button className="footer-button mute-all"><FaMicrophoneSlash /> Mute All</button>
        </div>
        <div className="footer-right">
          <button className="footer-button end-call">End Call</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="live-class-container">
      <div className="class-header">
        <button className="back-button">&larr; Back</button>
        <h1>Live Class</h1>
      </div>

      <div className="class-tabs">
        <a href="#" className="tab-item"><FiInfo /> Class Information</a>
        <a href="#" className="tab-item"><FiUsers /> Student</a>
        <a href="#" className="tab-item"><FiBookOpen /> Module</a>
        <a href="#" className="tab-item"><FiClipboard /> Manage Assignment</a>
        <a href="#" className="tab-item"><FiAward /> Manage Exams</a>
        <a href="#" className="tab-item active"><FiPlayCircle /> Live Class</a>
      </div>

      <div className="mode-selector">
        <button 
          className={`mode-button ${activeMode === 'video' ? 'active' : ''}`}
          onClick={() => setActiveMode('video')}
        >
          <MdOutlineVideocam /> Video Room
        </button>
        <button 
          className={`mode-button ${activeMode === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveMode('monitoring')}
        >
          <MdOutlineMonitor /> Monitoring Mode
        </button>
      </div>

      {activeMode === 'video' ? <VideoRoomView /> : <MonitoringModeView />}

    </div>
  );
};

export default LiveClass;
