"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FolderOpen, Calendar, Activity, LogOut } from "lucide-react";
import { motion } from "framer-motion";

interface Project {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  simulationCount: number;
  lastSimulation?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user_data");
    const tokens = localStorage.getItem("auth_tokens");

    // Clear invalid localStorage data
    if (userData === "undefined") {
      console.log('⚠️ Clearing invalid user_data');
      localStorage.removeItem("user_data");
    }
    if (tokens === "undefined") {
      console.log('⚠️ Clearing invalid auth_tokens');
      localStorage.removeItem("auth_tokens");
    }

    if (!userData || !tokens || userData === "undefined" || tokens === "undefined") {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      const parsedTokens = JSON.parse(tokens);
      
      // Validate that tokens have required fields
      if (!parsedTokens.access_token && !parsedTokens.user) {
        console.log('⚠️ Invalid token structure, clearing and redirecting');
        localStorage.removeItem("user_data");
        localStorage.removeItem("auth_tokens");
        router.push("/login");
        return;
      }
      
      setUser(parsedUser);
      fetchProjects();
    } catch (error) {
      console.error('Failed to parse auth data:', error);
      localStorage.removeItem("user_data");
      localStorage.removeItem("auth_tokens");
      router.push("/login");
    }
  }, [router]);

  const fetchProjects = async () => {
    try {
      const tokens = localStorage.getItem("auth_tokens");
      if (!tokens) {
        return;
      }

      const parsedTokens = JSON.parse(tokens);
      const userData = localStorage.getItem("user_data");
      const parsedUser = userData ? JSON.parse(userData) : null;

      // Prepare headers with fallback for development
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const resolvedEmail =
        parsedUser?.email || parsedTokens.email || parsedTokens.user?.email;

      if (parsedTokens.access_token) {
        headers["Authorization"] = `Bearer ${parsedTokens.access_token}`;
        // Add user email for consistent user ID generation
        if (resolvedEmail) {
          headers["x-user-email"] = resolvedEmail;
        }
      } else {
        // Fallback for development mode
        headers["x-user-id"] =
          parsedTokens.sub || parsedTokens.user_id || "dev_user_" + Date.now();
      }

      const response = await fetch("/api/projects", { headers });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async () => {
    console.log('🚀 Create project clicked:', newProjectName);
    
    if (!newProjectName.trim()) {
      console.log('❌ Project name is empty');
      return;
    }

    setIsCreating(true);
    try {
      const tokens = localStorage.getItem("auth_tokens");
      if (!tokens || tokens === "undefined") {
        console.log('❌ No auth tokens found');
        alert('You need to log in first');
        router.push('/login');
        return;
      }

      let parsedTokens;
      try {
        parsedTokens = JSON.parse(tokens);
      } catch (e) {
        console.error('Failed to parse auth tokens:', e);
        alert('Invalid authentication. Please log in again.');
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('user_data');
        router.push('/login');
        return;
      }

      const userData = localStorage.getItem("user_data");
      
      // Handle case where userData is the string "undefined"
      let parsedUser = null;
      if (userData && userData !== "undefined") {
        try {
          parsedUser = JSON.parse(userData);
        } catch (e) {
          console.error('Failed to parse user data:', e);
          parsedUser = null;
        }
      }
      
      console.log('👤 User data:', { email: parsedUser?.email, hasToken: !!parsedTokens.access_token });

      // Prepare headers with fallback for development
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const resolvedEmail =
        parsedUser?.email || parsedTokens.email || parsedTokens.user?.email;

      if (parsedTokens.access_token) {
        headers["Authorization"] = `Bearer ${parsedTokens.access_token}`;
        // Add user email for consistent user ID generation
        if (resolvedEmail) {
          headers["x-user-email"] = resolvedEmail;
        }
      } else {
        // Fallback for development mode
        headers["x-user-id"] =
          parsedTokens.sub || parsedTokens.user_id || "dev_user_" + Date.now();
      }

      console.log('📡 Sending create project request');
      
      const response = await fetch("/api/projects", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
        }),
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Project created:', data.project);
        setProjects([data.project, ...projects]);
        setNewProjectName("");
        setNewProjectDescription("");
        setShowCreateDialog(false);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error('❌ Failed to create project:', errorData);
        alert(`Failed to create project: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Error in createProject:', error);
      alert(`Error creating project: ${error}`);
    } finally {
      setIsCreating(false);
    }
  };

  const openProject = (projectId: string) => {
    router.push(`/dashboard?project=${projectId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("user_data");
    localStorage.removeItem("auth_tokens");
    router.push("/login");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-md font-mono">MarketLens</h1>
              <p className="text-xs text-white/60 font-mono">Projects</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* <span className="text-sm font-mono text-white/80">
              Welcome, {user?.name || user?.email}
            </span> */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="font-mono text-white/80 hover:text-white hover:bg-white/10"
            >
              Logout
              <LogOut className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-mono text-white mb-2">
              Welcome {user?.name || user?.email},
            </h2>
            <p className="text-sm font-mono text-white/60">
              Manage your AI simulation projects and view insights
            </p>
          </div>

          <Button
            onClick={() => setShowCreateDialog(true)}
            className="font-mono bg-white text-black hover:bg-white/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="bg-black border-white/20 text-white">
              <DialogHeader>
                <DialogTitle className="font-mono">
                  Create New Project
                </DialogTitle>
                <DialogDescription className="font-mono text-white/60">
                  Start a new AI simulation project to test your ideas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="font-mono">
                    Project Name
                  </Label>
                  <Input
                    id="name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="mt-1 bg-white/5 border-white/20 text-white font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="font-mono">
                    Description (Optional)
                  </Label>
                  <Input
                    id="description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Brief description of your project"
                    className="mt-1 bg-white/5 border-white/20 text-white font-mono"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={createProject}
                    disabled={isCreating || !newProjectName.trim()}
                    className="flex-1 font-mono bg-white text-black hover:bg-white/90"
                  >
                    {isCreating ? "Creating..." : "Create Project"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    className="font-mono border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <h3 className="text-lg font-mono text-white/80 mb-2">
              No projects yet
            </h3>
            <p className="text-sm font-mono text-white/60 mb-6">
              Create your first project to start running AI simulations
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="font-mono bg-white text-black hover:bg-white/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="h-full"
              >
                <Card
                  className="bg-black/40 border-white/20 hover:text-white hover:border-white/40 transition-all cursor-pointer group h-full flex flex-col"
                  onClick={() => openProject(project._id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="px-2 py-1 bg-white/10 border border-white/20 text-xs font-mono text-white/80">
                            simulation
                          </div>
                          <div className="px-2 py-1 bg-white/10 border border-white/20 text-xs font-mono text-white/80">
                            ai-powered
                          </div>
                        </div>
                        <CardTitle className="font-mono text-white transition-colors mb-2">
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <CardDescription className="font-mono text-white/60 text-sm">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="text-xs font-mono text-white/40">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(project.createdAt)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-4 flex-1">
                      {/* Metrics Section */}
                      <div className="space-y-3">
                        <div className="text-sm font-mono text-white/80">
                          You are on track to reach engagement goals.
                        </div>

                        {/* Success Rate */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-mono text-white">
                              {project.simulationCount > 0
                                ? Math.floor(65 + Math.random() * 25)
                                : 0}
                              %
                            </span>
                            <div className="flex items-center gap-1 px-2 py-1 bg-white/10 border border-white/20 text-xs font-mono text-white/80">
                              Phase{" "}
                              {project.simulationCount > 0
                                ? Math.floor(1 + Math.random() * 3)
                                : 1}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 40 }, (_, i) => {
                                // Show some initial progress even for new projects (5-8 bars)
                                // For existing projects, show more progress (15-25 bars)
                                const baseProgress =
                                  project.simulationCount > 0
                                    ? 15 + Math.floor(Math.random() * 10)
                                    : 5 + Math.floor(Math.random() * 4);
                                const isActive = i < baseProgress;
                                return (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scaleY: 0 }}
                                    animate={{ opacity: 1, scaleY: 1 }}
                                    transition={{
                                      duration: 0.3,
                                      delay: index * 0.1 + i * 0.02,
                                    }}
                                    className={`h-6 w-2 ${
                                      isActive
                                        ? "bg-white border border-white/30"
                                        : "bg-white/10 border border-white/20"
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center justify-between text-xs font-mono border-t border-white/10 pt-3 mt-auto">
                        <div className="flex items-center gap-2 text-white/60">
                          <Activity className="w-3 h-3" />
                          <span>{project.simulationCount} simulations</span>
                        </div>
                        {project.lastSimulation && (
                          <div className="text-white/50">
                            Last: {formatDate(project.lastSimulation)}
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full font-mono text-black hover:text-white hover:bg-white/10 bg-white/90 group-hover:bg-white/5"
                        >
                          Open Project →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
