import { useMemo, useState } from "react";
import { compareTokens, contrastRatio, parseTokens, type ColorToken } from "./colors";

const sampleA = JSON.stringify({
  color: {
    text: { primary: { "$value": "#25352c", "$type": "color" }, muted: { "$value": "#66736a" } },
    surface: { base: { "$value": "#ffffff" }, accent: { "$value": "#d4f36a" } },
  },
}, null, 2);
const sampleB = JSON.stringify({
  color: {
    text: { primary: { "$value": "#35443b", "$type": "color" }, muted: { "$value": "#778178" } },
    surface: { base: { "$value": "#f6f7f4" }, accent: { "$value": "#c1e857" }, border: { "$value": "#deded8" } },
  },
}, null, 2);
const formatRatio = (ratio: number | null) => ratio === null ? "—" : ratio.toFixed(2) + ":1";

export default function App() {
  const [sourceA, setSourceA] = useState(sampleA);
  const [sourceB, setSourceB] = useState(sampleB);
  const [format, setFormat] = useState<"json" | "css">("json");
  const [foreground, setForeground] = useState("");
  const [background, setBackground] = useState("");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [theme, setTheme] = useState<"A" | "B">("A");

  const parsed = useMemo(() => {
    try {
      return { a: parseTokens(sourceA, format), b: parseTokens(sourceB, format) };
    } catch {
      return { a: [] as ColorToken[], b: [] as ColorToken[] };
    }
  }, [sourceA, sourceB, format, revision]);
  const tokens = theme === "A" ? parsed.a : parsed.b;
  const changes = useMemo(() => compareTokens(parsed.a, parsed.b), [parsed]);
  const foregroundToken = tokens.find((token) => token.name === foreground) ?? tokens[0];
  const backgroundToken = tokens.find((token) => token.name === background) ?? tokens[1] ?? tokens[0];
  const ratio = foregroundToken && backgroundToken
    ? contrastRatio(foregroundToken.value, backgroundToken.value)
    : null;

  async function importFile(file: File, side: "a" | "b") {
    const text = await file.text();
    if (side === "a") setSourceA(text);
    else setSourceB(text);
    setRevision((value) => value + 1);
    setError("");
  }

  function compare() {
    try {
      const nextA = parseTokens(sourceA, format);
      const nextB = parseTokens(sourceB, format);
      if (!nextA.length || !nextB.length) throw new Error("Não encontrei cores. Confira o formato e as cores.");
      setError("");
      setRevision((value) => value + 1);
      setForeground(nextA[0].name);
      setBackground(nextA[1]?.name ?? nextA[0].name);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tokens inválidos.");
    }
  }

  const levelAA = ratio !== null && ratio >= 4.5;
  const levelLarge = ratio !== null && ratio >= 3;
  const levelAAA = ratio !== null && ratio >= 7;
  const imports = [
    { side: "A", source: sourceA, setter: setSourceA },
    { side: "B", source: sourceB, setter: setSourceB },
  ];

  return (
    <main className="app">
      <header className="topbar"><a className="brand" href="./"><span className="brand-mark">◉</span> theme-contrast</a><span>Tokens de design · WCAG 2.2</span></header>
      <section className="hero"><p className="eyebrow">PALETA EM CONTEXTO</p><h1>Compare temas.<br /><em>Leia com confiança.</em></h1><p>Importe tokens, encontre diferenças e confira o contraste entre cores de texto e fundo.</p></section>
      <section className="import-grid" aria-label="Tokens para comparar">
        {imports.map(({ side, source, setter }) => (
          <article className="import-card" key={side}>
            <div className="card-head"><div><span className="side-tag">{side}</span><strong>Tema {side}</strong></div>
              <label className="load-button">Importar<input type="file" accept=".json,.css,text/css,application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file, side === "A" ? "a" : "b"); }} /></label>
            </div>
            <textarea aria-label={"Tokens tema " + side} spellCheck={false} value={source} onChange={(event) => setter(event.target.value)} />
          </article>
        ))}
      </section>
      <div className="actions"><label className="format-label">Formato
        <select value={format} onChange={(event) => setFormat(event.target.value as "json" | "css")}><option value="json">JSON de design tokens</option><option value="css">Propriedades CSS</option></select>
      </label><button className="primary" onClick={compare}>Comparar temas <span>→</span></button>{error && <span className="error-text" role="alert">{error}</span>}</div>
      <section className="results">
        <div className="result-card contrast-card">
          <div className="result-title"><div><p className="eyebrow">VERIFICADOR WCAG</p><h2>Contraste de texto</h2></div><div className="theme-toggle" role="group" aria-label="Tema do contraste"><button className={theme === "A" ? "selected" : ""} onClick={() => setTheme("A")}>Tema A</button><button className={theme === "B" ? "selected" : ""} onClick={() => setTheme("B")}>Tema B</button></div></div>
          <div className="selectors">
            <label>Texto<select value={foregroundToken?.name ?? ""} onChange={(event) => setForeground(event.target.value)}>{tokens.map((token) => <option value={token.name} key={token.name}>{token.name}</option>)}</select></label>
            <span className="versus">sobre</span>
            <label>Fundo<select value={backgroundToken?.name ?? ""} onChange={(event) => setBackground(event.target.value)}>{tokens.map((token) => <option value={token.name} key={token.name}>{token.name}</option>)}</select></label>
          </div>
          <div className="preview" style={{ color: foregroundToken?.value, backgroundColor: backgroundToken?.value }}><strong>Texto legível importa.</strong><span>Exemplo de texto sobre a cor selecionada.</span></div>
          <div className="ratio-row"><strong>{formatRatio(ratio)}</strong><span>razão de contraste</span><div className="checks"><span className={levelAA ? "pass" : "fail"}>AA normal {levelAA ? "✓" : "×"}</span><span className={levelLarge ? "pass" : "fail"}>AA grande {levelLarge ? "✓" : "×"}</span><span className={levelAAA ? "pass" : "fail"}>AAA normal {levelAAA ? "✓" : "×"}</span><span className={ratio !== null && ratio >= 4.5 ? "pass" : "fail"}>AAA grande {ratio !== null && ratio >= 4.5 ? "✓" : "×"}</span></div></div>
          <p className="note">AA: 4,5:1 para texto normal, 3:1 para texto grande. Cores com transparência ou formato não reconhecido são ignoradas.</p>
        </div>
        <div className="result-card diff-card"><div className="result-title"><div><p className="eyebrow">MUDANÇAS ENTRE A E B</p><h2>Comparação de tokens</h2></div><span className="diff-count">{changes.length} diferenças</span></div>
          {changes.length === 0 ? <p className="no-diff">{tokens.length ? "Os dois temas têm os mesmos valores." : "Importe tokens para ver a comparação."}</p> :
            <ul className="changes">{changes.map((change) => <li key={change.name}><div className="change-name"><span className={"change-kind " + change.kind}>{change.kind === "added" ? "+" : change.kind === "removed" ? "−" : "↔"}</span><code>{change.name}</code></div><div className="swatches">{change.before && <span><i style={{ background: change.before }} />{change.before}</span>}{change.after && <span><i style={{ background: change.after }} />{change.after}</span>}</div></li>)}</ul>}
        </div>
      </section>
      <footer>Razões calculadas pela fórmula de luminância relativa WCAG. A visualização serve de apoio à revisão.</footer>
    </main>
  );
}

