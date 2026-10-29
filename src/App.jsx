import { useEffect, useMemo, useState } from 'react';
import CodeBlock from './components/CodeBlock.jsx';
import Quiz from './components/Quiz.jsx';
import TemperatureChart from './components/TemperatureChart.jsx';
import {
  compareEdges,
  filterDateRange,
  formatTemperature,
  parseGistempCsv,
  prepareGistempData,
} from './lib/gistemp.js';

const TOTAL_STEPS = 10;

function Stat({ label, value, note }) {
  return (
    <article className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

function NavStep({ number, children }) {
  return (
    <div className="nav-step">
      <span className="nav-step-num">{number}</span>
      <div className="nav-step-body">{children}</div>
    </div>
  );
}

function UrlBox({ url }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="url-box">
      <code>{url}</code>
      <button type="button" onClick={copy}>{copied ? '✓ Copiado' : 'Copiar'}</button>
    </div>
  );
}

export default function App() {
  const [rawData, setRawData] = useState([]);
  const [data, setData] = useState([]);
  const [baseline, setBaseline] = useState(Number.NaN);
  const [status, setStatus] = useState('Cargando la copia didáctica…');
  const [csvPreview, setCsvPreview] = useState('');
  const [startDate, setStartDate] = useState('1926-01');
  const [endDate, setEndDate] = useState('');
  const [completed, setCompleted] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('gistemp-react-progress') || '[]'));
    } catch {
      return new Set();
    }
  });

  function markStep(step) {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(step);
      localStorage.setItem('gistemp-react-progress', JSON.stringify([...next]));
      return next;
    });
  }

  function toggleStep(step, checked) {
    setCompleted((prev) => {
      const next = new Set(prev);
      checked ? next.add(step) : next.delete(step);
      localStorage.setItem('gistemp-react-progress', JSON.stringify([...next]));
      return next;
    });
  }

  function processCsv(text, sourceLabel) {
    const parsed = parseGistempCsv(text);
    const prepared = prepareGistempData(parsed);
    setRawData(parsed);
    setData(prepared.visualizationData);
    setBaseline(prepared.baseline1880_1900);
    setEndDate(prepared.visualizationData.at(-1)?.date ?? '');
    setCsvPreview(text.split(/\r?\n/).slice(0, 12).join('\n'));
    setStatus(`✓ ${sourceLabel}: ${parsed.length.toLocaleString('es-CO')} meses válidos.`);
    markStep(5);
  }

  useEffect(() => {
    fetch('/data/gistemp_global_monthly_subset.csv')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => processCsv(text, 'Copia didáctica cargada'))
      .catch((e) => setStatus(`No fue posible cargar el CSV: ${e.message}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rangeData = useMemo(
    () => (startDate && endDate ? filterDateRange(data, startDate, endDate) : []),
    [data, startDate, endDate],
  );
  const comparison = useMemo(() => compareEdges(rangeData, 12), [rangeData]);
  const progress = Math.round((completed.size / TOTAL_STEPS) * 100);

  async function handleCsvUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      processCsv(await file.text(), `Archivo ${file.name} cargado`);
    } catch (e) {
      setStatus(`Error leyendo ${file.name}: ${e.message}`);
    }
  }

  function downloadProcessedJson() {
    const payload = {
      metadata: {
        source: 'NASA GISS/GISTEMP v4',
        originalBaseline: '1951-1980',
        derivedBaseline: 'promedio 1880-1900 de la misma serie',
        baselineOffset: baseline,
      },
      data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gistemp_procesado_1926_presente.json';
    link.click();
    URL.revokeObjectURL(url);
    markStep(10);
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">GISTEMP → React</div>
        <p className="sidebar-copy">Tutorial interactivo<br />Termómetro de la Tierra</p>
        <nav>
          <a href="#step-1">1. ¿Qué es GISTEMP?</a>
          <a href="#step-2">2. Navegar el sitio NASA</a>
          <a href="#step-3">3. Descargar el CSV</a>
          <a href="#step-4">4. Entender el formato</a>
          <a href="#step-5">5. Cargar en React</a>
          <a href="#step-6">6. Parsear</a>
          <a href="#step-7">7. Línea base</a>
          <a href="#step-8">8. Explorar</a>
          <a href="#step-9">9. Comprobar</a>
          <a href="#step-10">10. Exportar</a>
        </nav>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="sidebar-copy">{progress}% completado</p>
      </aside>

      <main className="content">
        <header className="hero">
          <p className="kicker">Arquitectura de Sistemas Multimedia</p>
          <h1>De NASA GISTEMP a React</h1>
          <p className="lead">
            Guía completa paso a paso para obtener, descargar, interpretar, transformar y
            visualizar la serie global mensual de temperatura superficial de NASA GISS en
            una aplicación web React. Sin Python, sin backend.
          </p>
          <div className="chips">
            <span>React 18</span><span>Vite</span><span>JavaScript</span>
            <span>Canvas API</span><span>Sin Python</span>
          </div>
        </header>

        {/* ── PASO 1 ─────────────────────────────────────────────────── */}
        <section id="step-1" className="step">
          <p className="kicker">Paso 1 de 10</p>
          <h2>¿Qué es NASA GISTEMP y qué mide?</h2>
          <p>
            El <strong>Instituto Goddard de Estudios Espaciales de la NASA (GISS)</strong>,
            ubicado en Nueva York, mantiene uno de los registros históricos de temperatura
            superficial más importantes del mundo.
          </p>

          <div className="two-columns">
            <div className="card">
              <h3>GISS — Goddard Institute for Space Studies</h3>
              <p>Laboratorio de la NASA dedicado al estudio del clima y la Tierra. Fundado en 1961. Publica datos de temperatura desde 1880 hasta el mes más reciente disponible.</p>
            </div>
            <div className="card">
              <h3>GISTEMP v4 — Surface Temperature Analysis</h3>
              <p>Combina mediciones de estaciones terrestres (GHCN-M) con temperatura superficial del océano (ERSST v5) para producir un índice global mensual.</p>
            </div>
          </div>

          <h3>¿Qué es una anomalía de temperatura?</h3>
          <p>
            GISTEMP <strong>no publica la temperatura absoluta</strong> del planeta.
            En cambio publica <em>anomalías</em>: la desviación respecto a un período de referencia.
          </p>
          <div className="callout">
            <strong>Fórmula:</strong> Anomalía = Temperatura observada − Promedio del período de referencia (1951–1980)
          </div>

          <div className="two-columns">
            <div className="card">
              <h3>Ventajas de las anomalías</h3>
              <ul>
                <li>Eliminan sesgos geográficos (Siberia vs. Sahara)</li>
                <li>Permiten combinar estaciones con historial distinto</li>
                <li>Son comparables globalmente</li>
                <li>0.00 °C no significa "frío", significa "igual a la referencia"</li>
              </ul>
            </div>
            <div className="card">
              <h3>Ejemplo concreto</h3>
              <p>
                Si la temperatura media de julio global fue <strong>+0.80 °C</strong> sobre el
                promedio de julio en 1951–1980, ese mes registra una anomalía de{' '}
                <strong>+0.80 °C</strong>.
              </p>
              <p>GISTEMP agrega miles de estaciones y produce un único número mensual para toda la Tierra.</p>
            </div>
          </div>

          <h3>¿Qué versión usaremos?</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Cubre</th><th>Referencia</th><th>Usaremos</th></tr>
              </thead>
              <tbody>
                <tr className="highlight-row">
                  <td><strong>L-OTI v4</strong></td>
                  <td>Tierra + Océano</td>
                  <td>1951–1980</td>
                  <td>✓ Este</td>
                </tr>
                <tr>
                  <td>LSAT v4</td>
                  <td>Solo tierra</td>
                  <td>1951–1980</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td>SST v4</td>
                  <td>Solo océano</td>
                  <td>1951–1980</td>
                  <td>No</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong>L-OTI</strong> = <em>Land-Ocean Temperature Index</em>. Es el índice
            combinado más citado en informes del IPCC y en los medios de comunicación.
          </p>

          <label className="done">
            <input
              type="checkbox"
              checked={completed.has(1)}
              onChange={(e) => toggleStep(1, e.target.checked)}
            />
            Entiendo la diferencia entre anomalía de temperatura y temperatura absoluta.
          </label>
        </section>

        {/* ── PASO 2 ─────────────────────────────────────────────────── */}
        <section id="step-2" className="step">
          <p className="kicker">Paso 2 de 10</p>
          <h2>Navegar al sitio oficial de NASA GISTEMP</h2>
          <p>Sigue estos pasos exactos en tu navegador para llegar a la página de descargas.</p>

          <div className="nav-steps">
            <NavStep number="1">
              <strong>Abre tu navegador</strong> (Chrome, Firefox, Safari o Edge) y escribe
              la siguiente dirección en la barra de URL:
              <UrlBox url="https://data.giss.nasa.gov/gistemp/" />
              <p>
                También puedes buscar en Google:{' '}
                <code>NASA GISTEMP surface temperature data</code>. El primer resultado
                oficial debe llevar a esta misma dirección.
              </p>
            </NavStep>

            <NavStep number="2">
              <strong>Verifica que llegaste al sitio correcto.</strong> La página debe
              mostrar esta cabecera:
              <div className="page-mockup">
                <div className="mockup-url">🔒 data.giss.nasa.gov/gistemp/</div>
                <div className="mockup-content">
                  <div className="mockup-h1">GISS Surface Temperature Analysis (GISTEMP v4)</div>
                  <div className="mockup-body">
                    The GISS Surface Temperature Analysis ver. 4 (GISTEMP v4) is an estimate
                    of global surface temperature change.
                  </div>
                </div>
              </div>
            </NavStep>

            <NavStep number="3">
              <strong>Desplázate hacia abajo</strong> hasta encontrar la sección:
              <div className="page-mockup">
                <div className="mockup-content">
                  <div className="mockup-section-title">
                    Combined Land-Surface Air and Sea-Surface Water Temperature Anomalies
                    (Land-Ocean Temperature Index, L-OTI)
                  </div>
                  <div className="mockup-subsection">
                    Tables of Global and Hemispheric Monthly Means and Zonal Annual Means
                  </div>
                </div>
              </div>
              Esta sección contiene el índice L-OTI combinado de tierra y océano que usaremos.
            </NavStep>

            <NavStep number="4">
              <strong>Localiza la tabla de archivos disponibles</strong> dentro de esa
              sección. Busca específicamente la fila que describe los datos globales:
              <div className="page-mockup">
                <div className="mockup-content">
                  <div className="mockup-table-row">
                    <span>Global-Mean Monthly, Seasonal, and Annual Means, 1880-present, updated through most recent month:</span>
                    <span className="mockup-links">TXT &nbsp;<span className="mockup-highlight">CSV ← clic aquí</span></span>
                  </div>
                  <div className="mockup-table-row muted">
                    <span>Northern Hemisphere Monthly Means…</span>
                    <span className="mockup-links">TXT &nbsp; CSV</span>
                  </div>
                  <div className="mockup-table-row muted">
                    <span>Southern Hemisphere Monthly Means…</span>
                    <span className="mockup-links">TXT &nbsp; CSV</span>
                  </div>
                </div>
              </div>
              Haz clic en el enlace <strong>CSV</strong> de la primera fila (Global-Mean).
              El archivo comenzará a descargarse de inmediato.
            </NavStep>

            <NavStep number="5">
              <strong>Localiza el archivo descargado.</strong> Se llama{' '}
              <code>GLB.Ts+dSST.csv</code> y debería aparecer en tu carpeta de descargas:
              <div className="folder-tree">
                <pre>{`Mac / Linux:  ~/Downloads/GLB.Ts+dSST.csv\nWindows:     C:\\Users\\TuNombre\\Downloads\\GLB.Ts+dSST.csv`}</pre>
              </div>
            </NavStep>
          </div>

          <div className="callout tip">
            <strong>¿El sitio de NASA no carga?</strong> Los servidores de datos de la NASA
            pueden estar en mantenimiento. En ese caso, usa la copia didáctica incluida en
            este tutorial — se carga automáticamente al abrir la aplicación y contiene los
            mismos datos hasta 2026-09.
          </div>

          <label className="done">
            <input
              type="checkbox"
              checked={completed.has(2)}
              onChange={(e) => toggleStep(2, e.target.checked)}
            />
            Encontré la sección "L-OTI" en el sitio de NASA GISTEMP y sé dónde hacer clic.
          </label>
        </section>

        {/* ── PASO 3 ─────────────────────────────────────────────────── */}
        <section id="step-3" className="step">
          <p className="kicker">Paso 3 de 10</p>
          <h2>Identificar y descargar el archivo correcto</h2>

          <h3>¿Qué significa el nombre del archivo?</h3>
          <div className="card">
            <code className="filename-big">GLB.Ts+dSST.csv</code>
            <div className="filename-breakdown">
              <div><code>GLB</code> → <strong>Global</strong>: promedio de toda la superficie terrestre</div>
              <div><code>Ts</code> → <strong>Temperature Surface</strong>: estaciones terrestres (GHCN-M)</div>
              <div><code>+dSST</code> → <strong>+ delta Sea Surface Temperature</strong>: componente oceánico (ERSST v5)</div>
              <div><code>.csv</code> → <strong>Comma-Separated Values</strong>: texto plano, legible en cualquier herramienta</div>
            </div>
          </div>

          <h3>URL directa de descarga</h3>
          <p>Si quieres acceder directamente al archivo sin navegar toda la página:</p>
          <UrlBox url="https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv" />

          <div className="callout warning">
            <strong>Nota sobre CORS:</strong> No puedes hacer <code>fetch()</code> directamente
            a esa URL desde el navegador porque los servidores de NASA no envían la cabecera{' '}
            <code>Access-Control-Allow-Origin</code>. Debes descargar el archivo manualmente y
            colocarlo en tu proyecto (ver Paso 5).
          </div>

          <h3>Otros archivos disponibles en la misma sección</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Archivo</th><th>Descripción</th><th>¿Usamos?</th></tr>
              </thead>
              <tbody>
                <tr className="highlight-row">
                  <td><code>GLB.Ts+dSST.csv</code></td>
                  <td>Global — tierra + océano combinados (L-OTI)</td>
                  <td>✓ Este</td>
                </tr>
                <tr>
                  <td><code>GLB.Ts.csv</code></td>
                  <td>Global — solo superficie terrestre (LSAT)</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td><code>NH.Ts+dSST.csv</code></td>
                  <td>Hemisferio Norte — tierra + océano</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td><code>SH.Ts+dSST.csv</code></td>
                  <td>Hemisferio Sur — tierra + océano</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td><code>ZonAnn.Ts+dSST.csv</code></td>
                  <td>Medias anuales por banda de latitud</td>
                  <td>No</td>
                </tr>
              </tbody>
            </table>
          </div>

          <label className="done">
            <input
              type="checkbox"
              checked={completed.has(3)}
              onChange={(e) => toggleStep(3, e.target.checked)}
            />
            Descargué GLB.Ts+dSST.csv y entiendo qué significa cada parte del nombre.
          </label>
        </section>

        {/* ── PASO 4 ─────────────────────────────────────────────────── */}
        <section id="step-4" className="step">
          <p className="kicker">Paso 4 de 10</p>
          <h2>Entender el formato del archivo CSV</h2>
          <p>
            Antes de escribir una sola línea de código, es esencial entender la estructura
            del archivo. Ábrelo con VS Code, Notepad++ o cualquier editor de texto plano.
          </p>

          <h3>Así se ve el archivo real de NASA</h3>
          <pre className="preview"><code>{`GISTEMP v4: Global-mean monthly, seasonal, and annual means, 1880-present

Year,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,J-D,D-N,DJF,MAM,JJA,SON
1880,-0.17,-0.27,-0.07,-0.15,-0.09,-0.20,-0.17,-0.09,-0.13,-0.22,-0.21,-0.17,-0.15,-0.17,***,-0.10,-0.15,-0.19
1881,-0.19,-0.13, 0.04, 0.06, 0.07,-0.18, 0.01,-0.03,-0.14,-0.21,-0.18,-0.06,-0.08,-0.07,-0.21, 0.06,-0.07,-0.18
1882, 0.17, 0.14, 0.05,-0.15,-0.13,-0.21,-0.15,-0.07,-0.14,-0.22,-0.16,-0.35,-0.10,-0.10,-0.08,-0.08,-0.14,-0.17
...
2024, 0.97, 1.29, 1.35, 1.40, 1.34, 1.32, 1.22, 1.28, 1.56, 1.50, 1.46, 1.21, 1.32, 1.34, 1.27, 1.36, 1.27, 1.51`}</code></pre>

          <h3>Anatomía línea por línea</h3>
          <div className="nav-steps">
            <NavStep number="1">
              <strong>Línea 1 — Título del conjunto de datos.</strong><br />
              <code>GISTEMP v4: Global-mean monthly, seasonal, and annual means…</code><br />
              Esta línea <em>no tiene columnas CSV</em>. Es texto libre de descripción.
              El parser debe detectarla y saltarla.
            </NavStep>
            <NavStep number="2">
              <strong>Línea 2 — En blanco.</strong><br />
              Separador entre el título y los datos. El parser también la ignora.
            </NavStep>
            <NavStep number="3">
              <strong>Línea 3 — Encabezados de columnas.</strong><br />
              <code>Year,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,J-D,D-N,DJF,MAM,JJA,SON</code><br />
              Esta es la línea clave: el parser la detecta buscando <code>Year,</code> al inicio.
              A partir de aquí comienzan los datos reales.
            </NavStep>
            <NavStep number="4">
              <strong>Líneas 4 en adelante — Datos.</strong><br />
              Una fila por año, comenzando en 1880. La última fila corresponde al mes más
              reciente actualizado por NASA (normalmente el mes anterior al actual).
            </NavStep>
          </div>

          <h3>Significado de cada columna</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Columna</th><th>Qué representa</th><th>¿Usamos?</th></tr>
              </thead>
              <tbody>
                <tr><td><code>Year</code></td><td>Año (entero, 1880–presente)</td><td>✓ Sí</td></tr>
                <tr className="highlight-row">
                  <td><code>Jan – Dec</code></td>
                  <td>Anomalía mensual en °C relativa a 1951–1980</td>
                  <td>✓ Estas 12 columnas</td>
                </tr>
                <tr><td><code>J-D</code></td><td>Media anual enero–diciembre</td><td>No — la calculamos</td></tr>
                <tr><td><code>D-N</code></td><td>Media dic. del año anterior a nov. actual</td><td>No</td></tr>
                <tr><td><code>DJF</code></td><td>Invierno boreal (Dic–Ene–Feb)</td><td>No</td></tr>
                <tr><td><code>MAM</code></td><td>Primavera boreal (Mar–Abr–May)</td><td>No</td></tr>
                <tr><td><code>JJA</code></td><td>Verano boreal (Jun–Jul–Ago)</td><td>No</td></tr>
                <tr><td><code>SON</code></td><td>Otoño boreal (Sep–Oct–Nov)</td><td>No</td></tr>
              </tbody>
            </table>
          </div>

          <div className="callout warning">
            <strong>Valores faltantes — <code>***</code>:</strong> Cuando una celda contiene{' '}
            <code>***</code> no hay dato disponible para ese período (por ejemplo, 1880 no
            tiene D-N porque necesitaría diciembre de 1879). <strong>Nunca conviertas{' '}
            <code>***</code> en cero</strong>: 0.00 °C es un valor real y significativo que
            indica temperatura igual a la referencia 1951–1980.
          </div>

          <div className="two-columns">
            <div className="card">
              <h3>Unidades: grados Celsius (°C)</h3>
              <p>Los valores se publican con 2 decimales de precisión. Un valor de{' '}
              <code>1.35</code> significa 1.35 °C por encima del promedio 1951–1980 de ese mes.</p>
            </div>
            <div className="card">
              <h3>Referencia: 1951–1980</h3>
              <p>El valor 0.00 corresponde al promedio mensual en ese período. Un valor
              negativo indica un mes más frío que ese promedio histórico.</p>
            </div>
          </div>

          <label className="done">
            <input
              type="checkbox"
              checked={completed.has(4)}
              onChange={(e) => toggleStep(4, e.target.checked)}
            />
            Puedo identificar la línea de encabezados, las 12 columnas mensuales y qué significa <code>***</code>.
          </label>
        </section>

        {/* ── PASO 5 ─────────────────────────────────────────────────── */}
        <section id="step-5" className="step">
          <p className="kicker">Paso 5 de 10</p>
          <h2>Colocar el CSV en el proyecto React y cargarlo</h2>

          <h3>¿Dónde guardar el archivo en el proyecto?</h3>
          <p>
            En un proyecto Vite la carpeta <code>public/</code> contiene archivos estáticos
            que el servidor sirve directamente. Es el lugar correcto para datos que el
            navegador descargará sin procesamiento adicional.
          </p>
          <div className="folder-tree">
            <pre>{`mi-proyecto-react/
├── public/
│   └── data/
│       └── GLB.Ts+dSST.csv   ←  pegar aquí el archivo descargado
├── src/
│   ├── App.jsx
│   └── ...
└── package.json`}</pre>
          </div>

          <div className="callout tip">
            <strong>¿Por qué <code>public/</code> y no <code>src/</code>?</strong> Los archivos
            en <code>src/</code> son procesados por Vite (compilados, empaquetados). Un CSV
            de datos no necesita compilación: va en <code>public/</code> y queda accesible
            en la URL <code>/data/GLB.Ts+dSST.csv</code>.
          </div>

          <h3>Cargar el CSV con <code>fetch()</code></h3>
          <p>Usa <code>useEffect</code> con un array vacío para cargar el archivo una única vez al montar el componente:</p>
          <CodeBlock>{`
import { useEffect, useState } from 'react';

function App() {
  const [csvText, setCsvText] = useState('');

  useEffect(() => {
    fetch('/data/GLB.Ts+dSST.csv')
      .then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
      })
      .then(text => setCsvText(text))
      .catch(error => console.error('Error al cargar CSV:', error.message));
  }, []); // [] = solo se ejecuta al montar, nunca al actualizar

  // Mostrar las primeras 3 líneas como comprobación
  return <pre>{csvText.split('\\n').slice(0, 3).join('\\n')}</pre>;
}
          `}</CodeBlock>

          <h3>Estado actual de la copia didáctica incluida</h3>
          <p className="status">{status}</p>
          <pre className="preview"><code>{csvPreview || 'Esperando datos…'}</code></pre>

          <h3>Probar con el archivo real de NASA</h3>
          <div className="card">
            <h3>Cargar tu propio CSV descargado</h3>
            <p>
              Si ya descargaste <code>GLB.Ts+dSST.csv</code> puedes cargarlo aquí directamente
              para verificar que el parser funciona con el formato original de NASA (que incluye
              las columnas estacionales extra):
            </p>
            <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} />
          </div>

          <label className="done">
            <input
              type="checkbox"
              checked={completed.has(5)}
              onChange={(e) => toggleStep(5, e.target.checked)}
            />
            Entiendo cómo colocar el CSV en <code>public/data/</code> y cargarlo con <code>fetch()</code>.
          </label>
        </section>

        {/* ── PASO 6 ─────────────────────────────────────────────────── */}
        <section id="step-6" className="step">
          <p className="kicker">Paso 6 de 10</p>
          <h2>Transformar la tabla CSV en una serie temporal mensual</h2>
          <p>
            El CSV tiene <strong>una fila por año</strong>. Necesitamos convertirlo en una
            lista de objetos, uno por mes, para poder graficar y filtrar por fecha.
          </p>

          <h3>Función de parsing completa</h3>
          <CodeBlock>{`
// src/lib/gistemp.js
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                'Jul','Aug','Sep','Oct','Nov','Dec'];

