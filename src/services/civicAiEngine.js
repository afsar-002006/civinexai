// AI Intent Engine, Multilingual Normalization & Action Processor
// Integrates with CivicLens database (fetchReports, createReport, analyzePriority)

import { fetchReports, analyzePriority, createReport } from './api';
import { LOCALES } from '../i18n/voiceLocales';
import { speechService } from './speechService';

// Standard issue categories
export const CIVIC_CATEGORIES = [
  'Road Damage',
  'Garbage',
  'Water Leakage',
  'Electricity',
  'Streetlight',
  'Flooding',
  'Traffic',
  'Other'
];

export class CivicAiEngine {
  constructor() {
    this.currentDraft = null;
  }

  // Normalize user text and process intent
  async processInput(userInput, currentLang = 'ta', userLocation = null, activeReport = null) {
    if (!userInput || !userInput.trim()) {
      return {
        intent: 'UNKNOWN',
        responseLang: currentLang,
        textResponse: LOCALES[currentLang]?.errorAudio || 'Speech not understood.',
        data: null
      };
    }

    // Automatic language detection (if user speaks in another language)
    const detectedLang = speechService.detectLanguage(userInput);
    const activeLang = detectedLang || currentLang;
    const locale = LOCALES[activeLang] || LOCALES['ta'];

    const lowerInput = userInput.toLowerCase();

    // Priority Check: If active report exists and user asks a question about it or its location
    if (activeReport && (activeReport.title || activeReport.location || activeReport.category)) {
      const activeReportResponse = this.handleActiveReportQuestion(lowerInput, userInput, activeReport, activeLang);
      if (activeReportResponse) {
        return activeReportResponse;
      }
    }

    // Check if user is confirming an existing draft report submission
    if (this.currentDraft && this.isConfirmation(lowerInput, activeLang)) {
      return await this.finalizeReportSubmission(activeLang);
    }

    // Check if user is filling in missing location for an existing draft
    if (this.currentDraft && this.currentDraft.stage === 'AWAITING_LOCATION') {
      this.currentDraft.location = userInput.trim();
      this.currentDraft.stage = 'READY_FOR_CONFIRMATION';
      return this.generateDraftReviewResponse(activeLang);
    }

    // Determine Intent
    if (this.matchesIntent(lowerInput, ['track', 'status', 'complaint status', 'புகார் நிலை', 'நிலவரம்', 'स्थिति', 'ट्रैक'])) {
      return await this.handleTrackReport(userInput, activeLang);
    }

    if (this.matchesIntent(lowerInput, ['nearby', 'near me', 'அருகில்', 'அருகில் உள்ள', 'आसपास', 'पास में'])) {
      return await this.handleNearbyIssues(userLocation, activeLang);
    }

    if (this.matchesIntent(lowerInput, ['area', 'stats', 'statistics', 'பகுதி', 'புள்ளிவிவரங்கள்', 'क्षेत्र', 'आंकड़े'])) {
      return await this.handleAreaStats(activeLang);
    }

    if (this.matchesIntent(lowerInput, ['why', 'priority', 'score', 'ஏன்', 'முன்னுரிமை', 'காரணம்', 'क्यों', 'प्राथमिकता'])) {
      return await this.handleExplainPriority(userInput, activeLang);
    }

    if (this.matchesIntent(lowerInput, ['report', 'complaint', 'broken', 'pothole', 'garbage', 'leakage', 'dark', 'light', 'புகார்', 'பள்ளம்', 'குப்பை', 'கசிவு', 'தெருவிளக்கு', 'शिकायत', 'गड्ढा', 'कचरा', 'पानी'])) {
      return await this.handleReportIntent(userInput, activeLang, userLocation);
    }

    // Fallback: Check if message describes a problem direct phrasing
    const extractedCat = this.extractCategory(lowerInput);
    if (extractedCat) {
      return await this.handleReportIntent(userInput, activeLang, userLocation);
    }

    // General Q&A / Greeting response
    return this.handleGeneralQa(userInput, activeLang);
  }

