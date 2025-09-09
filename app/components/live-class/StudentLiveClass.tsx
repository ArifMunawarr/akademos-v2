"use client";

import React, { useState } from 'react';
import './live-class.css';
import { VideoRoomView, videoParticipants, Participant } from './LiveClass';
import { MdOutlineVideocam } from 'react-icons/md';

const StudentLiveClass = () => {
  const [pinned, setPinned] = useState<Participant[]>([]);

  const handlePinToggle = (participant: Participant) => {
    setPinned(prevPinned => {
      const isPinned = prevPinned.some(p => p.name === participant.name);
      return isPinned ? prevPinned.filter(p => p.name !== participant.name) : [...prevPinned, participant];
    });
  };

  return (
    <div className="live-class-container">
      <div className="mode-selector">
        <button className="mode-button active" disabled>
          <MdOutlineVideocam /> Video Room
        </button>
      </div>

      <VideoRoomView
        participants={videoParticipants}
        pinned={pinned}
        onPinToggle={handlePinToggle}
        isStudent={true}
      />
    </div>
  );
};

export default StudentLiveClass;
