"use client";

import React from "react";
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
} from "lucide-react";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";

interface DoctorVideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCase: CaseDetails;
  callDuration: number;
  formatCallTime: (seconds: number) => string;
  isMicMuted: boolean;
  setIsMicMuted: (val: boolean) => void;
  isVideoMuted: boolean;
  setIsVideoMuted: (val: boolean) => void;
  onEndCall: () => void;
}

export function DoctorVideoCallModal({
  isOpen,
  onClose,
  selectedCase,
  callDuration,
  formatCallTime,
  isMicMuted,
  setIsMicMuted,
  isVideoMuted,
  setIsVideoMuted,
  onEndCall,
}: DoctorVideoCallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Clinical Teleconsultation &bull; {selectedCase.name}</span>
                <span className="px-2 py-0.5 text-[10px] rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
                  {formatCallTime(callDuration)}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Encrypted Teleconsultation Channel &bull; Patient ID: {selectedCase.patientId}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Screen Area */}
        <div className="relative bg-slate-950 flex-1 min-h-[340px] sm:min-h-[400px] flex items-center justify-center p-4">
          {/* Simulated Patient Video Stream */}
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col items-center justify-center overflow-hidden border border-slate-700/60 shadow-inner">
            {/* Telemetry HUD top left */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] space-y-0.5 z-10">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Video Connected ({selectedCase.language})</span>
              </div>
              <div className="text-slate-300 font-mono text-[9px]">
                SpO2: 98% &bull; Pulse: 78 bpm &bull; HD Video
              </div>
            </div>

            {/* Patient Avatar & Feed Simulation */}
            <div className="text-center space-y-3 z-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 mx-auto flex items-center justify-center text-white text-3xl font-black shadow-xl ring-4 ring-white/10">
                {selectedCase.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-100">{selectedCase.name}</div>
                <div className="text-xs text-slate-400 max-w-md mx-auto px-4">
                  &ldquo;{selectedCase.chiefComplaint}&rdquo;
                </div>
              </div>
            </div>

            {/* Doctor Picture-in-Picture (PiP) bottom right */}
            <div className="absolute bottom-3 right-3 w-28 h-20 sm:w-36 sm:h-24 bg-slate-800/90 rounded-xl border-2 border-slate-600 overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center p-1 z-10 backdrop-blur-xs">
              {isVideoMuted ? (
                <VideoOff className="w-5 h-5 text-slate-400" />
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center mb-0.5">
                    Dr
                  </div>
                  <span className="text-[9px] font-bold text-slate-200">Dr. Kavita Verma</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Video Call Controls Toolbar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            Live clinical channel encrypted &bull; Speak clearly into your microphone
          </div>

          <div className="flex items-center gap-3 mx-auto sm:mx-0">
            {/* Mic Mute Toggle */}
            <button
              type="button"
              onClick={() => setIsMicMuted(!isMicMuted)}
              className={`p-3 rounded-full transition-colors cursor-pointer ${
                isMicMuted ? "bg-rose-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
              title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera Toggle */}
            <button
              type="button"
              onClick={() => setIsVideoMuted(!isVideoMuted)}
              className={`p-3 rounded-full transition-colors cursor-pointer ${
                isVideoMuted ? "bg-rose-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
              title={isVideoMuted ? "Turn On Camera" : "Turn Off Camera"}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={onEndCall}
              className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Consultation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
