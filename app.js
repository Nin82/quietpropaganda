/* ==========================================================
   CONFIGURAZIONE
========================================================== */
const GSCRIPT_URL = "https://script.google.com/macros/s/AKfycbzBa0el2AiOKSq49rbIS9SJMxRaSHGRYrnp6_skMfo79pX1kULs7h7WDthrh7LLzFJrHA/exec";

// utile per non cliccare due volte login
let loginInProgress = false;

/* ==========================================================
   INVIO DATI A GOOGLE APPS SCRIPT (VIA IFRAME)
========================================================== */
function postToGoogleScript(data) {
  return new Promise((resolve) => {
    const frame = document.getElementById("gasFrame");

    // Listener risposta
    function handleMessage(event) {
      // accetta solo messaggi validi
      if (typeof event.data !== "object") return;
      window.removeEventListener("message", handleMessage);

      resolve(event.data);
    }

    window.addEventListener("message", handleMessage);

    // Crea form nascosto
    const form = document.createElement("form");
    form.action = GSCRIPT_URL;
    form.method = "POST";
    form.target = "gasFrame";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "data";
    input.value = JSON.stringify(data);

    form.appendChild(input);
    document.body.appendChild(form);

    form.submit();
    form.remove();
  });
}


// Ruoli normalizzati
const ROLES = {
  ADMIN: "Admin",
  WAREHOUSE: "Warehouse",
  PHOTOGRAPHER: "Photographer",
  POSTPRODUCER: "PostProducer",
  PARTNER: "Partner",
  CUSTOMER: "Customer",
};

// Stati ordine
const ORDER_STATES = {
  WAREHOUSE_PENDING: "WAREHOUSE_PENDING",
  WAREHOUSE_DONE: "WAREHOUSE_DONE",
  PHOTO_PENDING: "PHOTO_PENDING",
  PHOTO_DONE: "PHOTO_DONE",
  POST_PENDING: "POST_PENDING",
  POST_DONE: "POST_DONE",
  COMPLETED: "COMPLETED",
};

// Etichette stati
const ORDER_STATE_LABELS = {
  [ORDER_STATES.WAREHOUSE_PENDING]: "In attesa magazzino",
  [ORDER_STATES.WAREHOUSE_DONE]: "Magazzino ok",
  [ORDER_STATES.PHOTO_PENDING]: "In attesa foto",
  [ORDER_STATES.PHOTO_DONE]: "Foto ok",
  [ORDER_STATES.POST_PENDING]: "In attesa post",
  [ORDER_STATES.POST_DONE]: "Post ok",
  [ORDER_STATES.COMPLETED]: "Completato",
};

// Colorini stati (riutilizzo logica che avevi, puoi personalizzare)
const STATUS_COLORS = {
  [ORDER_STATES.WAREHOUSE_PENDING]: "bg-amber-100 text-amber-700 border-amber-200",
  [ORDER_STATES.WAREHOUSE_DONE]: "bg-emerald-100 text-emerald-700 border-emerald-200",
  [ORDER_STATES.PHOTO_PENDING]: "bg-sky-100 text-sky-700 border-sky-200",
  [ORDER_STATES.PHOTO_DONE]: "bg-blue-100 text-blue-700 border-blue-200",
  [ORDER_STATES.POST_PENDING]: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  [ORDER_STATES.POST_DONE]: "bg-purple-100 text-purple-700 border-purple-200",
  [ORDER_STATES.COMPLETED]: "bg-slate-800 text-white border-slate-900",
};

// Per ogni ruolo, quali stati può trattare
const ROLE_ALLOWED_STATUSES = {
  [ROLES.WAREHOUSE]: [
    ORDER_STATES.WAREHOUSE_PENDING,
    ORDER_STATES.WAREHOUSE_DONE,
    ORDER_STATES.PHOTO_PENDING,
  ],
  [ROLES.PHOTOGRAPHER]: [
    ORDER_STATES.PHOTO_PENDING,
    ORDER_STATES.PHOTO_DONE,
    ORDER_STATES.POST_PENDING,
  ],
  [ROLES.POSTPRODUCER]: [
    ORDER_STATES.POST_PENDING,
    ORDER_STATES.POST_DONE,
    ORDER_STATES.COMPLETED,
  ],
  [ROLES.ADMIN]: Object.values(ORDER_STATES),
};

// Config campi ordine
const ORDER_FIELDS = [
  // Identificazione prodotto
  { key: "productCode", label: "Codice Articolo", type: "text" },
  { key: "eanCode", label: "EAN", type: "text" },
  { key: "styleName", label: "Style Name", type: "text" },
  { key: "styleGroup", label: "Style Group", type: "text" },
  { key: "brand", label: "Brand", type: "text" },
  { key: "color", label: "Colore", type: "text" },
  { key: "size", label: "Taglia", type: "text" },
  { key: "category", label: "Categoria", type: "text" },
  { key: "gender", label: "Genere", type: "text" },

  // Scatti
  { key: "numberOfShots", label: "N. Scatti", type: "text" },
  { key: "shots", label: "Shots", type: "text" },
  { key: "stillShot", label: "Scatto Still (S/N)", type: "text" },
  { key: "onModelShot", label: "Scatto On Model (S/N)", type: "text" },

  // Quantità e priorità
  { key: "quantity", label: "Qta", type: "text" },
  { key: "priority", label: "Priorità", type: "text" },

  // Programmazioni
  { key: "s1Prog", label: "S1-Prog", type: "text" },
  { key: "s2Prog", label: "S2-Prog", type: "text" },
  { key: "progOnModel", label: "Prog. On-Model", type: "text" },

  // Stylist
  { key: "s1Stylist", label: "Stylist S1", type: "text" },
  { key: "s2Stylist", label: "Stylist S2", type: "text" },

  // Provenienza e tipo
  { key: "origin", label: "Provenienza (Origin)", type: "text" },
  { key: "provenienza", label: "Provenienza", type: "text" },
  { key: "tipologia", label: "Tipologia", type: "text" },

  // Logistica
  { key: "orderNumber", label: "N. Ordine", type: "text" },
  { key: "ordine", label: "Ordine", type: "text" },
  { key: "ddt", label: "DDT", type: "text" },
  { key: "ddtNumber", label: "DDT Number", type: "text" },
  { key: "collo", label: "Collo", type: "text" },
  { key: "noteLogistica", label: "Note Logistica", type: "textarea" },
  { key: "logisticsNote", label: "Note Aggiuntive Logistica", type: "textarea" },

  // Date logistiche
  { key: "orderDate", label: "Data Ordine", type: "date-string" },
  { key: "entryDate", label: "Entry Date", type: "date-string" },
  { key: "exitDate", label: "Exit Date", type: "date-string" },
  { key: "dataReso", label: "Data Reso", type: "date-string" },
  { key: "returnDate", label: "Return Date", type: "date-string" },

  // Stato lavorazione
  { key: "status", label: "Stato", type: "text" },
  { key: "currentStep", label: "Step Corrente", type: "text" },

  // Assegnazioni
  { key: "assignedToRole", label: "Ruolo Assegnatario", type: "text" },
  { key: "assignedToEmail", label: "Assegnato a", type: "text" },
  { key: "assignedToId", label: "Assegnato ID", type: "text" },
  { key: "assignedToPhotographerId", label: "ID Fotografo", type: "text" },
  { key: "assignedToPostProducerId", label: "ID PostProducer", type: "text" },

  // Foto
  { key: "photoStoragePath", label: "Percorso Foto", type: "text" },

  // Date post produzione
  { key: "postTakeoverDate", label: "Data Presa in Carico Post", type: "date-string" },
  { key: "postDeliveryDate", label: "Data Consegna Post", type: "date-string" },
  { key: "postPresa", label: "Post Presa", type: "text" },
  { key: "postTakeoverCompleted", label: "Post Presa Completata", type: "text" },

  // Calendario / planning
  { key: "calendar", label: "Calendario", type: "text" },
  { key: "calendario", label: "Calendario (altro)", type: "text" },

  // Timestamps
  { key: "created", label: "Creato il", type: "date-string" },
  { key: "updated", label: "Aggiornato il", type: "date-string" },
  { key: "completedAt", label: "Completato il (TS)", type: "text" },
  { key: "lastUpdated", label: "Ultimo aggiornamento", type: "date-string" },
];

// Campi data veri (DATETIME)
const TIMESTAMP_FIELDS_DATETIME = [
  "entryDate",
  "exitDate",
  "orderDate",
  "returnDate",
  "postDeliveryDate",
  "postTakeoverDate"
];

// Campi data che sono STRINGHE
const TIMESTAMP_FIELDS_STRING = [
  "dataPresaPost",
  "dataConsegnaPost",
  "dataReso",
  "dataOrdine",
  "postPresa"
];

// elenco campi data/ora da trattare con TS
const DATE_FIELDS_TS = [
  "entryDate",
  "exitDate",
  "orderDate",
  "returnDate",
  "postDeliveryDate",
  "postTakeoverDate",
  "dataPresaPost",
  "dataConsegnaPost",
  "dataReso",
  "ordine",
  "dataOrdine",
  "postPresa",
  "postTakeoverCompleted",
];


