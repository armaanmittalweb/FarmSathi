import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, Square } from "lucide-react";

/**
 * Records mic audio with the browser's MediaRecorder API and hands the
 * finished Blob to onRecorded. No extra library needed for basic
 * record/playback (see ROADMAP.md phase 6).
 */
export default function VoiceRecorder({ onRecorded, disabled }) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        onRecorded(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access failed:", err);
      alert("Could not access the microphone. Check browser permissions.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={isRecording ? stopRecording : startRecording}
      aria-pressed={isRecording}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center disabled:opacity-50"
      title={isRecording ? t("chat.recording") : t("chat.record")}
    >
      {isRecording && <span className="absolute inset-0 animate-ping rounded-full bg-clay-400/60" />}
      <span
        className={`relative flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors ${
          isRecording ? "bg-clay-500" : "bg-moss-600 hover:bg-moss-700"
        }`}
      >
        {isRecording ? <Square size={17} fill="white" /> : <Mic size={19} strokeWidth={2.25} />}
      </span>
    </button>
  );
}
