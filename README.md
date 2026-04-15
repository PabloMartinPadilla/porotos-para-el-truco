# Porotos para el Truco

Tanteador de Truco con estética campera uruguaya. Llevá el puntaje con porotos visuales, modo competitivo con reglas acordadas e historial persistente en el navegador.

**Demo:** [pablomartinpadilla.github.io/porotos-para-el-truco](https://pablomartinpadilla.github.io/porotos-para-el-truco/)

---

## Características

- **Porotos visuales** — grupos de 5 formando un montón natural, porotos dorados para el vale cuatro
- **Malas y buenas** — divisor automático cuando el equipo supera la mitad del límite
- **+1 / -1 / IV** — sumá, restá o aplicá un vale cuatro por equipo
- **Vale cuatro** — modal de confirmación antes de sumar los 4 puntos
- **Revancha** — reinicia con los mismos equipos y reglas sin volver al inicio; se registra en el historial con badge dorado
- **Modo competitivo** — acordá reglas predefinidas o custom antes de empezar; las reglas custom se persisten entre sesiones
- **Solo / dupla** — toggle global que cambia los placeholders de nombre ("Yo"/"Vos" o "Nosotros"/"Ellos")
- **Cambio de límite en partida** — las opciones ya superadas aparecen bloqueadas; los porotos se reorganizan al cambiar
- **Historial** — todas las partidas en `localStorage` con fecha, score y si alguien durmió afuera
- **PWA** — instalable en Android con banner de instalación; funciona offline

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

# (Opcional) Regenerar íconos PNG desde public/icon.svg
npm run icons
```

---

## Instalar como app (PWA)

La app es una Progressive Web App instalable en Android directamente desde el navegador — sin tienda, sin APK.

- **Android (Chrome):** aparece un banner "Instalá la app en tu celular" en la pantalla de inicio
- Una vez instalada funciona offline y se abre como app nativa

---

## Deploy en GitHub Pages

El repositorio incluye un workflow de GitHub Actions que buildea y publica automáticamente en cada push a `main`.

**Activarlo (una sola vez):**

1. Ir a **Settings → Pages** en el repo
2. En *Source* seleccionar **GitHub Actions**
3. Hacer push — el workflow corre solo y publica en:
   `https://<usuario>.github.io/<nombre-del-repo>/`

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
│   ├── style.css                 # Estilos globales
│   ├── game.js                   # Clase Game: lógica pura de la partida
│   ├── storage.js                # Historial en localStorage
│   ├── ui.js                     # Renderizado: porotos, pantallas, historial
│   ├── rules.js                  # Modo competitivo: reglas predefinidas y custom
│   └── constants.js              # Claves de localStorage y labels
│
├── index.html                    # Entry point de Vite
├── vite.config.js                # Configuración de Vite + PWA
├── .github/workflows/deploy.yml  # CI/CD → GitHub Pages
├── .editorconfig
├── .gitignore
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
| `addVale(callerIndex)` | Suma 4 puntos dorados; retorna ganador o `null` |
| `getWinner()` | `null` si la partida sigue, índice del ganador si llegó al límite |
| `isVale(teamIndex, idx)` | `true` si ese poroto es de un vale cuatro |
| `loserDurmioAfuera(winnerIndex)` | `true` si el perdedor no llegó a la mitad del límite |
| `toRecord(winnerIndex)` | Objeto serializable para el historial (incluye `isRevancha`) |

### `src/storage.js`

| Función | Descripción |
|---------|-------------|
| `saveRecord(record)` | Inserta un registro al inicio del historial |
| `getAllRecords()` | Devuelve el historial completo o `[]` |

### `src/ui.js`

| Función | Descripción |
|---------|-------------|
| `showScreen(id)` | Muestra la pantalla indicada y oculta las demás |
| `renderPorotos(game, teamIndex)` | Re-dibuja todos los porotos de un equipo |
| `renderGrupos(...)` | Renderiza grupos de 5 (montón) o fila suelta |
| `animateLastPoroto(teamIndex)` | Animación `popIn` en el último poroto |
| `renderHistorialItem(record)` | HTML de un ítem del historial (con badge revancha si aplica) |
| `updateLimitDisplay(game)` | Actualiza el picker de límite y bloquea opciones ya superadas |

### `src/rules.js`

| Función | Descripción |
|---------|-------------|
| `saveCustomRules()` | Persiste reglas dinámicas en `localStorage` |
| `loadCustomRules()` | Devuelve reglas custom guardadas |
| `renderCustomRulesSaved()` | Recarga reglas custom en el modal |
| `agregarReglaDinamica(nombre, desc)` | Agrega una regla custom al modal |
| `cerrarFormRegla()` | Cierra y limpia el formulario de nueva regla |
| `collectReglas()` | Lee el modal y retorna el objeto de reglas acordadas |
| `showReglasPanel(game)` | Abre el modal en modo solo lectura |

### `src/constants.js`

| Constante | Descripción |
|-----------|-------------|
| `STORAGE_KEY` | Clave de `localStorage` para el historial (`truco_historial`) |
| `REGLAS_CUSTOM_KEY` | Clave para reglas custom (`truco_reglas_custom`) |
| `REGLAS_LABELS` | Labels legibles de las tres reglas predefinidas |

---

## Paleta de colores

| Variable CSS      | Valor     | Uso                        |
|-------------------|-----------|----------------------------|
| `--bg`            | `#130e05` | Fondo de la app            |
| `--surface`       | `#1e1609` | Cards y fields             |
| `--surface-raised`| `#2a1e0d` | Elementos elevados         |
| `--accent`        | `#8b2500` | Botón primario, rojo truco |
| `--gold`          | `#d4a017` | Vale cuatro y revancha     |
| `--poroto`        | `#7a4e30` | Color base del poroto      |
| `--text`          | `#e8d5b0` | Texto principal            |
| `--text-muted`    | `#8a6d48` | Texto secundario           |

---

## localStorage

| Clave | Contenido |
|-------|-----------|
| `truco_historial` | Array de `GameRecord` (fecha, equipos, scores, límite, durmioAfuera, reglas, isRevancha) |
| `truco_reglas_custom` | Array de reglas custom `{ nombre, desc }` |

Para limpiar todos los datos: `localStorage.clear()` en la consola del navegador.

---

## Licencia

MIT
