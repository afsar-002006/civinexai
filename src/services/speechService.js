// Speech Recognition (STT), Speech Synthesis (TTS) & Language Detector Service
// Supports Tamil (ta-IN), English (en-IN/en-US), Hindi (hi-IN)
// Includes simulation fallback for robust demo testing in all environments

class SpeechService {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.isListening = false;
    this.isSpeaking = false;
    this.voices = [];

    if (this.synth) {
      this.loadVoices();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  // Detect language from text (Tamil script, Devanagari script, or English)
  detectLanguage(text) {
    if (!text || typeof text !== 'string') return 'ta'; // Default Tamil

    // Check Tamil script range
    if (/[\u0B80-\u0BFF]/.test(text)) {
      return 'ta';
    }
    // Check Devanagari (Hindi) script range
    if (/[\u0900-\u097F]/.test(text)) {
      return 'hi';
    }

    // Check Tanglish / Hinglish keywords
    const lower = text.toLowerCase();
    const taKeywords = ['vanakkam', 'thanneer', 'kuppai', 'theruvilakku', 'irukku', 'prachanai', 'poguma', 'salai', 'pallam', 'pugaar'];
    const hiKeywords = ['namaste', 'paani', 'kachra', 'sadak', 'gaddha', 'kharab', 'hai', 'shikayat', 'shehar', 'bijli'];

    if (taKeywords.some(k => lower.includes(k))) return 'ta';
    if (hiKeywords.some(k => lower.includes(k))) return 'hi';

    return 'en';
  }

  // Start Voice Recognition (STT)
  startListening(langCode, onResult, onError, onEnd) {
    if (this.isListening) {
      this.stopListening();
    }

    const localeMap = {
      ta: 'ta-IN',
      en: 'en-IN',
      hi: 'hi-IN'
    };
    const targetLocale = localeMap[langCode] || 'ta-IN';

    if (!this.recognition) {
      console.warn('SpeechRecognition API not available in this browser. Using simulation mode.');
      this.simulateSpeechInput(langCode, onResult, onError, onEnd);
      return;
    }

    try {
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = targetLocale;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (onResult && transcript) {
          onResult(transcript, event.results[0].isFinal);
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        this.isListening = false;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          // Fallback to simulation mode if microphone permission denied
          this.simulateSpeechInput(langCode, onResult, onError, onEnd);
        } else if (onError) {
          onError(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      this.isListening = false;
      this.simulateSpeechInput(langCode, onResult, onError, onEnd);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        // Quiet catch
      }
      this.isListening = false;
    }
  }

  // Simulation mode for environments without microphone access
  simulateSpeechInput(langCode, onResult, onError, onEnd) {
    this.isListening = true;
    const presets = {
      ta: [
        'எங்கள் தெருவில் பெரிய பள்ளம் உள்ளது. வாகனங்கள் செல்ல சிரமமாக இருக்கிறது.',
        'என்னுடைய புகார் status என்ன?',
        'எங்கள் பகுதியில் குப்பை அள்ளப்படவில்லை.',
        'அருகில் உள்ள முக்கிய பிரச்சனைகளை காண்க.'
      ],
      en: [
        'There is a huge pothole near my college on Main Street.',
        'What is my complaint status?',
        'Show serious problems near me.',
        'Why is this issue high priority?'
      ],
      hi: [
        'हमारे कॉलेज के पास सड़क पर एक बड़ा गड्ढा है।',
        'मेरी शिकायत की स्थिति क्या है?',
        'मेरे पास की मुख्य समस्याएँ दिखाएं।'
      ]
    };

    const choices = presets[langCode] || presets['ta'];
    const selectedText = choices[Math.floor(Math.random() * choices.length)];

    let currentLength = 0;
    const interval = setInterval(() => {
      currentLength += 3;
      if (currentLength < selectedText.length) {
        if (onResult) onResult(selectedText.slice(0, currentLength), false);
      } else {
        clearInterval(interval);
        this.isListening = false;
        if (onResult) onResult(selectedText, true);
        if (onEnd) onEnd();
      }
    }, 120);
  }

  // Text-to-Speech (TTS)
  speakText(text, langCode = 'ta', onStart, onEnd) {
    if (!this.synth) {
      console.warn('SpeechSynthesis not supported.');
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();

    // Clean markdown formatting before speaking
    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);

    const localeMap = {
      ta: 'ta-IN',
      en: 'en-IN',
      hi: 'hi-IN'
    };
    const targetLocale = localeMap[langCode] || 'ta-IN';

    // Find best voice match
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    
    let matchedVoice = this.voices.find(v => v.lang === targetLocale || v.lang.startsWith(langCode));
    if (!matchedVoice && langCode === 'ta') {
      matchedVoice = this.voices.find(v => v.lang.includes('ta') || v.lang.includes('IN'));
    }
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.lang = targetLocale;
    utterance.rate = 0.95; // Natural conversational tempo
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
}

export const speechService = new SpeechService();
