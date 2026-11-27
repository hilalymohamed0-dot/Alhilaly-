(function () {
  var body = document.body, CLS = body.dataset.cls, TITLE = body.dataset.title;
  var KEY = 'hilali_' + CLS, db = null;
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!db || !db.students) db = { students: [], att: {} };
  var IS9 = TITLE.indexOf('التاسع') >= 0;
  var IS_BAK = CLS === 'bakaloria' || TITLE.indexOf('بكالوريا') >= 0;
  var DEF = IS9
    ? { 'رياضيات': 300, 'فيزياء وكيمياء': 200, 'علوم': 300, 'عربي': 600, 'انكليزي': 400, 'فرنسي': 400, 'اجتماعيات': 300, 'ديانة': 200 }
    : IS_BAK
      ? { 'رياضيات': 600, 'فيزياء': 400, 'علوم': 300, 'عربي': 400, 'انكليزي': 300, 'فرنسي': 300, 'ديانة': 200, 'كيمياء': 200 }
      : {};
  var DEFKEYS = Object.keys(DEF);
  if (!db.marks) db.marks = [];
  if (!db.subjects) db.subjects = DEFKEYS.slice();
  else if (!db.subjects.length && DEFKEYS.length && !db.marks.length) db.subjects = DEFKEYS.slice();
  if (!db.maxes) db.maxes = {};
  db.subjects.forEach(function (s) { if (db.maxes[s] === undefined && DEF[s] !== undefined) db.maxes[s] = DEF[s]; });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} pushSync(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function today() { var d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function digits(s) { return String(s || '').replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 1632; }).replace(/\D/g, ''); }
  function num(s) {
    s = String(s || '').replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 1632; }).replace(/[٫,،]/g, '.').trim();
    var n = parseFloat(s); return isNaN(n) ? null : n;
  }

  var css = document.createElement('style');
  css.textContent =
    '.mtable{overflow-x:auto}' +
    '.mtable table{width:100%;border-collapse:collapse;font-size:13px}' +
    '.mtable th,.mtable td{border:1px solid rgba(128,128,128,.5);padding:6px 4px;text-align:center}' +
    '.mtable td.nm{text-align:right;white-space:nowrap}' +
    '.mtable td.ls{text-align:right;line-height:1.7}' +
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
    '.mtable{overflow:visible}' +
    '.mtable,.mtable *{color:#000!important}' +
    '.mtable th{background:#f3ead0!important}' +
    '.mtable .low{color:#c0392b!important}' +
    '}';
  document.head.appendChild(css);

  var logoData = '';
  try {
    fetch('icon-192.png').then(function (r) { return r.blob(); }).then(function (b) {
      var fr = new FileReader();
      fr.onload = function () { logoData = fr.result; };
      fr.readAsDataURL(b);
    }).catch(function () {});
  } catch (e) {}

  var tab = 'st', date = today(), month = today().slice(0, 7), sel = '', app = document.getElementById('app');
  var subj = '', exTitle = '', exMax = '100', exMaxFor = '', exDate = today(), draft = {}, mkmode = 'in', stuAll = false;

  function studentsView() {
    var h = '<div class="card"><input id="nm" placeholder="اسم الطالب">' +
      '<input id="ph" type="tel" inputmode="tel" placeholder="رقم ولي الأمر (مع رمز الدولة)" style="margin-top:8px">' +
      '<button class="btn" data-a="add" style="margin-top:8px">إضافة</button></div>';
    if (!db.students.length) return h + '<div class="empty">لا يوجد طلاب بعد</div>' + backupCard();
    return h + db.students.map(function (s, i) {
      var p = s.phone ? '<div class="sub" dir="ltr">' + esc(s.phone) + '</div>' : '<div class="sub">لا يوجد رقم ولي أمر</div>';
      return '<div class="card row"><div class="name">' + (i + 1) + '. ' + esc(s.name) + p + '</div>' +
        '<button class="btn" data-a="ph" data-id="' + s.id + '">الرقم</button> ' +
        '<button class="btn x" data-a="del" data-id="' + s.id + '">حذف</button></div>';
    }).join('') + backupCard();
  }

  function lastBackup() { try { return localStorage.getItem('hilalimeta_lastbackup') || ''; } catch (e) { return ''; } }

  function backupCard() {
    var last = lastBackup(), msg, warn = false;
    if (!last) { msg = 'لم تحفظ نسخة احتياطية بعد'; warn = true; }
    else {
      var days = Math.floor((new Date(today()) - new Date(last)) / 86400000);
      msg = 'آخر نسخة احتياطية: ' + last + (days > 0 ? ' (قبل ' + days + ' يوم)' : ' (اليوم)');
      if (days >= 7) warn = true;
    }
    return '<div class="card"><div class="name">النسخة الاحتياطية</div>' +
      '<div class="sub"' + (warn ? ' style="color:#c0392b"' : '') + '>' + msg + '</div>' +
      '<div class="sub">تشمل كل الصفوف: الطلاب والحضور والعلامات.</div>' +
      '<button class="btn" data-a="backup" style="margin-top:8px">حفظ نسخة احتياطية</button> ' +
      '<button class="btn" data-a="restore" style="margin-top:8px">استرجاع من ملف</button>' +
      '<input type="file" id="rf" style="display:none"></div>';
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

  function monthDays(all) {
    return Object.keys(db.att).filter(function (d) {
      return (all || d.slice(0, 7) === month) && Object.keys(db.att[d]).length;
    }).sort();
  }

  function printHead(title, noMonth, label) {
    var per = noMonth ? '' : (label || 'الشهر: ' + month) + ' · ';
    return '<div class="printhead"><img src="icon-192.png" alt=""><div><h2>معهد الهلالي</h2>' +
      '<div>' + esc(TITLE) + ' — ' + esc(title) + '</div>' +
      '<div>' + per + 'تاريخ الإصدار: ' + today() + '</div></div></div>';
  }

  function repView() {
    var days = monthDays(false);
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

  function stuStats(s, all) {
    var o = { p: 0, l: 0, a: 0, pd: [], ad: [], ld: [] };
    monthDays(all).forEach(function (d) {
      var v = db.att[d][s.id];
      if (v === 'p') { o.p++; o.pd.push(d); }
      else if (v === 'l') { o.l++; o.ld.push(d); }
      else if (v === 'a') { o.a++; o.ad.push(d); }
    });
    o.t = o.p + o.l + o.a;
    o.pc = o.t ? Math.round((o.p + o.l) / o.t * 100) : 0;
    return o;
  }

  function subjAvg(sid, sj) {
    var tot = 0, n = 0;
    db.marks.forEach(function (m) {
      if (m.subj === sj && m.scores[sid] !== undefined) { tot += m.scores[sid] / m.max * 100; n++; }
    });
    return n ? Math.round(tot / n) : null;
  }

  function stuMarks(s) {
    var rows = '', tot = 0, n = 0;
    db.subjects.forEach(function (sj) {
      var ex = db.marks.filter(function (m) { return m.subj === sj && m.scores[s.id] !== undefined; })
        .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      if (!ex.length) return;
      var av = subjAvg(s.id, sj);
      tot += av; n++;
      var list = ex.map(function (m) {
        return esc(m.title) + ' (' + m.date + '): ' + m.scores[s.id] + ' / ' + m.max;
      }).join('<br>');
      rows += '<tr><td class="nm">' + esc(sj) + '</td><td class="ls">' + list + '</td>' +
        '<td><b' + (av < 50 ? ' class="low" style="color:#c0392b"' : '') + '>' + av + '%</b></td></tr>';
    });
    if (!n) return '<div class="card"><div class="name">العلامات</div><div class="sub">لا توجد علامات مسجلة لهذا الطالب</div></div>';
    var g = Math.round(tot / n);
    return '<div class="mtable card"><div class="name" style="margin-bottom:8px">العلامات</div><table><thead><tr><th>المادة</th><th>الامتحانات</th><th>المتوسط</th></tr></thead><tbody>' +
      rows + '<tr><td class="nm"><b>المعدل العام</b></td><td></td><td><b' + (g < 50 ? ' class="low" style="color:#c0392b"' : '') + '>' + g + '%</b></td></tr>' +
      '</tbody></table></div>';
  }

  function stuView() {
    if (!db.students.length) return '<div class="empty">أضف الطلاب أولاً من تبويب الطلاب</div>';
    var s = curStudent();
    var opts = db.students.map(function (x) {
      return '<option value="' + x.id + '"' + (x.id === s.id ? ' selected' : '') + '>' + esc(x.name) + '</option>';
    }).join('');
    var h = '<div class="card noprint"><select id="sel" style="width:100%;padding:10px;font-size:16px">' + opts + '</select>' +
      (stuAll ? '' : '<input type="month" id="mo" value="' + month + '" style="margin-top:8px">') +
      '<button class="btn" data-a="stuall" style="margin-top:8px">' + (stuAll ? 'عرض شهر محدد' : 'عرض كل المدة') + '</button> ' +
      '<button class="btn" data-a="pdf" style="margin-top:8px">حفظ التقرير PDF</button> ' +
      '<button class="btn" data-a="sendpdf" style="margin-top:8px">إرسال التقرير الكامل PDF لولي الأمر</button></div>';
    var o = stuStats(s, stuAll);
    if (!o.t) {
      h += '<div class="empty">لا توجد بيانات حضور لهذا الطالب' + (stuAll ? '' : ' في هذا الشهر') + '</div>';
    } else {
      h += '<div class="sum"><div><b>' + o.p + '</b>حاضر</div><div><b>' + o.l + '</b>متأخر</div><div><b>' + o.a + '</b>غائب</div></div>';
      h += '<div class="card"><div class="row"><div class="name">نسبة الحضور</div><b>' + o.pc + '%</b></div><div class="bar"><i style="width:' + o.pc + '%"></i></div></div>';
      h += '<div class="card"><div class="name">أيام الحضور</div><div class="sub">' + (o.pd.length ? o.pd.join('، ') : 'لا يوجد') + '</div></div>';
      h += '<div class="card"><div class="name">أيام الغياب</div><div class="sub">' + (o.ad.length ? o.ad.join('، ') : 'لا يوجد') + '</div></div>';
      h += '<div class="card"><div class="name">أيام التأخر</div><div class="sub">' + (o.ld.length ? o.ld.join('، ') : 'لا يوجد') + '</div>' +
        (stuAll ? '' : '<button class="btn" data-a="wr" style="margin-top:8px">إرسال التقرير لولي الأمر</button>') + '</div>';
    }
    h += stuMarks(s);
    return h;
  }

  function addSubCard(msg) {
    return '<div class="card"><div class="name">إضافة مادة</div><div class="sub">' + msg + '</div>' +
      '<input id="nsub" placeholder="اسم المادة" style="margin-top:8px">' +
      '<input id="nsubm" type="text" inputmode="decimal" placeholder="علامتها العظمى (مثل 300)" style="margin-top:8px">' +
      '<button class="btn" data-a="addsub" style="margin-top:8px">إضافة مادة</button></div>';
  }

  function marksTop() {
    function mb(k, t) { return '<button class="btn" data-a="mkmode" data-v="' + k + '" style="' + (mkmode === k ? 'outline:2px solid #3dbab5' : 'opacity:.7') + '">' + t + '</button>'; }
    return '<div class="card noprint"><div class="row">' + mb('in', 'إدخال العلامات') + mb('rep', 'تقرير العلامات') + '</div></div>';
  }

  function marksRepView() {
    var h = marksTop();
    if (!db.subjects.length) return h + '<div class="empty">لا توجد مواد بعد</div>';
    if (!db.students.length) return h + '<div class="empty">أضف الطلاب أولاً من تبويب الطلاب</div>';
    if (!db.marks.length) return h + '<div class="empty">لا توجد علامات مسجلة بعد</div>';
    h += '<div class="card noprint"><button class="btn" data-a="pdf">حفظ تقرير العلامات PDF</button></div>';
    var t = '<div class="mtable card"><table><thead><tr><th>الطالب</th>' + db.subjects.map(function (sj) {
      return '<th>' + esc(sj) + (db.maxes[sj] ? '<br>(' + db.maxes[sj] + ')' : '') + '</th>';
    }).join('') + '<th>المعدل العام</th></tr></thead><tbody>';
    db.students.forEach(function (s) {
      var tot = 0, n = 0;
      var cells = db.subjects.map(function (sj) {
        var v = subjAvg(s.id, sj);
        if (v === null) return '<td>—</td>';
        tot += v; n++;
        return '<td' + (v < 50 ? ' class="low" style="color:#c0392b"' : '') + '>' + v + '%</td>';
      }).join('');
      var g = n ? Math.round(tot / n) : null;
      t += '<tr><td class="nm">' + esc(s.name) + '</td>' + cells +
        '<td><b' + (g !== null && g < 50 ? ' class="low" style="color:#c0392b"' : '') + '>' + (g === null ? '—' : g + '%') + '</b></td></tr>';
    });
    t += '</tbody></table><div class="sub" style="margin-top:8px">النسبة المئوية لمتوسط علامات كل مادة من علامتها العظمى (الرقم بين القوسين). عدد الامتحانات المسجلة: ' + db.marks.length + '</div></div>';
    return h + t;
  }

  function marksView() {
    if (mkmode === 'rep') return marksRepView();
    if (!db.subjects.length) return marksTop() + addSubCard('لا توجد مواد بعد. أضف أول مادة:');
    if (db.subjects.indexOf(subj) < 0) subj = db.subjects[0];
    if (exMaxFor !== subj) { exMax = String(db.maxes[subj] || 100); exMaxFor = subj; }
    if (!db.students.length) return marksTop() + '<div class="empty">أضف الطلاب أولاً من تبويب الطلاب</div>';
    var opts = db.subjects.map(function (x) {
      return '<option value="' + esc(x) + '"' + (x === subj ? ' selected' : '') + '>' + esc(x) + (db.maxes[x] ? ' (' + db.maxes[x] + ')' : '') + '</option>';
    }).join('');
    var h = marksTop() + '<div class="card"><select id="sj" style="width:100%;padding:10px;font-size:16px">' + opts + '</select>' +
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
    h += '<div class="card"><button class="btn" data-a="setmax">تعديل العلامة العظمى لمادة ' + esc(subj) + '</button> ' +
      '<button class="btn x" data-a="delsub">حذف المادة</button></div>';
    h += addSubCard('أضف مادة جديدة:');
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
    else if (tab === 'sr' && curStudent()) ph = printHead('تقرير الطالب: ' + curStudent().name, false, stuAll ? 'كل المدة' : 'الشهر: ' + month);
    else if (tab === 'mk' && mkmode === 'rep') ph = printHead('تقرير العلامات', true);
    function n(k, t) { return '<button class="' + (tab === k ? 'on' : '') + '" data-a="tab" data-v="' + k + '">' + t + '</button>'; }
    app.innerHTML = '<header class="brand"><img src="icon-192.png" alt=""><div><h1>معهد الهلالي</h1><span>' + TITLE + cloudHTML() + '</span></div><a class="back" href="index.html">الرئيسية</a></header>' +
      '<nav>' + n('st', 'الطلاب') + n('at', 'الحضور') + n('rp', 'التقرير') + n('sr', 'طالب') + n('mk', 'علامات') + '</nav>' + ph + v;
  }

  function reportHTML(s, all) {
    var o = stuStats(s, all);
    var period = all ? 'كل المدة' : 'شهر ' + month;
    function box(n, l, c) {
      return '<div style="flex:1;border:1px solid #d9d2bd;border-radius:10px;padding:10px;text-align:center">' +
        '<div style="font-size:26px;font-weight:bold;color:' + c + '">' + n + '</div><div style="font-size:13px;color:#555">' + l + '</div></div>';
    }
    function chips(arr) {
      if (!arr.length) return '<span style="font-size:13px;color:#555">لا يوجد</span>';
      return arr.map(function (d) {
        return '<span style="display:inline-block;direction:ltr;margin:0 0 5px 6px;padding:1px 8px;border:1px solid #cfc7ae;border-radius:6px;font-size:13px">' + d + '</span>';
      }).join('');
    }
    function sec(title, inner) {
      return '<div style="margin-top:14px"><div style="font-weight:bold;font-size:15px;color:#1a6f6f;margin-bottom:5px">' + title + '</div>' + inner + '</div>';
    }
    var th = 'border:1px solid #bbb;padding:7px;background:#f3ead0;font-size:13px';
    var td = 'border:1px solid #bbb;padding:7px;font-size:13px;vertical-align:top';
    var att;
    if (o.t) {
      att = '<div style="display:flex;gap:10px;margin-top:6px">' + box(o.p, 'حاضر', '#1a8a5a') + box(o.l, 'متأخر', '#b8860b') + box(o.a, 'غائب', '#c0392b') + box(o.pc + '%', 'نسبة الحضور', '#1a6f6f') + '</div>' +
        sec('أيام الغياب (' + o.ad.length + ')', chips(o.ad)) +
        sec('أيام التأخر (' + o.ld.length + ')', chips(o.ld)) +
        sec('أيام الحضور (' + o.pd.length + ')', chips(o.pd));
    } else {
      att = '<div style="font-size:13px;color:#555;margin-top:6px">لا توجد بيانات حضور في هذه الفترة</div>';
    }
    var rows = '', tot = 0, n = 0;
    db.subjects.forEach(function (sj) {
      var ex = db.marks.filter(function (m) { return m.subj === sj && m.scores[s.id] !== undefined; })
        .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      if (!ex.length) return;
      var av = subjAvg(s.id, sj);
      tot += av; n++;
      var list = ex.map(function (m) {
        return esc(m.title) + ' <span style="direction:ltr;display:inline-block">(' + m.date + ')</span>: <b>' +
          '<span style="direction:ltr;display:inline-block">' + m.scores[s.id] + ' / ' + m.max + '</span></b>';
      }).join('<br/>');
      rows += '<tr><td style="' + td + ';font-weight:bold">' + esc(sj) + (db.maxes[sj] ? ' <span style="color:#777;font-weight:normal">(' + db.maxes[sj] + ')</span>' : '') + '</td>' +
        '<td style="' + td + ';line-height:1.8">' + list + '</td>' +
        '<td style="' + td + ';text-align:center;font-weight:bold;color:' + (av < 50 ? '#c0392b' : '#1a1a1a') + '">' + av + '%</td></tr>';
    });
    var marks;
    if (n) {
      var g = Math.round(tot / n);
      marks = '<table style="width:100%;border-collapse:collapse"><thead><tr><th style="' + th + '">المادة</th><th style="' + th + '">الامتحانات والعلامات</th><th style="' + th + '">المتوسط</th></tr></thead><tbody>' + rows +
        '<tr><td style="' + td + ';font-weight:bold" colspan="2">المعدل العام</td><td style="' + td + ';text-align:center;font-weight:bold;color:' + (g < 50 ? '#c0392b' : '#1a1a1a') + '">' + g + '%</td></tr></tbody></table>';
    } else {
      marks = '<div style="font-size:13px;color:#555">لا توجد علامات مسجلة</div>';
    }
    return '<div style="width:794px;box-sizing:border-box;padding:30px;background:#fff;color:#1a1a1a;direction:rtl;text-align:right;font-family:Tahoma,Arial,sans-serif">' +
      '<div style="display:flex;align-items:center;gap:16px;border-bottom:4px solid #c9a227;padding-bottom:14px">' +
      (logoData ? '<img src="' + logoData + '" style="width:84px;height:84px;object-fit:contain" alt=""/>' : '') +
      '<div><div style="font-size:28px;font-weight:bold;color:#1a6f6f">معهد الهلالي</div>' +
      '<div style="font-size:15px;margin-top:4px">' + esc(TITLE) + ' — تقرير الطالب</div>' +
      '<div style="font-size:13px;color:#666;margin-top:2px">الفترة: ' + period + ' · تاريخ الإصدار: ' + today() + '</div></div></div>' +
      '<div style="margin-top:16px;font-size:22px;font-weight:bold">الطالب: ' + esc(s.name) + '</div>' +
      sec('الحضور والغياب', att) +
      sec('العلامات', marks) +
      '<div style="margin-top:26px;border-top:1px solid #ddd;padding-top:10px;font-size:12px;color:#777;text-align:center">إدارة معهد الهلالي</div></div>';
  }

  function u8(str) { var a = new Uint8Array(str.length); for (var i = 0; i < str.length; i++) a[i] = str.charCodeAt(i) & 255; return a; }
  function b64ToU8(b64) { var bin = atob(b64), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }

  function buildPDF(pages) {
    var PW = 595.28, PH = 841.89, chunks = [], pos = 0, offs = [];
    function push(x) { var a = typeof x === 'string' ? u8(x) : x; chunks.push(a); pos += a.length; }
    function obj(n, head, stream) {
      offs[n] = pos; push(n + ' 0 obj\n' + head + '\n');
      if (stream) { push('stream\n'); push(stream); push('\nendstream\n'); }
      push('endobj\n');
    }
    var n = pages.length;
    push('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    var kids = pages.map(function (p, i) { return (3 + 3 * i) + ' 0 R'; }).join(' ');
    obj(2, '<< /Type /Pages /Kids [' + kids + '] /Count ' + n + ' >>');
    pages.forEach(function (p, i) {
      var H = PW * p.h / p.w, y = PH - H;
      var cs = 'q ' + PW.toFixed(2) + ' 0 0 ' + H.toFixed(2) + ' 0 ' + y.toFixed(2) + ' cm /Im0 Do Q';
      obj(3 + 3 * i, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im0 ' + (5 + 3 * i) + ' 0 R >> >> /Contents ' + (4 + 3 * i) + ' 0 R >>');
      obj(4 + 3 * i, '<< /Length ' + cs.length + ' >>', cs);
      obj(5 + 3 * i, '<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.d.length + ' >>', p.d);
    });
    var total = 3 + 3 * n, xr = pos;
    var x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (var i = 1; i < total; i++) x += ('0000000000' + offs[i]).slice(-10) + ' 00000 n \n';
    push(x);
    push('trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF');
    return new Blob(chunks, { type: 'application/pdf' });
  }

  function htmlToCanvas(html) {
    return new Promise(function (res, rej) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;';
      wrap.innerHTML = html;
      document.body.appendChild(wrap);
      var el = wrap.firstChild, imgs = el.querySelectorAll('img'), pending = imgs.length, started = false;
      function go() {
        if (started) return; started = true;
        var h = el.offsetHeight, xml = new XMLSerializer().serializeToString(el);
        document.body.removeChild(wrap);
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="794" height="' + h + '"><foreignObject x="0" y="0" width="794" height="' + h + '">' + xml + '</foreignObject></svg>';
        var im = new Image();
        im.onload = function () {
          try {
            var sc = h > 2600 ? 1.5 : 2, cw = Math.round(794 * sc), ch = Math.round(h * sc);
            var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
            var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cw, ch);
            cx.drawImage(im, 0, 0, cw, ch);
            res(cv);
          } catch (e) { rej(e); }
        };
        im.onerror = function () { rej(new Error('render')); };
        im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      }
      if (!pending) { go(); return; }
      function one() { pending--; if (pending <= 0) go(); }
      for (var i = 0; i < imgs.length; i++) {
        if (imgs[i].complete) one(); else { imgs[i].onload = one; imgs[i].onerror = one; }
      }
      setTimeout(go, 3000);
    });
  }

  function makeReportPDF(s) {
    return htmlToCanvas(reportHTML(s, stuAll)).then(function (cv) {
      var cw = cv.width, ch = cv.height, pageH = Math.round(cw * 841.89 / 595.28), pages = [];
      for (var y = 0; y < ch; y += pageH) {
        var sh = Math.min(pageH, ch - y);
        var c2 = document.createElement('canvas'); c2.width = cw; c2.height = sh;
        var x2 = c2.getContext('2d'); x2.fillStyle = '#fff'; x2.fillRect(0, 0, cw, sh);
        x2.drawImage(cv, 0, y, cw, sh, 0, 0, cw, sh);
        pages.push({ d: b64ToU8(c2.toDataURL('image/jpeg', 0.92).split(',')[1]), w: cw, h: sh });
      }
      return buildPDF(pages);
    });
  }

  function downloadBlob(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 4000);
  }

  function sendPDF(btn) {
    var st = curStudent();
    if (!st) return;
    var o = stuStats(st, stuAll);
    var hasMarks = db.marks.some(function (m) { return m.scores[st.id] !== undefined; });
    if (!o.t && !hasMarks) { alert('لا توجد بيانات حضور أو علامات لهذا الطالب.'); return; }
    var old = btn.textContent;
    btn.textContent = 'جارٍ تجهيز الملف...'; btn.disabled = true;
    function done() { btn.textContent = old; btn.disabled = false; }
    makeReportPDF(st).then(function (blob) {
      var fname = 'تقرير ' + st.name.replace(/[\\\/:*?"<>|]/g, ' ') + '.pdf';
      var file = null;
      try { file = new File([blob], fname, { type: 'application/pdf' }); } catch (e) {}
      var text = 'السلام عليكم ورحمة الله،\nتقرير الطالب ' + st.name + ' من معهد الهلالي (' + (stuAll ? 'كل المدة' : 'شهر ' + month) + ').';
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: fname, text: text }).catch(function (e) {
          if (!e || e.name !== 'AbortError') throw e;
        });
      }
      downloadBlob(blob, fname);
      alert('تم حفظ الملف في جوالك (التنزيلات). أرفقه الآن في واتساب مع ولي الأمر.');
      if (st.phone) window.open('https://wa.me/' + st.phone + '?text=' + encodeURIComponent(text), '_blank');
    }).then(done, function () {
      done();
      if (confirm('تعذّر إنشاء الملف مباشرة. هل تريد حفظ التقرير عبر الطباعة بدلاً من ذلك؟')) printPDF();
    });
  }

  function makeBackup() {
    var snap = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('hilali_') === 0) snap[k] = localStorage.getItem(k);
    }
    var blob = new Blob([JSON.stringify({ app: 'hilali', v: 1, date: today(), data: snap })], { type: 'application/json' });
    var fname = 'نسخة احتياطية الهلالي ' + today() + '.json';
    function mark() { try { localStorage.setItem('hilalimeta_lastbackup', today()); } catch (e) {} render(); }
    function dl() {
      downloadBlob(blob, fname);
      alert('تم حفظ النسخة الاحتياطية في جوالك (التنزيلات). أرسلها لنفسك على واتساب أو ارفعها على Drive لتبقى محفوظة خارج الجوال.');
      mark();
    }
    var file = null;
    try { file = new File([blob], fname, { type: 'application/json' }); } catch (e) {}
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: fname }).then(mark, function (e) {
        if (!e || e.name !== 'AbortError') dl();
      });
    } else dl();
  }

  function restoreFrom(file) {
    var fr = new FileReader();
    fr.onload = function () {
      var obj = null;
      try { obj = JSON.parse(fr.result); } catch (e) {}
      var keys = [], students = 0;
      if (obj && obj.app === 'hilali' && obj.data && typeof obj.data === 'object') {
        Object.keys(obj.data).forEach(function (k) {
          if (k.indexOf('hilali_') !== 0) return;
          var d = null;
          try { d = JSON.parse(obj.data[k]); } catch (e) {}
          if (d && d.students) { keys.push(k); students += d.students.length; }
        });
      }
      if (!keys.length) { alert('هذا الملف ليس نسخة احتياطية صالحة لتطبيق الهلالي.'); return; }
      if (!confirm('سيتم استبدال البيانات الحالية بمحتوى النسخة الاحتياطية.\nتاريخ النسخة: ' + (obj.date || '؟') + '\nعدد الصفوف: ' + keys.length + '، عدد الطلاب: ' + students + '\nهل تريد المتابعة؟')) return;
      keys.forEach(function (k) { localStorage.setItem(k, obj.data[k]); });
      alert('تم استرجاع البيانات بنجاح.');
      location.reload();
    };
    fr.onerror = function () { alert('تعذّرت قراءة الملف.'); };
    fr.readAsText(file);
  }

  function printPDF() {
    var old = document.title, st = curStudent(), ls = null;
    if (tab === 'mk') {
      document.title = 'تقرير العلامات ' + TITLE + ' ' + today();
      ls = document.createElement('style');
      ls.textContent = '@page{size:A4 landscape}';
      document.head.appendChild(ls);
    } else if (tab === 'sr' && st) {
      document.title = 'تقرير ' + st.name + ' ' + (stuAll ? 'كامل' : month);
    } else {
      document.title = 'تقرير ' + TITLE + ' ' + month;
    }
    function back() {
      document.title = old;
      if (ls && ls.parentNode) ls.parentNode.removeChild(ls);
      window.removeEventListener('afterprint', back);
    }
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
    var o = stuStats(st, false);
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
    if (a === 'sendpdf') { sendPDF(t); return; }
    if (a === 'backup') { makeBackup(); return; }
    if (a === 'restore') { var rf = document.getElementById('rf'); if (rf) rf.click(); return; }
    if (a === 'tab') { tab = t.dataset.v; }
    else if (a === 'stuall') { stuAll = !stuAll; }
    else if (a === 'mkmode') { if (mkmode === 'in') captureDraft(); mkmode = t.dataset.v; }
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
      var sm = num((document.getElementById('nsubm') || {}).value);
      if (db.subjects.indexOf(nm2) < 0) db.subjects.push(nm2);
      if (sm && sm > 0) db.maxes[nm2] = sm;
      save();
      subj = nm2; exMaxFor = '';
    } else if (a === 'setmax') {
      var nv2 = prompt('العلامة العظمى لمادة ' + subj, db.maxes[subj] || '');
      if (nv2 === null) return;
      var mv = num(nv2);
      if (!mv || mv <= 0) { alert('اكتب رقماً صحيحاً.'); return; }
      db.maxes[subj] = mv; save(); exMaxFor = '';
    } else if (a === 'delsub') {
      if (!confirm('حذف مادة ' + subj + ' وكل علاماتها؟')) return;
      var cur = subj;
      db.subjects = db.subjects.filter(function (x) { return x !== cur; });
      db.marks = db.marks.filter(function (m) { return m.subj !== cur; });
      delete db.maxes[cur];
      subj = ''; save();
    }
    render();
  });
  app.addEventListener('change', function (e) {
    if (e.target.id === 'dt' && e.target.value) { date = e.target.value; render(); }
    if (e.target.id === 'mo' && e.target.value) { month = e.target.value; render(); }
    if (e.target.id === 'sel' && e.target.value) { sel = e.target.value; render(); }
    if (e.target.id === 'sj' && e.target.value) { captureDraft(); subj = e.target.value; render(); }
    if (e.target.id === 'rf' && e.target.files && e.target.files[0]) { restoreFrom(e.target.files[0]); }
  });
  app.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.target.id === 'nm' || e.target.id === 'ph')) { e.preventDefault(); app.querySelector('[data-a="add"]').click(); }
  });

  // ===== المزامنة السحابية (Firestore) =====
  var FB_VER = '10.12.2', fs = null, FX = null, ready = false, syncState = '';
  var legacy = null, legacyDone = true;
  var shadow = {}, remote = { students: {}, marks: {}, att: {}, meta: {} }, got = {}, mstat = {};
  try { shadow = JSON.parse(localStorage.getItem('hilalisync_' + CLS)) || {}; } catch (e) { shadow = {}; }

  function cloudHTML() { return syncState ? ' · <span id="cl">' + syncState + '</span>' : ''; }
  function setSync(t) {
    if (t === syncState) return;
    var had = !!syncState; syncState = t;
    var el = document.getElementById('cl');
    if (el) el.textContent = t; else if (!had) renderIfIdle();
  }
  function busy() {
    var els = app.querySelectorAll('input,textarea');
    for (var i = 0; i < els.length; i++) {
      var ty = els[i].type;
      if (ty === 'date' || ty === 'month' || ty === 'file') continue;
      if (els[i] === document.activeElement || els[i].value) return true;
    }
    return false;
  }
  function renderIfIdle() { if (!busy()) render(); }
  function nid(x) { return parseInt(String(x.id).replace(/\D/g, ''), 10) || 0; }

  function flat(d) {
    var o = {};
    d.students.forEach(function (x) { o['s/' + x.id] = JSON.stringify(x); });
    d.marks.forEach(function (x) { o['m/' + x.id] = JSON.stringify(x); });
    Object.keys(d.att).forEach(function (dt) {
      var r = d.att[dt] || {};
      Object.keys(r).forEach(function (sid) { if (r[sid]) o['a/' + dt + '/' + sid] = r[sid]; });
    });
    o.meta = JSON.stringify({ subjects: d.subjects || [], maxes: d.maxes || {} });
    return o;
  }
  function build(M) {
    var d = { students: [], att: {}, marks: [], subjects: [], maxes: {} };
    Object.keys(M).forEach(function (k) {
      try {
        if (k === 'meta') { var m = JSON.parse(M[k]); d.subjects = m.subjects || []; d.maxes = m.maxes || {}; }
        else if (k.indexOf('s/') === 0) d.students.push(JSON.parse(M[k]));
        else if (k.indexOf('m/') === 0) d.marks.push(JSON.parse(M[k]));
        else if (k.indexOf('a/') === 0) { var p = k.split('/'); (d.att[p[1]] || (d.att[p[1]] = {}))[p[2]] = M[k]; }
      } catch (e) {}
    });
    d.students.sort(function (a, b) { return nid(a) - nid(b); });
    d.marks.sort(function (a, b) { return nid(a) - nid(b); });
    return d;
  }
  function remoteFlat() {
    var o = {};
    Object.keys(remote.students).forEach(function (id) { o['s/' + id] = remote.students[id]; });
    Object.keys(remote.marks).forEach(function (id) { o['m/' + id] = remote.marks[id]; });
    Object.keys(remote.att).forEach(function (dt) {
      var r = remote.att[dt] || {};
      Object.keys(r).forEach(function (sid) { if (r[sid]) o['a/' + dt + '/' + sid] = r[sid]; });
    });
    if (remote.meta.main !== undefined) o.meta = remote.meta.main;
    return o;
  }
  // دمج ثلاثي: ما غيّرتُه محلياً منذ آخر مزامنة يفوز، وإلا نأخذ ما في السحابة
  function mergeFlat(R, L, S) {
    var keys = {}, M = {};
    [R, L, S].forEach(function (o) { Object.keys(o).forEach(function (k) { keys[k] = 1; }); });
    Object.keys(keys).forEach(function (k) {
      var l = L[k], r = R[k], sv = S[k], v;
      if (k === 'meta') {
        var chg = sv !== undefined && l !== sv;
        v = (r !== undefined && !chg) ? r : l;
      } else {
        v = (l !== sv) ? l : r;
      }
      if (v !== undefined) M[k] = v;
    });
    return M;
  }
  function diffFlat(base, tgt) {
    var ops = [];
    Object.keys(tgt).forEach(function (k) { if (tgt[k] !== base[k]) ops.push({ k: k, v: tgt[k] }); });
    Object.keys(base).forEach(function (k) { if (tgt[k] === undefined && k !== 'meta') ops.push({ k: k, del: true }); });
    return ops;
  }
  function sameFlat(a, b) {
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (var i = 0; i < ka.length; i++) if (a[ka[i]] !== b[ka[i]]) return false;
    return true;
  }
  function legacyFlat(j) {
    var d = JSON.parse(j);
    return flat({ students: d.students || [], att: d.att || {}, marks: d.marks || [], subjects: d.subjects || [], maxes: d.maxes || {} });
  }
  function persistShadow() { try { localStorage.setItem('hilalisync_' + CLS, JSON.stringify(shadow)); } catch (e) {} }

  function exec(ops) {
    if (!fs || !FX) return;
    var items = [], attOps = {};
    ops.forEach(function (o) {
      var p = o.k.split('/');
      if (o.k === 'meta') {
        items.push(function (b) { b.set(FX.doc(fs, 'classes', CLS, 'meta', 'main'), { j: o.v }); });
      } else if (p[0] === 'a') {
        var r = attOps[p[1]] || (attOps[p[1]] = {});
        r[p[2]] = o.del ? FX.deleteField() : o.v;
      } else {
        var col = p[0] === 's' ? 'students' : 'marks';
        items.push(function (b) {
          var ref = FX.doc(fs, 'classes', CLS, col, p[1]);
          if (o.del) b.delete(ref); else b.set(ref, { j: o.v });
        });
      }
    });
    Object.keys(attOps).forEach(function (dt) {
      items.push(function (b) { b.set(FX.doc(fs, 'classes', CLS, 'att', dt), { r: attOps[dt] }, { merge: true }); });
    });
    for (var i = 0; i < items.length; i += 400) {
      var b = FX.writeBatch(fs);
      items.slice(i, i + 400).forEach(function (f) { f(b); });
      b.commit().catch(function (e) { console.log('sync write', e); setSync('⚠️ تعذّر الحفظ في السحابة'); });
    }
  }

  function pushSync() {
    if (!ready) return;
    var Lf = flat(db), ops = diffFlat(shadow, Lf);
    shadow = Lf; persistShadow();
    if (ops.length) { setSync('⏳ جارٍ الحفظ'); exec(ops); }
  }

  function updateBadge() {
    var pend = false, cache = true;
    ['students', 'marks', 'att', 'meta'].forEach(function (n) {
      if (mstat[n]) { if (mstat[n].pend) pend = true; if (!mstat[n].cache) cache = false; }
    });
    setSync(pend ? '⏳ جارٍ الحفظ' : cache ? '📴 بلا اتصال' : '☁️ متزامن');
  }

  function onRemote() {
    var Rreal = remoteFlat(), Rf = Rreal, allCache = true;
    if (!ready && !Object.keys(Rreal).length && legacy) Rf = legacy;
    ['students', 'marks', 'att', 'meta'].forEach(function (n) { if (mstat[n] && !mstat[n].cache) allCache = false; });
    // لا نثق بنسخة فارغة قادمة من الذاكرة المؤقتة فقط
    if (allCache && !Object.keys(Rreal).length && Object.keys(shadow).length) { updateBadge(); return; }
    var Lf = flat(db), M = mergeFlat(Rf, Lf, shadow), ops = diffFlat(Rreal, M);
    var changed = !sameFlat(Lf, M);
    shadow = M; persistShadow();
    if (changed) {
      db = build(M);
      try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
    }
    ready = true;
    if (ops.length) exec(ops);
    updateBadge();
    if (changed) renderIfIdle();
  }

  function initSync(cfg, A, F) {
    FX = F;
    var a = A.initializeApp(cfg);
    try {
      fs = F.initializeFirestore(a, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
    } catch (e) { fs = F.getFirestore(a); }
    function tryRemote() { if (legacyDone && got.students && got.marks && got.att && got.meta) onRemote(); }
    if (!Object.keys(shadow).length) {
      legacyDone = false;
      var fin = function () { if (!legacyDone) { legacyDone = true; tryRemote(); } };
      setTimeout(fin, 6000);
      F.getDoc(F.doc(fs, 'classes', CLS)).then(function (sn) {
        try { if (sn.exists() && typeof sn.data().json === 'string') legacy = legacyFlat(sn.data().json); } catch (e) {}
        fin();
      }, fin);
    }
    ['students', 'marks', 'att', 'meta'].forEach(function (nm) {
      F.onSnapshot(F.collection(fs, 'classes', CLS, nm), { includeMetadataChanges: true }, function (snap) {
        var o = {};
        snap.forEach(function (d) {
          var x = d.data();
          if (nm === 'att') o[d.id] = x.r || {};
          else if (typeof x.j === 'string') o[d.id] = x.j;
        });
        remote[nm] = o; got[nm] = 1;
        mstat[nm] = { cache: snap.metadata.fromCache, pend: snap.metadata.hasPendingWrites };
        tryRemote();
      }, function (err) { console.log('sync', err); setSync('⚠️ تعذّرت المزامنة'); });
    });
  }

  function startSync() {
    var base = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/';
    fetch('firebase-config.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('no config'); return r.json(); })
      .then(function (cfg) {
        if (!cfg || !cfg.projectId) throw new Error('bad config');
        return Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-firestore.js')])
          .then(function (m) { initSync(cfg, m[0], m[1]); });
      })
      .catch(function (e) { console.log('sync off', e && e.message); });
  }
  startSync();

  render();
})();
