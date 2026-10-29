# Tutorial interactivo NASA GISTEMP — React + Vite

Este proyecto reemplaza la versión que requería un servidor Python. **No necesita Python.**

## Requisito único

Instale Node.js LTS desde:

https://nodejs.org/

Node incluye `npm`.

## Ejecutar el tutorial

Abra una terminal dentro de esta carpeta y ejecute:

```bash
npm install
npm run dev
```

Vite mostrará una dirección parecida a:

```text
http://localhost:5173/
```

Ábrala en Chrome, Edge o Firefox.

## Compilar una versión final

```bash
npm run build
```

El resultado quedará en la carpeta `dist/`.

Para revisar esa versión:

```bash
npm run preview
```

## Estructura

```text
tutorial-gistemp-react/
├── index.html
├── package.json
├── README.md
├── public/
│   ├── data/
│   │   └── gistemp_global_monthly_subset.csv
│   └── downloads/
│       └── termometro-tierra-react-starter.zip
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── styles.css
    ├── components/
    │   ├── CodeBlock.jsx
    │   ├── Quiz.jsx
    │   └── TemperatureChart.jsx
    └── lib/
        └── gistemp.js
```

## Qué enseña

1. Diferencia entre anomalía y temperatura absoluta.
2. Lectura del CSV de GISTEMP.
3. Transformación a una observación por mes.
4. Tratamiento de datos faltantes (`***`).
5. Cálculo de la referencia 1880–1900.
6. Conversión de la serie a esa referencia.
7. Filtrado desde 1926.
8. Selección interactiva de rango.
9. Comparación mediante ventanas de 12 meses.
10. Visualización de referencias +1.5 °C y +2.0 °C.
11. Exportación de datos procesados en JSON.

## Datos

La copia didáctica incluida contiene 1880–1900 para calcular la referencia aproximada solicitada por el proyecto y 1926–septiembre de 2026 para la visualización.

Fuente oficial:

- https://data.giss.nasa.gov/gistemp/
- https://data.giss.nasa.gov/gistemp/data_v4.html
- https://data.giss.nasa.gov/gistemp/faq/

Antes de una entrega final, el equipo puede reemplazar el CSV por una copia oficial más reciente y documentar su fecha de acceso.
