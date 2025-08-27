import type { Route } from "./+types/home";
import { useEffect, useMemo, useState } from "react";
import { Editor, toUnicodeBoldFromHTML } from "../wysiwyg/Editor";
import { generateLinkedInPost } from "../utils/linkedin-generator";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hetal's LinkedIn Post Studio" },
    { name: "description", content: "Generate and format LinkedIn posts with Unicode styling." },
  ];
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [audience, setAudience] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  type FontStyle = "plain" | "bold" | "sansBold" | "mono" | "doubleStruck" | "fullwidth" | "circled" | "smallCaps";
  const [format, setFormat] = useState<FontStyle>("bold");
  const [richHtml, setRichHtml] = useState("");
  const [modelSize, setModelSize] = useState<"small" | "medium" | "large" | "creative">("medium");
  const [words, setWords] = useState<number>(160);
  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [variants, setVariants] = useState<Array<{ text: string; plain: string; unicodeBold: string; }>>([]);

  const selected = useMemo(() => (selectedIdx != null ? variants[selectedIdx] : undefined), [variants, selectedIdx]);

  const onGenerateAI = async () => {
    setSelectedIdx(null);
    const input = prompt?.trim();
    setProgress(0);
    setIsLoading(true);
    
    const interval = setInterval(() => setProgress(p => (p < 95 ? p + Math.max(1, Math.floor((100 - p) / 10)) : p)), 120);
    
    try {
      const result = await generateLinkedInPost({
        prompt: input,
        audience,
        askAI: true,
        modelSize,
        words
      });
      
      setVariants(result.variants);
      setProgress(100);
      setTimeout(() => setProgress(0), 600);
    } catch (error) {
      console.error("Failed to generate post:", error);
      setProgress(0);
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const v = variants?.[0];
    if (!v) return;
    const html = (v.text || v.plain || "").replace(/\n/g, "<br>");
    setRichHtml(html);
  }, [variants]);

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
        <header className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Hetal's LinkedIn Post Studio</h1>
        </header>

        <section className="flex flex-col gap-6 bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-purple-700">Audience</label>
            <input value={audience} onChange={(e) => setAudience(e.target.value)} className="border-2 border-purple-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200" placeholder="e.g., SME founders, HR managers" />
            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="col-span-2">
                <label className="text-sm font-semibold text-blue-700">Model</label>
                <select value={modelSize} onChange={(e) => setModelSize(e.target.value as any)} className="border-2 border-blue-200 rounded-lg px-4 py-3 w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                  <option value="small">qwen3-4b</option>
                  <option value="medium">mistral-31-24b</option>
                  <option value="large">qwen3-235b</option>
                  <option value="creative">venice-uncensored</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-green-700">Words</label>
                <input type="number" value={words} onChange={(e)=> setWords(parseInt(e.target.value || "160", 10))} className="border-2 border-green-200 rounded-lg px-4 py-3 w-full focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200" min={80} max={350} step={10} />
              </div>
            </div>
            <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border-l-4 border-indigo-400">💡 Models: Small (fast), Medium (balanced), Large (quality), Creative (uncensored).</div>
            <label className="text-sm font-semibold text-indigo-700 mt-3">What is the post about?</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="border-2 border-indigo-200 rounded-lg px-4 py-3 min-h-32 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 resize-none" placeholder="e.g., vacation benefits, team productivity, new product launch" />
            <div className="flex justify-center mt-6">
              <button onClick={onGenerateAI} className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-50 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:hover:scale-100" disabled={isLoading}>
                {isLoading ? '✨ Creating Magic...' : '🚀 Create with AI'}
              </button>
            </div>
            <label className="text-sm font-semibold text-emerald-700 mt-8">✏️ Editor. Use Bold or style picker to apply Unicode fonts</label>
            <Editor valueHtml={richHtml} onChangeHtml={setRichHtml} />
            <div className="text-sm text-emerald-600 bg-emerald-50 rounded-lg p-3 border-l-4 border-emerald-400">💡 Tip: Add an anecdote and a measurable result. Keep it concise.</div>

          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">✨ Creating a magical post...</div>
              <div className="text-sm text-purple-600 mt-2">This might take a moment</div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
            <h2 className="text-xl font-bold text-orange-700 mb-4 flex items-center">📚 Best practices</h2>
            <div className="rounded-xl border-2 border-orange-200 p-5 text-sm space-y-2 bg-orange-50">
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
