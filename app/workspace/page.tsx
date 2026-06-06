"use client";
import { generateAppStream, STAGES } from "../lib/api";
import { useState, useEffect, Suspense, useMemo, useRef } from "react";
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

// ─── Preview HTML builder ────────────────────────────────────────────────────

function buildPreviewHtml(appData: AppData): string {
  const appName = appData.intent?.app_name ?? "App";
  const pages: any[] = appData.system_design?.pages ?? [];
  const endpoints: any[] = appData.api_schema?.endpoints ?? [];
  const tables: any[] = appData.db_schema?.tables ?? [];

  // Mock value generator
  const mockVal = (name: string, type: string, idx: number): string => {
    const n = name.toLowerCase();
    if (n === "id") return String(idx + 1);
    if (n.includes("email")) return `user${idx + 1}@example.com`;
    if (n.includes("name")) return ["Alice", "Bob", "Carol"][idx % 3];
    if (n.includes("price") || n.includes("amount") || n.includes("total"))
      return `$${(9.99 + idx * 10).toFixed(2)}`;
    if (n.includes("date")) return `2024-0${idx + 1}-15`;
    if (n.includes("status")) return ["active", "pending", "completed"][idx % 3];
    if (n.includes("method")) return ["stripe", "paypal", "card"][idx % 3];
    if (n.includes("image")) return `https://picsum.photos/seed/${idx + 1}/60/60`;
    if (type === "boolean") return idx % 2 === 0 ? "true" : "false";
    if (type === "integer") return String(idx * 7 + 1);
    if (type === "float") return (idx * 3.14).toFixed(2);
    return `Sample ${name} ${idx + 1}`;
  };

  const endpointsForPath = (path: string) =>
    endpoints.filter((e) => e.path === path);

  const tableForPath = (path: string) => {
    const seg = path.replace(/^\//, "").split("/")[0];
    return tables.find((t) => t.name.toLowerCase().includes(seg.toLowerCase()));
  };

  const renderPage = (page: any): string => {
    const path = page.path ?? "";
    const pageEps = endpointsForPath(path);
    const getEp = pageEps.find((e: any) => e.method === "GET");
    const postEp = pageEps.find((e: any) => e.method === "POST");
    const dbTable = tableForPath(path);
    const isAdmin = path.includes("admin");
    let html = `<div class="page" id="page-${path.replace(/\//g, "_")}">`;
    html += `<h1 class="page-title">${page.name}</h1>`;

    // Admin: stat cards + bar chart
    if (isAdmin) {
      const metrics = [
        { label: "Total Revenue", value: "$48,200" },
        { label: "Orders", value: "1,284" },
        { label: "Users", value: "392" },
        { label: "Products", value: "64" },
      ];
      html += `<div class="stat-grid">`;
      metrics.forEach((m) => {
        html += `<div class="stat-card"><div class="stat-val">${m.value}</div><div class="stat-lbl">${m.label}</div></div>`;
      });
      html += `</div>`;
      // Inline SVG bar chart
      const bars = [
        { label: "Jan", h: 60 },
        { label: "Feb", h: 80 },
        { label: "Mar", h: 110 },
        { label: "Apr", h: 90 },
        { label: "May", h: 140 },
        { label: "Jun", h: 120 },
      ];
      const chartW = 480;
      const chartH = 160;
      const bw = 52;
      const gap = 20;
      html += `<div class="chart-wrap"><div class="chart-title">Monthly Revenue</div>`;
      html += `<svg width="${chartW}" height="${chartH + 30}" viewBox="0 0 ${chartW} ${chartH + 30}">`;
      bars.forEach((b, i) => {
        const x = i * (bw + gap) + 20;
        const y = chartH - b.h;
        html += `<rect x="${x}" y="${y}" width="${bw}" height="${b.h}" rx="6" fill="#3b82f6"/>`;
        html += `<text x="${x + bw / 2}" y="${chartH + 20}" text-anchor="middle" font-size="12" fill="#64748b">${b.label}</text>`;
        html += `<text x="${x + bw / 2}" y="${y - 6}" text-anchor="middle" font-size="11" fill="#1e293b" font-weight="600">$${b.h * 100}</text>`;
      });
      html += `</svg></div>`;
    }

    // GET → data table
    if (getEp && getEp.response_fields?.length > 0) {
      const fields: any[] = getEp.response_fields.slice(0, 6);
      html += `<div class="section-title">Data</div>`;
      html += `<div class="table-wrap"><table><thead><tr>`;
      fields.forEach((f: any) => {
        html += `<th>${f.name}</th>`;
      });
      html += `</tr></thead><tbody>`;
      for (let r = 0; r < 4; r++) {
        html += `<tr>`;
        fields.forEach((f: any) => {
          const v = mockVal(f.name, f.type, r);
          if (f.name.includes("image")) {
            html += `<td><img src="${v}" width="40" height="40" style="border-radius:6px;"/></td>`;
          } else {
            html += `<td>${v}</td>`;
          }
        });
        html += `</tr>`;
      }
      html += `</tbody></table></div>`;
    } else if (dbTable && dbTable.fields?.length > 0) {
      // fallback: use db table fields
      const fields: any[] = dbTable.fields.slice(0, 6);
      html += `<div class="section-title">Data</div>`;
      html += `<div class="table-wrap"><table><thead><tr>`;
      fields.forEach((f: any) => { html += `<th>${f.name}</th>`; });
      html += `</tr></thead><tbody>`;
      for (let r = 0; r < 4; r++) {
        html += `<tr>`;
        fields.forEach((f: any) => {
          const v = mockVal(f.name, f.type, r);
          if (f.name.includes("image")) {
            html += `<td><img src="${v}" width="40" height="40" style="border-radius:6px;"/></td>`;
          } else {
            html += `<td>${v}</td>`;
          }
        });
        html += `</tr>`;
      }
      html += `</tbody></table></div>`;
    }

    // POST → form
    if (postEp && postEp.request_fields?.length > 0) {
      html += `<div class="section-title">${postEp.summary ?? "Create"}</div>`;
      html += `<form class="form-card" onsubmit="event.preventDefault()">`;
      postEp.request_fields.forEach((f: any) => {
        const inputType =
          f.type === "integer" || f.type === "float"
            ? "number"
            : f.name.includes("email")
            ? "email"
            : f.name.includes("password")
            ? "password"
            : "text";
        html += `<div class="field">
          <label>${f.name}${f.required ? ' <span class="req">*</span>' : ""}</label>
          <input type="${inputType}" placeholder="${f.name}" ${f.required ? "required" : ""}/>
        </div>`;
      });
      html += `<button type="submit" class="btn-submit">${postEp.summary ?? "Submit"}</button>`;
      html += `</form>`;
    }

    html += `</div>`;
    return html;
  };

  const navLinks = pages
    .map(
      (p, i) =>
        `<a class="nav-link" href="#" onclick="showPage('page-${p.path.replace(/\//g, "_")}', this)"${i === 0 ? ' style="background:#2563eb;color:#fff;"' : ""}>${p.name}</a>`
    )
    .join("");

  const pageBlocks = pages.map(renderPage).join("\n");

  const firstId = pages[0]
    ? `page-${pages[0].path.replace(/\//g, "_")}`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${appName}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #1e293b; min-height: 100vh; }
  
  /* Topnav */
  .topnav { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 0 24px; display: flex; align-items: center; gap: 8px; height: 56px; position: sticky; top: 0; z-index: 10; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  .topnav-brand { font-weight: 700; font-size: 17px; color: #1e293b; margin-right: 16px; white-space: nowrap; }
  .nav-link { padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; color: #475569; text-decoration: none; transition: background .15s; cursor: pointer; white-space: nowrap; }
  .nav-link:hover { background: #f1f5f9; color: #1e293b; }
  
  /* Content */
  .content { padding: 32px 32px 64px; max-width: 960px; margin: 0 auto; }
  .page { display: none; }
  .page.active { display: block; }
  .page-title { font-size: 26px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }
  .section-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #64748b; margin: 28px 0 12px; }
  
  /* Table */
  .table-wrap { overflow-x: auto; border-radius: 14px; border: 1px solid #e2e8f0; background: #fff; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  td { padding: 12px 16px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8fafc; }

  /* Stat cards */
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 24px; }
  .stat-val { font-size: 28px; font-weight: 700; color: #0f172a; }
  .stat-lbl { font-size: 13px; color: #64748b; margin-top: 4px; }

  /* Chart */
  .chart-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 24px; display: inline-block; }
  .chart-title { font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 16px; }

  /* Form */
  .form-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px; max-width: 480px; }
  .field { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
  label { font-size: 13px; font-weight: 500; color: #374151; }
  .req { color: #ef4444; }
  input { padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; transition: border .15s; }
  input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
  .btn-submit { margin-top: 8px; padding: 10px 24px; background: #2563eb; color: #fff; border: none; border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background .15s; }
  .btn-submit:hover { background: #1d4ed8; }
</style>
</head>
<body>
<nav class="topnav">
  <span class="topnav-brand">${appName}</span>
  ${navLinks}
</nav>
<div class="content">
${pageBlocks}
</div>
<script>
  function showPage(id, link) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(a => { a.style.background=''; a.style.color=''; });
    var pg = document.getElementById(id);
    if (pg) pg.classList.add('active');
    if (link) { link.style.background='#2563eb'; link.style.color='#fff'; }
  }
  // Show first page on load
  var first = document.getElementById('${firstId}');
  if (first) first.classList.add('active');
</script>
</body>
</html>`;
}

// ─── Workspace ───────────────────────────────────────────────────────────────

function WorkspaceInner() {
  const [tab, setTab] = useState("overview");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stageStatuses, setStageStatuses] = useState<Record<string, StageStatus>>({});
  const [retryingStage, setRetryingStage] = useState<string | null>(null);
  const didAutoRun = useRef(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (didAutoRun.current) return;
    const p = searchParams.get("prompt");
    if (p) {
      didAutoRun.current = true;
      const decoded = decodeURIComponent(p);
      setPrompt(decoded);
      runGeneration(decoded);
    }
  }, []);

  const previewHtml = useMemo(
    () => (appData ? buildPreviewHtml(appData) : ""),
    [appData]
  );

  const runGeneration = async (p: string) => {
    try {
      setLoading(true);
      setError(null);
      setAppData(null);
      setStageStatuses({});
      setRetryingStage(null);

      const result = await generateAppStream(p, (update) => {
        if (update.retrying) {
          setRetryingStage(update.stage);
          return;
        }
        setRetryingStage(null);
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
      setRetryingStage(null);
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

  const tabs = ["overview", "database", "api", "auth", "ui", "preview"];

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
              className={`w-full text-left px-4 py-3 rounded-xl capitalize flex items-center gap-2 ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              {t === "preview" && (
                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${tab === t ? "bg-blue-500 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                  NEW
                </span>
              )}
              {t === "api" ? "API" : t === "ui" ? "UI Schema" : t === "preview" ? "Preview" : t.charAt(0).toUpperCase() + t.slice(1)}
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
                      status === "running" && retryingStage === stage ? "border-yellow-300 bg-yellow-50" :
                      status === "running" ? "border-blue-300 bg-blue-50" :
                      status === "done" ? "border-green-200 bg-green-50" :
                      "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      status === "done" ? "bg-green-100 text-green-700" :
                      status === "running" && retryingStage === stage ? "bg-yellow-100 text-yellow-700" :
                      status === "running" ? "bg-blue-100 text-blue-700" :
                      "bg-slate-200 text-slate-400"
                    }`}>
                      {status === "done" ? "✓" :
                       status === "running" && retryingStage === stage ? "↻" :
                       status === "running" ? <span className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin block" /> :
                       "·"}
                    </div>
                    <div>
                      <div className={`font-medium ${
                        status === "done" ? "text-green-800" :
                        status === "running" && retryingStage === stage ? "text-yellow-800" :
                        status === "running" ? "text-blue-800" :
                        "text-slate-400"
                      }`}>{stage}</div>
                      <div className="text-xs mt-0.5">
                        {status === "done" ? <span className="text-slate-400">Complete</span> :
                         status === "running" && retryingStage === stage ? <span className="text-yellow-600 font-medium">Rate limit — retrying...</span> :
                         status === "running" ? <span className="text-slate-400">Processing...</span> :
                         <span className="text-slate-400">Waiting</span>}
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

                      {(!page.components || page.components.length === 0) && (
                        <p className="text-sm text-slate-400 italic">
                          No components defined — see Preview tab for the rendered page.
                        </p>
                      )}
                    </div>
                  ))}
                </div>

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

            {/* PREVIEW */}
            {tab === "preview" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900">Live Preview</h1>
                    <p className="text-sm text-slate-500 mt-1">
                      Interactive mockup · {appData.system_design?.pages?.length ?? 0} pages · derived from schema
                    </p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl">Mock data only</span>
                </div>
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b bg-slate-50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-400 font-mono ml-2">
                      {appData.intent?.app_name?.toLowerCase().replace(/\s+/g, "-") ?? "app"}.preview
                    </div>
                  </div>
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full"
                    style={{ height: "620px", border: "none" }}
                    sandbox="allow-scripts allow-same-origin"
                    title="App Preview"
                  />
                </div>
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