(function () {
  var body = document.body, CLS = body.dataset.cls, TITLE = body.dataset.title;
  var KEY = 'hilali_' + CLS, db = null;
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!db || !db.students) db = { students: [], att: {} };
  if (!db.subjects) db.subjects = TITLE.indexOf('التاسع') >= 0
    ? ['رياضيات', 'فيزياء وكيمياء', 'علوم', 'عربي', 'انكليزي', 'فرنسي', 'اجتماعيات', 'ديانة'] : [];
  if (!db.marks) db.marks = [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function today() { var d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function digits(s) { return String(s || '').replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 1632; }).replace(/\D/g, ''); }
  function num(s) {
    s = String(s || '').replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 1632; }).replace(/[٫,،]/g, '.').trim();
    var n = parseFloat(s); return isNaN(n) ? null : n;
  }

  var css = document.createElement('style');
  css.textContent =
    '@media screen{.printhead{display:none}}' +
    '@media print{' +
    'header.brand,nav,.btn,.noprint,button{display:none!important}' +
    'body{background:#fff!important}' +
    '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.printhead{display:flex;align-items:center;gap:14px;border-bottom:3px solid #c9a227;padding-bottom:12px;margin-bottom:16px}' +
    '.printhead img{width:80px;height:80px;object-fit:contain}' +
    '.printhead h2{margin:0 0 4px;font-size:24px}' +
    '.printhead div{font-size:14px;line-height:1.7}' +
    '.card{break-inside:avoid;box-shadow:none!important;border:1px solid #ddd}' +
    '}';
  document.head.appendChild(css);

  var tab = 'st', date = today(), month = today().slice(0, 7), sel = '', app = document.getElementById('app');
  var subj = '', exTitle = '', exMax = '100', exDate = today(), draft = {};

  function studentsView() {
    var h = '<div class="card"><input id="nm" placeholder="اسم الطالب">' +
      '<input id="ph" type="tel" inputmode="tel" placeholder="رقم ولي الأمر (مع رمز الدولة)" style="margin-top:8px">' +
      '<button class="btn" data-a="add" style="margin-top:8px">إضافة</button></div>';
    if (!db.students.length) return h + '<div class="empty">لا يوجد طلاب بعد</div>';
    return h + db.students.map(function (s, i) {
      var p = s.phone ? '<div class="sub" dir="ltr">' + esc(s.phone) + '</div>' : '<div class="sub">لا يوجد رقم ولي أمر</div>';
      return '<div class="card row"><div class="name">' + (i + 1) + '. ' + esc(s.name) + p + '</div>' +
        '<button class="btn" data-a="ph" data-id="' + s.id + '">الرقم</button> ' +
        '<button class="btn x" data-a="del" data-id="' + s.id + '">حذف</button></div>';
    }).join('');
  }

  function attView() {
    var r = db.att[date] || {}, c = { p: 0, l: 0, a: 0 };
    db.students.forEach(function (s) { if (r[s.id]) c[r[s.id]]++; });
    var h = '<div class="card"><input type="date" id="dt" value="' + date + '"></div>' +
      '<div class="sum"><div><b>' + c.p + '</b>حاضر</div><div><b>' + c.l + '</b>متأخر</div><div><b>' + c.a + '</b>غائب</div></div>';
    if (!db.students.length) return h + '<div class="empty">أضف الطلاب أولاً من تبويب الطلاب</div>';
    return h + db.students.map(function (s) {
      function b(v, t) { return '<button class="' + v + (r[s.id] === v ? ' on' : '') + '" data-a="set" data-id="' + s.id + '" data-v="' + v + '">' + t + '</button>'; }
      var wa = (r[s.id] === 'a' || r[s.id] === 'l')
        ? '<button class="btn" data-a="wa" data-id="' + s.id + '" style="margin-top:8px">إرسال واتساب لولي الأمر</button>' : '';
      return '<div class="card"><div class="row"><div class="name">' + esc(s.name) + '</div><div class="st">' + b('p', 'حاضر') + b('l', 'متأخر') + b('a', 'غائب') + '</div></div>' + wa + '</div>';
    }).join('');
  }

  function monthDays() {
    return Object.keys(db.att).filter(function (d) {
      return d.slice(0, 7) === month && Object.keys(db.att[d]).length;
    }).sort();
  }

  function printHead(title) {
    return '<div class="printhead"><img src="icon-192.png" alt=""><div><h2>معهد الهلالي</h2>' +
      '<div>' + esc(TITLE) + ' — ' + esc(title) + '</div>' +
      '<div>الشهر: ' + month + ' · تاريخ الإصدار: ' + today() + '</div></div></div>';
  }

  function repView() {
    var days = monthDays();
    var h = '<div class="card noprint"><input type="month" id="mo" value="' + month + '">' +
      '<button class="btn" data-a="pdf" style="margin-top:8px">حفظ التقرير PDF</button></div>' +
      '<div class="sum"><div><b>' + days.length + '</b>أيام الشهر</div><div><b>' + db.students.length + '</b>عدد الطلاب</div></div>';
    if (!db.students.length || !days.length) return h + '<div class="empty">لا توجد بيانات حضور في هذا الشهر</div>';
    return h + db.students.map(function (s) {
      var p = 0, l = 0, a = 0;
      days.forEach(function (d) { var v = db.att[d][s.id]; if (v === 'p') p++; else if (v === 'l') l++; else if (v === 'a') a++; });
      var t = p + l + a, pc = t ? Math.round((p + l) / t * 100) : 0;
      var warn = a >= 3 ? ' style="color:#c0392b"' : '';
      return '<div class="card"><div class="row"><div class="name"' + warn + '>' + esc(s.name) + '</div><b>' + pc + '%</b></div>' +
        '<div class="sub">حاضر ' + p + ' · متأخر ' + l + ' · غائب ' + a + '</div><div class="bar"><i style="width:' + pc + '%"></i></div></div>';
    }).join('');
  }

  function curStudent() {
    var st = db.students.filter(function (s) { return s.id === sel; })[0];
    if (!st && db.students.length) { st = db.students[0]; sel = st.id; }
    return st;
  }

  function stuStats(s) {
    var o = { p: 0, l: 0, a: 0, ad: [], ld: [] };
    monthDays().forEach(function (d) {
      var v = db.att[d][s.id];
      if (v === 'p') o.p++;
      else if (v === 'l') { o.l++; o.ld.push(d); }
      else if (v === 'a') { o.a++; o.ad.push(d); }
    });
    o.t = o.p + o.l + o.a;
    o.pc = o.t ? Math.round((o.p + o.l) / o.t * 100) : 0;
    return o;
  }

  function stuView() {
    if (!db.students.length) return '<div class="empty">أضف الطلاب أولاً من تبويب الطلاب</div>';
    var s = curStudent();
    var opts = db.students.map(function (x) {
      return '<option value="' + x.id + '"' + (x.id === s.id ? ' selected' : '') + '>' + esc(x.name) + '</option>';
    }).join('');
    var h = '<div class="card noprint"><select id="sel" style="width:100%;padding:10px;font-size:16px">' + opts + '</select>' +
      '<input type="month" id="mo" value="' + month + '" style="margin-top:8px">' +
      '<button class="btn" data-a="pdf" style="margin-top:8px">حفظ التقرير PDF</button></div>';
    var o = stuStats(s);
    if (!o.t) return h + '<div class="empty">لا توجد بيانات لهذا الطالب في هذا الشهر</div>';
    h += '<div class="sum"><div><b>' + o.p + '</b>حاضر</div><div><b>' + o.l + '</b>متأخر</div><div><b>' + o.a + '</b>غائب</div></div>';
    h += '<div class="card"><div class="row"><div class="name">نسبة الحضور</div><b>' + o.pc + '%</b></div><div class="bar"><i style="width:' + o.pc + '%"></i></div></div>';
    h += '<div class="card"><div class="name">أيام الغياب</div><div class="sub">' + (o.ad.length ? o.ad.join('، ') : 'لا يوجد') + '</div></div>';
    h += '<div class="card"><div class="name">أيام التأخر</div><div class="sub">' + (o.ld.length ? o.ld.join('، ') : 'لا يوجد') + '</div>' +
      '<button class="btn" data-a="wr" style="margin-top:8px">إرسال التقرير لولي الأمر</button></div>';
    return h;
  }

  function addSubCard(msg) {
    return '<div class="card"><div class="name">إضافة مادة</div><div class="sub">' + msg + '</div>' +
      '<input id="nsub" placeholder="اسم المادة" style="margin-top:8px">' +
      '<button class="btn" data-a="addsub" style="margin-top:8px">إضافة مادة</button></div>';
  }

  function marksView() {
    if (!db.subjects.length) return addSubCard('لا توجد مواد بعد. أضف أول مادة:');
    if (db.subjects.indexOf(subj) < 0) subj = db.subjects[0];
    if (!db.students.length) return '<div class="empty">أضف الطلاب أولاً من تبويب الطلاب</div>';
    var opts = db.subjects.map(function (x) {
      return '<option value="' + esc(x) + '"' + (x === subj ? ' selected' : '') + '>' + esc(x) + '</option>';
    }).join('');
    var h = '<div class="card"><select id="sj" style="width:100%;padding:10px;font-size:16px">' + opts + '</select>' +
      '<input id="exn" placeholder="اسم الامتحان (مثل: مذاكرة أولى)" value="' + esc(exTitle) + '" style="margin-top:8px">' +
      '<input id="exm" type="text" inputmode="decimal" placeholder="العلامة العظمى" value="' + esc(exMax) + '" style="margin-top:8px">' +
      '<input id="exd" type="date" value="' + exDate + '" style="margin-top:8px"></div>';
    h += db.students.map(function (s) {
      var v = draft[s.id] !== undefined ? esc(draft[s.id]) : '';
      return '<div class="card row"><div class="name">' + esc(s.name) + '</div>' +
        '<input class="sc" data-id="' + s.id + '" type="text" inputmode="decimal" placeholder="العلامة" value="' + v + '" style="width:110px"></div>';
    }).join('');
    h += '<button class="btn" data-a="savemk" style="width:100%;margin-bottom:12px">حفظ العلامات</button>';

    var ex = db.marks.filter(function (m) { return m.subj === subj; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    if (ex.length) {
      h += '<div class="card"><div class="name">امتحانات ' + esc(subj) + '</div>' + ex.map(function (m) {
        var vals = Object.keys(m.scores).map(function (k) { return m.scores[k] / m.max * 100; });
        var avg = vals.length ? Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length) : 0;
        return '<div class="row" style="margin-top:8px"><div class="sub">' + esc(m.title) + ' · ' + m.date + ' · من ' + m.max + ' · المتوسط ' + avg + '%</div>' +
          '<button class="btn x" data-a="delmk" data-id="' + m.id + '">حذف</button></div>';
      }).join('') + '</div>';
      h += db.students.map(function (s) {
        var tot = 0, n = 0;
        ex.forEach(function (m) { if (m.scores[s.id] !== undefined) { tot += m.scores[s.id] / m.max * 100; n++; } });
        var pc = n ? Math.round(tot / n) : 0;
        return '<div class="card"><div class="row"><div class="name">' + esc(s.name) + '</div><b>' + (n ? pc + '%' : '—') + '</b></div>' +
          '<div class="sub">عدد الامتحانات: ' + n + '</div><div class="bar"><i style="width:' + pc + '%"></i></div></div>';
      }).join('');
    }
    h += addSubCard('أو احذف المادة الحالية:') +
      '<button class="btn x" data-a="delsub" style="margin-bottom:12px">حذف مادة ' + esc(subj) + '</button>';
    return h;
  }

  function captureDraft() {
    var t = document.getElementById('exn'); if (t) exTitle = t.value;
    var m = document.getElementById('exm'); if (m) exMax = m.value;
    var d = document.getElementById('exd'); if (d && d.value) exDate = d.value;
    var inputs = app.querySelectorAll('.sc');
    for (var i = 0; i < inputs.length; i++) draft[inputs[i].dataset.id] = inputs[i].value;
  }

  function saveMarks() {
    captureDraft();
    var title = exTitle.trim(), max = num(exMax);
    if (!title) { alert('اكتب اسم الامتحان.'); return; }
    if (!max || max <= 0) { alert('اكتب العلامة العظمى بشكل صحيح.'); return; }
    var scores = {}, count = 0, bad = '';
    db.students.forEach(function (s) {
      var raw = draft[s.id];
      if (raw === undefined || String(raw).trim() === '') return;
      var v = num(raw);
      if (v === null || v < 0 || v > max) { bad = s.name; return; }
      scores[s.id] = v; count++;
    });
    if (bad) { alert('علامة غير صحيحة للطالب: ' + bad); return; }
    if (!count) { alert('لم تُدخل أي علامة.'); return; }
    db.marks.push({ id: 'm' + Date.now(), subj: subj, title: title, max: max, date: exDate, scores: scores });
    save();
    exTitle = ''; draft = {};
  }

  function render() {
    var v = tab === 'st' ? studentsView() : tab === 'at' ? attView() : tab === 'rp' ? repView() : tab === 'mk' ? marksView() : stuView();
    var ph = '';
    if (tab === 'rp') ph = printHead('تقرير الصف الشهري');
    else if (tab === 'sr' && curStudent()) ph = printHead('تقرير الطالب: ' + curStudent().name);
    function n(k, t) { return '<button class="' + (tab === k ? 'on' : '') + '" data-a="tab" data-v="' + k + '">' + t + '</button>'; }
    app.innerHTML = '<header class="brand"><img src="icon-192.png" alt=""><div><h1>معهد الهلالي</h1><span>' + TITLE + '</span></div><a class="back" href="index.html">الرئيسية</a></header>' +
      '<nav>' + n('st', 'الطلاب') + n('at', 'الحضور') + n('rp', 'التقرير') + n('sr', 'طالب') + n('mk', 'علامات') + '</nav>' + ph + v;
  }

  function printPDF() {
    var old = document.title, st = curStudent();
    document.title = (tab === 'sr' && st) ? 'تقرير ' + st.name + ' ' + month : 'تقرير ' + TITLE + ' ' + month;
    function back() { document.title = old; window.removeEventListener('afterprint', back); }
    window.addEventListener('afterprint', back);
    window.print();
  }

  function sendWA(id) {
    var st = db.students.filter(function (s) { return s.id === id; })[0];
    if (!st) return;
    if (!st.phone) { alert('لا يوجد رقم لولي أمر هذا الطالب. أضفه من تبويب الطلاب.'); return; }
    var v = (db.att[date] || {})[id];
    var what = v === 'a' ? 'تغيّب عن' : 'تأخر عن';
    var msg = 'السلام عليكم ورحمة الله،\nنود إعلامكم بأن الطالب ' + st.name + ' ' + what + ' معهد الهلالي بتاريخ ' + date + '.\nمع خالص التحية، إدارة معهد الهلالي.';
    window.open('https://wa.me/' + st.phone + '?text=' + encodeURIComponent(msg), '_blank');
  }

  function sendReport() {
    var st = curStudent();
    if (!st) return;
    if (!st.phone) { alert('لا يوجد رقم لولي أمر هذا الطالب. أضفه من تبويب الطلاب.'); return; }
    var o = stuStats(st);
    var msg = 'السلام عليكم ورحمة الله،\nتقرير حضور الطالب ' + st.name + ' لشهر ' + month + ' في معهد الهلالي:\n' +
      'حاضر: ' + o.p + ' | متأخر: ' + o.l + ' | غائب: ' + o.a + '\n' +
      'نسبة الحضور: ' + o.pc + '%\n';
    if (o.ad.length) msg += 'أيام الغياب: ' + o.ad.join('، ') + '\n';
    if (o.ld.length) msg += 'أيام التأخر: ' + o.ld.join('، ') + '\n';
    msg += 'مع خالص التحية، إدارة معهد الهلالي.';
    window.open('https://wa.me/' + st.phone + '?text=' + encodeURIComponent(msg), '_blank');
  }

  app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-a]');
    if (!t) return;
    var a = t.dataset.a, id = t.dataset.id;
    if (a === 'wa') { sendWA(id); return; }
    if (a === 'wr') { sendReport(); return; }
    if (a === 'pdf') { printPDF(); return; }
    if (a === 'tab') { tab = t.dataset.v; }
    else if (a === 'add') {
      var inp = document.getElementById('nm'), name = inp.value.trim();
      var phone = digits(document.getElementById('ph').value);
      if (!name) return;
      db.students.push({ id: 's' + Date.now(), name: name, phone: phone }); save();
    } else if (a === 'ph') {
      var st = db.students.filter(function (s) { return s.id === id; })[0];
      if (!st) return;
      var nv = prompt('رقم ولي أمر ' + st.name + ' (مع رمز الدولة)', st.phone || '');
      if (nv === null) return;
      st.phone = digits(nv); save();
    } else if (a === 'del') {
      if (!confirm('حذف هذا الطالب؟')) return;
      db.students = db.students.filter(function (s) { return s.id !== id; });
      Object.keys(db.att).forEach(function (d) { delete db.att[d][id]; });
      db.marks.forEach(function (m) { delete m.scores[id]; });
      save();
    } else if (a === 'set') {
      var r = db.att[date] || (db.att[date] = {});
      if (r[id] === t.dataset.v) delete r[id]; else r[id] = t.dataset.v;
      if (!Object.keys(r).length) delete db.att[date];
      save();
    } else if (a === 'savemk') {
      saveMarks();
    } else if (a === 'delmk') {
      if (!confirm('حذف هذا الامتحان وعلاماته؟')) return;
      db.marks = db.marks.filter(function (m) { return m.id !== id; });
      save();
    } else if (a === 'addsub') {
      var sn = document.getElementById('nsub'), nm2 = sn ? sn.value.trim() : '';
      if (!nm2) return;
      if (db.subjects.indexOf(nm2) < 0) { db.subjects.push(nm2); save(); }
      subj = nm2;
    } else if (a === 'delsub') {
      if (!confirm('حذف مادة ' + subj + ' وكل علاماتها؟')) return;
      var cur = subj;
      db.subjects = db.subjects.filter(function (x) { return x !== cur; });
      db.marks = db.marks.filter(function (m) { return m.subj !== cur; });
      subj = ''; save();
    }
    render();
  });
  app.addEventListener('change', function (e) {
    if (e.target.id === 'dt' && e.target.value) { date = e.target.value; render(); }
    if (e.target.id === 'mo' && e.target.value) { month = e.target.value; render(); }
    if (e.target.id === 'sel' && e.target.value) { sel = e.target.value; render(); }
    if (e.target.id === 'sj' && e.target.value) { captureDraft(); subj = e.target.value; render(); }
  });
  app.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.target.id === 'nm' || e.target.id === 'ph')) { e.preventDefault(); app.querySelector('[data-a="add"]').click(); }
  });
  render();
})(); 