/* =========================================================
   VARIABILI GLOBALI
========================================================= */

let currentUser = null;
let currentRole = null;
let currentCard = null;

let overlayClone = null;
let overlayOriginalId = null;


let adminOrdersCache = [];
let workerOrdersCache = [];
let allWorkersCache = [];

let currentOrderEditing = null;
let currentPermissionsUser = null;


let deleteTargetUserId = null;
let deleteTargetUserEmail = null;
let deleteTargetUserRole = null;
let resetPwTargetUserId = null;

let adminTogglesInitialized = false;
/* =========================================================
   UTILS DOM
========================================================= */

function $(id) {
  return document.getElementById(id);
}

function show(el) {
  if (!el) return;
  el.classList.remove("hidden");
}

function hide(el) {
  if (!el) return;
  el.classList.add("hidden");
}

function setText(id, txt) {
  const el = typeof id === "string" ? $(id) : id;
  if (el) el.textContent = txt ?? "";
}

function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// Toast semplice
function showToast(msg, type = "info") {
  console.log("[TOAST]", type, msg);
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.className =
    "fixed bottom-4 right-4 px-3 py-2 text-xs rounded shadow z-50 " +
    (type === "success"
      ? "bg-emerald-600 text-white"
      : type === "error"
      ? "bg-rose-600 text-white"
      : type === "warning"
      ? "bg-amber-500 text-white"
      : "bg-slate-700 text-white");
  show(el);
  setTimeout(() => hide(el), 3000);
}

function toast(message, type = "info") {
  const box = document.getElementById("toast-container");
  if (!box) return;

  // colore per tipo
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6",
    warning: "#f59e0b"
  };

  box.style.background = colors[type] || "#1e293b";
  box.textContent = message;

  box.classList.remove("hidden");
  box.style.opacity = "1";

  // fade-out
  setTimeout(() => {
    box.style.opacity = "0";
    setTimeout(() => {
      box.classList.add("hidden");
    }, 300);
  }, 2000);
}

