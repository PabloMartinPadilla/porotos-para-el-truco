# Porotos pal Truco

Tanteador de Truco con estética campera uruguaya. Llevá el puntaje con porotos visuales, modo competitivo con reglas y apuesta acordadas, historial persistente e instalable como app en Android.

**Demo:** [pablomartinpadilla.github.io/porotos-para-el-truco](https://pablomartinpadilla.github.io/porotos-para-el-truco/)

---

## Características

### Juego
- **Porotos visuales** — grupos de 5 formando un montón natural, porotos dorados para el vale cuatro
- **Malas y buenas** — divisor automático cuando el equipo supera la mitad del límite
- **+1 / −1 / IV** — sumá, restá o aplicá un vale cuatro por equipo
- **Vale cuatro animado** — los 4 porotos aparecen de a uno; fuera de modo competitivo no requiere confirmación
- **Revancha** — reinicia con los mismos equipos y reglas sin volver al inicio; se registra en el historial con badge dorado
- **Solo / dupla** — toggle global que cambia los placeholders de nombre ("Yo"/"Vos" o "Nosotros"/"Ellos")
- **Cambio de límite en partida** — las opciones ya superadas aparecen bloqueadas; los porotos se reorganizan al cambiar
- **Confirmación al salir** — si hay una partida en curso, el botón ⌂ y el gesto de volver (Android) piden confirmación antes de descartarla

### Modo competitivo
- **Reglas predefinidas** — Contraflor con achique, Echar los perros, Lo dicho dicho está
- **Reglas custom** — agregá reglas propias con nombre y descripción; se persisten entre sesiones
- **Apuesta** — campo de texto libre opcional (ej: "un café", "100 pesos"); se guarda en el historial y aparece en dorado en la pantalla de resultado
- **Modal cancelable** — botón × para cerrar sin iniciar la partida

### Historial y estadísticas
- **Historial** — todas las partidas guardadas con fecha, score, límite, durmió afuera y apuesta si aplica
- **Partidas en serie** — las revancha se agrupan con su serie; se muestra el balance parcial
- **Borrar historial** — botón con confirmación para limpiar todos los registros
- **Estadísticas por enfrentamiento** — tarjetas por par de jugadores con búsqueda, racha activa, puntos totales y porcentaje de victorias de cada uno

### UX y feedback
- **Vibración háptica** — cada acción tiene su patrón de vibración; toggle persistido (solo Android)
- **Sonidos** — generados con Web Audio API, sin archivos externos; toggle de silencio
- **Celebración al ganar** — mates 🧉 volando desde todos los bordes y confeti en los colores del tema
- **Tema claro / oscuro** — toggle persistido en `localStorage`
- **PWA** — instalable en Android con banner; funciona offline

---

## Stack

| Capa         | Tecnología                                                      |
|--------------|-----------------------------------------------------------------|
| UI           | HTML + CSS + JavaScript (ES Modules)                            |
| Build        | [Vite 4](https://v4.vitejs.dev/)                                |
| PWA          | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + Workbox  |
| Persistencia | `localStorage` (sin backend)                                    |

Sin frameworks ni librerías de runtime.

---

## Instalar como app (PWA)

La app es una Progressive Web App instalable en Android directamente desde el navegador — sin tienda, sin APK.

- **Android (Chrome):** aparece un banner "Instalá la app en tu celular" en la pantalla de inicio
- Una vez instalada funciona offline y se abre como app nativa

---

## Estructura del proyecto

```
TanteadorTruco/
│
├── public/
│   ├── icon.svg                  # Ícono SVG fuente
│   └── icons/
│       ├── icon-192.png          # Ícono PWA 192×192
│       ├── icon-512.png          # Ícono PWA 512×512
│       └── apple-touch-icon.png  # Ícono iOS 180×180
│
├── scripts/
│   └── generate-icons.js         # Genera los PNGs desde icon.svg con sharp
│
├── src/
│   ├── main.js                   # Controlador principal — listeners y navegación
│   ├── style.css                 # Estilos globales + animaciones
│   ├── game.js                   # Clase Game: lógica pura de la partida
│   ├── storage.js                # Historial en localStorage
│   ├── ui.js                     # Renderizado: porotos, pantallas, historial, estadísticas
│   ├── rules.js                  # Modo competitivo: reglas predefinidas y custom
│   ├── sounds.js                 # Sonidos Web Audio API + vibración háptica
│   └── constants.js              # Claves de localStorage y labels
│
├── index.html                    # Entry point de Vite
├── vite.config.js                # Configuración de Vite + PWA
├── .github/workflows/deploy.yml  # CI/CD → GitHub Pages
└── package.json
```

---

## Módulos

### `src/game.js` — `Game`

Clase con toda la lógica de la partida. No toca el DOM.

| Método | Descripción |
|--------|-------------|
| `addPoint(teamIndex)` | Suma 1 punto; retorna índice del ganador o `null` |
| `removePoint(teamIndex)` | Resta 1 punto (mín 0); limpia el registro de vale si aplica |
| `addVale(callerIndex)` | Registra los 4 índices como vale; retorna ganador o `null` |
| `getWinner()` | `null` si la partida sigue, índice del ganador si llegó al límite |
| `isVale(teamIndex, idx)` | `true` si ese poroto es de un vale cuatro |
| `loserDurmioAfuera(winnerIndex)` | `true` si el perdedor no llegó a la mitad del límite |
| `toRecord(winnerIndex)` | Objeto serializable para el historial |

### `src/storage.js`

| Función | Descripción |
|---------|-------------|
| `saveRecord(record)` | Inserta un registro al inicio del historial |
| `getAllRecords()` | Devuelve el historial completo o `[]` |
| `clearRecords()` | Elimina todos los registros del historial |

### `src/ui.js`

| Función | Descripción |
|---------|-------------|
| `showScreen(id)` | Muestra la pantalla indicada y oculta las demás |
| `renderPorotos(game, teamIndex)` | Re-dibuja todos los porotos de un equipo |
| `renderGrupos(...)` | Renderiza grupos de 5 (montón) o fila suelta |
| `animateLastPoroto(teamIndex)` | Animación `popIn` en el último poroto |
| `renderHistorialItem(record, idx)` | HTML de un ítem del historial |
| `renderHistorialSerie(records, indices)` | HTML de un bloque de serie con revancha |
| `renderHistorialStats(records)` | Bloque de estadísticas generales del historial |
| `buildEstadisticasData(records)` | Procesa registros y genera datos de enfrentamientos |
| `renderMatchupCard(matchup)` | Tarjeta de enfrentamiento con % de victorias |
| `updateLimitDisplay(game)` | Actualiza el picker de límite y bloquea opciones superadas |

### `src/rules.js`

| Función | Descripción |
|---------|-------------|
| `saveCustomRules()` | Persiste reglas dinámicas en `localStorage` |
| `loadCustomRules()` | Devuelve reglas custom guardadas |
| `renderCustomRulesSaved()` | Recarga reglas custom en el modal y limpia el campo de apuesta |
| `agregarReglaDinamica(nombre, desc)` | Agrega una regla custom al modal |
| `cerrarFormRegla()` | Cierra y limpia el formulario de nueva regla |
| `collectReglas()` | Lee el modal y retorna el objeto de reglas + apuesta acordadas |
| `showReglasPanel(game)` | Abre el modal en modo solo lectura |

### `src/sounds.js`

| Función | Descripción |
|---------|-------------|
| `playTap()` | Toque de UI genérico |
| `playToggle()` | Toggle / selección |
| `playPunto()` | +1 punto |
| `playRestar()` | −1 punto |
| `playVale()` | Vale cuatro confirmado |
| `playGanador()` | Fin de partida |
| `isMuted()` / `toggleMute()` | Estado y toggle de silencio |
| `isVibrating()` / `toggleVibrate()` | Estado y toggle de vibración |

### `src/constants.js`

| Constante | Descripción |
|-----------|-------------|
| `STORAGE_KEY` | Clave de `localStorage` para el historial (`truco_historial`) |
| `REGLAS_CUSTOM_KEY` | Clave para reglas custom (`truco_reglas_custom`) |
| `REGLAS_LABELS` | Labels legibles de las tres reglas predefinidas |

---

## Paleta de colores

| Variable CSS       | Valor     | Uso                        |
|--------------------|-----------|----------------------------|
| `--bg`             | `#130e05` | Fondo de la app            |
| `--surface`        | `#1e1609` | Cards y fields             |
| `--surface-raised` | `#2a1e0d` | Elementos elevados         |
| `--accent`         | `#8b2500` | Botón primario, rojo truco |
| `--gold`           | `#d4a017` | Vale cuatro, revancha y apuesta |
| `--poroto`         | `#7a4e30` | Color base del poroto      |
| `--text`           | `#e8d5b0` | Texto principal            |
| `--text-muted`     | `#8a6d48` | Texto secundario           |

---

## localStorage

| Clave | Contenido |
|-------|-----------|
| `truco_historial` | Array de `GameRecord` (fecha, equipos, scores, límite, durmioAfuera, reglas, apuesta, isRevancha, serieId) |
| `truco_reglas_custom` | Array de reglas custom `{ nombre, desc }` |
| `truco-theme` | `'light'` o vacío |
| `truco-muted` | `'1'` si el sonido está silenciado |
| `truco-vibrate` | `'0'` si la vibración está apagada |

Para limpiar todos los datos: `localStorage.clear()` en la consola del navegador.

---

## Desarrollo local

```bash
npm install
npm run dev      # dev server en localhost:5173
npm run build    # build → dist/
npm run icons    # regenera PNGs desde icon.svg con sharp
```

> Usar siempre `vite@4`. La versión 5 usa Rollup nativo que puede estar bloqueado por Windows Application Control.

---

## Licencia

MIT
