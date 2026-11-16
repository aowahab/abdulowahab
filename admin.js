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
    h('label', { for: 'pw' }, 'Password'), pw, h('p'), btn, err,
    h('p', { class: 'muted', style: 'margin-top:1rem' }, 'Forgot password? For security, password recovery requires verified ownership. Contact the site owner or sign in to the Vercel project to recover access.'));
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
      h('a', { class: 'btn back-to-site', href: '/', title: 'Return to the public portfolio website' }, '← Back to Website'),
      h('a', { class: 'btn ghost small', href: 'https://vercel.com/tickydo/abdulowahab/settings/environment-variables', target: '_blank', rel: 'noopener noreferrer', title: 'Update ADMIN_PASSWORD in Vercel, then redeploy' }, 'Change password'),
      h('button', { class: 'btn ghost small', type: 'button', onclick: signOut }, 'Sign out')));

  var tabs = h('div', { class: 'tabs', role: 'tablist' },
    [['profile', 'Profile'], ['sections', 'Sections'], ['posts', 'Updates'], ['leads', 'Leads & Enquiries']].map(function (t) {
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
 var wrap=h('div');
 var heading=h('div',{class:'card'},h('h2',null,'Private leads & enquiries'),h('p',{class:'muted'},'Messages are visible to signed-in admins only. Recruiters and potential customers are separated here.'));
 var filters=h('div',{class:'lead-filters'});
 var list=h('div');
 var info=h('p',{class:'muted'},'Loading enquiries…');
 wrap.append(heading,filters,info,list);
 var active='all';
 var rows=[];
 var kinds=[['all','All'],['recruiter','Recruitment'],['client','Potential Customers'],['collaboration','Collaboration'],['appointment','Appointments'],['other','Other']];
 function paint(){
  filters.replaceChildren();
  kinds.forEach(function(k){
   var count=k[0]==='all'?rows.length:rows.filter(function(l){return (l.kind||'other')===k[0]}).length;
   filters.appendChild(h('button',{class:'btn small '+(active===k[0]?'':'ghost'),type:'button',onclick:function(){active=k[0];paint()}},k[1]+' ('+count+')'));
  });
  list.replaceChildren();
  var shown=active==='all'?rows:rows.filter(function(l){return (l.kind||'other')===active});
  info.textContent=shown.length+' '+(shown.length===1?'enquiry':'enquiries')+' shown. Client and recruiter details are private.';
  if(!shown.length)list.appendChild(h('p',{class:'muted'},'No enquiries in this category yet.'));
  shown.forEach(function(l){
   var label=l.kind==='recruiter'?'Recruitment':l.kind==='client'?'Potential Customer':l.kind==='appointment'?'Appointment':l.kind==='collaboration'?'Collaboration':'Other';
   var card=h('div',{class:'card'},
    h('h2',null,label+' — '+l.name),
    h('p',{class:'muted'},new Date(l.created_at).toLocaleString()),
    h('p',null,'Organization: '+(l.organization||'Not supplied')),
    h('p',null,'Contact: '+l.contact),
    h('p',null,l.details)
   );
   var sel=h('select');
   ['new','contacted','closed'].forEach(function(st){var o=h('option',{value:st},st);if(st===l.status)o.selected=true;sel.appendChild(o)});
   sel.addEventListener('change',function(){api('/api/leads',{method:'PATCH',body:JSON.stringify({id:Number(l.id),status:sel.value})}).catch(function(e){alert(e.message)})});
   card.appendChild(h('label',null,'Status ',sel));
   list.appendChild(card);
  });
 }
 api('/api/leads').then(function(d){rows=Array.isArray(d.leads)?d.leads:[];paint()}).catch(function(e){info.textContent='Could not load enquiries: '+e.message});
 return wrap;
}

/* ---------- profile ---------- */

function profilePanel() {
  var wrap = h('div');
  var photoPreview = content.avatarUrl
    ? h('img', { class: 'avatar-preview', src: content.avatarUrl, alt: 'Current profile picture' })
    : h('span', { class: 'avatar-placeholder' }, (content.name || 'AO').trim().split(/\s+/).map(function (x) { return x[0]; }).slice(0, 2).join('').toUpperCase());
  var preview = h('div', { class: 'avatar-holder' }, photoPreview);
  var photoNote = h('p', { class: 'muted', 'aria-live': 'polite' }, 'Upload a JPG, PNG or WebP photo (up to 10 MB), then save your changes.');
  var photoInput = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', 'aria-label': 'Choose profile picture' });
  photoInput.addEventListener('change', function () {
    var file = photoInput.files && photoInput.files[0];
    photoInput.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024) {
      photoNote.textContent = 'Choose a JPG, PNG or WebP photo under 10 MB.';
      photoNote.className = 'error';
      return;
    }
    openSquareCropper(file, function (croppedFile) {
      uploads++;
      refreshSaveBar();
      photoNote.textContent = 'Uploading cropped photo…';
      photoNote.className = 'muted';
      loadBlobClient().then(function (client) {
        return client.upload('uploads/profile-' + Date.now() + '.jpg', croppedFile, {
          access: 'public',
          handleUploadUrl: '/api/upload'
        });
      }).then(function (blob) {
        content.avatarUrl = blob.url;
        markDirty();
        preview.replaceChildren(h('img', { class: 'avatar-preview', src: blob.url, alt: 'Cropped profile picture preview' }));
        photoNote.textContent = 'Square photo uploaded. Press Save changes to publish it.';
        photoNote.className = 'muted';
      }).catch(function (error) {
        photoNote.textContent = 'Upload failed: ' + (error.message || 'Please try again.');
        photoNote.className = 'error';
      }).then(function () { uploads--; refreshSaveBar(); });
    }, function (message) {
      photoNote.textContent = message;
      photoNote.className = 'error';
    });
  });
  var removePhoto = h('button', { type: 'button', class: 'btn ghost small', onclick: function () {
    content.avatarUrl = '';
    markDirty();
    preview.replaceChildren(h('span', { class: 'avatar-placeholder' }, 'AO'));
    photoNote.textContent = 'Photo removed. Press Save changes to update the website.';
  } }, 'Remove photo');
  wrap.appendChild(h('div', { class: 'card profile-photo-card' },
    h('div', null, h('h2', null, 'Profile picture'), h('p', { class: 'muted' }, 'Your photo appears on the public homepage. Change it here anytime.')),
    h('div', { class: 'avatar-editor' }, preview, h('div', { class: 'avatar-controls' }, photoInput, removePhoto, photoNote))));

  wrap.appendChild(h('div', { class: 'card' },
    field('Your name', content.name, function (v) { content.name = v; }, { max: 120 })));

  content.profile = content.profile || {};
  var introduction = h('div', { class: 'card' }, h('h2', null, 'Homepage introduction'));
  [['headline','Professional headline',160],['intro','Short introduction',600],['location','Location',100],['cvUrl','CV PDF URL (uploaded Blob URL)',400],['cvUpdated','CV updated label',60]].forEach(function (item) {
    introduction.appendChild(field(item[1], content.profile[item[0]] || '', function (v) { content.profile[item[0]] = v; }, { max: item[2] }));
  });
  introduction.appendChild(h('p', { class: 'muted' }, 'The CV button stays hidden until you add an approved PDF URL. Upload an updated PDF and paste its URL when your experience changes.'));
  wrap.appendChild(introduction);
  var projects = h('div', { class: 'card' }, h('h2', null, 'Selected project case studies'));
  (content.projects || []).forEach(function (project) {
    var card = h('fieldset', null, h('legend', null, project.title));
    [['title','Title',120],['tag','Status / category',120],['problem','Purpose',600],['contribution','Your contribution',600],['result','Current state',800],['link','Project URL',400],['cta','Link label',80]].forEach(function (item) {
      card.appendChild(field(item[1], project[item[0]] || '', function (v) { project[item[0]] = v; }, { max: item[2] }));
    });
    projects.appendChild(card);
  });
  wrap.appendChild(projects);


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

/* ---------- built-in square photo crop tool ---------- */
function openSquareCropper(file, onCrop, onError) {
  var image = new Image();
  var objectUrl = URL.createObjectURL(file);
  var modal = h('div', { class: 'crop-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Crop your profile picture' });
  var canvas = h('canvas', { width: '512', height: '512', class: 'crop-canvas', 'aria-label': 'Square crop preview. Drag to move the photo.' });
  var ctx = canvas.getContext('2d');
  var zoom = h('input', { type: 'range', min: '1', max: '3', step: '0.01', value: '1', 'aria-label': 'Photo zoom' });
  var dx = 0, dy = 0, dragging = false, lastX = 0, lastY = 0, ready = false;
  function dimensions() {
    var scale = Math.max(512 / image.naturalWidth, 512 / image.naturalHeight) * Number(zoom.value);
    return { w: image.naturalWidth * scale, h: image.naturalHeight * scale };
  }
  function paint() {
    if (!ready) return;
    var d = dimensions();
    dx = Math.max(-(d.w - 512) / 2, Math.min((d.w - 512) / 2, dx));
    dy = Math.max(-(d.h - 512) / 2, Math.min((d.h - 512) / 2, dy));
    ctx.clearRect(0, 0, 512, 512);
    ctx.drawImage(image, (512 - d.w) / 2 + dx, (512 - d.h) / 2 + dy, d.w, d.h);
  }
  function close() {
    modal.remove();
    document.removeEventListener('keydown', escape);
    URL.revokeObjectURL(objectUrl);
  }
  function escape(e) { if (e.key === 'Escape') close(); }
  canvas.addEventListener('pointerdown', function (e) {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var ratio = 512 / canvas.getBoundingClientRect().width;
    dx += (e.clientX - lastX) * ratio;
    dy += (e.clientY - lastY) * ratio;
    lastX = e.clientX; lastY = e.clientY; paint();
  });
  canvas.addEventListener('pointerup', function () { dragging = false; });
  canvas.addEventListener('pointercancel', function () { dragging = false; });
  zoom.addEventListener('input', paint);
  var apply = h('button', { class: 'btn', type: 'button', disabled: true, onclick: function () {
    paint();
    apply.disabled = true;
    canvas.toBlob(function (blob) {
      if (!blob) { apply.disabled = false; onError('Could not crop image. Please try again.'); return; }
      var output = new File([blob], 'profile-cropped.jpg', { type: 'image/jpeg' });
      close(); onCrop(output);
    }, 'image/jpeg', 0.9);
  } }, 'Crop & upload');
  var body = h('div', { class: 'crop-dialog' },
    h('h2', null, 'Crop profile picture'),
    h('p', { class: 'muted' }, 'Drag the picture to reposition it. Use the slider to zoom. Your saved photo will be a 1:1 square.'),
    canvas,
    h('label', { class: 'crop-zoom-label' }, 'Zoom', zoom),
    h('div', { class: 'bar crop-actions' },
      h('button', { class: 'btn ghost', type: 'button', onclick: close }, 'Cancel'), apply));
  modal.appendChild(body);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.body.appendChild(modal);
  document.addEventListener('keydown', escape);
  image.onload = function () {
    ready = true; paint(); apply.disabled = false;
  };
  image.onerror = function () { close(); onError('Unable to open that image. Try JPG or PNG.'); };
  image.src = objectUrl;
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
