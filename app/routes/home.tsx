import type { Route } from "./+types/home";
import { useFetcher } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { Editor, toUnicodeBoldFromHTML } from "../wysiwyg/Editor";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hetal's LinkedIn Post Studio" },
    { name: "description", content: "Generate and format LinkedIn posts with Unicode styling." },
  ];
}

export default function Home() {
  const fetcher = useFetcher<{ variants: Array<{ text: string; plain: string; unicodeBold: string; }> , model: string, modelSize: string, words: number }>();
  const [prompt, setPrompt] = useState("");
  const [audience, setAudience] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  type FontStyle = "plain" | "bold" | "sansBold" | "mono" | "doubleStruck" | "fullwidth" | "circled" | "smallCaps";
  const [format, setFormat] = useState<FontStyle>("bold");
  const [richHtml, setRichHtml] = useState("");
  const [modelSize, setModelSize] = useState<"small" | "medium" | "large" | "creative">("medium");
  const [words, setWords] = useState<number>(160);
  const [progress, setProgress] = useState<number>(0);

  const variants = fetcher.data?.variants ?? [];
  const selected = useMemo(() => (selectedIdx != null ? variants[selectedIdx] : undefined), [variants, selectedIdx]);

  const onGenerateAI = () => {
    setSelectedIdx(null);
    const input = prompt?.trim();
    setProgress(0);
    const interval = setInterval(() => setProgress(p => (p < 95 ? p + Math.max(1, Math.floor((100 - p) / 10)) : p)), 120);
    fetcher.submit(
      { prompt: input, audience, askAI: true, modelSize, words },
      { method: "POST", action: "/api/generate", encType: "application/json" }
    );
    const stop = () => { clearInterval(interval); setProgress(100); setTimeout(() => setProgress(0), 600); };
    const unsub = setInterval(() => {
      if (fetcher.state === "idle") { clearInterval(unsub); stop(); }
    }, 100);
  };

  useEffect(() => {
    const v = fetcher.data?.variants?.[0];
    if (!v) return;
    const html = (v.text || v.plain || "").replace(/\n/g, "<br>");
    setRichHtml(html);
  }, [fetcher.data]);

  const mapWith = (s: string, upperStart: number, lowerStart: number, digitStart?: number) =>
    s
      .replace(/[A-Z]/g, c => String.fromCodePoint(upperStart + (c.charCodeAt(0) - 0x41)))
      .replace(/[a-z]/g, c => String.fromCodePoint(lowerStart + (c.charCodeAt(0) - 0x61)))
      .replace(/[0-9]/g, c => (digitStart != null ? String.fromCodePoint(digitStart + (c.charCodeAt(0) - 0x30)) : c));

  const toSansBold = (s: string) => mapWith(s, 0x1D5D4, 0x1D5EE, 0x1D7EC);
  const toMono = (s: string) => mapWith(s, 0x1D670, 0x1D68A, 0x1D7F6);
  const toDouble = (s: string) => mapWith(s, 0x1D538, 0x1D552, 0x1D7D8);
  const toFull = (s: string) => mapWith(s, 0xFF21, 0xFF41, 0xFF10);
  const toCircled = (s: string) => s
    .replace(/[A-Z]/g, c => String.fromCodePoint(0x24B6 + (c.charCodeAt(0) - 0x41)))
    .replace(/[a-z]/g, c => String.fromCodePoint(0x24D0 + (c.charCodeAt(0) - 0x61)));
  const toSmallCaps = (s: string) => {
    const map: Record<string, string> = {
      a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ",
    };
    return s.replace(/[a-z]/g, ch => map[ch] ?? ch);
  };

  const transform = (text: string, style: FontStyle) => {
    switch (style) {
      case "bold": return selected?.unicodeBold ?? text;
      case "sansBold": return toSansBold(text);
      case "mono": return toMono(text);
      case "doubleStruck": return toDouble(text);
      case "fullwidth": return toFull(text);
      case "circled": return toCircled(text);
      case "smallCaps": return toSmallCaps(text);
      case "plain":
      default: return text;
    }
  };

  const displayText = selected ? transform(selected.plain, format) : "";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Hetal's LinkedIn Post Studio</h1>
        </header>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium">Audience</label>
            <input value={audience} onChange={(e) => setAudience(e.target.value)} className="border rounded px-3 py-2" placeholder="e.g., SME founders, HR managers" />
            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="col-span-2">
                <label className="text-sm font-medium">Model</label>
                <select value={modelSize} onChange={(e) => setModelSize(e.target.value as any)} className="border rounded px-3 py-2 w-full">
                  <option value="small">qwen3-4b</option>
                  <option value="medium">mistral-31-24b</option>
                  <option value="large">qwen3-235b</option>
                  <option value="creative">venice-uncensored</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Words</label>
                <input type="number" value={words} onChange={(e)=> setWords(parseInt(e.target.value || "160", 10))} className="border rounded px-3 py-2 w-full" min={80} max={350} step={10} />
              </div>
            </div>
            <div className="text-xs text-gray-600">Models: Small (fast), Medium (balanced), Large (quality), Creative (uncensored).</div>
            <label className="text-sm font-medium mt-3">What is the post about?</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="border rounded px-3 py-2 min-h-28" placeholder="e.g., vacation benefits, team productivity, new product launch" />
            <div className="flex justify-center mt-4">
              <button onClick={onGenerateAI} className="px-6 py-3 rounded bg-black text-white disabled:opacity-50 font-medium" disabled={fetcher.state !== "idle"}>Create with AI</button>
            </div>
            <label className="text-sm font-medium mt-6">Editor. Use Bold or style picker to apply Unicode fonts</label>
            <Editor valueHtml={richHtml} onChangeHtml={setRichHtml} />
            <div className="text-sm text-gray-500">Tip: Add an anecdote and a measurable result. Keep it concise.</div>

          </div>

          {fetcher.state !== "idle" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-lg font-medium">Creating a magical post...</div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-2">Best practices</h2>
            <div className="rounded border p-4 text-sm space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li>Open with a clear question or CTA to spark comments.</li>
                <li>Keep paragraphs short; use 3–5 bullets for lists.</li>
                <li>Target your specific audience (e.g., founders vs. HR) explicitly.</li>
                <li>Use 2–6 relevant hashtags; include one timely/news tag.</li>
                <li>Highlight concrete results and numbers where possible.</li>
                <li>Turn comments into follow‑ups and mini‑series to compound reach.</li>
                <li>Post at times your audience is active; test morning/evening.</li>
                <li>Encourage UGC: ask readers to share tips or experiences.</li>
                <li>For dense content, tease with a short summary and consider a carousel.</li>
                <li>Style key phrases with Unicode bold/italic for skimmability; avoid asterisks.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
