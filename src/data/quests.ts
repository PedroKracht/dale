import type { Quest, QuestCategory } from '../types';

/**
 * Cuenta regresiva por defecto, en segundos.
 *
 * Dos minutos: el reloj tiene que apretar la duda, no la distancia. Con un minuto
 * llegás a cero todavía cruzando la pista, y un timer que se pierde por logística
 * deja de tener autoridad a la tercera quest.
 *
 * Llegar a cero no hace nada: la quest no se va, HECHO sigue disponible, no aparece
 * ningún mensaje. El reloj empuja, no castiga.
 */
export const DEFAULT_QUEST_SECONDS = 120;

/** Segundos de una quest, o `null` si no lleva reloj. */
export function questSeconds(quest: Quest): number | null {
  if (quest.seconds === null) return null;
  return quest.seconds ?? DEFAULT_QUEST_SECONDS;
}

/**
 * El muñequito de cada categoría. Una quest puede pisarlo con su propio `emoji`.
 *
 * Regla: SIEMPRE tiene que haber una cara. Sola o acompañada de un objeto, pero la
 * cara va primero. Es lo que hace que la quest te hable en vez de rotularte.
 *
 * Ojo con el de `attraction`: es 🫣 y no un corazón ni una carita baboseando. Apunta
 * a tus nervios, no a la otra persona. Ese detalle es la diferencia entre una app
 * simpática y una app de chamuyo.
 */
const CATEGORY_EMOJI: Record<QuestCategory, string> = {
  presence: '🧐',
  movement: '🤪🪩',
  music: '😃🎵',
  playful: '😜',
  social: '🥳',
  stranger: '😊👋',
  compliment: '🤗✨',
  conversation: '🙂💬',
  attraction: '🫣',
};

export function questEmoji(quest: Quest): string {
  return quest.emoji ?? CATEGORY_EMOJI[quest.category];
}

/**
 * EL MAZO.
 *
 * Este es el único archivo que hace falta tocar para cambiar el contenido de la app.
 * Para agregar una quest: copiá una línea, cambiale el id (que sea único) y el texto.
 *
 * Reglas de escritura:
 *  - Español rioplatense, tono de amigo que te tira una misión.
 *  - Una acción concreta y nada más. Sin moraleja, sin consejo, sin explicación.
 *  - Neutro: "alguien que te guste". Nunca asumir género ni orientación.
 *  - TODA QUEST ABRE UNA INTERACCIÓN, NUNCA LA CONTINÚA. Tenés que poder hacerla en
 *    frío, ahora, con alguien con quien no cruzaste una palabra. Si presupone que ya
 *    venías charlando o que la cosa venía bien, no va: la app propone la entrada,
 *    lo que pasa después es tuyo.
 *  - ENCARAR ES UNA FORMA DE VALENTÍA, NO LA VALENTÍA. Quedar en ridículo, ser el
 *    primero, decir algo sincero y pedir algo que te pueden negar valen lo mismo.
 *    Si la mitad de arriba del mazo son acercamientos, la app se vuelve otra cosa.
 *
 * Sobre los campos:
 *  - level:    la escalera (ver QuestLevel en types.ts). No se muestra nunca.
 *  - category: qué tipo de cosa es. La usa el selector para espaciar quests parecidas,
 *              y define el emoji por defecto.
 *  - emoji:    solo cuando el de la categoría no le hace justicia.
 *  - tags:     cruces temáticos. Dos de uso especial:
 *              'grupo'       -> asume que saliste acompañado.
 *              'condicional' -> depende de que pase algo en el boliche.
 *              Si alguna vez querés filtrarlas, alcanza con un .filter() acá.
 *  - seconds:  solo cuando 120 no sirve. `null` = sin reloj, y lo llevan todas las
 *              quests dirigidas a una persona puntual: un reloj corriendo sobre
 *              alguien que te gusta la convierte en un objetivo con vencimiento.
 */
