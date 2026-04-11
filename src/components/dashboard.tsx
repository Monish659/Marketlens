"use client";

import React from 'react';
import { SimulationDashboard } from "@/components/simulation-dashboard";

interface DashboardProps {
  user: any;
  projectId?: string;
}

export function Dashboard({ user, projectId }: DashboardProps) {
  // Use the new SimulationDashboard component for Phase 3
  return <SimulationDashboard user={user} projectId={projectId} />;
}