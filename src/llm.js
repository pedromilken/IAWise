/* IAWise - tutor com LLM (traga sua própria chave).
   A chave fica só no localStorage deste navegador (chave "iawise-llm") e vai direto do navegador para a API do provedor;
   nada passa por servidor do jogo. Provedores OpenAI-compatíveis usam o mesmo formato de chat. */
const LLM_KEY = "iawise-llm";
const PROVIDERS = {
  anthropic: { name: "Anthropic (Claude)", model: "claude-sonnet-4-5", url: "https://api.anthropic.com/v1/messages", kind: "anthropic" },
  openai:    { name: "OpenAI (GPT)", model: "gpt-4o-mini", url: "https://api.openai.com/v1/chat/completions", kind: "openai" },
  google:    { name: "Google (Gemini)", model: "gemini-2.0-flash", url: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", kind: "google" },
  deepseek:  { name: "DeepSeek", model: "deepseek-chat", url: "https://api.deepseek.com/chat/completions", kind: "openai" },
  groq:      { name: "Groq (Llama, Meta)", model: "llama-3.3-70b-versatile", url: "https://api.groq.com/openai/v1/chat/completions", kind: "openai" },
  mistral:   { name: "Mistral", model: "mistral-small-latest", url: "https://api.mistral.ai/v1/chat/completions", kind: "openai" },
  openrouter:{ name: "OpenRouter (vários)", model: "meta-llama/llama-3.3-70b-instruct", url: "https://openrouter.ai/api/v1/chat/completions", kind: "openai" },
  custom:    { name: "OpenAI-compatível (URL própria)", model: "", url: "", kind: "openai" }
};
const LLM = {
  cfg() { try { return Object.assign({ provider: "anthropic", key: "", model: "", url: "" }, JSON.parse(localStorage.getItem(LLM_KEY) || "{}")); } catch (e) { return { provider: "anthropic", key: "", model: "", url: "" }; } },
  save(c) { try { localStorage.setItem(LLM_KEY, JSON.stringify(c)); } catch (e) { } },
  ready() { const c = LLM.cfg(); return !!c.key && (c.provider !== "custom" || !!c.url); },
  /* messages: [{role:"user"|"assistant", content}] ; devolve o texto da resposta */
  async chat(system, messages) {
    const c = LLM.cfg(), P = PROVIDERS[c.provider] || PROVIDERS.anthropic, model = c.model || P.model, url = c.provider === "custom" ? c.url : P.url;
    let r, data;
    if (P.kind === "anthropic") {
      r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "x-api-key": c.key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model, max_tokens: 700, system, messages }) });
      data = await r.json(); if (!r.ok) throw new Error(data.error && data.error.message || r.status);
      return data.content.filter(x => x.type === "text").map(x => x.text).join("\n");
    }
    if (P.kind === "google") {
      r = await fetch(url.replace("{model}", model) + "?key=" + encodeURIComponent(c.key), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })), generationConfig: { maxOutputTokens: 700 } }) });
      data = await r.json(); if (!r.ok) throw new Error(data.error && data.error.message || r.status);
      return data.candidates[0].content.parts.map(p => p.text).join("\n");
    }
    r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "authorization": "Bearer " + c.key }, body: JSON.stringify({ model, max_tokens: 700, messages: [{ role: "system", content: system }, ...messages] }) });
    data = await r.json(); if (!r.ok) throw new Error(data.error && (data.error.message || data.error) || r.status);
    return data.choices[0].message.content;
  }
};
