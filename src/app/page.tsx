"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Compass,
  Globe,
  Layers,
  LineChart,
  Megaphone,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Pricing", href: "#pricing" },
];

const steps = [
  {
    title: "Describe What You Want To Test",
    description:
      "Input your product, post, ad, or launch idea. MarketLens builds the simulation context in seconds.",
    icon: Sparkles,
  },
  {
    title: "Select Personas, Regions, And Platforms",
    description:
      "Choose audience profile, market, and channel mix to match real go-to-market scenarios.",
    icon: Target,
  },
  {
    title: "Get Simulated Reactions And Insights",
    description:
      "See objections, sentiment, engagement potential, and improvement actions before launch.",
    icon: LineChart,
  },
];

const features = [
  {
    title: "Market Simulation",
    description:
      "Run scenario-based simulations with AI personas across different economic and regional conditions.",
    icon: Globe,
  },
  {
    title: "Multi-Platform Testing",
    description:
      "Test ideas across product messaging, social posts, ad concepts, landing pages, and content angles.",
    icon: Layers,
  },
  {
    title: "Instant Results",
    description:
      "Get structured feedback, sentiment trends, and adoption signals in minutes, not survey cycles.",
    icon: Zap,
  },
  {
    title: "Scout Analysis",
    description:
      "Spot recurring objections, competitor pressure, and strategic blind spots before you commit budget.",
    icon: Search,
  },
];

const useCases = [
  {
    title: "Startup Founders",
    description:
      "Validate concepts and pricing before writing code or scaling team spend.",
    icon: Rocket,
  },
  {
    title: "Growth Marketers",
    description:
      "Pressure-test campaign messaging before launch and reduce wasted ad spend.",
    icon: Megaphone,
  },
  {
    title: "Creators",
    description:
      "Test content hooks and positioning against audience segments before publishing.",
    icon: Compass,
  },
  {
    title: "Product Teams",
    description:
      "Model feature reception, regional adoption, and competitive differentiation.",
    icon: Users,
  },
];

