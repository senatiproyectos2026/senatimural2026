const quotes = [
  "60 años formando el talento que transforma al Perú.",
  "Por encima de todo, potenciando tu talento.",
  "Seis décadas impulsando el desarrollo del país.",
  "La excelencia se construye con experiencia.",
  "Innovar es parte de nuestra historia.",
  "El conocimiento abre caminos.",
  "Formamos personas que construyen el mañana.",
  "El progreso comienza con una buena formación.",
  "60 años convirtiendo sueños en profesiones.",
  "Aprender hoy, transformar el mañana.",
  "Cada generación deja su huella.",
  "La tecnología cambia, nuestros valores permanecen.",
  "Orgullosos de nuestro pasado, preparados para el futuro.",
  "La educación técnica mueve al Perú.",
  "Donde hay talento, hay oportunidad.",
  "Creciendo junto a la industria peruana.",
  "La experiencia nos impulsa a innovar.",
  "Formamos líderes para los desafíos del futuro.",
  "El conocimiento se convierte en progreso.",
  "60 años inspirando excelencia.",
  "Aprender es el primer paso hacia el éxito.",
  "El futuro pertenece a quienes se preparan.",
  "Transformamos esfuerzo en oportunidades.",
  "Cada aula construye un mejor país.",
  "Nuestra historia continúa en cada estudiante.",
  "La pasión por enseñar deja huella.",
  "Innovación con propósito.",
  "Más que formar técnicos, formamos profesionales.",
  "El talento se fortalece con disciplina.",
  "Juntos construimos un Perú más competitivo.",
  "El éxito comienza con una decisión: aprender.",
  "La educación transforma vidas.",
  "El conocimiento nunca deja de avanzar.",
  "La calidad es nuestro mejor legado.",
  "Seis décadas creando oportunidades.",
  "Preparando a quienes transforman la industria.",
  "El futuro se construye con capacitación.",
  "Cada logro comienza con un aprendizaje.",
  "La innovación nace del conocimiento.",
  "Donde otros ven retos, nosotros vemos oportunidades.",
  "60 años sembrando progreso.",
  "El compromiso hace la diferencia.",
  "El talento impulsa el desarrollo.",
  "Aprender, crear e innovar.",
  "El orgullo de pertenecer se construye cada día.",
  "Nuestra mejor tradición es la innovación.",
  "El futuro del Perú se forma aquí.",
  "60 años marcando la diferencia.",
  "Unidos por un mismo propósito: transformar vidas.",
  "60 años de SENATI: formando el talento que impulsa el Perú."
];

function getRandomQuote() {
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}

module.exports = {
  quotes,
  getRandomQuote
};