// Parsing sicuro di JSON
function parseJsonField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Costruisce una where-clause di uguaglianza semplice
function buildWhereEquals(field, val) {
  if (!val) return "1=0";
  const safe = String(val).replace(/'/g, "''");
  return `${field} = '${safe}'`;
}

// Estrazione ruolo "consolidato"
function extractRole(userObj) {
  if (!userObj) return null;
  let r = userObj.role || userObj.userRole || userObj["blUserRole"];
  if (!r) return null;
  r = String(r).trim();
  if (!r) return null;

  const low = r.toLowerCase();
  if (low.includes("admin")) return ROLES.ADMIN;
  if (low.includes("warehouse") || low.includes("magazz")) return ROLES.WAREHOUSE;
  if (low.includes("photo") || low.includes("foto")) return ROLES.PHOTOGRAPHER;
  if (low.includes("post")) return ROLES.POSTPRODUCER;
  if (low.includes("partner")) return ROLES.PARTNER;
  if (low.includes("customer") || low.includes("cliente")) return ROLES.CUSTOMER;
  return r;
}

// Campi visibili admin
function getVisibleFieldsForAdminTable() {
  return [
    "productCode",
    "eanCode",
    "styleName",
    "styleGroup",
    "brand",
    "color",
    "size",
    "category",
    "gender",
    "numberOfShots",
    "quantity",
    "s1Prog",
    "s2Prog",
    "progOnModel",
    "stillShot",
    "onModelShot",
    "priority",
    "s1Stylist",
    "s2Stylist",
    "provenienza",
    "tipologia",
    "ordine",

    // 📅 date
    "orderDate",
    "entryDate",
    "exitDate",
    "returnDate",
    "postTakeoverDate",
    "postDeliveryDate",

    "collo",
    "ddtNumber",
    "noteLogistica",
    "photoStoragePath",

    "assignedToRole",
    "assignedToEmail",
    "lastUpdated",
  ];
}

async function applyTimestamp(orderId, field) {
  try {
    let updateObj = { objectId: orderId };

    if (TIMESTAMP_FIELDS_DATETIME.includes(field)) {
      // → timestamp DATETIME ISO
      updateObj[field] = new Date().toISOString();
    }
    else if (TIMESTAMP_FIELDS_STRING.includes(field)) {
      // → timestamp STRINGA ISO leggibile
      const now = new Date();
      updateObj[field] =
        now.toISOString().slice(0, 19).replace("T", " "); // formato YYYY-MM-DD HH:mm:ss
    }
    else {
      console.warn("Campo non timestampabile:", field);
      return;
    }

    updateObj.lastUpdated = String(Date.now());

    await Backendless.Data.of(ORDER_TABLE).save(updateObj);

    // aggiorniamo la cache
    const idx = adminOrdersCache.findIndex(o => o.objectId === orderId);
    if (idx >= 0) {
      adminOrdersCache[idx][field] = updateObj[field];
      adminOrdersCache[idx].lastUpdated = updateObj.lastUpdated;
    }

    loadAdminOrders();

    toast("Timestamp aggiornato!", "success");
  }
  catch (err) {
    console.error("Errore applyTimestamp", err);
    toast("Errore durante il timestamp.", "error");
  }
}

function formatDateTimeReadable(val) {
  if (!val) return "";

  const d = new Date(val);
  if (isNaN(d)) return val; // in caso sia una stringa non ISO

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function createTimestampIcon(onClick) {
  const btn = document.createElement("button");
  btn.className =
    "p-1 rounded bg-slate-200 hover:bg-slate-300 transition text-slate-700";

  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" 
         class="w-3 h-3" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  `;

  btn.onclick = onClick;
  return btn;
}

function formatDateTime(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return "";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

async function applyTimestamp(objectId, fieldName, tdElement) {
  try {
    const now = new Date();
    const iso = now.toISOString();

    const updateObj = {
      objectId,
      [fieldName]: iso,
      lastUpdated: String(Date.now())
    };

    const saved = await Backendless.Data.of(ORDER_TABLE).save(updateObj);

    // aggiorno cache locale
    const idx = adminOrdersCache.findIndex(o => o.objectId === objectId);
    if (idx >= 0) {
      adminOrdersCache[idx][fieldName] = iso;
      adminOrdersCache[idx].lastUpdated = saved.lastUpdated;
    }

    // aggiorno SOLO la cella → NIENTE FLICKER
    tdElement.querySelector(".date-text").textContent = formatDateTime(iso);

    toast("Timestamp aggiornato", "success");
  } catch (err) {
    console.error("Errore TS:", err);
    toast("Errore aggiornamento timestamp", "error");
  }
}

function createTsButton(objectId, fieldName, tdElement) {
  const btn = document.createElement("button");
  btn.className = "ml-1 text-slate-600 hover:text-black";
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" 
         viewBox="0 0 24 24"
         class="w-3 h-3 inline-block opacity-70 hover:opacity-100 transition">
      <path fill="currentColor"
            d="M12 1a11 11 0 1 0 11 11A11.013 11.013 0 0 0 12 1Zm0 20a9 9 0 1 1 9-9a9.01 9.01 0 0 1-9 9Zm.5-14h-1v6l5.2 3.1l.5-.8l-4.7-2.8Z"/>
    </svg>
  `;
  btn.onclick = () => applyTimestamp(objectId, fieldName, tdElement);
  return btn;
}

async function quickUpdateDateField(objectId, fieldName, isoValue) {
  try {
    const updateObj = {
      objectId,
      [fieldName]: isoValue,
      lastUpdated: String(Date.now())
    };

    const saved = await Backendless.Data.of(ORDER_TABLE).save(updateObj);

    // aggiorna cache locale admin
    const idx = adminOrdersCache.findIndex(o => o.objectId === objectId);
    if (idx >= 0) {
      adminOrdersCache[idx][fieldName] = isoValue;
      adminOrdersCache[idx].lastUpdated = saved.lastUpdated;
    }

    toast("Data aggiornata", "success");

  } catch (err) {
    console.error("❌ quickUpdateDateField ERR:", err);
    toast("Errore aggiornamento data", "error");
  }
}



/* =========================================================
   INIT BACKENDLESS & LOGIN
========================================================= */

//Backendless.initApp(APP_ID, API_KEY);

async function afterLogin() {

  console.log("Login OK. Ruolo:", currentRole);

  // Sidebar info
  setText("sidebar-username", currentUser.email);
  setText("sidebar-role", currentRole);

  // Nasconde login, mostra logout
  hide($("login-view"));
  show($("logout-btn"));

  // Mostra voci giuste nella sidebar
  if (currentRole === ROLES.ADMIN) {
    show($("nav-admin"));
    hide($("nav-worker"));
  } else {
    show($("nav-worker"));
    hide($("nav-admin"));
  }

  // Admin ============================================
  if (currentRole === ROLES.ADMIN) {
    show($("admin-view"));
    hide($("worker-view"));

    // CARICAMENTI ADMIN
    await loadAllWorkers();
    await loadAdminOrders();
    await loadUsersList();

    // Setup toggle card UI
    setupAdminToggles();

  } else {
    // Worker =========================================
    hide($("admin-view"));
    show($("worker-view"));

    $("worker-role-info").textContent = `Ruolo: ${currentRole}`;

    await loadAllWorkers();
    await loadWorkerOrders();
  }
}

async function initAutoLogin() {
  try {
    const logged = await Backendless.UserService.getCurrentUser();

    if (logged) {
      console.log("🔵 Utente già loggato:", logged.email);

      currentUser = logged;
      currentRole = extractRole(logged);

      // 🔥 AGGIUNTA CRITICA
      // Backendless nel login automatico NON restituisce i campi custom
      const fresh = await Backendless.Data.of("Users").findById(logged.objectId);
      currentUser.visibleFields  = fresh.visibleFields;
      currentUser.editableFields = fresh.editableFields;

      // 🔵 Procedo al flusso normale
      await afterLogin();
      return;
    }

    // altrimenti mostra login normale
    show($("login-view"));

  } catch (err) {
    console.warn("Nessun utente loggato:", err);
    show($("login-view"));
  }
}

async function handleLoginClick() {
  if (loginInProgress) return;
  loginInProgress = true;

  const emailEl = document.getElementById("login-email");
  const passEl = document.getElementById("login-password");
  const statusEl = document.getElementById("login-status");

  if (!emailEl || !passEl) {
    console.error("⚠️ ATTENZIONE: gli ID login-email / login-password non esistono.");
    loginInProgress = false;
    return;
  }

  const user = emailEl.value.trim();
  const password = passEl.value.trim();

  if (!user || !password) {
    statusEl.textContent = "Inserisci email e password.";
    statusEl.className = "text-xs text-red-600";
    statusEl.classList.remove("hidden");
    loginInProgress = false;
    return;
  }

  statusEl.textContent = "Connessione...";
  statusEl.classList.remove("hidden");
  statusEl.className = "text-xs text-blue-600";

  try {
    const response = await postToGoogleScript({
      action: "login",
      user,
      password,
    });

    console.log("Risposta GAS:", response);

    if (!response.ok) {
      statusEl.textContent = response.error || "Errore login.";
      statusEl.className = "text-xs text-red-600";
      loginInProgress = false;
      return;
    }

    // SUCCESSO LOGIN
    statusEl.textContent = "Accesso effettuato!";
    statusEl.className = "text-xs text-green-600";

    // QUI attivi la UI corretta (admin/worker)
    // Per ora facciamo solo vedere che funziona.
    alert("LOGIN OK – Utente: " + response.user.user);

  } catch (err) {
    console.error("Errore login:", err);
    statusEl.textContent = "Errore di connessione.";
    statusEl.className = "text-xs text-red-600";
  }

  loginInProgress = false;
}



function handleLogout() {
  Backendless.UserService.logout()
    .then(() => {
      currentUser = null;
      currentRole = null;

      adminOrdersCache = [];
      workerOrdersCache = [];
      allWorkersCache = [];
      currentOrderEditing = null;
      currentPermissionsUser = null;

      // UI reset
      hide($("admin-view"));
      hide($("worker-view"));
      hide($("logout-btn"));

      show($("login-view"));

      setText("sidebar-username", "Ospite");
      setText("sidebar-role", "Non loggato");

      hide($("nav-admin"));
      hide($("nav-worker"));
    })
    .catch(err => console.error("Logout error", err));
}



/* =========================================================
   GESTIONE UTENTI & PERMESSI (ADMIN)
========================================================= */

function renderUsersTable(users) {
  console.log("🔥 renderUsersTable CHIAMATA, utenti:", users.length);
  const tbody = $("users-table-body");
  if (!tbody) {
    console.error("❌ users-table-body NON TROVATO nel DOM");
    return;
  }

  tbody.innerHTML = "";

  users.forEach((u) => {
    const isAdmin = u.role?.toLowerCase() === "admin";
    const isCurrentUser = u.objectId === currentUser?.objectId;

    const tr = document.createElement("tr");

    tr.dataset.uid = u.objectId;
    tr.dataset.email = u.email || "";
    tr.dataset.role = u.role || "";

    // === LOGICA PULSANTI ===

    // Permessi → sempre
    const btnPermissions = `
      <button class="btn-secondary text-xs"
        onclick="openPermissionsModal('${u.objectId}')">
        Permessi
      </button>
    `;

    // Reset PW → NON per l’utente corrente, SI per gli altri admin, SI per tutti gli altri ruoli
    const btnResetPw =
      isCurrentUser
        ? "" // non posso resettare la mia password
        : `
      <button class="btn-danger text-xs"
        onclick="openResetPwModal('${u.objectId}', '${u.email}')">
        Reset PW
      </button>
    `;

    // Elimina → mai per admin / mai per utente corrente
    const btnElimina =
      isAdmin || isCurrentUser
        ? ""
        : `
      <button class="btn-danger text-xs"
        onclick="openDeleteUserModal('${u.objectId}', '${u.email}', '${u.role}')">
        Elimina
      </button>
    `;

    tr.innerHTML = `
      <td class="td">${u.email || "-"}</td>
      <td class="td">${u.role || "-"}</td>
      <td class="td flex gap-2">
        ${btnPermissions}
        ${btnResetPw}
        ${btnElimina}
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function openResetPwModal(uid, email) {
  closeOverlayIfOpen();
  resetPwTargetUserId = uid;
  $("reset-pw-user-email").textContent = email;
  $("reset-pw-input").value = "";
  $("reset-pw-modal").classList.remove("hidden");
}

function closeResetPwModal() {
  resetPwTargetUserId = null;
  $("reset-pw-modal").classList.add("hidden");
}


async function confirmResetPassword() {
  if (!resetPwTargetUserId) return;

  const newPw = $("reset-pw-input").value.trim();
  if (!newPw) {
    toast("Inserisci una password valida", "error");
    return;
  }

  try {
    await Backendless.Data.of("Users").save({
      objectId: resetPwTargetUserId,
      password: newPw,   // ✅ cambio diretto, nessuna mail
    });

    toast("Password reimpostata!", "success");
    closeResetPwModal();
  } catch (err) {
    console.error("❌ Errore reset password:", err);
    toast("Errore reset password", "error");
  }
}

async function deleteUserConfirmed() {

  if (!deleteTargetUserId) return;

  // Sicurezza assoluta
  if (deleteTargetUserRole === "Admin") {
    toast("Operazione vietata: non puoi eliminare un Admin.", "error");
    closeDeleteUserModal();
    return;
  }

  try {
    await Backendless.Data.of("Users").remove(deleteTargetUserId);

    document.querySelector(`tr[data-uid="${deleteTargetUserId}"]`)?.remove();

    toast("Utente eliminato.", "success");
    closeDeleteUserModal();

  } catch (err) {
    console.error("Errore eliminazione utente:", err);
    toast("Errore durante l'eliminazione.", "error");
  }
}

function openDeleteUserModal(userId, email, role) {
  closeOverlayIfOpen();

  // Blocca sempre eliminazione Admin
  if (role === "Admin") {
    toast("Non puoi eliminare un Admin.", "error");
    return;
  }

  deleteTargetUserId = userId;
  deleteTargetUserEmail = email;
  deleteTargetUserRole = role;

  $("delete-user-email").textContent = `Vuoi eliminare: ${email}?`;
  $("delete-user-modal").classList.remove("hidden");
}

function closeDeleteUserModal() {
  deleteTargetUserId = null;
  deleteTargetUserEmail = null;
  deleteTargetUserRole = null;

  $("delete-user-modal").classList.add("hidden");
}

function setupAdminToggles() {
  console.log("⚙️ Setup toggles admin…");

  const map = [
    { toggle: "toggle-users", target: "card-users" },
    { toggle: "toggle-import", target: "card-import" },
    { toggle: "toggle-orders", target: "card-orders" },
    { toggle: "toggle-stats", target: "card-stats" }
  ];

  map.forEach(({ toggle, target }) => {
    const t = $(toggle);
    const section = $(target);

    if (!t || !section) {
      console.warn("⚠️ Toggle o sezione non trovata:", toggle, target);
      return;
    }

    // Stato iniziale
    section.classList.toggle("hidden", !t.checked);

    // Gestione in tempo reale
    t.addEventListener("change", () => {
      section.classList.toggle("hidden", !t.checked);
    });
  });

  console.log("✅ Admin toggles attivi");
}

function parseJsonField(value) {
  if (!value || value === "null" || value === "undefined") return [];

  // Se Backendless restituisce già un ARRAY
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function loadUsersList() {
  console.log("🔵 Carico lista utenti…");

  try {
    const qb = Backendless.DataQueryBuilder.create()
      .setWhereClause("email IS NOT NULL")
      .setPageSize(100);

    const users = await Backendless.Data.of("Users").find(qb);

    allUsersCache = users.sort((a, b) =>
      (a.email || "").localeCompare(b.email || "")
    );

    renderUsersTable(allUsersCache);

  } catch (err) {
    console.error("❌ ERRORE loadUsersList:", err);
  }
}

async function changeUserRole(userId, newRole) {
  if (currentRole !== ROLES.ADMIN) return;

  try {
    const qb = Backendless.DataQueryBuilder.create()
      .setWhereClause(`objectId = '${userId}'`)
      .setPageSize(1);

    const res = await Backendless.Data.of("Users").find(qb);
    if (!res || res.length === 0) {
      toast("Utente non trovato.", "error");
      return;
    }

    const user = res[0];
    const oldRole = extractRole(user);

    if (oldRole === newRole) {
      toast("Ruolo già impostato.", "info");
      return;
    }

    // NB: la gestione assign/unassign roles lato Backendless ora è limitata
    // da CloudCode. NON usiamo più assignRole/unassignRole qui.
    await Backendless.Data.of("Users").save({
      objectId: userId,
      role: newRole,
    });

    if (typeof loadAllWorkers === "function") {
      await loadAllWorkers();
    }
    if (typeof loadUsersList === "function") {
      await loadUsersList();
    }

    toast("Ruolo aggiornato correttamente!", "success");
  } catch (err) {
    console.error("Errore cambio ruolo", err);
    toast("Errore durante il cambio ruolo.", "error");
  }
}

async function handleCreateUser() {
  const email = $("new-user-email").value.trim();
  const pw = $("new-user-password").value;
  const role = $("new-user-role").value;
  const statusEl = $("user-create-status");

  statusEl.classList.remove("hidden");
  statusEl.className = "text-xs mt-1 text-slate-600";

  if (!email || !pw || !role) {
    statusEl.textContent = "Compila email, password e ruolo.";
    statusEl.className = "text-xs mt-1 text-rose-600";
    return;
  }

  try {
    const newUser = await Backendless.UserService.register({
      email,
      password: pw,
      role,
    });

    // Config permessi default
    await Backendless.Data.of("Users").save({
      objectId: newUser.objectId,
      visibleFields: JSON.stringify(ORDER_FIELDS.map((f) => f.key)),
      editableFields: JSON.stringify([]),
    });

    statusEl.textContent = `Utente ${email} creato correttamente.`;
    statusEl.className = "text-xs mt-1 text-emerald-600";

    $("new-user-email").value = "";
    $("new-user-password").value = "";
    $("new-user-role").value = "";

    await loadUsersList();
    if (typeof loadAllWorkers === "function") {
      await loadAllWorkers();
    }
  } catch (err) {
    console.error("Errore creazione utente", err);
    statusEl.textContent = err.message || "Errore creando l'utente.";
    statusEl.className = "text-xs mt-1 text-rose-600";
  }
}

// Carica TUTTI i lavoratori (non Admin e non Customer)
async function loadAllWorkers() {
  console.log("🔵 Carico tutti i lavoratori...");

  try {
    const qb = Backendless.DataQueryBuilder.create()
      .setWhereClause("email IS NOT NULL")
      .setPageSize(100);

    const all = await Backendless.Data.of("Users").find(qb);

    allWorkersCache = all
      .map(u => ({ ...u, role: extractRole(u) }))
      .filter(u =>
        u.role !== ROLES.ADMIN &&
        u.role !== ROLES.CUSTOMER &&
        u.email
      )
      .sort((a, b) => (a.email || "").localeCompare(b.email || ""));

    console.log("Lavoratori caricati:", allWorkersCache);
  } catch (err) {
    console.error("❌ Errore loadAllWorkers()", err);
  }
}

/* =========================================================
   PERMESSI (MODALE)
========================================================= */

async function openPermissionsModal(userId) {
  closeOverlayIfOpen();
  console.log("🔵 openPermissionsModal:", userId);

  try {
    const fresh = await Backendless.Data.of("Users").findById(userId);
    if (!fresh) return toast("Errore: utente non trovato.", "error");

    currentPermissionsUser = fresh;

    const visible = new Set(parseJsonField(fresh.visibleFields));
    const editable = new Set(parseJsonField(fresh.editableFields));

    const visibleBox = $("perm-visible-fields");
    const editableBox = $("perm-editable-fields");

    // 🔥 SVUOTO DAVVERO I CONTAINER (no innerHTML)
    while (visibleBox.firstChild) visibleBox.removeChild(visibleBox.firstChild);
    while (editableBox.firstChild) editableBox.removeChild(editableBox.firstChild);

    ORDER_FIELDS.forEach((field) => {

      // VISIBILI
      const v = document.createElement("label");
      v.className = "flex items-center gap-2 text-xs";

      const vInput = document.createElement("input");
      vInput.type = "checkbox";
      vInput.className = "perm-visible";
      vInput.value = field.key;
      vInput.checked = visible.has(field.key);

      v.appendChild(vInput);
      v.appendChild(document.createTextNode(field.label));
      visibleBox.appendChild(v);

      // EDITABILI
      const e = document.createElement("label");
      e.className = "flex items-center gap-2 text-xs";

      const eInput = document.createElement("input");
      eInput.type = "checkbox";
      eInput.className = "perm-editable";
      eInput.value = field.key;
      eInput.checked = editable.has(field.key);

      e.appendChild(eInput);
      e.appendChild(document.createTextNode(field.label));
      editableBox.appendChild(e);
    });

    $("permissions-modal").classList.remove("hidden");
    console.log("🟩 Modale aperta OK");

  } catch (err) {
    console.error("❌ Errore openPermissionsModal:", err);
    toast("Errore apertura permessi.", "error");
  }
}


async function saveUserPermissions() {
  console.log("CLICK: saveUserPermissions()");

  if (!currentPermissionsUser) {
    toast("Errore interno: utente non valido.", "error");
    return;
  }

  try {
    const visible = [...document.querySelectorAll(".perm-visible")]
      .filter(ch => ch.checked)
      .map(ch => ch.value);

    const editable = [...document.querySelectorAll(".perm-editable")]
      .filter(ch => ch.checked)
      .map(ch => ch.value);

    const editableClean = editable.filter(e => visible.includes(e));

    console.log("VISIBILI:", visible);
    console.log("EDITABILI:", editableClean);

    // 🚨 🚨 OGGETTO PULITO OBBLIGATORIO 🚨 🚨
    const updateUserPayload = {
      objectId: currentPermissionsUser.objectId,
      email: currentPermissionsUser.email,          // Backendless chiede email presente
      visibleFields: JSON.stringify(visible),
      editableFields: JSON.stringify(editableClean)
    };

    console.log("SENDING UPDATE:", updateUserPayload);

    // 🔥 Update reale
    const result = await Backendless.UserService.update(updateUserPayload);

    console.log("💾 AGGIORNAMENTO APPLICATO:", result);

    toast("Permessi aggiornati!", "success");

    await loadAllWorkers?.();
    await loadUsersList?.();

    closePermissionsModal();

  } catch (err) {
    console.error("❌ ERRORE SALVATAGGIO PERMESSI", err);
    toast("Errore durante il salvataggio.", "error");
  }
}


function closePermissionsModal() {
  hide($("permissions-modal"));
}

function openCardOverlay(cardId) {
  const modal = $("card-overlay-modal");
  const content = $("card-overlay-content");
  const card = $(cardId);

  if (!card) {
    console.error("Card non trovata:", cardId);
    return;
  }

  overlayOriginalId = cardId;

  // Nascondo pulsante overlay nella card originale
  const originalButton = document.querySelector(
    `button[onclick="openCardOverlay('${cardId}')"]`
  );
  if (originalButton) originalButton.classList.add("hidden");

  // Clono la card (deep clone)
  overlayClone = card.cloneNode(true);
  overlayClone.id = cardId + "-overlay";

  // Nascondo nuovamente il pulsante nel clone
  const clonedButton = overlayClone.querySelector(
    `button[onclick="openCardOverlay('${cardId}')"]`
  );
  if (clonedButton) clonedButton.classList.add("hidden");

  // Inserisco clone nel modal
  content.appendChild(overlayClone);

  modal.classList.remove("hidden");
}

function closeCardOverlay() {
  const modal = $("card-overlay-modal");

  // Rimuovo clone
  if (overlayClone) overlayClone.remove();

  // Ripristino pulsante originale
  if (overlayOriginalId) {
    const originalButton = document.querySelector(
      `button[onclick="openCardOverlay('${overlayOriginalId}')"]`
    );
    if (originalButton) originalButton.classList.remove("hidden");
  }

  overlayClone = null;
  overlayOriginalId = null;

  modal.classList.add("hidden");
}

function updateOverlayButtonsVisibility() {
  const cards = [
    { btn: "btn-open-users", card: "card-users" },
    { btn: "btn-open-import", card: "card-import" },
    { btn: "btn-open-orders", card: "card-orders" },
    { btn: "btn-open-stats", card: "card-stats" },
  ];

  const opened = document.body.dataset.cardOpen;

  cards.forEach(({ btn, card }) => {
    const el = $(btn);
    if (!el) return;

    if (opened === card) {
      el.classList.add("hidden");     // nascondi il pulsante relativo
    } else {
      el.classList.remove("hidden");  // mostra gli altri
    }
  });
}

// funzione globale per chiudere l'overlay se aperto
function closeOverlayIfOpen() {
  const modal = $("card-overlay-modal");
  if (!modal.classList.contains("hidden")) {
    closeCardOverlay();
  }
}

/* =========================================================
   IMPORT EXCEL
========================================================= */

async function handleImportClick() {
  const fileInput = $("import-file");
  const statusEl = $("import-status");
  const logEl = $("import-log");
  const progressBar = $("import-progress");

  statusEl.textContent = "";
  logEl.textContent = "";
  hide(logEl);
  progressBar.style.width = "0%";

  if (!fileInput.files || fileInput.files.length === 0) {
    statusEl.textContent = "Seleziona un file prima di importare.";
    statusEl.className = "text-xs text-rose-600";
    return;
  }

  const origin = $("import-origin").value.trim();
  const type = $("import-type").value.trim();
  const orderNumber = $("import-order-number").value.trim();
  const orderDate = $("import-order-date").value;

  const file = fileInput.files[0];

  statusEl.textContent = "Lettura file...";
  statusEl.className = "text-xs text-slate-600";

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.SheetNames[0];
      const ws = wb.Sheets[sheet];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (!rows || rows.length === 0) {
        statusEl.textContent = "File vuoto o non leggibile.";
        statusEl.className = "text-xs text-rose-600";
        return;
      }

      statusEl.textContent = `Importazione ${rows.length} righe...`;
      statusEl.className = "text-xs text-slate-600";

      let ok = 0;
      let dup = 0;
      let err = 0;

      show(logEl);

      let warehouseUser = null;
      try {
        const qbUser = Backendless.DataQueryBuilder.create()
          .setWhereClause(`role = '${ROLES.WAREHOUSE}'`)
          .setPageSize(1);

        const users = await Backendless.Data.of("Users").find(qbUser);
        warehouseUser = users.length > 0 ? users[0] : null;
      } catch (e) {
        console.warn("Impossibile recuperare magazziniere", e);
      }

      const assignedEmail = warehouseUser ? warehouseUser.email : "";

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];

        const productCode = r["Codice Articolo"] || r["productCode"] || "";
        const ean = r["Ean Code"] || r["eanCode"] || "";

        if (!productCode && !ean) {
          logEl.textContent += `⚠ Riga ${i + 1}: nessun Codice Articolo/EAN. Ignorata.\n`;
          err++;
          continue;
        }

        const whereClause = productCode
          ? buildWhereEquals("productCode", productCode)
          : buildWhereEquals("eanCode", ean);

        const qb = Backendless.DataQueryBuilder.create()
          .setWhereClause(whereClause)
          .setPageSize(1);

        const existing = await Backendless.Data.of(ORDER_TABLE).find(qb);
        if (existing.length > 0) {
          logEl.textContent += `❌ Duplicato: ${productCode || ean}\n`;
          dup++;
          progressBar.style.width = `${Math.round(
            ((i + 1) / rows.length) * 100
          )}%`;
          continue;
        }

        const now = new Date();

        const orderObj = {
          productCode,
          eanCode: ean,
          styleName: r["Style Name"] || "",
          styleGroup: r["Style Group"] || "",
          brand: r["Brand"] || "",
          color: r["Colore"] || "",
          size: r["Taglia"] || "",
          category: r["Categoria"] || "",
          gender: r["Genere"] || "",
          shots: r["N. Scatti"] || "",
          quantity: r["Qta"] || "",
          s1Prog: r["s1-Prog"] || "",
          s2Prog: r["s2-Prog"] || "",
          progOnModel: r["Prog. on-m"] || "",
          stillShot: r["Scatto Still (S/N)"] || "",
          onModelShot: r["Scatto On Model (S/N)"] || "",
          priority: r["Priorità"] || "",
          s1Stylist: r["s1-Stylist"] || "",
          s2Stylist: r["s2-Stylist"] || "",
          provenienza: origin || r["provenienza"] || "",
          tipologia: type || r["tipologia"] || "",
          ordine: orderNumber || String(r["Ordine"] || ""),
          dataOrdine: orderDate || r["Data ordine"] || "",
          entryDate: r["Entry Date"] || "",
          exitDate: r["Exit Date"] || "",
          collo: String(r["Collo"] || ""),
          dataReso: r["Data Reso"] || "",
          ddtNumber: r["DDT N."] || "",
          noteLogistica: r["Note Logistica"] || "",
          status: ORDER_STATES.WAREHOUSE_PENDING,
          assignedToRole: ROLES.WAREHOUSE,
          assignedToEmail: assignedEmail,
          lastUpdated: now.getTime().toString(),
        };

        try {
          await Backendless.Data.of(ORDER_TABLE).save(orderObj);
          ok++;
        } catch (e2) {
          console.error("Errore salvataggio ordine", e2);
          logEl.textContent += `❌ Errore salvataggio ${productCode}: ${e2.message}\n`;
          err++;
        }

        progressBar.style.width = `${Math.round(
          ((i + 1) / rows.length) * 100
        )}%`;
      }

      statusEl.textContent = `Importazione completata: ${ok} ordini creati, ${dup} duplicati, ${err} errori.`;
      statusEl.className = "text-xs text-emerald-600";

      await loadAdminOrders();
      fileInput.value = "";
    } catch (error) {
      console.error("Errore lettura/import", error);
      statusEl.textContent = error.message || "Errore durante l'import.";
      statusEl.className = "text-xs text-rose-600";
    }
  };

  reader.readAsArrayBuffer(file);
}

/* =========================================================
   ORDINI ADMIN – TABELLONE + MODALE
========================================================= */

 async function loadAdminOrders() {
  if (currentRole !== ROLES.ADMIN) return;

  const tableBody = $("orders-table-body");
  const headerRow = $("orders-header-row");
  const filterRow = $("orders-filter-row");
  const loadingStatus = $("orders-loading");

  const PAGE_SIZE = 100;

  tableBody.innerHTML = "";
  headerRow.innerHTML = "";
  filterRow.innerHTML = "";
  show(loadingStatus);
  loadingStatus.textContent = "Caricamento…";

  try {
    /* -----------------------------------------------------
       1) CONFIGURAZIONE COLONNE
    ----------------------------------------------------- */
    const visFields = ORDER_FIELDS.map(f => f.key); // Admin vede TUTTE
    const fieldConfig = ORDER_FIELDS; // Modale già usa tutto

    const properties = Array.from(new Set([
      ...visFields,
      "objectId",
      "assignedToRole",
      "assignedToEmail",
      "status",
      "lastUpdated",
    ]));

    /* -----------------------------------------------------
       2) FILTRO DATE 30 GIORNI (default)
    ----------------------------------------------------- */
    const now = Date.now();
    const fromTs = String(now - 30 * 24 * 60 * 60 * 1000);
    const where = `lastUpdated >= '${fromTs}'`;

    /* -----------------------------------------------------
       3) DOWNLOAD PAGINATO
    ----------------------------------------------------- */
    let offset = 0;
    let chunk = [];
    let allOrders = [];

    do {
      const qb = Backendless.DataQueryBuilder.create()
        .setWhereClause(where)
        .setProperties(properties)
        .setSortBy(["lastUpdated DESC"])
        .setPageSize(PAGE_SIZE)
        .setOffset(offset);

      chunk = await Backendless.Data.of(ORDER_TABLE).find(qb);
      allOrders.push(...chunk);
      offset += PAGE_SIZE;

    } while (chunk.length === PAGE_SIZE);

    adminOrdersCache = allOrders;
    hide(loadingStatus);

    /* -----------------------------------------------------
       4) HEADER DELLA TABELLA
    ----------------------------------------------------- */

    // Checkbox — prima colonna
    const thSelect = document.createElement("th");
    thSelect.className = "th w-8 text-center";
    thSelect.innerHTML = `<input type="checkbox" id="select-all-orders">`;
    headerRow.appendChild(thSelect);

    // Azioni — seconda colonna
    const thActions = document.createElement("th");
    thActions.className = "th w-40 text-center";
    thActions.textContent = "Azioni";
    headerRow.appendChild(thActions);

    // Campi dinamici
    fieldConfig.forEach((f) => {
      const th = document.createElement("th");
      th.className = "th whitespace-nowrap";
      th.textContent = f.label;
      headerRow.appendChild(th);
    });

    /* -----------------------------------------------------
       5) FILTRI SOTTO L’HEADER
    ----------------------------------------------------- */

    // filtro checkbox
    const tdFilterSelect = document.createElement("td");
    tdFilterSelect.className = "px-3 py-1";
    filterRow.appendChild(tdFilterSelect);

    // filtro azioni (vuoto)
    const tdFilterActions = document.createElement("td");
    tdFilterActions.className = "px-3 py-1";
    filterRow.appendChild(tdFilterActions);

    // filtri campi
    fieldConfig.forEach((f) => {
      const td = document.createElement("td");
      td.className = "px-3 py-1";

      const input = document.createElement("input");
      input.type = "text";
      input.className = "form-input-filter";
      input.placeholder = "Filtro";
      input.dataset.fieldKey = f.key;
      input.addEventListener("input", debounce(applyOrdersFilters, 250));

      td.appendChild(input);
      filterRow.appendChild(td);
    });

    /* -----------------------------------------------------
       6) RENDERING RIGHE (continua nel blocco 3/4)
    ----------------------------------------------------- */
    allOrders.forEach((o) => {

      const tr = document.createElement("tr");
      tr.dataset.objectId = o.objectId;
      tr.className = "hover:bg-slate-50";

      /* ---------------------------------------------
         CHECKBOX (prima colonna)
      --------------------------------------------- */
      const tdSelect = document.createElement("td");
      tdSelect.className = "px-3 py-2 text-center";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "order-checkbox";
      cb.dataset.objectId = o.objectId;

      tdSelect.appendChild(cb);
      tr.appendChild(tdSelect);

      /* ---------------------------------------------
         AZIONI (seconda colonna)
      --------------------------------------------- */
      const tdActions = document.createElement("td");
      tdActions.className = "px-2 py-2 flex items-center gap-1 whitespace-nowrap";

      // 🖊️ Modifica
      const btnEdit = document.createElement("button");
      btnEdit.className = "btn-secondary text-[10px]";
      btnEdit.textContent = "Modifica";
      btnEdit.onclick = () => openOrderModal(o.objectId);
      tdActions.appendChild(btnEdit);

      // ⏭️ Avanza
      const btnAdvance = document.createElement("button");
      btnAdvance.className = "btn-primary text-[10px]";
      btnAdvance.textContent = "Avanza";

      if (o.status === ORDER_STATES.COMPLETED) {
        btnAdvance.disabled = true;
        btnAdvance.classList.add("opacity-50", "cursor-not-allowed");
      } else {
        btnAdvance.onclick = () => advanceOrder(o.objectId);
      }
      tdActions.appendChild(btnAdvance);

      // 👤 Riassegna
      const selectAssign = createOrderAssignDropdown(o);
      tdActions.appendChild(selectAssign);

      tr.appendChild(tdActions);

      /* -----------------------------------------------------
         7) CELLE DINAMICHE DEI CAMPI
         Gestione speciale per i campi data con timestamp
      ----------------------------------------------------- */
      fieldConfig.forEach((f) => {
        const td = document.createElement("td");
        td.className = "px-3 py-2 whitespace-nowrap";

        const val = o[f.key];

        /* -------------------------------------------------
           Se il campo è una data → formattazione + timestamp
        ------------------------------------------------- */
        const isDateField = [
          "entryDate", "exitDate",
          "orderDate", "returnDate",
          "postDeliveryDate", "postTakeoverDate",
          "dataPresaPost", "dataConsegnaPost",
          "dataReso", "ordine",
          "dataOrdine", "postPresa",
          "postTakeoverCompleted"
        ].includes(f.key);

        if (isDateField) {
          const formatted = val ? formatDateTime(val) : "";

          // contenitore cella
          const wrap = document.createElement("div");
          wrap.className = "flex items-center gap-1";

          // testo formattato
          const span = document.createElement("span");
          span.textContent = formatted;
          span.className = "text-[11px]";
          wrap.appendChild(span);

          // pulsante timestamp (icona orologio)
          const btnTS = document.createElement("button");
          btnTS.className = "p-1 hover:bg-slate-200 rounded transition";

          btnTS.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round"
                 stroke-linejoin="round">
               <circle cx="12" cy="12" r="10"></circle>
               <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          `;

          btnTS.onclick = async () => {
            const newVal = new Date().toISOString();
            await quickUpdateDateField(o.objectId, f.key, newVal);

            // aggiorna UI
            span.textContent = formatDateTime(newVal);
            o[f.key] = newVal;                 // aggiorna cache
          };

          wrap.appendChild(btnTS);

          td.appendChild(wrap);
          tr.appendChild(td);
          return;
        }

        /* -------------------------------------------------
           Stato con badge colorato
        ------------------------------------------------- */
        if (f.key === "status") {
          const span = document.createElement("span");
          const colorClass =
            STATUS_COLORS[val] ||
            "bg-slate-100 text-slate-700 border-slate-200";

          span.className =
            `inline-block px-2 py-0.5 rounded-full text-[10px] border ${colorClass}`;
          span.textContent = ORDER_STATE_LABELS[val] || val;

          td.appendChild(span);
          tr.appendChild(td);
          return;
        }

        /* -------------------------------------------------
           lastUpdated → formato solo data
        ------------------------------------------------- */
        if (f.key === "lastUpdated") {
          const ts = Number(val);
          td.textContent = (!ts || isNaN(ts))
            ? ""
            : new Date(ts).toLocaleDateString("it-IT");

          tr.appendChild(td);
          return;
        }

        /* -------------------------------------------------
           Campo normale
        ------------------------------------------------- */
        td.textContent = val || "";
        tr.appendChild(td);
      });

      tableBody.appendChild(tr);
    });

    /* -----------------------------------------------------
       8) SELECT ALL CHECKBOX
    ----------------------------------------------------- */
    const selectAllCb = $("select-all-orders");
    if (selectAllCb) {
      selectAllCb.onchange = (e) => {
        const checked = e.target.checked;
        const allCbs = document.querySelectorAll(
          "#orders-table-body .order-checkbox"
        );
        allCbs.forEach((cb) => {
          const row = cb.closest("tr");
          if (!row || row.style.display === "none") return;
          cb.checked = checked;
        });
      };
    }
 