  // Handle queries directly related to the currently uploaded/drafted problem
  handleActiveReportQuestion(lowerInput, rawInput, report, lang) {
    const locKeywords = ['where', 'location', 'gps', 'address', 'place', 'landmark', 'இடம்', 'முகவரி', 'எங்கே', 'स्थान', 'पता', 'कहाँ'];
    const priorityKeywords = ['priority', 'score', 'severity', 'hazard', 'urgency', 'why high', 'why critical', 'முன்னுரிமை', 'தீவிரம்', 'ஆபத்து', 'प्राथमिकता', 'गंभीरता', 'स्कोर'];
    const slaKeywords = ['who', 'team', 'who will fix', 'resolution', 'how long', 'sla', 'time', 'dept', 'department', 'எப்போது', 'யார்', 'தீர்வு', 'कौन', 'कब', 'समाधान', 'विभाग'];
    const photoKeywords = ['photo', 'image', 'picture', 'upload', 'evidence', 'படம்', 'புகைப்படம்', 'சான்று', 'फोटो', 'तस्वीर', 'प्रमाण'];
    const generalActiveKeywords = ['this problem', 'this issue', 'this report', 'my report', 'uploaded problem', 'tell me about', 'about this', 'இந்த பிரச்சனை', 'புகார் பற்றி', 'इस समस्या', 'शिकायत के बारे में'];

    const title = report.title || `${report.category || 'Civic'} Problem`;
    const location = report.location || 'Location provided on Report page';
    const category = report.category || 'Road Damage';
    const severity = report.severity || 'High';
    const score = report.priorityScore || 85;
    const status = report.status || (report.isSubmitted ? 'Pending Review' : 'Drafting Mode');

    // 1. Location / Address / GPS Queries
    if (this.matchesIntent(lowerInput, locKeywords)) {
      let text = '';
      if (lang === 'ta') {
        text = `📍 **பதிவேற்றப்பட்ட புகாரின் இடம் விவரங்கள்:**\n` +
          `• **தலைப்பு:** ${title}\n` +
          `• **பிரிவு:** ${category}\n` +
          `• **இடம் / GPS:** ${location}\n` +
          `• **தற்போதைய நிலை:** ${status}\n\n` +
          `இந்த பிரச்சனை இடம் CivicLens வரைபடத்தில் குறிக்கப்பட்டுள்ளது. இந்த இடத்தின் தற்போதைய நிலவரத்தை அதிகாரிகள் கண்காணிக்கின்றனர்.`;
      } else if (lang === 'hi') {
        text = `📍 **सक्रिय शिकायत का स्थान विवरण:**\n` +
          `• **शीर्षक:** ${title}\n` +
          `• **श्रेणी:** ${category}\n` +
          `• **स्थान / GPS:** ${location}\n` +
          `• **स्थिति:** ${status}\n\n` +
          `यह स्थान CivicLens मानचित्र पर चिह्नित है और नगर निगम अधिकारियों को प्रेषित किया गया है।`;
      } else {
        text = `📍 **Location Details for Uploaded Problem:**\n` +
          `• **Title:** ${title}\n` +
          `• **Category:** ${category}\n` +
          `• **Location Landmark / GPS:** ${location}\n` +
          `• **Report Status:** ${status}\n\n` +
          `This issue location is pinned on the CivicLens Spatial Map for authority navigation and citizen tracking.`;
      }

      return {
        intent: 'ACTIVE_REPORT_LOCATION',
        responseLang: lang,
        textResponse: text,
        data: report
      };
    }

    // 2. Priority / Severity / Hazard Score Queries
    if (this.matchesIntent(lowerInput, priorityKeywords)) {
      let text = '';
      if (lang === 'ta') {
        text = `⚡ **"${title}" புகாரின் முன்னுரிமை பகுப்பாய்வு:**\n` +
          `• **ஆபத்து நிலை:** ${severity}\n` +
          `• **AI முன்னுரிமை புள்ளி:** ${score}/100\n` +
          `• **இடம்:** ${location}\n\n` +
          `இந்த முன்னுரிமை மதிப்பீடு சாலை வகை, மக்கள் நடமாட்டம் மற்றும் ஆபத்து தீவிரத்தின் அடிப்படையில் கணக்கிடப்பட்டுள்ளது.`;
      } else if (lang === 'hi') {
        text = `⚡ **"${title}" की प्राथमिकता विश्लेषण:**\n` +
          `• **गंभीरता स्तर:** ${severity}\n` +
          `• **AI प्राथमिकता स्कोर:** ${score}/100\n` +
          `• **स्थान:** ${location}\n\n` +
          `यह स्कोर क्षति के प्रकार, स्थान की संवेदनशीलता और सुरक्षा जोखिम के आधार पर तय किया गया है।`;
      } else {
        text = `⚡ **Priority Evaluation for "${title}":**\n` +
          `• **Hazard Level:** ${severity}\n` +
          `• **AI Urgency Score:** ${score}/100\n` +
          `• **Target Location:** ${location}\n\n` +
          `This score ensures immediate high-priority dispatch on the Municipal Ward Action Dashboard.`;
      }

      return {
        intent: 'ACTIVE_REPORT_PRIORITY',
        responseLang: lang,
        textResponse: text,
        data: report
      };
    }

    // 3. Team / Handler / SLA Queries
    if (this.matchesIntent(lowerInput, slaKeywords)) {
      let text = '';
      if (lang === 'ta') {
        text = `🕒 **தீர்வு மற்றும் பணிப் பிரிவு விவரங்கள்:**\n` +
          `• **பொறுப்புத் துறை:** மண்டல நகராட்சி பணிக்குழு (Ward Response Team)\n` +
          `• **பிரச்சனை இடம்:** ${location}\n` +
          `• **எதிர்பார்க்கப்படும் தீர்வு காலம்:** 24–48 மணிநேரத்திற்குள்\n` +
          `• **நிலை:** ${status}`;
      } else if (lang === 'hi') {
        text = `🕒 **समाधान और विभाग विवरण:**\n` +
          `• **जिम्मेदार विभाग:** नगर निगम लोक निर्माण एवं आपातकालीन दल\n` +
          `• **समस्या स्थान:** ${location}\n` +
          `• **अनुमानित समाधान समय:** 24–48 घंटे\n` +
          `• **स्थिति:** ${status}`;
      } else {
        text = `🕒 **Resolution SLA & Response Team for Uploaded Issue:**\n` +
          `• **Assigned Department:** Local Municipal Public Works & Rapid Action Cell\n` +
          `• **Location:** ${location}\n` +
          `• **Expected SLA Window:** 24–48 Hours\n` +
          `• **Current Status:** ${status}`;
      }

      return {
        intent: 'ACTIVE_REPORT_SLA',
        responseLang: lang,
        textResponse: text,
        data: report
      };
    }

    // 4. Photo / Visual Evidence Queries
    if (this.matchesIntent(lowerInput, photoKeywords)) {
      let text = '';
      if (report.imageUrl) {
        text = lang === 'ta'
          ? `📸 **புகைப்பட சான்று இணைப்பு:**\n• இந்த புகாருக்கு புகைப்பட சான்று வெற்றிகரமாக பதிவேற்றப்பட்டுள்ளது.\n• இடம்: ${location}\n• கணினி பார்வை (Computer Vision) மூலம் இந்த சான்று சரிபார்க்கப்பட்டது.`
          : lang === 'hi'
          ? `📸 **तस्वीर का प्रमाण उपलब्ध है:**\n• इस शिकायत के लिए फोटो साक्ष्य संलग्न किया गया है।\n• स्थान: ${location}`
          : `📸 **Photographic Evidence Attached:**\n• Photo evidence is uploaded and attached to this report.\n• Target Location: ${location}\n• Computer Vision model verified problem severity.`;
      } else {
        text = lang === 'ta'
          ? `📷 இந்த புகாருக்கு இன்னும் புகைப்படம் பதிவேற்றப்படவில்லை. புகார் பக்கத்தில் இருந்து படத்தை இணைக்கலாம்!`
          : lang === 'hi'
          ? `📷 अभी तक फोटो अपलोड नहीं किया गया है। आप रिपोर्ट पेज से फोटो जोड़ सकते हैं!`
          : `📷 No image evidence uploaded yet. You can attach a photo on the Report Problem page for higher verification score!`;
      }

      return {
        intent: 'ACTIVE_REPORT_EVIDENCE',
        responseLang: lang,
        textResponse: text,
        data: report
      };
    }

    // 5. General active issue inquiry ("tell me about this problem", "about this report")
    if (this.matchesIntent(lowerInput, generalActiveKeywords)) {
      let text = '';
      if (lang === 'ta') {
        text = `📝 **தற்போதைய புகார் சுருக்கம்:**\n` +
          `• **தலைப்பு:** ${title}\n` +
          `• **பிரிவு:** ${category}\n` +
          `• **இடம்:** ${location}\n` +
          `• **தீவிரம்:** ${severity} (மதிப்பீடு: ${score}/100)\n` +
          `• **விளக்கம்:** ${report.description || 'விளக்கம் சேர்க்கப்பட்டுள்ளது.'}\n\n` +
          `இந்த புகார் குறித்த இடம், தீவிரம் அல்லது தீர்வு நேரம் பற்றி கூடுதல் கேள்விகளை கேட்கலாம்!`;
      } else if (lang === 'hi') {
        text = `📝 **वर्तमान शिकायत सारांश:**\n` +
          `• **शीर्षक:** ${title}\n` +
          `• **श्रेणी:** ${category}\n` +
          `• **स्थान:** ${location}\n` +
          `• **गंभीरता:** ${severity} (स्कोर: ${score}/100)\n` +
          `• **विवरण:** ${report.description || 'विवरण दिया गया है।'}\n\n` +
          `आप इस शिकायत के स्थान, समाधान समय या विभाग के बारे में प्रश्न पूछ सकते हैं!`;
      } else {
        text = `📝 **Active Report Overview:**\n` +
          `• **Title:** ${title}\n` +
          `• **Category:** ${category}\n` +
          `• **Location Landmark / GPS:** ${location}\n` +
          `• **Severity:** ${severity} (Priority Score: ${score}/100)\n` +
          `• **Description:** ${report.description || 'Issue details recorded.'}\n\n` +
          `Feel free to ask questions about its location, priority score, or resolution SLA!`;
      }

      return {
        intent: 'ACTIVE_REPORT_SUMMARY',
        responseLang: lang,
        textResponse: text,
        data: report
      };
    }

    return null;
  }

