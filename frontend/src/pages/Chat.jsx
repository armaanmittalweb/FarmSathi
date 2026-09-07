import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Send, Mic, AlertCircle } from "lucide-react";
import { sendAudioMessage, sendTextMessage, resolveAudioUrl } from "../api/chat";
import VoiceRecorder from "../components/VoiceRecorder";
import Logo from "../components/Logo";

const SUGGESTION_KEYS = ["s1", "s2", "s3"];

export default function Chat() {
  const { t, i18n } = useTranslation();
  const farmer = useSelector((s) => s.auth.farmer);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const appendMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const sendText = async (text) => {
    if (!text.trim()) return;
    appendMessage({ role: "user", text });
    setInput("");
    setLoading(true);
    try {
      const data = await sendTextMessage(text, i18n.language, farmer?.id);
      appendMessage({ role: "assistant", text: data.reply });
    } catch (err) {
      appendMessage({ role: "assistant", text: err.response?.data?.error || "Something went wrong.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRecorded = async (blob) => {
    appendMessage({ role: "user", isVoice: true });
    setLoading(true);
    try {
      const data = await sendAudioMessage(blob, i18n.language, farmer?.id);
      appendMessage({ role: "assistant", text: data.reply, audioUrl: resolveAudioUrl(data.audio_url) });
    } catch (err) {
      appendMessage({ role: "assistant", text: err.response?.data?.error || "Something went wrong.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-2xl flex-col px-4 py-4 md:h-[calc(100vh-73px)]">
      <div className="flex-1 space-y-3 overflow-y-auto py-2">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <Logo withWordmark={false} className="opacity-90 [&_svg]:h-12 [&_svg]:w-12" />
            <div>
              <p className="text-lg font-semibold text-sand-800">{t("chat.emptyTitle")}</p>
              <p className="mt-1 text-sm text-sand-500">{t("chat.emptySubtitle")}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTION_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => sendText(t(`chat.${key}`))}
                  className="rounded-full border border-sand-200 bg-white px-3.5 py-1.5 text-sm text-sand-700 transition-colors hover:border-moss-300 hover:bg-moss-50 hover:text-moss-700"
                >
                  {t(`chat.${key}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 text-[0.95rem] leading-relaxed ${
                msg.role === "user"
                  ? "rounded-2xl rounded-br-md bg-moss-600 text-white"
                  : msg.isError
                    ? "rounded-2xl rounded-bl-md bg-error/10 text-error"
                    : "rounded-2xl rounded-bl-md bg-white text-sand-900 shadow-soft"
              }`}
            >
              {msg.isVoice ? (
                <Mic size={16} className="text-white/90" />
              ) : (
                <p className="flex items-start gap-1.5">
                  {msg.isError && <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                  {msg.text}
                </p>
              )}
              {msg.audioUrl && (
                <audio controls src={msg.audioUrl} className="mt-2 w-full">
                  Your browser does not support audio playback.
                </audio>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-soft">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-moss-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-moss-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-moss-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendText(input);
        }}
        className="mt-2 flex items-center gap-2 rounded-full border border-sand-200 bg-white p-1.5 shadow-soft"
      >
        <VoiceRecorder onRecorded={handleRecorded} disabled={loading} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chat.placeholder")}
          className="flex-1 bg-transparent px-1 py-2 text-[0.95rem] text-sand-900 placeholder:text-sand-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label={t("chat.send")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-moss-600 text-white transition-colors hover:bg-moss-700 disabled:bg-sand-200 disabled:text-sand-400"
        >
          <Send size={18} strokeWidth={2.25} />
        </button>
      </form>
    </div>
  );
}