export const QUESTS: Quest[] = [
  { id: 2, text: 'Cambiá de sector del boliche.', level: 0, category: 'presence', emoji: '🙂🚶' },
  { id: 3, text: 'Mirá alrededor y elegí quién parece estar pasándola mejor.', level: 0, category: 'presence', tags: ['observacion'] },

  { id: 4, text: 'Hacé contacto visual con alguien y sonreí.', level: 1, category: 'presence', emoji: '😊' },
  { id: 17, text: 'Inventá un paso de baile.', level: 1, category: 'movement', tags: ['baile'] },
  { id: 36, text: 'Copiá un paso de baile que veas.', level: 1, category: 'movement', tags: ['baile'] },
  { id: 37, text: 'Inventá un paso con alguien de tu grupo.', level: 1, category: 'movement', tags: ['baile', 'grupo'] },
  { id: 39, text: 'Sacá una foto espontánea de la gente con la que saliste.', level: 1, category: 'social', emoji: '😄📸', tags: ['foto', 'grupo'] },

  // Dura lo que dura un tema.
  { id: 1, text: 'Guardá el teléfono y bailá una canción completa.', level: 2, category: 'movement', emoji: '😌📵', tags: ['baile'], seconds: 300 },
  { id: 5, text: 'Saludá a alguien que no conozcas.', level: 2, category: 'stranger' },
  { id: 6, text: 'Saludá a alguien sin tener un vaso en la mano.', level: 2, category: 'stranger' },
  { id: 7, text: 'Preguntale a alguien si conoce la canción que está sonando.', level: 2, category: 'music', tags: ['pregunta'] },
  { id: 8, text: 'Decile "qué temazo" a alguien.', level: 2, category: 'music' },
  { id: 10, text: 'Preguntale a alguien cuál fue el mejor tema que sonó hasta ahora.', level: 2, category: 'music', tags: ['pregunta'] },
  { id: 11, text: 'Preguntale a alguien qué está tomando.', level: 2, category: 'conversation', emoji: '🙂🥤', tags: ['pregunta'] },
  { id: 12, text: 'Preguntale a alguien "¿venís seguido acá?".', level: 2, category: 'conversation', tags: ['pregunta'] },
  { id: 13, text: 'Decile a alguien que te gusta algún detalle de su look.', level: 2, category: 'compliment', tags: ['look'] },
  { id: 14, text: 'Preguntale el nombre a alguien que no conozcas.', level: 2, category: 'stranger', tags: ['pregunta'] },
  { id: 15, text: 'Preguntale a alguien de dónde es.', level: 2, category: 'conversation', tags: ['pregunta'] },
  { id: 20, text: 'Hacé un high-five con alguien que no conozcas.', level: 2, category: 'playful', emoji: '😄🙌' },
  { id: 22, text: 'Pedile a alguien que te saque una foto con la persona con la que saliste.', level: 2, category: 'social', emoji: '😁📸', tags: ['foto', 'grupo'] },
  { id: 29, text: 'Preguntale a alguien si sabe quién canta el tema que está sonando.', level: 2, category: 'music', tags: ['pregunta'] },
  { id: 30, text: 'Preguntale a alguien qué tema pediría ahora mismo al DJ.', level: 2, category: 'music', tags: ['pregunta'] },
  { id: 31, text: 'Preguntale a alguien cuál es su tema favorito para bailar.', level: 2, category: 'music', tags: ['pregunta'] },
  { id: 32, text: 'Preguntale a alguien qué otro boliche recomienda.', level: 2, category: 'conversation', tags: ['pregunta'] },
  { id: 33, text: 'Preguntale a alguien si recién llega o está hace rato.', level: 2, category: 'conversation', tags: ['pregunta'] },
  { id: 34, text: 'Decile "bailás muy bien" a alguien que baile bien.', level: 2, category: 'compliment', tags: ['condicional', 'baile'] },
  { id: 35, text: 'Brindá con alguien que no conozcas.', level: 2, category: 'stranger', emoji: '😄🥂' },
  { id: 40, text: 'Preguntale a alguien si le gusta más el tema que está sonando o el anterior.', level: 2, category: 'music', tags: ['pregunta'] },
  { id: 41, text: 'Preguntale a alguien cuál fue el peor tema que sonó hasta ahora.', level: 2, category: 'music', tags: ['pregunta'] },
  { id: 42, text: 'Preguntale a alguien si vino por la música o por el lugar.', level: 2, category: 'conversation', tags: ['pregunta'] },
  { id: 44, text: 'Encontrá a alguien con una prenda del mismo color que vos y decile "mismo equipo".', level: 2, category: 'playful', emoji: '😎👕', tags: ['condicional', 'look'] },
  { id: 45, text: 'Decile a alguien que te gustan sus zapatillas.', level: 2, category: 'compliment', emoji: '🤩👟', tags: ['look'] },
  { id: 46, text: 'Pedile a alguien que te recomiende una canción.', level: 2, category: 'music' },
  { id: 47, text: 'Preguntale a alguien si conoce algún lugar mejor para salir por la zona.', level: 2, category: 'conversation', tags: ['pregunta'] },
  { id: 55, text: 'Preguntale a alguien "Pregunta importante: ¿este tema suma o resta?".', level: 2, category: 'playful', tags: ['pregunta'] },
  { id: 56, text: 'Si alguien tiene un accesorio que te llame la atención, preguntale dónde lo consiguió.', level: 2, category: 'conversation', tags: ['condicional', 'pregunta', 'look'] },

  { id: 9, text: 'Decile algo positivo y genuino a una persona que no te atraiga particularmente.', level: 3, category: 'compliment' },
  { id: 18, text: 'Cantá un estribillo como si estuvieras en un recital.', level: 3, category: 'playful', emoji: '😆🎤', tags: ['canto'] },
  // Hay que esperar el momento del tema.
  { id: 19, text: 'Cantá un pedazo de una canción con alguien que no conozcas.', level: 3, category: 'playful', emoji: '😁🎤', tags: ['canto'], seconds: 180 },
  { id: 21, text: 'Preguntale a un grupo "¿qué están festejando?".', level: 3, category: 'social', tags: ['pregunta'] },
  { id: 38, text: 'Pedile a alguien que no conozcas que te saque una foto.', level: 3, category: 'stranger', emoji: '😅📸', tags: ['foto'] },
  { id: 43, text: 'Preguntale a alguien "¿qué edad me das?".', level: 3, category: 'playful', emoji: '🤨', tags: ['pregunta'] },
  { id: 58, text: 'Salí a bailar a un sector donde no esté bailando nadie.', level: 3, category: 'movement', emoji: '😳🪩', tags: ['baile'] },
  { id: 61, text: 'Decile a alguien con quien saliste algo que te guste de esa persona.', level: 3, category: 'compliment', emoji: '🥹✨', tags: ['grupo'] },
  { id: 62, text: 'Contale un chiste malo a alguien que no conozcas.', level: 3, category: 'playful', emoji: '😬🥁' },
  { id: 63, text: 'Sacate una foto con alguien que acabás de conocer.', level: 3, category: 'stranger', emoji: '🥳📸', tags: ['foto'] },

  // Pedirlo es rápido; que te lo enseñen, no.
  { id: 16, text: 'Pedile a alguien que te enseñe un paso de baile.', level: 4, category: 'movement', emoji: '😅🪩', tags: ['baile'], seconds: 180 },
  { id: 59, text: 'Pedile al DJ que pase un tema.', level: 4, category: 'music', emoji: '😅🎧' },
  { id: 60, text: 'Preguntale a un grupo que no conozcas si te podés sumar a bailar con ellos.', level: 4, category: 'social', tags: ['baile'] },

  // Las de acá abajo van sin reloj a propósito.
  { id: 24, text: 'A alguien que te guste, decile algo concreto de su look que te llamó la atención.', level: 3, category: 'attraction', tags: ['look'], seconds: null },
  { id: 28, text: 'Preguntale a alguien que te guste "¿cómo viene tu noche?".', level: 3, category: 'attraction', tags: ['pregunta'], seconds: null },
  { id: 51, text: 'Acercate a alguien que te guste y decile tu nombre.', level: 3, category: 'attraction', seconds: null },
  { id: 53, text: 'Si cruzás mirada dos veces con alguien que te guste, acercate y decile hola.', level: 3, category: 'attraction', tags: ['condicional'], seconds: null },
  { id: 54, text: 'Si alguien que te gusta está cantando el tema, cantá una parte con esa persona.', level: 3, category: 'attraction', tags: ['condicional', 'canto'], seconds: null },
  { id: 26, text: 'Invitá a bailar a alguien que te guste.', level: 4, category: 'attraction', tags: ['baile'], seconds: null },

  // Ids libres (23, 25, 27, 48, 49, 50, 52, 57): eran ocho variantes de "acercate a
  // alguien que te guste y decile una frase". Los ids no se reciclan porque las
  // noches archivadas los referencian.
];
