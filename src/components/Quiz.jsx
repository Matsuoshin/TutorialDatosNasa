import { useState } from 'react';

const questions = [
  {
    id: 'q1',
    text: 'Un valor GISTEMP de +1.35 °C significa…',
    correct: 'b',
    options: [
      ['a', 'que la temperatura absoluta del planeta ese mes fue 1.35 °C.'],
      ['b', 'que ese mes fue 1.35 °C más cálido que el promedio del mismo mes en 1951–1980.'],
      ['c', 'que la temperatura subió 1.35 °C respecto al mes anterior.'],
    ],
  },
  {
    id: 'q2',
    text: '¿Qué representa el archivo GLB.Ts+dSST.csv descargado de NASA GISTEMP?',
    correct: 'c',
    options: [
      ['a', 'Solo la temperatura superficial terrestre global (sin océanos).'],
      ['b', 'La temperatura del océano Pacífico únicamente.'],
      ['c', 'El índice global combinado de tierra y océano (Land-Ocean Temperature Index, L-OTI).'],
    ],
  },
  {
    id: 'q3',
    text: '¿Qué significan las columnas DJF, MAM, JJA y SON en el CSV de NASA?',
    correct: 'a',
    options: [
      ['a', 'Son los promedios de temperatura por estación del año (invierno, primavera, verano y otoño boreales).'],
      ['b', 'Son códigos de error que indican datos faltantes por trimestre.'],
      ['c', 'Son identificadores de las estaciones meteorológicas fuente.'],
    ],
  },
  {
    id: 'q4',
    text: '¿Por qué el parser busca la línea que empieza con "Year," en lugar de usar directamente la primera línea del archivo?',
    correct: 'b',
    options: [
      ['a', 'Porque el archivo siempre está vacío al descargarlo.'],
      ['b', 'Porque el archivo real de NASA comienza con una línea de título descriptivo y una línea en blanco antes del encabezado de columnas.'],
      ['c', 'Porque React no puede leer la primera línea de un CSV.'],
    ],
  },
  {
    id: 'q5',
    text: 'Si el CSV contiene *** en una celda mensual, el código correcto es…',
    correct: 'b',
    options: [
      ['a', 'convertirlo en 0, porque 0 es el valor neutro.'],
      ['b', 'omitir ese mes completamente — *** indica dato faltante, no temperatura 0.'],
      ['c', 'usar el promedio de los meses adyacentes como estimación.'],
    ],
  },
  {
    id: 'q6',
    text: '¿Dónde debe colocarse el CSV en un proyecto Vite para que sea accesible con fetch("/data/GLB.Ts+dSST.csv")?',
    correct: 'a',
    options: [
      ['a', 'En la carpeta public/data/ — los archivos en public/ se sirven como estáticos sin procesamiento.'],
      ['b', 'En src/assets/ — Vite procesa automáticamente los CSV en esa carpeta.'],
      ['c', 'En la raíz del proyecto junto a package.json.'],
    ],
  },
  {
    id: 'q7',
    text: '¿Por qué conservamos los datos de 1880–1900 si la visualización del proyecto comienza en 1926?',
    correct: 'c',
    options: [
      ['a', 'Para aumentar artificialmente el número de registros mostrados.'],
      ['b', 'Porque React no puede renderizar series que empiecen antes de 1920.'],
      ['c', 'Para calcular el promedio preindustrial que usamos como nueva referencia (restar el offset de 1951–1980).'],
    ],
  },
  {
    id: 'q8',
    text: 'Para evaluar el calentamiento en un período es preferible…',
    correct: 'c',
    options: [
      ['a', 'comparar solamente el primer y el último mes del rango.'],
      ['b', 'buscar el mes más cálido y el más frío dentro del rango.'],
      ['c', 'comparar el promedio de los primeros 12 meses con el promedio de los últimos 12 meses.'],
    ],
  },
];

export default function Quiz({ onPerfectScore }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  function grade() {
    const score = questions.reduce(
      (total, q) => total + (answers[q.id] === q.correct ? 1 : 0),
      0,
    );
    setResult(score);
    if (score === questions.length) onPerfectScore?.();
  }

  function retry() {
    setAnswers({});
    setResult(null);
  }

  return (
    <>
      {questions.map((q, index) => (
        <fieldset className="quiz-question" key={q.id}>
          <legend>
            <strong>{index + 1}. {q.text}</strong>
          </legend>
          {q.options.map(([value, label]) => (
            <label
              key={value}
              style={
                result !== null
                  ? {
                      background:
                        value === q.correct
                          ? '#0a2010'
                          : answers[q.id] === value && value !== q.correct
                          ? '#200a0a'
                          : undefined,
                      borderColor:
                        value === q.correct
                          ? '#2a6040'
                          : answers[q.id] === value && value !== q.correct
                          ? '#602020'
                          : undefined,
                    }
                  : undefined
              }
            >
              <input
                type="radio"
                name={q.id}
                value={value}
                checked={answers[q.id] === value}
                disabled={result !== null}
                onChange={() => setAnswers((old) => ({ ...old, [q.id]: value }))}
              />
              {label}
            </label>
          ))}
        </fieldset>
      ))}

      {result === null ? (
        <button type="button" onClick={grade}>Calificar respuestas</button>
      ) : (
        <>
          <p className="quiz-result">
            Resultado: {result} / {questions.length}.{' '}
            {result === questions.length
              ? '¡Perfecto! Ya puede continuar con el proyecto.'
              : `Revisa las preguntas marcadas en rojo y vuelve a intentarlo.`}
          </p>
          {result < questions.length && (
            <button type="button" onClick={retry} style={{ marginLeft: '12px' }}>
              Intentar de nuevo
            </button>
          )}
        </>
      )}
    </>
  );
}
