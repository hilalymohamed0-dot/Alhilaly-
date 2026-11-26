(function () {
  var body = document.body, CLS = body.dataset.cls, TITLE = body.dataset.title;
  var KEY = 'hilali_' + CLS, db = null;
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!db || !db.students) db = { students: [], att: {} };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function today() { var d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }

  var tab = 'st', date = today(), app = document.getElementById('app');

  function studentsView() {
    var h = '<div class="card row"><input id="nm" placeholder="اسم الطالب"><button class="btn" data-a="add">إضافة</button></div>';
    if (!db.students.length) return h + '<div class="empty">لا يوجد طلاب بعد</div>';
    return h + db.students.map(function (s, i) {
      return '<div class="card row"><div class="name">' + (i + 1) + '. ' + esc(s.name) + '</div><button class="btn x" data-a="del" data-id="' + s.id + '">حذف</button></div>';
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
      return '<div class="card row"><div class="name">' + esc(s.name) + '</div><div class="st">' + b('p', 'حاضر') + b('l', 'متأخر') + b('a', 'غائب') + '</div></div>';
    }).join('');
  }

  function repView() {
    var days = Object.keys(db.att).filter(function (d) { return Object.keys(db.att[d]).length; });
    var h = '<div class="sum"><div><b>' + days.length + '</b>عدد الأيام</div><div><b>' + db.students.length + '</b>عدد الطلاب</div></div>';
    if (!db.students.length || !days.length) return h + '<div class="empty">لا توجد بيانات حضور بعد</div>';
    return h + db.students.map(function (s) {
      var p = 0, l = 0, a = 0;
      days.forEach(function (d) { var v = db.att[d][s.id]; if (v === 'p') p++; else if (v === 'l') l++; else if (v === 'a') a++; });
      var t = p + l + a, pc = t ? Math.round((p + l) / t * 100) : 0;
      return '<div class="card"><div class="row"><div class="name">' + esc(s.name) + '</div><b>' + pc + '%</b></div>' +
        '<div class="sub">حاضر ' + p + ' · متأخر ' + l + ' · غائب ' + a + '</div><div class="bar"><i style="width:' + pc + '%"></i></div></div>';
    }).join('');
  }

  function render() {
    var v = tab === 'st' ? studentsView() : tab === 'at' ? attView() : repView();
    function n(k, t) { return '<button class="' + (tab === k ? 'on' : '') + '" data-a="tab" data-v="' + k + '">' + t + '</button>'; }
    app.innerHTML = '<header class="brand"><img src="icon-192.png" alt=""><div><h1>معهد الهلالي</h1><span>' + TITLE + '</span></div><a class="back" href="index.html">الرئيسية</a></header>' +
      '<nav>' + n('st', 'الطلاب') + n('at', 'الحضور') + n('rp', 'التقرير') + '</nav>' + v;
  }

  app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-a]');
    if (!t) return;
    var a = t.dataset.a, id = t.dataset.id;
    if (a === 'tab') { tab = t.dataset.v; }
    else if (a === 'add') {
      var inp = document.getElementById('nm'), name = inp.value.trim();
      if (!name) return;
      db.students.push({ id: 's' + Date.now(), name: name }); save();
    } else if (a === 'del') {
      if (!confirm('حذف هذا الطالب؟')) return;
      db.students = db.students.filter(function (s) { return s.id !== id; });
      Object.keys(db.att).forEach(function (d) { delete db.att[d][id]; });
      save();
    } else if (a === 'set') {
      var r = db.att[date] || (db.att[date] = {});
      if (r[id] === t.dataset.v) delete r[id]; else r[id] = t.dataset.v;
      if (!Object.keys(r).length) delete db.att[date];
      save();
    }
    render();
  });
  app.addEventListener('change', function (e) {
    if (e.target.id === 'dt' && e.target.value) { date = e.target.value; render(); }
  });
  app.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'nm') { e.preventDefault(); app.querySelector('[data-a="add"]').click(); }
  });
  render();
})();
