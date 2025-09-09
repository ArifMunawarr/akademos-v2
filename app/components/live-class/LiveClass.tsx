"use client";

import React, { useState, useEffect, useRef, memo } from 'react';
import './live-class.css';
import {
  FiInfo, FiBookOpen, FiClipboard, FiAward, FiPlayCircle, FiUpload, FiUsers, FiChevronDown, FiChevronUp, FiLogOut, FiSearch
} from 'react-icons/fi';
import { BsThreeDotsVertical, BsMicMuteFill, BsMicFill } from 'react-icons/bs';
import { MdOutlineMonitor, MdOutlineVideocam, MdOutlineScreenShare, MdOutlineChat, MdOutlinePanTool, MdOutlineWallpaper, MdPerson, MdBlurOn, MdAddPhotoAlternate, MdCallEnd, MdOutlineVideocamOff, MdExitToApp } from 'react-icons/md';
import { AiOutlinePushpin } from 'react-icons/ai';
import { FaMicrophoneSlash, FaDesktop, FaUser } from 'react-icons/fa';
import { IoMdPeople } from 'react-icons/io';
import { FiPaperclip } from 'react-icons/fi';
import { IoPaperPlane } from 'react-icons/io5';
import DirectCommunication from './DirectCommunication';

// Define participant type from DB
export interface ParticipantFromDB {
  id: number;
  nama: string;
  ipaddres: string;
  status: 'online' | 'offline';
}

// Define participant type
export interface Participant {
  name: string;
  muted: boolean;
}

// Original participants for Video Room
export const videoParticipants: Participant[] = [
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
  { name: 'Ralph Edwards', muted: false },
  { name: 'Bessie Cooper', muted: false },
  { name: 'Irsan', muted: false },
  { name: 'Jacob Jones', muted: false },
  { name: 'Devon Lane', muted: false },
  { name: 'Cody Fisher', muted: false },
];

// New data for Monitoring Mode is now fetched from the API
const monitoringParticipants = [];

// Confirmation Modal Props
interface ConfirmationModalProps {
  title: string;
  message: React.ReactNode;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonType?: 'danger' | 'success';
}

// New component to render iframe or image
const MonitoringCardContent = React.memo(({ participant, isControlling }: { participant: { name: string; image: string; type?: string }, isControlling?: boolean }) => {
  if (participant.type === 'iframe') {
    return (
      <iframe
        src={participant.image}
        className="monitoring-screenshot"
        title={participant.name}
        frameBorder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen
        style={{ pointerEvents: isControlling ? 'auto' : 'none' }}
      ></iframe>
    );
  }
  return <img src={participant.image} alt={participant.name} className="monitoring-screenshot" />;
});
MonitoringCardContent.displayName = 'MonitoringCardContent';

// Confirmation Modal Component
const ConfirmationModal = ({ title, message, confirmText, onConfirm, onCancel, confirmButtonType = 'danger' }: ConfirmationModalProps) => (
  <div className="confirmation-modal-backdrop">
    <div className="confirmation-modal">
      <div className="confirmation-modal-header">
        <h3>{title}</h3>
        <button className="confirmation-modal-close" onClick={onCancel}>×</button>
      </div>
      <div className="confirmation-modal-message">{message}</div>
      <div className="confirmation-modal-actions">
        <button className={`confirmation-button confirm ${confirmButtonType}`} onClick={onConfirm}>{confirmText}</button>
        <button className="confirmation-button cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  </div>
);

// Attendance Modal Component
interface AttendanceViewProps {
  onClose: () => void;
  participants: { name: string; image: string; type?: string }[];
}

