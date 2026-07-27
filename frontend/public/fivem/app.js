var app = document.getElementById("app");

var state = {
  open: false,
  data: null
};

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function post(action, payload, cb) {
  if (typeof GetParentResourceName !== "function") {
    if (cb) { cb({}); }
    return;
  }

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://" + GetParentResourceName() + "/" + action, true);
  xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function() {
    var response;
    if (xhr.readyState !== 4) { return; }
    response = {};
    if (xhr.responseText && xhr.responseText !== "") {
      try { response = JSON.parse(xhr.responseText); } catch (error) { response = {}; }
    }
    if (cb) { cb(response); }
  };

  xhr.onerror = function() { if (cb) { cb({}); } };
  xhr.send(JSON.stringify(payload || {}));
}

function money(value) {
  return "$" + Number(value || 0).toLocaleString("de-DE");
}

function percent(value) {
  return String(Math.max(0, Math.floor(Number(value || 0)))) + "%";
}

function getPartyMembers() {
  if (!state.data || !state.data.party || !state.data.party.members) { return []; }
  return state.data.party.members;
}

function getRouteProgress() {
  var route = state.data && state.data.route;
  if (!route) { return 0; }
  var current = Number(route.bagsCollected || 0);
  var max = Number(route.bagGoal || 0);
  if (max <= 0) { return 0; }
  return Math.max(0, Math.min(100, Math.floor((current / max) * 100)));
}

function getRouteLabel() {
  var route = state.data && state.data.route;
  if (!route) { return "Keine aktive Tour"; }
  if (route.status === "collecting") { return "Sammelphase"; }
  if (route.status === "return") { return "Rückgabe"; }
  return "Aktive Tour";
}

function isLeader() {
  return !!(state.data && state.data.party && state.data.party.isLeader);
}

function getFlag(name) {
  return !!(state.data && state.data.flags && state.data.flags[name]);
}

/* ---------- Header ---------- */
function renderHeader() {
  var members = getPartyMembers();
  var maxParty = (state.data && state.data.maxPartySize) || 4;
  var payout = state.data && state.data.payoutPreview ? state.data.payoutPreview : 0;
  var share = state.data && state.data.myShare ? state.data.myShare : 0;

  return ""
    + '<div class="header">'
    +   '<div class="brand">'
    +     '<div class="brand-top">Sanitation Control Board</div>'
    +     '<div class="brand-title"><span class="chev">&gt;</span>LUNAR GARBAGE JOB</div>'
    +   '</div>'
    +   '<div class="header-actions">'
    +     '<div class="chip"><div class="label">Crew</div><div class="value">' + members.length + "/" + esc(maxParty) + '</div></div>'
    +     '<div class="chip"><div class="label">Payout</div><div class="value">' + esc(money(payout)) + '</div></div>'
    +     '<div class="chip"><div class="label">Anteil</div><div class="value">' + esc(percent(share)) + '</div></div>'
    +     '<button class="icon-button" data-action="refresh" data-testid="refresh-button" title="Neu laden">&#8635;</button>'
    +     '<button class="icon-button" data-action="close" data-testid="close-button" title="Schließen">&times;</button>'
    +   '</div>'
    + '</div>';
}

/* ---------- Banner ---------- */
function renderBanner() {
  var route = state.data && state.data.route;
  var actionBtn = "";
  var meta = "";
  var progress = "";
  var title;

  if (route) {
    title = route.status === "return" ? "Rückfahrt zum Hof" : "Sammelroute aktiv";
    meta = ""
      + '<span>Gebiet: <b>' + esc(route.zoneLabel || "Unbekannt") + '</b></span>'
      + '<span>Status: <b>' + esc(getRouteLabel()) + '</b></span>'
      + '<span>Säcke: <b>' + esc(String(route.bagsCollected || 0) + " / " + String(route.bagGoal || 0)) + '</b></span>';

    var pct = getRouteProgress();
    progress = ""
      + '<div class="mini-progress">'
      +   '<div class="pl"><span>Ladung</span><span>' + esc(pct) + '%</span></div>'
      +   '<div class="track"><span style="width:' + pct + '%"></span></div>'
      + '</div>';

    if (getFlag("canParkTruck")) {
      actionBtn = '<button class="btn primary" data-action="parkTruck" data-testid="banner-park-truck-button">Truck einparken</button>';
    }
  } else {
    title = "Kein aktiver Einsatz";
    meta = '<span>Stelle ein Team auf und starte anschließend eine neue Sammelroute.</span>';
    actionBtn = '<button class="btn primary" data-action="startRoute" data-testid="banner-start-route-button"' + (getFlag("canStartRoute") ? "" : " disabled") + '>Tour starten</button>';
  }

  return ""
    + '<div class="banner ' + (route ? "" : "idle") + '" data-testid="active-route-banner">'
    +   '<div class="banner-info">'
    +     '<div class="banner-title">' + esc(title) + '</div>'
    +     '<div class="banner-meta">' + meta + '</div>'
    +   '</div>'
    +   '<div class="banner-right">' + progress + actionBtn + '</div>'
    + '</div>';
}