const pricing = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "For solo builders testing early ideas.",
    points: ["50 simulations", "Core persona packs", "Basic analytics"],
  },
  {
    name: "Growth",
    price: "$99",
    period: "/month",
    description: "For teams shipping weekly experiments.",
    points: ["500 simulations", "Multi-platform testing", "Advanced insight cards"],
    highlighted: true,
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    description: "For orgs running always-on research workflows.",
    points: ["Unlimited simulations", "Custom persona models", "Priority support"],
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.11),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.09),transparent_36%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_12%,transparent_88%,rgba(255,255,255,0.02))]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-sm border border-cyan-300/40 bg-cyan-300/10" />
            <span className="text-sm font-semibold tracking-wide">MarketLens</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-white/70 transition-colors hover:text-cyan-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="border border-white/15 bg-white/[0.02] text-white/90 hover:bg-white/10">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-cyan-300 text-black hover:bg-cyan-200">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10" id="product">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:pt-24">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="space-y-7"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                <Shield className="h-3.5 w-3.5" />
                AI agents for simulated market research
              </div>

              <div className="space-y-4">
                <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Test market response before you ship.
                </h1>
                <p className="max-w-xl text-pretty text-base text-white/70 sm:text-lg">
                  MarketLens lets teams simulate how real audience segments react to products, ideas, posts, ads,
                  and content so you can launch with conviction. Get market analysis in minutes, not months.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="bg-cyan-300 text-black hover:bg-cyan-200">
                  <Link href="/signup" className="inline-flex items-center gap-2">
                    Start Free Simulation
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="border border-white/15 bg-white/[0.02] text-white hover:bg-white/10">
                  <Link href="/login">View Live Dashboard</Link>
                </Button>
              </div>

              <p className="text-sm text-white/50">
                Trusted by founders, marketers, and product teams to validate go-to-market decisions faster.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12 }}
              className="relative"
            >
              <div className="absolute -inset-3 rounded-3xl bg-cyan-300/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#0b0d12] shadow-[0_20px_90px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-300/80" />
                  </div>
                  <div className="text-xs text-white/60">Simulation Dashboard</div>
                </div>

                <div className="grid gap-4 p-4">
                  <div className="rounded-2xl border border-white/10 bg-black/45 p-3">
                    <video autoPlay loop muted playsInline className="h-52 w-full rounded-xl border border-white/10 object-cover sm:h-64">
                      <source src="/marketlens.mp4" type="video/mp4" />
                    </video>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Approve", value: "68%" },
                      { label: "Neutral", value: "21%" },
                      { label: "Disapprove", value: "11%" },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="text-xs text-white/60">{metric.label}</div>
                        <div className="mt-1 text-lg font-semibold text-cyan-200">{metric.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-center text-xs uppercase tracking-[0.22em] text-white/45">Built On Trusted Infrastructure</p>
            <div className="mt-6 grid grid-cols-2 items-center justify-items-center gap-6 opacity-70 sm:grid-cols-4">
              <Image src="/cohere-logo.png" alt="Cohere" width={110} height={34} className="h-7 w-auto object-contain" />
              <Image src="/auth0-logo.png" alt="Auth0" width={96} height={30} className="h-6 w-auto object-contain" />
              <Image src="/cloudflare-logo.png" alt="Cloudflare" width={126} height={34} className="h-7 w-auto object-contain" />
              <div className="rounded-md border border-white/15 px-3 py-2 text-xs text-white/65">MongoDB</div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">How It Works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">A faster path from idea to market confidence.</h2>
            <p className="mt-4 text-white/65">
              MarketLens compresses weeks of qualitative testing into a guided simulation workflow that teams can repeat at scale.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: idx * 0.08, duration: 0.35 }}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-cyan-300/45"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">Step {idx + 1}</div>
                <h3 className="text-lg font-medium">{step.title}</h3>
                <p className="mt-2 text-sm text-white/65">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="features" className="border-y border-white/10 bg-white/[0.01]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Core Features</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Built for real pre-launch decisions.</h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  whileHover={{ y: -3 }}
                  className="group rounded-2xl border border-white/10 bg-[#0b0d12]/90 p-6 transition-all hover:border-cyan-300/45 hover:shadow-[0_8px_32px_rgba(34,211,238,0.1)]"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-medium">{feature.title}</h3>
                  <p className="mt-2 text-sm text-white/65">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="showcase" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">See MarketLens In Action</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">A product showcase built like a real operating console.</h2>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d12] p-4 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                    {[
                      "Product",
                      "LinkedIn",
                      "Instagram",
                      "Ads",
                      "Scout",
                    ].map((tab, index) => (
                      <span
                        key={tab}
                        className={`rounded-md border px-2 py-1 ${
                          index === 0
                            ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200"
                            : "border-white/15 bg-white/[0.02] text-white/65"
                        }`}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Sentiment Score", value: "81" },
                      { label: "Adoption Likelihood", value: "74%" },
                      { label: "Critical Objections", value: "4" },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="text-xs text-white/55">{metric.label}</div>
                        <div className="mt-1 text-xl font-semibold text-cyan-200">{metric.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-white/80">Region Targeting And Persona Spread</p>
                    <Globe className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div className="h-44 rounded-xl border border-white/10 bg-[radial-gradient(circle_at_20%_30%,rgba(34,211,238,0.2),transparent_34%),radial-gradient(circle_at_70%_65%,rgba(59,130,246,0.18),transparent_32%),linear-gradient(to_bottom,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4">
                    <div className="grid h-full grid-cols-3 gap-3">
                      {[
                        "North America",
                        "Europe",
                        "APAC",
                        "LATAM",
                        "MENA",
                        "Africa",
                      ].map((region) => (
                        <div key={region} className="rounded-lg border border-white/10 bg-black/35 p-2 text-xs text-white/70">
                          {region}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="mb-3 text-sm text-white/80">AI Persona Reactions</p>
                  <div className="space-y-2">
                    {[
                      { name: "Jing Lin", tone: "Approve", note: "Strong utility if rollout proves reliability.", color: "bg-cyan-300" },
                      { name: "Amina K.", tone: "Neutral", note: "Needs clearer compliance and risk framing.", color: "bg-white/60" },
                      { name: "Lucas M.", tone: "Disapprove", note: "Current pitch feels broad and costly to adopt.", color: "bg-white/40" },
                    ].map((item) => (
                      <div key={item.name} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-white/85">{item.name}</span>
                          <span className="inline-flex items-center gap-1 text-white/60">
                            <span className={`h-2 w-2 rounded-full ${item.color}`} />
                            {item.tone}
                          </span>
                        </div>
                        <p className="text-xs text-white/60">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="mb-2 text-sm text-white/80">Competitor Snapshot</p>
                  <div className="space-y-2 text-xs text-white/65">
                    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.02] px-3 py-2">
                      <span>Differentiation Score</span>
                      <span className="text-cyan-200">7.8 / 10</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.02] px-3 py-2">
                      <span>Traction Probability</span>
                      <span className="text-cyan-200">High</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.02] px-3 py-2">
                      <span>Viral Potential</span>
                      <span className="text-cyan-200">Moderate+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="use-cases" className="border-y border-white/10 bg-white/[0.01]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Use Cases</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Built for teams that need signal, not guesswork.</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {useCases.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-[#0b0d12] p-5 transition-colors hover:border-cyan-300/45">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-medium">{item.title}</h3>
                  <p className="mt-2 text-sm text-white/65">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Start lean, scale when your research velocity grows.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 ${
                  plan.highlighted
                    ? "border-cyan-300/45 bg-cyan-300/10"
                    : "border-white/10 bg-[#0b0d12]"
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium">{plan.name}</h3>
                  {plan.highlighted ? (
                    <span className="rounded-md border border-cyan-300/35 bg-cyan-300/15 px-2 py-0.5 text-xs text-cyan-200">
                      Most Popular
                    </span>
                  ) : null}
                </div>
                <p className="mb-3 text-sm text-white/65">{plan.description}</p>
                <div className="mb-4 text-3xl font-semibold">
                  {plan.price}
                  <span className="text-base text-white/50">{plan.period}</span>
                </div>
                <ul className="space-y-2 text-sm text-white/70">
                  {plan.points.map((point) => (
                    <li key={point} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-[linear-gradient(to_bottom,rgba(34,211,238,0.08),rgba(34,211,238,0.02))]">
          <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
              <Bot className="h-3.5 w-3.5" />
              Launch with confidence, not guesswork
            </div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
              Simulate your audience before launch.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/70">
              Use MarketLens to validate product and content direction before spend, before launch, and before risk becomes expensive.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-cyan-300 text-black hover:bg-cyan-200">
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="border border-white/15 bg-white/[0.02] text-white hover:bg-white/10">
                <Link href="/login">Book A Demo</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/70">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:px-8">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-6 w-6 rounded-sm border border-cyan-300/40 bg-cyan-300/10" />
              <span className="text-sm font-semibold tracking-wide">MarketLens</span>
            </div>
            <p className="max-w-sm text-sm text-white/60">
              AI agents for simulated market research. Test ideas, messaging, and campaigns before you launch.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium text-white">Product</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="#features" className="hover:text-cyan-300">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-cyan-300">How It Works</a></li>
              <li><a href="#pricing" className="hover:text-cyan-300">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium text-white">Company</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/projects" className="hover:text-cyan-300">Projects</Link></li>
              <li><Link href="/login" className="hover:text-cyan-300">Login</Link></li>
              <li><Link href="/signup" className="hover:text-cyan-300">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="#" className="hover:text-cyan-300">Privacy</a></li>
              <li><a href="#" className="hover:text-cyan-300">Terms</a></li>
              <li><a href="#" className="hover:text-cyan-300">Security</a></li>
            </ul>
          </div>
        </div>
      </footer>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/45">
        © {new Date().getFullYear()} MarketLens. All rights reserved.
      </div>
    </div>
  );
}
