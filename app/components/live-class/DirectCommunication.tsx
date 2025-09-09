import React, { useState, useRef, useEffect } from 'react';
import { FiMicOff, FiPhoneOff, FiMic } from 'react-icons/fi';
import './live-class.css';

interface DirectCommunicationProps {
  students: {
    name: string;
    image: string;
    type?: string;
  }[];
  onDisconnect: () => void;
}

const DirectCommunication: React.FC<DirectCommunicationProps> = ({ students, onDisconnect }) => {
  const [isMuted, setIsMuted] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioBuffersRef = useRef<Float32Array[]>([]);

  const startRecording = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      console.error('MediaDevices API not available.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;
      const source = context.createMediaStreamSource(stream);
      const scriptNode = context.createScriptProcessor(4096, 1, 1);
      scriptNodeRef.current = scriptNode;

      scriptNode.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        audioBuffersRef.current.push(new Float32Array(inputData));
      };

      source.connect(scriptNode);
      scriptNode.connect(context.destination);
      console.log('Recording started with AudioContext');
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecordingAndUpload = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (scriptNodeRef.current) {
      scriptNodeRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    const audioBlob = encodeWAV(audioBuffersRef.current, audioContextRef.current?.sampleRate || 44100);
    audioBuffersRef.current = []; // Clear buffers

    console.log(`INFO: Memulai pengiriman broadcast ke ${students.length} siswa.`);

    const uploadPromises = students.map(student => {
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording-${student.name}.wav`);
      formData.append('studentName', student.name);

      let ip = '127.0.0.1';
      try {
        const url = new URL(student.image);
        ip = url.hostname;
      } catch (e) {
        console.error(`GAGAL: URL tidak valid untuk siswa ${student.name}:`, student.image);
        return Promise.resolve({ success: false, studentName: student.name, reason: 'Invalid URL' });
      }

      const UPLOAD_API = `http://${ip}:8888/audio/upload`;
      console.log(`INFO: Mengirim ke ${student.name} di IP: ${ip}`);
      
      return fetch(UPLOAD_API, { method: 'POST', body: formData })
        .then(async uploadResponse => {
          if (!uploadResponse.ok) {
            throw new Error(await uploadResponse.text());
          }
          return uploadResponse.json();
        })
        .then(responseData => {
          const filePath = responseData.path;
          if (!filePath) throw new Error('Filepath tidak ditemukan di respons.');

          const PLAY_API = `http://${ip}:8888/audio/play`;
          return fetch(PLAY_API, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filepath: filePath })
          });
        })
        .then(playResponse => {
          if (!playResponse.ok) throw new Error('Gagal memicu pemutaran.');
          console.log(`SUKSES: Audio berhasil dikirim dan diputar untuk ${student.name}`);
          return { success: true, studentName: student.name };
        })
        .catch(error => {
          console.error(`GAGAL untuk ${student.name}:`, error.message);
          return { success: false, studentName: student.name, reason: error.message };
        });
    });

    Promise.all(uploadPromises).then(results => {
      const successfulUploads = results.filter(r => r.success).length;
      const failedUploads = results.length - successfulUploads;
      alert(`Pengiriman selesai. Berhasil: ${successfulUploads}, Gagal: ${failedUploads}.`);
    });
  };

  const handleMicToggle = () => {
    if (isMuted) {
      startRecording();
    } else {
      stopRecordingAndUpload();
    }
    setIsMuted(!isMuted);
  };

  const getDisplayLabel = () => {
    if (students.length === 1) {
      return students[0].name.slice(0, 2).toUpperCase();
    }
    if (students.length > 1) {
      return 'ALL';
    }
    return '';
  };

  return (
    <div className="direct-communication-overlay">
      <div className="direct-communication-panel">
        <div className="dc-avatars-container">
          <div className="dc-avatar">
            <span>{getDisplayLabel()}</span>
          </div>
          <div className="dc-connection-status">
            <span className="dc-connection-text">connected</span>
            <div className="dc-connection-line"></div>
          </div>
          <div className="dc-avatar self">
            <span>YOU</span>
          </div>
        </div>
        <div className="dc-actions-container">
          <button className={`dc-action-button mute ${isMuted ? 'muted' : ''}`} onClick={handleMicToggle}>
            {isMuted ? <FiMicOff /> : <FiMic />}
          </button>
          <button className="dc-action-button disconnect" onClick={onDisconnect}>
            <FiPhoneOff />
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to encode WAV
function encodeWAV(buffers: Float32Array[], sampleRate: number): Blob {
  const buffer = mergeBuffers(buffers);
  const dataview = encode(buffer, sampleRate);
  return new Blob([dataview], { type: 'audio/wav' });
}

function mergeBuffers(buffers: Float32Array[]): Float32Array {
  let result = new Float32Array(buffers.reduce((acc, b) => acc + b.length, 0));
  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}

function encode(samples: Float32Array, sampleRate: number): DataView {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return view;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export default DirectCommunication;