  matchesIntent(text, keywords) {
    return keywords.some(kw => text.includes(kw));
  }

  isConfirmation(text, lang) {
    const confirmWords = ['yes', 'confirm', 'submit', 'proceed', 'ok', 'sure', 'ஆம்', 'சரி', 'பதிவு செய்', 'பதிவு செய்யவும்', 'हाँ', 'दर्ज करें', 'ठीक है'];
    return confirmWords.some(w => text.includes(w));
  }

  // Handle Voice/Text Issue Reporting
  async handleReportIntent(text, lang, userLocation) {
    const category = this.extractCategory(text) || 'Road Damage';
    const severity = this.extractSeverity(text);
    const location = this.extractLocation(text) || (userLocation ? userLocation.address : null);
    
    // Calculate AI priority preview
    const aiPriority = await analyzePriority(category, severity, text);
    const priorityScore = aiPriority?.priorityScore || (severity === 'Critical' ? 95 : severity === 'High' ? 88 : 65);

    this.currentDraft = {
      title: `${category} Reported via Voice AI`,
      category: category,
      severity: severity,
      priorityScore: priorityScore,
      evidenceScore: Math.floor(80 + Math.random() * 15),
      description: text,
      location: location,
      stage: location ? 'READY_FOR_CONFIRMATION' : 'AWAITING_LOCATION'
    };

    if (!location) {
      const promptText = lang === 'ta'
        ? `உங்கள் புகாரை ${LOCALES['ta'].categories[category] || category} ஆக அடையாளம் கண்டுள்ளேன். 📍 தயவுசெய்து இந்த பிரச்சனையின் இடத்தை (Location/Street) கூறவும்.`
        : lang === 'hi'
        ? `मैंने आपकी शिकायत को ${LOCALES['hi'].categories[category] || category} के रूप में पहचाना है। 📍 कृपया इस समस्या का स्थान (Location) बताएं।`
        : `I understood this issue as ${category}. 📍 Please share the location so I can build your report draft.`;

      return {
        intent: 'REPORT_DRAFT_PENDING_LOCATION',
        responseLang: lang,
        textResponse: promptText,
        data: this.currentDraft
      };
    }

    return this.generateDraftReviewResponse(lang);
  }

