"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";

type SimulationTimelineProps = {
  hasPrompt: boolean;
  hasFocusGroup: boolean;
  isRunning: boolean;
  hasResults: boolean;
};

const steps = [
  { id: "prompt", label: "Input" },
  { id: "focus", label: "Focus Group" },
  { id: "analysis", label: "Analysis" },
  { id: "results", label: "Results" },
] as const;

// Adapted from motion-main shared-layout and staggered reveal patterns.
export function SimulationTimeline({
  hasPrompt,
  hasFocusGroup,
  isRunning,
  hasResults,
}: SimulationTimelineProps) {
  const activeIndex = hasResults
    ? 3
    : isRunning
      ? 2
      : hasFocusGroup
        ? 1
        : hasPrompt
          ? 0
          : -1;

  return (
    <LayoutGroup>
      <div className="rounded-lg border border-white/15 bg-black/40 px-3 py-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {steps.map((step, index) => {
            const complete = index < activeIndex;
            const active = index === activeIndex;

            return (
              <motion.div key={step.id} layout className="flex min-w-fit items-center gap-2">
                <motion.div
                  layout
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-mono ${
                    complete || active
                      ? "border-white/80 bg-white text-black"
                      : "border-white/30 bg-black text-white/65"
                  }`}
                >
                  {index + 1}
                </motion.div>
                <div className="text-[11px] font-mono uppercase tracking-wide text-white/75">
                  {step.label}
                </div>
                {index < steps.length - 1 ? (
                  <motion.div
                    layout
                    className={`h-px w-10 ${complete ? "bg-white/80" : "bg-white/20"}`}
                  />
                ) : null}
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mt-2 text-[11px] font-mono text-white/60"
          >
            {activeIndex < 0
              ? "Enter an idea to begin simulation."
              : activeIndex === 0
                ? "Prompt captured. Build your focus group."
                : activeIndex === 1
                  ? "Focus group selected. Start analysis."
                  : activeIndex === 2
                    ? "Analyzing audience response in real time."
                    : "Analysis complete. Review objections and improve idea."}
          </motion.div>
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}