/* ---------- Stat cards ---------- */
function statCard(label, value, tone, copy) {
  return ""
    + '<div class="stat-card">'
    +   '<div class="stat-label">' + esc(label) + '</div>'
    +   '<div class="stat-value ' + (tone || "") + '">' + esc(value) + '</div>'
    +   '<div class="stat-copy">' + esc(copy) + '</div>'
    + '</div>';
}

function renderStats() {
  var route = state.data && state.data.route;
  var members = getPartyMembers();
  var maxParty = (state.data && state.data.maxPartySize) || 4;
  var uniformOn = !!(state.data && state.data.uniform);

  return ""
    + '<div class="stats">'
    +   statCard("Status", route ? getRouteLabel() : "Bereit", route ? "tone-success" : "tone-accent", route ? "Aktuelle Tour bzw. Rückgabephase." : "Du kannst direkt eine Tour starten.")
    +   statCard("Arbeitskleidung", uniformOn ? "Angezogen" : "Privat", uniformOn ? "tone-accent" : "", "Direkt am Board umschaltbar.")
    +   statCard("Dein Anteil", percent(state.data && state.data.myShare ? state.data.myShare : 0), "tone-accent", "Anteil der Team-Auszahlung.")
    +   statCard("Crew", members.length + "/" + maxParty, "tone-accent", isLeader() ? "Du leitest das Team." : "Teammitglied.")
    + '</div>';
}

/* ---------- Quick actions ---------- */
function actionBtn(action, title, sub, opts) {
  opts = opts || {};
  return ""
    + '<button class="action-btn ' + (opts.cls || "") + '" data-action="' + action + '" data-testid="quick-' + action + '"' + (opts.disabled ? " disabled" : "") + '>'
    +   '<span class="t">' + esc(title) + '</span>'
    +   '<span class="s">' + esc(sub) + '</span>'
    + '</button>';
}

function renderQuickActions() {
  var hasParty = !!(state.data && state.data.party);
  var uniformOn = !!(state.data && state.data.uniform);
  var buttons = "";

  buttons += actionBtn("toggleUniform", uniformOn ? "Privatkleidung" : "Kleidung anziehen", "Arbeits- / Privatkleidung wechseln", { cls: uniformOn ? "primary" : "" });

  if (hasParty) {
    buttons += actionBtn("leaveParty", "Team verlassen", "Aktuelle Crew verlassen", { cls: "danger", disabled: !getFlag("canLeaveParty") });
  } else {
    buttons += actionBtn("createParty", "Team erstellen", "Neue Crew anlegen", { cls: "primary" });
  }

  buttons += actionBtn("startRoute", "Tour starten", "Nächste Sammelroute beginnen", { disabled: !getFlag("canStartRoute") });
  buttons += actionBtn("parkTruck", "Truck einparken", "Müllwagen am Hof abstellen", { disabled: !getFlag("canParkTruck") });

  return ""
    + '<div class="panel">'
    +   '<div class="kicker">Board</div>'
    +   '<div class="panel-title">Schnellzugriff</div>'
    +   '<div class="panel-copy">Alle wichtigen Aktionen für Team, Kleidung und Truck in einem Klick.</div>'
    +   '<div class="action-grid">' + buttons + '</div>'
    + '</div>';
}

