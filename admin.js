'use strict';

var root = document.getElementById('root');
var content = null;
var dirty = false;
var tab = 'profile';
var uploads = 0;
var statusEl = null;
var saveBtn = null;

/* ---------- helpers ---------- */

function h(tag, props) {
  var e = document.createElement(tag);
  var p = props || {};
  Object.keys(p).forEach(function (k) {
    var v = p[k];
    if (v == null || v === false) return;
    if (k === 'class') e.className = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  });
  for (var i = 2; i < arguments.length; i++) append(e, arguments[i]);
  return e;
}

function append(parent, kid) {
  if (kid == null || kid === false) return;
  if (Array.isArray(kid)) { kid.forEach(function (k) { append(parent, k); }); return; }
  parent.appendChild(kid.nodeType ? kid : document.createTextNode(String(kid)));
}

function api(path, opts) {
  var o = opts || {};
  return fetch(path, {
    method: o.method || 'GET',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: o.body
  }).then(function (res) {
    return res.json().catch(function () { return null; }).then(function (data) {
      if (!res.ok) {
        var err = new Error((data && data.error) || 'Request failed (' + res.status + ')');
        err.status = res.status;
        throw err;
      }
      return data;
    });
  });
}

function markDirty() {
  dirty = true;
  refreshSaveBar();
}

function setStatus(msg, kind) {
  if (!statusEl) return;
  statusEl.textContent = msg || '';
  statusEl.className = kind || '';
}