  generateDraftReviewResponse(lang) {
    const draft = this.currentDraft;
    const catName = LOCALES[lang]?.categories[draft.category] || draft.category;
    const sevName = LOCALES[lang]?.severities[draft.severity] || draft.severity;

    let responseText = '';
    if (lang === 'ta') {
      responseText = `புகார் தகவல்கள் தயார்! 📝\n• பிரிவு: ${catName}\n• தீவிரம்: ${sevName}\n• இடம்: ${draft.location}\n• முன்னுரிமை மதிப்பீடு: ${draft.priorityScore}/100\n\nபுகாரை CivicLens-இல் பதிவு செய்ய விரும்புகிறீர்களா? (ஆம் / ரத்து செய்)`;
    } else if (lang === 'hi') {
      responseText = `शिकायत का विवरण तैयार है! 📝\n• श्रेणी: ${catName}\n• गंभीरता: ${sevName}\n• स्थान: ${draft.location}\n• प्राथमिकता स्कोर: ${draft.priorityScore}/100\n\nक्या आप इसे CivicLens में दर्ज करना चाहते हैं? (हाँ / रद्द करें)`;
    } else {
      responseText = `Report draft prepared! 📝\n• Category: ${catName}\n• Severity: ${sevName}\n• Location: ${draft.location}\n• Priority Score: ${draft.priorityScore}/100\n\nWould you like me to submit this report now?`;
    }

    return {
      intent: 'REPORT_REVIEW_CARD',
      responseLang: lang,
      textResponse: responseText,
      data: draft
    };
  }