/* -----------------------------------------------------
       9) POPOLAMENTO SELECT BULK WORKERS
    ----------------------------------------------------- */
    const bulkSelect = $("bulk-worker-select");
    if (bulkSelect) {
      bulkSelect.innerHTML = "";

      const opt0 = document.createElement("option");
      opt0.value = "";
      opt0.textContent = "Riassegna selezionati a…";
      bulkSelect.appendChild(opt0);

      (allWorkersCache || []).forEach((w) => {
        const opt = document.createElement("option");
        opt.value = w.email;
        opt.textContent = `${w.email} (${w.role})`;
        bulkSelect.appendChild(opt);
      });
    }

  } catch (err) {
    console.error("ERRORE loadAdminOrders:", err);
    loadingStatus.textContent = "Errore caricamento ordini.";
    show(loadingStatus);
  }
}

/* =========================================================
   DROPDOWN ASSEGNAZIONE
========================================================= */

function createOrderAssignDropdown(order) {
  const select = document.createElement("select");
  select.className = "form-input text-[11px] max-w-[220px]";
  select.setAttribute("data-assign", "1");

  if (order.status === ORDER_STATES.COMPLETED) {
    select.disabled = true;
    select.classList.add("opacity-50", "cursor-not-allowed");
  }

  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "Riassegna a…";
  select.appendChild(opt0);

  // 👉 MOSTRA TUTTI I WORKER
  const workers = allWorkersCache || [];

  workers.forEach((w) => {
    const opt = document.createElement("option");
    opt.value = w.email;
    opt.textContent = `${w.email} (${w.role})`;
    if (order.assignedToEmail === w.email) opt.selected = true;
    select.appendChild(opt);
  });

  if (order.status !== ORDER_STATES.COMPLETED) {
    select.onchange = () => {
      if (select.value) assignOrderManually(order.objectId, select.value);
    };
  }

  return select;
}


