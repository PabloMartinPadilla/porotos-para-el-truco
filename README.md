# Porotos para el Truco

Tanteador de Truco con estética campera uruguaya. Llevá el puntaje con porotos visuales, modo competitivo con reglas acordadas e historial persistente en el navegador.

---

## Características

- **Porotos visuales** — grupos de 5 formando un montón natural, porotos dorados para el vale cuatro
- **Malas y buenas** — divisor automático cuando el equipo supera la mitad del límite
- **Vale cuatro** — modal de confirmación antes de sumar los 4 puntos
- **Modo competitivo** — acordá reglas predefinidas o custom antes de empezar; las reglas custom se persisten entre sesiones
- **Cambio de límite en partida** — modificá el tope de puntos durante el juego
- **Solo / dupla** — el texto de los modales refleja si el equipo es individual o de dos
- **Historial** — todas las partidas guardadas en `localStorage` con fecha, score final y si alguien durmió afuera

---

## Stack

| Capa        | Tecnología                                |
|-------------|-------------------------------------------|
| UI          | HTML + CSS + JavaScript (ES Modules)      |
| Build       | [Vite 4](https://v4.vitejs.dev/)          |
| Persistencia| `localStorage` (sin backend)              |

Sin frameworks ni librerías de runtime.

---

## Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Servidor de desarrollo → http://localhost:5173
npm run dev

# 3. Build de producción → dist/
npm run build

# 4. Previsualizar el build localmente
npm run preview
```

## Deploy en GitHub Pages

El repositorio incluye un workflow de GitHub Actions que buildea y publica automáticamente en cada push a `main`.

**Pasos para activarlo (una sola vez):**

1. Subir el repo a GitHub
2. Ir a **Settings → Pages**
3. En *Source* seleccionar **GitHub Actions**
4. Hacer push — el workflow corre solo y publica en:
   `https://<usuario>.github.io/<nombre-del-repo>/`

---

## Estructura del proyecto

```
TanteadorTruco/
│
├── public/
│   └── icon.svg            # Ícono SVG de la app (servido estático por Vite)
│
├── src/
│   ├── main.js             # Punto de entrada — inicializa listeners y navegación
│   ├── style.css           # Estilos globales
│   ├── game.js             # Clase Game: lógica pura de la partida
│   ├── storage.js          # Historial: leer/escribir en localStorage
│   ├── ui.js               # Renderizado: porotos, pantallas, historial
│   ├── rules.js            # Modo competitivo: reglas predefinidas y custom
│   └── constants.js        # Claves de localStorage y labels de reglas
│
├── index.html              # Entry point de Vite
├── vite.config.js          # Configuración de Vite
├── .editorconfig           # Consistencia de formato entre editores
├── .gitignore
└── package.json
```

---

## Módulos

### `src/game.js` — `Game`

Clase con toda la lógica de la partida. No toca el DOM.

| Método | Descripción |
|--------|-------------|
| `addPoint(teamIndex)` | Suma 1 punto al equipo; retorna el índice del ganador o `null` |
| `addVale(callerIndex)` | Suma 4 puntos (marcados como vale); retorna ganador o `null` |
| `getWinner()` | `null` si la partida sigue, índice del ganador si alguno llegó al límite |
| `isVale(teamIndex, idx)` | `true` si ese poroto es producto de un vale cuatro |
| `loserDurmioAfuera(winnerIndex)` | `true` si el perdedor no llegó a la mitad del límite |
| `toRecord(winnerIndex)` | Objeto serializable para guardar en el historial |

### `src/storage.js`

| Función | Descripción |
|---------|-------------|
| `saveRecord(record)` | Inserta un registro al inicio del historial en `localStorage` |
| `getAllRecords()` | Devuelve el historial completo o `[]` si no hay nada |

### `src/ui.js`

| Función | Descripción |
|---------|-------------|
| `showScreen(id)` | Muestra la pantalla indicada y oculta las demás |
| `renderPorotos(game, teamIndex)` | Re-dibuja todos los porotos de un equipo |
| `renderGrupos(game, container, teamIndex, fromIdx, count)` | Renderiza grupos de 5 (montón) o fila suelta |
| `animateLastPoroto(teamIndex)` | Dispara la animación `popIn` en el último poroto |
| `renderHistorialItem(record)` | Genera el HTML string de un ítem del historial |
| `updateLimitDisplay(game)` | Actualiza el botón del límite y marca el activo en el picker |

### `src/rules.js`

| Función | Descripción |
|---------|-------------|
| `saveCustomRules()` | Persiste las reglas dinámicas del DOM en `localStorage` |
| `loadCustomRules()` | Devuelve las reglas custom guardadas |
| `renderCustomRulesSaved()` | Recarga las reglas custom en el modal desde `localStorage` |
| `agregarReglaDinamica(nombre, desc)` | Crea y agrega una regla custom al modal |
| `cerrarFormRegla()` | Cierra y limpia el formulario de nueva regla |
| `collectReglas()` | Lee el modal y retorna el objeto de reglas acordadas |
| `showReglasPanel(game)` | Abre el modal en modo solo lectura con las reglas de la partida activa |

### `src/constants.js`

| Constante | Descripción |
|-----------|-------------|
| `STORAGE_KEY` | Clave de `localStorage` para el historial (`truco_historial`) |
| `REGLAS_CUSTOM_KEY` | Clave de `localStorage` para reglas custom (`truco_reglas_custom`) |
| `REGLAS_LABELS` | Labels legibles de las tres reglas predefinidas |

---

## Paleta de colores

| Variable CSS | Valor | Uso |
|---|---|---|
| `--bg` | `#130e05` | Fondo de la app |
| `--surface` | `#1e1609` | Cards y fields |
| `--surface-raised` | `#2a1e0d` | Elementos elevados |
| `--accent` | `#8b2500` | Botón primario, rojo truco |
| `--gold` | `#d4a017` | Porotos vale cuatro |
| `--poroto` | `#7a4e30` | Color base del poroto |
| `--text` | `#e8d5b0` | Texto principal |
| `--text-muted` | `#8a6d48` | Texto secundario |

---

## localStorage

La app no requiere backend. Todos los datos se guardan en el navegador:

| Clave | Contenido |
|-------|-----------|
| `truco_historial` | Array de objetos `GameRecord` (fecha, equipos, scores, límite, durmioAfuera, reglas) |
| `truco_reglas_custom` | Array de reglas personalizadas `{ nombre, desc }` |

Para limpiar todos los datos: `localStorage.clear()` en la consola del navegador.

---

## Licencia

MIT
