"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentLoadingProps {
  onComplete: () => void;
}

const loadingSteps = [
  "Initializing Agent",
  "Setting up personas", 
  "Getting real-time demographics",
  "Connecting to neural networks",
  "Calibrating behavioral models",
  "Ready to simulate"
];

export function AgentLoading({ onComplete }: AgentLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const totalDuration = 4000; // 4 seconds total
    const stepDuration = totalDuration / loadingSteps.length;
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (totalDuration / 50)); // Update every 50ms
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(onComplete, 500); // Fade out duration
          }, 200);
          return 100;
        }
        return newProgress;
      });
    }, 50);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        const nextStep = prev + 1;
        if (nextStep >= loadingSteps.length) {
          clearInterval(stepInterval);
          return prev;
        }
        return nextStep;
      });
    }, stepDuration);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [onComplete]);

  // Generate progress bars (similar to the image you showed)
  const totalBars = 32;
  const filledBars = Math.floor((progress / 100) * totalBars);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-black flex items-center justify-center z-50"
        >
          <div className="w-full max-w-md mx-auto px-8">
            {/* Header */}
            <div className="mb-8 text-left">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-white/60 text-xs font-mono">The</span>
                <span className="text-white/60 text-xs font-mono">Correct Way</span>
                <span className="text-white/60 text-xs font-mono">To Launch</span>
              </div>
              <h1 className="text-white text-2xl font-mono mb-2">MarketLens</h1>
            </div>

            {/* Loading Text */}
            <div className="mb-6">
              <motion.p 
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-white/80 text-sm font-mono mb-2"
              >
                {loadingSteps[currentStep]}
              </motion.p>
            </div>

            {/* Progress Percentage */}
            <div className="mb-4 flex items-center gap-4">
              <motion.span 
                className="text-white text-4xl font-mono"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {Math.floor(progress)}%
              </motion.span>
              <div className="flex items-center gap-1">
                <span className="text-white/40 text-xs font-mono">↗</span>
                <span className="text-white/40 text-xs font-mono">
                  {progress < 100 ? `${Math.floor(progress * 0.14)}%` : '14%'}
                </span>
                <span className="text-white/60 text-xs font-mono ml-2">
                  since you last checked
                </span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="flex gap-1 mb-4">
              {Array.from({ length: totalBars }, (_, i) => (
                <motion.div
                  key={i}
                  className={`h-8 flex-1 ${
                    i < filledBars 
                      ? 'bg-white' 
                      : 'bg-white/20'
                  }`}
                  initial={{ scaleY: 0 }}
                  animate={{ 
                    scaleY: 1,
                    backgroundColor: i < filledBars ? '#ffffff' : 'rgba(255, 255, 255, 0.2)'
                  }}
                  transition={{ 
                    delay: i * 0.02,
                    duration: 0.3,
                    backgroundColor: { duration: 0.2 }
                  }}
                  style={{ originY: 1 }}
                />
              ))}
            </div>

            {/* Bottom indicator */}
            <div className="flex justify-center">
              <div className="w-8 h-1 bg-white/40 rounded-full" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
