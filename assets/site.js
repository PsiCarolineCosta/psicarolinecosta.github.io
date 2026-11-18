/* Site Caroline V. Costa
 * Os textos do portfólio ficam na pasta /textos do repositório, um arquivo .md por texto.
 * O site lista essa pasta sozinho: para publicar um texto novo, basta criar o arquivo lá.
 */
(function () {
  var REPO = 'PsiCarolineCosta/psicarolinecosta.github.io';
  var PASTA = 'textos';
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

  /* ---------- textos ---------- */
  var lista = document.getElementById('lista-textos');
  var textos = [];

  function lerFrontMatter(bruto) {
    var meta = {}, corpo = bruto.replace(/^﻿/, '');
    var m = corpo.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
    if (m) {
      m[1].split(/\r?\n/).forEach(function (linha) {
        var i = linha.indexOf(':');
        if (i > 0) meta[linha.slice(0, i).trim().toLowerCase()] = linha.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      });
      corpo = corpo.slice(m[0].length);
    }
    return { meta: meta, corpo: corpo };
  }

  function formatarData(iso) {
    var p = (iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!p) return iso || '';
    return parseInt(p[3], 10) + ' de ' + MESES[parseInt(p[2], 10) - 1] + ' de ' + p[1];
  }

  function resumoDe(corpo) {
    var limpo = corpo.replace(/^#.*$/gm, '').replace(/[*_>#`\[\]]/g, '').replace(/\(http[^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    return limpo.length > 220 ? limpo.slice(0, 220).replace(/\s\S*$/, '') + '…' : limpo;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function desenhar() {
    if (!textos.length) {
      lista.innerHTML = '<p class="carregando">Em breve, novos textos por aqui.</p>';
      return;
    }
    lista.innerHTML = textos.map(function (t) {
      return '<a class="texto-card" href="#texto/' + esc(t.slug) + '">' +
        '<span class="texto-data">' + esc(formatarData(t.data)) + '</span>' +
        '<h3>' + esc(t.titulo) + '</h3>' +
        '<p>' + esc(t.resumo) + '</p>' +
        '<span class="texto-ler">Ler texto <span aria-hidden="true">→</span></span>' +
        '</a>';
    }).join('');
  }

  function carregarArquivo(nome) {
    return fetch(PASTA + '/' + encodeURIComponent(nome), { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (bruto) {
        var fm = lerFrontMatter(bruto);
        var slug = nome.replace(/\.md$/i, '');
        return {
          slug: slug,
          titulo: fm.meta.titulo || fm.meta.title || slug.replace(/[-_]/g, ' '),
          data: fm.meta.data || fm.meta.date || '',
          resumo: fm.meta.resumo || resumoDe(fm.corpo),
          corpo: fm.corpo
        };
      });
  }

  function listarArquivos() {
    // 1) lista a pasta pelo GitHub (assim não é preciso manter índice nenhum)
    return fetch('https://api.github.com/repos/' + REPO + '/contents/' + PASTA)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (itens) {
        return itens.filter(function (i) { return i.type === 'file' && /\.md$/i.test(i.name) && !/^leia-?me/i.test(i.name) && !/^_/.test(i.name); })
          .map(function (i) { return i.name; });
      })
      // 2) reserva: índice local, caso a API esteja indisponível
      .catch(function () {
        return fetch(PASTA + '/indice.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
      });
  }

  listarArquivos()
    .then(function (nomes) { return Promise.all(nomes.map(function (n) { return carregarArquivo(n).catch(function () { return null; }); })); })
    .then(function (itens) {
      textos = itens.filter(Boolean).sort(function (a, b) { return (b.data || '').localeCompare(a.data || ''); });
      desenhar();
      abrirPeloEndereco();
    })
    .catch(function () { lista.innerHTML = '<p class="carregando">Não foi possível carregar os textos agora.</p>'; });

  /* ---------- leitor ---------- */
  var leitor = document.getElementById('leitor');
  var markedPronto = null;

  function carregarMarked() {
    if (window.marked) return Promise.resolve();
    if (markedPronto) return markedPronto;
    markedPronto = new Promise(function (ok, erro) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js';
      s.onload = ok; s.onerror = erro;
      document.head.appendChild(s);
    });
    return markedPronto;
  }

  function renderizar(md) {
    if (window.marked) return window.marked.parse(md, { breaks: true });
    return md.split(/\n{2,}/).map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }

  function abrir(slug) {
    var t = textos.filter(function (x) { return x.slug === slug; })[0];
    if (!t) return;
    document.getElementById('leitor-titulo').textContent = t.titulo;
    document.getElementById('leitor-data').textContent = formatarData(t.data);
    var corpo = document.getElementById('leitor-corpo');
    carregarMarked().catch(function () {}).then(function () {
      corpo.innerHTML = renderizar(t.corpo);
      corpo.querySelectorAll('a[href^="http"]').forEach(function (a) { a.target = '_blank'; a.rel = 'noopener'; });
    });
    leitor.hidden = false;
    document.body.classList.add('lendo');
    leitor.querySelector('.leitor-folha').scrollTop = 0;
    document.title = t.titulo + ' · Caroline V. Costa';
  }

  function fechar() {
    leitor.hidden = true;
    document.body.classList.remove('lendo');
    document.title = 'Caroline V. Costa · Psicóloga e Psicanalista';
    if (location.hash.indexOf('#texto/') === 0) history.replaceState(null, '', '#textos');
  }

  function abrirPeloEndereco() {
    var m = location.hash.match(/^#texto\/(.+)$/);
    if (m) abrir(decodeURIComponent(m[1])); else if (!leitor.hidden) fechar();
  }

  window.addEventListener('hashchange', abrirPeloEndereco);
  leitor.addEventListener('click', function (e) { if (e.target.hasAttribute('data-fechar')) fechar(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !leitor.hidden) fechar(); });
})();