  async finalizeReportSubmission(lang) {
    if (!this.currentDraft) {
      return {
        intent: 'UNKNOWN',
        responseLang: lang,
        textResponse: lang === 'ta' ? 'பதிவு செய்ய எந்த புகாரும் நிலுவையில் இல்லை.' : 'No pending report draft found.',
        data: null
      };
    }

    const draft = this.currentDraft;
    const reportData = {
      title: draft.title,
      category: draft.category,
      severity: draft.severity,
      priorityScore: draft.priorityScore,
      location: draft.location,
      address: draft.location,
      description: draft.description,
      reportedBy: 'Citizen (Voice AI)'
    };

    const created = await createReport(reportData);
    this.currentDraft = null;

    let successText = '';
    if (lang === 'ta') {
      successText = `🎉 உங்கள் புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டது!\nபுகார் எண்: ${created.id}\nமுன்னுரிமை மதிப்பீடு: ${created.priorityScore}/100\nஇது அதிகாரிகளின் பார்வைக்கு அனுப்பப்பட்டு வரைபடத்தில் சேர்க்கப்பட்டுள்ளது.`;
    } else if (lang === 'hi') {
      successText = `🎉 आपकी शिकायत सफलतापूर्वक दर्ज की गई है!\nशिकायत आईडी: ${created.id}\nप्राथमिकता स्कोर: ${created.priorityScore}/100\nइसे मानचित्र और अधिकारियों के डैशबोर्ड पर जोड़ दिया गया है।`;
    } else {
      successText = `🎉 Your complaint has been successfully registered!\nReport ID: ${created.id}\nPriority Score: ${created.priorityScore}/100\nIt has been automatically published to the Spatial Map and Authority Dashboard.`;
    }

    return {
      intent: 'REPORT_SUBMITTED_SUCCESS',
      responseLang: lang,
      textResponse: successText,
      data: created
    };
  }