async function assignOrderManually(orderId, newEmail) {
  if (!newEmail) {
    showToast("Assegnazione annullata.", "info");
    return;
  }

  try {
    const isAdmin = currentRole === ROLES.ADMIN;

    let order = isAdmin
      ? adminOrdersCache.find((o) => o.objectId === orderId)
      : workerOrdersCache.find((o) => o.objectId === orderId);

    if (!order) {
      order = await Backendless.Data.of(ORDER_TABLE).findById(orderId);
    }

    if (!order) {
      showToast("Ordine non trovato.", "error");
      return;
    }

    const worker = allWorkersCache.find((w) => w.email === newEmail);

    if (!worker) {
      showToast("Lavoratore non valido.", "error");
      return;
    }

    const newRole = worker.role;

    const allowedStates = ROLE_ALLOWED_STATUSES[newRole] || [];
    if (!allowedStates.includes(order.status)) {
      showToast(
        `Il ruolo "${newRole}" non può gestire lo stato "${order.status}".`,
        "error"
      );
      return;
    }

    const updateObj = {
      objectId: orderId,
      assignedToEmail: newEmail,
      assignedToRole: newRole,
      lastUpdated: String(Date.now()),
    };

    const updated = await Backendless.Data.of(ORDER_TABLE).save(updateObj);

    Object.assign(order, updated);

    showToast(`Ordine assegnato a ${newEmail}`, "success");

    if (isAdmin) {
      if (typeof loadAdminOrders === "function") loadAdminOrders();
    } else {
      if (typeof loadWorkerOrders === "function") loadWorkerOrders();
    }
  } catch (err) {
    console.error("Errore assignOrderManually:", err);
    showToast("Errore durante l'assegnazione.", "error");
  }
}