/* ---------- Status panel ---------- */
function renderStatus() {
  var route = state.data && state.data.route;

  return ""
    + '<div class="panel">'
    +   '<div class="kicker">Wirtschaft</div>'
    +   '<div class="panel-title">Firmenstatus</div>'
    +   '<div class="info-list">'
    +     '<div class="info-row"><span class="k">Job</span><span class="v">' + esc((state.data && state.data.jobLabel) || "Mülljob") + '</span></div>'
    +     '<div class="info-row"><span class="k">Tourstatus</span><span class="v">' + esc(getRouteLabel()) + '</span></div>'
    +     '<div class="info-row"><span class="k">Gebiet</span><span class="v">' + esc(route && route.zoneLabel ? route.zoneLabel : "—") + '</span></div>'
    +     '<div class="info-row"><span class="k">Gesammelte Säcke</span><span class="v">' + esc(route ? String(route.bagsCollected || 0) + " / " + String(route.bagGoal || 0) : "0 / 0") + '</span></div>'
    +     '<div class="info-row"><span class="k">Truck vorhanden</span><span class="v ' + (getFlag("hasTruck") ? "tone-success" : "tone-danger") + '">' + (getFlag("hasTruck") ? "Ja" : "Nein") + '</span></div>'
    +     '<div class="info-row"><span class="k">Startberechtigung</span><span class="v ' + (getFlag("canStartRoute") ? "tone-success" : "tone-warn") + '">' + (getFlag("canStartRoute") ? "Bereit" : "Gesperrt") + '</span></div>'
    +     '<div class="info-row"><span class="k">Payout-Vorschau</span><span class="v tone-accent">' + esc(money((state.data && state.data.payoutPreview) || 0)) + '</span></div>'
    +   '</div>'
    + '</div>';
}

/* ---------- Team panel ---------- */
function memberControls(member) {
  if (member.isLeader) {
    return '<div class="input-row"><span class="badge accent">Teamleiter</span></div>';
  }

  if (!getFlag("canManageShares")) {
    return "";
  }

  return ""
    + '<div class="input-row" data-member-id="' + esc(member.id) + '">'
    +   '<input class="text-input share-input" type="number" min="0" max="100" value="' + esc(Math.floor(Number(member.share || 0))) + '" data-share-input="' + esc(member.id) + '" data-testid="share-input-' + esc(member.id) + '" />'
    +   '<button class="btn sm" data-action="setShare" data-testid="set-share-' + esc(member.id) + '">Speichern</button>'
    +   '<button class="btn sm danger" data-action="kickMember" data-testid="kick-member-' + esc(member.id) + '">Kick</button>'
    + '</div>';
}

