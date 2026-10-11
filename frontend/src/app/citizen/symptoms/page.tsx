"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Activity,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { useAuth, FamilyDependent, INDIAN_LANGUAGES } from "@/lib/auth-context";
import {
  Step1Symptoms,
  Step2ClinicalDetails,
  Step3ReportsOcr,
  Step4PresentAddress,
  Step5ReviewSubmit,
  SymptomSuccessScreen,
  FollowUpQuestion,
  OcrData,
  UploadedReportInfo,
} from "@/components/patient/symptoms";

// Helper function to encode raw PCM samples directly into standard 16kHz mono WAV format
function encodeWav(samples: Float32Array, sampleRate: number = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

// Resamples audio buffer cleanly using linear interpolation to 16kHz for Sarvam AI STT
function downsampleTo16k(
  input: Float32Array,
  inputRate: number,
  targetRate: number = 16000
): Float32Array {
  if (inputRate === targetRate || input.length === 0) return input;
  const ratio = inputRate / targetRate;
  const targetLength = Math.round(input.length / ratio);
  const result = new Float32Array(targetLength);
  for (let i = 0; i < targetLength; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const s1 = input[idx] || 0;
    const s2 = input[idx + 1] !== undefined ? input[idx + 1] : s1;
    result[i] = s1 + frac * (s2 - s1);
  }
  return result;
}

function PatientReportSymptomsForm() {
  const { user, updateProfile } = useAuth();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("draft_id") || searchParams.get("ticket_id") || searchParams.get("id");
  const stepParam = searchParams.get("step");
  const initialStep = stepParam && parseInt(stepParam) >= 1 && parseInt(stepParam) <= 5
    ? (parseInt(stepParam) as 1 | 2 | 3 | 4 | 5)
    : 1;

  // Active step in 5-step flow
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(initialStep);

  // Family Member Selection State (Fetched directly from database patient_profile table dependent column)
  const [familyMembers, setFamilyMembers] = useState<FamilyDependent[]>(() => {
    if (user?.dependents && Array.isArray(user.dependents)) {
      return user.dependents;
    }
    return [];
  });
  const [isLoadingDependents, setIsLoadingDependents] = useState<boolean>(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("self");
  const [showAddFamilyModal, setShowAddFamilyModal] = useState<boolean>(false);
  const [newFamilyName, setNewFamilyName] = useState<string>("");
  const [newFamilyRelation, setNewFamilyRelation] = useState<string>("Spouse");
  const [newFamilyAge, setNewFamilyAge] = useState<string>("");
  const [newFamilyGender, setNewFamilyGender] = useState<string>("Female");
  const [newFamilyPhone, setNewFamilyPhone] = useState<string>("");

  // Sync and fetch real family members from database patient_profile table
  useEffect(() => {
    let isMounted = true;
    const fetchFamilyDependents = async () => {
      const pid = user?.id || user?.userId || user?.patientUhid;
      if (!pid) {
        if (user?.dependents && Array.isArray(user.dependents)) {
          setFamilyMembers(user.dependents);
        }
        return;
      }

      setIsLoadingDependents(true);
      try {
        const res = await fetch(`/api/patient/dependents?patient_id=${encodeURIComponent(pid)}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && Array.isArray(json.dependents)) {
            setFamilyMembers(json.dependents);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not load family members from database API:", err);
      } finally {
        if (isMounted) setIsLoadingDependents(false);
      }

      if (isMounted && user?.dependents && Array.isArray(user.dependents)) {
        setFamilyMembers(user.dependents);
      }
    };

    fetchFamilyDependents();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.userId, user?.patientUhid, user?.dependents]);

  // Derived Effective Patient Details (calibrates triage age/gender)
  const selectedDependent =
    selectedMemberId === "self"
      ? null
      : familyMembers.find((m) => m.id === selectedMemberId) || null;

  const effectivePatientName = selectedDependent
    ? selectedDependent.fullName
    : user?.fullName || "Patient";

  const effectivePatientAge = selectedDependent
    ? (selectedDependent.age ? Number(selectedDependent.age) : "")
    : (user?.age ? Number(user.age) : "");

  const effectivePatientGender = selectedDependent
    ? selectedDependent.gender || ""
    : user?.gender || "";

  const effectivePatientUhid = selectedDependent
    ? selectedDependent.patientUhid || ""
    : user?.patientUhid || user?.userId || "";

  const effectiveRelation = selectedDependent
    ? selectedDependent.relation
    : "Self";

  // Step 1: Symptoms input
  const [symptomText, setSymptomText] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isOnlineTeleconsult, setIsOnlineTeleconsult] = useState<boolean>(true);
  const isRecordingRef = useRef<boolean>(false);
  const previousTextBeforeRecordingRef = useRef<string>("");
  const currentSessionLiveTextRef = useRef<string>("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const audioSampleRateRef = useRef<number>(16000);
  const animationFrameRef = useRef<number | null>(null);
  const hasSpokenRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Preferred Intake Language is strictly for doctor conversation preference & speech voice dictation
  // It does NOT translate the website
  const handleSelectLanguage = (newLang: string) => {
    setSelectedLanguage(newLang);
  };

  // Step 2: Extracted Information & Follow-up questions (Interactive Doctor Intake)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<string>("Qwen2.5 Dynamic Engine");
  const [extractedSymptoms, setExtractedSymptoms] = useState<string[]>([
    "Fever",
    "Headache",
    "Cough"
  ]);
  const [timeline, setTimeline] = useState<Array<{ date: string; event: string; duration: string }>>([
    { date: "Sep 14", event: "Fever reported (3 days)", duration: "3 days" },
    { date: "Sep 15", event: "Headache reported (2 days)", duration: "2 days" },
    { date: "Sep 16", event: "Cough reported (1 day)", duration: "1 day" }
  ]);
  const [missingItems, setMissingItems] = useState<string[]>([
    "Current measured body temperature",
    "Headache severity rating (1-10)",
    "Presence of sputum or chills"
  ]);

  // Dynamic follow-up questions returned by Qwen2.5
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([
    {
      id: "current_temperature",
      question: "What is your current or highest measured temperature?",
      type: "number",
      unit: "°F",
      placeholder: "102"
    },
    {
      id: "headache_severity",
      question: "How severe is your headache?",
      type: "radio",
      options: ["Mild (1-3)", "Moderate (4-6)", "Severe (7-10)"]
    }
  ]);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({
    current_temperature: "102",
    headache_severity: "Moderate (4-6)"
  });

  // Step 3: Medical Reports & Post-Upload Inquiries (eSanjeevani Protocol)
  const [isScanningOcr, setIsScanningOcr] = useState<boolean>(false);
  const [uploadedReport, setUploadedReport] = useState<UploadedReportInfo | null>(null);
  const [ocrData, setOcrData] = useState<OcrData | null>(null);
  const [reportInquiryAnswers, setReportInquiryAnswers] = useState<Record<string, string>>({});

  // Step 4: Present Address & Designated Facility
  const [presentState, setPresentState] = useState<string>("");
  const [presentDistrict, setPresentDistrict] = useState<string>("");
  const [presentBlock, setPresentBlock] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");

  // Health Facilities Directory
  const [facilitiesList, setFacilitiesList] = useState<Array<{
    id: string;
    user_id?: string;
    facility_name: string;
    role?: string;
    state?: string;
    district?: string;
    block?: string;
    city?: string;
    address_line1?: string;
    department?: string;
    hpr_id?: string;
  }>>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState<boolean>(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
  const [selectedFacilityName, setSelectedFacilityName] = useState<string>("");

  // Step 5: Review & Submission
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null);
  const [draftTicketId, setDraftTicketId] = useState<string | null>(null);
  const [draftCaseNumber, setDraftCaseNumber] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState<boolean>(Boolean(draftIdParam));

  // Load draft ticket if draft_id is in URL query parameters
  useEffect(() => {
    if (!draftIdParam) return;

    let isMounted = true;
    async function loadDraftTicket() {
      setIsLoadingDraft(true);
      try {
        const res = await fetch(`/api/patient/triage?id=${draftIdParam}`);
        if (!res.ok) return;
        const data = await res.json();
        const t = data.ticket;
        if (!t || !isMounted) return;

        setDraftTicketId(t.id);
        if (t.case_number) setDraftCaseNumber(t.case_number);

        const sdata = t.symptoms_data || {};
        if (sdata.symptoms && Array.isArray(sdata.symptoms)) {
          const names = sdata.symptoms
            .map((s: any) => (typeof s === "string" ? s : s?.name || s?.symptom || s?.title || ""))
            .filter(Boolean);
          if (names.length > 0) setExtractedSymptoms(names);
        }
        if (sdata.raw_complaint || sdata.complaint || sdata.chief_complaint) {
          setSymptomText(sdata.raw_complaint || sdata.complaint || sdata.chief_complaint);
        }
        if (sdata.timeline && Array.isArray(sdata.timeline)) {
          setTimeline(sdata.timeline);
        }
        if (sdata.follow_up_answers && typeof sdata.follow_up_answers === "object") {
          setFollowUpAnswers(sdata.follow_up_answers);
        }

        if (t.present_address) {
          if (t.present_address.state) setPresentState(t.present_address.state);
          if (t.present_address.district) setPresentDistrict(t.present_address.district);
          if (t.present_address.block) setPresentBlock(t.present_address.block);
          if (t.present_address.landmark) setLandmark(t.present_address.landmark);
          if (t.present_address.facility_id) setSelectedFacilityId(t.present_address.facility_id);
          if (t.present_address.facility_name) setSelectedFacilityName(t.present_address.facility_name);
        }
        if (t.facility_id) setSelectedFacilityId(t.facility_id);

        if (t.preferred_language) setSelectedLanguage(t.preferred_language);
        if (t.consultation_mode) setIsOnlineTeleconsult(t.consultation_mode === "online");

        if (t.uploaded_report_data && Object.keys(t.uploaded_report_data).length > 0) {
          setOcrData(t.uploaded_report_data);
          setUploadedReport({
            fileName: t.uploaded_report_data.file_name || "Uploaded Medical Report.pdf",
            fileSize: "Document",
            status: "OCR Processed & Ready",
          });
        }

        // Open directly from the exact step where draft was saved
        const stepFromParam = searchParams.get("step");
        const savedStep = stepFromParam
          ? parseInt(stepFromParam)
          : (Number(sdata.current_step) || Number(t.current_step) || 1);

        if (savedStep >= 1 && savedStep <= 5) {
          setStep(savedStep as any);
        } else {
          setStep(1);
        }
      } catch (err) {
        console.error("Failed to load draft ticket:", err);
      } finally {
        if (isMounted) setIsLoadingDraft(false);
      }
    }

    loadDraftTicket();
    return () => {
      isMounted = false;
    };
  }, [draftIdParam, searchParams]);

  // Fetch available registered facilities from DB
  useEffect(() => {
    let isMounted = true;
    async function loadFacilities() {
      try {
        setIsLoadingFacilities(true);
        const res = await fetch("/api/facilities");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.facilities)) {
            setFacilitiesList(data.facilities);
          }
        }
      } catch (e) {
        console.error("Failed to load facilities", e);
      } finally {
        if (isMounted) setIsLoadingFacilities(false);
      }
    }
    loadFacilities();
    return () => {
      isMounted = false;
    };
  }, []);

  // Cascading Address Dropdowns: State -> District -> Block
  const handleStateChange = (newState: string) => {
    setPresentState(newState);
    setPresentDistrict("");
    setPresentBlock("");
    setSelectedFacilityId("");
    setSelectedFacilityName("");
  };

  const handleDistrictChange = (newDistrict: string) => {
    setPresentDistrict(newDistrict);
    setPresentBlock("");
    setSelectedFacilityId("");
    setSelectedFacilityName("");
  };

  const handleBlockChange = (newBlock: string) => {
    setPresentBlock(newBlock);
    setSelectedFacilityId("");
    setSelectedFacilityName("");
  };

  // Helper to normalize strings for comparison (removes punctuation, spaces, lowercase)
  const cleanStr = (s?: string) => (s || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  // STRICT facility filter: ONLY facilities matching the chosen state, district and block
  const addressFilteredFacilities = useMemo(() => {
    if (!presentState || !presentDistrict) return [];

    const stateClean = cleanStr(presentState);
    const distClean = cleanStr(presentDistrict);
    const blockClean = cleanStr(presentBlock);

    // Strictly match state and district
    const inDistrict = facilitiesList.filter((f) => {
      return cleanStr(f.state) === stateClean && cleanStr(f.district) === distClean;
    });

    if (!presentBlock) {
      return inDistrict;
    }

    // If block is specified, strictly filter to facilities matching that block
    const inBlock = inDistrict.filter((f) => cleanStr(f.block) === blockClean);

    // Return block matches if available; otherwise return facilities in the district
    return inBlock.length > 0 ? inBlock : inDistrict;
  }, [facilitiesList, presentState, presentDistrict, presentBlock]);

  // If selected facility does not belong to the newly chosen address, clear selection
  useEffect(() => {
    if (!selectedFacilityId) return;
    const stillValid = addressFilteredFacilities.some((f) => f.id === selectedFacilityId);
    if (!stillValid) {
      setSelectedFacilityId("");
      setSelectedFacilityName("");
    }
  }, [addressFilteredFacilities, selectedFacilityId]);

  // Sarvam AI Speech-to-Text Processor
  const processSarvamTranscription = async (audioBlob: Blob, recordedMime: string = "audio/wav") => {
    if (!audioBlob || audioBlob.size < 100) {
      console.warn("Recorded audio too small for transcription", audioBlob?.size);
      return;
    }

    setIsTranscribing(true);
    try {
      const langObj = INDIAN_LANGUAGES.find(
        (l) =>
          l.name.toLowerCase() === selectedLanguage.toLowerCase() ||
          l.code.toLowerCase() === selectedLanguage.toLowerCase()
      ) || INDIAN_LANGUAGES[0];

      // Form multipart payload for Sarvam STT API route
      const formData = new FormData();
      formData.append("file", audioBlob, "symptom_recording.wav");
      formData.append("language_code", langObj.bcp47);
      formData.append("language", langObj.name);

      const res = await fetch("/api/sarvam/speech-to-text", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.transcript) {
          const sarvamTranscript = data.transcript.trim();
          if (sarvamTranscript) {
            // Automatically write Sarvam transcript directly into the symptom text area
            const base = previousTextBeforeRecordingRef.current.trim();
            const updated = base ? `${base} ${sarvamTranscript}` : sarvamTranscript;
            setSymptomText(updated);
          }
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn("Sarvam STT response notice:", errJson);
      }
    } catch (err) {
      console.warn("Sarvam AI STT error:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Continuous Voice Dictation Handlers with Sarvam AI STT
  const stopVoiceDictation = () => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop browser SpeechRecognition if running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    // Disconnect script processor
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current.onaudioprocess = null;
      } catch {}
      scriptProcessorRef.current = null;
    }

    // Collect recorded PCM chunks
    const chunks = pcmChunksRef.current;
    const totalSamples = chunks.reduce((acc, c) => acc + c.length, 0);

    // Stop microphone stream tracks
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      mediaStreamRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    setRecordingSeconds(0);

    // Process high-fidelity 16kHz WAV audio for Sarvam STT
    if (totalSamples > 800) {
      const merged = new Float32Array(totalSamples);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      const inputRate = audioSampleRateRef.current || 44100;
      const samples16k = downsampleTo16k(merged, inputRate, 16000);
      const wavBlob = encodeWav(samples16k, 16000);
      pcmChunksRef.current = [];
      processSarvamTranscription(wavBlob, "audio/wav");
    } else {
      console.warn("Recorded audio too brief for transcription:", totalSamples);
      pcmChunksRef.current = [];
    }
  };

  const startVoiceDictation = async () => {
    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordingSeconds(0);
    pcmChunksRef.current = [];
    previousTextBeforeRecordingRef.current = symptomText;
    currentSessionLiveTextRef.current = "";
    hasSpokenRef.current = false;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        // Auto-finalize dictation if it hits 45 seconds to keep speech segments crisp
        if (prev >= 45) {
          stopVoiceDictation();
          return 45;
        }
        return prev + 1;
      });
    }, 1000);

    // 1. Capture microphone audio with Web Audio API (PCM) + Analyser VAD
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;

        // Setup real-time audio pipeline for raw PCM recording and voice activity detection
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            if (audioCtx.state === "suspended") {
              await audioCtx.resume();
            }
            audioContextRef.current = audioCtx;
            audioSampleRateRef.current = audioCtx.sampleRate;

            const source = audioCtx.createMediaStreamSource(stream);

            // Accumulate Float32 PCM samples via ScriptProcessorNode (universal cross-browser compatibility)
            const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (e) => {
              if (!isRecordingRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              pcmChunksRef.current.push(new Float32Array(inputData));
            };
            source.connect(scriptProcessor);

            // Connect script processor through a silent gain node to destination to keep processing alive
            const silenceGain = audioCtx.createGain();
            silenceGain.gain.value = 0;
            scriptProcessor.connect(silenceGain);
            silenceGain.connect(audioCtx.destination);

            // Analyser for silence detection / Voice Activity Detection (VAD)
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.2;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            let silenceStartTime: number | null = null;

            const checkVocalActivity = () => {
              if (!isRecordingRef.current) return;
              analyser.getByteFrequencyData(dataArray);
              let total = 0;
              for (let i = 0; i < dataArray.length; i++) {
                total += dataArray[i];
              }
              const averageLevel = total / dataArray.length;

              // Voice activity detected
              if (averageLevel > 6) {
                hasSpokenRef.current = true;
                silenceStartTime = null;
              } else if (hasSpokenRef.current) {
                // If user has spoken, detect pause (> 2.3 seconds) to automatically stop and transcribe
                const now = Date.now();
                if (!silenceStartTime) {
                  silenceStartTime = now;
                } else if (now - silenceStartTime > 2300) {
                  console.log("Automatic speech pause detected, finalizing speech-to-text...");
                  stopVoiceDictation();
                  return;
                }
              }

              animationFrameRef.current = requestAnimationFrame(checkVocalActivity);
            };

            animationFrameRef.current = requestAnimationFrame(checkVocalActivity);
          }
        } catch (audioCtxErr) {
          console.warn("AudioContext setup notice:", audioCtxErr);
        }
      }
    } catch (micErr: any) {
      console.warn("Microphone access error:", micErr);
      isRecordingRef.current = false;
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      alert(
        micErr?.name === "NotAllowedError" || micErr?.name === "PermissionDeniedError"
          ? "Microphone access was denied. Please allow microphone permission in your browser to use voice dictation."
          : "Unable to access microphone. Please check your audio input device."
      );
    }

    // 2. Parallel real-time streaming preview via Web Speech API ONLY if natively supported by browser
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const langObj = INDIAN_LANGUAGES.find(
      (l) =>
        l.name.toLowerCase() === selectedLanguage.toLowerCase() ||
        l.code.toLowerCase() === selectedLanguage.toLowerCase()
    ) || INDIAN_LANGUAGES[0];

    // Language codes natively supported by Chrome Web Speech API
    const webSpeechSupportedLangs = [
      "en-IN", "hi-IN", "bn-IN", "ta-IN", "te-IN", "mr-IN", "gu-IN", "kn-IN", "ml-IN", "ur-IN"
    ];
    const isSupportedByBrowser = webSpeechSupportedLangs.includes(langObj.bcp47);

    if (SpeechRecognition && isSupportedByBrowser) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = langObj.bcp47;

        let webSpeechActive = true;

        recognition.onresult = (event: any) => {
          let interim = "";
          let finalChunk = "";

          for (let i = 0; i < event.results.length; i++) {
            const text = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalChunk += text + " ";
            } else {
              interim += text;
            }
          }

          const liveSessionText = (finalChunk + interim).trim();
          if (liveSessionText) {
            hasSpokenRef.current = true;
            currentSessionLiveTextRef.current = liveSessionText;
            const base = previousTextBeforeRecordingRef.current.trim();
            // Automatically write speech preview into input in real time
            const combined = base ? `${base} ${liveSessionText}` : liveSessionText;
            setSymptomText(combined);
          }
        };

        recognition.onend = () => {
          if (webSpeechActive && isRecordingRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              webSpeechActive = false;
            }
          }
        };

        recognition.onerror = (event: any) => {
          if (
            event.error === "language-not-supported" ||
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
          ) {
            webSpeechActive = false;
            recognitionRef.current = null;
          } else if (event.error !== "no-speech") {
            console.warn("SpeechRecognition event:", event.error);
          }
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          webSpeechActive = false;
        }
      } catch (e) {
        console.warn("Web Speech preview setup notice:", e);
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopVoiceDictation();
    } else {
      startVoiceDictation();
    }
  };

  useEffect(() => {
    return () => {
      stopVoiceDictation();
    };
  }, []);

  // Add Family Member Handler
  const handleAddFamilyMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;

    const newDep: FamilyDependent = {
      id: `dep-${Date.now()}`,
      fullName: newFamilyName.trim(),
      relation: newFamilyRelation,
      age: newFamilyAge.trim() ? Number(newFamilyAge) : undefined,
      gender: newFamilyGender,
      phone: newFamilyPhone.trim() || undefined,
      patientUhid: `PAT-${Math.floor(100000 + Math.random() * 900000)}`
    };

    const updated = [...familyMembers, newDep];
    setFamilyMembers(updated);
    setSelectedMemberId(newDep.id);

    try {
      const pid = user?.id || user?.userId || user?.patientUhid;
      if (pid) {
        await fetch("/api/patient/dependents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: pid,
            dependent: newDep,
            dependents: updated,
          }),
        });
      }

      if (updateProfile) {
        await updateProfile({ dependents: updated });
      }
    } catch (err) {
      console.warn("Could not sync dependent to profile or database:", err);
    }

    setNewFamilyName("");
    setNewFamilyAge("");
    setNewFamilyPhone("");
    setShowAddFamilyModal(false);
  };

  // Step 1 -> Step 2: Trigger Dynamic Symptom Extraction via Hugging Face
  const handleProceedToStep2 = async () => {
    if (!symptomText.trim()) return;
    setIsExtracting(true);

    try {
      const res = await fetch("http://localhost:8000/api/triage/qwen-extract-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_symptoms: symptomText,
          language: selectedLanguage,
          patient_age: effectivePatientAge,
          patient_gender: effectivePatientGender
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.source) setAiSource(json.source);
        if (json.data) {
          if (json.data.symptoms) setExtractedSymptoms(json.data.symptoms);
          if (json.data.timeline) setTimeline(json.data.timeline);
          if (json.data.missing) setMissingItems(json.data.missing);
          if (json.data.follow_up_questions && json.data.follow_up_questions.length > 0) {
            setFollowUpQuestions(json.data.follow_up_questions);
            // Patient must choose every answer themselves (no default pre-selection)
            setFollowUpAnswers({});
          }
        }
      }
    } catch (e) {
      console.error("Extraction error:", e);
    } finally {
      setIsExtracting(false);
      setCurrentQuestionIndex(0);
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Step 3: Handle Report Upload & Dynamic Qwen2.5-VL OCR
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningOcr(true);
    setUploadedReport({
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      status: "⏳ Qwen2.5-VL OCR scanning in progress..."
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_name", file.name);
      formData.append("symptoms", JSON.stringify(extractedSymptoms));
      formData.append("symptom_text", symptomText);
      formData.append("follow_up_answers", JSON.stringify(followUpAnswers));
      formData.append("patient_age", String(effectivePatientAge));
      formData.append("patient_gender", effectivePatientGender);

      const res = await fetch("http://localhost:8000/api/ocr/scan-qwen-vl", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setOcrData(json.data);
          setUploadedReport((prev) =>
            prev ? { ...prev, status: "✓ Analyzed & Correlated with Clinical History" } : null
          );

          if (json.data.missing_information) {
            // Patient must choose every report inquiry answer themselves (no default pre-selection)
            setReportInquiryAnswers({});
          }
        }
      }
    } catch {
      // fallback
    } finally {
      setIsScanningOcr(false);
    }
  };

  // Quick report loaders for interactive verification
  const handleLoadSample = async (testType: string, fileName: string) => {
    setIsScanningOcr(true);
    setUploadedReport({
      fileName: fileName,
      fileSize: "1.2 MB",
      status: "⏳ Qwen2.5-VL OCR scanning in progress..."
    });

    try {
      const formData = new FormData();
      formData.append("file_name", fileName);
      formData.append("report_type", testType);
      formData.append("symptoms", JSON.stringify(extractedSymptoms));
      formData.append("symptom_text", symptomText);
      formData.append("follow_up_answers", JSON.stringify(followUpAnswers));
      formData.append("patient_age", String(effectivePatientAge));
      formData.append("patient_gender", effectivePatientGender);

      const res = await fetch("http://localhost:8000/api/ocr/scan-qwen-vl", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setOcrData(json.data);
          setUploadedReport({
            fileName: fileName,
            fileSize: "1.2 MB",
            status: "✓ Analyzed & Correlated with Clinical History"
          });

          if (json.data.missing_information) {
            // Patient must choose every report inquiry answer themselves (no default pre-selection)
            setReportInquiryAnswers({});
          }
        }
      }
    } catch {
      // fallback
    } finally {
      setIsScanningOcr(false);
    }
  };

  // Step 5: Final Submission to Database with Hugging Face Priority
  const handleSubmitCase = async () => {
    if (!consentChecked) return;
    setIsSubmitting(true);

    const payload = {
      ticket_id: draftTicketId || null,
      patient_id: user?.id || null,
      user_id: user?.id || null,
      is_family_member: Boolean(selectedDependent),
      family_member_id: selectedDependent ? selectedDependent.id : null,
      family_member_name: selectedDependent ? selectedDependent.fullName : null,
      family_member_relationship: selectedDependent ? selectedDependent.relation : null,
      family_member_uhid: selectedDependent ? (selectedDependent.patientUhid || "PAT-9920") : null,
      family_member_age: selectedDependent ? (Number(selectedDependent.age) || null) : null,
      family_member_gender: selectedDependent ? selectedDependent.gender : null,
      family_member_phone: selectedDependent ? (selectedDependent.phone || null) : null,
      patient_name: effectivePatientName,
      patient_uhid: effectivePatientUhid,
      patient_age: effectivePatientAge,
      patient_gender: effectivePatientGender,
      patient_relation: effectiveRelation,
      reported_by: user?.fullName || "Patient",
      language: selectedLanguage,
      raw_complaint: symptomText.trim(),
      symptom_text: symptomText.trim(),
      symptoms: extractedSymptoms,
      timeline: timeline,
      follow_up_answers: followUpAnswers,
      follow_up_questions: followUpQuestions,
      report_data: uploadedReport && ocrData ? { ...ocrData, file_name: uploadedReport.fileName } : null,
      report_answers: reportInquiryAnswers,
      facility_id: selectedFacilityId || null,
      medical_id: selectedFacilityId || null,
      facility_name: selectedFacilityName || null,
      present_state: presentState,
      present_district: presentDistrict,
      present_block: presentBlock,
      present_address: {
        state: presentState,
        district: presentDistrict,
        block: presentBlock,
        facility_id: selectedFacilityId || null,
        facility_name: selectedFacilityName || null,
      },
      consent: consentChecked,
      consultation_mode: isOnlineTeleconsult ? "online" : "offline"
    };

    try {
      // 1. Submit to Next.js API route
      const res = await fetch("/api/patient/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        setSubmittedTicket(json);
      } else {
        // 2. Fallback to FastAPI backend if Next.js route encountered an error
        const pyRes = await fetch("http://localhost:8000/api/triage/qwen-priority-and-submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (pyRes.ok) {
          const pyJson = await pyRes.json();
          setSubmittedTicket(pyJson);
        }
      }
    } catch (err) {
      console.warn("[Triage Submit Primary Error, attempting fallback]", err);
      try {
        const pyRes = await fetch("http://localhost:8000/api/triage/qwen-priority-and-submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (pyRes.ok) {
          const pyJson = await pyRes.json();
          setSubmittedTicket(pyJson);
        }
      } catch (pyErr) {
        console.error("[Triage Submit Fallback Error]", pyErr);
      }
    } finally {
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Save in-progress symptoms as a Draft ticket in Supabase
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);

    const payload = {
      ticket_id: draftTicketId || null,
      current_step: step,
      patient_id: user?.id || null,
      user_id: user?.id || null,
      is_family_member: Boolean(selectedDependent),
      family_member_id: selectedDependent ? selectedDependent.id : null,
      family_member_name: selectedDependent ? selectedDependent.fullName : null,
      family_member_relationship: selectedDependent ? selectedDependent.relation : null,
      family_member_uhid: selectedDependent ? (selectedDependent.patientUhid || "PAT-9920") : null,
      family_member_age: selectedDependent ? (Number(selectedDependent.age) || null) : null,
      family_member_gender: selectedDependent ? selectedDependent.gender : null,
      family_member_phone: selectedDependent ? (selectedDependent.phone || null) : null,
      patient_name: effectivePatientName,
      patient_uhid: effectivePatientUhid,
      patient_age: effectivePatientAge,
      patient_gender: effectivePatientGender,
      patient_relation: effectiveRelation,
      reported_by: user?.fullName || "Patient",
      language: selectedLanguage,
      raw_complaint: symptomText.trim(),
      symptom_text: symptomText.trim(),
      symptoms: extractedSymptoms.length > 0 ? extractedSymptoms : (symptomText ? [symptomText] : ["General symptoms intake"]),
      timeline: timeline,
      follow_up_answers: followUpAnswers,
      follow_up_questions: followUpQuestions,
      report_data: uploadedReport && ocrData ? { ...ocrData, file_name: uploadedReport.fileName } : null,
      report_answers: reportInquiryAnswers,
      facility_id: selectedFacilityId || null,
      medical_id: selectedFacilityId || null,
      facility_name: selectedFacilityName || null,
      present_state: presentState,
      present_district: presentDistrict,
      present_block: presentBlock,
      present_address: {
        state: presentState,
        district: presentDistrict,
        block: presentBlock,
        facility_id: selectedFacilityId || null,
        facility_name: selectedFacilityName || null,
      },
      consent: Boolean(consentChecked),
      consultation_mode: isOnlineTeleconsult ? "online" : "offline",
      status: "Draft",
    };

    try {
      const res = await fetch("/api/patient/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        setSubmittedTicket({ ...json, status: "Draft" });
      } else {
        const pyRes = await fetch("http://localhost:8000/api/triage/qwen-priority-and-submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (pyRes.ok) {
          const pyJson = await pyRes.json();
          setSubmittedTicket({ ...pyJson, status: "Draft" });
        }
      }
    } catch (err) {
      console.warn("[Save Draft Primary Error, attempting fallback]", err);
      try {
        const pyRes = await fetch("http://localhost:8000/api/triage/qwen-priority-and-submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (pyRes.ok) {
          const pyJson = await pyRes.json();
          setSubmittedTicket({ ...pyJson, status: "Draft" });
        }
      } catch (pyErr) {
        console.error("[Save Draft Fallback Error]", pyErr);
      }
    } finally {
      setIsSavingDraft(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-16 space-y-6">
      {/* Top Header & Healthcare Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Book Appointment
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            5-step guided clinical evaluation with real-time laboratory OCR and nearest PHC triage routing.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2.5">
          {/* Step Indicator Badges with Step-by-Step Arrow Marks */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-sans overflow-x-auto py-1">
            {[
              { num: 1, label: "Symptoms" },
              { num: 2, label: "Details" },
              { num: 3, label: "Reports" },
              { num: 4, label: "Address" },
              { num: 5, label: "Review" }
            ].map((s, idx, arr) => (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => {
                    if (s.num <= step) {
                      setStep(s.num as any);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  disabled={s.num > step}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs whitespace-nowrap shadow-2xs ${
                    step === s.num
                      ? "bg-teal-800 text-white shadow-xs"
                      : s.num < step
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                      : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
                    {s.num}
                  </span>
                  <span>{s.label}</span>
                </button>
                {idx < arr.length - 1 && (
                  <span className="text-slate-300 font-bold select-none text-xs">&rarr;</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Resumed Draft Alert Banner */}
      {draftCaseNumber && !submittedTicket && !isLoadingDraft && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm block">
                Opened Draft Encounter #{draftCaseNumber}
              </span>
              <span className="text-amber-800">
                Loaded saved clinical details. You can review all steps or proceed to Step 5 to submit for medical review.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep(5);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-amber-800 hover:bg-amber-900 text-white shadow-2xs transition-all shrink-0 self-start sm:self-auto cursor-pointer"
          >
            Go to Review &amp; Submit &rarr;
          </button>
        </div>
      )}

      {/* Main Screen: Result / Loading / Steps */}
      {submittedTicket ? (
        <SymptomSuccessScreen
          submittedTicket={submittedTicket}
          effectivePatientName={effectivePatientName}
          selectedDependent={selectedDependent}
          effectiveRelation={effectiveRelation}
          effectivePatientAge={effectivePatientAge}
          effectivePatientGender={effectivePatientGender}
          effectivePatientUhid={effectivePatientUhid}
          selectedFacilityName={selectedFacilityName}
          presentBlock={presentBlock}
          onStartNew={() => {
            setSubmittedTicket(null);
            setStep(1);
          }}
        />
      ) : isLoadingDraft ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-10 sm:p-16 text-center space-y-5 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mx-auto shadow-2xs">
            <Activity className="w-8 h-8 animate-pulse text-teal-700" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Loading Saved Draft Encounter...
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Restoring your recorded symptoms, follow-up answers, and address directly to your saved step page.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-bold text-teal-800">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-700" />
            <span>Opening saved step...</span>
          </div>
        </div>
      ) : (
        <>
          {step === 1 && (
            <Step1Symptoms
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={handleSelectLanguage}
              familyMembers={familyMembers}
              selectedMemberId={selectedMemberId}
              setSelectedMemberId={setSelectedMemberId}
              showAddFamilyModal={showAddFamilyModal}
              setShowAddFamilyModal={setShowAddFamilyModal}
              newFamilyName={newFamilyName}
              setNewFamilyName={setNewFamilyName}
              newFamilyRelation={newFamilyRelation}
              setNewFamilyRelation={setNewFamilyRelation}
              newFamilyAge={newFamilyAge}
              setNewFamilyAge={setNewFamilyAge}
              newFamilyGender={newFamilyGender}
              setNewFamilyGender={setNewFamilyGender}
              onAddFamilyMemberSubmit={handleAddFamilyMemberSubmit}
              user={user}
              effectivePatientName={effectivePatientName}
              selectedDependent={selectedDependent}
              effectiveRelation={effectiveRelation}
              isRecording={isRecording}
              recordingSeconds={recordingSeconds}
              isTranscribing={isTranscribing}
              toggleRecording={toggleRecording}
              stopVoiceDictation={stopVoiceDictation}
              symptomText={symptomText}
              setSymptomText={setSymptomText}
              isOnlineTeleconsult={isOnlineTeleconsult}
              setIsOnlineTeleconsult={setIsOnlineTeleconsult}
              isExtracting={isExtracting}
              onProceedToStep2={handleProceedToStep2}
            />
          )}

          {step === 2 && (
            <Step2ClinicalDetails
              aiSource={aiSource}
              followUpQuestions={followUpQuestions}
              currentQuestionIndex={currentQuestionIndex}
              setCurrentQuestionIndex={setCurrentQuestionIndex}
              followUpAnswers={followUpAnswers}
              setFollowUpAnswers={setFollowUpAnswers}
              extractedSymptoms={extractedSymptoms}
              setExtractedSymptoms={setExtractedSymptoms}
              timeline={timeline}
              missingItems={missingItems}
              onBack={() => setStep(1)}
              onContinue={() => {
                setStep(3);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onSaveDraft={handleSaveDraft}
              isSavingDraft={isSavingDraft}
              isSubmitting={isSubmitting}
            />
          )}

          {step === 3 && (
            <Step3ReportsOcr
              isScanningOcr={isScanningOcr}
              extractedSymptoms={extractedSymptoms}
              symptomText={symptomText}
              uploadedReport={uploadedReport}
              setUploadedReport={setUploadedReport}
              ocrData={ocrData}
              setOcrData={setOcrData}
              reportInquiryAnswers={reportInquiryAnswers}
              setReportInquiryAnswers={setReportInquiryAnswers}
              handleFileUpload={handleFileUpload}
              handleLoadSample={handleLoadSample}
              onBack={() => setStep(2)}
              onContinue={() => {
                setStep(4);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onSaveDraft={handleSaveDraft}
              isSavingDraft={isSavingDraft}
              isSubmitting={isSubmitting}
            />
          )}

          {step === 4 && (
            <Step4PresentAddress
              presentState={presentState}
              presentDistrict={presentDistrict}
              presentBlock={presentBlock}
              handleStateChange={handleStateChange}
              handleDistrictChange={handleDistrictChange}
              handleBlockChange={handleBlockChange}
              selectedFacilityId={selectedFacilityId}
              setSelectedFacilityId={setSelectedFacilityId}
              selectedFacilityName={selectedFacilityName}
              setSelectedFacilityName={setSelectedFacilityName}
              addressFilteredFacilities={addressFilteredFacilities}
              facilitiesList={facilitiesList}
              onBack={() => setStep(3)}
              onContinue={() => {
                setStep(5);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onSaveDraft={handleSaveDraft}
              isSavingDraft={isSavingDraft}
              isSubmitting={isSubmitting}
            />
          )}

          {step === 5 && (
            <Step5ReviewSubmit
              effectivePatientName={effectivePatientName}
              selectedDependent={selectedDependent}
              effectiveRelation={effectiveRelation}
              effectivePatientAge={effectivePatientAge}
              effectivePatientGender={effectivePatientGender}
              selectedLanguage={selectedLanguage}
              presentState={presentState}
              presentDistrict={presentDistrict}
              presentBlock={presentBlock}
              selectedFacilityName={selectedFacilityName}
              isOnlineTeleconsult={isOnlineTeleconsult}
              extractedSymptoms={extractedSymptoms}
              followUpAnswers={followUpAnswers}
              followUpQuestions={followUpQuestions}
              uploadedReport={uploadedReport}
              ocrData={ocrData}
              consentChecked={consentChecked}
              setConsentChecked={setConsentChecked}
              onBack={() => setStep(4)}
              onSaveDraft={handleSaveDraft}
              onSubmitCase={handleSubmitCase}
              isSavingDraft={isSavingDraft}
              isSubmitting={isSubmitting}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function PatientReportSymptomsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto py-16 text-center text-slate-500 font-medium text-xs">
          Loading clinical intake form...
        </div>
      }
    >
      <PatientReportSymptomsForm />
    </Suspense>
  );
}
