'use client';

import { Suspense } from 'react';
import VoiceAgent from '@/components/voice-agent';

function VoiceAgentContent() {
  return <VoiceAgent />;
}

export default function VoiceAgentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono">Loading...</div>
      </div>
    }>
      <VoiceAgentContent />
    </Suspense>
  );
}
