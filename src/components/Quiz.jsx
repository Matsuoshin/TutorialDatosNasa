import { useState } from 'react';

const questions = [
  {
    id: 'q1',
    text: 'Un valor GISTEMP de +1.1 °C significa…',
    correct: 'b',
    options: [
      ['a', 'que la temperatura absoluta del planeta fue 1.1 °C.'],
      ['b', 'una anomalía de +1.1 °C respecto a la referencia de GISTEMP.'],
    ],
  },
  {
    id: 'q2',
    text: '¿Por qué conservar 1880–1900 si la visualización comienza en 1926?',
    correct: 'c',
    options: [
      ['a', 'Para aumentar artificialmente el número de observaciones.'],
      ['b', 'Porque React no puede comenzar una serie en 1926.'],
      ['c', 'Para calcular la referencia aproximada solicitada por el proyecto.'],
    ],
  },
  {
    id: 'q3',
    text: 'Si el CSV contiene *** debemos…',
    correct: 'b',
    options: [
      ['a', 'convertirlo en cero.'],
      ['b', 'tratarlo como dato faltante.'],
    ],
  },
  {
    id: 'q4',
    text: 'Para comparar los extremos del rango es preferible…',
    correct: 'c',
    options: [
      ['a', 'comparar solamente el primer y último mes.'],
      ['b', 'buscar los dos meses que den la mayor diferencia.'],
      ['c', 'comparar promedios de ventanas temporales.'],
    ],
  },
];

export default function Quiz({ onPerfectScore }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  function grade() {
    const score = questions.reduce(
      (total, question) => total + (answers[question.id] === question.correct ? 1 : 0),
      0,
    );
    setResult(score);
    if (score === questions.length) onPerfectScore?.();
  }

  return (
    <>
      {questions.map((question, index) => (
        <fieldset className="quiz-question" key={question.id}>
          <legend><strong>{index + 1}. {question.text}</strong></legend>
          {question.options.map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name={question.id}
                value={value}
                checked={answers[question.id] === value}
                onChange={() => setAnswers((old) => ({ ...old, [question.id]: value }))}
              />
              {label}
            </label>
          ))}
        </fieldset>
      ))}

      <button type="button" onClick={grade}>Calificar</button>
      {result !== null && (
        <p className="quiz-result">
          Resultado: {result} / {questions.length}.{' '}
          {result === questions.length
            ? 'Perfecto: ya puede continuar con el proyecto.'
            : 'Revise las explicaciones anteriores y vuelva a intentarlo.'}
        </p>
      )}
    </>
  );
}