function renderTeam() {
  var members = getPartyMembers();
  var nearby = state.data && state.data.nearbyPlayers ? state.data.nearbyPlayers : [];
  var hasParty = !!(state.data && state.data.party);
  var body = "";

  if (members.length > 0) {
    var memberHtml = "";
    for (var i = 0; i < members.length; i = i + 1) {
      var m = members[i];
      memberHtml += ""
        + '<div class="member" data-testid="member-' + esc(m.id) + '">'
        +   '<div class="member-top">'
        +     '<div>'
        +       '<div class="member-name">' + esc(m.name || "Unbekannt") + '</div>'
        +       '<div class="member-sub">ID ' + esc(m.id || 0) + (m.isLeader ? " · Teamleiter" : " · Teammitglied") + '</div>'
        +     '</div>'
        +     '<div class="member-share">' + esc(percent(m.share || 0)) + '</div>'
        +   '</div>'
        +   memberControls(m)
        + '</div>';
    }
    body += '<div class="member-list">' + memberHtml + '</div>';

    if (getFlag("canLeaveParty")) {
      body += '<div class="btn-row"><button class="btn danger" data-action="leaveParty" data-testid="leave-party-button">Team verlassen</button></div>';
    }
  } else {
    body += '<div class="empty">Du hast noch kein Team. Erstelle eine Crew und starte danach eine Tour.</div>'
      + '<div class="btn-row"><button class="btn primary" data-action="createParty" data-testid="create-party-button">Team erstellen</button></div>';
  }

  /* Invite / nearby */
  var inviteHtml = "";
  if (getFlag("canInvite")) {
    var nearbyHtml = "";
    for (var j = 0; j < nearby.length; j = j + 1) {
      var n = nearby[j];
      nearbyHtml += ""
        + '<div class="member" data-target-id="' + esc(n.id) + '" data-testid="nearby-' + esc(n.id) + '">'
        +   '<div class="member-top">'
        +     '<div>'
        +       '<div class="member-name">' + esc(n.name) + '</div>'
        +       '<div class="member-sub">ID ' + esc(n.id) + ' · ' + esc(Number(n.distance || 0).toFixed(1)) + 'm entfernt</div>'
        +     '</div>'
        +     '<button class="btn sm primary" data-action="inviteMember" data-testid="invite-' + esc(n.id) + '">Einladen</button>'
        +   '</div>'
        + '</div>';
    }

    inviteHtml = ""
      + '<div class="divider"></div>'
      + '<div class="subhead">Spieler in der Nähe</div>'
      + (nearbyHtml !== "" ? '<div class="member-list">' + nearbyHtml + '</div>' : '<div class="empty">Aktuell ist niemand im direkten Umkreis.</div>')
      + '<div class="input-row">'
      +   '<input class="text-input" id="manualInviteId" type="number" min="1" placeholder="Spieler-ID manuell eingeben" data-testid="manual-invite-input" />'
      +   '<button class="btn sm primary" data-action="manualInvite" data-testid="manual-invite-button">Einladen</button>'
      + '</div>';
  }

  return ""
    + '<div class="panel">'
    +   '<div class="kicker">Crew</div>'
    +   '<div class="panel-title">Teamverwaltung</div>'
    +   '<div class="panel-copy">Mitglieder verwalten, Anteile setzen und Spieler in der Nähe einladen.'
    +     (hasParty ? " Leader: " + (isLeader() ? "Ja" : "Nein") + "." : "") + '</div>'
    +   body
    +   inviteHtml
    + '</div>';
}

/* ---------- Invite modal ---------- */
function renderInviteModal() {
  var invite = state.data && state.data.activeInvite;
  if (!invite) {
    return '<div class="invite-modal" data-testid="invite-modal"></div>';
  }

  return ""
    + '<div class="invite-modal open" data-testid="invite-modal">'
    +   '<div class="invite-box">'
    +     '<div class="kicker">Einladung</div>'
    +     '<div class="invite-title">Crew Invite</div>'
    +     '<div class="invite-copy">' + esc((invite.leaderName || "Unbekannt") + " möchte dich ins Team holen. Nimm an, um an derselben Mülltour teilzunehmen.") + '</div>'
    +     '<div class="btn-row">'
    +       '<button class="btn primary" data-action="acceptInvite" data-leader-id="' + esc(invite.leaderId || 0) + '" data-testid="accept-invite-button">Annehmen</button>'
    +       '<button class="btn danger" data-action="declineInvite" data-leader-id="' + esc(invite.leaderId || 0) + '" data-testid="decline-invite-button">Ablehnen</button>'
    +     '</div>'
    +   '</div>'
    + '</div>';
}

/* ---------- Render ---------- */
function render() {
  if (!state.open) {
    app.className = "";
    app.innerHTML = "";
    return;
  }

  app.className = "open";

  if (!state.data) {
    app.innerHTML = '<div class="shell"><div class="body"><div class="empty">UI wartet auf Daten.</div></div></div>';
    return;
  }

  app.innerHTML = ""
    + '<div class="shell">'
    +   renderHeader()
    +   '<div class="body">'
    +     renderBanner()
    +     renderStats()
    +     '<div class="cols">'
    +       renderTeam()
    +       '<div class="side-col">' + renderQuickActions() + renderStatus() + '</div>'
    +     '</div>'
    +   '</div>'
    + '</div>'
    + renderInviteModal();
}

function setOpen(open) {
  state.open = open === true;
  render();
}

function setData(data) {
  state.data = data || null;
  render();
}

function callAndRefresh(action, payload) {
  post(action, payload || {}, function() {
    post("refresh", {}, function() {});
  });
}

