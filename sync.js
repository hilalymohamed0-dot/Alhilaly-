import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8Qpt3Y6JHu9HT53fTA1h-Fb9Q0ujgkbE",
  authDomain: "alhilali-de151.firebaseapp.com",
  projectId: "alhilali-de151",
  storageBucket: "alhilali-de151.firebasestorage.app",
  messagingSenderId: "992832253278",
  appId: "1:992832253278:web:45d3cbb0623976f46fb3cf"
};

const CLS = document.body.dataset.cls;
const KEY = "hilali_" + CLS;

// شارة صغيرة تعرض حالة المزامنة
const badge = document.createElement("div");
badge.className = "noprint";
badge.style.cssText =
  "position:fixed;bottom:8px;left:8px;z-index:9999;font-size:11px;padding:4px 8px;" +
  "border-radius:10px;background:rgba(0,0,0,.65);color:#fff;opacity:.85;pointer-events:none";
badge.textContent = "☁️ جارٍ المزامنة...";
document.body.appendChild(badge);
function status(t) { badge.textContent = t; }

let ref = null;
try {
  const app = initializeApp(firebaseConfig);
  ref = doc(getFirestore(app), "classes", CLS);
} catch (e) {
  console.warn("firebase init failed", e);
}

function withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); })
  ]);
}

async function pull() {
  if (!ref) { status("⚠️ بدون مزامنة"); return; }
  try {
    const snap = await withTimeout(getDoc(ref), 7000);
    if (snap.exists() && snap.data().json) {
      localStorage.setItem(KEY, snap.data().json);
      status("☁️ متزامن");
    } else {
      // أول جهاز: نرفع البيانات الموجودة على الجوال إلى القاعدة
      const local = localStorage.getItem(KEY);
      if (local) await withTimeout(setDoc(ref, { json: local, updated: Date.now() }), 7000);
      status("☁️ متزامن");
    }
  } catch (e) {
    console.warn("pull failed", e);
    status("⚠️ غير متصل (يعمل محليًا)");
  }
}

function patchSave() {
  const orig = Storage.prototype.setItem;
  let timer = null;
  Storage.prototype.setItem = function (k, v) {
    orig.apply(this, arguments);
    if (k === KEY && ref) {
      status("☁️ جارٍ الحفظ...");
      clearTimeout(timer);
      timer = setTimeout(function () {
        setDoc(ref, { json: v, updated: Date.now() })
          .then(function () { status("☁️ متزامن"); })
          .catch(function () { status("⚠️ لم يُحفظ على السحابة"); });
      }, 800);
    }
  };
}

function loadApp() {
  const s = document.createElement("script");
  s.src = "app.js";
  document.body.appendChild(s);
}

(async function () {
  await pull();
  patchSave();
  loadApp();
})();