function parseGistempCsv(csvText) {
  const lines = csvText
    .split(/\\r?\\n/)          // soporta Windows (\\r\\n) y Unix (\\n)
    .map(line => line.trim())
    .filter(Boolean);         // eliminar líneas en blanco

  // Buscar la línea que empieza con "Year,"
  // (salta el título y la línea en blanco del archivo NASA)
  const headerIndex = lines.findIndex(
    line => line.startsWith('Year,')
  );
  if (headerIndex === -1) throw new Error('Formato no reconocido');

  const headers = lines[headerIndex].split(',');
  const monthlyData = [];

  for (const line of lines.slice(headerIndex + 1)) {
    const values = line.split(',');
    const row = Object.fromEntries(
      headers.map((h, i) => [h.trim(), values[i]?.trim()])
    );

    const year = Number(row.Year);
    if (!Number.isInteger(year)) continue; // saltar filas no numéricas

    MONTHS.forEach((monthName, monthIndex) => {
      const raw = row[monthName];

      // *** = dato faltante → omitir completamente, NUNCA usar 0
      if (!raw || raw.includes('*')) return;

      const anomaly = Number(raw);
      if (!Number.isFinite(anomaly)) return;

      monthlyData.push({
        year,
        month: monthIndex + 1,
        // padStart asegura "1926-01" en lugar de "1926-1"
        // esto permite ordenar y comparar como texto simple
        date: year + '-' + String(monthIndex + 1).padStart(2, '0'),
        anomaly1951_1980: anomaly,
      });
    });
  }

  return monthlyData; // array de { year, month, date, anomaly1951_1980 }
}
          `}</CodeBlock>

          <div className="callout">
            <strong>¿Por qué <code>padStart(2, '0')</code>?</strong> Para que enero de 1926
            quede como <code>"1926-01"</code> y no <code>"1926-1"</code>. Con el formato
            ISO YYYY-MM, comparar fechas como texto funciona correctamente (comparación
            lexicográfica), sin necesitar objetos Date ni librerías externas.
          </div>

          <h3>Resultado del parsing en este momento</h3>
          <div className="stats">
            <Stat label="Meses válidos cargados" value={rawData.length.toLocaleString('es-CO')} />
            <Stat label="Primera observación" value={rawData[0]?.date ?? '—'} />
            <Stat label="Última observación" value={rawData.at(-1)?.date ?? '—'} />
            <Stat label="Offset base 1880–1900" value={formatTemperature(baseline)} note="respecto a NASA 1951–1980" />
          </div>

          <label className="done">
            <input
              type="checkbox"
              checked={completed.has(6)}
              onChange={(e) => toggleStep(6, e.target.checked)}
            />
            Entiendo por qué <code>***</code> no puede convertirse en 0 y cómo el parser lo omite.
          </label>
        </section>

        {/* ── PASO 7 ─────────────────────────────────────────────────── */}
        <section id="step-7" className="step">
          <p className="kicker">Paso 7 de 10</p>
          <h2>Cambiar la referencia de 1951–1980 a la era preindustrial (1880–1900)</h2>

          <p>
            NASA eligió 1951–1980 como referencia por ser un período estable y bien medido.
            Para este proyecto necesitamos comparar respecto a la era <em>preindustrial</em>,
            aproximada como 1880–1900.
          </p>

          <div className="callout warning">
            <strong>Concepto clave:</strong> El período 1880–1900 NO está en escala de
            "temperatura absoluta". Sigue siendo una anomalía respecto a 1951–1980. Lo que
            hacemos es calcular cuánto se desviaba ese período de la referencia de NASA y
            restar esa desviación a todos los puntos.
          </div>

          <h3>La matemática paso a paso</h3>
          <CodeBlock>{`
