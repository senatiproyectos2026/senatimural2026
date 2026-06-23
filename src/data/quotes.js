const quotes = [
  "El arte lava del alma el polvo de la vida cotidiana.",
  "La ciencia es la poesia de la realidad.",
  "La historia es memoria viva.",
  "Crear es resistir al olvido.",
  "La belleza comienza cuando algo nos pregunta.",
  "Todo gran descubrimiento nace de una duda.",
  "El pasado conversa con quien sabe mirar.",
  "El arte no reproduce lo visible: lo hace visible.",
  "La imaginacion es el laboratorio del futuro.",
  "Cada epoca deja una huella en la luz.",
  "La curiosidad enciende la inteligencia.",
  "Un museo guarda preguntas, no solo respuestas.",
  "La ciencia avanza cuando alguien se atreve a medir lo invisible.",
  "El color tambien piensa.",
  "La historia cambia cuando cambia quien la cuenta.",
  "Observar es el primer acto de creacion.",
  "El conocimiento crece cuando se comparte.",
  "Toda obra es una ventana hacia otra mirada.",
  "La memoria colectiva tambien se construye en imagenes.",
  "El futuro empieza como una idea improbable."
];

function getRandomQuote() {
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}

module.exports = {
  quotes,
  getRandomQuote
};
