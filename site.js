// Builds the public page from /api/content. The static markup in index.html
// stays in place as a fallback if the request fails.
(function () {
  'use strict';

  var app = document.getElementById('app');
  var SVG = 'http://www.w3.org/2000/svg';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function tick(i) {
    var s = document.createElementNS(SVG, 'svg');
    s.setAttribute('class', 'tick');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', 'M3 13l6 6L21 4');
    s.appendChild(p);
    return s;
  }

  // Text with web addresses turned into links. Everything is inserted as text, never as HTML.
  function linkify(parent, str) {
    str.split(/(https?:\/\/[^\s<]+)/g).forEach(function (part, i) {
      if (i % 2 === 1) {
        var a = el('a', null, part);
        a.href = part;
        a.target = '_blank';
        a.rel = 'noopener nofollow';
        parent.appendChild(a);
      } else if (part) {
        parent.appendChild(document.createTextNode(part));
      }
    });
  }

  // Blank line = new paragraph. A block where every line starts with "- " becomes a list of "Title: description" rows.
  function renderText(parent, body) {
    body.split(/\n{2,}/).forEach(function (block) {
      var lines = block.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lines.length) return;
      var isList = lines.every(function (l) { return l.indexOf('- ') === 0; });
      if (isList) {
        var dl = el('dl', 'areas');
        lines.forEach(function (l) {
          var row = el('div');
          var rest = l.slice(2);
          var at = rest.indexOf(': ');
          if (at > 0) {
            row.appendChild(el('dt', null, rest.slice(0, at)));
            var dd = el('dd');
            linkify(dd, rest.slice(at + 2));
            row.appendChild(dd);
          } else {
            var only = el('dd');
            linkify(only, rest);
            row.appendChild(only);
          }
          dl.appendChild(row);
        });
        parent.appendChild(dl);
      } else {
        var p = el('p');
        linkify(p, lines.join('\n'));
        parent.appendChild(p);
      }
    });
  }

  function sizeLabel(bytes) {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function mediaItem(m) {
    var type = m.type || '';
    if (type.indexOf('image/') === 0) {
      var link = el('a');
      link.href = m.url;
      link.target = '_blank';
      link.rel = 'noopener';
      var img = el('img');
      img.src = m.url;
      img.alt = m.name || '';
      img.loading = 'lazy';
      link.appendChild(img);
      return link;
    }
    if (type.indexOf('video/') === 0) {
      var v = el('video');
      v.src = m.url;
      v.controls = true;
      v.preload = 'metadata';
      v.setAttribute('playsinline', '');
      return v;
    }
    if (type.indexOf('audio/') === 0) {
      var au = el('audio');
      au.src = m.url;
      au.controls = true;
      au.preload = 'none';
      return au;
    }
    var a = el('a', 'file', m.name || 'Download file');
    a.href = m.url;
    a.target = '_blank';
    a.rel = 'noopener';
    var size = sizeLabel(m.size);
    if (size) a.appendChild(el('small', null, size));
    return a;
  }

  function sheet(letter, id) {
    var s = el('section', 'sheet');
    if (id) s.id = id;
    var ref = el('span', 'ref', letter);
    ref.setAttribute('aria-hidden', 'true');
    var body = el('div', 'body');
    s.appendChild(ref);
    s.appendChild(body);
    return { sheet: s, body: body };
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function render(c) {
    var frag = document.createDocumentFragment();

    var head = el('header', 'sheet head');
    var headRef = el('span', 'ref');
    headRef.setAttribute('aria-hidden', 'true');
    var headBody = el('div', 'body');
    headBody.appendChild(el('h1', null, c.name));
    if (c.facts && c.facts.length) {
      var ul = el('ul', 'facts');
      c.facts.forEach(function (f, i) {
        var li = el('li');
        li.style.setProperty('--i', i);
        li.appendChild(tick(i));
        li.appendChild(el('span', 'k', f.label));
        li.appendChild(el('span', 'v', f.value));
        ul.appendChild(li);
      });
      headBody.appendChild(ul);
      var legend = el('p', 'legend');
      legend.appendChild(tick(0));
      legend.appendChild(document.createTextNode('Agreed to source'));
      headBody.appendChild(legend);
    }
    head.appendChild(headRef);
    head.appendChild(headBody);
    frag.appendChild(head);

    var index = 0;
    (c.sections || []).forEach(function (s) {
      var x = sheet(String.fromCharCode(65 + (index % 26)), s.id);
      index++;
      if (s.title) x.body.appendChild(el('h2', null, s.title));
      renderText(x.body, s.body || '');
      frag.appendChild(x.sheet);
    });

    // Professional overview is additive: never overwrite the owner's saved Blob content.
    var existingIds = (c.sections || []).map(function (section) { return section.id; });
    if (existingIds.indexOf('experience') === -1) {
      var experience = sheet(String.fromCharCode(65 + (index % 26)), 'experience');
      index++;
      experience.body.appendChild(el('h2', null, 'Professional experience'));
      renderText(experience.body,
        'Senior Associate in Audit & Assurance at Deloitte Bangladesh, working across statutory and group audit engagements. Experience spans manufacturing, paints and coatings, agrochemicals, research and healthcare, and services.\\n\\n' +
        '- Audit execution: Financial statement testing, substantive procedures, documentation and engagement coordination.\\n' +
        '- Financial statement areas: Revenue, receivables, inventory, payroll, payables, operating expenses and equity.\\n' +
        '- Technology: Advanced Excel, audit workflow platforms and an interest in Python-assisted analytics.');
      frag.appendChild(experience.sheet);
    }
    if (existingIds.indexOf('education') === -1) {
      var education = sheet(String.fromCharCode(65 + (index % 26)), 'education');
      index++;
      education.body.appendChild(el('h2', null, 'Education & professional development'));
      renderText(education.body,
        'BBA in Accounting & Information Systems, Jagannath University, Dhaka. Currently pursuing Chartered Accountancy at the Professional Level of the Institute of Chartered Accountants of Bangladesh (ICAB).');
      frag.appendChild(education.sheet);
    }

    if (existingIds.indexOf('projects') === -1) {
      var projects = sheet(String.fromCharCode(65 + (index % 26)), 'projects');
      index++;
      projects.body.appendChild(el('h2', null, 'Selected projects'));
      renderText(projects.body,
        '- Tickydo — digital ticketing: Co-founding a transport technology venture focused on passenger ticketing and practical bus-counter operations. Passenger and counter-facing websites are in testing; operator onboarding is in progress.\\n' +
        '- Audit workflow and analytics: Applying advanced spreadsheets and structured audit documentation to financial statement testing, reconciliations and evidence review.');
      var projectLink = el('p');
      var projectAnchor = el('a', null, 'Explore Tickydo');
      projectAnchor.href = 'https://tickydo.com/';
      projectAnchor.target = '_blank';
      projectAnchor.rel = 'noopener noreferrer';
      projectLink.appendChild(projectAnchor);
      projects.body.appendChild(projectLink);
      frag.appendChild(projects.sheet);
    }

    if (c.posts && c.posts.length) {
      var u = sheet(String.fromCharCode(65 + (index % 26)), 'updates');
      u.body.appendChild(el('h2', null, 'Updates'));
      c.posts.forEach(function (p) {
        var art = el('article', 'post');
        if (p.title) art.appendChild(el('h3', null, p.title));
        var when = formatDate(p.date);
        if (when) {
          var t = el('time', null, when);
          t.setAttribute('datetime', p.date);
          art.appendChild(t);
        }
        if (p.body) {
          var bodyBox = el('div');
          renderText(bodyBox, p.body);
          art.appendChild(bodyBox);
        }
        if (p.media && p.media.length) {
          var grid = el('div', 'media');
          p.media.forEach(function (m) { grid.appendChild(mediaItem(m)); });
          art.appendChild(grid);
        }
        u.body.appendChild(art);
      });
      frag.appendChild(u.sheet);
    }

    var connect = sheet(String.fromCharCode(65 + ((index + (c.posts && c.posts.length ? 1 : 0)) % 26)), 'connect');
    connect.body.appendChild(el('h2', null, 'Connect'));
    connect.body.appendChild(el('p', null, 'Interested in audit, financial reporting, technology or entrepreneurship? Find me on LinkedIn.'));
    var links = el('p');
    var linkedin = el('a', null, 'LinkedIn profile');
    linkedin.href = 'https://www.linkedin.com/in/abdulowahab/';
    linkedin.target = '_blank';
    linkedin.rel = 'noopener noreferrer';
    links.appendChild(linkedin);
    connect.body.appendChild(links);
    frag.appendChild(connect.sheet);

    var footer = el('footer');
    footer.appendChild(el('span', null, '© ' + new Date().getFullYear() + ' ' + c.name));
    var admin = el('a', null, 'Admin');
    admin.href = '/admin';
    footer.appendChild(admin);
    frag.appendChild(footer);

    app.replaceChildren(frag);
    document.title = c.name + ' | Audit & Assurance · Deloitte Bangladesh';
  }

  fetch('/api/content')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('bad status')); })
    .then(render)
    .catch(function () { /* keep the static fallback */ });
})();
