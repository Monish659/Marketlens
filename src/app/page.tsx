"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useRef } from "react";
import { motion } from "framer-motion";
import { TextAnimate } from "@/components/magicui/text-animate";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/magicui/border-beam";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import PrismaticBurst from "@/components/prismatic-burst";
import DecryptedText from "@/components/decrypted-text";

import {
  Announcement,
  AnnouncementTag,
  AnnouncementTitle,
} from "@/components/ui/kibo-ui/announcement";
import { ArrowUpRightIcon, Globe, Megaphone, FileText } from "lucide-react";

// Square component for animated beam
const Circle = React.forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={`z-10 flex size-12 items-center justify-center border border-white/20 bg-black/60 p-3 ${className}`}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export default function Landing() {
  const router = useRouter();

  // Refs for animated beam
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Hero Section with GIF Background */}
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 z-[1] opacity-70">
          <PrismaticBurst
            animationType="rotate3d"
            intensity={1.6}
            speed={0.5}
            distort={0}
            paused={false}
            offset={{ x: 0, y: 0 }}
            hoverDampness={0.25}
            rayCount={0}
            mixBlendMode="lighten"
            colors={['#ff007a', '#4d3dff', '#ffffff']}
          />
        </div>
        <div
          className="absolute inset-0 z-[2] opacity-20"
          style={{
            backgroundImage: "url('/final.gif')",
            backgroundSize: "cover",
            backgroundPosition: "80% 50%",
            backgroundRepeat: "no-repeat",
            backgroundBlendMode: "screen",
          }}
        />
        <div className="absolute inset-0 z-[3] bg-black/45" />
        <nav className="relative z-10 flex items-center py-6 px-8 w-full mx-auto bg-black/50">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="MarketLens Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="ml-1 text-lg text-white font-mono">MarketLens</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 hover:bg-white/20 bg-white/5 text-xs text-white font-mono transition cursor-pointer"
            >
              Login ↗
            </button>
          </div>
        </nav>

        <div
          style={{ height: "1px", backgroundColor: "white", opacity: 0.2 }}
          className="w-full mb-4"
        ></div>

        {/* Hero Section */}
        <section
          className="relative flex flex-col items-center justify-center min-h-[calc(100vh-100px)] flex-1 -mt-30"
          style={{
            fontFamily: "GellixMedium, sans-serif",
            minHeight: "calc(100vh - 100px)",
          }}
        >
          {/* Radial overlay for better text legibility */}
          <div
            className="absolute inset-0 z-5"
            style={{
              background:
                "radial-gradient(circle at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.3) 70%, transparent 100%)",
            }}
          ></div>

          <div className="relative z-10 w-full flex flex-col items-center">
            <Announcement className="mb-8">
              <AnnouncementTag>Latest update</AnnouncementTag>
              <AnnouncementTitle>
                Beta v0.1 Now Live
                <ArrowUpRightIcon
                  className="shrink-0 text-muted-foreground"
                  size={16}
                />
              </AnnouncementTitle>
            </Announcement>

            <TextAnimate
              animation="fadeIn"
              by="line"
              as="h1"
              className="text-5xl font-mono text-center text-white mb-6 max-w-2xl mx-auto"
            >
              {`AI agents for simulated market research`}
            </TextAnimate>
            <div className="mb-4 text-center">
              <DecryptedText
                text="MarketLens"
                animateOn="view"
                revealDirection="center"
                sequential
                className="text-white"
                encryptedClassName="text-white/40"
                parentClassName="font-mono text-2xl md:text-3xl tracking-wide"
              />
            </div>
            <TextAnimate
              animation="fadeIn"
              by="line"
              as="p"
              className="mt-2 text-sm text-white/50 text-center max-w-xl mb-8 font-mono"
            >
              Get a market analysis in minutes, not months.
            </TextAnimate>
            <motion.div
              className="flex justify-center mt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Button
                size="lg"
                className="font-mono text-sm px-8 py-3 cursor-pointer bg-white text-black hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                onClick={() => router.push("/login")}
              >
                Explore MarketLens
                <ArrowUpRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Gradient fade transition */}
        <div
          className="h-32"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,1) 100%)",
          }}
        ></div>
      </div>

      {/* Rest of content with black background */}
      <div className="bg-black -mt-32">
        {/* App Preview Section */}
        <section className="relative z-10 flex justify-center items-center pb-20 px-8 -mt-50">
          <div className="relative max-w-6xl mx-auto">
            <BorderBeam />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="relative"
              style={{ width: '1200px', maxWidth: '100%' }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="shadow-2xl border border-white/20 p-1 w-full h-auto"
                style={{ aspectRatio: '3/2' }}
              >
                <source src="/marketlens.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </div>
        </section>

        <div className="max-w-7xl h-[1px] bg-white/20 mx-auto mb-20"></div>

        {/* Trusted Providers Section */}
        <section className="relative z-10 flex flex-col items-center pb-20 px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-sm font-mono text-white/70 mb-8"
            >
              Built on trusted infrastructure
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex items-center justify-center gap-12 flex-wrap"
            >
              {/* Cohere Logo */}
              <div className="flex items-center justify-center h-12 hover:opacity-100 transition-opacity">
                <Image
                  src="/cohere-logo.png"
                  alt="Cohere"
                  width={120}
                  height={40}
                  className="filter brightness-0 invert"
                />
              </div>

              {/* Auth0 Logo */}
              <div className="flex items-center justify-center h-12 hover:opacity-100 transition-opacity">
                <Image
                  src="/auth0-logo.png"
                  alt="Auth0"
                  width={100}
                  height={40}
                  className="filter brightness-0 invert"
                />
              </div>

              {/* Cloudflare Logo */}
              <div className="flex items-center justify-center h-12 hover:opacity-100 transition-opacity">
                <Image
                  src="/cloudflare-logo.png"
                  alt="Cloudflare"
                  width={140}
                  height={40}
                  className="filter brightness-0 invert"
                />
              </div>

              {/* MongoDB Logo */}
              <div className="flex items-center justify-center h-12 hover:opacity-100 transition-opacity">
                <Image
                  src="/mongodb-logo.png"
                  alt="MongoDB"
                  width={120}
                  height={40}
                  className="filter brightness-0 invert"
                />
              </div>

              {/* VAPI Logo */}
              <div className="flex items-center justify-center h-12 hover:opacity-100 transition-opacity">
                <Image
                  src="/VAPI.png"
                  alt="VAPI"
                  width={100}
                  height={40}
                  className="filter brightness-0 invert"
                />
              </div>

              {/* OpenAI Logo */}
              {/* <div className="flex items-center justify-center h-12 opacity-60 hover:opacity-100 transition-opacity">
              <Image
                src="/openai-logo.png"
                alt="OpenAI"
                width={100}
                height={40}
                className="filter brightness-0 invert"
              />
            </div> */}

              {/* Vercel Logo */}
              {/* <div className="flex items-center justify-center h-12 opacity-60 hover:opacity-100 transition-opacity">
              <Image
                src="/vercel-logo.png"
                alt="Vercel"
                width={100}
                height={40}
                className="filter brightness-0 invert"
              />
            </div> */}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative z-10 flex flex-col items-center py-20 px-8">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <div className="inline-block px-4 py-2 bg-white/5 border border-white/10">
                <span className="text-xs font-mono text-white">
                  Product Overview
                </span>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-3xl font-mono text-white mb-4 max-w-4xl mx-auto"
            >
              Skip months of user research with AI-powered market simulation
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-sm font-mono text-white/70 mb-16 max-w-2xl mx-auto"
            >
              Test ideas, posts, ads, and products against diverse AI personas.
              Get instant feedback from your target audience before you launch.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Market Simulation Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="border border-white/10 bg-black/40 p-6 hover:bg-white/5 hover:border-white/20 transition-all duration-300 text-left group hover:shadow-lg hover:shadow-white/5"
              >
                <motion.div
                  className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors duration-300"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Globe className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="text-lg font-mono text-white mb-3">
                  Market Simulation
                </h3>
                <p className="text-xs font-mono text-white/60 leading-relaxed">
                  Test product launches with diverse AI personas from around the
                  globe. See real-time reactions on an interactive world map.
                </p>
              </motion.div>

              {/* Multi-Platform Testing Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="border border-white/10 bg-black/40 p-6 hover:bg-white/5 hover:border-white/20 transition-all duration-300 text-left group hover:shadow-lg hover:shadow-white/5"
              >
                <motion.div
                  className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors duration-300"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Megaphone className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="text-lg font-mono text-white mb-3">
                  Multi-Platform Testing
                </h3>
                <p className="text-xs font-mono text-white/60 leading-relaxed">
                  Optimize content for LinkedIn, Instagram, Twitter, TikTok, and
                  email. Each persona responds with platform-specific behavior.
                </p>
              </motion.div>

              {/* Instant Insights Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="border border-white/10 bg-black/40 p-6 hover:bg-white/5 hover:border-white/20 transition-all duration-300 text-left group hover:shadow-lg hover:shadow-white/5"
              >
                <motion.div
                  className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors duration-300"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </motion.div>
                <h3 className="text-lg font-mono text-white mb-3">
                  Instant Results
                </h3>
                <p className="text-xs font-mono text-white/60 leading-relaxed">
                  Get detailed analytics in under 60 seconds. Engagement scores,
                  sentiment analysis, and viral coefficient predictions.
                </p>
              </motion.div>

              {/* Competitor Analysis Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="border border-white/10 bg-black/40 p-6 hover:bg-white/5 hover:border-white/20 transition-all duration-300 text-left group hover:shadow-lg hover:shadow-white/5"
              >
                <motion.div
                  className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors duration-300"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <FileText className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="text-lg font-mono text-white mb-3">
                  Scout Analysis
                </h3>
                <p className="text-xs font-mono text-white/60 leading-relaxed">
                  Automatically crawl and analyze competitor websites. Compare
                  strategies and find market gaps.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ASCII Art Section with Footer overlay */}
        <section className="relative z-0 w-full bg-black overflow-hidden -mt-40" style={{ height: "750px" }}>
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: "url('/ascii2.png')",
              backgroundSize: "100% auto",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
              filter: "brightness(1.2) contrast(1.5)",
              mixBlendMode: "lighten"
            }}
          />
          
          {/* Footer overlaying ASCII art at bottom */}
          <footer className="absolute bottom-0 left-0 right-0 z-20 bg-black/90 backdrop-blur-sm border-t border-white/10 py-8">
            <div className="max-w-6xl mx-auto px-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="MarketLens Logo"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                  <span className="text-sm text-white font-mono">MarketLens</span>
                </div>
                <div className="text-xs text-white/40 font-mono">
                  © 2025 MarketLens. AI agents for simulated market research.
                </div>
                <div className="flex items-center gap-6 text-xs font-mono">
                  <a href="/login" className="text-white/60 hover:text-white transition">
                    Login
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </section>

      </div>
    </>
  );
}
