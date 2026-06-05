"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const EXAMPLE_PROMPTS = [
  "Build an e-commerce platform with products, carts, orders, payments and admin dashboard",
  "Create a hospital management system with doctors, patients, appointments and billing",
  "Build a project management tool like Jira with teams, sprints, tickets and analytics",
  "Create a food delivery app with restaurants, menus, orders and delivery tracking",
];

const FEATURES = [
  {
    icon: "⚡",
    title: "Intent Extraction",
    desc: "Understands your app idea and identifies entities, roles, and requirements automatically.",
  },
  {
    icon: "🗄️",
    title: "Database Schema",
    desc: "Generates normalized tables, fields, types, constraints and relationships.",
  },
  {
    icon: "🔌",
    title: "API Schema",
    desc: "Produces typed REST endpoints with request/response fields and auth rules.",
  },
  {
    icon: "🔐",
    title: "Auth & Roles",
    desc: "Designs JWT strategy, token expiry, role permissions and public routes.",
  },
  {
    icon: "🖥️",
    title: "UI Schema",
    desc: "Maps out pages, components, forms, and navigation tailored to your app.",
  },
  {
    icon: "📦",
    title: "Export Config",
    desc: "Downloads a complete app_config.json ready to feed into your code generator.",
  },
];

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    router.push(`/workspace?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  return (
    <main className="min-h-screen bg-[#f4f8fc]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-10 py-5 bg-white border-b border-[#e5e7eb]">
        <div>
          <span className="text-xl font-bold text-slate-900">App Compiler</span>
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Beta</span>
        </div>
        <a href="/workspace" className="text-sm text-slate-500 hover:text-slate-800 transition">Workspace →</a>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-12">
        <div className="inline-block bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          Powered by Groq · Llama 3.1
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight max-w-3xl">
          Turn any idea into a<br />
          <span className="text-blue-600">complete app blueprint</span>
        </h1>
        <p className="mt-6 text-lg text-slate-500 max-w-xl">
          Describe your application in plain English. App Compiler generates your database schema,
          API design, auth model, and UI structure in seconds.
        </p>

        {/* Prompt input */}
        <div className="mt-10 w-full max-w-2xl bg-white border border-[#dbe4ee] rounded-3xl p-6 shadow-sm">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleGenerate(); }}
            rows={3}
            className="w-full resize-none outline-none text-slate-800 text-base placeholder:text-slate-400"
            placeholder="Build an e-commerce platform with products, carts, orders, payments and admin dashboard..."
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-400">⌘ + Enter to generate</span>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Generate App →
            </button>
          </div>
        </div>

        {/* Example prompts */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-2xl">
          {EXAMPLE_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => setPrompt(p)}
              className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition"
            >
              {p.length > 55 ? p.slice(0, 55) + "…" : p}
            </button>
          ))}
        </div>
      </section>

      {/* Pipeline visualization */}
      <section className="flex justify-center px-6 py-12">
        <div className="flex flex-wrap justify-center items-center gap-3 max-w-3xl">
          {["Prompt", "Intent", "System Design", "DB Schema", "API Schema", "Auth Schema", "UI Schema", "App Config"].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`rounded-xl px-4 py-2 text-sm font-medium border ${
                step === "Prompt" ? "bg-blue-600 text-white border-blue-600" :
                step === "App Config" ? "bg-slate-800 text-white border-slate-800" :
                "bg-white text-slate-700 border-slate-200"
              }`}>
                {step}
              </div>
              {i < arr.length - 1 && <span className="text-slate-300 text-lg">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="px-10 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Everything generated for you</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-[#e5e7eb] rounded-2xl p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-6 py-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to build?</h2>
        <p className="text-slate-500 mb-8">Describe your app above and get a complete architecture in under 2 minutes.</p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
        >
          Start Building →
        </button>
      </section>

      <footer className="text-center text-xs text-slate-400 py-6 border-t border-slate-100">
        App Compiler · AI-powered application architecture generator
      </footer>
    </main>
  );
}