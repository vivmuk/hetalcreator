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
    <div className="border rounded max-w-3xl mx-auto">
      <div className="flex flex-wrap gap-2 p-2 border-b items-center justify-center sticky top-0 bg-white z-10">
        <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100 active:bg-gray-200" type="button" title="Bold" onClick={() => exec("bold")}>𝐁</button>
        <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100 active:bg-gray-200" type="button" title="Italic" onClick={() => exec("italic")}><i>I</i></button>
        <span className="text-sm text-gray-600">Style on selection:</span>
        <select value={style} onChange={(e)=> setStyle(e.target.value as any)} className="px-2 py-1 text-sm border rounded hover:bg-gray-50">
          <option value="bold">Unicode Bold (Math)</option>
          <option value="sansBold">Sans Bold</option>
          <option value="mono">Monospace</option>
          <option value="doubleStruck">Double-struck</option>
          <option value="fullwidth">Fullwidth</option>
          <option value="circled">Circled</option>
          <option value="smallCaps">Small Caps</option>
          <option value="plain">Plain</option>
        </select>
        <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100 active:bg-gray-200" type="button" onClick={applyStyleToSelection}>Apply</button>
        <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100 active:bg-gray-200" type="button" title="Snapshot" onClick={takeSnapshot}>Save</button>
        <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100 active:bg-gray-200" type="button" title="Revert" onClick={revertSnapshot}>Revert</button>
        <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100 active:bg-gray-200" type="button" onClick={async ()=>{
          const el = ref.current; if(!el) return; await navigator.clipboard.writeText(el.innerText);
        }}>Copy</button>
      </div>
      <div
        ref={ref}
        className="min-h-40 p-3 outline-none"
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


