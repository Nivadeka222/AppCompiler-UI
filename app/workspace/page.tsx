"use client";
import { generateAppStream, STAGES } from "../lib/api";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type AppData = {
  intent: any;
  system_design: any;
  db_schema: any;
  api_schema: any;
  auth_schema: any;
  ui_schema: any;
};

type StageStatus = "pending" | "running" | "done";

function WorkspaceInner() {
  const [tab, setTab] = useState("overview");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stageStatuses, setStageStatuses] = useState<Record<string, StageStatus>>({});

  const searchParams = useSearchParams();

  useEffect(() => {
    const p = searchParams.get("prompt");
    if (p) {
      const decoded = decodeURIComponent(p);
      setPrompt(decoded);
      runGeneration(decoded);
    }
  }, []);

  const runGeneration = async (p: string) => {
    try {
      setLoading(true);
      setError(null);
      setAppData(null);
      setStageStatuses({});

      const result = await generateAppStream(p, (update) => {
        setStageStatuses((prev) => {
          const next = { ...prev };
          if (update.data || update.stage === "Complete") {
            next[update.stage] = "done";
          } else {
            next[update.stage] = "running";
            const idx = STAGES.indexOf(update.stage);
            if (idx > 0) next[STAGES[idx - 1]] = "done";
          }
          return next;
        });
        if (update.data) setAppData(update.data);
      });

      setStageStatuses(Object.fromEntries(STAGES.map((s) => [s, "done"])));
      if (result) setAppData(result);
      setTab("overview");
    } catch {
      setError("Generation failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    runGeneration(prompt);
  };

  const exportProject = () => {
    if (!appData) return;
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appData.intent?.app_name ?? "app"}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = ["overview", "database", "api", "auth", "ui"];

  const componentTypeColor: Record<string, string> = {
    table: "bg-blue-100 text-blue-700",
    form: "bg-purple-100 text-purple-700",
    card: "bg-green-100 text-green-700",
    chart: "bg-orange-100 text-orange-700",
    list: "bg-yellow-100 text-yellow-700",
    modal: "bg-pink-100 text-pink-700",
    button: "bg-slate-100 text-slate-700",
    nav: "bg-indigo-100 text-indigo-700",
  };

  return (
    <main className="flex min-h-screen bg-[#f4f8fc]">
      <aside className="w-72 bg-white border-r border-[#e5e7eb] flex flex-col">
        <div className="p-6 border-b border-[#e5e7eb]">
          <h1 className="text-2xl font-bold">App Compiler</h1>
          <p className="text-sm text-gray-500">AI Application Builder</p>
        </div>
        <div className="p-5 space-y-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              disabled={!appData}
              className={`w-full text-left px-4 py-3 rounded-xl capitalize ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              {t === "api" ? "API" : t === "ui" ? "UI Schema" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 p-10">
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-8">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the application you want to generate..."
            className="flex-1 bg-white border rounded-2xl p-4 min-h-[100px] outline-none resize-none"
          />
          <div className="flex flex-col gap-3 justify-start">
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium"
            >
              {loading ? "Generating..." : "Generate App"}
            </button>
            <button
              onClick={exportProject}
              disabled={!appData}
              className="bg-slate-800 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium"
            >
              Export JSON
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {loading && (
          <div className="bg-white border rounded-2xl p-8 mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Running Pipeline...</h2>
            <div className="space-y-3">
              {STAGES.filter((s) => s !== "Complete").map((stage) => {
                const status = stageStatuses[stage] ?? "pending";
                return (
                  <div
                    key={stage}
                    className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 ${
                      status === "running" ? "border-blue-300 bg-blue-50" :
                      status === "done" ? "border-green-200 bg-green-50" :
                      "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      status === "done" ? "bg-green-100 text-green-700" :
                      status === "running" ? "bg-blue-100 text-blue-700" :
                      "bg-slate-200 text-slate-400"
                    }`}>
                      {status === "done" ? "✓" :
                       status === "running" ? <span className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin block" /> :
                       "·"}
                    </div>
                    <div>
                      <div className={`font-medium ${
                        status === "done" ? "text-green-800" :
                        status === "running" ? "text-blue-800" :
                        "text-slate-400"
                      }`}>{stage}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {status === "done" ? "Complete" : status === "running" ? "Processing..." : "Waiting"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!appData && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <p className="text-xl font-medium">No app generated yet</p>
            <p className="text-sm mt-2">Enter a prompt above and click Generate App</p>
          </div>
        )}

        {appData && !loading && (
          <>
            {/* OVERVIEW */}
            {tab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-slate-900">{appData.intent.app_name}</h1>
                  <p className="text-sm font-medium uppercase tracking-widest text-slate-500 mt-2">{appData.intent.app_type}</p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  {[
                    { label: "Entities", value: appData.intent.entities?.length ?? 0 },
                    { label: "Pages", value: appData.system_design.pages?.length ?? 0 },
                    { label: "API Endpoints", value: appData.api_schema.endpoints?.length ?? 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-2xl border bg-white p-6 shadow-sm">
                      <p className="text-sm font-medium text-gray-500">{label}</p>
                      <h2 className="mt-2 text-4xl font-bold text-slate-900">{value}</h2>
                    </div>
                  ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-3">Original Prompt</h2>
                    <p className="text-gray-600 leading-7">{prompt}</p>
                  </div>
                  <div className="rounded-2xl border bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-3">Roles</h2>
                    <div className="flex flex-wrap gap-2">
                      {appData.intent.roles?.map((role: any, i: number) => (
                        <span key={i} className="rounded-lg bg-blue-100 text-blue-700 px-3 py-1 text-sm">
                          {typeof role === "string" ? role : role.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-6">Generation Pipeline</h2>
                  <div className="space-y-3">
                    {STAGES.filter((s) => s !== "Complete").map((step) => (
                      <div key={step} className="flex items-center gap-4 border rounded-xl p-4 border-green-200 bg-green-50">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">✓</div>
                        <div>
                          <div className="font-medium text-green-800">{step}</div>
                          <div className="text-sm text-slate-500">Successfully generated</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DATABASE */}
            {tab === "database" && (
              <div className="space-y-6">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Database Schema</h1>
                {appData.db_schema.tables.map((table: any) => (
                  <div key={table.name} className="bg-white border rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-4">{table.name}</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-slate-500">
                            <th className="py-2 pr-4">Field</th>
                            <th className="py-2 pr-4">Type</th>
                            <th className="py-2 pr-4">Required</th>
                            <th className="py-2 pr-4">Unique</th>
                            <th className="py-2">Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.fields.map((field: any, i: number) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2 pr-4 font-medium">{field.name}</td>
                              <td className="py-2 pr-4 text-blue-600 font-mono text-xs">{field.type}</td>
                              <td className="py-2 pr-4">{field.required ? "Yes" : "No"}</td>
                              <td className="py-2 pr-4">{field.unique ? "Yes" : "-"}</td>
                              <td className="py-2 text-slate-500 font-mono text-xs">{field.references || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* API */}
            {tab === "api" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-slate-900">API Schema</h1>
                  <p className="text-sm text-slate-500 mt-1">Base path: {appData.api_schema.base_path}</p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  {[
                    { label: "Endpoints", value: appData.api_schema.endpoints.length },
                    { label: "Auth Required", value: appData.api_schema.endpoints.filter((e: any) => e.auth_required).length },
                    { label: "Public", value: appData.api_schema.endpoints.filter((e: any) => !e.auth_required).length },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-2xl border bg-white p-6 shadow-sm">
                      <p className="text-sm font-medium text-gray-500">{label}</p>
                      <h2 className="mt-2 text-4xl font-bold text-slate-900">{value}</h2>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {appData.api_schema.endpoints.map((ep: any, i: number) => (
                    <div key={i} className="rounded-2xl border bg-white p-6 shadow-sm">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
                              ep.method === "GET" ? "bg-green-100 text-green-700" :
                              ep.method === "POST" ? "bg-blue-100 text-blue-700" :
                              ep.method === "PUT" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>{ep.method}</span>
                            <h2 className="text-lg font-semibold font-mono">{ep.path}</h2>
                          </div>
                          <p className="mt-2 text-gray-600">{ep.summary}</p>
                        </div>
                        <span className={`rounded-xl border px-4 py-2 text-sm ${ep.auth_required ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-slate-50 text-slate-600"}`}>
                          {ep.auth_required ? "Auth required" : "Public"}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Request</p>
                          {ep.request_fields?.length > 0 ? ep.request_fields.map((f: any, j: number) => (
                            <div key={j} className="rounded-lg bg-slate-50 px-3 py-2 text-sm mb-1">
                              <span className="font-medium">{f.name}</span> <span className="text-slate-400">({f.type}{f.required ? ", required" : ""})</span>
                            </div>
                          )) : <p className="text-sm text-slate-400">No request fields</p>}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Response</p>
                          {ep.response_fields?.map((f: any, j: number) => (
                            <div key={j} className="rounded-lg bg-slate-50 px-3 py-2 text-sm mb-1">
                              <span className="font-medium">{f.name}</span> <span className="text-slate-400">({f.type})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {ep.roles_allowed?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {ep.roles_allowed.map((r: string, j: number) => (
                            <span key={j} className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-600">{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AUTH */}
            {tab === "auth" && (
              <div className="space-y-6">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Auth & Authorization</h1>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-4">Security Strategy</h2>
                    <p className="mb-2"><span className="font-semibold">Strategy:</span> {appData.auth_schema.strategy}</p>
                    <p><span className="font-semibold">Token Expiry:</span> {appData.auth_schema.token_expiry_seconds}s</p>
                  </div>
                  <div className="bg-white border rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-4">Public Routes</h2>
                    <div className="space-y-2">
                      {appData.auth_schema.public_routes.map((route: string, i: number) => (
                        <div key={i} className="bg-gray-100 rounded-lg px-3 py-2 font-mono text-sm">{route}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-white border rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">Roles & Permissions</h2>
                  <div className="space-y-4">
                    {appData.auth_schema.roles.map((role: any, i: number) => (
                      <div key={i} className="border rounded-xl p-4">
                        <h3 className="font-bold text-lg">{role.name}</h3>
                        {role.permissions?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {role.permissions.map((perm: any, j: number) => (
                              <div key={j} className="text-sm text-slate-600">
                                <span className="font-medium text-slate-800">{perm.resource}:</span>{" "}
                                {perm.actions?.join(", ")}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {role.can_access_pages?.map((page: string, j: number) => (
                            <span key={j} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm">{page}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* UI SCHEMA */}
            {tab === "ui" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-slate-900">UI Schema</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    {appData.ui_schema.pages?.length ?? 0} pages · {appData.ui_schema.nav_items?.length ?? 0} nav items
                  </p>
                </div>

                {/* Nav items */}
                {appData.ui_schema.nav_items?.length > 0 && (
                  <div className="bg-white border rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Navigation</h2>
                    <div className="flex flex-wrap gap-2">
                      {appData.ui_schema.nav_items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-slate-50 border rounded-xl px-4 py-2 text-sm">
                          <span className="font-medium">{item.label ?? item.name ?? item}</span>
                          {item.path && <span className="text-slate-400 font-mono">{item.path}</span>}
                          {item.roles && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {Array.isArray(item.roles) ? item.roles.join(", ") : item.roles}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pages */}
                <div className="space-y-6">
                  {appData.ui_schema.pages?.map((page: any, pi: number) => (
                    <div key={pi} className="bg-white border rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-xl font-bold">{page.name}</h2>
                          <span className="font-mono text-sm text-slate-500">{page.path}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                          {page.roles_allowed?.map((r: string, ri: number) => (
                            <span key={ri} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">{r}</span>
                          ))}
                          {page.layout && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{page.layout}</span>
                          )}
                        </div>
                      </div>

                      {/* Components grid */}
                      {page.components?.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {page.components.map((comp: any, ci: number) => (
                            <div key={ci} className="border rounded-xl p-4 bg-slate-50">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${componentTypeColor[comp.type] ?? "bg-slate-200 text-slate-600"}`}>
                                  {comp.type}
                                </span>
                                <span className="font-medium text-sm">{comp.title || comp.id}</span>
                              </div>

                              {comp.data_source && (
                                <p className="text-xs text-slate-500 mb-2">
                                  Source: <span className="font-mono">{comp.data_source}</span>
                                </p>
                              )}

                              {comp.fields?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {comp.fields.map((f: any, fi: number) => (
                                    <span key={fi} className="text-xs bg-white border rounded px-2 py-0.5 text-slate-600">
                                      {typeof f === "string" ? f : f.label ?? f.name ?? JSON.stringify(f)}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {comp.roles_visible?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {comp.roles_visible.map((r: string, ri: number) => (
                                    <span key={ri} className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{r}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Flows */}
                {appData.ui_schema.flows?.length > 0 && (
                  <div className="bg-white border rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-4">User Flows</h2>
                    <div className="space-y-4">
                      {appData.ui_schema.flows.map((flow: any, fi: number) => (
                        <div key={fi} className="border rounded-xl p-4">
                          <h3 className="font-semibold mb-3">{flow.name}</h3>
                          <div className="flex flex-wrap items-center gap-2">
                            {flow.steps?.map((step: any, si: number) => (
                              <div key={si} className="flex items-center gap-2">
                                <span className="bg-slate-100 rounded-lg px-3 py-1 text-sm">
                                  {typeof step === "string" ? step : step.action ?? step.page ?? JSON.stringify(step)}
                                </span>
                                {si < flow.steps.length - 1 && <span className="text-slate-400">→</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function Workspace() {
  return (
    <Suspense fallback={null}>
      <WorkspaceInner />
    </Suspense>
  );
}