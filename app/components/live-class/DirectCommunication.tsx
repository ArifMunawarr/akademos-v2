import React, { useState, useRef, useEffect } from 'react';
import { FiMicOff, FiPhoneOff, FiMic, FiX, FiStopCircle } from 'react-icons/fi';
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
  const [phase, setPhase] = useState<'idle' | 'recording' | 'success'>('idle');
  const [isMuted, setIsMuted] = useState(true);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [level, setLevel] = useState(0); // 0..1 for waveform
  const startMsRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioBuffersRef = useRef<Float32Array[]>([]);

  const startTimer = () => {
    startMsRef.current = Date.now();
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (startMsRef.current) {
        setElapsed(Math.floor((Date.now() - startMsRef.current) / 1000));
      }
    }, 200);
  };

  const stopTimer = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    startMsRef.current = null;
  };

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
        // compute RMS level for simple waveform
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          const v = inputData[i];
          sum += v * v;
        }
        const rms = Math.sqrt(sum / inputData.length);
        setLevel((prev) => prev * 0.75 + Math.min(1, rms * 2) * 0.25); // smooth
      };

      source.connect(scriptNode);
      scriptNode.connect(context.destination);
      console.log('Recording started with AudioContext');

      // UI state
      setPhase('recording');
      setIsMuted(false);
      setElapsed(0);
      startTimer();
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecordingAndUpload = async () => {
    // stop timer + audio nodes first for responsive UI
    stopTimer();
    setIsMuted(true);

    safeStopStream();
    safeDisconnectNode();
    await safeCloseAudio();

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
          console.error(`GAGAL untuk ${student.name}:`, (error as any).message || error);
          return { success: false, studentName: student.name, reason: (error as any).message };
        });
    });

    Promise.all(uploadPromises).then(results => {
      const successfulUploads = results.filter(r => (r as any).success).length;
      const failedUploads = results.length - successfulUploads;
      console.log(`Pengiriman selesai. Berhasil: ${successfulUploads}, Gagal: ${failedUploads}.`);
      setPhase('success');
      // reset UI back to idle after short delay
      setTimeout(() => {
        setElapsed(0);
        setLevel(0);
        setPhase('idle');
      }, 1500);
    });
  };

  const handleMicToggle = () => {
    if (phase !== 'recording') {
      startRecording();
    } else {
      stopRecordingAndUpload();
    }
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

  const primaryTargetName = students.length === 1 ? students[0].name : (students.length > 1 ? 'All Students' : '');

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Helpers to safely cleanup audio resources without throwing InvalidStateError
  const safeStopStream = () => {
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    streamRef.current = null;
  };

  const safeDisconnectNode = () => {
    try { scriptNodeRef.current?.disconnect(); } catch {}
    scriptNodeRef.current = null;
  };

  const safeCloseAudio = async () => {
    try {
      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== 'closed') {
        await ctx.close().catch(() => {});
      }
    } catch {}
    audioContextRef.current = null;
  };

  useEffect(() => {
    return () => {
      // cleanup on unmount
      stopTimer();
      safeStopStream();
      safeDisconnectNode();
      // Close audio context only if not already closed
      // Awaiting inside cleanup is okay; ignore any rejection
      (async () => { await safeCloseAudio(); })();
    };
  }, []);

  return (
    <div className="direct-communication-overlay">
      <div className="direct-communication-panel">
        <div className="dc-modal-header">
          <h3>Speak to Student</h3>
          <button className="dc-close" onClick={onDisconnect} aria-label="Close"><FiX /></button>
        </div>

        <div className="dc-avatars-container">
          <div className="dc-avatar"><span>me</span></div>
          <div className="dc-connection-status">
            {/* <span className="dc-connection-text">connected</span> */}
            <div className="dc-connection-line"></div>
          </div>
          <div className="dc-avatar self"><span>{getDisplayLabel() || 'YOU'}</span></div>
        </div>
        {/* Removed small labels under avatars as requested */}

        {phase === 'idle' && (
          <div className="dc-footer">
            <div className="dc-bottombar">
              <div className="dc-placeholder">Tap to Speak</div>
              <button className="dc-mic-btn" onClick={handleMicToggle} aria-label="Tap to Speak">
                <FiMic />
              </button>
            </div>
          </div>
        )}

        {phase === 'recording' && (
          <div className="dc-footer">
            <div className="dc-recording-row">
              <div className="dc-timer">{formatTime(elapsed)}</div>
              <div className="dc-wave" aria-hidden>
                {Array.from({ length: 20 }).map((_, i) => {
                  const h = 6 + Math.abs(Math.sin((i + 1) * 0.7)) * 10 + level * 36;
                  return <span key={i} style={{ height: `${h}px` }} />;
                })}
              </div>
              <button className="dc-stop-button" onClick={handleMicToggle} aria-label="Stop">
                <FiStopCircle />
              </button>
            </div>
          </div>
        )}

        {phase === 'success' && (
          <div className="dc-footer">
            <div className="dc-bottombar">
              <div className="dc-success-text">Success Sent Message</div>
              <button className="dc-mic-btn" onClick={() => setPhase('idle')} aria-label="Tap to Speak again">
                <FiMic />
              </button>
            </div>
          </div>
        )}
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
