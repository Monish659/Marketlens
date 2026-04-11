"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Lock } from "lucide-react";
import { secureFetch } from "@/lib/secure-fetch";

type ReactionLike = {
  attention?: "full" | "partial" | "ignore";
  reason?: string;
  comment?: string;
  persona?: {
    name?: string;
    title?: string;
    user_metadata?: {
      name?: string;
      title?: string;
    };
  };
};

type ExplainChatbotProps = {
  idea: string;
  reactions: ReactionLike[];
};

type Message = {
  role: "assistant" | "user";
  content: string;
};

const starterQuestions = [
  "Why did personas reject this?",
  "What patterns were detected?",
  "How can I improve this idea?",
];

export function ExplainChatbot({ idea, reactions }: ExplainChatbotProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I can explain this simulation using only your session evidence. Ask about rejections, patterns, or improvements.",
    },
  ]);

  const sentiment = useMemo(() => {
    const full = reactions.filter((r) => r.attention === "full").length;
    const partial = reactions.filter((r) => r.attention === "partial").length;
    const ignore = reactions.filter((r) => r.attention === "ignore").length;
    const total = reactions.length;
    return { full, partial, ignore, total };
  }, [reactions]);

  const objectionPool = useMemo(() => {
    return reactions
      .filter((r) => r.attention !== "full")
      .map((r) => r.comment || r.reason || "")
      .filter(Boolean)
      .slice(0, 20);
  }, [reactions]);

  const personaResponses = useMemo(() => {
    return reactions.slice(0, 40).map((r) => {
      const persona = r.persona?.user_metadata || r.persona || {};
      return {
        name: persona.name || "Persona",
        title: persona.title || "Professional",
        attention: r.attention || "partial",
        reason: r.reason || "",
        comment: r.comment || "",
      };
    });
  }, [reactions]);

  const ask = async (question: string) => {
    const cleaned = question.trim();
    if (!cleaned || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: cleaned }]);
    setInput("");
    setLoading(true);

    try {
      const response = await secureFetch("/api/chat/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: cleaned,
          sessionContext: {
            idea,
            sentimentDistribution: sentiment,
            topObjections: objectionPool,
            personaResponses,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to explain results");
      }

      const answer = String(data.answer || "No answer generated.");
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error?.message ||
            "I could not explain this run right now. Please retry in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full border border-white/25 bg-black/70 backdrop-blur-xl flex items-center justify-center shadow-[0_0_22px_rgba(255,255,255,0.15)] hover:bg-black/90"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        <MessageCircle className="h-5 w-5 text-white" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] border border-white/20 bg-black/70 backdrop-blur-2xl rounded-xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/15 flex items-center justify-between">
              <div className="text-xs font-mono text-white/85 uppercase tracking-wide">
                Explainable Assistant
              </div>
              <div className="text-[10px] font-mono text-white/60 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Private Simulation
              </div>
            </div>

            <div className="p-3 h-72 overflow-y-auto space-y-2">
              {messages.map((m, idx) => (
                <motion.div
                  key={`${m.role}-${idx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16 }}
                  className={`rounded-lg px-3 py-2 text-xs leading-relaxed font-mono ${
                    m.role === "user"
                      ? "bg-white text-black ml-8"
                      : "bg-white/10 text-white mr-8 border border-white/15"
                  }`}
                >
                  {m.content}
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg px-3 py-2 text-xs font-mono bg-white/10 text-white/80 border border-white/15 mr-8"
                >
                  <div className="flex items-center gap-1">
                    <span>Thinking</span>
                    <motion.span
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      .
                    </motion.span>
                    <motion.span
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.15 }}
                    >
                      .
                    </motion.span>
                    <motion.span
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                    >
                      .
                    </motion.span>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="px-3 pb-2">
              <div className="flex flex-wrap gap-1 mb-2">
                {starterQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => ask(q)}
                    className="text-[10px] font-mono border border-white/20 bg-black/60 px-2 py-1 text-white/80 hover:text-white hover:bg-white/10"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void ask(input);
                }}
                className="flex items-center gap-2 pb-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask why, pattern, improve..."
                  className="w-full bg-black/70 border border-white/20 text-white text-xs font-mono px-3 py-2 outline-none focus:border-white/50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="h-9 w-9 flex items-center justify-center border border-white/20 bg-white text-black disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
