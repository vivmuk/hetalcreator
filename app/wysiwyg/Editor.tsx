import { useEffect, useRef, useState } from "react";

type Props = {
  valueHtml: string;
  onChangeHtml: (html: string) => void;
};

export function Editor({ valueHtml, onChangeHtml }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<
    "plain" | "bold" | "sansBold" | "mono" | "doubleStruck" | "fullwidth" | "circled" | "smallCaps"
  >("sansBold");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el) {
      el.innerHTML = valueHtml || "";
    }
  }, [valueHtml]);

  const exec = (cmd: string) => {
    document.execCommand(cmd, false, undefined);
    handleInput();
  };

  const [snapshot, setSnapshot] = useState<string>("");
  const takeSnapshot = () => {
    const el = ref.current; if (!el) return; setSnapshot(el.innerHTML);
  };
  const revertSnapshot = () => {
    const el = ref.current; if (!el || !snapshot) return; el.innerHTML = snapshot; handleInput();
  };

  const mapWith = (s: string, upperStart: number, lowerStart: number, digitStart?: number) =>
    s
      .replace(/[A-Z]/g, c => String.fromCodePoint(upperStart + (c.charCodeAt(0) - 0x41)))
      .replace(/[a-z]/g, c => String.fromCodePoint(lowerStart + (c.charCodeAt(0) - 0x61)))
      .replace(/[0-9]/g, c => (digitStart != null ? String.fromCodePoint(digitStart + (c.charCodeAt(0) - 0x30)) : c));
  const toBold = (s: string) => mapWith(s, 0x1D400, 0x1D41A, 0x1D7CE);
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

  const applyStyleToSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const text = range.toString();
    if (!text) return;
    const transformer = (input: string) => {
      switch (style) {
        case "bold": return toBold(input);
        case "sansBold": return toSansBold(input);
        case "mono": return toMono(input);
        case "doubleStruck": return toDouble(input);
        case "fullwidth": return toFull(input);
        case "circled": return toCircled(input);
        case "smallCaps": return toSmallCaps(input);
        case "plain": default: return input;
      }
    };
    const replacement = document.createTextNode(transformer(text));
    range.deleteContents();
    range.insertNode(replacement);
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStartAfter(replacement);
    newRange.collapse(true);
    sel.addRange(newRange);
    handleInput();
  };

  const handleInput = () => {
    const el = ref.current;
    if (!el) return;
    onChangeHtml(el.innerHTML);
  };

  return (
    <div className="border-2 border-emerald-200 rounded-xl max-w-3xl mx-auto shadow-lg overflow-hidden">
      <div className="flex flex-wrap gap-2 p-4 border-b-2 border-emerald-200 items-center justify-center sticky top-0 bg-gradient-to-r from-emerald-50 to-teal-50 z-10">
        <button className="px-3 py-2 text-sm border-2 border-purple-200 rounded-lg hover:bg-purple-100 active:bg-purple-200 transition-all duration-200 font-semibold text-purple-700" type="button" title="Bold" onClick={() => exec("bold")}>𝐁</button>
        <button className="px-3 py-2 text-sm border-2 border-blue-200 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-all duration-200 font-semibold text-blue-700" type="button" title="Italic" onClick={() => exec("italic")}><i>I</i></button>
        <span className="text-sm font-semibold text-slate-700">✨ Style on selection:</span>
        <select value={style} onChange={(e)=> setStyle(e.target.value as any)} className="px-3 py-2 text-sm border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200">
          <option value="bold">Unicode Bold (Math)</option>
          <option value="sansBold">Sans Bold</option>
          <option value="mono">Monospace</option>
          <option value="doubleStruck">Double-struck</option>
          <option value="fullwidth">Fullwidth</option>
          <option value="circled">Circled</option>
          <option value="smallCaps">Small Caps</option>
          <option value="plain">Plain</option>
        </select>
        <button className="px-3 py-2 text-sm border-2 border-green-200 rounded-lg hover:bg-green-100 active:bg-green-200 transition-all duration-200 font-semibold text-green-700" type="button" onClick={applyStyleToSelection}>✨ Apply</button>
        <button className="px-3 py-2 text-sm border-2 border-orange-200 rounded-lg hover:bg-orange-100 active:bg-orange-200 transition-all duration-200 font-semibold text-orange-700" type="button" title="Snapshot" onClick={takeSnapshot}>💾 Save</button>
        <button className="px-3 py-2 text-sm border-2 border-red-200 rounded-lg hover:bg-red-100 active:bg-red-200 transition-all duration-200 font-semibold text-red-700" type="button" title="Revert" onClick={revertSnapshot}>↩️ Revert</button>
        <button className="px-3 py-2 text-sm border-2 border-teal-200 rounded-lg hover:bg-teal-100 active:bg-teal-200 transition-all duration-200 font-semibold text-teal-700" type="button" onClick={async ()=>{
          const el = ref.current; if(!el) return; await navigator.clipboard.writeText(el.innerText);
        }}>📋 Copy</button>
      </div>
      <div
        ref={ref}
        className="min-h-48 p-4 outline-none bg-white focus:bg-gradient-to-br focus:from-white focus:to-slate-50 transition-all duration-200"
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
      />
    </div>
  );
}

export function toUnicodeBoldFromHTML(htmlText: string) {
  // Convert <b>/<strong> ranges to bold Unicode while leaving others normal
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${htmlText}</div>`, "text/html");

  const mapWith = (s: string, upperStart: number, lowerStart: number, digitStart?: number) =>
    s
      .replace(/[A-Z]/g, c => String.fromCodePoint(upperStart + (c.charCodeAt(0) - 0x41)))
      .replace(/[a-z]/g, c => String.fromCodePoint(lowerStart + (c.charCodeAt(0) - 0x61)))
      .replace(/[0-9]/g, c => (digitStart != null ? String.fromCodePoint(digitStart + (c.charCodeAt(0) - 0x30)) : c));
  const boldMap = (s: string) => mapWith(s, 0x1D400, 0x1D41A, 0x1D7CE);

  const walk = (node: Node, isBold = false): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = (node.textContent ?? "");
      return isBold ? boldMap(txt) : txt;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const nextBold = isBold || el.tagName === "B" || el.tagName === "STRONG";
      let out = "";
      for (const child of Array.from(el.childNodes)) out += walk(child, nextBold);
      if (el.tagName === "BR") return "\n";
      return out;
    }
    return "";
  };

  const root = doc.body.firstChild as HTMLElement | null;
  if (!root) return "";
  return walk(root);
}