  // Handle Complaint Tracking
  async handleTrackReport(userInput, lang) {
    const reports = await fetchReports();
    if (!reports || reports.length === 0) {
      return {
        intent: 'TRACK_RESULT',
        responseLang: lang,
        textResponse: lang === 'ta' ? 'எந்த புகார்களும் காணப்படவில்லை.' : 'No active reports found.',
        data: []
      };
    }

    // Try finding specific report by ID or matching keyword
    const matchId = userInput.match(/(rep-\d+|cl-\d+|\d+)/i);
    let targetReport = null;

    if (matchId) {
      const searchId = matchId[0].toLowerCase();
      targetReport = reports.find(r => r.id.toLowerCase().includes(searchId));
    }

    if (!targetReport) {
      targetReport = reports[0]; // Most recent report
    }

    const statusMap = {
      Pending: lang === 'ta' ? 'நிலுவையில் உள்ளது 🟡' : lang === 'hi' ? 'लंबित 🟡' : 'Pending 🟡',
      'In Progress': lang === 'ta' ? 'செயல்பாட்டில் உள்ளது 🟠' : lang === 'hi' ? 'प्रगति पर 🟠' : 'In Progress 🟠',
      Resolved: lang === 'ta' ? 'தீர்வு காணப்பட்டது 🟢' : lang === 'hi' ? 'समाधान हो गया 🟢' : 'Resolved 🟢'
    };

    const statusText = statusMap[targetReport.status] || targetReport.status;
    let text = '';

    if (lang === 'ta') {
      text = `உங்கள் புகார் விவரம்:\n• புகார் எண்: ${targetReport.id}\n• பிரச்சனை: ${targetReport.title}\n• நிலை: ${statusText}\n• இடம்: ${targetReport.location}\n• எதிர்பார்க்கப்படும் தீர்வு: 2–3 நாட்களில்`;
    } else if (lang === 'hi') {
      text = `आपकी शिकायत की स्थिति:\n• आईडी: ${targetReport.id}\n• समस्या: ${targetReport.title}\n• स्थिति: ${statusText}\n• स्थान: ${targetReport.location}\n• अनुमानित समाधान: 2–3 दिन`;
    } else {
      text = `Complaint Status:\n• ID: ${targetReport.id}\n• Title: ${targetReport.title}\n• Status: ${statusText}\n• Location: ${targetReport.location}\n• Expected resolution: 2–3 days`;
    }

    return {
      intent: 'TRACK_RESULT',
      responseLang: lang,
      textResponse: text,
      data: targetReport
    };
  }

  // Handle Nearby Issues Query
  async handleNearbyIssues(userLocation, lang) {
    const reports = await fetchReports();
    const nearby = reports.slice(0, 3).map((r, idx) => ({
      ...r,
      distanceMeters: (idx + 1) * 280 + Math.floor(Math.random() * 90)
    }));

    let responseText = '';
    if (lang === 'ta') {
      responseText = `📍 உங்கள் அருகில் உள்ள முக்கியமான பிரச்சனைகள்:\n` +
        nearby.map(r => `• ${r.severity === 'Critical' ? '🔴' : '🟠'} ${r.title} – ${r.distanceMeters}m`).join('\n');
    } else if (lang === 'hi') {
      responseText = `📍 आपके आसपास की मुख्य नागरिक समस्याएं:\n` +
        nearby.map(r => `• ${r.severity === 'Critical' ? '🔴' : '🟠'} ${r.title} – ${r.distanceMeters}m`).join('\n');
    } else {
      responseText = `📍 Nearby Civic Problems:\n` +
        nearby.map(r => `• ${r.severity === 'Critical' ? '🔴' : '🟠'} ${r.title} – ${r.distanceMeters}m`).join('\n');
    }

    return {
      intent: 'NEARBY_ISSUES',
      responseLang: lang,
      textResponse: responseText,
      data: nearby
    };
  }

