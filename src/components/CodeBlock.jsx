import { useState } from 'react';

export default function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="code-box">
      <button type="button" className="copy-button" onClick={copy}>
        {copied ? 'Copiado ✓' : 'Copiar'}
      </button>
      <pre><code>{children.trim()}</code></pre>
    </div>
  );
}