// Paso 1: calcular el promedio de 1880–1900 en la escala NASA
const valores1880_1900 = datos
  .filter(d => d.year >= 1880 && d.year <= 1900)
  .map(d => d.anomaly1951_1980);

const base = promedio(valores1880_1900);
// Ejemplo: base ≈ −0.15 °C
// Esto significa que 1880-1900 era ~0.15 °C más frío que 1951-1980

// Paso 2: restar esa base a cada punto de la serie
const convertidos = datos.map(d => ({
  ...d,                          // mantener todos los campos originales
  anomalyPreindustrial: d.anomaly1951_1980 - base
  // ahora 0.00 = temperatura promedio de 1880-1900
}));
          `}</CodeBlock>

          <div className="two-columns">
            <div className="card">
              <h3>Antes (escala NASA)</h3>
              <p>
                Enero 1926: <code>+0.21 °C</code><br />
                Referencia: promedio 1951–1980
              </p>
            </div>
            <div className="card">
              <h3>Después (escala preindustrial)</h3>
              <p>
                Enero 1926: <code>+0.21 − (−0.15) = +0.36 °C</code><br />
                Referencia: promedio 1880–1900
              </p>
            </div>
          </div>

          <h3>Primeros 12 meses en ambas escalas (datos en vivo)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Anomalía NASA (1951–1980)</th>
                  <th>Anomalía preindustrial (1880–1900)</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 12).map((item) => (
                  <tr key={item.date}>
                    <td>{item.date}</td>
                    <td>{formatTemperature(item.anomaly1951_1980)}</td>
                    <td>{formatTemperature(item.anomalyPreindustrial)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="done">
            <input
              type="checkbox"
              checked={completed.has(7)}
              onChange={(e) => toggleStep(7, e.target.checked)}
            />
            Puedo explicar la fórmula de cambio de referencia y por qué se conservan ambas anomalías.
          </label>
        </section>

        {/* ── PASO 8 ─────────────────────────────────────────────────── */}
        <section id="step-8" className="step">
          <p className="kicker">Paso 8 de 10</p>
          <h2>Filtrar el rango de fechas y visualizar en gráfica</h2>
          <p>Selecciona el intervalo que quieres analizar. La gráfica muestra las anomalías mensuales respecto a 1880–1900.</p>

          <div className="controls">
            <label>Fecha inicio
              <input
                type="month"
                value={startDate}
                min={data[0]?.date}
                max={data.at(-1)?.date}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>Fecha fin
              <input
                type="month"
                value={endDate}
                min={data[0]?.date}
                max={data.at(-1)?.date}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
            <button type="button" onClick={() => markStep(8)}>Rango revisado ✓</button>
          </div>

          <div className="stats">
            <Stat label="Meses en el rango" value={rangeData.length.toLocaleString('es-CO')} />
            <Stat
              label="Promedio inicial"
              value={comparison ? formatTemperature(comparison.initialAverage) : '≥ 24 meses'}
              note={comparison ? `${comparison.initialRange[0]} → ${comparison.initialRange[1]}` : 'selecciona más meses'}
            />
            <Stat
              label="Promedio final"
              value={comparison ? formatTemperature(comparison.finalAverage) : '≥ 24 meses'}
              note={comparison ? `${comparison.finalRange[0]} → ${comparison.finalRange[1]}` : ''}
            />
            <Stat label="Diferencia" value={comparison ? formatTemperature(comparison.difference) : '—'} />
          </div>

          <TemperatureChart data={rangeData} />

          <div className="callout">
            <strong>Cómo leer la gráfica:</strong> las líneas punteadas marcan{' '}
            <strong>+1.5 °C</strong> y <strong>+2.0 °C</strong> sobre la era preindustrial —
            los umbrales del Acuerdo de París. Un mes individual por encima de esa línea no
            constituye una superación climática; el calentamiento se mide como tendencia de
            décadas, no como eventos aislados.
          </div>

          <h3>Comparar ventanas temporales (no meses individuales)</h3>
          <CodeBlock>{`