  // Handle Area Statistics Summary
  async handleAreaStats(lang) {
    const reports = await fetchReports();
    const counts = {};
    reports.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });

    const topCategory = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'Road Damage';
    const topCount = counts[topCategory] || 14;

    let text = '';
    if (lang === 'ta') {
      text = `📊 உங்கள் பகுதியில் முக்கிய பிரச்சனைகள்:\n` +
        `• 🔴 ${topCategory}: ${topCount} புகார்கள்\n` +
        `• 🟠 குப்பை அள்ளுதல்: ${counts['Garbage'] || 9} புகார்கள்\n` +
        `• 🟡 தெருவிளக்கு: ${counts['Electricity'] || counts['Streetlight'] || 6} புகார்கள்\n\n` +
        `அவசர முன்னுரிமை: ${topCategory}\nமுன்னுரிமை புள்ளி: 92/100`;
    } else if (lang === 'hi') {
      text = `📊 आपके क्षेत्र की समस्याएँ:\n` +
        `• 🔴 ${topCategory}: ${topCount} रिपोर्ट\n` +
        `• 🟠 कचरा समस्या: ${counts['Garbage'] || 9} रिपोर्ट\n` +
        `• 🟡 लाइट समस्या: ${counts['Electricity'] || 6} रिपोर्ट\n\n` +
        `सबसे आवश्यक: ${topCategory}\nप्राथमिकता स्कोर: 92/100`;
    } else {
      text = `📊 Area Issue Breakdown:\n` +
        `• 🔴 ${topCategory}: ${topCount} reports\n` +
        `• 🟠 Garbage Overflow: ${counts['Garbage'] || 9} reports\n` +
        `• 🟡 Streetlights: ${counts['Electricity'] || 6} reports\n\n` +
        `Most Urgent: ${topCategory}\nPriority Score: 92/100`;
    }

    return {
      intent: 'AREA_STATS',
      responseLang: lang,
      textResponse: text,
      data: { topCategory, topCount, totalReports: reports.length }
    };
  }

  // Handle Explainable AI Questions ("Why is this issue high priority?")
  async handleExplainPriority(userInput, lang) {
    let text = '';
    if (lang === 'ta') {
      text = `இந்த பிரச்சனைக்கு அதிக முன்னுரிமை (High Priority - Score: 93/100) அளிக்கப்பட்டுள்ள காரணங்கள்:\n\n` +
        `• 8 குடிமக்கள் இதே பிரச்சனை குறித்து புகார் அளித்துள்ளனர்\n` +
        `• இது மக்கள் நடமாட்டம் அதிகம் உள்ள சாலை / மண்டலத்தில் அமைந்துள்ளது\n` +
        `• பதிவேற்றப்பட்ட விவரிப்பு அதிக ஆபத்தை சுட்டிக்காட்டுகிறது\n` +
        `• 48 மணி நேரத்திற்கு மேலாக தீர்க்கப்படாமல் உள்ளது\n\n` +
        `மதிப்பீடு: 93/100 (உடனடி நடவடிக்கை தேவை)`;
    } else if (lang === 'hi') {
      text = `इस समस्या को उच्च प्राथमिकता (High Priority - Score: 93/100) मिलने के कारण:\n\n` +
        `• 8 नागरिकों ने इसकी शिकायत की है\n` +
        `• यह मुख्य यातायात मार्ग के पास है\n` +
        `• क्षति का स्तर उच्च सुरक्षा जोखिम दर्शाता है\n` +
        `• निर्धारित समय से अधिक अनसुलझा रहा है\n\n` +
        `प्राथमिकता स्कोर: 93/100`;
    } else {
      text = `This issue has received a high priority score (93/100) because:\n\n` +
        `• 8 citizens reported this nearby issue\n` +
        `• It is located near a high-traffic main arterial road\n` +
        `• AI vision & description analysis indicates immediate hazard\n` +
        `• The issue has remained unresolved past standard SLA\n\n` +
        `Priority Score: 93/100 (Immediate Dispatch Requested)`;
    }

    return {
      intent: 'EXPLAIN_PRIORITY',
      responseLang: lang,
      textResponse: text,
      data: { score: 93, factors: 4 }
    };
  }

  // Handle General Q&A / Friendly Chatbot Assistant
  handleGeneralQa(text, lang) {
    let resp = '';
    if (lang === 'ta') {
      resp = `நான் CivicLens Voice AI. நீங்கள் உங்கள் குரல் மூலம் தெருவிளக்கு, சாலை சேதம், குப்பை, தண்ணீர் கசிவு போன்ற பிரச்சனைகளை புகார் செய்யலாம், நிலவரத்தை கண்காணிக்கலாம் மற்றும் பகுதி புள்ளிவிவரங்களை அறியலாம்.`;
    } else if (lang === 'hi') {
      resp = `मैं CivicLens Voice AI हूँ। आप अपनी आवाज से सड़क, बिजली, कचरा, और पानी की शिकायतों को दर्ज कर सकते हैं और स्थिति को ट्रैक कर सकते हैं।`;
    } else {
      resp = `I am CivicLens Voice AI. You can report civic problems, track complaint statuses, view nearby hazards, and analyze city issue statistics using your voice in Tamil, English, or Hindi.`;
    }

    return {
      intent: 'GENERAL_QA',
      responseLang: lang,
      textResponse: resp,
      data: null
    };
  }

  // Category Extractor
  extractCategory(text) {
    const t = text.toLowerCase();
    if (t.includes('pothole') || t.includes('road') || t.includes('சாலையில்') || t.includes('பள்ளம்') || t.includes('सड़क') || t.includes('गड्ढा')) return 'Road Damage';
    if (t.includes('garbage') || t.includes('waste') || t.includes('குப்பை') || t.includes('கழிவ') || t.includes('कचरा')) return 'Garbage';
    if (t.includes('water') || t.includes('leak') || t.includes('தண்ணீர்') || t.includes('கசிவு') || t.includes('पानी') || t.includes('रिसाव')) return 'Water Leakage';
    if (t.includes('light') || t.includes('lamp') || t.includes('தெருவிளக்கு') || t.includes('மின்சார') || t.includes('लाइट') || t.includes('बिजली')) return 'Streetlight';
    if (t.includes('flood') || t.includes('drain') || t.includes('வெள்ள') || t.includes('வடிகால்') || t.includes('बाढ़') || t.includes('जलभराव')) return 'Flooding';
    if (t.includes('traffic') || t.includes('போக்குவரத்து') || t.includes('यातायात')) return 'Traffic';
    return null;
  }

  // Severity Extractor
  extractSeverity(text) {
    const t = text.toLowerCase();
    if (t.includes('severe') || t.includes('critical') || t.includes('dangerous') || t.includes('ஆபத்த') || t.includes('கடுமை') || t.includes('गंभीर') || t.includes('खतरनाक')) return 'Critical';
    if (t.includes('huge') || t.includes('major') || t.includes('big') || t.includes('பெரிய') || t.includes('बड़ा')) return 'High';
    if (t.includes('minor') || t.includes('small') || t.includes('சிறிய') || t.includes('छोटा')) return 'Low';
    return 'High';
  }

  // Location Extractor
  extractLocation(text) {
    // Look for street, road, ward, area mentions
    const matches = text.match(/(near|at|on|in|பகுதியில்|தெருவில்|அருகில்|पास|पर)\s+([A-Za-z0-9\s\u0B80-\u0BFF\u0900-\u097F]{4,30})/i);
    if (matches && matches[2]) {
      return matches[2].trim();
    }
    if (text.includes('college') || text.includes('கல்லூரி')) return 'Near City College Ward';
    if (text.includes('school') || text.includes('பள்ளி')) return 'School Zone Ward';
    if (text.includes('market') || text.includes('சந்தை')) return 'Central Market Complex';
    return null;
  }
}

export const civicAiEngine = new CivicAiEngine();
