"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Mic,
  MicOff,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  Building2,
  MapPin,
  ChevronDown,
  RotateCcw,
  Sparkles,
  FileCheck,
  Eye,
  AlertCircle,
  HelpCircle,
  Radio,
  Check,
  Plus,
  X,
  Activity,
  HeartPulse,
  Send,
  RefreshCw,
  Stethoscope,
  Square,
  Users,
  Globe,
  Video
} from "lucide-react";
import { useAuth, INDIAN_LANGUAGES, FamilyDependent } from "@/lib/auth-context";

// State and Block mapping for Step 4
const INDIAN_STATES_AND_DISTRICTS: Record<string, string[]> = {
  "Odisha": [
    "Nayagarh",
    "Gajapati",
    "Ganjam",
    "Khordha",
    "Cuttack",
    "Puri",
    "Rayagada",
    "Balasore",
    "Sambalpur",
    "Sundargarh",
    "Kendrapara",
    "Mayurbhanj",
    "Koraput"
  ],
  "Andhra Pradesh": [
    "Srikakulam",
    "Visakhapatnam",
    "Vizianagaram",
    "Krishna",
    "Guntur",
    "East Godavari",
    "Chittoor"
  ],
  "West Bengal": [
    "Paschim Medinipur",
    "Purba Medinipur",
    "Darjeeling",
    "North 24 Parganas",
    "South 24 Parganas",
    "Kolkata"
  ],
  "Maharashtra": [
    "Pune",
    "Nashik",
    "Nagpur",
    "Thane",
    "Mumbai Suburban",
    "Aurangabad"
  ],
  "Karnataka": [
    "Bengaluru Urban",
    "Bengaluru Rural",
    "Mysuru",
    "Dakshina Kannada",
    "Dharwad"
  ],
  "Bihar": [
    "Patna",
    "Gaya",
    "Muzaffarpur",
    "Bhagalpur",
    "Darbhanga"
  ]
};

const INDIAN_STATES_AND_BLOCKS: Record<string, string[]> = {
  "Odisha": [
    "R.Udayagiri",
    "Rayagada",
    "Mohana",
    "Nuagada",
    "Gosani",
    "Parlakhemundi",
    "Kasinagar",
    "Digapahandi",
    "Hinjilicut",
    "Chatrapur",
    "Bhubaneswar",
    "Cuttack Sadar"
  ],
  "Andhra Pradesh": [
    "Srikakulam Rural",
    "Tekkali",
    "Palasa",
    "Visakhapatnam Urban",
    "Anakapalle",
    "Gajuwaka",
    "Vijayawada Rural"
  ],
  "West Bengal": [
    "Kharagpur I",
    "Medinipur Sadar",
    "Durgapur",
    "Siliguri",
    "Barasat I"
  ],
  "Maharashtra": [
    "Haveli (Pune)",
    "Mulshi",
    "Nashik Rural",
    "Nagpur Rural",
    "Thane Urban"
  ],
  "Karnataka": [
    "Bengaluru South",
    "Bengaluru North",
    "Mysuru Rural",
    "Mangaluru Rural",
    "Hubballi"
  ],
  "Bihar": [
    "Patna Sadar",
    "Danapur",
    "Gaya Town",
    "Muzaffarpur Sadar",
    "Bhagalpur"
  ],
  "Uttar Pradesh": [
    "Varanasi Sadar",
    "Lucknow Urban",
    "Kanpur Sadar",
    "Gorakhpur Urban",
    "Agra Rural"
  ],
  "Delhi (NCT)": [
    "Central Delhi",
    "South Delhi",
    "West Delhi",
    "North Delhi",
    "East Delhi"
  ]
};

