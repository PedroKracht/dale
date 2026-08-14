# Dale!

Quests. Una acción concreta por vez, sin explicaciones.

v0.1: sin cuentas, sin backend, sin red. Todo local, todo offline.

**En vivo: https://dale-woad.vercel.app** — abrila en Safari y agregala a la pantalla de
inicio. Ahí sí corre el service worker, así que funciona sin señal.

> Se llamó Bolichap y después Arranque. Las noches guardadas con esos nombres se mudan
> solas al abrir la app. Los identificadores internos (repo, proyecto de Vercel, claves
> de `localStorage`) son `dale` sin signo: el `!` es solo el nombre visible.

## Correrlo

```bash
npm install
npm run dev
```

Abre en `http://localhost:5173`. El servidor levanta con `--host`, así que también aparece
la IP de la red local (`http://192.168.x.x:5173`) para abrirlo desde el teléfono.

Producción:

```bash
npm run build
```

Queda todo en `dist/`. Para verlo servido: `npm run preview`.

## Deploy

El repo está conectado a Vercel: **cada push a `main` despliega solo**. No hace falta
correr nada.

Para publicar sin pasar por git:

```bash
npx vercel deploy --prod --yes
```

Ojo con la URL: Vercel genera tres. Las dos que llevan `krachtpedro-7806s-projects`
están detrás del login de la cuenta y devuelven 302. La pública es `dale-woad`.

## Instalarlo en el iPhone

1. Abrir la app en Safari.
2. Botón compartir → **Agregar a pantalla de inicio**.
3. Se abre a pantalla completa, sin barra de Safari.

Un detalle importante: el service worker (lo que hace que funcione **sin internet**) solo se
registra sobre HTTPS. Abriéndola por la IP local (`http://192.168...`) se ve bien y se puede
agregar a la pantalla de inicio, pero no cachea nada. Para probarla de verdad offline en el
boliche hay que subir `dist/` a cualquier hosting estático con HTTPS (Vercel, Netlify, Pages).

En iOS cada app agregada a la pantalla de inicio tiene su propio `localStorage`: si empezás
una noche en Safari, no la vas a ver en el ícono de la pantalla de inicio, y viceversa.

## La escalera

`level` no es dificultad genérica: mide **cuánto te estás mostrando sin controlar el
resultado**.

| | |
|---|---|
| 0 | No te registra nadie. |
| 1 | Te pueden ver, pero no hay nadie del otro lado esperando nada. |
| 2 | Hay alguien del otro lado y lo que hacés es liviano. |
| 3 | Te mostrás de una forma que puede salir mal: ridículo, sincero, primero, o metiéndote donde no te llamaron. |
| 4 | Le pedís algo a alguien que te lo puede negar. |

Que te rechace alguien que te gusta es **un caso** del nivel 4, no su definición. Con la
escalera vieja —construida sobre el rechazo romántico— cantar un estribillo a los gritos en
un boliche lleno contaba como nivel 1, y 13 de las 16 quests más difíciles del mazo eran
"acercate a alguien que te guste". Hoy son 6 de 19, y de las cuatro de nivel 4 hay una sola.

## Editar las quests

Todo el contenido vive en un solo archivo: [`src/data/quests.ts`](src/data/quests.ts).

Para agregar una: copiá una línea, cambiale el `id` (que sea único) y el texto.

```ts
{ id: 64, text: 'Preguntale a alguien cuál es su boliche favorito.', level: 2, category: 'conversation', tags: ['pregunta'] },
```

- `level` y `category` son metadata interna, no se muestran nunca. Las usa el selector para
  espaciar quests parecidas.
- `seconds` es opcional: va cuando la quest no entra en los 120 por defecto, o `null` para
  que vaya sin reloj.
- `emoji` es opcional: si no lo ponés, hereda el de la categoría (`CATEGORY_EMOJI`).
- Los ids no se reciclan (las noches archivadas los referencian), así que hay huecos.
- Cambiar el mazo no rompe una noche en curso: si la quest que estaba en pantalla ya no
  existe, la app trae otra.

Las dos reglas que tiene que cumplir una quest nueva están escritas arriba del mazo: **abre
una interacción, nunca la continúa**, y **encarar es una forma de valentía, no la valentía**.

## Los muñequitos

Cada quest muestra un emoji grande arriba del texto. Por defecto lo hereda de la categoría
(nueve en total, en `CATEGORY_EMOJI`) y unas dieciséis quests tienen el suyo propio.

El de `attraction` es 🫣, no un corazón ni una carita baboseando: apunta a tus nervios, no
a la otra persona. Ese detalle es la diferencia entre una app simpática y una de chamuyo.

