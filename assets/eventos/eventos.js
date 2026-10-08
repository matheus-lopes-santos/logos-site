/* Dados e utilitarios dos eventos (home, eventos.html e evento.html).
   Usa a API oficial quando ela responde; senao, a copia em dados.js.
   Proximo evento = ainda nao terminou (data final de hoje em diante). */
(function () {
  var SITE = 'https://faculdadebatistalogos.edu.br';
  var snap = (window.LOGOS_EVENTOS || { events: [] }).events;
  var MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var CAMPUS = /armando de arruda|faculdade batista logos/i;

  function esc(t) { var d = document.createElement('div'); d.textContent = t == null ? '' : t; return d.innerHTML; }
  function clean(t) { return (t || '').replace(/[ \t]+/g, ' ').trim(); }
  function day(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
    return m ? new Date(+m[1], m[2] - 1, +m[3]) : null;
  }
  function today() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }

  /* texto livre da API: so links <a href> sobrevivem, o resto vira texto */
  function richText(t) {
    var out = '', re = /<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, i = 0, m;
    while ((m = re.exec(t))) {
      out += esc(t.slice(i, m.index).replace(/<[^>]+>/g, ''));
      if (/^(https?:|mailto:)/i.test(m[1])) out += '<a href="' + esc(m[1]) + '" target="_blank" rel="noopener">' + esc(m[2].replace(/<[^>]+>/g, '')) + '</a>';
      else out += esc(m[2]);
      i = re.lastIndex;
    }
    return out + esc(t.slice(i).replace(/<[^>]+>/g, ''));
  }

  function norm(e) {
    var saved = snap.filter(function (s) { return s.id === e.id; })[0] || {};
    var start = day(e.startDate), end = day(e.endDate) || start;
    if (start && end < start) end = start;           /* datas invertidas no cadastro */
    var days = ((e.schedule || {}).days || []).map(function (d) {
      return {
        name: clean(d.name), date: day(d.date),
        moments: (d.moments || []).map(function (m) {
          return { time: m.timeLabel || '', items: (m.attractions || []).map(function (a) {
            var sp = a.speaker && typeof a.speaker === 'object' ? a.speaker.name : a.speaker;
            return { name: clean(a.name), description: clean(a.description), note: clean(a.additionalNote), tag: clean(a.tag), speaker: clean(sp) };
          }).filter(function (a) { return a.name; }) };
        }).filter(function (m) { return m.items.length; })
      };
    }).filter(function (d) { return d.moments.length; });
    var external = !!(e.isExternalManagement && e.externalUrl);
    return {
      id: e.id, name: clean(e.name),
      description: (e.description || '').split(/\n+/).map(clean).filter(Boolean),
      info: (e.additionalInformation || '').split(/,?\s*\n+/).map(function (s) { return clean(s).replace(/,$/, ''); }).filter(Boolean),
      location: clean(e.location), format: clean((e.format || {}).description),
      start: start, end: end,
      subscribeUrl: external ? e.externalUrl : SITE + '/eventos/detalhes/' + encodeURIComponent(clean(e.name)),
      external: external,
      packages: (e.packageOptions || []).map(function (p) {
        return { name: clean(p.name), description: clean(p.description), amount: Number(p.amount) || 0, isFull: !!p.isFull };
      }),
      speakers: (e.speakers || []).map(function (s) { return clean(s.name); }).filter(Boolean),
      days: days,
      /* imagem otimizada local; evento novo usa a do site oficial */
      image: 'image' in e ? e.image : saved.id ? saved.image : SITE + '/img/events/' + e.id + '.jpg'
    };
  }

  function valid(e) { return e.name && e.start && !/^evento teste$/i.test(e.name); }
  function byStart(a, b) { return a.start - b.start; }

  var api = {
    esc: esc,
    richText: richText,
    snapshot: function () { return snap.map(norm).filter(valid); },
    live: function () {
      return fetch('/api/list-all-events', { headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) {
          if (!Array.isArray(d) || !d.length) throw new Error('vazio');
          var list = d.map(norm).filter(valid), ids = {};
          list.forEach(function (e) { ids[e.id] = 1; });
          /* eventos cadastrados so no arquivo local continuam aparecendo */
          return list.concat(api.snapshot().filter(function (e) { return !ids[e.id]; }));
        })
        .catch(function () { return null; });
    },
    isUpcoming: function (e) { return e.end >= today(); },
    upcoming: function (list) { return list.filter(api.isUpcoming).sort(byStart); },
    past: function (list) { return list.filter(function (e) { return !api.isUpcoming(e); }).sort(function (a, b) { return b.start - a.start; }); },
    find: function (list, id) { return list.filter(function (e) { return e.id === id; })[0]; },
    detailUrl: function (e, page) { return (page || 'evento.html') + '?id=' + encodeURIComponent(e.id); },

    /* "25 a 27 de abril de 2024", "30 de setembro a 2 de outubro de 2024" */
    dateLabel: function (e) {
      var s = e.start, f = e.end, D = function (d) { return d.getDate() === 1 ? '1º' : d.getDate(); };
      if (+s === +f) return D(s) + ' de ' + MONTHS[s.getMonth()] + ' de ' + s.getFullYear();
      if (s.getFullYear() !== f.getFullYear()) return D(s) + ' de ' + MONTHS[s.getMonth()] + ' de ' + s.getFullYear() + ' a ' + D(f) + ' de ' + MONTHS[f.getMonth()] + ' de ' + f.getFullYear();
      if (s.getMonth() !== f.getMonth()) return D(s) + ' de ' + MONTHS[s.getMonth()] + ' a ' + D(f) + ' de ' + MONTHS[f.getMonth()] + ' de ' + f.getFullYear();
      return D(s) + (f - s === 864e5 ? ' e ' : ' a ') + D(f) + ' de ' + MONTHS[s.getMonth()] + ' de ' + s.getFullYear();
    },
    /* selo de data: dia(s), mes abreviado, ano */
    badge: function (e) {
      var s = e.start, f = e.end, sameMonth = s.getMonth() === f.getMonth() && s.getFullYear() === f.getFullYear();
      return '<span class="ev-badge"><b>' + s.getDate() + (+s !== +f && sameMonth ? '–' + f.getDate() : '') + '</b>' +
        '<span>' + MONTHS[s.getMonth()].slice(0, 3) + (sameMonth ? '' : ' – ' + MONTHS[f.getMonth()].slice(0, 3)) + '</span>' +
        '<small>' + s.getFullYear() + '</small></span>';
    },
    place: function (e) {
      if (/zoom|online/i.test(e.location) || (/online/i.test(e.format) && !e.location)) return 'Online';
      return CAMPUS.test(e.location) ? 'Faculdade Batista Logos' : e.location;
    },
    firstTime: function (e) { return e.days.length && e.days[0].moments.length ? e.days[0].moments[0].time : ''; },
    minPrice: function (e) {
      var v = e.packages.map(function (p) { return p.amount; }).filter(function (n) { return n > 0; });
      return v.length ? Math.min.apply(null, v) : 0;
    },
    money: function (n) { return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); },
    calendarUrl: function (e) {
      var f = function (d) { return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2); };
      var end = new Date(e.end); end.setDate(end.getDate() + 1);
      return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(e.name) +
        '&dates=' + f(e.start) + '/' + f(end) + '&location=' + encodeURIComponent(e.location || 'Faculdade Batista Logos') +
        '&details=' + encodeURIComponent(e.description.join('\n'));
    },

    /* capa: a arte inteira sobre um fundo desfocado dela mesma, para caber
       artes 16:9 e faixas largas no mesmo quadro sem cortar o texto */
    cover: function (e, cls) {
      if (!e.image) return '<div class="ev-cover is-empty' + (cls ? ' ' + cls : '') + '"><span class="ev-cover-ph" aria-hidden="true"><b>ΛΟΓΟΣ</b><i>' + esc(e.name) + '</i></span></div>';
      return '<div class="ev-cover' + (cls ? ' ' + cls : '') + '">' +
        '<img class="ev-cover-bg" src="' + esc(e.image) + '" alt="" aria-hidden="true" loading="lazy" />' +
        '<img class="ev-cover-img" src="' + esc(e.image) + '" alt="' + esc(e.name) + '" loading="lazy" onerror="LogosEventos.noImage(this)" />' +
        '<span class="ev-cover-ph" aria-hidden="true"><b>ΛΟΓΟΣ</b><i>' + esc(e.name) + '</i></span>' +
        '</div>';
    },
    /* sem imagem: tenta .png no site oficial e, por fim, a capa tipografica */
    noImage: function (img) {
      var box = img.parentNode, src = img.getAttribute('src');
      if (/\.jpg$/.test(src) && src.indexOf(SITE) === 0) {
        var png = src.replace(/\.jpg$/, '.png');
        img.setAttribute('src', png); box.querySelector('.ev-cover-bg').setAttribute('src', png);
        return;
      }
      img.onerror = null;
      box.classList.add('is-empty');
    },

    /* cartao compacto (eventos anteriores e "outros eventos") */
    card: function (e, page) {
      return '<li><article class="ev-card">' + api.cover(e) +
        '<div class="ev-card-body">' +
          '<p class="ev-card-date">' + esc(api.dateLabel(e)) + '</p>' +
          '<h3 class="ev-card-name"><a href="' + esc(api.detailUrl(e, page)) + '">' + esc(e.name) + '</a></h3>' +
          '<p class="ev-card-meta">' + esc([e.format, api.place(e)].filter(Boolean).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(' · ')) + '</p>' +
          '<span class="ev-card-more" aria-hidden="true">Ver detalhes<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>' +
        '</div></article></li>';
    }
  };
  window.LogosEventos = api;
})();