const AttendanceView = ({ onClose, participants }: AttendanceViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize participant status from props
  const [participantStatus, setParticipantStatus] = useState(() => {
    const initialStatus: { [key: string]: { micMuted: boolean, camOff: boolean } } = {};
    participants.forEach(p => {
      // Set default status, can be customized
      initialStatus[p.name] = { micMuted: true, camOff: true };
    });
    // Override for specific users if needed
    initialStatus['Arlene'] = { micMuted: false, camOff: false };
    initialStatus['Eduardi'] = { micMuted: false, camOff: false };
    initialStatus['Kyle'] = { micMuted: false, camOff: false };
    initialStatus['Marjorie'] = { micMuted: false, camOff: false };
    initialStatus['Mitchel'] = { micMuted: false, camOff: false };
    return initialStatus;
  });

  const handleToggleMic = (name: string) => {
    setParticipantStatus(prev => ({
      ...prev,
      [name]: { ...prev[name], micMuted: !prev[name].micMuted }
    }));
  };

  const handleToggleCam = (name: string) => {
    setParticipantStatus(prev => ({
      ...prev,
      [name]: { ...prev[name], camOff: !prev[name].camOff }
    }));
  };

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="attendance-modal-backdrop" onClick={onClose}>
      <div className="attendance-modal" onClick={(e) => e.stopPropagation()}>
        <div className="attendance-modal-header">
          <h3>Attendance</h3>
          <button className="attendance-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="attendance-search-bar">
          <FiSearch />
          <input
            type="text"
            placeholder="search Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="attendance-participant-list">
          {filteredParticipants.map((participant, index) => {
            const status = participantStatus[participant.name] || { micMuted: true, camOff: true };
            const isDimmed = status.micMuted && status.camOff;
            return (
              <div key={index} className={`attendance-participant-item ${isDimmed ? 'dimmed' : ''}`}>
                <span className="attendance-participant-name">{participant.name}</span>
                <div className="attendance-participant-controls">
                  <button className={`control-button mic ${status.micMuted ? 'muted' : ''}`} onClick={() => handleToggleMic(participant.name)}>
                    {status.micMuted ? <BsMicMuteFill /> : <BsMicFill />}
                  </button>
                  <button className={`control-button cam ${status.camOff ? 'muted' : ''}`} onClick={() => handleToggleCam(participant.name)}>
                     {status.camOff ? <MdOutlineVideocamOff /> : <MdOutlineVideocam />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface SpeakToStudentModalProps {
  onClose: () => void;
  onConfirm: (selected: string[]) => void;
  participants: { name: string; image: string; type?: string }[];
}

const SpeakToStudentModal = ({ onClose, onConfirm, participants }: SpeakToStudentModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (name: string) => {
    setSelected(prev =>
      prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(participants.map(p => p.name));
    } else {
      setSelected([]);
    }
  };

  const isAllSelected = participants.length > 0 && selected.length === participants.length;

  return (
    <div className="speak-modal-backdrop" onClick={onClose}>
      <div className="speak-modal" onClick={(e) => e.stopPropagation()}>
        <div className="speak-modal-header">
          <h3>Choose To Speak</h3>
          <button className="speak-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="speak-search-bar">
          <FiSearch />
          <input
            type="text"
            placeholder="search Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="speak-participant-list">
          <div className="speak-participant-item">
            <label htmlFor="speak-to-all">Speak to all</label>
            <input
              type="checkbox"
              id="speak-to-all"
              checked={isAllSelected}
              onChange={handleSelectAll}
            />
          </div>
          {filteredParticipants.map((participant, index) => (
            <div key={index} className="speak-participant-item">
              <label htmlFor={`speak-${participant.name}`}>{participant.name}</label>
              <input
                type="checkbox"
                id={`speak-${participant.name}`}
                checked={selected.includes(participant.name)}
                onChange={() => handleSelect(participant.name)}
              />
            </div>
          ))}
        </div>
        <div className="speak-modal-footer">
          <button className="speak-confirm-button" onClick={() => onConfirm(selected)} disabled={selected.length === 0}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Screen Control Modal Component
interface ScreenControlModalProps {
  onClose: () => void;
  onConfirm: (selected: string | null) => void;
  participants: { name: string; image: string; type?: string }[];
}

const ScreenControlModal = ({ onClose, onConfirm, participants }: ScreenControlModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sc-modal-backdrop" onClick={onClose}>
      <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sc-modal-header">
          <h3>Choose to Screen Control</h3>
          <button className="sc-close" onClick={onClose}>×</button>
        </div>
        <div className="sc-search-bar">
          <FiSearch />
          <input
            type="text"
            placeholder="search Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sc-list">
          {filteredParticipants.map((p, idx) => (
            <label key={idx} className="sc-item">
              <input
                type="radio"
                name="screen-control"
                value={p.name}
                checked={selected === p.name}
                onChange={() => setSelected(p.name)}
              />
              <span className="sc-radio" aria-hidden="true"></span>
              <span className="sc-name">{p.name}</span>
            </label>
          ))}
        </div>
        <div className="sc-footer">
          <button className="sc-confirm" onClick={() => onConfirm(selected)} disabled={!selected}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

// Screen Control Confirm Modal
interface ScreenControlConfirmModalProps {
  name: string;
  onYes: () => void;
  onNo: () => void;
  onClose: () => void;
}

const ScreenControlConfirmModal = ({ name, onYes, onNo, onClose }: ScreenControlConfirmModalProps) => (
  <div className="scc-backdrop" onClick={onClose}>
    <div className="scc-modal" onClick={(e) => e.stopPropagation()}>
      <button className="scc-close" onClick={onClose}>×</button>
      <div className="scc-icon-row" aria-hidden>
        <span className="scc-icon-monitor">🖥️</span>
        <span className="scc-icon-keyboard">⌨️</span>
      </div>
      <div className="scc-text">
        <div className="scc-line">Are you sure want to control</div>
        <div className="scc-line scc-strong"><strong>{name}</strong> screen and keyboard?</div>
      </div>
      <div className="scc-actions">
        <button className="scc-yes" onClick={onYes}>Yes</button>
        <button className="scc-no" onClick={onNo}>No</button>
      </div>
    </div>
  </div>
);

// Props for VideoRoomView
interface VideoRoomViewProps {
  participants: Participant[];
  onPinToggle: (participant: Participant) => void;
  pinned: Participant[];
  isStudent?: boolean;
}

// Component for Video Room View
export const VideoRoomView = ({ participants, onPinToggle, pinned, isStudent }: VideoRoomViewProps) => {
  const [menuOpen, setMenuOpen] = useState<string | null>(null); // Use participant name for uniqueness
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isBgOpen, setIsBgOpen] = useState(false);
  const [selectedBg, setSelectedBg] = useState<string | null>(null);
  const [bgAction, setBgAction] = useState<'none' | 'blur' | 'upload' | null>(null);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [showStopRecordConfirm, setShowStopRecordConfirm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLeaveMenuOpen, setIsLeaveMenuOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const leaveMenuRef = useRef<HTMLDivElement>(null);

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ id: number; name: string; avatar: string; text: string; time: string; self?: boolean }>>([
    { id: 1, name: 'Stefanie Nunu', avatar: 'https://i.pravatar.cc/48?img=5', text: 'Selamat pagi semuanya.', time: '11:01 AM' },
    { id: 2, name: 'Stefanie Nunu', avatar: 'https://i.pravatar.cc/48?img=5', text: 'Kita akan mulai kelas ini sekarang.', time: '11:01 AM' },
    { id: 3, name: 'Daniel Yuda', avatar: 'https://i.pravatar.cc/48?img=12', text: 'Baik, mari kita mulai kelas ini sekarang', time: '11:02 AM' },
    { id: 4, name: 'Anda', avatar: 'https://i.pravatar.cc/48?img=1', text: 'Okaii aku mendengarkan', time: '12:04 AM', self: true },
  ]);

  useEffect(() => {
    const handlePointerDown = (ev: MouseEvent | PointerEvent) => {
      const target = ev.target as Element | null;
      if (!target) return;
      // Ignore clicks on the options button or inside the menu
      if (target.closest('.options-button') || target.closest('.options-menu')) {
        return;
      }
      // If click is anywhere else (outside menu/button), close
      if (menuOpen !== null) setMenuOpen(null);
    };

    const handleClickOutside: (event: MouseEvent) => void = (event) => {
      if (leaveMenuRef.current && !leaveMenuRef.current.contains(event.target as Node)) {
        setIsLeaveMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen, isLeaveMenuOpen]);

  const Controls = () => (
    <div className="class-controls">
      <div className="controls-left">
        <div className="live-indicator-badge">
          <span className="live-dot"></span>
          <span>Live Class</span>
          <span className="timer-separator"></span>
          <span>00:01:32</span>
        </div>
      </div>
      <div className="controls-center">
        <button className={`control-button primary ${isMicMuted ? 'muted' : ''}`} onClick={() => setIsMicMuted(!isMicMuted)}>
          {isMicMuted ? <BsMicMuteFill /> : <BsMicFill />}
        </button>
        <button className="control-button primary"><MdOutlineVideocam /></button>
          <button className="control-button secondary" onClick={() => setIsShareOpen(true)}><MdOutlineScreenShare /></button>
        <button className={`control-button record-button ${isRecording ? 'is-recording' : ''}`} onClick={() => isRecording ? setShowStopRecordConfirm(true) : setIsRecordOpen(true)}></button>
        <button className="control-button secondary" onClick={() => setIsChatOpen(v => !v)}><MdOutlineChat /></button>
        <button className="control-button secondary"><MdOutlinePanTool /></button>
          <button className="control-button secondary" onClick={() => setIsBgOpen(true)}><MdOutlineWallpaper /></button>
      </div>
      <div className="controls-right">
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span>Recording</span>
          </div>
        )}
        {isStudent ? (
          <button className="leave-class-button student" onClick={() => setShowLeaveConfirm(true)}>
            Leave Class
          </button>
        ) : (
          <div className="leave-class-wrapper" ref={leaveMenuRef}>
            <button className="leave-class-button" onClick={() => setIsLeaveMenuOpen(v => !v)}>
              <span>Leave Class</span>
              {isLeaveMenuOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {isLeaveMenuOpen && (
              <div className="leave-class-menu">
                <button className="leave-menu-item" onClick={() => { setShowLeaveConfirm(true); setIsLeaveMenuOpen(false); }}>
                  <FiLogOut />
                  <span>Leave Class</span>
                </button>
                <div className="leave-menu-separator"></div>
                <button className="leave-menu-item danger" onClick={() => { setShowEndConfirm(true); setIsLeaveMenuOpen(false); }}>
                  <MdCallEnd />
                  <span>End Class for All</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (pinned.length > 0) {
    const pinnedNames = new Set(pinned.map(p => p.name));
    const unpinnedParticipants = participants.filter(p => !pinnedNames.has(p.name));

    return (
      <div className="video-room-view">
        <div className="highlight-view">
          <div className={`pinned-participants-grid ${pinned.length === 1 ? 'single' : ''}`}>
            {pinned.map((participant, idx) => (
              <div key={`${participant.name}-${idx}`} className="participant-tile large" onClick={() => onPinToggle(participant)}>
                <div className="participant-video-placeholder">
                  <FaUser className="participant-avatar-icon" />
                </div>
                <div className="participant-overlay">
                  <span className="participant-name">{participant.name}</span>
                  <div className="participant-icons">
                    <button className="icon-button options-button">
                      <BsThreeDotsVertical style={{ color: 'white' }} />
                    </button>
                    <button className={`icon-button mic-button ${participant.muted ? 'muted' : 'unmuted'}`}>
                      {participant.muted ? <BsMicMuteFill /> : <BsMicFill />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="participant-sidebar">
            {unpinnedParticipants.map((participant, idx) => (
              <div key={`${participant.name}-${idx}`} className="participant-tile small">
                <div className="participant-video-placeholder" onClick={() => onPinToggle(participant)}>
                  <FaUser className="participant-avatar-icon small" />
                </div>
                <div className="participant-overlay">
                  <span className="participant-name">{participant.name}</span>
                  <div className="participant-icons">
                    <div className="options-wrapper">
                      <button
                        className="icon-button options-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === participant.name ? null : participant.name);
                        }}
                      >
                        <BsThreeDotsVertical />
                      </button>
                      {menuOpen === participant.name && (
                        <div className="options-menu" onClick={(e) => e.stopPropagation()}>
                          <button className="options-menu-item" onClick={() => { onPinToggle(participant); setMenuOpen(null); }}>
                            <AiOutlinePushpin />
                            <span>Pin</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <button className={`icon-button mic-button ${participant.muted ? 'muted' : 'unmuted'}`}>
                      {participant.muted ? <BsMicMuteFill /> : <BsMicFill />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Controls />
        {isChatOpen && (
          <aside className="chat-panel" role="dialog" aria-label="Class Chat">
            <button className="chat-close" onClick={() => setIsChatOpen(false)}>×</button>
            <div className="chat-body">
              {messages.map(m => (
                <div key={m.id} className={`chat-msg ${m.self ? 'self' : ''}`}>
                  {!m.self && <img className="chat-avatar" src={m.avatar} alt={m.name} />}
                  <div className="chat-bubble">
                    <div className="chat-meta">
                      {!m.self && <span className="chat-name">{m.name}</span>}
                      <span className="chat-time">{m.time}</span>
                    </div>
                    <div className="chat-text">{m.text}</div>
                  </div>
                  {m.self && <img className="chat-avatar" src={m.avatar} alt={m.name} />}
                </div>
              ))}
            </div>
            <div className="chat-inputbar">
              <button className="chat-attach" aria-label="Attach"><FiPaperclip /></button>
              <input
                className="chat-input"
                placeholder="Type Something..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatInput.trim()) {
                    setMessages(prev => [...prev, { id: Date.now(), name: 'Anda', avatar: 'https://i.pravatar.cc/48?img=1', text: chatInput.trim(), time: 'Now', self: true }]);
                    setChatInput('');
                  }
                }}
              />
              <button
                className="chat-send"
                disabled={!chatInput.trim()}
                onClick={() => {
                  if (!chatInput.trim()) return;
                  setMessages(prev => [...prev, { id: Date.now(), name: 'Anda', avatar: 'https://i.pravatar.cc/48?img=1', text: chatInput.trim(), time: 'Now', self: true }]);
                  setChatInput('');
                }}
              >
                <IoPaperPlane />
              </button>
            </div>
          </aside>
        )}
        {showLeaveConfirm && (
          <ConfirmationModal
            title="Leave Class?"
            message="Are you sure want to leave class?"
            confirmText="Leave"
            onConfirm={() => setShowLeaveConfirm(false)} // Placeholder
            onCancel={() => setShowLeaveConfirm(false)}
          />
        )}
        {showEndConfirm && (
          <ConfirmationModal
            title="End Meeting for All?"
            message="Are you sure want to end meeting for all?"
            confirmText="End Class"
            onConfirm={() => setShowEndConfirm(false)} // Placeholder
            onCancel={() => setShowEndConfirm(false)}
          />
        )}
        {showStopRecordConfirm && (
          <ConfirmationModal
            title="Stop Recording?"
            message={<>Are you sure want to stop recording this<br />session?</>}
            confirmText="Yes"
            onConfirm={() => { setIsRecording(false); setShowStopRecordConfirm(false); }}
            onCancel={() => setShowStopRecordConfirm(false)}
            confirmButtonType="success"
          />
        )}
      </div>
    );
  }

  return (
    <div className="video-room-view" ref={containerRef}>
      <div className="video-grid">
        {participants.map((participant, idx) => (
          <div key={`${participant.name}-${idx}`} className="participant-tile" onClick={() => onPinToggle(participant)}>
            <div className="participant-video-placeholder">
              <FaUser className="participant-avatar-icon" />
            </div>
            <div className="participant-overlay">
              <span className="participant-name">{participant.name}</span>
              <div className="participant-icons">
                <div className="options-wrapper">
                  <button
                    className="icon-button options-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === participant.name ? null : participant.name);
                    }}
                  >
                    <BsThreeDotsVertical />
                  </button>
                  {menuOpen === participant.name && (
                    <div
                      className="options-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="options-menu-item" onClick={() => { onPinToggle(participant); setMenuOpen(null); }}>
                        <AiOutlinePushpin />
                        <span>{pinned.some(p => p.name === participant.name) ? 'Unpin' : 'Pin'}</span>
                      </button>
                      <button className="options-menu-item" onClick={() => setMenuOpen(null)}>
                        {participant.muted ? <BsMicFill /> : <FaMicrophoneSlash />}
                        <span>{participant.muted ? 'Unmute' : 'Mute'}</span>
                      </button>
                      <button className="options-menu-item" onClick={() => setMenuOpen(null)}>
                        <FiUsers />
                        <span>Kick from meeting</span>
                      </button>
                      <button className="options-menu-item" onClick={() => setMenuOpen(null)}>
                        <MdOutlineVideocam />
                        <span>Request open camera</span>
                      </button>
                    </div>
                  )}
                </div>
                <button className={`icon-button mic-button ${participant.muted ? 'muted' : 'unmuted'}`}>
                  {participant.muted ? <BsMicMuteFill /> : <BsMicFill />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Controls />
      {isChatOpen && (
        <aside className="chat-panel" role="dialog" aria-label="Class Chat">
          <button className="chat-close" onClick={() => setIsChatOpen(false)}>×</button>
          <div className="chat-body">
            {messages.map(m => (
              <div key={m.id} className={`chat-msg ${m.self ? 'self' : ''}`}>
                {!m.self && <img className="chat-avatar" src={m.avatar} alt={m.name} />}
                <div className="chat-bubble">
                  <div className="chat-meta">
                    {!m.self && <span className="chat-name">{m.name}</span>}
                    <span className="chat-time">{m.time}</span>
                  </div>
                  <div className="chat-text">{m.text}</div>
                </div>
                {m.self && <img className="chat-avatar" src={m.avatar} alt={m.name} />}
              </div>
            ))}
            <div className="chat-pager">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
          <div className="chat-inputbar">
            <button className="chat-attach" aria-label="Attach"><FiPaperclip /></button>
            <input
              className="chat-input"
              placeholder="Type Something..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && chatInput.trim()) {
                  setMessages(prev => [...prev, { id: Date.now(), name: 'Anda', avatar: 'https://i.pravatar.cc/48?img=1', text: chatInput.trim(), time: 'Now', self: true }]);
                  setChatInput('');
                }
              }}
            />
            <button
              className="chat-send"
              disabled={!chatInput.trim()}
              onClick={() => {
                if (!chatInput.trim()) return;
                setMessages(prev => [...prev, { id: Date.now(), name: 'Anda', avatar: 'https://i.pravatar.cc/48?img=1', text: chatInput.trim(), time: 'Now', self: true }]);
                setChatInput('');
              }}
            >
              <IoPaperPlane />
            </button>
          </div>
        </aside>
      )}
      {showLeaveConfirm && (
        <ConfirmationModal
          title="Leave Class?"
          message="Are you sure want to leave class?"
          confirmText="Leave"
          onConfirm={() => setShowLeaveConfirm(false)} // Placeholder
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}
      {showEndConfirm && (
        <ConfirmationModal
          title="End Meeting for All?"
          message="Are you sure want to end meeting for all?"
          confirmText="End Class"
          onConfirm={() => setShowEndConfirm(false)} // Placeholder
          onCancel={() => setShowEndConfirm(false)}
        />
      )}
      {showStopRecordConfirm && (
        <ConfirmationModal
          title="Stop Recording?"
          message={<>Are you sure want to stop recording this<br />session?</>}
          confirmText="Yes"
          onConfirm={() => { setIsRecording(false); setShowStopRecordConfirm(false); }}
          onCancel={() => setShowStopRecordConfirm(false)}
          confirmButtonType="success"
        />
      )}
      {isShareOpen && (
        <div className="share-modal-backdrop" onClick={() => setIsShareOpen(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-header">
              <div className="share-title">
                <span className="share-icon">🖥️</span>
                <h3>Share Screen</h3>
              </div>
              <button className="share-close" onClick={() => setIsShareOpen(false)}>×</button>
            </div>
            <p className="share-subtitle">Please select the content you would like to share with others.</p>

            <div className="share-content">
              <div className="share-section">
                <h4>Entire Screen</h4>
                <div className="share-grid one">
                  {['Screen'].map((label, i) => (
                    <button
                      key={label}
                      className={`share-item ${selectedSource === label ? 'selected' : ''}`}
                      onClick={() => setSelectedSource(label)}
                    >
                      <img className="share-thumb" src="https://placehold.co/520x300/eef2f7/8a8f98?text=Screen+Preview" alt={label} />
                      <div className="share-item-footer">{label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="share-section">
                <h4>Application Windows</h4>
                <div className="share-grid">
                  {[
                    { label: 'Learning - PowerPoint' },
                    { label: 'Module - Word' },
                    { label: 'WhatsApp' },
                    { label: 'Browser' },
                  ].map(({ label }) => (
                    <button
                      key={label}
                      className={`share-item ${selectedSource === label ? 'selected' : ''}`}
                      onClick={() => setSelectedSource(label)}
                    >
                      <img className="share-thumb" src="https://placehold.co/280x170/f8fafc/8a8f98?text=Window" alt={label} />
                      <div className="share-item-footer">{label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="share-footer">
              <button
                className="share-confirm"
                disabled={!selectedSource}
                onClick={() => setIsShareOpen(false)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {isBgOpen && (
        <div className="share-modal-backdrop" onClick={() => setIsBgOpen(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-header">
              <div className="share-title">
                <span className="share-icon">🌿</span>
                <h3>Virtual Backgrounds</h3>
              </div>
              <button className="share-close" onClick={() => setIsBgOpen(false)}>×</button>
            </div>
            <p className="share-subtitle">Choose an image to replace your background.</p>

            <div className="bg-content">
              <div className="bg-preview-col">
                <h4>Preview</h4>
                <div className="bg-preview-card">
                  <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=1200&auto=format&fit=crop" alt="Preview person" className="bg-preview-person" />
                </div>
              </div>
              <div className="bg-presets-col">
                <h4>Choose from Presets</h4>
                <div className="bg-presets-grid">
                  {[
                    { label: 'Library', src: 'https://images.unsplash.com/photo-1535905748047-14b1117df1b1?q=80&w=1200&auto=format&fit=crop' },
                    { label: 'Shelves', src: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop' },
                    { label: 'Navy Desk', src: 'https://images.unsplash.com/photo-1522156373667-4c7234bbd804?q=80&w=1200&auto=format&fit=crop' },
                    { label: 'Beach', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop' },
                  ].map((it) => (
                    <button
                      key={it.label}
                      className={`bg-item ${selectedBg === it.label ? 'selected' : ''}`}
                      onClick={() => setSelectedBg(it.label)}
                    >
                      <img className="bg-thumb" src={it.src} alt={it.label} />
                    </button>
                  ))}
                </div>
                <div className="bg-action-bar">
                  <button className={`bg-action ${bgAction === 'none' ? 'active' : ''}`} title="None" onClick={() => setBgAction('none')}>
                    <MdPerson />
                  </button>
                  <button className={`bg-action ${bgAction === 'blur' ? 'active' : ''}`} title="Blur" onClick={() => setBgAction('blur')}>
                    <MdBlurOn />
                  </button>
                  <button className={`bg-action ${bgAction === 'upload' ? 'active' : ''}`} title="Upload" onClick={() => setBgAction('upload')}>
                    <MdAddPhotoAlternate />
                  </button>
                </div>
              </div>
            </div>
            <div className="share-footer">
              <button
                className="share-confirm"
                disabled={!selectedBg}
                onClick={() => setIsBgOpen(false)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {isRecordOpen && (
        <div className="share-modal-backdrop" onClick={() => setIsRecordOpen(false)}>
          <div className="record-modal" onClick={(e) => e.stopPropagation()}>
            <div className="record-header">
              <h3>Record this Class?</h3>
              <button className="record-close" onClick={() => setIsRecordOpen(false)}>×</button>
            </div>
            <p className="record-desc">Recording will capture video, audio, and any shared content during the session.</p>
            <div className="record-actions">
              <button className="record-continue" onClick={() => { setIsRecordOpen(false); setIsRecording(true); }}>Continue</button>
              <button className="record-cancel" onClick={() => setIsRecordOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component for Monitoring Mode View
const MonitoringModeView = () => {
  const [isLeaveMenuOpen, setIsLeaveMenuOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isSpeakModalOpen, setIsSpeakModalOpen] = useState(false); // New state
  const [directCommTargets, setDirectCommTargets] = useState<{ name: string; image: string; type?: string }[]>([]);
  const leaveMenuRef = useRef<HTMLDivElement>(null);
  const [isScreenControlOpen, setIsScreenControlOpen] = useState(false);
  const [screenController, setScreenController] = useState<string | null>(null);
  const [pendingScreenController, setPendingScreenController] = useState<string | null>(null);
  const [showScreenConfirm, setShowScreenConfirm] = useState(false);
  const [isMuteAllOpen, setIsMuteAllOpen] = useState(false);
  const [allowSelfUnmute, setAllowSelfUnmute] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const [monitoringParticipants, setMonitoringParticipants] = useState<any[]>([]);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch('/api/participants');
        if (!response.ok) {
          throw new Error('Failed to fetch participants');
        }
        const data: ParticipantFromDB[] = await response.json();
        const formattedParticipants = data
          .filter(p => p.status === 'online')
          .map(p => ({
            name: p.nama,
            image: `http://${p.ipaddres}:8888/`,
            type: 'iframe',
          }));
        setMonitoringParticipants(formattedParticipants);
      } catch (error) {
        console.error(error);
      }
    };

    fetchParticipants();
    const interval = setInterval(fetchParticipants, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleConfirmSpeak = (selectedNames: string[]) => {
    const targets = monitoringParticipants.filter(p => selectedNames.includes(p.name));
    setDirectCommTargets(targets);
    setIsSpeakModalOpen(false);
  };

  const handleDisconnect = () => {
    setDirectCommTargets([]);
  };

  const handleConfirmScreenControl = (selected: string | null) => {
    if (!selected) return;
    setPendingScreenController(selected);
    setIsScreenControlOpen(false);
    setShowScreenConfirm(true);
  };

  const handleScreenConfirmYes = () => {
    if (pendingScreenController) setScreenController(pendingScreenController);
    setSelectedName(null); // Ensure we exit any prior highlight selection when entering control mode
    setShowScreenConfirm(false);
    setPendingScreenController(null);
  };

  const handleScreenConfirmNo = () => {
    setShowScreenConfirm(false);
    setPendingScreenController(null);
  };

  const openMuteAll = () => setIsMuteAllOpen(true);
  const closeMuteAll = () => setIsMuteAllOpen(false);
  const toggleAllowSelfUnmute = () => setAllowSelfUnmute((v) => !v);
  const confirmMuteAll = () => {
    // TODO: hook into actual mute logic; currently just closes
    setIsMuteAllOpen(false);
  };

  return (
    <div className="monitoring-mode-view">
      {screenController ? (
        <div className="highlight-view">
          <div className={`pinned-participants-grid single`}>
            {(() => {
              const sel = monitoringParticipants.find(p => p.name === screenController) || monitoringParticipants[0];
              return (
                <div className="participant-tile large">
                  <div className="participant-video-placeholder">
                    <MonitoringCardContent participant={sel} isControlling={true} />
                  </div>
                  <div className="participant-overlay">
                    <span className="participant-name">{sel.name}</span>
                    <div className="participant-icons">
                      <button className={`icon-button mic-button muted`}><BsMicMuteFill /></button>
                    </div>
                  </div>
                  <div className="controlling-badge">Controlling {sel.name} Screen</div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : selectedName ? (
        <div className="highlight-view">
          <div className={`pinned-participants-grid single`}>
            {(() => {
              const sel = monitoringParticipants.find(p => p.name === selectedName) || monitoringParticipants[0];
              return (
                <div className="participant-tile large" onClick={() => setSelectedName(null)}>
                  <div className="participant-video-placeholder">
                    <MonitoringCardContent participant={sel} />
                  </div>
                  <div className="participant-overlay">
                    <span className="participant-name">{sel.name}</span>
                    <div className="participant-icons">
                      <button className={`icon-button mic-button muted`}><BsMicMuteFill /></button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="participant-sidebar">
            {monitoringParticipants
              .filter(p => p.name !== selectedName)
              .map((p, idx) => (
                <div key={idx} className="participant-tile small" onClick={() => setSelectedName(p.name)}>
                  <div className="participant-video-placeholder">
                    <MonitoringCardContent participant={p} />
                  </div>
                  <div className="participant-overlay">
                    <span className="participant-name">{p.name}</span>
                    <div className="participant-icons">
                      <button className={`icon-button mic-button muted`}><BsMicMuteFill /></button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="monitoring-grid">
          {monitoringParticipants.map((participant, index) => (
            <div
              key={index}
              className="monitoring-tile"
              onClick={() => setSelectedName(participant.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedName(participant.name); }}
            >
              <MonitoringCardContent participant={participant} />
              <div className="monitoring-overlay">
                <span className="monitoring-name">{participant.name}</span>
                <div className="participant-icons">
                  <button className="mic-button muted"><BsMicMuteFill /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="monitoring-footer">
        <div className="footer-left">
          <div className="live-indicator-badge">
            <span className="live-dot"></span>
            <span>Live Class</span>
            <span className="timer-separator"></span>
            <span>00:01:32</span>
          </div>
          <div className="participant-count" onClick={() => setIsAttendanceOpen(true)}>
            <IoMdPeople />
            <span>{monitoringParticipants.length}</span>
          </div>
        </div>
        <div className="footer-center">
          {screenController ? (
            <>
              <button className="footer-button speak" onClick={() => {
                const studentToSpeak = monitoringParticipants.find(p => p.name === screenController);
                if (studentToSpeak) setDirectCommTargets([studentToSpeak]);
              }}><BsMicFill /> Speak to {screenController}</button>
              <button className="footer-button exit-control" onClick={() => setScreenController(null)}>
                <MdExitToApp />
                EXIT MODE CONTROL
              </button>
              <button className="footer-button mute-all" onClick={openMuteAll}><FaMicrophoneSlash /> Mute All</button>
            </>
          ) : (
            <>
              <button className="footer-button speak" onClick={() => setIsSpeakModalOpen(true)}><BsMicFill /> Speak to Student</button>
              <button className="footer-button screen-control" onClick={() => setIsScreenControlOpen(true)}><MdOutlineScreenShare /> Screen Control</button>
              <button className="footer-button mute-all" onClick={openMuteAll}><FaMicrophoneSlash /> Mute All</button>
            </>
          )}
        </div>
        <div className="footer-right">
          <div className="leave-class-wrapper" ref={leaveMenuRef}>
            <button className="leave-class-button" onClick={() => setIsLeaveMenuOpen(v => !v)}>
              <span>Leave Class</span>
              {isLeaveMenuOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {isLeaveMenuOpen && (
              <div className="leave-class-menu">
                <button className="leave-menu-item" onClick={() => { setShowLeaveConfirm(true); setIsLeaveMenuOpen(false); }}>
                  <FiLogOut />
                  <span>Leave Class</span>
                </button>
                <div className="leave-menu-separator"></div>
                <button className="leave-menu-item danger" onClick={() => { setShowEndConfirm(true); setIsLeaveMenuOpen(false); }}>
                  <MdCallEnd />
                  <span>End Class for All</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showLeaveConfirm && (
        <ConfirmationModal
          title="Leave Class?"
          message="Are you sure want to leave class?"
          confirmText="Leave"
          onConfirm={() => setShowLeaveConfirm(false)} // Placeholder
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}
      {showEndConfirm && (
        <ConfirmationModal
          title="End Meeting for All?"
          message="Are you sure want to end meeting for all?"
          confirmText="End Class"
          onConfirm={() => setShowEndConfirm(false)} // Placeholder
          onCancel={() => setShowEndConfirm(false)}
        />
      )}
      {isAttendanceOpen && (
        <AttendanceView 
          participants={monitoringParticipants} 
          onClose={() => setIsAttendanceOpen(false)} 
        />
      )}
      {isSpeakModalOpen && (
        <SpeakToStudentModal
          onClose={() => setIsSpeakModalOpen(false)}
          onConfirm={handleConfirmSpeak}
          participants={monitoringParticipants}
        />
      )}
      {isScreenControlOpen && (
        <ScreenControlModal
          onClose={() => setIsScreenControlOpen(false)}
          onConfirm={handleConfirmScreenControl}
          participants={monitoringParticipants}
        />
      )}
      {showScreenConfirm && pendingScreenController && (
        <ScreenControlConfirmModal
          name={pendingScreenController}
          onYes={handleScreenConfirmYes}
          onNo={handleScreenConfirmNo}
          onClose={handleScreenConfirmNo}
        />
      )}
      <MuteAllModal
        open={isMuteAllOpen}
        allowSelfUnmute={allowSelfUnmute}
        onToggleAllow={toggleAllowSelfUnmute}
        onYes={confirmMuteAll}
        onNo={closeMuteAll}
        onClose={closeMuteAll}
      />
      {directCommTargets.length > 0 && (
        <DirectCommunication 
          students={directCommTargets} 
          onDisconnect={handleDisconnect} 
        />
      )}
    </div>
  );
};

interface MuteAllModalProps {
  open: boolean;
  allowSelfUnmute: boolean;
  onToggleAllow: () => void;
  onYes: () => void;
  onNo: () => void;
  onClose: () => void;
}

const MuteAllModal = ({ open, allowSelfUnmute, onToggleAllow, onYes, onNo, onClose }: MuteAllModalProps) => {
  if (!open) return null;
  return (
    <div className="ma-backdrop" onClick={onClose}>
      <div className="ma-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ma-close" onClick={onClose}>×</button>
        <h3 className="ma-title">Mute All Current and New Participants</h3>
        <label className="ma-allow">
          <input type="checkbox" checked={allowSelfUnmute} onChange={onToggleAllow} />
          <span className="ma-box" aria-hidden="true"></span>
          <span className="ma-text">Allow participants to unmute themselves</span>
        </label>
        <div className="ma-actions">
          <button className="ma-yes" onClick={onYes}>Yes</button>
          <button className="ma-no" onClick={onNo}>No</button>
        </div>
      </div>
    </div>
  );
};

const LiveClass = () => {
  const [mode, setMode] = useState<'video' | 'monitoring'>('video');
  const [pinned, setPinned] = useState<Participant[]>([]);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isSpeakModalOpen, setIsSpeakModalOpen] = useState(false);
  const [directCommTargets, setDirectCommTargets] = useState<{ name: string; image: string; type?: string }[]>([]);

  const handlePinToggle = (participant: Participant) => {
    setPinned(prevPinned => {
      const isPinned = prevPinned.some(p => p.name === participant.name);
      if (isPinned) {
        return prevPinned.filter(p => p.name !== participant.name);
      } else {
        return [...prevPinned, participant];
      }
    });
  };

  // const handleConfirmSpeak = (selected: string[]) => {
  //   const targets = monitoringParticipants.filter(p => selected.includes(p.name));
  //   setDirectCommTargets(targets);
  //   setIsSpeakModalOpen(false);
  // };

  // const handleDisconnect = () => {
  //   setDirectCommTargets([]);
  // };

  return (
    <div className="live-class-container">
      <div className="mode-selector">
        <button
          className={`mode-button ${mode === 'video' ? 'active' : 'video-hint'}`}
          onClick={() => setMode('video')}
        >
          <MdOutlineVideocam /> Video Room
        </button>
        <button
          className={`mode-button ${mode === 'monitoring' ? 'active monitoring-active' : 'monitoring-hint'}`}
          onClick={() => setMode('monitoring')}
        >
          <MdOutlineMonitor /> Monitoring Mode
        </button>
      </div>

      {mode === 'video' ?
        <VideoRoomView
          participants={videoParticipants}
          pinned={pinned}
          onPinToggle={handlePinToggle}
          isStudent={false}
        /> :
        <MonitoringModeView />
      }
    </div>
  );
};

export default LiveClass;