## "No va"

Arriba a la izquierda, chiquito. Descarta la quest **para siempre**: no vuelve a salir
en ninguna noche. Sin confirmación y sin comentarios.

Es distinto de SIGUIENTE a propósito. Saltear es "acá no" o "todavía no me animo", y
animarse poco es esperable — no querés borrar una quest porque cuesta. `skippedQuestIds`
y `dislikedQuestIds` se guardan por separado justo para que el dato de calidad no quede
contaminado por el de coraje.

La lista vive en `dale.hidden-quests.v1`. Para devolver todo al mazo:

```js
localStorage.removeItem('dale.hidden-quests.v1')
```

Si llegaras a descartar el mazo entero, vuelve completo: mejor repetir que quedarte sin
nada en la mano.

## El reloj

Al aceptar arranca una cuenta regresiva de **2 minutos** (constante `DEFAULT_QUEST_SECONDS`
en `quests.ts`). Se ven los números y una línea que drena en el borde de arriba.

Llegar a cero **no hace nada**: el número se apaga en gris, la línea desaparece y la quest
se queda. HECHO sigue disponible para siempre y no se pasa sola a la siguiente. El reloj
aprieta la duda, no te saca la quest de las manos.

El tiempo se calcula contra el reloj real desde el momento en que aceptaste, así que cerrar
Safari y volver no te regala segundos.

Tres quests tienen su propio tiempo porque 120 les queda corto: bailar un tema entero (300),
que te enseñen un paso (180) y cantar con alguien (180).

**Las seis quests dirigidas a una persona puntual van sin reloj** (`seconds: null`). Un
cronómetro corriendo sobre alguien que te gusta la convierte en un objetivo con vencimiento,
y mete presión justo donde puede arruinarle el momento a la otra persona.

## Estructura

```
src/
  data/quests.ts        el mazo (lo único que hace falta tocar para cambiar contenido)
  lib/questSelector.ts  qué quest sale ahora
  lib/useCountdown.ts   la cuenta regresiva
  lib/storage.ts        localStorage
  lib/useSession.ts     estado de la noche
  components/           Home · QuestScreen · Summary
  types.ts
scripts/make-icons.mjs  genera los iconos PWA (npm run icons)
```

## Historial

Desde la home, **NOCHES ANTERIORES** (solo aparece cuando hay al menos una terminada).

Cada noche se muestra como una tira de emojis de lo que completaste, en orden, con la
fecha, el conteo y el momento que quisiste recordar. Nada más.

No es un dashboard y no debería volverse uno: sin porcentajes, sin rachas, sin promedios,
sin gráficos. Lo salteado, lo abandonado y lo descartado se sigue guardando —hace falta
para leer los datos después— pero no se muestra: mirar para atrás no tiene que sentirse
como un boletín.

**COPIAR DATOS** saca el JSON crudo. Intenta el portapapeles y, si Safari lo niega (pasa
cuando el documento no tiene foco), baja un archivo. Siempre pasa algo visible.

El archivo se describe a sí mismo:

```json
{ "player": "Fer", "exportedAt": "2026-08-14T01:17:00.000Z", "nights": [ ... ] }
```

## Quién sos

La primera vez —y solo la primera— la home muestra un campo de nombre arriba del botón.
No bloquea nada: si tocás EMPEZAR NOCHE sin escribir, se guarda vacío y no vuelve a
preguntar. Después la home queda limpia para siempre.

Se edita desde el historial, arriba de todo.

Solo sirve para etiquetar los datos. Va adentro del JSON y en el nombre del archivo
(`dale-noches-fer-2026-08-14.json`), así dos personas probando en paralelo pueden juntar
los exports sin confundirlos. No se muestra en ninguna parte de la noche.

Si borrás una quest del mazo, las noches viejas que la usaron no se rompen: desaparece de
la tira y el conteo sigue siendo correcto.

## Qué guarda

Nada sale del teléfono. En `localStorage`:

- `dale.active-session.v1` — la noche en curso. Cerrar Safari de golpe no la pierde.
  Si quedó abierta más de 12 horas, se archiva sola y se arranca de cero.
- `dale.sessions.v1` — las noches terminadas, con las respuestas del final. Es lo que
  lee el historial.
- `dale.hidden-quests.v1` — las quests descartadas con "no va".
- `dale.player.v1` — el nombre. Que la clave exista significa que ya se preguntó.

Para verlas, en la consola del navegador:

```js
JSON.parse(localStorage.getItem('dale.sessions.v1'))
```
