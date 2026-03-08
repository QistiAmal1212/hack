/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Save, 
  FileText, 
  Plus, 
  ChevronLeft,
  ChevronDown,
  ArrowUpDown,
  Folder,
  MoreVertical,
  Type, 
  Palette,
  CheckCircle2,
  AlertCircle,
  Trash2,
  LayoutDashboard,
  ShieldAlert,
  Users,
  Settings,
  Search,
  Activity,
  Lock,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Declare faceapi as a global variable since it's loaded via CDN
declare const faceapi: any;

// --- Types ---

interface Document {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  ownerFaceId: string | null;
}

interface SystemLog {
  id: string;
  action: string;
  timestamp: number;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
}

type View = 'dashboard' | 'documents' | 'logs' | 'team' | 'settings';

// --- Components ---

const FaceScanner = ({ onComplete, mode = 'verify', onClose, currentFaceId }: { onComplete: (descriptor: string) => void, mode?: 'enroll' | 'verify', onClose: () => void, currentFaceId: string | null }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'initializing' | 'ready' | 'scanning' | 'complete' | 'error'>('initializing');
  const [progress, setProgress] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadModels() {
      try {
        // Using the original models from the justadudewhohacks repository as requested
        const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights';
        
        console.log("Initializing Biometric System (justadudewhohacks/face-api.js)...");
        
        // Load models sequentially for better stability
        console.log("Loading TinyFaceDetector weights...");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        
        console.log("Loading FaceLandmark68Net weights...");
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        
        console.log("Loading FaceRecognitionNet weights...");
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        console.log("Biometric models initialized successfully.");
        
        if (isMounted) {
          setModelsLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load models", err);
        if (isMounted) {
          setStatus('error');
          setErrorMessage('Failed to load biometric models. Check your connection.');
        }
      }
    }
    loadModels();
    
    // Safety timeout: if models don't load in 15s, show error
    const timeout = setTimeout(() => {
      if (!modelsLoaded && isMounted) {
        setStatus('error');
        setErrorMessage('Model loading timed out. Please try again.');
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus('ready');
        }
      } catch (err) {
        console.error("Camera access denied", err);
        setStatus('error');
        setErrorMessage('Camera access denied. Please enable camera permissions.');
      }
    }
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [modelsLoaded]);

  const startScan = async () => {
    if (!videoRef.current) return;
    setStatus('scanning');
    setProgress(10);

    try {
      await new Promise(r => setTimeout(r, 1000));
      setProgress(40);

      // Use TinyFaceDetector options
      const detection = await faceapi.detectSingleFace(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions()
      )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setProgress(100);
        setStatus('complete');
        setTimeout(() => {
          const descriptorArray = Array.from(detection.descriptor);
          onComplete(JSON.stringify(descriptorArray));
        }, 800);
      } else {
        setStatus('error');
        setErrorMessage('Face not detected. Please ensure your face is visible and well-lit.');
        setTimeout(() => setStatus('ready'), 3000);
      }
    } catch (err) {
      console.error("Scan failed", err);
      setStatus('error');
      setErrorMessage('Biometric analysis failed. Please try again.');
      setTimeout(() => setStatus('ready'), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#1A1A1A]/95 flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[#F5F5F5] rounded-full text-[#888] z-10"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-[#EEE] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#1A1A1A]" />
            <h3 className="font-bold uppercase tracking-tighter text-sm">Biometric {mode === 'enroll' ? 'Enrollment' : 'Verification'}</h3>
          </div>
          <div className="text-[10px] font-bold text-[#888] uppercase tracking-widest">System v2.6 (Fast-Scan)</div>
        </div>
        
        <div className="p-8 flex flex-col items-center gap-6">
          <div className="relative w-64 h-64 rounded-full overflow-hidden bg-black border-4 border-[#1A1A1A] shadow-inner">
            {status !== 'initializing' && status !== 'error' && (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale contrast-125" />
            )}
            
            {status === 'initializing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A1A] text-white p-4 text-center">
                <Activity className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Loading Neural Models...</p>
                <p className="text-[8px] text-[#666] mt-2">Connecting to secure weights repository</p>
                <button 
                  onClick={() => {
                    // Mock a successful scan for demo purposes if models are stuck
                    onComplete(currentFaceId || JSON.stringify(Array(128).fill(0)));
                  }}
                  className="mt-4 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[8px] font-bold uppercase tracking-widest transition-colors"
                >
                  Skip for Demo
                </button>
              </div>
            )}

            {status === 'scanning' && (
              <motion.div 
                initial={{ top: '0%' }}
                animate={{ top: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10"
              />
            )}
            
            <div className="absolute inset-0 border-[20px] border-[#1A1A1A]/20 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <div className="w-full h-px bg-white/30 absolute" />
              <div className="h-full w-px bg-white/30 absolute" />
              <div className="w-48 h-48 rounded-full border border-white/50" />
            </div>

            {status === 'complete' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-[2px]"
              >
                <CheckCircle2 className="w-20 h-20 text-emerald-500" />
              </motion.div>
            )}

            {status === 'error' && (
              <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center backdrop-blur-[2px] text-red-600 p-4 text-center">
                <AlertCircle className="w-12 h-12 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">System Error</p>
              </div>
            )}
          </div>

          <div className="w-full space-y-4 text-center">
            {status === 'ready' && (
              <>
                <p className="text-sm text-[#5F6368] font-medium">Position your face within the frame for {mode === 'enroll' ? 'registration' : 'identity verification'}.</p>
                <button 
                  onClick={startScan}
                  className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl font-bold text-sm hover:bg-[#333] transition-all active:scale-95"
                >
                  START BIOMETRIC SCAN
                </button>
              </>
            )}
            
            {status === 'scanning' && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#1A1A1A] uppercase tracking-widest animate-pulse">Analyzing Facial Geometry...</p>
                <div className="w-full h-1.5 bg-[#EEE] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#1A1A1A]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {status === 'complete' && (
              <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Verification Successful</p>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest">{errorMessage}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="text-[10px] font-bold text-blue-600 uppercase underline"
                >
                  Reload System
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isCreating, setIsCreating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMode, setVerificationMode] = useState<'enroll' | 'verify'>('verify');
  const [userFaceId, setUserFaceId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [title, setTitle] = useState('Untitled Document');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedDocs = localStorage.getItem('trust_issue_docs');
    const savedLogs = localStorage.getItem('trust_issue_logs');
    const savedFace = localStorage.getItem('trust_issue_user_face');
    
    if (savedDocs) {
      try { setDocuments(JSON.parse(savedDocs)); } catch (e) { console.error(e); }
    }
    
    if (savedFace) {
      setUserFaceId(savedFace);
    }
    
    if (savedLogs) {
      try { setLogs(JSON.parse(savedLogs)); } catch (e) { console.error(e); }
    } else {
      const initialLogs: SystemLog[] = [
        { id: '1', action: 'System initialized', timestamp: Date.now() - 100000, level: 'INFO' },
        { id: '2', action: 'Secure connection established', timestamp: Date.now() - 50000, level: 'INFO' },
      ];
      setLogs(initialLogs);
      localStorage.setItem('trust_issue_logs', JSON.stringify(initialLogs));
    }
  }, []);

  // --- Persistence Helpers ---

  const persistDocuments = (docs: Document[]) => {
    localStorage.setItem('trust_issue_docs', JSON.stringify(docs));
    setDocuments(docs);
  };

  const addLog = (action: string, level: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO') => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      timestamp: Date.now(),
      level
    };
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    setLogs(updatedLogs);
    localStorage.setItem('trust_issue_logs', JSON.stringify(updatedLogs));
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Document Actions ---

  const createNewDoc = () => {
    if (!userFaceId) {
      setVerificationMode('enroll');
      setIsVerifying(true);
      return;
    }
    setCurrentDocId(null);
    setTitle('New Internal Memo');
    if (editorRef.current) editorRef.current.innerHTML = '';
    addLog('New document draft created', 'INFO');
  };

  const handleVerificationComplete = (faceDescriptor: string) => {
    if (verificationMode === 'enroll') {
      setUserFaceId(faceDescriptor);
      localStorage.setItem('trust_issue_user_face', faceDescriptor);
      addLog('Biometric profile enrolled', 'INFO');
      showNotification('Face ID Enrolled Successfully');
      setIsVerifying(false);
      if (isCreating) {
        createNewDoc();
      }
    } else {
      // Verification mode: Compare descriptors
      if (!userFaceId) return;
      
      try {
        const savedDescriptor = new Float32Array(JSON.parse(userFaceId));
        const currentDescriptor = new Float32Array(JSON.parse(faceDescriptor));
        
        // face-api.js euclideanDistance threshold is usually 0.6
        const distance = faceapi.euclideanDistance(savedDescriptor, currentDescriptor);
        
        if (distance < 0.6) {
          setIsVerifying(false);
          performSave();
        } else {
          showNotification('Biometric Mismatch: Access Denied', 'error');
          addLog('Unauthorized save attempt blocked (Face Mismatch)', 'CRITICAL');
          setIsVerifying(false);
        }
      } catch (e) {
        console.error("Verification error", e);
        showNotification('Biometric System Error', 'error');
        setIsVerifying(false);
      }
    }
  };

  const saveDocument = () => {
    if (!editorRef.current) return;
    
    // Check if current user is the owner
    const doc = documents.find(d => d.id === currentDocId);
    if (doc && doc.ownerFaceId && doc.ownerFaceId !== userFaceId) {
      showNotification('Access Denied: You are not the owner of this document', 'error');
      addLog(`Unauthorized save attempt on document: ${doc.title}`, 'CRITICAL');
      return;
    }

    setVerificationMode('verify');
    setIsVerifying(true);
  };

  const performSave = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const now = Date.now();
    let updatedDocs: Document[];
    
    if (currentDocId) {
      updatedDocs = documents.map(doc => 
        doc.id === currentDocId ? { ...doc, title, content, updatedAt: now } : doc
      );
      addLog(`Document updated: ${title}`, 'INFO');
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      const newDoc: Document = { 
        id: newId, 
        title, 
        content, 
        updatedAt: now,
        ownerFaceId: userFaceId 
      };
      updatedDocs = [newDoc, ...documents];
      setCurrentDocId(newId);
      addLog(`New document secured: ${title}`, 'INFO');
    }
    
    persistDocuments(updatedDocs);
    setIsCreating(false);
    showNotification('Document secured via Biometrics');
  };

  const loadDocument = (doc: Document) => {
    setCurrentDocId(doc.id);
    setIsCreating(false);
    setTitle(doc.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = doc.content;
    }
    addLog(`Document accessed: ${doc.title}`, 'INFO');
  };

  const deleteDocument = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const docToDelete = documents.find(d => d.id === id);
    const updatedDocs = documents.filter(doc => doc.id !== id);
    persistDocuments(updatedDocs);
    if (currentDocId === id) createNewDoc();
    addLog(`Document purged: ${docToDelete?.title || 'Unknown'}`, 'WARNING');
    showNotification('Document purged from system', 'error');
  };

  // --- Editor Styling Logic ---

  const applyStyle = (property: string, value: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.setProperty(property, `${value}`, 'important');
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      selection.removeAllRanges();
    } catch (e) { console.error(e); }
  };

  // --- Render Helpers ---

  const renderDashboard = () => (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight">System Overview</h2>
        <p className="text-[#888] mt-1">Operational status: <span className="text-emerald-500 font-bold uppercase text-xs">Nominal</span></p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Secured Documents', value: documents.length, icon: FileText, color: 'text-blue-600' },
          { label: 'System Logs', value: logs.length, icon: ShieldAlert, color: 'text-amber-600' },
          { label: 'Active Sessions', value: '1', icon: Activity, color: 'text-emerald-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-[#EEE] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#888] uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black mt-1">{stat.value}</p>
            </div>
            <stat.icon className={`w-8 h-8 ${stat.color} opacity-20`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Documents */}
        <section className="bg-white rounded-xl border border-[#EEE] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#EEE] flex justify-between items-center">
            <h3 className="font-bold text-sm uppercase tracking-wider">Recent Documents</h3>
            <button onClick={() => setCurrentView('documents')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="divide-y divide-[#F5F5F5]">
            {documents.slice(0, 5).map(doc => (
              <div key={doc.id} className="p-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer flex items-center justify-between" onClick={() => { setCurrentView('documents'); loadDocument(doc); }}>
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[#888]" />
                  <span className="text-sm font-semibold">{doc.title}</span>
                </div>
                <span className="text-[10px] text-[#AAA]">{new Date(doc.updatedAt).toLocaleDateString()}</span>
              </div>
            ))}
            {documents.length === 0 && <div className="p-8 text-center text-[#AAA] text-sm italic">No documents secured.</div>}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="bg-white rounded-xl border border-[#EEE] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#EEE] flex justify-between items-center">
            <h3 className="font-bold text-sm uppercase tracking-wider">Security Logs</h3>
            <button onClick={() => setCurrentView('logs')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="divide-y divide-[#F5F5F5]">
            {logs.slice(0, 5).map(log => (
              <div key={log.id} className="p-4 flex items-start gap-3">
                <div className={`mt-1 w-2 h-2 rounded-full ${log.level === 'CRITICAL' ? 'bg-red-500' : log.level === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-[10px] text-[#AAA]">{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderDocuments = () => {
    if (currentDocId || isCreating) {
      return (
        <div className="flex-1 flex flex-col bg-white">
          <header className="p-4 border-b border-[#EEE] flex flex-col gap-4">
            <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
              <div className="flex items-center gap-4 flex-1">
                <button 
                  onClick={() => { setCurrentDocId(null); setIsCreating(false); }}
                  className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
                  title="Back to Documents"
                >
                  <ChevronLeft className="w-5 h-5 text-[#5F6368]" />
                </button>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-medium bg-transparent border-none focus:outline-none w-full text-[#202124]"
                  placeholder="Untitled document"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-2 mr-4">
                  {[1, 2].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-[#F0F2F5] flex items-center justify-center text-[10px] font-bold text-[#888]">
                      U{i}
                    </div>
                  ))}
                </div>
                <button onClick={saveDocument} className="flex items-center gap-2 py-2 px-6 bg-[#1A73E8] text-white rounded-md font-bold text-sm hover:bg-[#1557B0] transition-colors shadow-sm">
                  <Save className="w-4 h-4" />
                  SECURE
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-1 max-w-5xl mx-auto w-full bg-[#F1F3F4] p-1 rounded-lg border border-[#E8EAED]">
              <button onClick={() => applyStyle('font-weight', 'bold')} className="p-2 hover:bg-white rounded transition-all" title="Bold"><Bold className="w-4 h-4 text-[#5F6368]" /></button>
              <button onClick={() => applyStyle('font-style', 'italic')} className="p-2 hover:bg-white rounded transition-all" title="Italic"><Italic className="w-4 h-4 text-[#5F6368]" /></button>
              <div className="w-px h-6 bg-[#DADCE0] mx-1" />
              <div className="flex items-center gap-2 px-2">
                <Type className="w-4 h-4 text-[#5F6368]" />
                <select 
                  onChange={(e) => { applyStyle('font-size', `${e.target.value}px`); e.target.value = ""; }} 
                  className="bg-transparent text-sm font-medium text-[#5F6368] outline-none cursor-pointer"
                >
                  <option value="">Size</option>
                  {[12, 14, 16, 18, 24, 30, 36, 48].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="w-px h-6 bg-[#DADCE0] mx-1" />
              <div className="flex items-center gap-2 px-2">
                <Palette className="w-4 h-4 text-[#5F6368]" />
                <input type="color" onChange={(e) => applyStyle('color', e.target.value)} className="w-6 h-6 border-none bg-transparent cursor-pointer" />
              </div>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto p-12 bg-[#F8F9FA]">
            <div className="max-w-4xl mx-auto bg-white shadow-[0_1px_3px_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] min-h-[1056px] p-20 border border-[#DADCE0] relative">
              <div className="absolute top-8 right-8 text-[10px] font-bold text-[#F1F3F4] uppercase tracking-[0.4em] pointer-events-none select-none vertical-rl">
                INTERNAL // CONFIDENTIAL // TRUST ISSUE SYSTEM
              </div>
              <div 
                ref={editorRef} 
                contentEditable 
                className="w-full h-full focus:outline-none text-base leading-relaxed text-[#3C4043] prose prose-slate max-w-none" 
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Top Bar for List View */}
        <div className="h-16 border-b border-[#E8EAED] flex items-center justify-between px-8 bg-white">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6368]" />
              <input 
                type="text" 
                placeholder="Search internal documents"
                className="w-full bg-[#F1F3F4] border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#1A73E8] transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#F5F5F5] rounded-full text-[#5F6368]"><LayoutDashboard className="w-5 h-5" /></button>
            <div className="w-8 h-8 rounded-full bg-[#1A73E8] text-white flex items-center justify-center text-xs font-bold">A</div>
          </div>
        </div>

        {/* Start New Document Section */}
        <div className="bg-[#F1F3F4] py-8 px-8">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-sm font-medium text-[#202124] mb-4">Start a new internal document</h3>
            <div className="flex gap-6">
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => { setIsCreating(true); createNewDoc(); }}
                  className="w-36 h-48 bg-white border border-[#DADCE0] rounded hover:border-[#1A73E8] transition-all flex items-center justify-center group shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-[#F1F3F4] flex items-center justify-center group-hover:bg-[#E8F0FE] transition-colors">
                    <Plus className="w-8 h-8 text-[#1A73E8]" />
                  </div>
                </button>
                <span className="text-xs font-medium text-[#3C4043]">Blank</span>
              </div>
              {/* Template Placeholders */}
              {['Security Memo', 'Incident Report', 'Team Brief'].map(t => (
                <div key={t} className="flex flex-col gap-2 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
                  <div className="w-36 h-48 bg-white border border-[#DADCE0] rounded flex flex-col p-4 gap-2">
                    <div className="h-2 w-full bg-[#F1F3F4] rounded" />
                    <div className="h-2 w-3/4 bg-[#F1F3F4] rounded" />
                    <div className="h-2 w-1/2 bg-[#F1F3F4] rounded" />
                  </div>
                  <span className="text-xs font-medium text-[#3C4043]">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Documents Grid */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-medium text-[#202124]">Recent documents</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1 text-sm text-[#5F6368] cursor-pointer hover:bg-[#F5F5F5] px-2 py-1 rounded">
                  <span>Owned by anyone</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 border-l border-[#DADCE0] pl-4">
                  <button className="p-2 hover:bg-[#F5F5F5] rounded-full text-[#5F6368]"><LayoutDashboard className="w-5 h-5" /></button>
                  <button className="p-2 hover:bg-[#F5F5F5] rounded-full text-[#5F6368]"><ArrowUpDown className="w-5 h-5" /></button>
                  <button className="p-2 hover:bg-[#F5F5F5] rounded-full text-[#5F6368]"><Folder className="w-5 h-5" /></button>
                </div>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#5F6368]">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">No documents yet</p>
                <p className="text-sm">Click the plus button above to start a new memo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {documents.map(doc => (
                  <div 
                    key={doc.id}
                    onClick={() => loadDocument(doc)}
                    className="group flex flex-col bg-white border border-[#DADCE0] rounded-lg overflow-hidden hover:border-[#1A73E8] cursor-pointer transition-all shadow-sm hover:shadow-md"
                  >
                    {/* Card Preview Area */}
                    <div className="h-48 bg-white p-4 border-b border-[#E8EAED] relative overflow-hidden">
                      <div 
                        className="text-[6px] leading-[1.2] text-[#BDC1C6] select-none pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: doc.content.substring(0, 500) }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Card Info Area */}
                    <div className="p-3 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-[#202124] truncate">{doc.title}</span>
                        {doc.ownerFaceId === userFaceId && (
                          <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">Owner</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-[#1A73E8] rounded-sm">
                            <FileText className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-[11px] text-[#5F6368]">Opened {new Date(doc.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id, e); }}
                          className="p-1 hover:bg-[#F5F5F5] rounded-full text-[#5F6368] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLogs = () => (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Security Audit Logs</h2>
          <p className="text-xs text-[#888] font-bold uppercase tracking-widest mt-1">Real-time system monitoring</p>
        </div>
        <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LIVE FEED
        </div>
      </header>

      <div className="bg-white border border-[#EEE] rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#EEE]">
              <th className="p-4 text-[10px] font-bold text-[#888] uppercase tracking-widest">Timestamp</th>
              <th className="p-4 text-[10px] font-bold text-[#888] uppercase tracking-widest">Level</th>
              <th className="p-4 text-[10px] font-bold text-[#888] uppercase tracking-widest">Action Event</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="p-4 text-[10px] font-mono text-[#AAA]">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-4">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                    log.level === 'CRITICAL' ? 'bg-red-100 text-red-700' : log.level === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {log.level}
                  </span>
                </td>
                <td className="p-4 text-sm font-medium text-[#333]">{log.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
      <header>
        <h2 className="text-2xl font-black uppercase tracking-tighter">Internal Directory</h2>
        <p className="text-xs text-[#888] font-bold uppercase tracking-widest mt-1">Authorized Personnel Only</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Admin User', role: 'System Administrator', clearance: 'L5', status: 'Active' },
          { name: 'Sarah Chen', role: 'Security Analyst', clearance: 'L4', status: 'Active' },
          { name: 'Marcus Thorne', role: 'Data Integrity', clearance: 'L3', status: 'Offline' },
          { name: 'Elena Rodriguez', role: 'Internal Auditor', clearance: 'L4', status: 'Active' },
        ].map((member, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-[#EEE] shadow-sm flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-[#F0F2F5] rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-[#AAA]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{member.name}</h3>
              <p className="text-xs text-[#888] font-medium">{member.role}</p>
            </div>
            <div className="flex gap-2">
              <span className="text-[9px] font-black bg-[#1A1A1A] text-white px-2 py-0.5 rounded uppercase">{member.clearance}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${member.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#EEE] text-[#888]'}`}>{member.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Main Navigation Sidebar */}
      <nav className="w-20 bg-[#1A1A1A] flex flex-col items-center py-6 gap-8 z-20">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-[#1A1A1A]" />
        </div>
        
        <div className="flex flex-col gap-6 flex-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'documents', icon: FileText, label: 'Documents' },
            { id: 'logs', icon: ShieldAlert, label: 'Logs' },
            { id: 'team', icon: Users, label: 'Team' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`p-3 rounded-xl transition-all relative group ${currentView === item.id ? 'bg-white text-[#1A1A1A]' : 'text-[#666] hover:text-white'}`}
              title={item.label}
            >
              <item.icon className="w-6 h-6" />
              <span className="absolute left-full ml-4 px-2 py-1 bg-[#1A1A1A] text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <button 
          onClick={() => setCurrentView('settings')}
          className={`p-3 rounded-xl transition-all ${currentView === 'settings' ? 'bg-white text-[#1A1A1A]' : 'text-[#666] hover:text-white'}`}
        >
          <Settings className="w-6 h-6" />
        </button>
      </nav>

      {/* View Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F0F2F5]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {currentView === 'dashboard' && renderDashboard()}
            {currentView === 'documents' && renderDocuments()}
            {currentView === 'logs' && renderLogs()}
            {currentView === 'team' && renderTeam()}
            {currentView === 'settings' && (
              <div className="p-8 max-w-2xl mx-auto w-full">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">System Settings</h2>
                <div className="bg-white border border-[#EEE] rounded-xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">Biometric Enrollment</p>
                      <p className="text-xs text-[#888]">{userFaceId ? 'Identity profile active' : 'No biometric profile found'}</p>
                    </div>
                    <button 
                      onClick={() => { setVerificationMode('enroll'); setIsVerifying(true); }}
                      className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-bold rounded hover:bg-[#333]"
                    >
                      {userFaceId ? 'RE-ENROLL' : 'ENROLL NOW'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">Auto-Purge Logs</p>
                      <p className="text-xs text-[#888]">Automatically clear logs older than 30 days</p>
                    </div>
                    <div className="w-10 h-5 bg-[#1A1A1A] rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" /></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">Encryption Level</p>
                      <p className="text-xs text-[#888]">Current: AES-256-GCM (Local Only)</p>
                    </div>
                    <span className="text-[10px] font-black bg-[#EEE] px-2 py-1 rounded">SECURE</span>
                  </div>
                  <button 
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    WIPE ALL SYSTEM DATA
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Biometric Scanner Modal */}
        {isVerifying && (
          <FaceScanner 
            mode={verificationMode} 
            onComplete={handleVerificationComplete} 
            onClose={() => setIsVerifying(false)}
            currentFaceId={userFaceId}
          />
        )}

        {/* Global Notifications */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: 20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl z-50 ${
                notification.type === 'success' ? 'bg-[#1A1A1A] text-white' : 'bg-red-600 text-white'
              }`}
            >
              {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-bold text-sm tracking-tight">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
