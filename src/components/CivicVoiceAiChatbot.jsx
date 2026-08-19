import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Mic, MicOff, Volume2, VolumeX, X, Send, Globe, 
  Sparkles, CheckCircle2, AlertTriangle, ShieldAlert, MapPin, 
  FileText, Activity, ArrowRight, RefreshCw, ChevronDown, Camera
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LOCALES } from '../i18n/voiceLocales';
import { speechService } from '../services/speechService';
import { civicAiEngine } from '../services/civicAiEngine';
import { useReport } from '../context/ReportContext';

import { reverseGeocode } from '../services/locationService';

export default function CivicVoiceAiChatbot() {
  const { activeReport } = useReport();
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState(DEFAULT_LANGUAGE);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Voice states: 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR'
  const [voiceState, setVoiceState] = useState('IDLE');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const messagesEndRef = useRef(null);

  // Initialize welcome message when language changes or first open
  useEffect(() => {
    const locale = LOCALES[lang] || LOCALES['ta'];
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: locale.welcomeMessage,
          lang: lang,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [lang]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, interimTranscript, voiceState, isOpen]);

  // Capture geolocation on mount with address & coordinates
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const fullAddr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address: fullAddr
          });
        },
        async () => {
          const fullAddr = await reverseGeocode(13.0827, 80.2707);
          setUserLocation({
            latitude: 13.0827,
            longitude: 80.2707,
            address: fullAddr
          });
        }
      );
    }
  }, []);

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    speechService.stopSpeaking();
    speechService.stopListening();
    setVoiceState('IDLE');

    const locale = LOCALES[newLang] || LOCALES['ta'];
    setMessages((prev) => [
      ...prev,
      {
        id: `lang-${Date.now()}`,
        sender: 'system',
        text: `🌐 Language switched to ${SUPPORTED_LANGUAGES.find(l => l.code === newLang)?.name}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: locale.welcomeMessage,
        lang: newLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const currentLocale = LOCALES[lang] || LOCALES['ta'];

  // Handle Voice Input Toggle (🎙️ Button)
  const toggleVoiceInput = () => {
    if (voiceState === 'LISTENING') {
      speechService.stopListening();
      setVoiceState('IDLE');
      setInterimTranscript('');
      return;
    }

    if (voiceState === 'SPEAKING') {
      speechService.stopSpeaking();
      setVoiceState('IDLE');
    }

    setVoiceState('LISTENING');
    setInterimTranscript('');

    speechService.startListening(
      lang,
      (transcript, isFinal) => {
        setInterimTranscript(transcript);
        if (isFinal && transcript.trim()) {
          setInterimTranscript('');
          handleSendMessage(transcript);
        }
      },
      (error) => {
        setVoiceState('ERROR');
        setTimeout(() => setVoiceState('IDLE'), 3000);
      },
      () => {
        if (voiceState === 'LISTENING' && !interimTranscript) {
          setVoiceState('IDLE');
        }
      }
    );
  };

  // Process User Message & Generate Response
  const handleSendMessage = async (textToSend = null) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent) return;

    setInputText('');
    setInterimTranscript('');
    speechService.stopListening();

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: messageContent,
        timestamp: timestamp
      }
    ]);

    setVoiceState('PROCESSING');

    try {
      // AI Engine normalization and intent processing with activeReport context
      const aiResult = await civicAiEngine.processInput(messageContent, lang, userLocation, activeReport);
      const responseLang = aiResult.responseLang || lang;

      setVoiceState('IDLE');

      const aiMsgId = `ai-${Date.now()}`;
      const newAiMsg = {
        id: aiMsgId,
        sender: 'ai',
        text: aiResult.textResponse,
        lang: responseLang,
        intent: aiResult.intent,
        cardData: aiResult.data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, newAiMsg]);

      // Auto-speak response in target language
      speakAiResponse(aiResult.textResponse, responseLang);

    } catch (err) {
      console.error('AI Processing error:', err);
      setVoiceState('ERROR');
      setTimeout(() => setVoiceState('IDLE'), 3000);
    }
  };

  // Speak AI Response
  const speakAiResponse = (text, msgLang) => {
    speechService.speakText(
      text,
      msgLang || lang,
      () => setVoiceState('SPEAKING'),
      () => setVoiceState('IDLE')
    );
  };

  const stopSpeaking = () => {
    speechService.stopSpeaking();
    setVoiceState('IDLE');
  };

  // Confirm Report Submission from Review Card
  const confirmReportSubmission = async () => {
    setIsSubmittingReport(true);
    setVoiceState('PROCESSING');

    const result = await civicAiEngine.finalizeReportSubmission(lang);
    setIsSubmittingReport(false);
    setVoiceState('IDLE');

    const aiMsgId = `ai-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        sender: 'ai',
        text: result.textResponse,
        lang: lang,
        intent: result.intent,
        cardData: result.data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    speakAiResponse(result.textResponse, lang);
  };

  // Quick Action Pill Handler
  const handleQuickAction = (actionKey) => {
    let text = '';
    if (actionKey === 'activeLocation') {
      text = lang === 'ta' ? 'இந்த புகாரின் இடம் மற்றும் GPS விவரம் என்ன?' : lang === 'hi' ? 'इस शिकायत का स्थान और GPS विवरण क्या है?' : 'Where is this problem located?';
    } else if (actionKey === 'activePriority') {
      text = lang === 'ta' ? 'இந்த பிரச்சனைக்கு ஏன் இந்த முன்னுரிமை அளிக்கப்பட்டது?' : lang === 'hi' ? 'इस समस्या को यह प्राथमिकता क्यों मिली?' : 'Why is this problem assigned this priority score?';
    } else if (actionKey === 'activeSla') {
      text = lang === 'ta' ? 'யார் இந்த பிரச்சனையை சரிசெய்வார்கள் மற்றும் எப்போது சீராகும்?' : lang === 'hi' ? 'कौन इस समस्या को ठीक करेगा और कितना समय लगेगा?' : 'Who will fix this problem and what is the SLA?';
    } else if (actionKey === 'reportIssue') {
      text = lang === 'ta' ? 'நான் ஒரு புகார் பதிவு செய்ய விரும்புகிறேன்.' : lang === 'hi' ? 'मैं एक शिकायत दर्ज करना चाहता हूँ।' : 'I want to report an issue.';
    } else if (actionKey === 'trackReport') {
      text = lang === 'ta' ? 'என்னுடைய புகார் status என்ன?' : lang === 'hi' ? 'मेरी शिकायत की स्थिति क्या है?' : 'What is my complaint status?';
    } else if (actionKey === 'nearbyIssues') {
      text = lang === 'ta' ? 'எனக்கு அருகில் உள்ள பிரச்சனைகளை காட்டு.' : lang === 'hi' ? 'मेरे पास की समस्याएं दिखाएं।' : 'Show serious problems near me.';
    } else if (actionKey === 'areaProblems') {
      text = lang === 'ta' ? 'எங்கள் பகுதியில் முக்கிய பிரச்சனைகள் என்ன?' : lang === 'hi' ? 'हमारे क्षेत्र में मुख्य समस्याएं क्या हैं?' : 'What are the main problems in my area?';
    }
    handleSendMessage(text);
  };

  return (
    <>
      {/* Floating Chatbot Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-sm shadow-2xl shadow-cyan-500/40 border border-cyan-400/40 hover:scale-105 transition-all duration-300 group cursor-pointer"
          aria-label="Open CivicLens Voice AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
            </span>
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs uppercase tracking-wider font-extrabold text-cyan-200">🗣️ Voice AI</span>
            <span className="font-bold">Ask CivicLens</span>
          </div>
        </button>
      )}

      {/* Floating Assistant Modal Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[420px] max-h-[85vh] h-[640px] flex flex-col rounded-3xl glass-panel border border-cyan-500/30 shadow-2xl shadow-cyan-950/80 overflow-hidden text-slate-100 backdrop-blur-2xl bg-slate-950/95 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    {currentLocale.appName}
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">VOICE 2.0</span>
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{currentLocale.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Selector Dropdown */}
              <div className="relative group">
                <select
                  value={lang}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="appearance-none bg-slate-800 text-cyan-300 hover:text-white font-bold text-xs px-3 py-1.5 pr-7 rounded-xl border border-cyan-500/30 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  title="Switch Language"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  speechService.stopSpeaking();
                  speechService.stopListening();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Close Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Voice State Banner Indicator (Section 10) */}
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs font-semibold shrink-0">
            {voiceState === 'IDLE' && (
              <span className="text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span>🎙️ Tap microphone to speak</span>
              </span>
            )}
            {voiceState === 'LISTENING' && (
              <span className="text-cyan-400 flex items-center gap-2 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-bold">{currentLocale.listening}</span>
              </span>
            )}
            {voiceState === 'PROCESSING' && (
              <span className="text-purple-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>{currentLocale.processing}</span>
              </span>
            )}
            {voiceState === 'SPEAKING' && (
              <div className="w-full flex items-center justify-between text-cyan-300">
                <span className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400 animate-bounce" />
                  <span>{currentLocale.speaking}</span>
                </span>
                <button
                  onClick={stopSpeaking}
                  className="px-2 py-0.5 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded hover:bg-rose-500/20"
                >
                  Stop ⏹️
                </button>
              </div>
            )}
            {voiceState === 'ERROR' && (
              <span className="text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{currentLocale.errorAudio}</span>
              </span>
            )}
          </div>

          {/* Active Report Context Banner */}
          {activeReport && (activeReport.title || activeReport.location) && (
            <div className="px-4 py-2 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-cyan-950/80 border-b border-cyan-500/40 flex items-center justify-between text-xs shrink-0 shadow-inner">
              <div className="flex items-center gap-2 overflow-hidden mr-2">
                <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-white text-[11px] truncate flex items-center gap-1.5">
                    <span>{activeReport.title || activeReport.category}</span>
                    {activeReport.imageUrl && <Camera className="w-3 h-3 text-cyan-400 shrink-0" title="Photo Attached" />}
                  </div>
                  <div className="text-[10px] text-cyan-300 truncate">
                    {activeReport.location || 'Location Specified'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleSendMessage(lang === 'ta' ? 'இந்த புகார் மற்றும் இடம் பற்றி விவரம் கூறு' : lang === 'hi' ? 'इस शिकायत और स्थान के बारे में बताएं' : 'Tell me about this uploaded problem and location')}
                className="px-2.5 py-1 text-[10px] font-bold text-cyan-200 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg transition-colors shrink-0 flex items-center gap-1"
              >
                <span>Ask AI</span>
                <Sparkles className="w-3 h-3 text-cyan-300" />
              </button>
            </div>
          )}

          {/* Messages Stream Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                {msg.sender === 'system' ? (
                  <div className="text-center text-[10px] text-slate-400 py-1 border-b border-slate-800/40 font-mono">
                    {msg.text}
                  </div>
                ) : msg.sender === 'user' ? (
                  /* User Bubble */
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 shadow-md space-y-1">
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      <span className="block text-[9px] text-cyan-200 text-right opacity-80">{msg.timestamp}</span>
                    </div>
                  </div>
                ) : (
                  /* AI Bubble */
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="max-w-[85%] space-y-3">
                      <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-2xl rounded-tl-none p-3.5 shadow-md relative group space-y-2">
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        
                        {/* Audio Speaker Output Button (Section 5) */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                          <span className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</span>
                          <button
                            onClick={() => speakAiResponse(msg.text, msg.lang)}
                            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors rounded hover:bg-slate-800"
                            title="Listen to Response"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Interactive Draft Review Card (Section 8) */}
                      {msg.intent === 'REPORT_REVIEW_CARD' && msg.cardData && (
                        <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/40 space-y-3 shadow-lg">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                              <FileText className="w-4 h-4" />
                              {currentLocale.intentHeadings.reportDraft}
                            </span>
                            <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded">
                              {msg.cardData.category}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">{currentLocale.prompts.category}:</span>
                              <span className="font-semibold text-white">{currentLocale.categories[msg.cardData.category] || msg.cardData.category}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">{currentLocale.prompts.severity}:</span>
                              <span className="font-semibold text-amber-400">{currentLocale.severities[msg.cardData.severity] || msg.cardData.severity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">{currentLocale.prompts.location}:</span>
                              <span className="font-semibold text-white text-right max-w-[60%] truncate">{msg.cardData.location}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">{currentLocale.prompts.priorityScore}:</span>
                              <span className="font-bold text-cyan-400">{msg.cardData.priorityScore}/100</span>
                            </div>
                          </div>

                          <div className="pt-2 flex items-center gap-2">
                            <button
                              onClick={confirmReportSubmission}
                              disabled={isSubmittingReport}
                              className="flex-1 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                            >
                              {isSubmittingReport ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>{currentLocale.prompts.submitting}</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>{currentLocale.prompts.confirmBtn}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Interactive Report Submitted Card */}
                      {msg.intent === 'REPORT_SUBMITTED_SUCCESS' && msg.cardData && (
                        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{currentLocale.intentHeadings.reportSuccess}</span>
                          </div>
                          <div className="text-[11px] space-y-1 text-slate-300">
                            <p><strong>{currentLocale.prompts.reportId}:</strong> <span className="font-mono text-cyan-300">{msg.cardData.id}</span></p>
                            <p><strong>{currentLocale.prompts.status}:</strong> <span className="text-amber-400 font-semibold">{msg.cardData.status}</span></p>
                            <p><strong>{currentLocale.prompts.priorityScore}:</strong> <span className="text-emerald-400 font-bold">{msg.cardData.priorityScore}/100</span></p>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Interim Transcript Live Display while speaking */}
            {interimTranscript && (
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-cyan-950/50 border border-cyan-500/40 text-cyan-200 rounded-2xl rounded-tr-none px-4 py-2 italic animate-pulse">
                  🎙️ "{interimTranscript}..."
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Pills (Section 2) */}
          <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-800/60 overflow-x-auto flex items-center gap-2 shrink-0 no-scrollbar">
            {activeReport && (activeReport.title || activeReport.location) && (
              <>
                <button
                  onClick={() => handleQuickAction('activeLocation')}
                  className="px-3 py-1.5 text-[11px] font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/50 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{lang === 'ta' ? '📍 இட விவரம்' : lang === 'hi' ? '📍 स्थान जानकारी' : '📍 Issue Location'}</span>
                </button>
                <button
                  onClick={() => handleQuickAction('activePriority')}
                  className="px-3 py-1.5 text-[11px] font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/50 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'ta' ? '⚡ முன்னுரிமை மதிப்பீடு' : lang === 'hi' ? '⚡ प्राथमिकता स्कोर' : '⚡ Priority Score'}</span>
                </button>
                <button
                  onClick={() => handleQuickAction('activeSla')}
                  className="px-3 py-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'ta' ? '🕒 தீர்வு & SLA' : lang === 'hi' ? '🕒 समाधान समय' : '🕒 Resolution SLA'}</span>
                </button>
              </>
            )}
            {Object.entries(currentLocale.quickActions).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleQuickAction(key)}
                className="px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Input Control Area */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
            {/* Microphone Button (Section 4) */}
            <button
              onClick={toggleVoiceInput}
              className={`p-3 rounded-2xl border transition-all duration-300 shrink-0 ${
                voiceState === 'LISTENING'
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-600/50'
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 hover:scale-105'
              }`}
              title={voiceState === 'LISTENING' ? 'Stop Listening' : 'Speak Message'}
            >
              {voiceState === 'LISTENING' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input Box */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={currentLocale.speakOrType}
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-2xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:from-cyan-400 hover:to-blue-500 shadow-md transition-all shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
