/* Dados e utilitarios das paginas de cursos (cursos.html e curso.html).
   Usa a API oficial quando ela responde; senao, a copia em dados.js. */
(function () {
  var SITE = 'https://faculdadebatistalogos.edu.br';
  var snap = window.LOGOS_CURSOS || { courses: [], coordinators: {} };

  function clean(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function slug(id) { return (id || '').replace(/^-+/, '').toLowerCase().slice(0, 10); }

  /* converte um curso da API para o formato da copia salva */
  function fromApi(c) {
    var saved = snap.courses.filter(function (s) { return s.id === c.id; })[0] || {};
    var cur = c.curriculum || {};
    var fmt = function (list) { return (list || []).map(function (f) { return f.description; }); };
    var fin = (c.financial || []).map(function (x) {
      return { monthly: x.monthlyAmount, note: clean(x.description), format: fmt(c.formats).join(', '), name: clean(c.name) };
    });
    (c.subCourses || []).forEach(function (sc) {
      (sc.financial || []).forEach(function (x) {
        fin.push({ monthly: x.monthlyAmount, note: clean(x.description), format: fmt(sc.formats).join(', '), name: clean(sc.name) });
      });
    });
    var subj = function (s) { return { name: clean(s.name), workload: s.workload }; };
    return {
      id: c.id, name: clean(c.name), description: clean(c.description),
      time: clean(c.time), duration: clean(c.duration), workload: clean(c.workload), target: clean(c.target),
      formats: fmt(c.formats),
      category: clean(c.category && c.category.description),
      levelId: c.levelId || 0,
      level: clean(c.level && c.level.description) || 'Livre',
      semesters: (cur.semesters || []).map(function (s) { return (s.subjects || []).map(subj); }),
      optionals: (cur.optionals || []).map(subj),
      financial: fin,
      regulations: (c.regulations || []).filter(function (r) { return r.url; }).map(function (r) { return { name: clean(r.name), url: r.url }; }),
      isMEC: !!c.isMEC, isApproved: !!c.isApproved,
      /* imagens: a versao otimizada local, ou a do site oficial para curso novo */
      img: saved.img || (c.mainImageUrl ? SITE + '/img/cursos/' + c.mainImageUrl : ''),
      img2: saved.img2 || (c.secondaryImageUrl ? SITE + '/img/cursos/' + c.secondaryImageUrl : ''),
      coordinatorId: (c.cordenator && c.cordenator.id) || ''
    };
  }

  var ORDER = { 1: 0, 2: 1, 3: 2, 0: 3 };
  function sortCourses(list) {
    return list.slice().sort(function (a, b) { return (ORDER[a.levelId] - ORDER[b.levelId]) || 0; });
  }

  window.LogosCursos = {
    snapshot: function () { return sortCourses(snap.courses); },

    /* tenta a API; resolve com a lista ao vivo, ou com null se nao houver */
    live: function () {
      return fetch('/api/list-all-courses-active', { headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) { if (!Array.isArray(d) || !d.length) throw new Error('vazio'); return sortCourses(d.map(fromApi)); })
        .catch(function () { return null; });
    },

    coordinator: function (id) {
      if (!id) return Promise.resolve(null);
      if (snap.coordinators[id]) return Promise.resolve(snap.coordinators[id]);
      return fetch('/api/get-professor-by-id?professorId=' + encodeURIComponent(id), { method: 'POST' })
        .then(function (r) { return r.json(); })
        .then(function (p) {
          return p && p.name ? {
            name: clean(p.name), description: clean(p.description),
            photo: p.imageUrl ? SITE + '/img/professores/' + p.imageUrl : '',
            areas: (p.knowledgeArea || []).map(clean).filter(Boolean)
          } : null;
        })
        .catch(function () { return null; });
    },

    money: function (v) {
      var n = Number(v) || 0;
      return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
    },
    minPrice: function (c) {
      var v = (c.financial || []).map(function (f) { return Number(f.monthly) || 0; }).filter(function (n) { return n > 0; });
      return v.length ? Math.min.apply(null, v) : 0;
    },
    /* inscricao e vestibular continuam nos formularios do site oficial */
    subscribeUrl: function (c) { return SITE + '/Cursos/Detalhes/' + c.id + '?subscription=true'; },
    vestibularUrl: function (c) { return SITE + '/Cursos/Vestibular/' + c.id; },
    /* regra do site oficial: curso reconhecido pelo MEC fora da pos entra pelo vestibular */
    usesVestibular: function (c) { return c.isMEC && c.isApproved && c.levelId !== 2; },
    detailUrl: function (c, page) { return (page || 'curso.html') + '?id=' + encodeURIComponent(c.id); },
    esc: function (t) { var d = document.createElement('div'); d.textContent = t == null ? '' : t; return d.innerHTML; },
    slug: slug
  };

  var ICON = {
    clock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
    mode: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="1"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/></svg>',
    arrow: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
  };
  window.LogosCursos.icon = ICON;

  /* cartao de curso usado no catalogo e nas sugestoes */
  window.LogosCursos.card = function (c, page) {
    var L = window.LogosCursos, e = L.esc, p = L.minPrice(c);
    return '<li><article class="cc-card">' +
      '<div class="cc-media">' +
        '<img src="' + e(c.img) + '" alt="" loading="lazy" width="363" height="363" />' +
      '</div>' +
      '<div class="cc-body">' +
        '<p class="cc-eyebrow">' + e(c.levelId ? c.level : 'Curso livre') + '</p>' +
        '<h3 class="cc-name"><a href="' + e(L.detailUrl(c, page)) + '">' + e(c.name) + '</a></h3>' +
        (c.category && c.name.toLowerCase().indexOf(c.category.toLowerCase()) === -1 ? '<p class="cc-area">' + e(c.category) + '</p>' : '') +
        '<dl class="cc-facts">' +
          '<div><dt>Duração</dt><dd>' + e(c.duration || '—') + '</dd></div>' +
          '<div><dt>Modalidade</dt><dd>' + e(c.formats.join(', ') || '—') + '</dd></div>' +
        '</dl>' +
        '<div class="cc-foot">' +
          (p ? '<p class="cc-price">a partir de<strong>' + L.money(p) + ' <small>/mês</small></strong></p>' : '<span></span>') +
          '<span class="cc-go" aria-hidden="true"><span>Ver curso</span>' + ICON.arrow + '</span>' +
        '</div>' +
      '</div></article></li>';
  };
})();