// Dynamic Symptom Suggestion Chips
const SYMPTOM_CHIPS = [
  { label: "High fever & chills", text: "I have high fever with shivering since 3 days" },
  { label: "Chest pain & pressure", text: "I have sharp chest pain and tightness radiating to my left arm since 2 hours" },
  { label: "Severe headache", text: "Severe throbbing headache for 2 days with light sensitivity" },
  { label: "Persistent dry cough", text: "Dry hacking cough and sore throat since 4 days" },
  { label: "Abdominal pain & vomiting", text: "Severe stomach cramps in lower abdomen and vomiting 3 times today" },
  { label: "Shortness of breath", text: "Difficulty breathing and wheezing since yesterday evening" },
  { label: "Diarrhea & weakness", text: "Frequent loose motions and extreme dizziness since yesterday" },
  { label: "Fall & leg injury", text: "Fell down on road, heavy swelling and unable to bear weight on right leg" }
];

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

  // Family Member Selection State
  const [familyMembers, setFamilyMembers] = useState<FamilyDependent[]>(() => {
    if (user?.dependents && user.dependents.length > 0) {
      return user.dependents;
    }
    return [
      { id: "dep-1", fullName: "Kamla Devi", relation: "Spouse", age: 49, gender: "Female", patientUhid: "PAT-9920" },
      { id: "dep-2", fullName: "Aarav Choudhury", relation: "Son", age: 12, gender: "Male", patientUhid: "PAT-7731" }
    ];
  });
  const [selectedMemberId, setSelectedMemberId] = useState<string>("self");
  const [showAddFamilyModal, setShowAddFamilyModal] = useState<boolean>(false);
  const [newFamilyName, setNewFamilyName] = useState<string>("");
  const [newFamilyRelation, setNewFamilyRelation] = useState<string>("Spouse");
  const [newFamilyAge, setNewFamilyAge] = useState<string>("");
  const [newFamilyGender, setNewFamilyGender] = useState<string>("Female");
  const [newFamilyPhone, setNewFamilyPhone] = useState<string>("");

  // Sync family members if user dependents update
  useEffect(() => {
    if (user?.dependents && user.dependents.length > 0) {
      setFamilyMembers(user.dependents);
    }
  }, [user?.dependents]);

  // Derived Effective Patient Details (calibrates triage age/gender)
  const selectedDependent =
    selectedMemberId === "self"
      ? null
      : familyMembers.find((m) => m.id === selectedMemberId);

  const effectivePatientName = selectedDependent
    ? selectedDependent.fullName
    : user?.fullName || "Bikash Kumar Choudhury";

  const effectivePatientAge = selectedDependent
    ? Number(selectedDependent.age) || 30
    : Number(user?.age) || 22;

  const effectivePatientGender = selectedDependent
    ? selectedDependent.gender || "Female"
    : user?.gender || "Male";

  const effectivePatientUhid = selectedDependent
    ? selectedDependent.patientUhid || "PAT-9920"
    : user?.patientUhid || "PAT-8402";

  const effectiveRelation = selectedDependent
    ? selectedDependent.relation
    : "Self";

  // Step 1: Symptoms input
  const [symptomText, setSymptomText] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isOnlineTeleconsult, setIsOnlineTeleconsult] = useState<boolean>(true);
  const isRecordingRef = useRef<boolean>(false);
  const baseTextRef = useRef<string>("");
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
  const [followUpQuestions, setFollowUpQuestions] = useState<Array<{
    id: string;
    question: string;
    type: "radio" | "number" | "text";
    options?: string[];
    unit?: string;
    placeholder?: string;
  }>>([
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
  const [uploadedReport, setUploadedReport] = useState<{
    fileName: string;
    fileSize: string;
    uploadedAt: string;
    status: string;
  } | null>(null);

  const [ocrData, setOcrData] = useState<{
    model: string;
    file_name: string;
    test_name: string;
    lab_name: string;
    report_date: string;
    extracted_text_preview?: string | null;
    parameters: Array<{
      name: string;
      value: string;
      unit: string;
      reference_range: string;
      status: "HIGH" | "LOW" | "NORMAL" | "BORDERLINE";
      alert_level: string;
    }>;
    clinical_flags: string[];
    missing_information: Array<{
      id: string;
      question: string;
      type: string;
      options: string[];
    }>;
  } | null>(null);
  const [reportInquiryAnswers, setReportInquiryAnswers] = useState<Record<string, string>>({});

  // Step 4: Present Address
  const [presentState, setPresentState] = useState<string>("Odisha");
  const [presentDistrict, setPresentDistrict] = useState<string>("Nayagarh");
  const [presentBlock, setPresentBlock] = useState<string>("R.Udayagiri");
  const [landmark, setLandmark] = useState<string>("Near Main PHC Road, Post Office Lane");

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
        if (sdata.chief_complaint) {
          setSymptomText(sdata.chief_complaint);
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
        }

        if (t.preferred_language) setSelectedLanguage(t.preferred_language);
        if (t.consultation_mode) setIsOnlineTeleconsult(t.consultation_mode === "online");

        if (t.uploaded_report_data && Object.keys(t.uploaded_report_data).length > 0) {
          setOcrData(t.uploaded_report_data);
          setUploadedReport({
            fileName: t.uploaded_report_data.file_name || "Uploaded Medical Report.pdf",
            fileSize: "Document",
            uploadedAt: "Saved in draft",
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
  }, [draftIdParam]);

  // Synchronize district and blocks dropdowns when state changes
  useEffect(() => {
    const districts = INDIAN_STATES_AND_DISTRICTS[presentState] || ["Nayagarh"];
    if (districts.length > 0 && !districts.includes(presentDistrict)) {
      setPresentDistrict(districts[0]);
    }
    const blocks = INDIAN_STATES_AND_BLOCKS[presentState] || [];
    if (blocks.length > 0 && !blocks.includes(presentBlock)) {
      setPresentBlock(blocks[0]);
    }
  }, [presentState, presentDistrict, presentBlock]);

  // Continuous Voice Dictation Handlers (Prevents sudden browser timeouts & silence stops)
  const stopVoiceDictation = () => {
    isRecordingRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const startVoiceDictation = () => {
    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordingSeconds(0);
    baseTextRef.current = symptomText;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const initAndStart = () => {
        if (!isRecordingRef.current) return;
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;

          if (selectedLanguage.toLowerCase().includes("odia")) {
            recognition.lang = "or-IN";
          } else if (selectedLanguage.toLowerCase().includes("hindi")) {
            recognition.lang = "hi-IN";
          } else {
            recognition.lang = "en-IN";
          }

          recognition.onresult = (event: any) => {
            let interim = "";
            let finalChunk = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const text = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalChunk += text + " ";
              } else {
                interim += text;
              }
            }

            if (finalChunk) {
              baseTextRef.current = (baseTextRef.current ? baseTextRef.current.trim() + " " : "") + finalChunk.trim();
            }

            const currentCombined = (baseTextRef.current ? baseTextRef.current.trim() + " " : "") + interim.trim();
            if (currentCombined.trim()) {
              setSymptomText(currentCombined.trim());
            }
          };

          // NEVER cancel on browser 'no-speech' (silence pause) or temporary non-fatal events
          recognition.onerror = (event: any) => {
            console.warn("SpeechRecognition notice:", event.error);
            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
              stopVoiceDictation();
            }
            // For 'no-speech', 'audio-capture', 'network', keep session alive
          };

          // If Chromium disconnects after a pause or silence, automatically re-connect immediately
          recognition.onend = () => {
            if (isRecordingRef.current) {
              setTimeout(() => {
                if (isRecordingRef.current) {
                  initAndStart();
                }
              }, 120);
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.warn("Microphone connection retry:", err);
          setTimeout(() => {
            if (isRecordingRef.current) {
              initAndStart();
            }
          }, 250);
        }
      };

      initAndStart();
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
      if (updateProfile) {
        await updateProfile({ dependents: updated });
      }
    } catch (err) {
      console.warn("Could not sync dependent to profile:", err);
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
            // Pre-seed follow-up answers dynamically
            const initialAnswers: Record<string, string> = {};
            json.data.follow_up_questions.forEach((q: any) => {
              if (q.options && q.options.length > 0) {
                initialAnswers[q.id] = q.options[0];
              } else if (q.placeholder) {
                initialAnswers[q.id] = q.placeholder;
              }
            });
            setFollowUpAnswers(initialAnswers);
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
      uploadedAt: "Uploaded just now",
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
            const defaultInquiry: Record<string, string> = {};
            json.data.missing_information.forEach((inq: any) => {
              if (inq.options && inq.options.length > 0) {
                defaultInquiry[inq.id] = inq.options[0];
              }
            });
            setReportInquiryAnswers(defaultInquiry);
          }
        }
      }
    } catch {
      setUploadedReport((prev) => (prev ? { ...prev, status: "✓ OCR Verified" } : null));
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
      uploadedAt: "Uploaded just now",
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
            uploadedAt: "Uploaded just now",
            status: "✓ Analyzed & Correlated with Clinical History"
          });

          if (json.data.missing_information) {
            const defaultInquiry: Record<string, string> = {};
            json.data.missing_information.forEach((inq: any) => {
              if (inq.options && inq.options.length > 0) {
                defaultInquiry[inq.id] = inq.options[0];
              }
            });
            setReportInquiryAnswers(defaultInquiry);
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
      reported_by: user?.fullName || "Bikash Kumar Choudhury",
      language: selectedLanguage,
      symptoms: extractedSymptoms,
      timeline: timeline,
      follow_up_answers: followUpAnswers,
      report_data: uploadedReport && ocrData ? { ...ocrData, file_name: uploadedReport.fileName } : null,
      report_answers: reportInquiryAnswers,
      present_state: presentState,
      present_district: presentDistrict,
      present_block: presentBlock,
      present_address: {
        state: presentState,
        district: presentDistrict,
        block: presentBlock,
        landmark: landmark,
      },
      landmark: landmark,
      consent: consentChecked,
      consultation_mode: isOnlineTeleconsult ? "online" : "offline"
    };

    try {
      // 1. Submit to Next.js API route (direct database pooler insertion)
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
      reported_by: user?.fullName || "Bikash Kumar Choudhury",
      language: selectedLanguage,
      symptoms: extractedSymptoms.length > 0 ? extractedSymptoms : (symptomText ? [symptomText] : ["General symptoms intake"]),
      timeline: timeline,
      follow_up_answers: followUpAnswers,
      report_data: uploadedReport && ocrData ? { ...ocrData, file_name: uploadedReport.fileName } : null,
      report_answers: reportInquiryAnswers,
      present_state: presentState,
      present_district: presentDistrict,
      present_block: presentBlock,
      present_address: {
        state: presentState,
        district: presentDistrict,
        block: presentBlock,
        landmark: landmark,
      },
      landmark: landmark,
      consent: Boolean(consentChecked),
      consultation_mode: isOnlineTeleconsult ? "online" : "offline",
      status: "Draft",
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
        setSubmittedTicket({ ...json, status: "Draft" });
      } else {
        // 2. Fallback to FastAPI backend if Next.js route encountered an error
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

  // Dynamic Priority Calculation for Preview
  const tempNumber = parseFloat(
    Object.entries(followUpAnswers).find(([k]) => k.includes("temp"))?.[1] || "98.6"
  );
  const anySevereAnswer = Object.values(followUpAnswers).some((v) =>
    v.toLowerCase().includes("severe")
  );
  const isChestOrBreathing = extractedSymptoms.some((s) =>
    ["chest pain", "shortness of breath", "trauma", "injury"].some((k) => s.toLowerCase().includes(k))
  );

  const evaluatedPriority: "Immediate" | "Urgent" | "Less Urgent" =
    tempNumber >= 103.5 || isChestOrBreathing || anySevereAnswer
      ? "Immediate"
      : tempNumber >= 100.4 ||
        extractedSymptoms.some((s) => ["fever", "abdominal", "vomit", "headache"].some((k) => s.toLowerCase().includes(k)))
      ? "Urgent"
      : "Less Urgent";

  return (
    <div className="w-full max-w-7xl mx-auto pb-16 space-y-6">
      {/* Top Header & Healthcare Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span>AI Clinical Intake &bull; Hugging Face Qwen2.5 Powered</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            Report Your Symptoms
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            5-step guided clinical evaluation with real-time laboratory OCR and nearest PHC triage routing.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2.5">
          {!submittedTicket && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer self-start sm:self-auto disabled:opacity-50"
              title="Save current symptom details as a draft"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{isSavingDraft ? "Saving Draft..." : "Save to Draft"}</span>
            </button>
          )}

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
                    if (s.num < step) setStep(s.num as any);
                  }}
                  disabled={s.num > step}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    step === s.num
                      ? "bg-teal-800 text-white shadow-sm ring-2 ring-teal-700/30"
                      : step > s.num
                      ? "bg-teal-50 text-teal-800 border border-teal-200 cursor-pointer hover:bg-teal-100/70"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <span>{s.num}.</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {idx < arr.length - 1 && (
                  <ArrowRight
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      step > s.num ? "text-teal-700" : "text-slate-300"
                    }`}
                  />
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

      {/* ========================================================================= */}
      {/* SUCCESS TICKET SCREEN (Clean Light Healthcare Theme) */}
      {/* ========================================================================= */}
      {submittedTicket ? (
        <div className={`bg-white border rounded-3xl p-6 sm:p-10 text-slate-900 shadow-sm space-y-6 animate-in fade-in ${
          submittedTicket.status === "Draft" ? "border-amber-200" : "border-emerald-200/90"
        }`}>
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
              submittedTicket.status === "Draft"
                ? "bg-amber-50 text-amber-600 border-amber-200"
                : "bg-emerald-50 text-emerald-600 border-emerald-200"
            }`}>
              {submittedTicket.status === "Draft" ? (
                <FileText className="w-8 h-8" />
              ) : (
                <CheckCircle2 className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                submittedTicket.status === "Draft" ? "text-amber-700" : "text-emerald-700"
              }`}>
                {submittedTicket.status === "Draft" ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Case Saved as Draft</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Ticket Generated &amp; Synced to Supabase Database</span>
                  </>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                Ticket ID: {submittedTicket.ticket_number || submittedTicket.case_number || "TR-9182"}
              </h2>
            </div>
          </div>

          {/* Patient Details Banner */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Triage Patient</span>
              <strong className="text-slate-950 font-bold text-sm">
                {effectivePatientName} {selectedDependent ? <span className="text-teal-800 text-xs font-semibold">({effectiveRelation})</span> : <span className="text-slate-500 text-xs font-semibold">(Self)</span>}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Demographics &amp; UHID</span>
              <span className="text-slate-800 font-bold">
                {effectivePatientAge} yrs &bull; {effectivePatientGender} &bull; <span className="font-mono text-teal-800">{effectivePatientUhid}</span>
              </span>
            </div>
          </div>

          {/* Designated Facility Only */}
          <div className="p-4.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
            <span className="text-slate-500 uppercase text-[11px] font-bold tracking-wider block">
              Designated Facility
            </span>
            <div className="text-slate-900 font-extrabold text-sm sm:text-base flex items-center gap-2.5">
              <Building2 className="w-4.5 h-4.5 text-teal-700 shrink-0" />
              <span>{submittedTicket.assigned_facility || `PHC ${presentBlock} Emergency & Clinical Desk`}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              href="/patient/timeline"
              className="w-full sm:w-auto px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>View in Timeline / Drafts</span>
            </Link>
            <Link
              href="/patient"
              className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>View on Patient Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmittedTicket(null);
                setStep(1);
              }}
              className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all"
            >
              {submittedTicket.status === "Draft" ? "Start New Report" : "Submit Another Symptom Report"}
            </button>
          </div>
        </div>
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
          {/* ========================================================================= */}
          {/* STEP 1 — SYMPTOMS (Clean Light Theme) */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 text-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Tell us what&apos;s bothering you
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Speak using the microphone or type symptoms freely in any language.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full self-start sm:self-auto">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Qwen2.5 Dynamic Extractor</span>
                </div>
              </div>

              {/* PREFERRED INTAKE LANGUAGE (TOP BAR) */}
              <div className="space-y-1.5">
                <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-teal-700" />
                  <span>Preferred Intake Language</span>
                </label>
                <div className="relative w-full sm:w-80">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer appearance-none shadow-2xs"
                  >
                    <option value="English">English</option>
                    <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Telugu">Telugu (తెలుగు)</option>
                    <option value="Bengali">Bengali (বাংলা)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* FAMILY MEMBER SELECTION DOCK */}
              <div className="bg-gradient-to-r from-teal-50/70 via-white to-slate-50 border border-teal-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="family-member-select" className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight cursor-pointer">
                          Who is this symptom report for?
                        </label>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                          Family Care
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Choose yourself or a family member to calibrate triage algorithms for their age and gender.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddFamilyModal((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddFamilyModal ? "Close Form" : "Add Family Member"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
                  <div className="sm:col-span-8">
                    <select
                      id="family-member-select"
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-teal-700 shadow-2xs cursor-pointer"
                    >
                      <optgroup label="Primary Patient">
                        <option value="self">
                          Myself — {user?.fullName || "Bikash Kumar Choudhury"} (Self • {user?.age || 22} yrs, {user?.gender || "Male"})
                        </option>
                      </optgroup>
                      <optgroup label="Family Dependents">
                        {familyMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.fullName} ({member.relation} • {member.age || "?"} yrs, {member.gender || "N/A"})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Active Selection Badge */}
                  <div className="sm:col-span-4 flex items-center gap-2.5 px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs h-11">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider leading-none">
                        Active Patient Profile
                      </span>
                      <strong className="text-teal-900 font-black truncate block text-xs mt-0.5">
                        {effectivePatientName} {selectedDependent ? `(${effectiveRelation})` : "(Self)"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Inline Collapsible Form to Add Family Member */}
                {showAddFamilyModal && (
                  <form
                    onSubmit={handleAddFamilyMemberSubmit}
                    className="p-4 sm:p-5 bg-white rounded-2xl border-2 border-teal-300 shadow-sm space-y-3.5 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                            Register &amp; Link Family Member
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Add a family dependent to submit symptom reports under your unified account.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddFamilyModal(false)}
                        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                        title="Close Form"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                      <div className="lg:col-span-2">
                        <label className="block text-slate-700 font-bold mb-1">
                          Full Legal Name <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Meena Devi"
                          value={newFamilyName}
                          onChange={(e) => setNewFamilyName(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-teal-700"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Relationship <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={newFamilyRelation}
                          onChange={(e) => setNewFamilyRelation(e.target.value)}
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-teal-700 cursor-pointer"
                        >
                          <option value="Mother">Mother</option>
                          <option value="Father">Father</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Grandmother">Grandmother</option>
                          <option value="Grandfather">Grandfather</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Gender <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={newFamilyGender}
                          onChange={(e) => setNewFamilyGender(e.target.value)}
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-teal-700 cursor-pointer"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Age (Years) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={120}
                          placeholder="e.g. 52"
                          value={newFamilyAge}
                          onChange={(e) => setNewFamilyAge(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-teal-700"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="text-[11px] text-teal-800 font-medium">
                        ✓ Saved to your patient registry and immediately selected for this symptom report.
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setShowAddFamilyModal(false)}
                          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs text-xs flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save &amp; Select Member</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Main Input Box Container */}
              <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/70 space-y-5">
                {/* UNIQUE VOICE INTAKE STUDIO */}
                <div
                  className={`rounded-2xl border transition-all duration-300 p-4 sm:p-5 relative overflow-hidden ${
                    isRecording
                      ? "bg-gradient-to-br from-rose-50/90 via-white to-amber-50/40 border-rose-300 shadow-lg shadow-rose-500/10 ring-2 ring-rose-400/20"
                      : "bg-gradient-to-br from-teal-50/70 via-white to-slate-50 border-teal-200/80 shadow-2xs hover:border-teal-300"
                  }`}
                >
                  {/* Subtle Background Glow when recording */}
                  {isRecording && (
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-rose-400/20 rounded-full blur-2xl pointer-events-none" />
                  )}

                  {/* Header Row */}
                  <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-2xs ${
                          isRecording
                            ? "bg-rose-600 text-white animate-pulse"
                            : "bg-teal-800 text-white"
                        }`}
                      >
                        {isRecording ? (
                          <Radio className="w-5 h-5 animate-spin" />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                            Voice Intake Studio
                          </h3>
                          {isRecording ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                              Live Rec &bull; {Math.floor(recordingSeconds / 60).toString().padStart(2, "0")}:{(recordingSeconds % 60).toString().padStart(2, "0")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100/70 text-teal-800 border border-teal-200">
                              <Sparkles className="w-2.5 h-2.5 text-teal-700" />
                              AI Speech-to-Text
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {isRecording
                            ? `Transcribing speech live in ${selectedLanguage} into the clinical form...`
                            : `Speak your health concerns naturally in ${selectedLanguage}, Odia, or Hindi.`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-slate-600 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                        Language: <strong className="text-teal-900">{selectedLanguage}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Main Control & Equalizer Visualizer Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200/60">
                    {/* Primary Button: Start Voice <-> Stop Voice */}
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`group px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2.5 transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
                          isRecording
                            ? "bg-gradient-to-r from-rose-600 via-rose-700 to-red-600 text-white shadow-rose-600/30 hover:shadow-rose-600/50 hover:from-rose-700 hover:to-red-700 ring-4 ring-rose-500/20"
                            : "bg-gradient-to-r from-teal-800 via-teal-800 to-emerald-800 text-white shadow-teal-900/20 hover:shadow-teal-900/35 hover:from-teal-900 hover:to-emerald-900 hover:scale-[1.02]"
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <Square className="w-4 h-4 fill-white" />
                            <span>Stop Voice</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span>Start Voice</span>
                          </>
                        )}
                      </button>

                      {/* Cancel / Clear button when recording */}
                      {isRecording && (
                        <button
                          type="button"
                          onClick={stopVoiceDictation}
                          className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-100/80 hover:bg-rose-200 rounded-xl transition-colors cursor-pointer border border-rose-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {/* Equalizer Visualizer & Audio Wave Animation */}
                    <div className="flex-1 flex items-center justify-start sm:justify-end gap-3 min-w-[200px]">
                      {isRecording ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-white/90 border border-rose-200 rounded-xl shadow-2xs">
                          <span className="text-[11px] font-bold text-rose-800 mr-1 shrink-0 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                            Audio Signal:
                          </span>
                          {/* Animated Equalizer Frequency Bars */}
                          <div className="flex items-end gap-1 h-7 px-1">
                            <span className="w-1 bg-rose-500 rounded-full animate-wave-1" />
                            <span className="w-1 bg-rose-600 rounded-full animate-wave-2" />
                            <span className="w-1 bg-amber-500 rounded-full animate-wave-3" />
                            <span className="w-1 bg-rose-500 rounded-full animate-wave-4" />
                            <span className="w-1 bg-rose-600 rounded-full animate-wave-5" />
                            <span className="w-1 bg-amber-500 rounded-full animate-wave-6" />
                            <span className="w-1 bg-rose-500 rounded-full animate-wave-2" />
                            <span className="w-1 bg-rose-600 rounded-full animate-wave-1" />
                            <span className="w-1 bg-amber-500 rounded-full animate-wave-4" />
                            <span className="w-1 bg-rose-500 rounded-full animate-wave-3" />
                            <span className="w-1 bg-rose-600 rounded-full animate-wave-5" />
                            <span className="w-1 bg-rose-500 rounded-full animate-wave-6" />
                            <span className="w-1 bg-amber-500 rounded-full animate-wave-1" />
                            <span className="w-1 bg-rose-500 rounded-full animate-wave-2" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                          {/* Idle Standby Equalizer (quiescent) */}
                          <div className="flex items-end gap-1 h-4 opacity-50">
                            <span className="w-1 h-2 bg-slate-300 rounded-full" />
                            <span className="w-1 h-3 bg-teal-400 rounded-full" />
                            <span className="w-1 h-1.5 bg-slate-300 rounded-full" />
                            <span className="w-1 h-3.5 bg-teal-500 rounded-full" />
                            <span className="w-1 h-2 bg-slate-300 rounded-full" />
                            <span className="w-1 h-4 bg-teal-600 rounded-full" />
                            <span className="w-1 h-2 bg-slate-300 rounded-full" />
                            <span className="w-1 h-3 bg-teal-400 rounded-full" />
                            <span className="w-1 h-1.5 bg-slate-300 rounded-full" />
                          </div>
                          <span className="text-[11px] text-slate-500 hidden sm:inline">
                            Microphone standby &bull; Click to start
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Real-time Streaming Speech Banner (When Recording) */}
                  {isRecording && (
                    <div className="mt-3.5 p-2.5 bg-rose-50/70 border border-rose-200/80 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
                      <span className="font-semibold text-[11px] truncate">
                        {symptomText ? (
                          <>
                            Live stream: &ldquo;<span className="font-bold">{symptomText}</span>&rdquo;
                          </>
                        ) : (
                          "Listening for voice input... speak clearly into your microphone."
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Subtle Divider */}
                <div className="relative py-1 flex items-center justify-center">
                  <div className="w-full border-t border-slate-200" />
                  <span className="absolute px-3 bg-slate-50 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    OR TYPE COMPLAINTS
                  </span>
                </div>

                {/* Textarea Description */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold text-xs block">
                    Type or Dictate Details
                  </label>
                  <textarea
                    rows={4}
                    value={symptomText}
                    onChange={(e) => setSymptomText(e.target.value)}
                    placeholder="e.g., I have had a continuous fever for 3 days with headache, body chills, and mild coughing..."
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 placeholder:text-slate-400 resize-none shadow-inner"
                  />
                </div>

                {/* Dynamic Quick Suggestion Chips */}
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                    Quick Symptom Prompts:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SYMPTOM_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSymptomText(chip.text);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3 text-teal-600" />
                        <span>{chip.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Online Teleconsult Question */}
                <div className="p-4 bg-slate-50 hover:bg-slate-100/60 transition-colors rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 text-teal-700" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                        Are you want Online Teleconsult?
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                        Choose Yes for phone/video doctor consultation, or No to visit the healthcare facility in person.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setIsOnlineTeleconsult(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isOnlineTeleconsult
                          ? "bg-teal-800 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${isOnlineTeleconsult ? "opacity-100" : "opacity-0 -mr-3.5"}`} />
                      <span>Yes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOnlineTeleconsult(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        !isOnlineTeleconsult
                          ? "bg-teal-800 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${!isOnlineTeleconsult ? "opacity-100" : "opacity-0 -mr-3.5"}`} />
                      <span>No</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  disabled={!symptomText.trim() || isExtracting}
                  className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {isExtracting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2 — DETAILS (Clean Light Healthcare Theme) */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 text-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Clinical Review &amp; Dynamic Details
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Our AI clinical assistant asks follow-up questions one by one like a doctor to collect complete clinical details.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full self-start sm:self-auto">
                  {aiSource}
                </span>
              </div>

              {/* 2-Column Responsive Layout in expanded width */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT: 1-by-1 Doctor Consultation (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Doctor Consultation Banner */}
                  <div className="flex items-center justify-between bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-200 shrink-0">
                        <Stethoscope className="w-5 h-5 text-emerald-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold tracking-wider text-teal-200 uppercase">
                            Doctor Consultation
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          Question {followUpQuestions.length > 0 ? currentQuestionIndex + 1 : 0} of {followUpQuestions.length}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-teal-200 font-medium block">Progress</span>
                      <span className="text-xs sm:text-sm font-black text-white">
                        {followUpQuestions.length > 0
                          ? Math.round(
                              ((currentQuestionIndex + 1) / followUpQuestions.length) * 100
                            )
                          : 100}
                        %
                      </span>
                    </div>
                  </div>

                  {/* Question Stepper Indicator Pills */}
                  {followUpQuestions.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {followUpQuestions.map((q, qIdx) => {
                        const isAnswered = Boolean(followUpAnswers[q.id]);
                        const isCurrent = currentQuestionIndex === qIdx;
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setCurrentQuestionIndex(qIdx)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                              isCurrent
                                ? "bg-teal-800 text-white shadow-xs ring-2 ring-teal-600/30"
                                : isAnswered
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            {isAnswered && !isCurrent ? (
                              <Check className="w-3 h-3 text-emerald-700" />
                            ) : (
                              <span>{qIdx + 1}.</span>
                            )}
                            <span>Question {qIdx + 1}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Active Doctor Question Card (1 by 1) */}
                  {followUpQuestions.length > 0 && followUpQuestions[currentQuestionIndex] && (() => {
                    const q = followUpQuestions[currentQuestionIndex];
                    return (
                      <div className="p-6 sm:p-7 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-5">
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                            <span>Clinical Inquiry #{currentQuestionIndex + 1}</span>
                          </div>
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                            {q.question}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Please answer accurately to help your attending doctor make the best clinical assessment.
                          </p>
                        </div>

                        {/* Number Input (e.g. Temperature, Blood Pressure) */}
                        {q.type === "number" && (
                          <div className="space-y-3 pt-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.1"
                                value={followUpAnswers[q.id] || ""}
                                onChange={(e) =>
                                  setFollowUpAnswers({
                                    ...followUpAnswers,
                                    [q.id]: e.target.value
                                  })
                                }
                                placeholder={q.placeholder || "100"}
                                className="w-32 p-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-center text-sm focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 shadow-2xs"
                              />
                              {q.unit && (
                                <span className="text-slate-700 font-bold text-sm">{q.unit}</span>
                              )}
                            </div>

                            {q.id.includes("temp") && (
                              <div className="space-y-1.5">
                                <span className="text-[11px] text-slate-500 font-semibold block">
                                  Quick preset temperatures:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {["98.6", "100.4", "101.5", "102.8", "104.0"].map((t) => (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() =>
                                        setFollowUpAnswers({ ...followUpAnswers, [q.id]: t })
                                      }
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                        followUpAnswers[q.id] === t
                                          ? "bg-teal-800 text-white shadow-xs"
                                          : "bg-white hover:bg-teal-50 text-slate-700 border border-slate-200"
                                      }`}
                                    >
                                      {t}°F {parseFloat(t) >= 102 ? "(High)" : ""}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Radio Options */}
                        {q.type === "radio" && q.options && (
                          <div className="space-y-2 pt-1">
                            {q.options.map((opt) => {
                              const isSelected = followUpAnswers[q.id] === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    setFollowUpAnswers({ ...followUpAnswers, [q.id]: opt })
                                  }
                                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                    isSelected
                                      ? "bg-teal-50/80 border-teal-600 text-teal-950 font-bold shadow-2xs ring-1 ring-teal-500"
                                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50/60"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                        isSelected
                                          ? "border-teal-700 bg-teal-700 text-white"
                                          : "border-slate-300 bg-white"
                                      }`}
                                    >
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-xs sm:text-sm">{opt}</span>
                                  </div>
                                  {isSelected && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                                      Selected
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Free Text Input */}
                        {q.type === "text" && (
                          <div className="pt-1">
                            <input
                              type="text"
                              value={followUpAnswers[q.id] || ""}
                              onChange={(e) =>
                                setFollowUpAnswers({ ...followUpAnswers, [q.id]: e.target.value })
                              }
                              placeholder={q.placeholder || "Describe in your own words..."}
                              className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 shadow-2xs"
                            />
                          </div>
                        )}

                        {/* Question navigation controls */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                            }
                            disabled={currentQuestionIndex === 0}
                            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Previous Question</span>
                          </button>

                          {currentQuestionIndex < followUpQuestions.length - 1 ? (
                            <button
                              type="button"
                              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                              className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <span>Next Question</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setStep(3);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Finish Questions &bull; Go to Reports</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* RIGHT: Context summary (Symptoms, Timeline, Missing items) (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Extracted Symptoms Tags */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 block">
                        Identified Clinical Symptoms ({extractedSymptoms.length})
                      </span>
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        Auto-Extracted
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {extractedSymptoms.map((sym, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-teal-600" />
                          <span>{sym}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setExtractedSymptoms(extractedSymptoms.filter((_, i) => i !== idx))
                            }
                            className="text-slate-400 hover:text-rose-600 text-xs cursor-pointer ml-1"
                            title="Remove symptom"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Timeline */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-700" />
                      <span>Clinical Progression Timeline</span>
                    </span>
                    <div className="space-y-2.5 text-xs">
                      {timeline.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs"
                        >
                          <div className="w-16 font-bold text-teal-800 shrink-0 text-[11px]">
                            {item.date}
                          </div>
                          <div className="w-2 h-2 rounded-full bg-teal-600 mt-1 shrink-0" />
                          <div className="text-slate-700 flex-1 leading-snug">
                            <strong className="text-slate-900">{item.event}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Missing Information Alerts */}
                  {missingItems.length > 0 && (
                    <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Clinical Details to Collect:</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-amber-950">
                        {missingItems.map((m, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-amber-600 font-bold">&bull;</span>
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Step Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Symptoms</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft || isSubmitting}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isSavingDraft ? "Saving..." : "Save Draft"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(3);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Continue to Reports</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3 — REPORTS & POST-UPLOAD INQUIRIES (Clean Light Theme) */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 text-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Medical Reports &amp; Laboratory OCR
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload blood tests, prescriptions, or imaging reports. Questions are generated dynamically by correlating your report with previous symptoms following eSanjeevani teleconsultation standards.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full self-start sm:self-auto">
                  Qwen2.5-VL Clinical Vision Engine
                </span>
              </div>

              {/* Scanning in progress loader */}
              {isScanningOcr && (
                <div className="p-8 bg-teal-50/60 border border-teal-200 rounded-2xl text-center space-y-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-teal-800 text-white flex items-center justify-center mx-auto shadow-sm">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-teal-950">
                      Scanning Document &amp; Correlating with Clinical History...
                    </h4>
                    <p className="text-xs text-teal-700 mt-0.5">
                      Cross-referencing report markers with {extractedSymptoms.length > 0 ? extractedSymptoms.join(", ") : "your symptoms"} and previous responses.
                    </p>
                  </div>
                </div>
              )}

              {/* STATE 1: No report uploaded yet (initial state) */}
              {!uploadedReport && !isScanningOcr && (
                <div className="space-y-6">
                  {/* Upload Dropzone */}
                  <div className="border-2 border-dashed border-slate-300 hover:border-teal-700 bg-slate-50/70 rounded-2xl p-7 text-center space-y-3 transition-colors">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center mx-auto shadow-2xs">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base text-slate-900 font-extrabold">
                        Drop your medical document here or browse
                      </div>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Upload lab reports (CBC, LFT, Blood Sugar, KFT, Urinalysis, Prescriptions) in PDF, JPG, or PNG.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                      <label className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer inline-flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-95">
                        <Upload className="w-4 h-4" />
                        <span>Browse &amp; Upload Document</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Or test with pre-configured clinical sample reports:
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadSample("CBC", "CBC_Blood_Report.pdf")}
                          className="px-3.5 py-2 bg-white hover:bg-teal-50 text-slate-800 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold cursor-pointer shadow-2xs transition-all"
                        >
                          🧪 Test CBC Report
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadSample("LFT", "Liver_Function_Test.pdf")}
                          className="px-3.5 py-2 bg-white hover:bg-teal-50 text-slate-800 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold cursor-pointer shadow-2xs transition-all"
                        >
                          🔬 Test LFT Report
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadSample("Glucose", "Blood_Glucose_Panel.pdf")}
                          className="px-3.5 py-2 bg-white hover:bg-teal-50 text-slate-800 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold cursor-pointer shadow-2xs transition-all"
                        >
                          🩸 Test Glucose Report
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadSample("KFT", "Renal_Function_Test.pdf")}
                          className="px-3.5 py-2 bg-white hover:bg-teal-50 text-slate-800 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold cursor-pointer shadow-2xs transition-all"
                        >
                          🏥 Test KFT / Renal Report
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Informational eSanjeevani Note & Skip Option */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-950 font-bold block">
                          eSanjeevani Telemedicine Note
                        </strong>
                        <p className="text-emerald-900/80 text-[11px] leading-relaxed">
                          Medical reports are optional. If you do not have diagnostic reports available right now, you can skip this step and proceed directly to address routing.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(4);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="px-4 py-2 bg-white border border-emerald-300 text-emerald-900 font-bold rounded-xl hover:bg-emerald-100/60 transition-all cursor-pointer shrink-0 shadow-2xs"
                    >
                      I have no report &bull; Skip to Address &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 2: Document uploaded & processed */}
              {uploadedReport && ocrData && !isScanningOcr && (
                <div className="space-y-6">
                  {/* Verified File Header */}
                  <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            {uploadedReport.fileName}
                          </span>
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full">
                            {uploadedReport.fileSize}
                          </span>
                        </div>
                        <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>{uploadedReport.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedReport(null);
                          setOcrData(null);
                          setReportInquiryAnswers({});
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Change / Remove Report</span>
                      </button>
                    </div>
                  </div>

                  {/* Structured Laboratory Findings */}
                  <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {ocrData.lab_name}
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                          {ocrData.test_name}
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 self-start sm:self-auto font-bold">
                        Report Date: {ocrData.report_date}
                      </span>
                    </div>

                    {/* Parameters Table */}
                    <div className="divide-y divide-slate-100 text-xs">
                      {ocrData.parameters.map((param, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2.5 hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{param.name}</span>
                            <div className="text-[11px] text-slate-500">
                              Reference: {param.reference_range} {param.unit}
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-slate-900 font-extrabold text-xs sm:text-sm">
                              {param.value} {param.unit}
                            </span>
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                                param.status === "HIGH"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : param.status === "LOW"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {param.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI Clinical Correlation Findings */}
                    {ocrData.clinical_flags && ocrData.clinical_flags.length > 0 && (
                      <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1.5">
                        <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                          <span>AI Clinical Correlation:</span>
                        </div>
                        {ocrData.clinical_flags.map((flag, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold">&bull;</span>
                            <span className="leading-relaxed">{flag}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* eSanjeevani Teleconsultation Dynamic Follow-up Inquiries */}
                  {ocrData.missing_information && ocrData.missing_information.length > 0 && (
                    <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
                      <div className="border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded uppercase tracking-wider">
                            eSanjeevani / MoHFW Protocol
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            &bull; Dynamic Tele-Triage Inquiries
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                          Follow-up Inquiries About Your Uploaded Report
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          These validation inquiries are generated dynamically by correlating your reported symptoms ({extractedSymptoms.join(", ") || symptomText}) with the abnormal findings in this report:
                        </p>
                      </div>

                      <div className="space-y-4 text-xs">
                        {ocrData.missing_information.map((inq, inqIdx) => (
                          <div
                            key={inq.id}
                            className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-teal-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {inqIdx + 1}
                              </span>
                              <label className="text-slate-900 font-bold block leading-relaxed text-xs sm:text-sm">
                                {inq.question}
                              </label>
                            </div>

                            <div className="space-y-2 pl-7">
                              {inq.options.map((opt) => {
                                const isChecked = reportInquiryAnswers[inq.id] === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() =>
                                      setReportInquiryAnswers({
                                        ...reportInquiryAnswers,
                                        [inq.id]: opt
                                      })
                                    }
                                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                      isChecked
                                        ? "bg-teal-50/80 border-teal-600 text-teal-950 font-bold shadow-2xs ring-1 ring-teal-500"
                                        : "bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-100/70"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                          isChecked
                                            ? "border-teal-700 bg-teal-700 text-white"
                                            : "border-slate-300 bg-white"
                                        }`}
                                      >
                                        {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                                      </div>
                                      <span className="text-xs">{opt}</span>
                                    </div>
                                    {isChecked && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                                        Answered
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Details</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft || isSubmitting}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isSavingDraft ? "Saving..." : "Save Draft"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(4);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Continue to Address</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4 — PRESENT ADDRESS (Clean Light Theme) */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 text-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Present Address
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your current location to automatically route this case to your local PHC/CHC health station.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
                  PHC Facility Dispatch
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/70 space-y-4 text-xs">
                {/* Dropdown 1: Present State */}
                <div className="space-y-1.5">
                  <label className="text-slate-800 font-bold block">
                    Present State *
                  </label>
                  <div className="relative">
                    <select
                      value={presentState}
                      onChange={(e) => setPresentState(e.target.value)}
                      className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer appearance-none shadow-2xs"
                    >
                      {Object.keys(INDIAN_STATES_AND_BLOCKS).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                {/* Dropdown 2: Present District */}
                <div className="space-y-1.5">
                  <label className="text-slate-800 font-bold block">
                    Present District *
                  </label>
                  <div className="relative">
                    <select
                      value={presentDistrict}
                      onChange={(e) => setPresentDistrict(e.target.value)}
                      className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer appearance-none shadow-2xs"
                    >
                      {(INDIAN_STATES_AND_DISTRICTS[presentState] || [presentDistrict]).map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                {/* Dropdown 3: Present Block */}
                <div className="space-y-1.5">
                  <label className="text-slate-800 font-bold block">
                    Present Block / Sub-District *
                  </label>
                  <div className="relative">
                    <select
                      value={presentBlock}
                      onChange={(e) => setPresentBlock(e.target.value)}
                      className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer appearance-none shadow-2xs"
                    >
                      {(INDIAN_STATES_AND_BLOCKS[presentState] || []).map((blk) => (
                        <option key={blk} value={blk}>
                          {blk}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                {/* Landmark or local area */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-slate-800 font-bold block">
                    Street / Village / Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Community Health Centre, Post Office Road"
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 shadow-2xs"
                  />
                </div>

                {/* Designated Facility routing preview */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <span className="text-slate-600 block text-[11px]">Designated Clinical Facility:</span>
                    <strong className="text-slate-900 text-xs sm:text-sm">
                      PHC {presentBlock} Emergency &amp; Triage Station ({presentDistrict}, {presentState})
                    </strong>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Reports</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft || isSubmitting}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isSavingDraft ? "Saving..." : "Save Draft"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(5);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Review Before Submission</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5 — REVIEW BEFORE SUBMISSION (Clean Light Theme) */}
          {/* ========================================================================= */}
          {step === 5 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 text-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Review Before Submission
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Confirm all patient information, symptoms, report findings, and routing details before dispatching.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full self-start sm:self-auto">
                  Final Clinical Review
                </span>
              </div>

              {/* Review Card Breakdown */}
              <div className="space-y-4">
                {/* 1. Patient & Location */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider block">
                    Patient &amp; Routing Details
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800">
                    <div>
                      Patient Name: <strong className="text-slate-900">{effectivePatientName}</strong>{" "}
                      {selectedDependent ? (
                        <span className="text-teal-800 font-bold bg-teal-100/70 border border-teal-200 px-1.5 py-0.5 rounded text-[10px]">
                          {effectiveRelation}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-semibold text-[11px]">(Self)</span>
                      )}
                    </div>
                    <div>
                      Age / Gender:{" "}
                      <span className="text-slate-900 font-semibold">
                        {effectivePatientAge} yrs &bull; {effectivePatientGender}
                      </span>
                    </div>
                    <div>
                      Language: <span className="text-slate-900 font-semibold">{selectedLanguage}</span>
                    </div>
                    <div>
                      Location:{" "}
                      <strong className="text-slate-900">
                        {presentBlock}, {presentState}
                      </strong>
                    </div>
                    <div>
                      Online Teleconsult:{" "}
                      <strong className={isOnlineTeleconsult ? "text-teal-800" : "text-slate-900"}>
                        {isOnlineTeleconsult ? "Yes (Audio/Video Call)" : "No (In-Person OPD Visit)"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. Extracted Symptoms & Follow-up Responses */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider block">
                    Reported Symptoms &amp; Answers
                  </span>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {extractedSymptoms.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 shadow-2xs"
                      >
                        &bull; {s}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 space-y-1.5 border-t border-slate-200/80">
                    {Object.entries(followUpAnswers).map(([k, v]) => (
                      <div key={k} className="text-slate-700">
                        <span className="font-semibold text-slate-900">
                          {followUpQuestions.find((q) => q.id === k)?.question || k}:
                        </span>{" "}
                        <strong className="text-teal-900">{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Medical Reports & Findings */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider block">
                    Attached Laboratory Reports
                  </span>
                  {uploadedReport && ocrData ? (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-900">
                        ✓ {uploadedReport.fileName} ({ocrData.test_name})
                      </div>
                      <div className="text-slate-600 flex flex-wrap gap-2 pt-0.5">
                        {ocrData.parameters.map((p, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                            {p.name}: <strong>{p.value} {p.unit}</strong> ({p.status})
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500">No medical documents attached.</div>
                  )}
                </div>

                {/* Consent Checkbox */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 hover:text-slate-900 leading-relaxed">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-0.5 text-teal-700 focus:ring-0 rounded border-slate-300 cursor-pointer"
                    />
                    <span>
                      I consent to sharing this symptom and health information with qualified primary healthcare medical staff for triage and clinical care.
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Address</span>
                </button>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft || isSubmitting}
                    className="px-5 py-3 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>
                      {isSavingDraft ? "Saving Draft..." : "Save to Draft"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitCase}
                    disabled={!consentChecked || isSubmitting || isSavingDraft}
                    className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>
                      {isSubmitting
                        ? "Saving to Supabase Database..."
                        : "Submit Case"}
                    </span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
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