// Para ver el cambio real es mejor promediar bloques,
// no comparar dos meses aislados que pueden ser atípicos
const primeros12 = promediar(datos.slice(0, 12));   // inicio del rango
const ultimos12  = promediar(datos.slice(-12));      // fin del rango
const cambio = ultimos12 - primeros12;
// Un valor positivo indica calentamiento en el período seleccionado
          `}</CodeBlock>
        </section>

        {/* ── PASO 9 ─────────────────────────────────────────────────── */}
        <section id="step-9" className="step">
          <p className="kicker">Paso 9 de 10</p>
          <h2>Verificar la comprensión del procesamiento</h2>
          <p>Responde correctamente todas las preguntas para completar este paso.</p>
          <Quiz onPerfectScore={() => markStep(9)} />
        </section>

        {/* ── PASO 10 ────────────────────────────────────────────────── */}
        <section id="step-10" className="step">
          <p className="kicker">Paso 10 de 10</p>
          <h2>Exportar los datos procesados y continuar</h2>

          <div className="two-columns">
            <div className="card">
              <h3>JSON procesado</h3>
              <p>
                Incluye la serie desde 1926, con la anomalía original de NASA y la
                recalculada respecto a 1880–1900. Listo para cualquier librería de
                visualización o sonificación.
              </p>
              <button type="button" onClick={downloadProcessedJson}>Descargar JSON procesado</button>
            </div>
            <div className="card">
              <h3>Plantilla React mínima</h3>
              <p>
                Proyecto Vite más pequeño para comenzar la interfaz de sonificación.
                Incluye el JSON ya importado.
              </p>
              <a
                className="button-link"
                href="/downloads/termometro-tierra-react-starter.zip"
                download
                onClick={() => markStep(10)}
              >
                Descargar plantilla React
              </a>
            </div>
          </div>

          <h3>Estructura del JSON exportado</h3>
          <CodeBlock>{`
{
  "metadata": {
    "source": "NASA GISS/GISTEMP v4",
    "originalBaseline": "1951-1980",
    "derivedBaseline": "promedio 1880-1900 de la misma serie",
    "baselineOffset": -0.149   // offset calculado de los datos reales
  },
  "data": [
    {
      "year": 1926,
      "month": 1,
      "date": "1926-01",
      "anomaly1951_1980": 0.21,       // valor original de NASA
      "anomalyPreindustrial": 0.36    // recalculado para el proyecto
    }
    // ... un objeto por cada mes disponible
  ]
}
          `}</CodeBlock>

          <h3>Resumen del flujo completo</h3>
          <div className="pipeline">
            <span>nasa.gov</span>
            <span className="arrow">→</span>
            <span>GLB.Ts+dSST.csv</span>
            <span className="arrow">→</span>
            <span>public/data/</span>
            <span className="arrow">→</span>
            <span>fetch()</span>
            <span className="arrow">→</span>
            <span>parseGistempCsv()</span>
            <span className="arrow">→</span>
            <span>prepareGistempData()</span>
            <span className="arrow">→</span>
            <span>JSON / gráfica / sonido</span>
          </div>

          <div className="callout">
            <strong>Siguientes pasos del proyecto:</strong>
            <ul>
              <li>Diseñar la metáfora visual (colores, formas, animaciones)</li>
              <li>Sonificación con <strong>Web Audio API</strong> — mapear anomalía → frecuencia</li>
              <li>Mantener la semántica de los datos (no distorsionar la escala)</li>
              <li>Incluir créditos visibles: <em>"Datos: NASA GISS/GISTEMP v4"</em></li>
            </ul>
          </div>
        </section>

        <footer>
          Fuente: NASA GISS/GISTEMP v4. Copia didáctica incluida únicamente para uso educativo.
          Datos hasta 2026-09. — Arquitectura de Sistemas Multimedia, UAO.
        </footer>
      </main>
    </div>
  );
}
