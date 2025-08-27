type GenerateBody = {
  prompt?: string;
  audience?: string;
  askAI?: boolean;
  modelSize?: "small" | "medium" | "large" | "creative";
  words?: number;
};

type VeniceMessage = { role: "user" | "system" | "assistant"; content: string };

function chooseModel(modelSize?: "small" | "medium" | "large" | "creative") {
  const map = {
    small: "qwen3-4b", // Venice Small - fast, efficient (4B params)
    medium: "mistral-31-24b", // Venice Medium - balanced, vision capable (24B params)
    large: "qwen3-235b", // Venice Large - highest quality (235B params)
    creative: "venice-uncensored", // Venice Uncensored - for creative/unrestricted content
  } as const;
  return map[modelSize ?? "medium"];
}

async function callVenice(messages: VeniceMessage[], model: string, maxTokens = 1200) {
  const res = await fetch("https://api.venice.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ntmhtbP2fr_pOQsmuLPuN_nm6lm2INWKiNcvrdEfEC`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: maxTokens,
      n: 1,
      stream: false,
      venice_parameters: {
        strip_thinking_response: true
      }
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Venice API error: ${res.status} ${text}`);
  }
  const data = (await res.json()) as any;
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  return content ?? "";
}

function replaceBoldTagsWithUnicode(input: string) {
  // Convert <b>...</b> to Unicode bold, remove all other HTML, strip asterisks
  const mapWith = (s: string, upperStart: number, lowerStart: number, digitStart?: number) =>
    s
      .replace(/[A-Z]/g, c => String.fromCodePoint(0x1D400 + (c.charCodeAt(0) - 0x41)))
      .replace(/[a-z]/g, c => String.fromCodePoint(0x1D41A + (c.charCodeAt(0) - 0x61)))
      .replace(/[0-9]/g, c => (digitStart != null ? String.fromCodePoint(0x1D7CE + (c.charCodeAt(0) - 0x30)) : c));

  const boldify = (s: string) => mapWith(s, 0x1D400, 0x1D41A, 0x1D7CE);

  let out = input.replace(/\r/g, "");
  out = out.replace(/\*/g, "");
  out = out.replace(/<br\s*\/?>(?=\n?)/gi, "\n");
  out = out.replace(/<\/(p|div)>/gi, "\n\n");
  // Replace bold tags with unicode
  out = out.replace(/<\s*b\s*>\s*([\s\S]*?)\s*<\s*\/\s*b\s*>/gi, (_, g1: string) => boldify(g1));
  out = out.replace(/<\s*strong\s*>\s*([\s\S]*?)\s*<\s*\/\s*strong\s*>/gi, (_, g1: string) => boldify(g1));
  // Strip remaining HTML tags
  out = out.replace(/<[^>]+>/g, "");
  // Collapse excessive blank lines
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

export async function generateLinkedInPost(body: GenerateBody) {
  const { prompt = "", audience, askAI = true, modelSize = "medium", words = 160 } = body;
  const finalAudience = audience?.trim() || "professionals";
  const model = chooseModel(modelSize);

  let baseText = prompt.trim();
  if (askAI || !baseText) {
    const topic = baseText || "the topic";
    const system = `You are writing a ${words}-word LinkedIn post about "${topic}" for "${finalAudience}". Stay focused on this exact topic and audience.`;
    
    const user = [
      `Write a LinkedIn post about ${topic} specifically for ${finalAudience}.`,
      "",
      `- Write exactly ${words} words`,
      "- Use <b>text</b> for 2-3 key phrases",
      "- Add 3-5 relevant hashtags at the end",
      "- Make it practical and specific to the audience"
    ].join("\n");
    
    const variantsText = await callVenice([
      { role: "system", content: system },
      { role: "user", content: user },
    ], model);
    
    const v = variantsText.trim();
    // Convert markdown bold to HTML bold for the editor and subsequent processing
    const textWithHtmlBold = v.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*/g, '');
    const sanitizedPlain = v.replace(/\*/g, "").replace(/<[^>]+>/g, (m) => /<br\s*\/?/i.test(m) ? "\n" : "").replace(/\n{3,}/g, "\n\n").trim();
    const unicodeBold = replaceBoldTagsWithUnicode(textWithHtmlBold);
    const evaluated = [{ text: textWithHtmlBold, plain: sanitizedPlain, unicodeBold }];

    return {
      variants: evaluated,
      model,
      modelSize,
      words,
    };
  }

  return {
    variants: [],
    model,
    modelSize,
    words,
  };
}
