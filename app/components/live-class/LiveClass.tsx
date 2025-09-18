"use client";

import React, { useState, useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import './live-class.css';
import {
  FiInfo, FiBookOpen, FiClipboard, FiAward, FiPlayCircle, FiUpload, FiUsers, FiChevronDown, FiChevronUp, FiLogOut, FiSearch, FiPaperclip, FiUser, FiShare2
} from 'react-icons/fi';
import { BsThreeDotsVertical, BsMicMuteFill, BsMicFill } from 'react-icons/bs';
import { MdOutlineMonitor, MdOutlineVideocam, MdOutlineScreenShare, MdOutlineChat, MdOutlinePanTool, MdOutlineWallpaper, MdPerson, MdBlurOn, MdAddPhotoAlternate, MdCallEnd, MdOutlineVideocamOff, MdExitToApp, MdDesktopAccessDisabled } from 'react-icons/md';
import { AiOutlinePushpin } from 'react-icons/ai';
import { FaMicrophoneSlash, FaDesktop, FaUser } from 'react-icons/fa';
import { IoMdPeople } from 'react-icons/io';
import { IoPaperPlane } from 'react-icons/io5';
import DirectCommunication from './DirectCommunication';
import { Room, RoomEvent, RemoteParticipant as LKRemoteParticipant, LocalParticipant as LKLocalParticipant, Track, VideoProcessorOptions, LocalVideoTrack, LocalAudioTrack } from 'livekit-client';
import { BackgroundBlur, VirtualBackground } from '@livekit/track-processors';

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
  // { name: 'ANDA', muted: true },
  // { name: 'Kathryn Murphy', muted: true },
  // { name: 'Jane Cooper', muted: true },
  // { name: 'Floyd Miles', muted: true },
  // { name: 'Savannah Nguyen', muted: true },
  // { name: 'Jerome Bell', muted: true },
  // { name: 'Eleanor Pena', muted: true },
  // { name: 'Marvin McKinney', muted: false },
  // { name: 'Kristin Watson', muted: false },
  // { name: 'Ralph Edwards', muted: false },
  // { name: 'Bessie Cooper', muted: false },
  // { name: 'Irsan', muted: false },
  // { name: 'Jacob Jones', muted: false },
  // { name: 'Devon Lane', muted: false },
  // { name: 'Cody Fisher', muted: false },
  // { name: 'Ralph Edwards', muted: false },
  // { name: 'Bessie Cooper', muted: false },
  // { name: 'Irsan', muted: false },
  // { name: 'Jacob Jones', muted: false },
  // { name: 'Devon Lane', muted: false },
  // { name: 'Cody Fisher', muted: false },
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
    const initialStatus: { [key: string]: { micMuted: boolean, monitorConnected: boolean } } = {};
    participants.forEach(p => {
      // Default: mic muted, monitoring disconnected
      initialStatus[p.name] = { micMuted: true, monitorConnected: false };
    });
    // Example overrides if needed
    initialStatus['Arlene'] = { micMuted: false, monitorConnected: true };
    initialStatus['Eduardi'] = { micMuted: false, monitorConnected: true };
    initialStatus['Kyle'] = { micMuted: false, monitorConnected: true };
    initialStatus['Marjorie'] = { micMuted: false, monitorConnected: true };
    initialStatus['Mitchel'] = { micMuted: false, monitorConnected: true };
    return initialStatus;
  });

  const handleToggleMic = (name: string) => {
    setParticipantStatus(prev => ({
      ...prev,
      [name]: { ...prev[name], micMuted: !prev[name].micMuted }
    }));
  };

  const handleToggleMonitor = (name: string) => {
    setParticipantStatus(prev => ({
      ...prev,
      [name]: { ...prev[name], monitorConnected: !prev[name].monitorConnected }
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
            const status = participantStatus[participant.name] || { micMuted: true, monitorConnected: false };
            const isDimmed = false; // never dim rows regardless of status
            return (
              <div key={index} className={`attendance-participant-item ${isDimmed ? 'dimmed' : ''}`}>
                <span className="attendance-participant-name">{participant.name}</span>
                <div className="attendance-participant-controls">
                  <button className={`control-button mic ${status.micMuted ? 'muted' : ''}`} onClick={() => handleToggleMic(participant.name)}>
                    {status.micMuted ? <BsMicMuteFill /> : <BsMicFill />}
                  </button>
                  <button className={`control-button monitor ${!status.monitorConnected ? 'muted' : ''}`} onClick={() => handleToggleMonitor(participant.name)}>
                    {!status.monitorConnected ? <MdDesktopAccessDisabled /> : <MdOutlineMonitor />}
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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState<string | null>(null); // Use participant name for uniqueness
  const [menuOpenUp, setMenuOpenUp] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isBgOpen, setIsBgOpen] = useState(false);
  const [selectedBg, setSelectedBg] = useState<string | null>(null);
  const [bgAction, setBgAction] = useState<'none' | 'blur' | 'upload' | 'image' | null>(null);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [showStopRecordConfirm, setShowStopRecordConfirm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLeaveMenuOpen, setIsLeaveMenuOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showStopShareConfirm, setShowStopShareConfirm] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const leaveMenuRef = useRef<HTMLDivElement>(null);
  const [showMicRequest, setShowMicRequest] = useState(false);
  const [showCamRequest, setShowCamRequest] = useState(false);
  const [isShareInfoOpen, setIsShareInfoOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { preferCurrentTab: true } as any,
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recording.webm';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      return true; // Indicate success
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        console.log('Recording permission denied by user.');
      } else {
        console.error('Error starting recording:', error);
      }
      return false; // Indicate failure
    }
  };

  // LiveKit state
  const [lkParticipants, setLkParticipants] = useState<Participant[]>([]);
  const roomRef = useRef<Room | null>(null);

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ id: number; name: string; avatar: string; text?: string; time: string; self?: boolean; imageUrl?: string }>>([]);
  // Persist chat per room (so reload keeps messages until the class is left/ended)
  const ROOM_NAME = (typeof window !== 'undefined' ? sessionStorage.getItem('room_name_hint') : null) || 'default-room';
  const chatStorageKey = `chat_history_${ROOM_NAME}`;

  useEffect(() => {
    // Hydrate chat history from sessionStorage on mount (same tab)
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem(chatStorageKey) || '' : '';
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Save chat history on every change
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(chatStorageKey, JSON.stringify(messages));
      }
    } catch {}
  }, [messages]);
  // Raise hand state (store identities of participants who raised hand)
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [isHandRaised, setIsHandRaised] = useState(false);
  // Recording state (global)
  const [recordStartedBy, setRecordStartedBy] = useState<string | null>(null);
  const [showRecordingNotice, setShowRecordingNotice] = useState(false);
  const [ackRecordingForSession, setAckRecordingForSession] = useState(false);

  // Helper to compute list of Participant from LiveKit room
  const recomputeParticipants = React.useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    // Use identity as the unique key to avoid duplicates across remounts
    const map = new Map<string, Participant>();

    // Local participant
    const lp = room.localParticipant as LKLocalParticipant | undefined;
    if (lp) {
      const id = (lp.identity || 'local').toString();
      const name = 'You'; // Always display 'You' for the local participant
      const muted = !lp.isMicrophoneEnabled;
      map.set(id, { name, muted });
    }

    // Remote participants
    room.remoteParticipants.forEach((rp: LKRemoteParticipant) => {
      const id = (rp.identity || '').toString();
      if (!id) return;
      const name = (rp.name || rp.identity).toString();
      const muted = !rp.isMicrophoneEnabled;
      map.set(id, { name, muted });
    });

    setLkParticipants(Array.from(map.values()));
  }, []);

  useEffect(() => {
    // keep LiveKit mic state in sync with UI toggle
    const room = roomRef.current;
    if (room) {
      room.localParticipant.setMicrophoneEnabled(!isMicMuted).then(() => {
        recomputeParticipants();
      }).catch(() => {});
    }
  }, [isMicMuted, recomputeParticipants]);

  useEffect(() => {
    // toggle camera track based on footer button
    const room = roomRef.current;
    if (room) {
      room.localParticipant.setCameraEnabled(isCamOn).catch(() => {});
    }
  }, [isCamOn]);

  useEffect(() => {
    let cancelled = false;

    const connectLiveKit = async () => {
      try {
        if (roomRef.current) return; // already connected for this component

        // Reuse existing global room if available to avoid reconnect delays
        const existingRoom = typeof window !== 'undefined' ? (window as any)['__lk_room_instance__'] as Room | undefined : undefined;
        if (existingRoom) {
          roomRef.current = existingRoom;
          // No need to reconnect; participants will be recomputed and listeners attached by later effects
          recomputeParticipants();
          return;
        }

        const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!wsUrl) {
          console.warn('Missing NEXT_PUBLIC_LIVEKIT_URL for LiveKit client. Falling back to static participants.');
          return;
        }

        // Read required session values set by pre-room pages
        const userName = typeof window !== 'undefined' ? sessionStorage.getItem('display_name') || '' : '';
        const joinKey = typeof window !== 'undefined' ? sessionStorage.getItem('join_key') || '' : '';
        const roleHome = typeof window !== 'undefined' && window.location.pathname.startsWith('/teacher') ? '/teacher' : '/student';
        if (!userName || !joinKey) {
          try { router.replace(roleHome); } catch {}
          return;
        }

        const resp = await fetch('/api/livekit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ joinKey, userName }),
        });
        if (!resp.ok) {
          console.warn('Failed to fetch LiveKit token:', await resp.text());
          return;
        }
        const { token } = await resp.json();

        const room = new Room();
        await room.connect(wsUrl, token);
        roomRef.current = room;
        // Store globally so future remounts reuse immediately without reconnect
        try { (window as any)['__lk_room_instance__'] = room; } catch {}

        // Ensure disconnect on tab close to prevent ghost participants
        const handleBeforeUnload = () => {
          try { room.disconnect(true); } catch {}
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Initial list
        recomputeParticipants();

        // Participant changes & Data listener for chat, hand raising, etc.
        const onConnected = () => recomputeParticipants();
        const onDisconnected = () => { setLkParticipants([]); };
        const onParticipantConnected = async () => {
          recomputeParticipants();
          // Re-broadcast class timer when someone joins so newcomers sync immediately
          try {
            const startMs = ensureClassStartMs();
            const sentAt = Date.now();
            const payload = new TextEncoder().encode(JSON.stringify({ type: 'class_timer', startMs, sentAt }));
            await room.localParticipant.publishData(payload, { reliable: true });
          } catch {}
        };
        const onParticipantDisconnected = () => recomputeParticipants();
        const onTrackMutedChanged = () => recomputeParticipants();
        const onTrackUnmutedChanged = () => recomputeParticipants();
        const onTrackPublished = () => recomputeParticipants();
        const onTrackUnpublished = () => recomputeParticipants();
        const onTrackSubscribed = () => recomputeParticipants();
        const onTrackUnsubscribed = () => recomputeParticipants();
        const onLocalTrackPublished = () => recomputeParticipants();
        const onLocalTrackUnpublished = () => recomputeParticipants();
        const onData = (payload: Uint8Array, participant?: any) => {
          try {
            const text = new TextDecoder().decode(payload);
            const data = JSON.parse(text);
            if (data?.type === 'chat_message') {
              if (participant?.isLocal) return;
              setMessages(prev => [
                ...prev,
                {
                  id: Date.now(),
                  name: participant?.name || participant?.identity || 'Guest',
                  avatar: 'user-icon-placeholder',
                  text: data.text,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            } else if (data?.type === 'chat_image' && data.imageUrl) {
              setMessages(prev => [
                ...prev,
                {
                  id: Date.now(),
                  name: participant?.name || participant?.identity || 'Guest',
                  avatar: 'user-icon-placeholder',
                  imageUrl: data.imageUrl,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            } else if (data?.type === 'hand' && data.identity) {
              setRaisedHands(prev => {
                const next = new Set(prev);
                if (data.raised) next.add(String(data.identity)); else next.delete(String(data.identity));
                return next;
              });
            } else if (data?.type === 'recording' && typeof data.started === 'boolean') {
              if (data.started) {
                setIsRecording(true);
                setRecordStartedBy(String(data.by || ''));
                const localId = roomRef.current?.localParticipant?.identity;
                if (localId && String(data.by) !== localId && !ackRecordingForSession) {
                  setShowRecordingNotice(true);
                }
              } else {
                setIsRecording(false);
                setRecordStartedBy(null);
                setShowRecordingNotice(false);
                setAckRecordingForSession(false);
              }
            } else if (data?.type === 'end_class') {
              try { router.push('/'); } catch {}
            } else if (data?.type === 'request_mic' && data.unmute) {
              const localId = roomRef.current?.localParticipant?.identity;
              if (!data.to || data.to === localId) {
                setShowMicRequest(true);
              }
            } else if (data?.type === 'request_camera' && data.on) {
              const localId = roomRef.current?.localParticipant?.identity;
              if (!data.to || data.to === localId) {
                setShowCamRequest(true);
              }
            } else if (data?.type === 'class_timer' && typeof data.startMs === 'number') {
              // Reconcile class start time using latency-adjusted origin
              const raw = typeof window !== 'undefined' ? sessionStorage.getItem(CLASS_TIMER_KEY) : null;
              const localStart = raw ? Number(raw) : Number.POSITIVE_INFINITY;
              const sentAt = typeof data.sentAt === 'number' ? Number(data.sentAt) : null;
              const adjustedRemoteStart = sentAt ? Number(data.startMs) + Math.max(0, Date.now() - sentAt) : Number(data.startMs);
              const unified = Math.min(localStart, adjustedRemoteStart);
              // Only update if we drift by >1s to avoid oscillation
              if (Math.abs(unified - localStart) > 1000) {
                try { sessionStorage.setItem(CLASS_TIMER_KEY, String(unified)); } catch {}
              }
            } else if (data?.type === 'class_info' && typeof data.name === 'string') {
              // Persist friendly class name for UI (teacher/student)
              try { sessionStorage.setItem('class_name_hint', String(data.name)); } catch {}
            } else if (data?.type === 'force_mute') {
              // Instructor enforced mute-all: turn off local mic and reflect in UI
              (async () => {
                try {
                  await roomRef.current?.localParticipant?.setMicrophoneEnabled(false);
                } catch {}
                setIsMicMuted(true);
                try { recomputeParticipants(); } catch {}
              })();
            } else if (data?.type === 'ask_timer') {
              // Respond with our timer if we have it
              const raw = typeof window !== 'undefined' ? sessionStorage.getItem(CLASS_TIMER_KEY) : null;
              if (raw) {
                try {
                  const startMs = Number(raw);
                  const sentAt = Date.now();
                  const payload = new TextEncoder().encode(JSON.stringify({ type: 'class_timer', startMs, sentAt }));
                  roomRef.current?.localParticipant?.publishData(payload, { reliable: true }).catch(() => {});
                } catch {}
              }
            }
          } catch {}
        };

        room.on(RoomEvent.Connected, onConnected);
        room.on(RoomEvent.Disconnected, onDisconnected);
        room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
        room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
        room.on(RoomEvent.TrackMuted, onTrackMutedChanged);
        room.on(RoomEvent.TrackUnmuted, onTrackUnmutedChanged);
        room.on(RoomEvent.TrackPublished, onTrackPublished);
        room.on(RoomEvent.TrackUnpublished, onTrackUnpublished);
        room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
        room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
        room.on(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
        room.on(RoomEvent.LocalTrackUnpublished, onLocalTrackUnpublished);
        room.on(RoomEvent.DataReceived, onData);

        // Publish local microphone following UI mic state
        try {
          await room.localParticipant.setMicrophoneEnabled(!isMicMuted);
          await room.localParticipant.setCameraEnabled(isCamOn);
        } catch (e) {
          console.warn('Microphone init failed:', e);
        }

        // Broadcast class timer start to help sync newcomers or ask if we don't have it yet
        try {
          const raw = typeof window !== 'undefined' ? sessionStorage.getItem(CLASS_TIMER_KEY) : null;
          if (raw) {
            const startMs = Number(raw);
            const sentAt = Date.now();
            const payload = new TextEncoder().encode(JSON.stringify({ type: 'class_timer', startMs, sentAt }));
            await room.localParticipant.publishData(payload, { reliable: true });
          } else {
            const ask = new TextEncoder().encode(JSON.stringify({ type: 'ask_timer' }));
            await room.localParticipant.publishData(ask, { reliable: true });
          }
        } catch {}

        // Cleanup handler for this connect
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          room.off(RoomEvent.Connected, onConnected);
          room.off(RoomEvent.Disconnected, onDisconnected);
          room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
          room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
          room.off(RoomEvent.TrackMuted, onTrackMutedChanged);
          room.off(RoomEvent.TrackUnmuted, onTrackUnmutedChanged);
          room.off(RoomEvent.TrackPublished, onTrackPublished);
          room.off(RoomEvent.TrackUnpublished, onTrackUnpublished);
          room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
          room.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
          room.off(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
          room.off(RoomEvent.LocalTrackUnpublished, onLocalTrackUnpublished);
          room.off(RoomEvent.DataReceived, onData);
        };
      } catch (e) {
        console.warn('LiveKit connect error:', e);
      }
    };

    connectLiveKit();

    return () => {
      cancelled = true;
      // Keep LiveKit connection alive across view switches.
      // Do not disconnect the room on component unmount; only disconnect on explicit Leave/End actions.
      // This prevents other participants from seeing you leave/rejoin when toggling modes.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Screen share state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const sharePreviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const sharePreviewStreamRef = useRef<MediaStream | null>(null);
  const screenTracksRef = useRef<{ video?: LocalVideoTrack; audio?: LocalAudioTrack } | null>(null);
  const shareStageVideoRef = useRef<HTMLVideoElement | null>(null);
  const [screenVideoTrack, setScreenVideoTrack] = useState<LocalVideoTrack | null>(null);
  const pipSelfVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipTrackRef = useRef<LocalVideoTrack | null>(null);
  const [localIdentity, setLocalIdentity] = useState<string | null>(null);
  const activeRemoteShare = useRef<{ identity: string; track: any } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const attachShareStage = () => {
    const video = screenTracksRef.current?.video;
    if (!video || !shareStageVideoRef.current) return;
    try {
      video.attach(shareStageVideoRef.current);
    } catch {}
  };

  const detachShareStage = () => {
    const video = screenTracksRef.current?.video;
    if (!video || !shareStageVideoRef.current) return;
    try {
      video.detach(shareStageVideoRef.current);
    } catch {}
  };

  const startSharePreview = async (kind: 'screen' | 'window') => {
    try {
      // Request display media with audio for preview (cast to any to allow vendor-specific flags)
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true } as any);
      // Attach to preview video
      if (sharePreviewVideoRef.current) {
        sharePreviewVideoRef.current.srcObject = stream;
        sharePreviewVideoRef.current.muted = true;
        await sharePreviewVideoRef.current.play().catch(() => {});
      }
      sharePreviewStreamRef.current = stream;
      setSelectedSource(kind);

      // If user stops from browser UI, clear preview
      const v = stream.getVideoTracks()[0];
      if (v) {
        v.addEventListener('ended', () => {
          stopSharePreview();
        });
      }
    } catch (e) {
      console.warn('getDisplayMedia failed:', e);
    }
  };

  const stopSharePreview = () => {
    const s = sharePreviewStreamRef.current;
    if (s) {
      s.getTracks().forEach(t => {
        try { t.stop(); } catch {}
      });
    }
    sharePreviewStreamRef.current = null;
    if (sharePreviewVideoRef.current) {
      sharePreviewVideoRef.current.srcObject = null;
    }
    setSelectedSource(null);
  };

  const confirmScreenShare = async () => {
    const room = roomRef.current;
    const stream = sharePreviewStreamRef.current;
    if (!room || !stream) { setIsShareOpen(false); return; }
    try {
      // store local identity for filtering sidebar
      try { setLocalIdentity(room.localParticipant?.identity ?? null); } catch {}
      const vTrack = stream.getVideoTracks()[0];
      if (!vTrack) throw new Error('No video track in display media');
      const lv = new LocalVideoTrack(vTrack);
      let la: LocalAudioTrack | undefined;
      const aTrack = stream.getAudioTracks()[0];
      if (aTrack) {
        la = new LocalAudioTrack(aTrack);
      }

      await room.localParticipant.publishTrack(lv, { source: Track.Source.ScreenShare });
      if (la) await room.localParticipant.publishTrack(la, { source: Track.Source.ScreenShareAudio });
      screenTracksRef.current = { video: lv, audio: la };
      setScreenVideoTrack(lv);
      setIsScreenSharing(true);

      // Attach the LiveKit LocalVideoTrack directly to the stage video element
      if (shareStageVideoRef.current) {
        try { lv.attach(shareStageVideoRef.current); } catch {}
      }

      // If user stops from OS picker later
      vTrack.addEventListener('ended', () => {
        stopScreenShare();
      });
    } catch (e) {
      console.warn('Failed to publish screen share:', e);
    } finally {
      setIsShareOpen(false);
    }
  };

  const stopScreenShare = async () => {
    const room = roomRef.current;
    const tracks = screenTracksRef.current;
    if (!room || !tracks) return;
    try {
      // Detach from stage first
      if (shareStageVideoRef.current && (tracks.video || screenVideoTrack)) {
        try { (tracks.video || screenVideoTrack)!.detach(shareStageVideoRef.current); } catch {}
        try { shareStageVideoRef.current.pause(); } catch {}
        // @ts-ignore
        shareStageVideoRef.current.srcObject = null;
      }
      // Detach PiP self camera if any
      if (pipSelfVideoRef.current && pipTrackRef.current) {
        try { pipTrackRef.current.detach(pipSelfVideoRef.current); } catch {}
      }
      if (tracks.video) {
        await room.localParticipant.unpublishTrack(tracks.video, false);
        try { tracks.video.stop(); } catch {}
      }
      if (tracks.audio) {
        await room.localParticipant.unpublishTrack(tracks.audio, false);
        try { tracks.audio.stop(); } catch {}
      }
    } catch {}
    screenTracksRef.current = null;
    setScreenVideoTrack(null);
    setIsScreenSharing(false);
  };

  // Helper: wait for local camera track to be available
  const ensureLocalCameraTrack = async (timeoutMs = 3000): Promise<LocalVideoTrack | null> => {
    const room = roomRef.current;
    if (!room) return null;
    // turn on camera (await to ensure publication)
    try { await room.localParticipant.setCameraEnabled(true); } catch {}

    // fast path
    let pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    if (pub?.videoTrack) return pub.videoTrack as LocalVideoTrack;

    // otherwise, wait for LocalTrackPublished or until timeout
    return await new Promise<LocalVideoTrack | null>((resolve) => {
      const start = Date.now();
      const tryGet = () => {
        const p = room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (p?.videoTrack) {
          cleanup();
          resolve(p.videoTrack as LocalVideoTrack);
          return;
        }
        if (Date.now() - start > timeoutMs) {
          cleanup();
          resolve(null);
          return;
        }
        raf = window.setTimeout(tryGet, 100);
      };
      let raf = window.setTimeout(tryGet, 0);
      const onPublished = () => {
        const p = room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (p?.videoTrack) {
          cleanup();
          resolve(p.videoTrack as LocalVideoTrack);
        }
      };
      const cleanup = () => {
        try { clearTimeout(raf); } catch {}
        try { room.off(RoomEvent.LocalTrackPublished, onPublished); } catch {}
      };
      try { room.on(RoomEvent.LocalTrackPublished, onPublished); } catch {}
    });
  };

  // Attach local camera into PiP card when sharing is active AND camera is ON
  useEffect(() => {
    // When not sharing or camera is off, ensure PiP is detached
    if (!isScreenSharing || !isCamOn) {
      if (pipSelfVideoRef.current && pipTrackRef.current) {
        try { pipTrackRef.current.detach(pipSelfVideoRef.current); } catch {}
      }
      return;
    }

    const room = roomRef.current;
    if (!room || !pipSelfVideoRef.current) return;
    const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    const localVideo = (pub?.videoTrack as LocalVideoTrack) || null;
    if (localVideo) {
      try {
        localVideo.attach(pipSelfVideoRef.current);
        pipTrackRef.current = localVideo;
      } catch {}
    }
    return () => {
      if (pipSelfVideoRef.current && pipTrackRef.current) {
        try { pipTrackRef.current.detach(pipSelfVideoRef.current); } catch {}
      }
    };
  }, [isScreenSharing, isCamOn]);

  useEffect(() => {
    // Auto-scroll chat to bottom on new messages
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room) return;

    const tryAttachRemoteShare = (participant: any) => {
      const pubs = participant?.videoTrackPublications ?? participant?.trackPublications;
      if (!pubs) return false;
      let screenPub: any = null;
      pubs.forEach((p: any) => {
        if (p?.source === Track.Source.ScreenShare && p?.track) screenPub = p;
      });
      if (screenPub?.track && shareStageVideoRef.current) {
        // If we already have a local share, prefer local; otherwise show remote
        if (screenVideoTrack) return false;
        try { screenPub.track.attach(shareStageVideoRef.current); } catch {}
        activeRemoteShare.current = { identity: participant.identity, track: screenPub.track };
        setIsScreenSharing(true);
        return true;
      }
      return false;
    };

    const onSubscribed = (_track: any, pub: any, participant: any) => {
      if (pub?.source === Track.Source.ScreenShare) {
        tryAttachRemoteShare(participant);
      }
    };
    const onUnsubscribed = (_track: any, pub: any, participant: any) => {
      if (pub?.source === Track.Source.ScreenShare) {
        if (activeRemoteShare.current?.identity === participant.identity) {
          if (shareStageVideoRef.current && activeRemoteShare.current?.track) {
            try { activeRemoteShare.current.track.detach(shareStageVideoRef.current); } catch {}
            // @ts-ignore
            shareStageVideoRef.current.srcObject = null;
          }
          activeRemoteShare.current = null;
          // If local still sharing, keep isScreenSharing true, else false
          setIsScreenSharing(!!screenVideoTrack);
        }
      }
    };

    room.on(RoomEvent.TrackSubscribed, onSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onUnsubscribed);

    // On mount, try to find an existing remote screen share
    const listParticipants = (): any[] => {
      const r: any = room;
      if (typeof r.getParticipants === 'function') return r.getParticipants();
      const map = r.participants || r.remoteParticipants;
      if (map && typeof map.values === 'function') return Array.from(map.values());
      return [];
    };
    listParticipants().some((p: any) => tryAttachRemoteShare(p));

    return () => {
      room.off(RoomEvent.TrackSubscribed, onSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, onUnsubscribed);
      if (activeRemoteShare.current?.track && shareStageVideoRef.current) {
        try { activeRemoteShare.current.track.detach(shareStageVideoRef.current); } catch {}
      }
      activeRemoteShare.current = null;
    };
  }, [screenVideoTrack]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room) return;

    const onData = (payload: Uint8Array, participant?: any) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data?.type === 'chat_message') {
          if (participant?.isLocal) return;
          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              name: participant?.name || participant?.identity || 'Guest',
              avatar: 'user-icon-placeholder',
              text: data.text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else if (data?.type === 'chat_image' && data.imageUrl) {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              name: participant?.name || participant?.identity || 'Guest',
              avatar: 'user-icon-placeholder',
              imageUrl: data.imageUrl,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else if (data?.type === 'hand' && data.identity) {
          setRaisedHands(prev => {
            const next = new Set(prev);
            if (data.raised) next.add(String(data.identity)); else next.delete(String(data.identity));
            return next;
          });
        } else if (data?.type === 'recording' && typeof data.started === 'boolean') {
          if (data.started) {
            setIsRecording(true);
            setRecordStartedBy(String(data.by || ''));
            const localId = roomRef.current?.localParticipant?.identity;
            if (localId && String(data.by) !== localId && !ackRecordingForSession) {
              setShowRecordingNotice(true);
            }
          } else {
            setIsRecording(false);
            setRecordStartedBy(null);
            setShowRecordingNotice(false);
            setAckRecordingForSession(false);
          }
        } else if (data?.type === 'end_class') {
          try { router.push('/'); } catch {}
        } else if (data?.type === 'request_mic' && data.unmute) {
          const localId = roomRef.current?.localParticipant?.identity;
          if (!data.to || data.to === localId) {
            setShowMicRequest(true);
          }
        } else if (data?.type === 'request_camera' && data.on) {
          const localId = roomRef.current?.localParticipant?.identity;
          if (!data.to || data.to === localId) {
            setShowCamRequest(true);
          }
        } else if (data?.type === 'class_timer' && typeof data.startMs === 'number') {
          // Reconcile class start time using latency-adjusted origin
          const raw = typeof window !== 'undefined' ? sessionStorage.getItem(CLASS_TIMER_KEY) : null;
          const localStart = raw ? Number(raw) : Number.POSITIVE_INFINITY;
          const sentAt = typeof data.sentAt === 'number' ? Number(data.sentAt) : null;
          const adjustedRemoteStart = sentAt ? Number(data.startMs) + Math.max(0, Date.now() - sentAt) : Number(data.startMs);
          const unified = Math.min(localStart, adjustedRemoteStart);
          // Only update if we drift by >1s to avoid oscillation
          if (Math.abs(unified - localStart) > 1000) {
            try { sessionStorage.setItem(CLASS_TIMER_KEY, String(unified)); } catch {}
          }
        } else if (data?.type === 'class_info' && typeof data.name === 'string') {
          // Persist friendly class name for UI (teacher/student)
          try { sessionStorage.setItem('class_name_hint', String(data.name)); } catch {}
        } else if (data?.type === 'ask_timer') {
          // Respond with our timer if we have it
          const raw = typeof window !== 'undefined' ? sessionStorage.getItem(CLASS_TIMER_KEY) : null;
          if (raw) {
            try {
              const startMs = Number(raw);
              const sentAt = Date.now();
              const payload = new TextEncoder().encode(JSON.stringify({ type: 'class_timer', startMs, sentAt }));
              roomRef.current?.localParticipant?.publishData(payload, { reliable: true }).catch(() => {});
            } catch {}
          }
        }
      } catch {}
    };

    room.on(RoomEvent.DataReceived, onData);

    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, []);

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text) return;
    const room = roomRef.current;
    try {
      const payload = new TextEncoder().encode(JSON.stringify({ type: 'chat_message', text }));
      await room?.localParticipant.publishData(payload, { reliable: true });
    } catch (e) {
      console.error('Failed to publish chat message via data channel:', e);
    }
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        name: 'You',
        avatar: 'user-icon-placeholder',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        self: true,
      },
    ]);
    setChatInput('');
    chatInputRef.current?.focus();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) { // 4MB limit
      alert('Image is too large. Please select an image under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      if (imageDataUrl) {
        sendImageMessage(imageDataUrl);
      }
    };
    reader.readAsDataURL(file);

    if (event.target) {
      event.target.value = '';
    }
  };

  const sendImageMessage = async (imageDataUrl: string) => {
    const room = roomRef.current;
    const payload = new TextEncoder().encode(JSON.stringify({
      type: 'chat_image',
      imageUrl: imageDataUrl
    }));

    try {
      await room?.localParticipant.publishData(payload, { reliable: true });
    } catch (e) {
      console.error("Failed to send image message:", e);
      return;
    }

    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        name: 'You',
        avatar: 'user-icon-placeholder',
        imageUrl: imageDataUrl,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        self: true,
      },
    ]);
  };

  const effectiveParticipants: Participant[] = lkParticipants.length > 0 ? lkParticipants : participants;

  // Ensure stage video always shows the currently captured display stream
  useEffect(() => {
    if (!isScreenSharing) return;
    const stage = shareStageVideoRef.current;
    const s = sharePreviewStreamRef.current;
    if (stage && s) {
      try {
        // Bind full display stream so audio-less preview still shows frames
        stage.srcObject = s;
        stage.muted = true;
        const onMeta = () => stage.play().catch(() => {});
        stage.onloadedmetadata = onMeta;
        // play immediately as well
        stage.play().catch(() => {});
      } catch {}
    }
  }, [isScreenSharing]);

  // Footer controls (mic, cam, etc.)
  const Controls = () => {
    const elapsed = useClassTimer();
    return (
      <div className="class-controls">
        <div className="controls-left">
          <div className="live-indicator-badge">
            <span className="live-dot"></span>
            <span>Live Class</span>
            <span className="timer-separator"></span>
            <span>{formatHHMMSS(elapsed)}</span>
          </div>
        </div>
        <div className="controls-center">
          <button className={`control-button primary ${isMicMuted ? 'muted' : ''}`} onClick={() => setIsMicMuted(!isMicMuted)}>
            {isMicMuted ? <BsMicMuteFill /> : <BsMicFill />}
          </button>
          <button className="control-button primary" onClick={() => setIsCamOn(v => !v)}>
            {isCamOn ? <MdOutlineVideocam /> : <MdOutlineVideocamOff />}
          </button>
          {isScreenSharing ? (
            <button
              className={`control-button secondary screenshare active`}
              onClick={() => setShowStopShareConfirm(true)}
              title="Stop Share"
              aria-pressed
            >
              <MdOutlineScreenShare />
            </button>
          ) : (
            <button
              className={`control-button secondary`}
              onClick={() => setIsShareOpen(true)}
              title="Share Screen"
              aria-pressed={isShareOpen}
            >
              <MdOutlineScreenShare />
            </button>
          )}
          <button className={`control-button record-button ${isRecording ? 'is-recording' : ''}`} onClick={() => isRecording ? setShowStopRecordConfirm(true) : setIsRecordOpen(true)}></button>
          <button className="control-button secondary" onClick={() => setIsChatOpen(v => !v)}><MdOutlineChat /></button>
          <button
            className={`control-button secondary ${isHandRaised ? 'active' : ''}`}
            title={isHandRaised ? 'Lower hand' : 'Raise hand'}
            onClick={async () => {
              const room = roomRef.current;
              if (!room) return;
              const newState = !isHandRaised;
              setIsHandRaised(newState);
              const identity = room.localParticipant?.identity;
              if (identity) {
                setRaisedHands(prev => {
                  const next = new Set(prev);
                  if (newState) next.add(identity); else next.delete(identity);
                  return next;
                });
                try {
                  const payload = new TextEncoder().encode(JSON.stringify({ type: 'hand', identity, raised: newState }));
                  await room.localParticipant.publishData(payload, { reliable: true });
                } catch (e) {
                  console.error('Failed to publish hand state via data channel:', e);
                }
              }
            }}
          >
            <MdOutlinePanTool />
          </button>
          <button className="control-button secondary" onClick={() => openBgModal()}><MdOutlineWallpaper /></button>
          <button
            className="control-button secondary"
            title="Share Class Info"
            onClick={() => setIsShareInfoOpen(true)}
          >
            <FiShare2 />
          </button>
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
  };

  const handleLeave = async () => {
    if (roomRef.current) {
      try {
        await roomRef.current.disconnect();
        setLkParticipants([]);
        roomRef.current = null;
      } catch (e) {
        console.error("Failed to disconnect:", e);
      }
    }
    // Clear chat history when leaving the class
    try { if (typeof window !== 'undefined') sessionStorage.removeItem(chatStorageKey); } catch {}
    setShowLeaveConfirm(false);
    try { router.push('/'); } catch {}
  };

  const handleEndClass = async () => {
    const roomName = roomRef.current?.name;
    if (!roomName) {
      console.error('Cannot end class, room name is not available.');
      setShowEndConfirm(false);
      return;
    }

    try {
      // Broadcast an "end_class" notice so clients navigate away
      try {
        const room = roomRef.current;
        const payload = new TextEncoder().encode(JSON.stringify({ type: 'end_class' }));
        await room?.localParticipant.publishData(payload, { reliable: true });
      } catch {}

      const res = await fetch('/api/live-class/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to end the class.');
      }

      // Also disconnect the teacher's client
      await handleLeave();

    } catch (error) {
      console.error('Error ending class:', error);
      // Optionally, show an error message to the user
    } finally {
      setShowEndConfirm(false);
    }
  };

  // Renders LK camera track for a participant name (local or remote)
  const VideoRenderer = ({ participantName, preferScreenShare }: { participantName: string, preferScreenShare?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [hasVideo, setHasVideo] = useState(false);

    useEffect(() => {
      const room = roomRef.current;
      if (!room) return;

      let currentTrack: any | null = null;

      const findParticipant = () => {
        const lp = room.localParticipant;
        // Treat the display label "You" as the local participant
        if (participantName === 'You' || (lp.name || lp.identity) === participantName) return lp;
        for (const rp of room.remoteParticipants.values()) {
          if ((rp.name || rp.identity) === participantName) return rp;
        }
        return null;
      };

      const attachCamera = () => {
        const p: any = findParticipant();
        if (!p) { detachCamera(); return; }
        // Try by source first
        let pub = p.getTrackPublication?.(Track.Source.ScreenShare) || p.getTrackPublication?.(Track.Source.Camera) || null;
        // Fallback: look into video publications list
        if (!pub && p.videoTrackPublications && typeof p.videoTrackPublications.values === 'function') {
          const iter = p.videoTrackPublications.values();
          const first = iter.next();
          if (!first.done) pub = first.value;
        }
        const track = pub?.videoTrack || pub?.track || null;
        if (track && videoRef.current) {
          try {
            track.attach(videoRef.current);
            currentTrack = track;
            setHasVideo(true);
          } catch {
            // ignore
          }
        } else {
          setHasVideo(false);
        }
      };

      const detachCamera = () => {
        if (currentTrack && videoRef.current) {
          try { currentTrack.detach(videoRef.current); } catch { /* ignore */ }
        }
        currentTrack = null;
        setHasVideo(false);
      };

      // initial attempt
      attachCamera();

      // re-attach on room track events
      const reattach = () => attachCamera();
      room.on(RoomEvent.Connected, reattach);
      room.on(RoomEvent.Disconnected, reattach);
      room.on(RoomEvent.TrackSubscribed, reattach);
      room.on(RoomEvent.TrackUnsubscribed, reattach);
      room.on(RoomEvent.TrackMuted, reattach);
      room.on(RoomEvent.TrackUnmuted, reattach);
      room.on(RoomEvent.ParticipantConnected, reattach);
      room.on(RoomEvent.ParticipantDisconnected, reattach);
      room.on(RoomEvent.LocalTrackPublished, reattach);
      room.on(RoomEvent.LocalTrackUnpublished, reattach);

      return () => {
        room.off(RoomEvent.Connected, reattach);
        room.off(RoomEvent.Disconnected, reattach);
        room.off(RoomEvent.TrackSubscribed, reattach);
        room.off(RoomEvent.TrackUnsubscribed, reattach);
        room.off(RoomEvent.TrackMuted, reattach);
        room.off(RoomEvent.TrackUnmuted, reattach);
        room.off(RoomEvent.ParticipantConnected, reattach);
        room.off(RoomEvent.ParticipantDisconnected, reattach);
        room.off(RoomEvent.LocalTrackPublished, reattach);
        room.off(RoomEvent.LocalTrackUnpublished, reattach);
        detachCamera();
      };
    }, [participantName]);

    return (
      <>
        <video ref={videoRef} autoPlay style={{ width: '100%', height: '100%' }} muted={participantName === 'You' || (roomRef.current?.localParticipant?.name || roomRef.current?.localParticipant?.identity) === participantName} />
      </>
    );
  };

  // Attach and play microphone audio for remote participants
  const AudioRenderer = ({ participantName }: { participantName: string }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    let cleanupGesture: (() => void) | null = null;

    useEffect(() => {
      const room = roomRef.current;
      if (!room) return;

      let currentTrack: any | null = null;

      const isLocal = (room.localParticipant.name || room.localParticipant.identity) === participantName;
      if (isLocal) return; // don't play your own audio

      const findParticipant = () => {
        for (const rp of room.remoteParticipants.values()) {
          if ((rp.name || rp.identity) === participantName) return rp;
        }
        return null;
      };

      const attachAudio = () => {
        const p: any = findParticipant();
        if (!p) { detachAudio(); return; }
        let pub = p.getTrackPublication?.(Track.Source.Microphone) || null;
        if (!pub && p.audioTrackPublications && typeof p.audioTrackPublications.values === 'function') {
          const iter = p.audioTrackPublications.values();
          const first = iter.next();
          if (!first.done) pub = first.value;
        }
        const track = pub?.audioTrack || pub?.track || null;
        if (track && audioRef.current) {
          try {
            track.attach(audioRef.current);
            currentTrack = track;
            // Ensure attributes
            audioRef.current.autoplay = true;
            audioRef.current.muted = false;
            // Try play(); if blocked by autoplay policy, wait for a user gesture
            audioRef.current.play().catch(() => {
              const resume = () => {
                audioRef.current && audioRef.current.play().catch(() => {/* ignore */});
                if (cleanupGesture) cleanupGesture();
              };
              const onFirstGesture = () => resume();
              document.addEventListener('click', onFirstGesture, { once: true });
              document.addEventListener('keydown', onFirstGesture, { once: true });
              document.addEventListener('touchend', onFirstGesture, { once: true });
              cleanupGesture = () => {
                document.removeEventListener('click', onFirstGesture);
                document.removeEventListener('keydown', onFirstGesture);
                document.removeEventListener('touchend', onFirstGesture);
                cleanupGesture = null;
              };
            });
          } catch {
            // ignore
          }
        }
      };

      const detachAudio = () => {
        if (currentTrack && audioRef.current) {
          try { currentTrack.detach(audioRef.current); } catch { /* ignore */ }
        }
        currentTrack = null;
        if (cleanupGesture) cleanupGesture();
      };

      attachAudio();

      const reattach = () => attachAudio();
      room.on(RoomEvent.TrackSubscribed, reattach);
      room.on(RoomEvent.TrackUnsubscribed, reattach);
      room.on(RoomEvent.TrackMuted, reattach);
      room.on(RoomEvent.TrackUnmuted, reattach);
      room.on(RoomEvent.ParticipantConnected, reattach);
      room.on(RoomEvent.ParticipantDisconnected, reattach);

      return () => {
        room.off(RoomEvent.TrackSubscribed, reattach);
        room.off(RoomEvent.TrackUnsubscribed, reattach);
        room.off(RoomEvent.TrackMuted, reattach);
        room.off(RoomEvent.TrackUnmuted, reattach);
        room.off(RoomEvent.ParticipantConnected, reattach);
        room.off(RoomEvent.ParticipantDisconnected, reattach);
        detachAudio();
      };
    }, [participantName]);

    return <audio ref={audioRef} autoPlay />;
  };

  const originalProcessorRef = useRef<any | undefined>(undefined);
  const previewDirtyRef = useRef<boolean>(false);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const bgUploadInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedBgUrlRef = useRef<string | null>(null);

  const attachPreviewVideo = () => {
    const room = roomRef.current;
    if (!room || !previewVideoRef.current) return;
    const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    // Try videoTrack first, then generic track
    // @ts-ignore livekit types at runtime
    const vtrack = pub?.videoTrack || pub?.track || null;
    if (vtrack && typeof vtrack.attach === 'function') {
      try { vtrack.attach(previewVideoRef.current); } catch { /* noop */ }
    }
  };

  const detachPreviewVideo = () => {
    const room = roomRef.current;
    if (!room || !previewVideoRef.current) return;
    const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    // @ts-ignore
    const vtrack = pub?.videoTrack || pub?.track || null;
    if (vtrack && typeof vtrack.detach === 'function') {
      try { vtrack.detach(previewVideoRef.current); } catch { /* noop */ }
    }
  };

  const applyProcessor = async (proc: any) => {
    const room = roomRef.current;
    if (!room) return;
    const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    if (pub?.track && 'setProcessor' in pub.track) {
      try {
        // @ts-ignore - livekit track provides setProcessor at runtime
        await (pub.track as any).setProcessor(proc);
        previewDirtyRef.current = true;
        // refresh preview video in case track instance updated
        attachPreviewVideo();
      } catch (e) {
        console.warn('Failed to set processor', e);
      }
    }
  };

  const openBgModal = () => {
    const room = roomRef.current;
    if (room) {
      try { room.localParticipant.setCameraEnabled(true).catch(() => {}); } catch {}
      const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
      // @ts-ignore - processor property available at runtime
      originalProcessorRef.current = pub?.track && (pub.track as any).processor ? (pub.track as any).processor : undefined;
    }
    previewDirtyRef.current = false;
    setIsBgOpen(true);
    // attach current camera feed to modal preview
    setTimeout(attachPreviewVideo, 0);
  };

  const handleBgCancel = async () => {
    const room = roomRef.current;
    if (room && previewDirtyRef.current) {
      const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (pub?.track && 'setProcessor' in pub.track) {
        // @ts-ignore
        await (pub.track as any).setProcessor(originalProcessorRef.current);
      }
    }
    detachPreviewVideo();
    setIsBgOpen(false);
  };

  const handleBgConfirm = () => {
    // finalize current preview
    previewDirtyRef.current = false;
    const room = roomRef.current;
    if (room) {
      const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (bgAction === 'none') {
        // persist normal as baseline
        originalProcessorRef.current = undefined;
      } else {
        // @ts-ignore
        originalProcessorRef.current = pub?.track ? (pub.track as any).processor : undefined;
      }
    }
    detachPreviewVideo();
    setIsBgOpen(false);
  };

  const handleBackgroundChange = async () => {
    const room = roomRef.current;
    if (!room) {
      setIsBgOpen(false);
      return;
    }

    let processor: any | undefined = undefined;

    if (bgAction === 'blur') {
      processor = createBlurProc();
    } else if (bgAction === 'image' && selectedBg) {
      const selectedPreset = [
        { label: 'Library', src: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200&auto=format&fit=crop' },
        { label: 'Shelves', src: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop' },
        { label: 'Navy Desk', src: 'https://images.unsplash.com/photo-1522156373667-4c7234bbd804?q=80&w=1200&auto=format&fit=crop' },
        { label: 'Beach', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop' },
      ].find(p => p.label === selectedBg);

      if (selectedPreset) {
        processor = createImageProc(selectedPreset.src);
      }
    } else if (bgAction === 'upload' && uploadedBgUrlRef.current) {
      processor = createImageProc(uploadedBgUrlRef.current);
    }

    try {
      // Correct way: get the camera track and apply the processor to it
      const cameraTrack = room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (cameraTrack?.track) {
        await cameraTrack.track.setProcessor(processor);
      }
    } catch (e) {
      console.error('Failed to set background', e);
    }

    setIsBgOpen(false);
  };

  const createBlurProc = () => {
    try {
      // @ts-ignore runtime export
      if (typeof BackgroundBlur === 'function') {
        return (BackgroundBlur as any)(15);
      }
    } catch {}
    return undefined;
  };

  const createImageProc = (url: string) => {
    try {
      // @ts-ignore runtime export
      if (typeof VirtualBackground === 'function') {
        return (VirtualBackground as any)(url);
      }
    } catch {}
    return undefined;
  };

  const resetToNormal = async () => {
    const room = roomRef.current;
    if (!room) return;
    const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    if (!pub) return;
    try {
      // @ts-ignore try both shapes depending on SDK
      if (pub.videoTrack && typeof pub.videoTrack.setProcessor === 'function') {
        try { await (pub.videoTrack as any).setProcessor(undefined); } catch {}
        try { await (pub.videoTrack as any).setProcessor(null); } catch {}
        // @ts-ignore clear property if exists
        try { (pub.videoTrack as any).processor = undefined; } catch {}
      }
      // @ts-ignore
      if (pub.track && typeof pub.track.setProcessor === 'function') {
        try { await (pub.track as any).setProcessor(undefined); } catch {}
        try { await (pub.track as any).setProcessor(null); } catch {}
        // @ts-ignore clear property if exists
        try { (pub.track as any).processor = undefined; } catch {}
      }
      // Force-restart camera to ensure pipeline is cleared across SDK versions
      await room.localParticipant.setCameraEnabled(false);
      await room.localParticipant.setCameraEnabled(true);
      // Update baseline so Confirm preserves normal state
      // @ts-ignore
      originalProcessorRef.current = undefined;
      previewDirtyRef.current = true;
      attachPreviewVideo();
    } catch (e) {
      console.warn('Failed to reset processor', e);
    }
  };

  const getIdentityForName = React.useCallback((name: string): string | null => {
    const room = roomRef.current;
    if (!room) return null;
    if (name === 'You') return room.localParticipant?.identity ?? null;
    for (const rp of room.remoteParticipants.values()) {
      if ((rp.name || rp.identity) === name) return String(rp.identity);
    }
    return null;
  }, []);

  const requestUnmute = async (participantName: string) => {
    const room = roomRef.current;
    if (!room) return;
    const identity = getIdentityForName(participantName);
    if (!identity) return;
    try {
      // Payload with explicit target identity for broadcast fallback
      const json = { type: 'request_mic', unmute: true, to: identity };
      const payload = new TextEncoder().encode(JSON.stringify(json));
      // Try targeted send (if SDK supports)
      try {
      // @ts-ignore destinationIdentities supported at runtime
      await room.localParticipant.publishData(payload, { reliable: true, destinationIdentities: [identity] });
      } catch {
        // ignore
      }
      // Broadcast fallback so older SDK versions can still receive
      await room.localParticipant.publishData(payload, { reliable: true });
    } catch (e) {
      console.error('Failed to send unmute request:', e);
    }
  };

  const requestOpenCamera = async (participantName: string) => {
    const room = roomRef.current;
    if (!room) return;
    const identity = getIdentityForName(participantName);
    if (!identity) return;
    try {
      const json = { type: 'request_camera', on: true, to: identity };
      const payload = new TextEncoder().encode(JSON.stringify(json));
      try {
      // @ts-ignore
      await room.localParticipant.publishData(payload, { reliable: true, destinationIdentities: [identity] });
      } catch {
        // ignore
      }
      await room.localParticipant.publishData(payload, { reliable: true });
    } catch (e) {
      console.error('Failed to send open camera request:', e);
    }
  };

  const kickFromMeeting = async (participantName: string) => {
    const room = roomRef.current;
    if (!room) return;
    const identity = getIdentityForName(participantName);
    if (!identity) return;
    try {
      await fetch('/api/live-class/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: room.name, identity }),
      });
    } catch (e) {
      console.error('Failed to kick participant:', e);
    } finally {
      setMenuOpen(null);
    }
  };

  const handleUploadClick = () => {
    setBgAction('upload');
    bgUploadInputRef.current?.click();
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) { // 4MB limit
      alert('Image is too large. Please select an image under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      if (imageDataUrl) {
        uploadedBgUrlRef.current = imageDataUrl;
        setBgAction('upload');
        const p = createImageProc(imageDataUrl);
        if (p) { applyProcessor(p); }
        previewDirtyRef.current = true;
      }
    };
    reader.readAsDataURL(file);

    if (e.target) {
      e.target.value = '';
    }
  };

  if (pinned.length > 0) {
    const pinnedNames = new Set(pinned.map(p => p.name));
    const unpinnedParticipants: Participant[] = effectiveParticipants
      .filter((p: Participant) => !pinnedNames.has(p.name))
      // exclude self and any pseudo tiles
      .filter((p: Participant) => p.name !== 'You' && p.name !== 'Screen Share');

    return (
      <div className="video-room-view">
        <div className="highlight-view">
          <div className={`pinned-participants-grid ${pinned.length === 1 ? 'single' : ''}`}>
            {pinned.map((participant, idx) => (
              <div key={`${participant.name}-${idx}`} className="participant-tile large" onClick={() => onPinToggle(participant)}>
                <div className="participant-video-placeholder">
                  <VideoRenderer participantName={participant.name} preferScreenShare />
                  <AudioRenderer participantName={participant.name} />
                  {(() => { const id = getIdentityForName(participant.name); return id && raisedHands.has(id) ? <div className="hand-badge" title="Raised hand">✋</div> : null; })()}
                </div>
                <div className="participant-overlay">
                  <span className="participant-name">{participant.name}</span>
                  <div className="participant-icons">
                    <div className="options-wrapper">
                      <button
                        className="icon-button options-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = menuOpen === participant.name ? null : participant.name;
                          setMenuOpen(next);
                          if (next) {
                            const btn = e.currentTarget as HTMLElement;
                            const rect = btn.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const estimatedMenuHeight = 200; // px
                            setMenuOpenUp(spaceBelow < estimatedMenuHeight + 16);
                          }
                        }}
                      >
                        <BsThreeDotsVertical style={{ color: 'white' }} />
                      </button>
                      {menuOpen === participant.name && (
                        <div className={`options-menu ${menuOpenUp ? 'open-up' : ''}`} onClick={(e) => e.stopPropagation()}>
                          <button className="options-menu-item" onClick={() => { onPinToggle(participant); setMenuOpen(null); }}>
                            <AiOutlinePushpin />
                            <span>Unpin</span>
                          </button>
                          {participant.name !== 'You' && (
                            <>
                              <button className="options-menu-item" onClick={() => { requestUnmute(participant.name); setMenuOpen(null); }}>
                                {participant.muted ? <BsMicFill /> : <FaMicrophoneSlash />}
                                <span>Unmute</span>
                              </button>
                              <button className="options-menu-item" onClick={() => kickFromMeeting(participant.name)}>
                                <FiUsers />
                                <span>Kick from meeting</span>
                              </button>
                              <button className="options-menu-item" onClick={() => { requestOpenCamera(participant.name); setMenuOpen(null); }}>
                                <MdOutlineVideocam />
                                <span>Request open camera</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <button className={`icon-button mic-button ${participant.muted ? 'muted' : ''}`}>
                      {participant.muted ? <BsMicMuteFill /> : <BsMicFill />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="participant-sidebar">
            {unpinnedParticipants.map((participant, index) => (
              <div key={index} className="participant-tile small">
                <div className="participant-video-placeholder" onClick={() => onPinToggle(participant)}>
                  <VideoRenderer participantName={participant.name} preferScreenShare />
                  <AudioRenderer participantName={participant.name} />
                  {(() => { const id = getIdentityForName(participant.name); return id && raisedHands.has(id) ? <div className="hand-badge" title="Raised hand">✋</div> : null; })()}
                </div>
                <div className="participant-overlay">
                  <span className="participant-name">{participant.name}</span>
                  <div className="participant-icons">
                    <div className="options-wrapper">
                      <button
                        className="icon-button options-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = menuOpen === participant.name ? null : participant.name;
                          setMenuOpen(next);
                          if (next) {
                            const btn = e.currentTarget as HTMLElement;
                            const rect = btn.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const estimatedMenuHeight = 200; // px
                            setMenuOpenUp(spaceBelow < estimatedMenuHeight + 16);
                          }
                        }}
                      >
                        <BsThreeDotsVertical />
                      </button>
                      {menuOpen === participant.name && (
                        <div className={`options-menu ${menuOpenUp ? 'open-up' : ''}`} onClick={(e) => e.stopPropagation()}>
                          <button className="options-menu-item" onClick={() => { onPinToggle(participant); setMenuOpen(null); }}>
                            <AiOutlinePushpin />
                            <span>Pin</span>
                          </button>
                          {participant.name !== 'You' && (
                            <>
                              <button className="options-menu-item" onClick={() => { requestUnmute(participant.name); setMenuOpen(null); }}>
                                {participant.muted ? <BsMicFill /> : <FaMicrophoneSlash />}
                                <span>Unmute</span>
                              </button>
                              <button className="options-menu-item" onClick={() => kickFromMeeting(participant.name)}>
                                <FiUsers />
                                <span>Kick from meeting</span>
                              </button>
                              <button className="options-menu-item" onClick={() => { requestOpenCamera(participant.name); setMenuOpen(null); }}>
                                <MdOutlineVideocam />
                                <span>Request open camera</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <button className={`icon-button mic-button ${participant.muted ? 'muted' : ''}`}>
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
                  {!m.self && <div className="chat-avatar"><FiUser /></div>}
                  <div className="chat-bubble">
                    <div className="chat-meta">
                      {!m.self && <span className="chat-name">{m.name}</span>}
                      <span className="chat-time">{m.time}</span>
                    </div>
                    <div className="chat-content">
                      {m.text && <div className="chat-text">{m.text}</div>}
                      {m.imageUrl && <img src={m.imageUrl} alt="attached image" className="chat-image" />}
                    </div>
                  </div>
                  {m.self && <div className="chat-avatar"><FiUser /></div>}
                </div>
              ))}
            </div>
            <div className="chat-inputbar">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button className="chat-attach" title="Attach" onClick={() => fileInputRef.current?.click()}><FiPaperclip /></button>
              <input
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleChatSend(); }}
                placeholder="Type Something..."
                className="chat-input"
              />
              <button className="chat-send" title="Send" onClick={handleChatSend}><IoPaperPlane /></button>
            </div>
          </aside>
        )}
        {showLeaveConfirm && (
          <ConfirmationModal
            title="Leave Class?"
            message="Are you sure want to leave class?"
            confirmText="Leave"
            onConfirm={handleLeave}
            onCancel={() => setShowLeaveConfirm(false)}
          />
        )}
        {showEndConfirm && (
          <ConfirmationModal
            title="End Meeting for All?"
            message="Are you sure want to end meeting for all?"
            confirmText="End Class"
            onConfirm={handleEndClass}
            onCancel={() => setShowEndConfirm(false)}
          />
        )}
        {showStopRecordConfirm && (
          <ConfirmationModal
            title="Stop Recording?"
            message={<>Are you sure want to stop recording this<br />session?</>}
            confirmText="Yes"
            onConfirm={async () => {
              handleStopRecording(); // Stop the recording and trigger download
              setIsRecording(false);
              setShowStopRecordConfirm(false);
              setRecordStartedBy(null);
              setShowRecordingNotice(false);
              setAckRecordingForSession(false);
              // broadcast stop
              try {
                const room = roomRef.current;
                const by = room?.localParticipant?.identity;
                const payload = new TextEncoder().encode(JSON.stringify({ type: 'recording', started: false, by }));
                await room?.localParticipant.publishData(payload, { reliable: true });
              } catch {}
            }}
            onCancel={() => setShowStopRecordConfirm(false)}
            confirmButtonType="success"
          />
        )}
        {showStopShareConfirm && (
          <ConfirmationModal
            title="Stop Share Screen?"
            message="Are you sure want to stop sharing screen?"
            confirmText="Stop Share"
            onConfirm={() => {
              stopScreenShare();
              setShowStopShareConfirm(false);
            }}
            onCancel={() => setShowStopShareConfirm(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`video-room-view ${isScreenSharing ? 'screenshare-layout' : ''}`} ref={containerRef}>
      {isScreenSharing ? (
        <div className="screenshare-wrapper">
          <div className="screenshare-stage">
            <div className="screenshare-banner">
              <span className="banner-icon" aria-hidden>🖥️</span>
              <span>You is Sharing a Screen</span>
            </div>
            <video ref={shareStageVideoRef} autoPlay playsInline muted className="screenshare-video" />
            {/* PiP self webcam card */}
            <div className="pip-self">
              <video ref={pipSelfVideoRef} autoPlay playsInline muted className="pip-video" />
              <div className="pip-label">You</div>
            </div>
          </div>
          <div className="screenshare-sidebar">
            <div className="sidebar-grid">
              {effectiveParticipants
                // Show only other participants (exclude self and pseudo tiles)
                .filter(p => p.name !== 'You' && p.name !== 'Screen Share' && (localIdentity ? p.name !== localIdentity : true))
                .map((participant, idx) => (
                  <div key={idx} className="participant-tile small">
                    <div className="participant-video-placeholder">
                      <VideoRenderer participantName={participant.name} preferScreenShare />
                      <AudioRenderer participantName={participant.name} />
                      {(() => { const id = ((): string | null => { const room = roomRef.current; if (!room) return null; if (participant.name === 'You') return room.localParticipant?.identity ?? null; for (const rp of room.remoteParticipants.values()) { if ((rp.name || rp.identity) === participant.name) return rp.identity as string; } return null; })(); return id && raisedHands.has(id) ? <div className="hand-badge" title="Raised hand">✋</div> : null; })()}
                    </div>
                    <div className="participant-overlay">
                      <span className="participant-name">{participant.name}</span>
                      <div className="participant-icons">
                        <div className="options-wrapper">
                          <button
                            className="icon-button options-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = menuOpen === participant.name ? null : participant.name;
                              setMenuOpen(next);
                              if (next) {
                                const btn = e.currentTarget as HTMLElement;
                                const rect = btn.getBoundingClientRect();
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const estimatedMenuHeight = 200; // px
                                setMenuOpenUp(spaceBelow < estimatedMenuHeight + 16);
                              }
                            }}
                          >
                            <BsThreeDotsVertical />
                          </button>
                          {menuOpen === participant.name && (
                            <div className={`options-menu ${menuOpenUp ? 'open-up' : ''}`} onClick={(e) => e.stopPropagation()}>
                              <button className="options-menu-item" onClick={() => { onPinToggle(participant); setMenuOpen(null); }}>
                                <AiOutlinePushpin />
                                <span>Pin</span>
                              </button>
                              {participant.name !== 'You' && (
                                <>
                                  <button className="options-menu-item" onClick={() => { requestUnmute(participant.name); setMenuOpen(null); }}>
                                    {participant.muted ? <BsMicFill /> : <FaMicrophoneSlash />}
                                    <span>Unmute</span>
                                  </button>
                                  <button className="options-menu-item" onClick={() => kickFromMeeting(participant.name)}>
                                    <FiUsers />
                                    <span>Kick from meeting</span>
                                  </button>
                                  <button className="options-menu-item" onClick={() => { requestOpenCamera(participant.name); setMenuOpen(null); }}>
                                    <MdOutlineVideocam />
                                    <span>Request open camera</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <button className={`icon-button mic-button ${participant.muted ? 'muted' : ''}`}>
                          {participant.muted ? <BsMicMuteFill /> : <BsMicFill />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="video-grid">
          {effectiveParticipants.map((participant, idx) => (
            <div key={idx} className="participant-tile" onClick={() => onPinToggle(participant)}>
              <div className="participant-video-placeholder">
                <VideoRenderer participantName={participant.name} preferScreenShare />
                <AudioRenderer participantName={participant.name} />
                {(() => { const id = ((): string | null => { const room = roomRef.current; if (!room) return null; if (participant.name === 'You') return room.localParticipant?.identity ?? null; for (const rp of room.remoteParticipants.values()) { if ((rp.name || rp.identity) === participant.name) return rp.identity as string; } return null; })(); return id && raisedHands.has(id) ? <div className="hand-badge" title="Raised hand">✋</div> : null; })()}
              </div>
              <div className="participant-overlay">
                <span className="participant-name">{participant.name}</span>
                <div className="participant-icons">
                  <div className="options-wrapper">
                    <button
                      className="icon-button options-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = menuOpen === participant.name ? null : participant.name;
                        setMenuOpen(next);
                        if (next) {
                          const btn = e.currentTarget as HTMLElement;
                          const rect = btn.getBoundingClientRect();
                          const spaceBelow = window.innerHeight - rect.bottom;
                          const estimatedMenuHeight = 200; // px
                          setMenuOpenUp(spaceBelow < estimatedMenuHeight + 16);
                        }
                      }}
                    >
                      <BsThreeDotsVertical />
                    </button>
                    {menuOpen === participant.name && (
                      <div className={`options-menu ${menuOpenUp ? 'open-up' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <button className="options-menu-item" onClick={() => { onPinToggle(participant); setMenuOpen(null); }}>
                          <AiOutlinePushpin />
                          <span>{pinned.some((p: Participant) => p.name === participant.name) ? 'Unpin' : 'Pin'}</span>
                        </button>
                        {participant.name !== 'You' && (
                          <>
                            <button className="options-menu-item" onClick={() => { requestUnmute(participant.name); setMenuOpen(null); }}>
                              {participant.muted ? <BsMicFill /> : <FaMicrophoneSlash />}
                              <span>Unmute</span>
                            </button>
                            <button className="options-menu-item" onClick={() => kickFromMeeting(participant.name)}>
                              <FiUsers />
                              <span>Kick from meeting</span>
                            </button>
                            <button className="options-menu-item" onClick={() => { requestOpenCamera(participant.name); setMenuOpen(null); }}>
                              <MdOutlineVideocam />
                              <span>Request open camera</span>
                            </button>
                          </>
                        )}
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
      )}
      <Controls />
      {isChatOpen && (
        <aside className="chat-panel" role="dialog" aria-label="Class Chat">
          <button className="chat-close" onClick={() => setIsChatOpen(false)}>×</button>
          <div className="chat-body" ref={chatListRef}>
            {messages.map(m => (
              <div key={m.id} className={`chat-msg ${m.self ? 'self' : ''}`}>
                {!m.self && <div className="chat-avatar"><FiUser /></div>}
                <div className="chat-bubble">
                  <div className="chat-meta">
                    {!m.self && <span className="chat-name">{m.name}</span>}
                    <span className="chat-time">{m.time}</span>
                  </div>
                  <div className="chat-content">
                    {m.text && <div className="chat-text">{m.text}</div>}
                    {m.imageUrl && <img src={m.imageUrl} alt="attached image" className="chat-image" />}
                  </div>
                </div>
                {m.self && <div className="chat-avatar"><FiUser /></div>}
              </div>
            ))}
          </div>
          <div className="chat-inputbar">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button className="chat-attach" title="Attach" onClick={() => fileInputRef.current?.click()}><FiPaperclip /></button>
            <input
              ref={chatInputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleChatSend(); }}
              placeholder="Type Something..."
              className="chat-input"
            />
            <button className="chat-send" title="Send" onClick={handleChatSend}><IoPaperPlane /></button>
          </div>
        </aside>
      )}
      {showLeaveConfirm && (
        <ConfirmationModal
          title="Leave Class?"
          message="Are you sure want to leave class?"
          confirmText="Leave"
          onConfirm={handleLeave}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}
      {showEndConfirm && (
        <ConfirmationModal
          title="End Meeting for All?"
          message="Are you sure want to end meeting for all?"
          confirmText="End Class"
          onConfirm={handleEndClass}
          onCancel={() => setShowEndConfirm(false)}
        />
      )}
      {showStopRecordConfirm && (
        <ConfirmationModal
          title="Stop Recording?"
          message={<>Are you sure want to stop recording this<br />session?</>}
          confirmText="Yes"
          onConfirm={async () => {
            handleStopRecording(); // Stop the recording and trigger download
            setIsRecording(false);
            setShowStopRecordConfirm(false);
            setRecordStartedBy(null);
            setShowRecordingNotice(false);
            setAckRecordingForSession(false);
            // broadcast stop
            try {
              const room = roomRef.current;
              const by = room?.localParticipant?.identity;
              const payload = new TextEncoder().encode(JSON.stringify({ type: 'recording', started: false, by }));
              await room?.localParticipant.publishData(payload, { reliable: true });
            } catch {}
          }}
          onCancel={() => setShowStopRecordConfirm(false)}
          confirmButtonType="success"
        />
      )}
      {showStopShareConfirm && (
        <ConfirmationModal
          title="Stop Share Screen?"
          message="Are you sure want to stop sharing screen?"
          confirmText="Stop Share"
          onConfirm={() => {
            stopScreenShare();
            setShowStopShareConfirm(false);
          }}
          onCancel={() => setShowStopShareConfirm(false)}
        />
      )}
      {isShareOpen && (
        <div className="share-modal-backdrop" onClick={() => { stopSharePreview(); setIsShareOpen(false); }}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-header">
              <div className="share-title">
                <span className="share-icon">🖥️</span>
                <h3>Share Screen</h3>
              </div>
              <button className="share-close" onClick={() => { stopSharePreview(); setIsShareOpen(false); }}>×</button>
            </div>
            <p className="share-subtitle">Please select the content you would like to share with others.</p>

            <div className="bg-content">
              <div className="bg-preview-col">
                <h4>Entire Screen</h4>
                <div className="bg-preview-card" onClick={() => startSharePreview('screen')} style={{ cursor: 'pointer' }}>
                  <video ref={sharePreviewVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', background: '#eef2f7' }} />
                </div>
                <div style={{ textAlign: 'center', marginTop: 8, color: '#7b8a9a' }}>Screen</div>
              </div>
              <div className="bg-presets-col">
                <h4>Application Windows</h4>
                <div className="bg-presets-grid">
                  <button className={`bg-item ${selectedSource === 'window' ? 'selected' : ''}`} onClick={() => startSharePreview('window')}>
                    <div className="bg-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#9aa9b8' }}>Pick a Window…</div>
                  </button>
                  <button className={`bg-item ${selectedSource === 'tab' ? 'selected' : ''}`} onClick={() => startSharePreview('screen') /* we still ask OS picker; user can choose This Tab */}>
                    <div className="bg-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#9aa9b8' }}>This Tab…</div>
                  </button>
                </div>
                <div style={{ marginTop: 8, color: '#7b8a9a', fontSize: 13 }}>
                  Note: For security reasons, browsers do not allow websites to list or preview your windows. After clicking a button above, your browser's system picker will open where you can select the exact window/tab to share.
                </div>
              </div>
            </div>
            <div className="share-footer">
              <button className="share-confirm" disabled={!sharePreviewStreamRef.current} onClick={confirmScreenShare}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      {isBgOpen && (
        <div className="share-modal-backdrop" onClick={handleBgCancel}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-header">
              <div className="share-title">
                <span className="share-icon">🌿</span>
                <h3>Virtual Backgrounds</h3>
              </div>
              <button className="share-close" onClick={handleBgCancel}>×</button>
            </div>
            <p className="share-subtitle">Choose an image to replace your background.</p>

            <div className="bg-content">
              <div className="bg-preview-col">
                <h4>Preview</h4>
                <div className="bg-preview-card">
                  <video ref={previewVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                </div>
              </div>
              <div className="bg-presets-col">
                <h4>Choose from Presets</h4>
                <div className="bg-presets-grid">
                  {[
                    { label: 'Library', src: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200&auto=format&fit=crop' },
                    { label: 'Shelves', src: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop' },
                    { label: 'Navy Desk', src: 'https://images.unsplash.com/photo-1522156373667-4c7234bbd804?q=80&w=1200&auto=format&fit=crop' },
                    { label: 'Beach', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop' },
                  ].map((it) => (
                    <button
                      key={it.label}
                      className={`bg-item ${selectedBg === it.label ? 'selected' : ''}`}
                      onClick={async () => {
                        setSelectedBg(it.label);
                        setBgAction('image');
                        // Apply live preview immediately
                        const p = createImageProc(it.src);
                        if (p) { await applyProcessor(p); }
                      }}
                    >
                      <img className="bg-thumb" src={it.src} alt={it.label} />
                    </button>
                  ))}
                </div>
                <div className="bg-action-bar">
                  <button className={`bg-action ${bgAction === 'none' ? 'active' : ''}`} title="None" onClick={async () => {
                    await resetToNormal();
                    setSelectedBg(null);
                    setBgAction('none');
                  }}>
                    <MdPerson />
                  </button>
                  <button className={`bg-action ${bgAction === 'blur' ? 'active' : ''}`} title="Blur" onClick={async () => {
                    const p = createBlurProc();
                    if (p) { await applyProcessor(p); setBgAction('blur'); }
                  }}>
                    <MdBlurOn />
                  </button>
                  <button className={`bg-action ${bgAction === 'upload' ? 'active' : ''}`} title="Upload" onClick={handleUploadClick}>
                    <MdAddPhotoAlternate />
                  </button>
                  <input
                    ref={bgUploadInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleUploadFile}
                  />
                </div>
              </div>
            </div>
            <div className="share-footer">
              <button
                className="share-confirm"
                disabled={!bgAction}
                onClick={handleBgConfirm}
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
              <button className="record-continue" onClick={async () => {
                setIsRecordOpen(false);
                const success = await handleStartRecording(); // Start the recording
                if (success) {
                  setIsRecording(true);
                  setAckRecordingForSession(true); // initiator implicitly consents
                  try {
                    const room = roomRef.current;
                    const by = room?.localParticipant?.identity;
                    setRecordStartedBy(by || null);
                    const payload = new TextEncoder().encode(JSON.stringify({ type: 'recording', started: true, by }));
                    await room?.localParticipant.publishData(payload, { reliable: true });
                  } catch {}
                }
              }}>Continue</button>
              <button className="record-cancel" onClick={() => setIsRecordOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showRecordingNotice && (
        <div className="share-modal-backdrop" onClick={() => { /* block backdrop close */ }}>
          <div className="record-modal" role="dialog" aria-labelledby="recording-consent-title" onClick={(e) => e.stopPropagation()}>
            <div className="record-header">
              <h3 id="recording-consent-title">This Class Is Being Recorded</h3>
            </div>
            <p className="record-desc">By continuing to be in the session, you are consenting to be recorded.</p>
            <div className="record-actions">
              <button className="record-continue" onClick={() => { setShowRecordingNotice(false); setAckRecordingForSession(true); }}>Continue</button>
            </div>
          </div>
        </div>
      )}
      {isShareInfoOpen && (
        <div className="shareinfo-backdrop" role="dialog" aria-modal="true">
          <div className="shareinfo-modal">
            <h3 className="shareinfo-title">Meeting Class Information</h3>
            <div className="shareinfo-body">
              <p><strong>Class Name</strong> : {typeof window !== 'undefined' ? (sessionStorage.getItem('class_name_hint') || sessionStorage.getItem('room_name_hint') || '—') : '—'}</p>
              <p><strong>Class Key</strong> : {typeof window !== 'undefined' ? (sessionStorage.getItem('join_key') || '—') : '—'}</p>
            </div>
            <div className="shareinfo-actions">
              <button
                className="shareinfo-btn primary"
                onClick={async () => {
                  try {
                    const name = typeof window !== 'undefined' ? ((sessionStorage.getItem('class_name_hint') || sessionStorage.getItem('room_name_hint') || '')) : '';
                    const key = typeof window !== 'undefined' ? (sessionStorage.getItem('join_key') || '') : '';
                    const text = `Class Name : ${name || '—'}\nClass Key : ${key || '—'}`;
                    await navigator.clipboard.writeText(text);
                  } catch {}
                }}
              >
                Copy Info
              </button>
              <button className="shareinfo-btn outline" onClick={() => setIsShareInfoOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {showMicRequest && (
        <ConfirmationModal
          title="Teacher requests to unmute"
          message="Allow microphone to be turned on?"
          confirmText="Turn On Mic"
          onConfirm={async () => {
            try { 
              await roomRef.current?.localParticipant?.setMicrophoneEnabled(true); 
              setIsMicMuted(false);
              try { recomputeParticipants(); } catch {}
            } catch {}
            setShowMicRequest(false);
          }}
          onCancel={() => setShowMicRequest(false)}
          confirmButtonType="success"
      />
    )}
      
      {showCamRequest && (
        <ConfirmationModal
          title="Teacher requests to open camera"
          message="Allow camera to be turned on?"
          confirmText="Turn On Camera"
          onConfirm={async () => {
            try { 
              await roomRef.current?.localParticipant?.setCameraEnabled(true); 
              setIsCamOn(true);
              try { recomputeParticipants(); } catch {}
            } catch {}
            setShowCamRequest(false);
          }}
          onCancel={() => setShowCamRequest(false)}
          confirmButtonType="success"
        />
      )}
    </div>
  );
};

// Component for Monitoring Mode View
const MonitoringModeView = () => {
  const router = useRouter();
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
  // Friendly name map by IP, persisted locally so the teacher can label each PC
  const [pcAliasMap, setPcAliasMap] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('pc_alias_map') || '{}') || {}; } catch { return {}; }
  });
  const pcAliasRef = useRef<Record<string, string>>(pcAliasMap);
  useEffect(() => { pcAliasRef.current = pcAliasMap; }, [pcAliasMap]);
  const setAlias = (ip: string, alias: string) => {
    const next = { ...pcAliasMap };
    const clean = String(alias || '').trim();
    if (clean) next[ip] = clean; else delete next[ip];
    setPcAliasMap(next);
    pcAliasRef.current = next;
    try { localStorage.setItem('pc_alias_map', JSON.stringify(next)); } catch {}
    setMonitoringParticipants(prev => prev.map(p => (p.ip === ip ? { ...p, name: clean || p.ip } : p)));
    // Compute new name and update list immediately for instant UI feedback
    const newName = clean || ip;
    let oldName: string | undefined;
    setMonitoringParticipants(prev => prev.map((p: any) => {
      if (p.ip === ip) { oldName = p.name; return { ...p, name: newName }; }
      return p;
    }));
    // If highlight/selection uses name, keep it in sync
    setSelectedName(prev => (prev && prev === oldName ? newName : prev));
    // If there are active direct communication targets, update their displayed names too
    setDirectCommTargets?.((prev: any[]) => prev.map((t: any) => (t.ip === ip ? { ...t, name: newName } : t)));
  };

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
            name: pcAliasRef.current[p.ipaddres] || p.nama || p.ipaddres,
            ip: p.ipaddres,
            image: `https://${p.ipaddres}:8888/`,
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
    try {
      // Reuse global LiveKit room instance, available across modes
      const room = (typeof window !== 'undefined' ? (window as any)['__lk_room_instance__'] : null) as Room | null;
      if (room) {
        const payload = new TextEncoder().encode(JSON.stringify({ type: 'force_mute', allowSelfUnmute }));
        room.localParticipant.publishData(payload, { reliable: true }).catch(() => {});
      }
    } catch {}
    setIsMuteAllOpen(false);
  };

  const handleLeave = async () => {
    try { router.push('/'); } catch {}
  };

  const handleEndClass = async () => {
    try {
      const roomName = 'default-room';
      await fetch('/api/live-class/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName }),
      });
    } catch {}
    try { router.push('/'); } catch {}
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
                    <span
                      className="participant-name"
                      title="Double-click to rename"
                      onClick={(e) => { e.stopPropagation(); }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const ip = (sel as any).ip || '';
                        const next = prompt('Set a name for this PC', pcAliasMap[ip] || sel.name || ip);
                        if (next !== null) setAlias(ip, next);
                      }}
                    >{sel.name}</span>
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
                <div key={idx} className="participant-tile small">
                  <div className="participant-video-placeholder" onClick={() => setSelectedName(p.name)}>
                    <MonitoringCardContent participant={p} />
                  </div>
                  <div className="participant-overlay">
                    <span
                      className="participant-name"
                      title="Double-click to rename"
                      onClick={(e) => { e.stopPropagation(); }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const ip = (p as any).ip || '';
                        const next = prompt('Set a name for this PC', pcAliasMap[ip] || p.name || ip);
                        if (next !== null) setAlias(ip, next);
                      }}
                    >{p.name}</span>
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
                <span
                  className="monitoring-name"
                  title="Double-click to rename"
                  onClick={(e) => { e.stopPropagation(); }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const ip = (participant as any).ip || '';
                    const next = prompt('Set a name for this PC', pcAliasMap[ip] || participant.name || ip);
                    if (next !== null) setAlias(ip, next);
                  }}
                >{participant.name}</span>
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
            <span>{formatHHMMSS(useClassTimer())}</span>
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
          onConfirm={handleLeave}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}
      {showEndConfirm && (
        <ConfirmationModal
          title="End Meeting for All?"
          message="Are you sure want to end meeting for all?"
          confirmText="End Class"
          onConfirm={handleEndClass}
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
          <button className="ma-yes" onClick={onYes} disabled={!allowSelfUnmute} title={!allowSelfUnmute ? 'Check Allow participants first' : undefined}>Yes</button>
          <button className="ma-no" onClick={onNo}>No</button>
        </div>
      </div>
    </div>
  );
};

const LiveClass = () => {
  const router = useRouter();
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

// Shared timer utils
const CLASS_TIMER_KEY = 'class_start_ms';

function ensureClassStartMs(): number {
  if (typeof window === 'undefined') return Date.now();
  const raw = sessionStorage.getItem(CLASS_TIMER_KEY);
  let start = raw ? Number(raw) : NaN;
  if (!raw || Number.isNaN(start) || start <= 0) {
    start = Date.now();
    try { sessionStorage.setItem(CLASS_TIMER_KEY, String(start)); } catch {}
  }
  return start;
}

function useClassTimer() {
  const [elapsed, setElapsed] = useState<number>(0);
  useEffect(() => {
    const tick = () => {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem(CLASS_TIMER_KEY) : null;
      const start = raw ? Number(raw) : Number.POSITIVE_INFINITY;
      const secs = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setElapsed(secs);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return elapsed;
}

function formatHHMMSS(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const hh = hrs.toString().padStart(2, '0');
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export default LiveClass;