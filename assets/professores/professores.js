/* Dados e utilitarios das paginas de professores (professores.html e professor.html).
   Usa a API oficial quando ela responde; senao, a copia em dados.js. */
(function () {
  var SITE = 'https://faculdadebatistalogos.edu.br';
  var snap = (window.LOGOS_PROFESSORES || { professors: [] }).professors;

  function clean(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function byName(a, b) { return a.name.localeCompare(b.name, 'pt'); }

  function fromApi(p) {
    var saved = snap.filter(function (s) { return s.id === p.id; })[0] || {};
    var img = p.imageUrl && !/anonimo/i.test(p.imageUrl) ? p.imageUrl : '';
    return {
      id: p.id, name: clean(p.name), description: clean(p.description),
      areas: (p.knowledgeArea || []).map(clean).filter(Boolean),
      isGuest: !!p.isGuest,
      /* foto otimizada local; professor novo usa a do site oficial */
      photo: saved.photo || (img ? SITE + '/img/professores/' + img : '')
    };
  }

  function esc(t) { var d = document.createElement('div'); d.textContent = t == null ? '' : t; return d.innerHTML; }
  function initials(name) {
    var w = name.split(' ').filter(function (x) { return /^[A-ZÀ-Ý]/.test(x); });
    return ((w[0] || '?')[0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
  }

  /* cursos que cada professor coordena (dados dos cursos, quando a pagina os carrega) */
  function coordinations(id) {
    var c = window.LOGOS_CURSOS ? window.LOGOS_CURSOS.courses : [];
    return c.filter(function (x) { return x.coordinatorId === id; });
  }

  window.LogosProfessores = {
    snapshot: function () { return snap.slice().sort(byName); },
    live: function () {
      return fetch('/api/list-professors', { headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) {
          if (!Array.isArray(d) || !d.length) throw new Error('vazio');
          return d.filter(function (p) { return p.isActive; }).map(fromApi).sort(byName);
        })
        .catch(function () { return null; });
    },
    coordinations: coordinations,
    initials: initials,
    esc: esc,
    detailUrl: function (p, page) { return (page || 'professor.html') + '?id=' + encodeURIComponent(p.id); },

    /* cartao do professor: retrato, nome e areas */
    card: function (p, page) {
      var coord = coordinations(p.id).length > 0;
      var badge = p.isGuest ? '<span class="pf-badge">Convidado</span>' : (coord ? '<span class="pf-badge is-gold">Coordenação</span>' : '');
      return '<li><article class="pf-card">' +
        '<div class="pf-photo">' + badge +
          (p.photo ? '<img src="' + esc(p.photo) + '" alt="" loading="lazy" width="360" height="480" />'
                   : '<span class="pf-initials" aria-hidden="true">' + initials(p.name) + '</span>') +
        '</div>' +
        '<div class="pf-body">' +
          '<h3 class="pf-name"><a href="' + esc(this.detailUrl(p, page)) + '">' + esc(p.name) + '</a></h3>' +
          (p.areas.length ? '<p class="pf-areas">' + esc(p.areas.slice(0, 2).join(', ')) + (p.areas.length > 2 ? ' e mais' : '') + '</p>' : '') +
          '<span class="pf-more" aria-hidden="true">Ver perfil<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>' +
        '</div></article></li>';
    }
  };
})();
