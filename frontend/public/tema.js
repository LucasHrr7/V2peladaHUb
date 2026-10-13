// Aplica o tema antes do React carregar, evitando "piscar" claro/escuro.
try {
  var t = localStorage.getItem('peladahub-tema') || 'sistema'
  var dark = t === 'escuro' || (t === 'sistema' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
} catch (e) {}
