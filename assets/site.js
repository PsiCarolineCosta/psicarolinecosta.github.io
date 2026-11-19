/* Site Caroline V. Costa
 * "Meus textos" puxa sozinho os artigos publicados no Medium (@carolinevieira.psi).
 * Publicou no Medium, aparece aqui: não é preciso mexer no site.
 */
(function () {
  var MEDIUM = 'https://medium.com/feed/@carolinevieira.psi';
  var API = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(MEDIUM);
  var MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

  /* ---------- menu mobile ---------- */
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');
  btn.addEventListener('click', function () {
    var aberto = menu.classList.toggle('aberto');
    btn.setAttribute('aria-expanded', aberto);
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { menu.classList.remove('aberto'); btn.setAttribute('aria-expanded', false); }
  });
  window.addEventListener('scroll', function () {
    document.getElementById('topo').classList.toggle('rolado', window.scrollY > 20);
  }, { passive: true });

  /* ---------- textos do Medium ---------- */
  var lista = document.getElementById('lista-textos');

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function formatarData(s) {
    var p = (s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return p ? parseInt(p[3], 10) + ' de ' + MESES[parseInt(p[2], 10) - 1] + ' de ' + p[1] : '';
  }
  function resumo(html) {
    var d = document.createElement('div');
    d.innerHTML = (html || '').replace(/<figure[\s\S]*?<\/figure>/g, '');
    var t = (d.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length > 230 ? t.slice(0, 230).replace(/\s\S*$/, '') + '…' : t;
  }
  function limparLink(u) { return (u || '').split('?')[0]; }

  function desenhar(itens) {
    if (!itens.length) {
      lista.innerHTML = '<p class="carregando">Em breve, novos textos por aqui.</p>';
      return;
    }
    lista.innerHTML = itens.map(function (t) {
      return '<a class="texto-card" href="' + esc(limparLink(t.link)) + '" target="_blank" rel="noopener">' +
        '<span class="texto-data">' + esc(formatarData(t.pubDate)) + '</span>' +
        '<h3>' + esc(t.title) + '</h3>' +
        '<p>' + esc(resumo(t.content || t.description)) + '</p>' +
        '<span class="texto-ler">Ler no Medium <span aria-hidden="true">↗</span></span>' +
        '</a>';
    }).join('');
    lista.scrollLeft = 0;
    atualizarSetas();
  }

  /* setas do carrossel */
  var ant = document.getElementById('seta-ant');
  var prox = document.getElementById('seta-prox');
  function passo() {
    var c = lista.querySelector('.texto-card');
    return c ? c.getBoundingClientRect().width + 24 : lista.clientWidth;
  }
  function atualizarSetas() {
    var max = lista.scrollWidth - lista.clientWidth - 4;
    ant.disabled = lista.scrollLeft <= 4;
    prox.disabled = lista.scrollLeft >= max;
  }
  ant.addEventListener('click', function () { lista.scrollBy({ left: -passo(), behavior: 'smooth' }); });
  prox.addEventListener('click', function () { lista.scrollBy({ left: passo(), behavior: 'smooth' }); });
  lista.addEventListener('scroll', atualizarSetas, { passive: true });
  window.addEventListener('resize', atualizarSetas);

  var cache = null;
  try { cache = JSON.parse(sessionStorage.getItem('medium-textos') || 'null'); } catch (e) {}
  if (cache && cache.length) desenhar(cache);

  fetch(API)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      if (d.status !== 'ok') throw new Error(d.message || 'feed');
      var itens = (d.items || []).slice(0, 9);
      desenhar(itens);
      try { sessionStorage.setItem('medium-textos', JSON.stringify(itens)); } catch (e) {}
    })
    .catch(function () {
      if (!cache) lista.innerHTML = '<p class="carregando">Os textos estão publicados no Medium — acesse pelo botão abaixo.</p>';
    });
})();
