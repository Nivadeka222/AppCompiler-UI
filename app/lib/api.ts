const API_BASE = "https://appcompiler-89mj.onrender.com";

export const STAGES = [
  "Intent Extraction",
  "System Design",
  "Database Schema",
  "API Schema",
  "UI Schema",
  "Auth Schema",
  "Validation",
  "Complete",
];

export type StageUpdate = {
  stage: string;
  done: boolean;
  retrying?: boolean;
  attempt?: number;
  data?: any;
};

export async function generateAppStream(
  prompt: string,
  onStage: (update: StageUpdate) => void
): Promise<any> {
  const response = await fetch(`${API_BASE}/generate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) throw new Error("Generation failed");

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let appData = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split("\n").filter((l) => l.startsWith("data: "));

    for (const line of lines) {
      try {
        const update: StageUpdate = JSON.parse(line.slice(6));
        onStage(update);
        if (update.data) appData = update.data;
      } catch {}
    }
  }

  return appData;
}

export async function generateApp(prompt: string) {
  const response = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) throw new Error("Generation failed");
  return response.json();
}