function refreshSaveBar() {
  if (!saveBtn) return;
  saveBtn.disabled = !dirty || uploads > 0;
  if (uploads > 0) setStatus('Uploading ' + uploads + ' file' + (uploads > 1 ? 's' : '') + '…');
  else if (dirty) setStatus('You have unsaved changes.');
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function toLocalInput(iso) {
  var d = new Date(iso);
  if (isNaN(d.getTime())) d = new Date();
  var off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

function sizeLabel(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// text input or textarea wired to a setter
function field(label, value, onInput, opts) {
  var o = opts || {};
  var input = o.multiline
    ? h('textarea', { rows: o.rows || 6, maxlength: o.max })
    : h('input', { type: o.type || 'text', maxlength: o.max, autocomplete: 'off' });
  input.value = value || '';
  input.addEventListener('input', function () { onInput(input.value); markDirty(); });
  var id = 'f' + newId();
  input.id = id;
  return h('div', null, h('label', { for: id }, label), input, o.hint ? h('p', { class: 'muted' }, o.hint) : null);
}

/* ---------- screens ---------- */

function showMessage(title, lines) {
  root.replaceChildren(
    h('div', { class: 'login' },
      h('h1', null, title),
      lines.map(function (l) { return h('p', { class: 'muted' }, l); }))
  );
}

function showLogin(message) {
  var pw = h('input', { type: 'password', autocomplete: 'current-password', required: true, id: 'pw' });
  var err = h('p', { class: 'error', role: 'alert' }, message || '');
  var btn = h('button', { class: 'btn', type: 'submit' }, 'Sign in');
  var form = h('form', { class: 'login' },
    h('h1', null, 'Admin sign in'),
    h('p', { class: 'muted' }, 'Sign in to edit your website.'),
    h('label', { for: 'pw' }, 'Password'), pw, h('p'), btn, err);
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    btn.disabled = true;
    err.textContent = '';
    api('/api/login', { method: 'POST', body: JSON.stringify({ password: pw.value }) })
      .then(boot)
      .catch(function (e) { err.textContent = e.message; btn.disabled = false; pw.select(); });
  });
  root.replaceChildren(form);
  pw.focus();
}

function boot() {
  return api('/api/me')
    .then(function (me) {
      if (!me.configured) {
        showMessage('Almost ready', [
          'The admin password has not been set on the server yet.',
          'In Vercel, open the project, go to Settings, then Environment Variables. Add ADMIN_PASSWORD with the password you want, then redeploy.'
        ]);
        return;
      }
      if (!me.admin) { showLogin(); return; }
      return api('/api/content?fresh=' + Date.now()).then(function (c) {
        content = c;
        dirty = false;
        renderEditor();
      });
    })
    .catch(function (e) { showMessage('Something went wrong', [e.message]); });
}

function renderEditor() {
  var scroll = window.scrollY;

  var top = h('div', { class: 'top' },
    h('h1', null, 'Site editor'),
    h('div', { class: 'actions' },
      h('a', { class: 'btn ghost small', href: '/', target: '_blank', rel: 'noopener' }, 'View site'),
      h('a', { class: 'btn ghost small', href: 'https://vercel.com/tickydo/abdulowahab/settings/environment-variables', target: '_blank', rel: 'noopener noreferrer', title: 'Update ADMIN_PASSWORD in Vercel, then redeploy' }, 'Change password'),
      h('button', { class: 'btn ghost small', type: 'button', onclick: signOut }, 'Sign out')));

  var tabs = h('div', { class: 'tabs', role: 'tablist' },
    [['profile', 'Profile'], ['sections', 'Sections'], ['posts', 'Updates'], ['leads', 'Enquiries']].map(function (t) {
      return h('button', {
        class: 'tab', role: 'tab', type: 'button',
        'aria-selected': tab === t[0] ? 'true' : 'false',
        onclick: function () { tab = t[0]; renderEditor(); }
      }, t[1]);
    }));

  var panel = h('div', { role: 'tabpanel' });
  if (tab === 'profile') panel.appendChild(profilePanel());
  if (tab === 'sections') panel.appendChild(sectionsPanel());
  if (tab === 'posts') panel.appendChild(postsPanel());
  if (tab === 'leads') panel.appendChild(leadsPanel());

  statusEl = h('div', { id: 'status', 'aria-live': 'polite' });
  saveBtn = h('button', { class: 'btn', type: 'button', onclick: save }, 'Save changes');
  var bar = h('div', { class: 'savebar' }, h('div', { class: 'in' }, statusEl, saveBtn));

  root.replaceChildren(top, tabs, panel, bar);
  refreshSaveBar();
  if (!dirty && uploads === 0) setStatus('');
  window.scrollTo(0, scroll);
}

function leadsPanel(){
 var wrap=h('div');var info=h('p',{class:'muted'},'Loading enquiries…');wrap.appendChild(info);
 api('/api/leads').then(function(d){info.textContent='Latest '+d.leads.length+' enquiries. Visitor details are visible only to signed-in admins.';d.leads.forEach(function(l){var card=h('div',{class:'card'},h('h2',null,l.name+' — '+l.kind),h('p',{class:'muted'},new Date(l.created_at).toLocaleString()),h('p',null,'Organization: '+(l.organization||'Not supplied')),h('p',null,'Contact: '+l.contact),h('p',null,l.details));var sel=h('select');['new','contacted','closed'].forEach(function(st){var o=h('option',{value:st},st);if(st===l.status)o.selected=true;sel.appendChild(o)});sel.addEventListener('change',function(){api('/api/leads',{method:'PATCH',body:JSON.stringify({id:Number(l.id),status:sel.value})}).catch(function(e){alert(e.message)})});card.appendChild(h('label',null,'Status ',sel));wrap.appendChild(card)})}).catch(function(e){info.textContent='Could not load enquiries: '+e.message});return wrap;
}

/* ---------- profile ---------- */

function profilePanel() {
  var wrap = h('div');
  wrap.appendChild(h('div', { class: 'card' },
    field('Your name', content.name, function (v) { content.name = v; }, { max: 120 })));

  var facts = h('div', { class: 'card' },
    h('h2', null, 'Details under your name'),
    h('p', { class: 'muted' }, 'Short facts shown with a tick, like role, firm and location.'));
  content.facts.forEach(function (f, i) {
    facts.appendChild(h('div', { class: 'row' },
      field('Label', f.label, function (v) { f.label = v; }, { max: 40 }),
      field('Value', f.value, function (v) { f.value = v; }, { max: 200 }),
      h('button', {
        class: 'btn danger small del', type: 'button',
        onclick: function () { content.facts.splice(i, 1); markDirty(); renderEditor(); }
      }, 'Remove')));
  });
  facts.appendChild(h('button', {
    class: 'btn ghost small', type: 'button',
    onclick: function () {
      if (content.facts.length >= 12) { setStatus('You can add up to 12 details.', 'err'); return; }
      content.facts.push({ label: '', value: '' }); markDirty(); renderEditor();
    }
  }, 'Add detail'));
  wrap.appendChild(facts);
  content.social = content.social || { facebook: '', messenger: '', instagram: '' };
  var socials = h('div', { class: 'card' }, h('h2', null, 'Social media links'), h('p', { class: 'muted' }, 'Add your full https:// profile links. Empty links stay hidden on the website.'));
  [['facebook','Facebook'],['messenger','Messenger'],['instagram','Instagram']].forEach(function (pair) { socials.appendChild(field(pair[1] + ' URL', content.social[pair[0]] || '', function (v) { content.social[pair[0]] = v; }, { max: 400 })); });
  wrap.appendChild(socials);
  return wrap;
}

/* ---------- sections ---------- */

function sectionsPanel() {
  var wrap = h('div');
  wrap.appendChild(h('p', { class: 'muted' },
    'Each section appears on your page in this order. Leave a blank line between paragraphs. To make a list, start each line with "- " and write it as "- Title: description".'));

  content.sections.forEach(function (s, i) {
    var card = h('div', { class: 'card' },
      field('Title', s.title, function (v) { s.title = v; }, { max: 100 }),
      field('Text', s.body, function (v) { s.body = v; }, { multiline: true, rows: 8, max: 8000 }),
      h('div', { class: 'bar' },
        h('button', { class: 'btn ghost small', type: 'button', disabled: i === 0, onclick: function () { move(content.sections, i, -1); } }, 'Move up'),
        h('button', { class: 'btn ghost small', type: 'button', disabled: i === content.sections.length - 1, onclick: function () { move(content.sections, i, 1); } }, 'Move down'),
        h('button', {
          class: 'btn danger small', type: 'button',
          onclick: function () {
            if (!confirm('Delete the section "' + (s.title || 'Untitled') + '"?')) return;
            content.sections.splice(i, 1); markDirty(); renderEditor();
          }
        }, 'Delete')));
    wrap.appendChild(card);
  });

  wrap.appendChild(h('button', {
    class: 'btn ghost', type: 'button',
    onclick: function () {
      if (content.sections.length >= 12) { setStatus('You can add up to 12 sections.', 'err'); return; }
      content.sections.push({ id: newId(), title: 'New section', body: '' }); markDirty(); renderEditor();
    }
  }, 'Add section'));
  return wrap;
}

function move(list, i, dir) {
  var j = i + dir;
  if (j < 0 || j >= list.length) return;
  var t = list[i]; list[i] = list[j]; list[j] = t;
  markDirty();
  renderEditor();
}

/* ---------- updates (posts with photos, videos, files) ---------- */

function postsPanel() {
  var wrap = h('div');
  wrap.appendChild(h('p', { class: 'muted' },
    'Updates are posts with text and any photos, videos or files. The newest appears first on your page.'));
  wrap.appendChild(h('button', {
    class: 'btn', type: 'button',
    onclick: function () {
      content.posts.unshift({ id: newId(), title: '', body: '', date: new Date().toISOString(), media: [] });
      markDirty(); renderEditor();
    }
  }, 'New update'));
  wrap.appendChild(h('p'));

  if (!content.posts.length) wrap.appendChild(h('p', { class: 'muted' }, 'No updates yet.'));

  content.posts.forEach(function (p, i) { wrap.appendChild(postCard(p, i)); });
  return wrap;
}

function postCard(p, i) {
  var dateInput = h('input', { type: 'datetime-local', id: 'd' + p.id });
  dateInput.value = toLocalInput(p.date);
  dateInput.addEventListener('input', function () {
    var d = new Date(dateInput.value);
    if (!isNaN(d.getTime())) { p.date = d.toISOString(); markDirty(); }
  });

  var thumbs = h('div', { class: 'thumbs' });
  function drawThumbs() {
    thumbs.replaceChildren();
    p.media.forEach(function (m, mi) { thumbs.appendChild(thumb(m, function () { p.media.splice(mi, 1); markDirty(); drawThumbs(); })); });
  }
  drawThumbs();

  var note = h('p', { class: 'muted', 'aria-live': 'polite' });
  var picker = h('input', {
    type: 'file', multiple: true, id: 'u' + p.id,
    accept: 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt'
  });
  picker.addEventListener('change', function () {
    var files = Array.prototype.slice.call(picker.files);
    picker.value = '';
    files.forEach(function (f) { uploadOne(f, p, note, drawThumbs); });
  });

  return h('div', { class: 'card' },
    field('Title', p.title, function (v) { p.title = v; }, { max: 200 }),
    h('div', null, h('label', { for: 'd' + p.id }, 'Date'), dateInput),
    field('Text', p.body, function (v) { p.body = v; }, { multiline: true, rows: 6, max: 20000 }),
    h('label', { for: 'u' + p.id }, 'Photos, videos and files'),
    picker, note, thumbs,
    h('div', { class: 'bar' },
      h('button', {
        class: 'btn danger small', type: 'button',
        onclick: function () {
          if (!confirm('Delete this update' + (p.title ? ' "' + p.title + '"' : '') + '?')) return;
          content.posts.splice(i, 1); markDirty(); renderEditor();
        }
      }, 'Delete update')));
}

function thumb(m, onRemove) {
  var type = m.type || '';
  var preview;
  if (type.indexOf('image/') === 0) preview = h('img', { src: m.url, alt: m.name || '', loading: 'lazy' });
  else if (type.indexOf('video/') === 0) preview = h('video', { src: m.url + '#t=0.1', preload: 'metadata', muted: true, playsinline: true });
  else preview = h('div', { class: 'ph' }, type.indexOf('audio/') === 0 ? 'Audio' : 'File');
  return h('div', { class: 'thumb' },
    preview,
    h('div', null, m.name || 'file', m.size ? ' (' + sizeLabel(m.size) + ')' : ''),
    h('button', { class: 'btn danger small', type: 'button', onclick: onRemove }, 'Remove'));
}

// Big photos from a phone are shrunk before upload, so the page stays fast.
function shrinkImage(file) {
  if (!/^image\/(jpeg|webp)$/.test(file.type) || file.size < 1.5 * 1024 * 1024) return Promise.resolve(file);
  if (!window.createImageBitmap) return Promise.resolve(file);
  return createImageBitmap(file).then(function (bmp) {
    var scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
    var c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise(function (resolve) { c.toBlob(resolve, 'image/jpeg', 0.86); }).then(function (blob) {
      if (blob && blob.size < file.size) {
        return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
      }
      return file;
    });
  }).catch(function () { return file; });
}

var blobClient = null;
function loadBlobClient() {
  if (!blobClient) blobClient = import('https://esm.sh/@vercel/blob/client');
  return blobClient;
}

function uploadOne(original, post, note, redraw) {
  uploads++;
  refreshSaveBar();
  var label = original.name;
  note.textContent = 'Uploading ' + label + '…';
  note.className = 'muted';

  Promise.all([shrinkImage(original), loadBlobClient()])
    .then(function (r) {
      var file = r[0];
      var safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-80) || 'file';
      return r[1].upload('uploads/' + safe, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        multipart: file.size > 20 * 1024 * 1024,
        onUploadProgress: function (e) { note.textContent = 'Uploading ' + label + ': ' + Math.round(e.percentage) + '%'; }
      }).then(function (blob) {
        post.media.push({ url: blob.url, name: original.name, type: file.type || blob.contentType || '', size: file.size });
        markDirty();
        note.textContent = 'Added ' + label + '. Press Save changes to publish.';
        redraw();
      });
    })
    .catch(function (e) {
      note.textContent = 'Could not upload ' + label + ': ' + (e && e.message ? e.message : 'unknown error');
      note.className = 'error';
    })
    .then(function () {
      uploads--;
      refreshSaveBar();
    });
}

/* ---------- save and sign out ---------- */

function save() {
  if (uploads > 0) return;
  saveBtn.disabled = true;
  setStatus('Saving…');
  api('/api/save', { method: 'POST', body: JSON.stringify(content) })
    .then(function (saved) {
      content = saved;
      dirty = false;
      renderEditor();
      setStatus('Saved. The site shows it within about 30 seconds.', 'ok');
    })
    .catch(function (e) {
      if (e.status === 401) { showLogin('Your session ended, so that save did not go through. Sign in again and redo your last edit.'); return; }
      saveBtn.disabled = false;
      setStatus(e.message, 'err');
    });
}

function signOut() {
  if (dirty && !confirm('You have unsaved changes. Sign out anyway?')) return;
  dirty = false;
  api('/api/logout', { method: 'POST', body: '{}' }).then(function () { showLogin(); });
}

window.addEventListener('beforeunload', function (e) {
  if (dirty || uploads > 0) { e.preventDefault(); e.returnValue = ''; }
});

boot();
