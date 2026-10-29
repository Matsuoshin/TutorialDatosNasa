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

const TOTAL_STEPS = 7;

function Stat({ label, value, note }) {
  return (
    <article className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
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
    setCompleted((previous) => {
      const next = new Set(previous);
      next.add(step);
      localStorage.setItem('gistemp-react-progress', JSON.stringify([...next]));
      return next;
    });
  }

  function toggleStep(step, checked) {
    setCompleted((previous) => {
      const next = new Set(previous);
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
    setCsvPreview(text.split(/\r?\n/).slice(0, 10).join('\n'));
    setStatus(`✓ ${sourceLabel}: ${parsed.length.toLocaleString('es-CO')} meses válidos.`);
    markStep(2);
  }

  useEffect(() => {
    fetch('/data/gistemp_global_monthly_subset.csv')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((text) => processCsv(text, 'Datos incluidos cargados'))
      .catch((error) => {
        setStatus(`No fue posible cargar el CSV: ${error.message}`);
      });
    // Solo debe ejecutarse al montar el tutorial.
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
    } catch (error) {
      setStatus(`Error leyendo ${file.name}: ${error.message}`);
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

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gistemp_procesado_1926_presente.json';
    link.click();
    URL.revokeObjectURL(url);
    markStep(7);
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">GISTEMP → React</div>
        <p className="sidebar-copy">Tutorial interactivo<br />Termómetro de la Tierra</p>
        <nav>
          <a href="#step-1">1. Entender el dato</a>
          <a href="#step-2">2. Cargar CSV</a>
          <a href="#step-3">3. Parsear</a>
          <a href="#step-4">4. Línea base</a>
          <a href="#step-5">5. Explorar</a>
          <a href="#step-6">6. Comprobar</a>
          <a href="#step-7">7. Continuar</a>
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
            Guía práctica para obtener, interpretar, transformar y utilizar la serie global mensual de temperatura superficial de NASA GISS en una aplicación web React.
          </p>
          <div className="chips">
            <span>React</span><span>Vite</span><span>JavaScript</span><span>Sin Python</span>
          </div>
        </header>

        <section id="step-1" className="step">
          <p className="kicker">Paso 1</p>
          <h2>Elegir el conjunto correcto y entender qué significa</h2>
          <div className="card">
            <h3>Usaremos GISTEMP v4 — L-OTI, media global mensual</h3>
            <p>
              Los números son <strong>anomalías de temperatura</strong> respecto al promedio 1951–1980. No representan la temperatura absoluta del planeta.
            </p>
          </div>
          <div className="callout">
            <strong>Ejemplo:</strong> +1.20 °C significa 1.20 °C por encima de la referencia correspondiente de GISTEMP.
          </div>
          <p>
            La visualización empieza en 1926, pero conservamos 1880–1900 para calcular la referencia aproximada exigida por el proyecto.
          </p>
          <p>
            <a href="https://data.giss.nasa.gov/gistemp/" target="_blank" rel="noreferrer">GISTEMP</a>{' · '}
            <a href="https://data.giss.nasa.gov/gistemp/data_v4.html" target="_blank" rel="noreferrer">Descargas</a>{' · '}
            <a href="https://data.giss.nasa.gov/gistemp/faq/" target="_blank" rel="noreferrer">FAQ</a>
          </p>
          <label className="done">
            <input
              type="checkbox"
              checked={completed.has(1)}
              onChange={(event) => toggleStep(1, event.target.checked)}
            />
            Comprendo la diferencia entre anomalía y temperatura absoluta.
          </label>
        </section>

        <section id="step-2" className="step">
          <p className="kicker">Paso 2</p>
          <h2>Cargar e inspeccionar el CSV</h2>
          <div className="two-columns">
            <div className="card">
              <h3>Copia incluida</h3>
              <p>Se carga automáticamente desde <code>public/data/</code> al iniciar React.</p>
            </div>
            <div className="card">
              <h3>Probar otro CSV</h3>
              <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} />
            </div>
          </div>
          <p className="status">{status}</p>
          <pre className="preview"><code>{csvPreview || 'Esperando datos…'}</code></pre>
          <label className="done">
            <input
              type="checkbox"
              checked={completed.has(2)}
              onChange={(event) => toggleStep(2, event.target.checked)}
            />
            Puedo identificar la fila Year,Jan,Feb,…
          </label>
        </section>

        <section id="step-3" className="step">
          <p className="kicker">Paso 3</p>
          <h2>Transformar la tabla en una serie mensual</h2>
          <p>Cada año del CSV se convierte en hasta doce objetos mensuales.</p>
          <CodeBlock>{`
const data = parseGistempCsv(csvText);

// Resultado conceptual:
{
  year: 1926,
  month: 1,
  date: "1926-01",
  anomaly1951_1980: 0.21
}
          `}</CodeBlock>
          <div className="stats">
            <Stat label="Meses válidos cargados" value={rawData.length.toLocaleString('es-CO')} />
            <Stat label="Primera observación" value={rawData[0]?.date ?? '—'} />
            <Stat label="Última observación" value={rawData.at(-1)?.date ?? '—'} />
            <Stat label="Base 1880–1900" value={formatTemperature(baseline)} />
          </div>
          <div className="callout">
            <strong>Importante:</strong> <code>***</code> significa dato faltante. Nunca debe convertirse automáticamente en cero.
          </div>
          <label className="done">
            <input
              type="checkbox"
              checked={completed.has(3)}
              onChange={(event) => toggleStep(3, event.target.checked)}
            />
            Entiendo por qué un dato faltante no equivale a 0 °C de anomalía.
          </label>
        </section>

        <section id="step-4" className="step">
          <p className="kicker">Paso 4</p>
          <h2>Cambiar la referencia a 1880–1900</h2>
          <CodeBlock>{`
const base1880_1900 = promedio(
  datos
    .filter(d => d.year >= 1880 && d.year <= 1900)
    .map(d => d.anomaly1951_1980)
);

const convertidos = datos.map(d => ({
  ...d,
  anomalyPreindustrial:
    d.anomaly1951_1980 - base1880_1900
}));
          `}</CodeBlock>
          <p>
            Conservamos el valor original de NASA y añadimos <code>anomalyPreindustrial</code>. De esta manera la transformación queda explícita y trazable.
          </p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>NASA 1951–1980</th><th>Ref. 1880–1900</th></tr></thead>
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
              checked={completed.has(4)}
              onChange={(event) => toggleStep(4, event.target.checked)}
            />
            Puedo explicar la fórmula de cambio de referencia.
          </label>
        </section>

        <section id="step-5" className="step">
          <p className="kicker">Paso 5</p>
          <h2>Seleccionar fechas y comparar ventanas temporales</h2>
          <div className="controls">
            <label>Inicio
              <input
                type="month"
                value={startDate}
                min={data[0]?.date}
                max={data.at(-1)?.date}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label>Fin
              <input
                type="month"
                value={endDate}
                min={data[0]?.date}
                max={data.at(-1)?.date}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
            <button type="button" onClick={() => markStep(5)}>Rango revisado ✓</button>
          </div>

          <div className="stats">
            <Stat label="Meses seleccionados" value={rangeData.length.toLocaleString('es-CO')} />
            <Stat label="Promedio inicial" value={comparison ? formatTemperature(comparison.initialAverage) : '≥ 24 meses'} note="primeros 12 meses" />
            <Stat label="Promedio final" value={comparison ? formatTemperature(comparison.finalAverage) : '≥ 24 meses'} note="últimos 12 meses" />
            <Stat label="Diferencia" value={comparison ? formatTemperature(comparison.difference) : '—'} />
          </div>

          <TemperatureChart data={rangeData} />
          <div className="callout">
            <strong>Interpretación responsable:</strong> las líneas +1.5 °C y +2.0 °C son referencias visuales. Un mes individual por encima de ellas no prueba una superación climática sostenida.
          </div>
        </section>

        <section id="step-6" className="step">
          <p className="kicker">Paso 6</p>
          <h2>Comprobar que se entendió el procesamiento</h2>
          <Quiz onPerfectScore={() => markStep(6)} />
        </section>

        <section id="step-7" className="step">
          <p className="kicker">Paso 7</p>
          <h2>Descargar datos y continuar con el proyecto</h2>
          <div className="two-columns">
            <div className="card">
              <h3>JSON procesado</h3>
              <p>Incluye la serie desde 1926 y conserva tanto la anomalía original como la recalculada.</p>
              <button type="button" onClick={downloadProcessedJson}>Descargar JSON</button>
            </div>
            <div className="card">
              <h3>Plantilla React mínima</h3>
              <p>Proyecto Vite más pequeño para comenzar su propia interfaz y sonificación.</p>
              <a
                className="button-link"
                href="/downloads/termometro-tierra-react-starter.zip"
                download
                onClick={() => markStep(7)}
              >
                Descargar plantilla React
              </a>
            </div>
          </div>
          <div className="callout">
            <strong>Siguiente trabajo:</strong> diseñar la metáfora visual, crear la sonificación con Web Audio API y mantener intacta la semántica de los datos.
          </div>
        </section>

        <footer>
          Fuente: NASA GISS/GISTEMP v4. Copia didáctica incluida para el proyecto “Termómetro de la Tierra”.
        </footer>
      </main>
    </div>
  );
}