function getShareValue(memberId) {
  var input = app.querySelector('[data-share-input="' + memberId + '"]');
  if (!input) { return 0; }
  return Math.floor(Number(input.value || 0));
}

function getManualInviteId() {
  var input = document.getElementById("manualInviteId");
  if (!input) { return 0; }
  return Math.floor(Number(input.value || 0));
}

document.addEventListener("click", function(event) {
  var actionEl = event.target.closest("[data-action]");
  var memberId;
  var targetId;

  if (!actionEl) { return; }

  var action = actionEl.getAttribute("data-action");

  if (action === "close") { post("close", {}, function() {}); return; }
  if (action === "refresh") { post("refresh", {}, function() {}); return; }
  if (action === "toggleUniform") { callAndRefresh("toggleUniform"); return; }
  if (action === "createParty") { callAndRefresh("createParty"); return; }
  if (action === "leaveParty") { callAndRefresh("leaveParty"); return; }
  if (action === "startRoute") { post("startRoute", {}, function() {}); return; }
  if (action === "parkTruck") { callAndRefresh("parkTruck"); return; }

  if (action === "manualInvite") {
    targetId = getManualInviteId();
    if (targetId > 0) { callAndRefresh("inviteMember", { targetId: targetId }); }
    return;
  }

  if (action === "inviteMember") {
    targetId = Math.floor(Number(actionEl.closest("[data-target-id]").getAttribute("data-target-id") || 0));
    if (targetId > 0) { callAndRefresh("inviteMember", { targetId: targetId }); }
    return;
  }

  if (action === "setShare") {
    memberId = Math.floor(Number(actionEl.closest("[data-member-id]").getAttribute("data-member-id") || 0));
    if (memberId > 0) { callAndRefresh("setShare", { memberId: memberId, share: getShareValue(memberId) }); }
    return;
  }

  if (action === "kickMember") {
    memberId = Math.floor(Number(actionEl.closest("[data-member-id]").getAttribute("data-member-id") || 0));
    if (memberId > 0) { callAndRefresh("kickMember", { memberId: memberId }); }
    return;
  }

  if (action === "acceptInvite") {
    targetId = Math.floor(Number(actionEl.getAttribute("data-leader-id") || 0));
    post("respondInvite", { leaderId: targetId, accepted: true }, function() {});
    return;
  }

  if (action === "declineInvite") {
    targetId = Math.floor(Number(actionEl.getAttribute("data-leader-id") || 0));
    post("respondInvite", { leaderId: targetId, accepted: false }, function() {});
  }
});

document.addEventListener("keyup", function(event) {
  if (event.key === "Escape") { post("close", {}, function() {}); }
});

window.addEventListener("message", function(event) {
  var payload = event.data || {};

  if (payload.action === "open") {
    setData(payload.data || null);
    setOpen(true);
    return;
  }

  if (payload.action === "update") {
    setData(payload.data || null);
    return;
  }

  if (payload.action === "close") {
    setOpen(false);
  }
});

post("uiReady", { ready: true }, function() {});

/* ---------- Dev preview (browser only) ---------- */
if (typeof GetParentResourceName !== "function") {
  state.open = true;
  state.data = {
    jobLabel: "Mülljob",
    playerName: "Max Muster",
    uniform: true,
    workClothesEnabled: true,
    maxPartySize: 4,
    myShare: 40,
    payoutPreview: 2450,
    party: {
      isLeader: true,
      leaderId: 1,
      members: [
        { id: 1, name: "Max Muster", share: 40, isLeader: true },
        { id: 7, name: "Luca Sommer", share: 35, isLeader: false },
        { id: 9, name: "Mia Keller", share: 25, isLeader: false }
      ]
    },
    route: {
      status: "collecting",
      zoneLabel: "Alta / Vespucci",
      bagsCollected: 6,
      bagGoal: 10
    },
    nearbyPlayers: [
      { id: 14, name: "Tom Berger", distance: 2.4 },
      { id: 22, name: "Nina Falk", distance: 4.8 }
    ],
    flags: {
      canInvite: true,
      canManageShares: true,
      canStartRoute: true,
      canLeaveParty: false,
      canParkTruck: false,
      hasTruck: true
    },
    activeInvite: null
  };
  render();
}