async function doBulkAssign() {
  const workerEmail = $("bulk-worker-select").value;

  if (!workerEmail) {
    showToast("Seleziona un lavoratore.", "warning");
    return;
  }

  const worker = allWorkersCache.find((w) => w.email === workerEmail);
  if (!worker) {
    showToast("Lavoratore non valido.", "error");
    return;
  }

  const selected = Array.from(
    document.querySelectorAll(".order-checkbox:checked")
  ).map((cb) => cb.dataset.objectId);

  if (selected.length === 0) {
    showToast("Nessun ordine selezionato.", "warning");
    return;
  }

  const blocked = selected.filter((id) => {
    const o = adminOrdersCache.find((x) => x.objectId === id);
    return o && o.status === ORDER_STATES.COMPLETED;
  });

  if (blocked.length > 0) {
    showToast(
      "Alcuni ordini sono completati e non possono essere riassegnati.",
      "error"
    );
    return;
  }

  if (
    !confirm(`Riassegnare ${selected.length} ordini a ${worker.email}?`)
  ) {
    return;
  }

  try {
    showToast("Assegnazione in corso...", "info");

    const updates = selected.map((id) => ({
      objectId: id,
      assignedToEmail: worker.email,
      assignedToRole: worker.role,
      lastUpdated: String(Date.now()),
    }));

    const results = await Promise.all(
      updates.map((u) => Backendless.Data.of(ORDER_TABLE).save(u))
    );

    results.forEach((saved) => {
      const idx = adminOrdersCache.findIndex(
        (o) => o.objectId === saved.objectId
      );
      if (idx >= 0) {
        adminOrdersCache[idx] = {
          ...adminOrdersCache[idx],
          ...saved,
        };
      }
    });

    await loadAdminOrders();
    showToast("Riassegnazione completata.", "success");
  } catch (err) {
    console.error("Errore bulk assign:", err);
    showToast("Errore durante l'assegnazione multipla.", "error");
  }
}

/* =========================================================
   DELETE / DOWNLOAD SELEZIONATI
========================================================= */

async function deleteSelectedOrders() {
  const selected = Array.from(
    document.querySelectorAll(".order-checkbox:checked")
  ).map((cb) => cb.dataset.objectId);

  if (selected.length === 0) {
    showToast("Nessun ordine selezionato.", "warning");
    return;
  }

  if (!confirm(`Eliminare ${selected.length} ordini? L'azione è irreversibile.`)) {
    return;
  }

  try {
    showToast("Eliminazione in corso...", "info");

    await Promise.all(
      selected.map((id) => Backendless.Data.of(ORDER_TABLE).remove(id))
    );

    adminOrdersCache = adminOrdersCache.filter(
      (o) => !selected.includes(o.objectId)
    );

    await loadAdminOrders();

    showToast("Ordini eliminati.", "success");
  } catch (err) {
    console.error("Errore eliminazione multipla:", err);
    showToast("Errore durante l'eliminazione.", "error");
  }
}

function downloadSelectedOrders() {
  const selectedIds = Array.from(
    document.querySelectorAll(".order-checkbox:checked")
  ).map((cb) => cb.dataset.objectId);

  if (selectedIds.length === 0) {
    showToast("Nessun ordine selezionato.", "warning");
    return;
  }

  const selectedOrders = adminOrdersCache.filter((o) =>
    selectedIds.includes(o.objectId)
  );

  if (selectedOrders.length === 0) {
    showToast("Nessun dato da scaricare.", "warning");
    return;
  }

  const visFields = getVisibleFieldsForAdminTable();
  const visibleFieldConfig = ORDER_FIELDS.filter((f) =>
    visFields.includes(f.key)
  );

  const csvHeader = visibleFieldConfig.map((f) => f.label);

  const csvRows = selectedOrders.map((order) => {
    return visibleFieldConfig
      .map((f) => {
        let val = order[f.key];

        if (f.type === "date-string" && val) {
          try {
            val = new Date(val).toLocaleDateString("it-IT");
          } catch {
            val = "";
          }
        }

        if (
          typeof val === "string" &&
          (val.includes(",") || val.includes(";") || val.includes("\n"))
        ) {
          val = `"${val.replace(/"/g, '""')}"`;
        }

        return val ?? "";
      })
      .join(";");
  });

  const csvContent = [csvHeader.join(";"), ...csvRows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `ordini_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Download completato.", "success");
}

/* =========================================================
   MODALE ORDINE (OPEN / CLOSE / SAVE / CHANGE STATUS)
========================================================= */

function closeOrderModal() {
  hide($("order-modal"));
  currentOrderEditing = null;
}

async function openOrderModal(objectId) {
  const isAdmin = currentRole === ROLES.ADMIN;

  // Prima cerco in cache
  let order = isAdmin
    ? adminOrdersCache.find((o) => o.objectId === objectId)
    : workerOrdersCache.find((o) => o.objectId === objectId);

  // FIX SICUREZZA: se il worker non trova l'ordine nella sua cache,
  // NON può chiederlo al DB.
  if (!order && !isAdmin) {
    showToast("Questo ordine non ti è assegnato.", "error");
    return;
  }

  // Se admin non lo trova in cache → recupero dal DB
  if (!order && isAdmin) {
    order = await Backendless.Data.of(ORDER_TABLE).findById(objectId);
  }

  if (!order) {
    showToast("Ordine non trovato.", "error");
    return;
  }

  currentOrderEditing = order;
  setText("order-modal-id", objectId);

  const container = $("order-modal-fields");
  container.innerHTML = "";

  const visibleFields = isAdmin
    ? ORDER_FIELDS.map((f) => f.key)
    : parseJsonField(currentUser.visibleFields || "[]");

  const editableFields = isAdmin
    ? ORDER_FIELDS.map((f) => f.key)
    : parseJsonField(currentUser.editableFields || "[]");

  ORDER_FIELDS.forEach((f) => {
    if (!visibleFields.includes(f.key)) return;

    let val = order[f.key];
    const canEdit = editableFields.includes(f.key) || isAdmin;

    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col gap-1";

    const label = document.createElement("label");
    label.className = "text-[11px] font-medium text-slate-600";
    label.textContent = f.label;
    wrapper.appendChild(label);

    let control;

    if (f.type === "textarea") {
      control = document.createElement("textarea");
      control.rows = 2;
      control.value = val || "";
    } else if (f.type === "date-string" && f.key !== "lastUpdated") {
      control = document.createElement("input");
      control.type = "date";

      let dateValue = "";
      if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        dateValue = val.substring(0, 10);
      } else if (typeof val === "number") {
        const d = new Date(val);
        if (!isNaN(d)) dateValue = d.toISOString().substring(0, 10);
      } else if (val instanceof Date) {
        dateValue = val.toISOString().substring(0, 10);
      }
      control.value = dateValue;

    } else if (f.key === "lastUpdated") {
      control = document.createElement("input");
      control.type = "text";
      control.disabled = true;
      const ts = Number(val);
      control.value =
        !ts || isNaN(ts)
          ? ""
          : new Date(ts).toLocaleString("it-IT");
    } else {
      control = document.createElement("input");
      control.type = "text";
      control.value = val ?? "";
    }

    if (!canEdit && f.key !== "lastUpdated") {
      control.disabled = true;
      control.classList.add("bg-slate-100", "text-slate-500");
    }

    control.id = `order-field-${f.key}`;
    control.className =
      "rounded border border-slate-300 px-2 py-1 text-[11px] bg-white";

    wrapper.appendChild(control);
    container.appendChild(wrapper);
  });

  // ADMIN: dropdown assegnazione
  if (isAdmin) {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col gap-1";

    const label = document.createElement("label");
    label.className = "text-[11px] font-medium text-slate-600";
    label.textContent = "Assegnato a";
    wrapper.appendChild(label);

    const dropdown = createOrderAssignDropdown(order);
    dropdown.dataset.assignDropdown = "1"; // necessario per il salvataggio
    wrapper.appendChild(dropdown);

    container.appendChild(wrapper);
  }

  // Bottoni stato
  const statusContainer = $("order-modal-status-buttons");
  statusContainer.innerHTML = "";

  if (order.status === ORDER_STATES.COMPLETED) {
    statusContainer.style.display = "none";
  } else {
    statusContainer.style.display = "flex";

    // FIX: non sovrascrivo le classi esistenti
    statusContainer.classList.add("flex", "flex-wrap", "gap-1", "mt-3");

    (ROLE_ALLOWED_STATUSES[currentRole] || ROLE_ALLOWED_STATUSES[ROLES.ADMIN])
      .forEach((s) => {
        const btn = document.createElement("button");
        btn.className = "btn-secondary text-[11px] px-3 py-1";
        btn.textContent = ORDER_STATE_LABELS[s] || s;
        btn.onclick = () => changeOrderStatusFromModal(s);
        statusContainer.appendChild(btn);
      });
  }

  show($("order-modal"));
}

async function saveOrderFromModal() {
  if (!currentOrderEditing) {
    showToast("Nessun ordine in modifica.", "error");
    return;
  }

  const isAdmin = currentRole === ROLES.ADMIN;
  const order = currentOrderEditing;

  const visibleFields = isAdmin
    ? ORDER_FIELDS.map((f) => f.key)
    : parseJsonField(currentUser.visibleFields || "[]");

  const editableFields = isAdmin
    ? ORDER_FIELDS.map((f) => f.key)
    : parseJsonField(currentUser.editableFields || "[]");

  const updateObj = {
    objectId: order.objectId,
    lastUpdated: String(Date.now()),
  };

  ORDER_FIELDS.forEach((f) => {
    if (!visibleFields.includes(f.key)) return;

    const canEdit = editableFields.includes(f.key) || isAdmin;
    if (!canEdit) return;
    if (f.key === "lastUpdated") return;

    const el = document.getElementById(`order-field-${f.key}`);
    if (!el) return;

    let val = el.value;

    if (f.type === "date-string" && f.key !== "lastUpdated") {
      if (val) {
        const d = new Date(val + "T00:00:00");
        if (!isNaN(d)) {
          updateObj[f.key] = d.toISOString();
        }
      } else {
        updateObj[f.key] = null;
      }
    } else {
      updateObj[f.key] = val === "" ? "" : val;
    }
  });

  try {
    const saved = await Backendless.Data.of(ORDER_TABLE).save(updateObj);

    Object.assign(order, saved);

    if (currentRole === ROLES.ADMIN) {
      const i = adminOrdersCache.findIndex(
        (o) => o.objectId === order.objectId
      );
      if (i >= 0) adminOrdersCache[i] = { ...adminOrdersCache[i], ...saved };
      await loadAdminOrders();
    } else {
      if (typeof loadWorkerOrders === "function") {
        await loadWorkerOrders();
      }
    }

    showToast("Ordine aggiornato.", "success");
    closeOrderModal();
  } catch (err) {
    console.error("Errore saveOrderFromModal", err);
    showToast("Errore durante il salvataggio.", "error");
  }
}

async function changeOrderStatusFromModal(newStatus) {
  if (!currentOrderEditing) {
    showToast("Nessun ordine selezionato.", "error");
    return;
  }

  const order = currentOrderEditing;
  const allowed = ROLE_ALLOWED_STATUSES[currentRole] || [];

  // 🔒 Controllo permessi ruolo
  if (!allowed.includes(newStatus) && currentRole !== ROLES.ADMIN) {
    showToast("Non hai i permessi per impostare questo stato.", "error");
    return;
  }

  // 🔒 FIX: impedire salti illegali di workflow
  // (Possiamo espandere questa logica insieme, per ora metto la forma sicura)
  const illegalTransitions = [
    // Magazzino non può saltare al post
    { from: ORDER_STATES.WAREHOUSE_PENDING, to: ORDER_STATES.POST_PENDING },
    { from: ORDER_STATES.WAREHOUSE_PENDING, to: ORDER_STATES.POST_DONE },
    { from: ORDER_STATES.WAREHOUSE_PENDING, to: ORDER_STATES.COMPLETED },

    // Fotografo non può chiudere ordini
    { from: ORDER_STATES.PHOTO_PENDING, to: ORDER_STATES.COMPLETED },
    { from: ORDER_STATES.PHOTO_DONE, to: ORDER_STATES.WAREHOUSE_PENDING },

    // Post non può tornare indietro
    { from: ORDER_STATES.POST_PENDING, to: ORDER_STATES.PHOTO_PENDING },
    { from: ORDER_STATES.POST_DONE, to: ORDER_STATES.PHOTO_DONE },
  ];

  const current = order.status;
  if (currentRole !== ROLES.ADMIN) {
    const illegal = illegalTransitions.some(t => t.from === current && t.to === newStatus);
    if (illegal) {
      showToast("Transizione non consentita per questo ruolo.", "error");
      return;
    }
  }

  // 🔄 Salvataggio effettivo
  try {
    const updateObj = {
      objectId: order.objectId,
      status: newStatus,
      lastUpdated: String(Date.now()),
    };

    const saved = await Backendless.Data.of(ORDER_TABLE).save(updateObj);

    Object.assign(order, saved);

    if (currentRole === ROLES.ADMIN) {
      const idx = adminOrdersCache.findIndex(
        (o) => o.objectId === order.objectId
      );
      if (idx >= 0) {
        adminOrdersCache[idx] = { ...adminOrdersCache[idx], ...saved };
      }
      await loadAdminOrders();
    } else {
      if (typeof loadWorkerOrders === "function") {
        await loadWorkerOrders();
      }
    }

    showToast("Stato aggiornato.", "success");
    closeOrderModal();
    
  } catch (err) {
    console.error("Errore cambio stato:", err);
    showToast("Errore durante il cambio stato.", "error");
  }
}

/* =========================================================
   FILTRI
========================================================= */

function applyOrdersFilters() {
  const filters = {};

  document
    .querySelectorAll("#orders-filter-row .form-input-filter")
    .forEach((input) => {
      const field = input.dataset.fieldKey;
      const value = input.value.trim().toLowerCase();

      if (value.length > 0) {
        filters[field] = value;
      }
    });

  const rows = document.querySelectorAll("#orders-table-body tr");

  rows.forEach((row) => {
    const objectId = row.dataset.objectId;
    const order = adminOrdersCache.find((o) => o.objectId === objectId);

    if (!order) {
      row.style.display = "none";
      return;
    }

    let visible = true;

    for (const key in filters) {
      const filterValue = filters[key];
      const fieldValue = (order[key] ?? "").toString().toLowerCase();

      if (!fieldValue.includes(filterValue)) {
        visible = false;
        break;
      }
    }

    row.style.display = visible ? "" : "none";
  });
}

function clearDateFilter() {
  $("filter-date-from").value = "";
  $("filter-date-to").value = "";
  loadAdminOrders();
}

function applyUsersFilter() {
  const inputs = document.querySelectorAll(
    "#users-filter-row input[data-filter]"
  );
  const filters = {};

  inputs.forEach((inp) => {
    const val = inp.value.trim().toLowerCase();
    if (val) filters[inp.dataset.filter] = val;
  });

  const rows = document.querySelectorAll("#users-table-body tr");

  rows.forEach((row) => {
    const email = row.dataset.email?.toLowerCase() || "";
    const role = row.dataset.role?.toLowerCase() || "";

    let visible = true;

    if (filters.email && !email.includes(filters.email)) visible = false;
    if (filters.role && !role.includes(filters.role)) visible = false;

    row.style.display = visible ? "" : "none";
  });
}

/* =========================================================
   WORKER – CARICAMENTO ORDINI (SE TI SERVE)
========================================================= */

// Esempio base (adatta a quello che avevi già nel file)
async function loadWorkerOrders() {
  if (!currentUser || !currentUser.email) return;

  const tableBody = $("worker-orders-body");
  const loadingStatus = $("worker-orders-loading");
  if (!tableBody || !loadingStatus) return;

  tableBody.innerHTML = "";
  show(loadingStatus);
  loadingStatus.textContent = "Caricamento…";

  try {
    const qb = Backendless.DataQueryBuilder.create()
      .setWhereClause(
        buildWhereEquals("assignedToEmail", currentUser.email)
      )
      .setPageSize(100)
      .setSortBy(["lastUpdated DESC"]);

    const orders = await Backendless.Data.of(ORDER_TABLE).find(qb);
    workerOrdersCache = orders;

    hide(loadingStatus);

    orders.forEach((o) => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-slate-50";
      tr.dataset.objectId = o.objectId;

      const tdCode = document.createElement("td");
      tdCode.className = "px-3 py-2 text-xs";
      tdCode.textContent = o.productCode || o.eanCode || "";
      tr.appendChild(tdCode);

      const tdStatus = document.createElement("td");
      tdStatus.className = "px-3 py-2 text-xs";
      const span = document.createElement("span");
      const colorClass =
        STATUS_COLORS[o.status] ||
        "bg-slate-100 text-slate-700 border-slate-200";
      span.className = `inline-block px-2 py-0.5 rounded-full text-[10px] border ${colorClass}`;
      span.textContent = ORDER_STATE_LABELS[o.status] || o.status;
      tdStatus.appendChild(span);
      tr.appendChild(tdStatus);

      const tdActions = document.createElement("td");
      tdActions.className = "px-3 py-2 text-xs";

      const btnEdit = document.createElement("button");
      btnEdit.className = "btn-secondary text-[10px]";
      btnEdit.textContent = "Apri";
      btnEdit.onclick = () => openOrderModal(o.objectId);

      tdActions.appendChild(btnEdit);
      tr.appendChild(tdActions);

      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error("Errore loadWorkerOrders:", err);
    loadingStatus.textContent = "Errore caricamento ordini.";
    show(loadingStatus);
  }
}

/* =========================================================
   BIND EVENTI UI (se non sono in HTML inline)
========================================================= */

// Se nel tuo index.html usi onclick="handleLoginClick()", ecc. puoi ignorare questa parte.
// Altrimenti aggiungi qui i listener:
//
//document.addEventListener("DOMContentLoaded", () => {
//  $("login-button")?.addEventListener("click", handleLoginClick);
 // $("order-modal-save")?.addEventListener("click", saveOrderFromModal);
 // $("order-modal-close")?.addEventListener("click", closeOrderModal);
//
// });
//document.addEventListener("DOMContentLoaded", initAutoLogin);
