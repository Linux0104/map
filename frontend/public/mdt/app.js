const state = {
    open: false,
    officer: null,
    map: null,
    units: [],
    myUnitId: null,
    cases: [],
    warrants: [],
    tickets: [],
    charges: [],
    officers: [],
    items: [],
    groupCases: [],
    persons: [],
    vehicles: [],
    reports: [],
    calls: [],
    selectedDispatchId: null,
    selectedPerson: null,
    selectedVehicle: null,
};

const defaultMapConfig = {
    image: './assets/map.png',
    bounds: {
        minX: -4000.0,
        maxX: 4000.0,
        minY: -4000.0,
        maxY: 8000.0,
    },
    viewport: {
        left: 0,
        top: 0,
        right: 1,
        bottom: 1,
    },
};

function nuiPost(name, data = {}) {
    return fetch(`https://${GetParentResourceName()}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(data),
    }).then((r) => r.json());
}

//#region debug-point dispatch-map-missing
let __dbg_count = 0;
function dbg(point, payload = {}) {
    if (__dbg_count >= 60) return;
    __dbg_count += 1;
    nuiPost('debugLog', { session: 'dispatch-map-missing', point, payload }).catch(() => {});
}
//#endregion debug-point dispatch-map-missing

function qs(sel) {
    return document.querySelector(sel);
}

function qsa(sel) {
    return Array.from(document.querySelectorAll(sel));
}

function fmtDate(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function worldToMapPercent(x, y, cfg) {
    const c = cfg || defaultMapConfig;
    const bounds = c.bounds || defaultMapConfig.bounds;
    const viewport = c.viewport || defaultMapConfig.viewport;

    const minX = Number(bounds.minX);
    const maxX = Number(bounds.maxX);
    const minY = Number(bounds.minY);
    const maxY = Number(bounds.maxY);

    const nx = (x - minX) / (maxX - minX);
    const ny = (y - minY) / (maxY - minY);

    const cx = Math.max(0, Math.min(1, nx));
    const cy = Math.max(0, Math.min(1, ny));

    const u = Number(viewport.left) + cx * (Number(viewport.right) - Number(viewport.left));
    const v = Number(viewport.top) + (1 - cy) * (Number(viewport.bottom) - Number(viewport.top));

    const px = Math.max(0, Math.min(1, u)) * 100;
    const py = Math.max(0, Math.min(1, v)) * 100;

    return { px, py, nx, ny, u, v, minX, maxX, minY, maxY };
}

function escapeHtml(s) {
    return String(s ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function setOpen(open) {
    state.open = open;
    qs('#app').classList.toggle('app--hidden', !open);
}

function setTab(tab) {
    qsa('.navbtn').forEach((b) => b.classList.toggle('navbtn--active', b.dataset.tab === tab));
    qsa('.tab').forEach((t) => t.classList.remove('tab--active'));
    qs(`#tab-${tab}`).classList.add('tab--active');
}

function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function avatarHtml(photoUrl, name, cls = '') {
    if (photoUrl) {
        return `<img class="avatar ${cls}" src="${escapeHtml(photoUrl)}" alt="" onerror="this.outerHTML='<div class=\\'avatar avatar--fallback ${cls}\\'>${escapeHtml(initials(name))}</div>'" />`;
    }
    return `<div class="avatar avatar--fallback ${cls}">${escapeHtml(initials(name))}</div>`;
}

const TAB_ICONS = {
    persons: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
    vehicles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2l.64-2.54a6 6 0 0 0-.44-3.9l-.82-1.64A2 2 0 0 0 18.6 8H5.4a2 2 0 0 0-1.78 1.1l-.82 1.63a6 6 0 0 0-.44 3.9L3 17h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
    cases: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
    warrants: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>',
    dispatch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
    reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/></svg>',
    tickets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/></svg>',
    officers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z"/></svg>',
    groups: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/></svg>',
    charges: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
};

function setHeaderBadges() {
    const o = state.officer || {};
    const bo = qs('#badgeOfficer');
    const br = qs('#badgeRank');
    const bu = qs('#badgeUnit');
    if (bo) bo.textContent = o.name || '—';
    if (br) br.textContent = o.grade_label || (o.grade !== undefined ? `Grade ${o.grade}` : '—');
    const my = state.myUnitId ? (state.units || []).find((u) => u.id === state.myUnitId) : null;
    if (bu) bu.textContent = my ? (my.callsign || `#${my.id}`) : 'Keine';
}

function renderDashboard() {
    const el = qs('#dashboardRoot');
    if (!el) return;

    const openCases = (state.cases || []).filter((c) => (c.status || 'offen') !== 'geschlossen').length;
    const activeWarrants = (state.warrants || []).filter((w) => (w.status || 'aktiv') !== 'erledigt').length;
    const unitsOn = (state.units || []).length;
    const openCalls = (state.calls || []).filter((c) => (c.status || 'offen') !== 'geschlossen').length;

    const highWarrant = (state.warrants || []).find((w) => (w.priority === 'high') && (w.status || 'aktiv') !== 'erledigt');
    const latestCall = (state.calls || []).find((c) => (c.status || 'offen') !== 'geschlossen');

    let banner = '';
    if (highWarrant) {
        banner = `<div class="alert-banner">
            <div>
                <div class="alert-banner__title">Priorität HOCH · Fahndung #${escapeHtml(highWarrant.id)} — ${escapeHtml(highWarrant.title || '')}</div>
                <div class="alert-banner__meta">${escapeHtml([highWarrant.person_name, highWarrant.vehicle_plate].filter(Boolean).join(' · ') || 'Aktive Fahndung')}</div>
            </div>
            <button class="btn btn--danger" data-goto="warrants">Anzeigen</button>
        </div>`;
    } else if (latestCall) {
        banner = `<div class="alert-banner">
            <div>
                <div class="alert-banner__title">Offener Notruf · Call #${escapeHtml(latestCall.id)}</div>
                <div class="alert-banner__meta">${escapeHtml(latestCall.message || '')}</div>
            </div>
            <button class="btn btn--danger" data-goto="dispatch">Zum Dispatch</button>
        </div>`;
    }

    const stat = (k, v, ic, d) => `<div class="stat-card">
        <div class="stat-card__ic">${ic}</div>
        <div class="stat-card__k">${k}</div>
        <div class="stat-card__v">${v}</div>
        <div class="stat-card__d">${d}</div>
    </div>`;

    const quick = (tab, label) => `<div class="quick-item" data-goto="${tab}">${TAB_ICONS[tab] || ''}<div class="quick-item__label">${label}</div></div>`;

    const officerName = state.officer?.name || 'Officer';
    const totalPersons = (state.persons || []).length;

    el.innerHTML = `
        <div class="section-eyebrow">Streifendienst · Live</div>
        <h1 class="section-title">Willkommen zurück, ${escapeHtml(officerName)}</h1>
        <p class="section-sub">Aktueller Terminal-Status und Schnellzugriff auf alle Bereiche.</p>

        ${banner}

        <div class="stat-grid">
            ${stat('Offene Fälle', openCases, TAB_ICONS.cases, 'Laufende Ermittlungen im Zugriff.')}
            ${stat('Aktive Fahndungen', activeWarrants, TAB_ICONS.warrants, 'Gesuchte Personen & Fahrzeuge.')}
            ${stat('Streifen im Dienst', unitsOn, TAB_ICONS.officers, 'Aktuell aktive Einheiten.')}
            ${stat('Offene Calls', openCalls, TAB_ICONS.dispatch, 'Unbearbeitete Notrufe im Dispatch.')}
        </div>

        <div class="dash-cols">
            <div class="dash-block">
                <div class="section-eyebrow">Navigation</div>
                <h2 class="section-title" style="font-size:20px;">Schnellzugriff</h2>
                <p class="section-sub">Spring direkt in die wichtigsten Bereiche.</p>
                <div class="quick-grid">
                    ${quick('persons', 'Personen')}
                    ${quick('vehicles', 'Fahrzeuge')}
                    ${quick('cases', 'Fälle')}
                    ${quick('warrants', 'Fahndung')}
                    ${quick('dispatch', 'Dispatch')}
                    ${quick('reports', 'Berichte')}
                </div>
            </div>
            <div class="dash-block">
                <div class="section-eyebrow">Lagebild</div>
                <h2 class="section-title" style="font-size:20px;">Departement-Status</h2>
                <p class="section-sub">Aktuelle Kennzahlen deiner Schicht.</p>
                <div class="status-row"><div class="status-row__k">Erfasste Personen</div><div class="status-row__v">${totalPersons}</div></div>
                <div class="status-row"><div class="status-row__k">Offene Tickets</div><div class="status-row__v">${(state.tickets || []).length}</div></div>
                <div class="status-row"><div class="status-row__k">Gruppenakten</div><div class="status-row__v">${(state.groupCases || []).length}</div></div>
                <div class="status-row"><div class="status-row__k">Berichte gesamt</div><div class="status-row__v">${(state.reports || []).length}</div></div>
                <div class="status-row"><div class="status-row__k">Strafen-Katalog</div><div class="status-row__v">${(state.charges || []).length} Einträge</div></div>
                <div class="status-row"><div class="status-row__k">Deine Streife</div><div class="status-row__v">${escapeHtml((state.myUnitId ? ((state.units||[]).find(u=>u.id===state.myUnitId)?.callsign) : null) || 'Nicht im Dienst')}</div></div>
            </div>
        </div>
    `;

    qsa('#dashboardRoot [data-goto]').forEach((btn) => {
        btn.addEventListener('click', () => setTab(btn.dataset.goto));
    });
}


function renderPersons() {
    const el = qs('#personResults');
    if (!state.persons.length) {
        el.innerHTML = `<div class="muted">Keine Treffer.</div>`;
        return;
    }

    el.innerHTML = state.persons
        .map((p) => {
            const name = `${p.firstname || ''} ${p.lastname || ''}`.trim() || p.ssn || 'Unbekannt';
            const meta = [
                p.ssn ? `SSN: ${p.ssn}` : null,
                p.dateofbirth ? `DOB: ${p.dateofbirth}` : null,
                p.phone_number ? `Tel: ${p.phone_number}` : null,
            ]
                .filter(Boolean)
                .join(' · ');
            return `<div class="row" data-identifier="${escapeHtml(p.identifier)}">
                ${avatarHtml(p.photo_url, name)}
                <div>
                    <div class="row__title">${escapeHtml(name)}</div>
                    <div class="row__meta">${escapeHtml(meta)}</div>
                </div>
            </div>`;
        })
        .join('');

    qsa('#personResults .row').forEach((row) => {
        row.addEventListener('click', async () => {
            const identifier = row.dataset.identifier;
            await loadPerson(identifier);
        });
    });
}

function renderPersonDetails() {
    const el = qs('#personDetails');
    if (!state.selectedPerson) {
        el.innerHTML = `<div class="muted">Wähle eine Person aus.</div>`;
        return;
    }

    const p = state.selectedPerson.person;
    const name = `${p.firstname || ''} ${p.lastname || ''}`.trim() || p.ssn || 'Unbekannt';
    const photoUrl = p.photo_url || '';
    const pills = [];
    if (p.ssn) pills.push(`<span class="pill pill--primary">SSN: ${escapeHtml(p.ssn)}</span>`);
    if (p.phone_number) pills.push(`<span class="pill">Tel: ${escapeHtml(p.phone_number)}</span>`);

    const notesHtml =
        state.selectedPerson.notes && state.selectedPerson.notes.length
            ? state.selectedPerson.notes
                  .map(
                      (n) => `<div class="row" style="cursor: default;">
                        <div class="row__title">${escapeHtml(n.created_by_name || 'Officer')}</div>
                        <div class="row__meta">${escapeHtml(fmtDate(n.created_at))}</div>
                        <div style="margin-top:8px; white-space: pre-wrap;">${escapeHtml(n.note)}</div>
                      </div>`
                  )
                  .join('')
            : `<div class="muted">Keine Notizen.</div>`;

    const reportsHtml =
        state.selectedPerson.reports && state.selectedPerson.reports.length
            ? state.selectedPerson.reports
                  .map(
                      (r) => `<div class="row" style="cursor: default;">
                        <div class="row__title">${escapeHtml(r.title || 'Bericht')}</div>
                        <div class="row__meta">${escapeHtml(fmtDate(r.created_at))} · ${escapeHtml(r.created_by_name || '')}</div>
                        <div class="row__meta">Geld: ${escapeHtml(r.fine ?? 0)} · Haft: ${escapeHtml(r.jail ?? 0)}</div>
                      </div>`
                  )
                  .join('')
            : `<div class="muted">Keine Berichte.</div>`;

    const photoHtml = photoUrl
        ? `<img src="${escapeHtml(photoUrl)}" style="width:100%; height:100%; object-fit:cover;" />`
        : `<div class="muted" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">Kein Foto</div>`;

    el.innerHTML = `
        <div style="display:flex; gap:12px; align-items:flex-start; margin-bottom: 10px;">
            <div style="width:96px; height:96px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); overflow:hidden; background: rgba(0,0,0,0.25); flex: 0 0 auto;">
                ${photoHtml}
            </div>
            <div style="flex:1; min-width:0;">
                <div style="font-size: 18px; font-weight: 800;">${escapeHtml(name)}</div>
                <div style="margin-top: 8px; display:flex; gap:8px; flex-wrap:wrap;">${pills.join('')}</div>
                <div style="margin-top: 10px; display:flex; gap:10px; flex-wrap:wrap;">
                    <button id="personPhotoSet" class="btn">Foto setzen</button>
                    <button id="personPhotoClear" class="btn btn--danger">Foto löschen</button>
                </div>
            </div>
        </div>

        <div class="kv">
            <div class="kv__k">Geburtsdatum</div><div>${escapeHtml(p.dateofbirth || '')}</div>
            <div class="kv__k">Geschlecht</div><div>${escapeHtml(p.sex || '')}</div>
            <div class="kv__k">Größe</div><div>${escapeHtml(p.height || '')}</div>
        </div>

        <div style="display:flex; gap:10px; margin-bottom:12px; flex-wrap: wrap;">
            <button id="newCaseForPerson" class="btn btn--primary">Fall erstellen</button>
            <button id="newWarrantForPerson" class="btn">Fahndung</button>
            <button id="newTicketForPerson" class="btn">Ticket</button>
            <button id="newReportForPerson" class="btn">Bericht</button>
        </div>

        <div style="display:grid; grid-template-columns: 1fr; gap: 14px;">
            <div>
                <div style="font-weight: 700; margin-bottom: 8px;">Notizen</div>
                <div class="field">
                    <div class="field__label">Neue Notiz</div>
                    <textarea id="personNoteText" class="textarea" placeholder="Text..."></textarea>
                </div>
                <button id="personNoteSave" class="btn">Notiz speichern</button>
                <div style="margin-top: 10px;">${notesHtml}</div>
            </div>
            <div>
                <div style="font-weight: 700; margin-bottom: 8px;">Berichte</div>
                <div>${reportsHtml}</div>
            </div>
        </div>
    `;

    qs('#personNoteSave').addEventListener('click', async () => {
        const note = qs('#personNoteText').value.trim();
        if (!note) return;
        await nuiPost('addPersonNote', { identifier: p.identifier, note });
        await loadPerson(p.identifier);
    });

    qs('#newReportForPerson').addEventListener('click', () => {
        openReportModal({ subject_identifier: p.identifier });
    });

    qs('#newCaseForPerson').addEventListener('click', () => {
        openCaseModal({ person_identifier: p.identifier, person_name: name });
    });

    qs('#newWarrantForPerson').addEventListener('click', () => {
        openWarrantModal({ type: 'person', person_identifier: p.identifier, person_name: name });
    });

    qs('#newTicketForPerson').addEventListener('click', () => {
        openTicketModal({ person_identifier: p.identifier, person_name: name });
    });

    qs('#personPhotoSet').addEventListener('click', () => {
        openModal(
            'Foto setzen',
            `
            <div class="field">
                <div class="field__label">Bild-URL</div>
                <input id="photoUrl" class="input" placeholder="https://..." value="${escapeHtml(photoUrl)}" />
            </div>
            <div class="muted" style="margin-bottom: 12px;">Tipp: Discord CDN / Imgur Link geht am besten.</div>
            <div style="display:flex; gap:10px; justify-content:flex-end;">
                <button id="photoSave" class="btn btn--primary">Speichern</button>
            </div>
            `
        );

        qs('#photoSave').addEventListener('click', async () => {
            const url = qs('#photoUrl').value.trim();
            const res = await nuiPost('setPersonPhoto', { identifier: p.identifier, url });
            if (res && res.success) {
                closeModal();
                await loadPerson(p.identifier);
            }
        });
    });

    qs('#personPhotoClear').addEventListener('click', async () => {
        const res = await nuiPost('setPersonPhoto', { identifier: p.identifier, url: '' });
        if (res && res.success) {
            await loadPerson(p.identifier);
        }
    });
}

async function loadPerson(identifier) {
    const res = await nuiPost('getPerson', { identifier });
    if (!res || !res.success) return;
    state.selectedPerson = res.payload;
    renderPersonDetails();
}

function renderVehicles() {
    const el = qs('#vehicleResults');
    if (!state.vehicles.length) {
        el.innerHTML = `<div class="muted">Keine Treffer.</div>`;
        return;
    }

    el.innerHTML = state.vehicles
        .map((v) => {
            const ownerName = `${v.firstname || ''} ${v.lastname || ''}`.trim();
            const meta = [
                ownerName ? `Halter: ${ownerName}` : null,
                v.flag ? `Flag: ${v.flag}` : null,
            ]
                .filter(Boolean)
                .join(' · ');
            return `<div class="row" data-plate="${escapeHtml(v.plate)}">
                <div class="row__title">${escapeHtml(v.plate)}</div>
                <div class="row__meta">${escapeHtml(meta)}</div>
            </div>`;
        })
        .join('');

    qsa('#vehicleResults .row').forEach((row) => {
        row.addEventListener('click', async () => {
            const plate = row.dataset.plate;
            await loadVehicle(plate);
        });
    });
}

function renderVehicleDetails() {
    const el = qs('#vehicleDetails');
    if (!state.selectedVehicle) {
        el.innerHTML = `<div class="muted">Wähle ein Fahrzeug aus.</div>`;
        return;
    }

    const v = state.selectedVehicle.vehicle;
    const ownerName = `${v.firstname || ''} ${v.lastname || ''}`.trim();
    const flag = v.flag || '';
    const note = v.note || '';

    el.innerHTML = `
        <div style="font-size: 18px; font-weight: 800; margin-bottom: 10px;">${escapeHtml(v.plate)}</div>
        <div class="kv">
            <div class="kv__k">Halter</div><div>${escapeHtml(ownerName || v.owner || '')}</div>
            <div class="kv__k">Flag</div><div>${escapeHtml(flag || '—')}</div>
        </div>

        <div style="display:flex; gap:10px; margin-bottom:12px; flex-wrap: wrap;">
            <button id="newCaseForVehicle" class="btn btn--primary">Fall erstellen</button>
            <button id="newWarrantForVehicle" class="btn">Fahndung</button>
            <button id="newTicketForVehicle" class="btn">Ticket</button>
        </div>

        <div class="field">
            <div class="field__label">Flag setzen</div>
            <div class="field__row">
                <select id="vehicleFlag" class="input" style="width:220px;">
                    <option value="">Kein</option>
                    <option value="gestohlen">Gestohlen</option>
                    <option value="gesucht">Gesucht</option>
                </select>
                <input id="vehicleFlagNote" class="input" placeholder="Notiz (optional)..." />
                <button id="vehicleFlagSave" class="btn">Speichern</button>
            </div>
        </div>
        <div class="muted" style="margin-top: 10px;">Mods-Daten sind serverseitig geladen (für späteres Detail-UI).</div>
    `;

    qs('#vehicleFlag').value = flag;
    qs('#vehicleFlagNote').value = note;

    qs('#vehicleFlagSave').addEventListener('click', async () => {
        const newFlag = qs('#vehicleFlag').value;
        const newNote = qs('#vehicleFlagNote').value.trim();
        await nuiPost('setVehicleFlag', { plate: v.plate, flag: newFlag, note: newNote });
        await loadVehicle(v.plate);
    });

    qs('#newCaseForVehicle').addEventListener('click', () => {
        openCaseModal({ vehicle_plate: v.plate });
    });

    qs('#newWarrantForVehicle').addEventListener('click', () => {
        openWarrantModal({ type: 'vehicle', vehicle_plate: v.plate });
    });

    qs('#newTicketForVehicle').addEventListener('click', () => {
        openTicketModal({ vehicle_plate: v.plate });
    });
}

async function loadVehicle(plate) {
    const res = await nuiPost('getVehicle', { plate });
    if (!res || !res.success) return;
    state.selectedVehicle = res.payload;
    renderVehicleDetails();
}

function renderReports() {
    const el = qs('#reportResults');
    if (!state.reports.length) {
        el.innerHTML = `<div class="muted">Keine Berichte.</div>`;
        return;
    }

    el.innerHTML = state.reports
        .map((r) => {
            const meta = [
                r.subject_name ? `Betreff: ${r.subject_name}` : null,
                `Geld: ${r.fine ?? 0}`,
                `Haft: ${r.jail ?? 0}`,
                r.created_by_name ? `Von: ${r.created_by_name}` : null,
                r.created_at ? fmtDate(r.created_at) : null,
            ]
                .filter(Boolean)
                .join(' · ');
            return `<div class="row" style="cursor: default;">
                <div class="row__title">${escapeHtml(r.title || 'Bericht')}</div>
                <div class="row__meta">${escapeHtml(meta)}</div>
            </div>`;
        })
        .join('');
}

async function refreshReports() {
    const res = await nuiPost('listReports', {});
    if (!res || !res.success) return;
    state.reports = res.payload.reports || [];
    renderReports();
}

function renderCases() {
    const el = qs('#caseResults');
    if (!el) return;
    if (!state.cases.length) {
        el.innerHTML = `<div class="muted">Keine Fälle.</div>`;
        return;
    }

    el.innerHTML = state.cases
        .map((c) => {
            const meta = [
                c.status ? `Status: ${c.status}` : null,
                c.security ? `Sicht: ${c.security}` : null,
                c.person_name ? `Person: ${c.person_name}` : null,
                c.vehicle_plate ? `Fzg: ${c.vehicle_plate}` : null,
                `Geld: ${c.fine_total ?? 0}`,
                `Haft: ${c.jail_total ?? 0}`,
                c.created_by_name ? `Von: ${c.created_by_name}` : null,
                c.created_at ? fmtDate(c.created_at) : null,
            ]
                .filter(Boolean)
                .join(' · ');
            return `<div class="row" data-case="1" data-id="${c.id}">
                <div class="row__title">#${c.id} · ${escapeHtml(c.title || 'Fall')}</div>
                <div class="row__meta">${escapeHtml(meta)}</div>
            </div>`;
        })
        .join('');

    qsa('#caseResults .row[data-case]').forEach((row) => {
        row.addEventListener('click', async () => {
            const id = Number(row.dataset.id);
            if (!Number.isFinite(id) || id <= 0) return;
            await openCaseDetailsModal(id);
        });
    });
}

async function refreshCases() {
    const res = await nuiPost('listCases', {});
    if (!res || !res.success) return;
    state.cases = res.payload.cases || [];
    renderCases();
}

function renderWarrants() {
    const el = qs('#warrantResults');
    if (!el) return;
    if (!state.warrants.length) {
        el.innerHTML = `<div class="muted">Keine Fahndungen.</div>`;
        return;
    }

    el.innerHTML = state.warrants
        .map((w) => {
            const meta = [
                w.status ? `Status: ${w.status}` : null,
                w.priority ? `Prio: ${w.priority}` : null,
                w.type === 'vehicle' && w.vehicle_plate ? `Fzg: ${w.vehicle_plate}` : null,
                w.type === 'person' && w.person_name ? `Person: ${w.person_name}` : null,
                w.created_by_name ? `Von: ${w.created_by_name}` : null,
                w.created_at ? fmtDate(w.created_at) : null,
            ]
                .filter(Boolean)
                .join(' · ');

            const buttons = `
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="btn btn--primary" data-wstatus="active" data-id="${w.id}">Aktiv</button>
                    <button class="btn btn--danger" data-wstatus="closed" data-id="${w.id}">Erledigt</button>
                </div>`;

            return `<div class="row" style="cursor: default;">
                <div class="row__title">#${w.id} · ${escapeHtml(w.title || 'Fahndung')}</div>
                <div class="row__meta">${escapeHtml(meta)}</div>
                ${buttons}
            </div>`;
        })
        .join('');

    qsa('#warrantResults button[data-wstatus]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.id);
            const status = btn.dataset.wstatus;
            await nuiPost('setWarrantStatus', { id, status });
            await refreshWarrants();
        });
    });
}

async function refreshWarrants() {
    const res = await nuiPost('listWarrants', {});
    if (!res || !res.success) return;
    state.warrants = res.payload.warrants || [];
    renderWarrants();
}

function renderTickets() {
    const el = qs('#ticketResults');
    if (!el) return;
    if (!state.tickets.length) {
        el.innerHTML = `<div class="muted">Keine Tickets.</div>`;
        return;
    }

    el.innerHTML = state.tickets
        .map((t) => {
            const meta = [
                t.status ? `Status: ${t.status}` : null,
                t.person_name ? `Person: ${t.person_name}` : null,
                t.vehicle_plate ? `Fzg: ${t.vehicle_plate}` : null,
                `Geld: ${t.amount ?? 0}`,
                `Haft: ${t.jail ?? 0}`,
                t.created_by_name ? `Von: ${t.created_by_name}` : null,
                t.created_at ? fmtDate(t.created_at) : null,
            ]
                .filter(Boolean)
                .join(' · ');
            return `<div class="row" style="cursor: default;">
                <div class="row__title">#${t.id} · ${escapeHtml((t.reason || '').slice(0, 60) || 'Ticket')}</div>
                <div class="row__meta">${escapeHtml(meta)}</div>
            </div>`;
        })
        .join('');
}

async function refreshTickets() {
    const res = await nuiPost('listTickets', {});
    if (!res || !res.success) return;
    state.tickets = res.payload.tickets || [];
    renderTickets();
}

function renderCharges() {
    const el = qs('#chargeResults');
    if (!el) return;
    if (!state.charges.length) {
        el.innerHTML = `<div class="muted">Keine Einträge im Katalog.</div>`;
        return;
    }

    el.innerHTML = state.charges
        .map((c) => {
            const meta = [
                c.category ? `Kategorie: ${c.category}` : null,
                c.paragraph ? c.paragraph : null,
                `Geld: ${c.fine ?? 0}`,
                `Haft: ${c.jail ?? 0}`,
            ]
                .filter(Boolean)
                .join(' · ');
            return `<div class="row" style="cursor: default;">
                <div class="row__title">${escapeHtml(c.label || '')}</div>
                <div class="row__meta">${escapeHtml(meta)}</div>
            </div>`;
        })
        .join('');
}

async function refreshCharges() {
    const res = await nuiPost('listCharges', {});
    if (!res || !res.success) return;
    state.charges = res.payload.charges || [];
    renderCharges();
}

function renderOfficers() {
    const el = qs('#officerResults');
    if (!el) return;
    if (!state.officers.length) {
        el.innerHTML = `<div class="muted">Keine Officers online.</div>`;
        return;
    }

    el.innerHTML = state.officers
        .map((o) => {
            const meta = [
                o.grade_label ? `Rang: ${o.grade_label}` : o.grade !== undefined ? `Rang: ${o.grade}` : null,
                o.unit_id ? `Streife: #${o.unit_id}` : null,
            ]
                .filter(Boolean)
                .join(' · ');
            return `<div class="row" style="cursor: default;">
                ${avatarHtml(o.photo_url, o.name)}
                <div>
                    <div class="row__title">${escapeHtml(o.name || '')}</div>
                    <div class="row__meta">${escapeHtml(meta)}</div>
                </div>
            </div>`;
        })
        .join('');
}

async function refreshOfficers() {
    const res = await nuiPost('listOfficers', {});
    if (!res || !res.success) return;
    state.officers = res.payload.officers || [];
    renderOfficers();
}

async function refreshItems() {
    const res = await nuiPost('listItems', {});
    if (!res || !res.success) return;
    state.items = res.payload.items || [];
}

function renderGroupCases() {
    const el = qs('#groupResults');
    if (!el) return;
    if (!state.groupCases.length) {
        el.innerHTML = `<div class="muted">Keine Gruppenakten.</div>`;
        return;
    }

    el.innerHTML = state.groupCases
        .map((g) => {
            const meta = [g.faction ? `Fraktion: ${g.faction}` : null, g.created_by_name ? `Von: ${g.created_by_name}` : null, g.created_at ? fmtDate(g.created_at) : null]
                .filter(Boolean)
                .join(' · ');
            return `<div class="row" data-group="1" data-id="${g.id}">
                <div class="row__title">#${g.id} · ${escapeHtml(g.title || 'Gruppenakte')}</div>
                <div class="row__meta">${escapeHtml(meta)}</div>
            </div>`;
        })
        .join('');

    qsa('#groupResults .row[data-group]').forEach((row) => {
        row.addEventListener('click', async () => {
            const id = Number(row.dataset.id);
            if (!Number.isFinite(id) || id <= 0) return;
            await openGroupCaseDetailsModal(id);
        });
    });
}

async function refreshGroupCases() {
    const res = await nuiPost('listGroupCases', {});
    if (!res || !res.success) return;
    state.groupCases = res.payload.group_cases || [];
    renderGroupCases();
}

function renderDispatch() {
    const el = qs('#dispatchResults');
    if (!state.calls.length) {
        el.innerHTML = `<div class="muted">Keine Calls.</div>`;
        const mapEl = qs('#dispatchMap');
        if (mapEl) {
            mapEl.style.backgroundImage = '';
            mapEl.innerHTML = `<div class="muted" style="padding:12px;">Keine Calls.</div>`;
        }
        const infoEl = qs('#dispatchInfo');
        if (infoEl) infoEl.innerHTML = '';
        return;
    }

//#region debug-point dispatch-map-missing
    {
        const c0 = state.calls[0];
        if (c0) {
            dbg('renderDispatch:first', {
                id: c0.id,
                x: c0.x,
                y: c0.y,
                xType: typeof c0.x,
                yType: typeof c0.y,
                hasCoords: c0.x !== null && c0.x !== undefined && c0.y !== null && c0.y !== undefined,
                mapImage: (state.map || defaultMapConfig).image,
                viewport: (state.map || defaultMapConfig).viewport || null,
                selectedDispatchId: state.selectedDispatchId,
            });
        }
    }
//#endregion debug-point dispatch-map-missing

    const cfg = state.map || defaultMapConfig;
    const imgSrc = cfg.image || defaultMapConfig.image;
    const mapEl = qs('#dispatchMap');
    const infoEl = qs('#dispatchInfo');

    const callsWithCoords = state.calls.filter((c) => Number.isFinite(Number(c.x)) && Number.isFinite(Number(c.y)));
    let selected =
        state.calls.find((c) => Number(c.id) === Number(state.selectedDispatchId)) ||
        callsWithCoords[0] ||
        state.calls[0] ||
        null;

    if (selected && selected.id) {
        state.selectedDispatchId = selected.id;
    }

    if (mapEl) {
        mapEl.style.backgroundImage = `url('${escapeHtml(imgSrc)}')`;
        if (!callsWithCoords.length) {
            mapEl.innerHTML = `<div class="muted" style="padding:12px;">Keine Calls mit Koordinaten.</div>`;
        } else {
            mapEl.innerHTML = callsWithCoords
                .map((c) => {
                    const x = Number(c.x);
                    const y = Number(c.y);
                    const p = worldToMapPercent(x, y, cfg);
                    const selectedAttr = Number(c.id) === Number(state.selectedDispatchId) ? '1' : '0';
                    return `<button class="dispatch-map__marker dispatch-map__marker-btn" data-dmid="1" data-id="${escapeHtml(c.id)}" data-selected="${selectedAttr}" style="left:${p.px}%; top:${p.py}%;"></button>`;
                })
                .join('');

            qsa('#dispatchMap button[data-dmid]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const id = Number(btn.dataset.id);
                    if (!Number.isFinite(id) || id <= 0) return;
                    state.selectedDispatchId = id;
                    renderDispatch();
                });
            });
        }
    }

    if (infoEl) {
        if (!selected) {
            infoEl.innerHTML = '';
        } else {
            const hasCoords = Number.isFinite(Number(selected.x)) && Number.isFinite(Number(selected.y));
            const meta = [
                selected.sender ? `Von: ${selected.sender}` : null,
                selected.status ? `Status: ${selected.status}` : null,
                selected.taken_by_name ? `Unit: ${selected.taken_by_name}` : null,
                selected.created_at ? fmtDate(selected.created_at) : null,
            ]
                .filter(Boolean)
                .join(' · ');

            infoEl.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:12px;">
                    <div style="min-width:0;">
                        <div style="font-weight:800;">Call #${escapeHtml(selected.id)} · ${escapeHtml(selected.message || '')}</div>
                        <div class="muted" style="margin-top:6px;">${escapeHtml(meta)}</div>
                        ${hasCoords ? `<div class="muted" style="margin-top:6px;">X: ${escapeHtml(selected.x)} · Y: ${escapeHtml(selected.y)}</div>` : ''}
                    </div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
                        ${hasCoords ? `<button id="dispatchInfoRoute" class="btn">Route</button>` : ''}
                        ${state.myUnitId ? `<button id="dispatchInfoAccept" class="btn btn--primary">Annehmen</button>` : ''}
                        <button class="btn" data-dispatch-status="offen">Offen</button>
                        <button class="btn btn--primary" data-dispatch-status="in_bearbeitung">In Bearbeitung</button>
                        <button class="btn btn--danger" data-dispatch-status="geschlossen">Geschlossen</button>
                    </div>
                </div>
            `;

            const routeBtn = qs('#dispatchInfoRoute');
            if (routeBtn) {
                routeBtn.addEventListener('click', async () => {
                    await nuiPost('setWaypoint', { x: Number(selected.x), y: Number(selected.y) });
                });
            }

            const acceptBtn = qs('#dispatchInfoAccept');
            if (acceptBtn) {
                acceptBtn.addEventListener('click', async () => {
                    const res = await nuiPost('acceptDispatch', { id: Number(selected.id) });
                    if (res && res.success) {
                        await refreshDispatch();
                        await refreshUnits();
                    }
                });
            }

            qsa('#dispatchInfo button[data-dispatch-status]').forEach((btn) => {
                btn.addEventListener('click', async () => {
                    const status = btn.dataset.dispatchStatus;
                    await nuiPost('setDispatchStatus', { id: Number(selected.id), status });
                    await refreshDispatch();
                });
            });
        }
    }

    el.innerHTML = state.calls
        .map((c) => {
            const hasCoords = (c.x !== null && c.x !== undefined && c.y !== null && c.y !== undefined);
            const meta = [
                c.sender ? `Von: ${c.sender}` : null,
                c.status ? `Status: ${c.status}` : null,
                c.taken_by_name ? `Unit: ${c.taken_by_name}` : null,
                c.created_at ? fmtDate(c.created_at) : null,
            ]
                .filter(Boolean)
                .join(' · ');
            const buttons = `
                <div style="display:flex; gap:10px; margin-top:10px;">
                    ${hasCoords ? `<button class="btn" data-waypoint="1" data-x="${c.x}" data-y="${c.y}">Route</button>` : ''}
                    ${state.myUnitId ? `<button class="btn btn--primary" data-accept="1" data-id="${c.id}">Annehmen</button>` : ''}
                    <button class="btn" data-action="offen" data-id="${c.id}">Offen</button>
                    <button class="btn btn--primary" data-action="in_bearbeitung" data-id="${c.id}">In Bearbeitung</button>
                    <button class="btn btn--danger" data-action="geschlossen" data-id="${c.id}">Geschlossen</button>
                </div>`;
            const rowSelected = Number(c.id) === Number(state.selectedDispatchId);
            return `<div class="row" data-dispatch-row="1" data-id="${c.id}" style="cursor: pointer; border-color: ${rowSelected ? 'rgba(80,160,255,0.5)' : 'rgba(255,255,255,0.08)'};">
                <div class="row__title">#${c.id} · ${escapeHtml(c.message || '')}</div>
                <div class="row__meta">${escapeHtml(meta)}</div>
                ${buttons}
            </div>`;
        })
        .join('');

    qsa('#dispatchResults .row[data-dispatch-row]').forEach((row) => {
        row.addEventListener('click', (e) => {
            const t = e.target;
            if (t && (t.tagName === 'BUTTON' || t.closest('button'))) return;
            const id = Number(row.dataset.id);
            if (!Number.isFinite(id) || id <= 0) return;
            state.selectedDispatchId = id;
            renderDispatch();
        });
    });

    qsa('#dispatchResults button[data-waypoint]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const x = Number(btn.dataset.x);
            const y = Number(btn.dataset.y);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;
            await nuiPost('setWaypoint', { x, y });
        });
    });

    qsa('#dispatchResults button[data-accept]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.id);
            if (!Number.isFinite(id) || id <= 0) return;
            const res = await nuiPost('acceptDispatch', { id });
            if (res && res.success) {
                await refreshDispatch();
                await refreshUnits();
            }
        });
    });

    qsa('#dispatchResults button[data-action]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.id);
            const status = btn.dataset.action;
            await nuiPost('setDispatchStatus', { id, status });
            await refreshDispatch();
        });
    });
}

async function refreshDispatch() {
    const res = await nuiPost('listDispatch', {});
    if (!res || !res.success) return;
    state.calls = res.payload.calls || [];
    renderDispatch();
}

function renderUnits() {
    const el = qs('#unitPanel');
    if (!el) return;

    const my = state.myUnitId ? state.units.find((u) => u.id === state.myUnitId) : null;
    const statusOptions = ['frei', 'im_dienst', 'im_einsatz', 'pause'];

    const unitsHtml = state.units.length
        ? state.units
              .map((u) => {
                  const crew = [u.driver_name, u.partner_name].filter(Boolean).join(' & ');
                  const veh = [u.vehicle_label, u.vehicle_plate].filter(Boolean).join(' · ');
                  const meta = [u.status ? `Status: ${u.status}` : null, u.area ? `Area: ${u.area}` : null, veh ? veh : null]
                      .filter(Boolean)
                      .join(' · ');
                  const joinBtn = !state.myUnitId ? `<button class="btn btn--primary" data-join-unit="1" data-id="${u.id}">Beitreten</button>` : '';
                  return `<div class="row" style="cursor: default;">
                        <div class="row__title">${escapeHtml(u.callsign || '')} ${crew ? `· ${escapeHtml(crew)}` : ''}</div>
                        <div class="row__meta">${escapeHtml(meta)}</div>
                        ${joinBtn ? `<div style="margin-top:10px;">${joinBtn}</div>` : ''}
                    </div>`;
              })
              .join('')
        : `<div class="muted">Keine Streifen aktiv.</div>`;

    if (!my) {
        el.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="font-weight:800;">Streifen</div>
                <button id="unitCreateBtn" class="btn btn--primary">Streife starten</button>
            </div>
            ${unitsHtml}
        `;

        const btn = qs('#unitCreateBtn');
        if (btn) {
            btn.addEventListener('click', async () => {
                const res = await nuiPost('createUnit', {});
                if (res && res.success) {
                    await refreshUnits();
                }
            });
        }
    } else {
        const statusSelect = `
            <select id="unitStatus" class="input" style="width: 180px;">
                ${statusOptions.map((s) => `<option value="${s}">${s}</option>`).join('')}
            </select>
        `;

        el.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="font-weight:800;">Meine Streife: ${escapeHtml(my.callsign || '')}</div>
                <button id="unitLeaveBtn" class="btn btn--danger">Verlassen</button>
            </div>
            <div class="field">
                <div class="field__label">Status / Area</div>
                <div class="field__row">
                    ${statusSelect}
                    <input id="unitArea" class="input" placeholder="Area..." value="${escapeHtml(my.area || '')}" />
                    <button id="unitSaveBtn" class="btn">Speichern</button>
                </div>
            </div>
            <div class="muted" style="margin-bottom:10px;">
                ${escapeHtml([my.driver_name, my.partner_name].filter(Boolean).join(' & ') || '')}
                ${my.vehicle_label || my.vehicle_plate ? ` · ${escapeHtml([my.vehicle_label, my.vehicle_plate].filter(Boolean).join(' · '))}` : ''}
                ${my.current_call_id ? ` · Call #${escapeHtml(my.current_call_id)}` : ''}
            </div>
            <div style="margin-top:10px;">
                ${unitsHtml}
            </div>
        `;

        const sel = qs('#unitStatus');
        if (sel) sel.value = my.status || 'frei';

        const leaveBtn = qs('#unitLeaveBtn');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', async () => {
                const res = await nuiPost('leaveUnit', {});
                if (res && res.success) {
                    await refreshUnits();
                }
            });
        }

        const saveBtn = qs('#unitSaveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const status = qs('#unitStatus').value;
                const area = qs('#unitArea').value.trim();
                const res = await nuiPost('setUnitStatus', { status, area });
                if (res && res.success) {
                    await refreshUnits();
                }
            });
        }
    }

    qsa('#unitPanel button[data-join-unit]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.id);
            if (!Number.isFinite(id) || id <= 0) return;
            const res = await nuiPost('joinUnit', { id });
            if (res && res.success) {
                await refreshUnits();
            }
        });
    });
}

async function refreshUnits() {
    const res = await nuiPost('listUnits', {});
    if (!res || !res.success) return;
    state.units = res.payload.units || [];
    state.myUnitId = res.payload.myUnitId || null;
    renderUnits();
    renderDispatch();
    setHeaderBadges();
    renderDashboard();
}

function openModal(title, bodyHtml) {
    qs('#modalTitle').textContent = title;
    qs('#modalBody').innerHTML = bodyHtml;
    qs('#modal').classList.remove('modal--hidden');
}

function closeModal() {
    qs('#modal').classList.add('modal--hidden');
    qs('#modalBody').innerHTML = '';
    qs('#modalTitle').textContent = '';
}

function openDispatchMap(x, y, title) {
    const cfg = state.map || defaultMapConfig;
    const imgSrc = cfg.image || defaultMapConfig.image
    const p = worldToMapPercent(x, y, cfg);

//#region debug-point dispatch-map-missing
    dbg('openDispatchMap', { x, y, imgSrc, ...p, viewport: cfg.viewport || null });
    try {
        const img = new Image();
        img.onload = () => dbg('mapImage:load', { imgSrc, ok: true });
        img.onerror = () => dbg('mapImage:load', { imgSrc, ok: false });
        img.src = imgSrc;
    } catch (_) {}
//#endregion debug-point dispatch-map-missing

    openModal(
        'Dispatch Karte',
        `
        <div style="margin-bottom:10px; color: rgba(255,255,255,0.65);">${escapeHtml(title)}</div>
        <div class="dispatch-map" style="background-image: url('${escapeHtml(imgSrc)}')">
            <div class="dispatch-map__marker" style="left:${p.px}%; top:${p.py}%"></div>
        </div>
        <div class="muted" style="margin-top:10px;">X: ${escapeHtml(x)} · Y: ${escapeHtml(y)}</div>
        `
    );
}

async function openDispatchCalibrationModal() {
    const cfg = state.map || defaultMapConfig;
    const imgSrc = cfg.image || defaultMapConfig.image;

    let pointA = null;
    let pointB = null;
    let waiting = null;
    let computeError = '';

    const draftKey = 'lunar_police_mdt:dispatchMapCalibrationDraft';
    const loadDraft = () => {
        try {
            const raw = localStorage.getItem(draftKey);
            if (!raw) return null;
            const d = JSON.parse(raw);
            if (!d || typeof d !== 'object') return null;
            return d;
        } catch (_) {
            return null;
        }
    };
    const saveDraft = () => {
        try {
            const d = { pointA, pointB };
            localStorage.setItem(draftKey, JSON.stringify(d));
        } catch (_) {}
    };
    const clearDraft = () => {
        try {
            localStorage.removeItem(draftKey);
        } catch (_) {}
    };

    const render = () => {
        const status = qs('#calStatus');
        const err = qs('#calError');
        if (err) err.textContent = '';
        if (!status) return;

        const aText = pointA
            ? `A: X ${Math.round(pointA.world.x)} · Y ${Math.round(pointA.world.y)} · ${pointA.map ? `Map ${pointA.map.u.toFixed(4)},${pointA.map.v.toFixed(4)}` : 'Map —'}`
            : 'A: —';
        const bText = pointB
            ? `B: X ${Math.round(pointB.world.x)} · Y ${Math.round(pointB.world.y)} · ${pointB.map ? `Map ${pointB.map.u.toFixed(4)},${pointB.map.v.toFixed(4)}` : 'Map —'}`
            : 'B: —';
        const waitText = waiting ? `Warte auf Klick in der Karte für Punkt ${waiting}…` : '';
        status.textContent = [aText, bText, waitText].filter(Boolean).join(' | ');

        const mapEl = qs('#calMap');
        if (!mapEl) return;
        const markers = [];
        if (pointA && pointA.map) markers.push(`<div class="dispatch-map__marker" style="left:${pointA.map.u * 100}%; top:${pointA.map.v * 100}%; background: rgba(80,160,255,1); box-shadow: 0 0 14px rgba(80,160,255,0.55);"></div>`);
        if (pointB && pointB.map) markers.push(`<div class="dispatch-map__marker" style="left:${pointB.map.u * 100}%; top:${pointB.map.v * 100}%; background: rgba(80,235,120,1); box-shadow: 0 0 14px rgba(80,235,120,0.55);"></div>`);
        mapEl.innerHTML = markers.join('');
    };

    const computeBounds = () => {
        computeError = '';
        if (!pointA || !pointB || !pointA.map || !pointB.map) {
            computeError = 'Bitte Punkt A und Punkt B setzen und jeweils in die Karte klicken.';
            return null;
        }
        const u1 = pointA.map.u;
        const u2 = pointB.map.u;
        const v1 = pointA.map.v;
        const v2 = pointB.map.v;

        const x1 = pointA.world.x;
        const x2 = pointB.world.x;
        const y1 = pointA.world.y;
        const y2 = pointB.world.y;

        const du = u2 - u1;
        const cy1 = 1 - v1;
        const cy2 = 1 - v2;
        const dcy = cy2 - cy1;

        if (Math.abs(du) < 0.08 || Math.abs(dcy) < 0.08) {
            computeError = 'Die zwei Punkte liegen auf der Karte zu nah beieinander. Nimm 2 Orte die weit auseinander sind und klick sauber.';
            return null;
        }

        const scaleX = (x2 - x1) / du;
        const minX = x1 - u1 * scaleX;
        const maxX = minX + scaleX;

        const scaleY = (y2 - y1) / dcy;
        const minY = y1 - cy1 * scaleY;
        const maxY = minY + scaleY;

        return { minX, maxX, minY, maxY };
    };

    openModal(
        'Karte kalibrieren',
        `
        <div class="muted" style="margin-bottom:10px;">Schritt 1: Stell dich an einen markanten Ort, drück „Punkt A nehmen“, dann klick in die Karte wo du stehst. Danach Punkt B.</div>
        <div class="field">
            <div class="field__row" style="flex-wrap: wrap;">
                <button id="calTakeA" class="btn btn--primary">Punkt A nehmen</button>
                <button id="calTakeB" class="btn btn--primary">Punkt B nehmen</button>
                <button id="calSave" class="btn">Speichern</button>
            </div>
            <div id="calStatus" class="muted" style="margin-top:10px;"></div>
            <div id="calError" class="muted" style="margin-top:8px; color: rgba(255,120,120,0.9);"></div>
        </div>
        <div class="dispatch-map-wrap">
            <div class="dispatch-map dispatch-map--rotated" id="calMap" style="background-image: url('${escapeHtml(imgSrc)}')"></div>
        </div>
        `
    );

    const draft = loadDraft();
    if (draft) {
        pointA = draft.pointA || null;
        pointB = draft.pointB || null;
        waiting = null;
    }

    render();

    qs('#calTakeA').addEventListener('click', async () => {
        const res = await nuiPost('getPlayerCoords', {});
        if (!res || !res.success || !res.payload) return;
        pointA = { world: { x: Number(res.payload.x), y: Number(res.payload.y) }, map: pointA?.map || null };
        waiting = 'A';
        saveDraft();
        render();
    });

    qs('#calTakeB').addEventListener('click', async () => {
        const res = await nuiPost('getPlayerCoords', {});
        if (!res || !res.success || !res.payload) return;
        pointB = { world: { x: Number(res.payload.x), y: Number(res.payload.y) }, map: pointB?.map || null };
        waiting = 'B';
        saveDraft();
        render();
    });

    qs('#calMap').addEventListener('click', (e) => {
        if (!waiting) return;
        const rect = qs('#calMap').getBoundingClientRect();
        const uPrime = (e.clientX - rect.left) / rect.width;
        const vPrime = (e.clientY - rect.top) / rect.height;
        const u = Math.max(0, Math.min(1, vPrime));
        const v = Math.max(0, Math.min(1, 1 - uPrime));
        const map = { u, v };

        if (waiting === 'A' && pointA) pointA = { world: pointA.world, map };
        if (waiting === 'B' && pointB) pointB = { world: pointB.world, map };
        waiting = null;
        saveDraft();
        render();
    });

    qs('#calSave').addEventListener('click', async () => {
        const err = qs('#calError');
        if (err) err.textContent = '';
        const bounds = computeBounds();
        if (!bounds) {
            if (err) err.textContent = computeError || 'Kalibrierung unvollständig.';
            return;
        }

        const payload = {
            bounds: {
                minX: bounds.minX,
                maxX: bounds.maxX,
                minY: bounds.minY,
                maxY: bounds.maxY,
            },
        };
        const res = await nuiPost('saveMapCalibration', payload);
        if (res && res.success) {
            state.map = { ...(state.map || defaultMapConfig), bounds: res.payload?.bounds || payload.bounds };
            clearDraft();
            closeModal();
            renderDispatch();
        } else {
            if (err) err.textContent = res?.message || 'Speichern fehlgeschlagen.';
        }
    });
}

function openTicketModal(prefill = {}) {
    const personIdentifier = prefill.person_identifier || '';
    const personName = prefill.person_name || '';
    const plate = prefill.vehicle_plate || '';

    openModal(
        'Neues Ticket',
        `
        <div class="muted" style="margin-bottom:10px;">
            ${personIdentifier ? `Person: ${escapeHtml(personName || 'Ausgewählt')}` : 'Person: bitte in der Personen-Suche auswählen.'}
        </div>
        <div class="field">
            <div class="field__label">Kennzeichen (optional)</div>
            <input id="tPlate" class="input" value="${escapeHtml(plate)}" placeholder="Kennzeichen..." />
        </div>
        <div class="field">
            <div class="field__label">Grund</div>
            <textarea id="tReason" class="textarea" placeholder="Text..."></textarea>
        </div>
        <div class="field">
            <div class="field__label">Strafen</div>
            <div class="field__row">
                <input id="tAmount" class="input" placeholder="Geld" />
                <input id="tJail" class="input" placeholder="Haft (Min)" />
            </div>
        </div>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button id="tSave" class="btn btn--primary">Speichern</button>
        </div>
        `
    );

    qs('#tSave').addEventListener('click', async () => {
        if (!personIdentifier) return;
        const payload = {
            person_identifier: personIdentifier,
            person_name: personName,
            vehicle_plate: qs('#tPlate').value.trim(),
            reason: qs('#tReason').value.trim(),
            amount: Number(qs('#tAmount').value) || 0,
            jail: Number(qs('#tJail').value) || 0,
        };
        const res = await nuiPost('createTicket', payload);
        if (res && res.success) {
            closeModal();
            await refreshTickets();
        }
    });
}

function openWarrantModal(prefill = {}) {
    const type = prefill.type === 'vehicle' ? 'vehicle' : 'person';
    const personIdentifier = prefill.person_identifier || '';
    const personName = prefill.person_name || '';
    const plate = prefill.vehicle_plate || '';

    openModal(
        'Neue Fahndung',
        `
        <div class="field">
            <div class="field__label">Typ</div>
            <select id="wType" class="input" style="width: 220px;">
                <option value="person">Person</option>
                <option value="vehicle">Fahrzeug</option>
            </select>
        </div>
        <div class="field" id="wPersonBlock">
            <div class="field__label">Person</div>
            <div class="muted">${personIdentifier ? escapeHtml(personName || 'Ausgewählt') : 'Bitte Person über Personen-Suche auswählen.'}</div>
        </div>
        <div class="field" id="wPlateBlock">
            <div class="field__label">Kennzeichen</div>
            <input id="wPlate" class="input" value="${escapeHtml(plate)}" placeholder="Kennzeichen..." />
        </div>
        <div class="field">
            <div class="field__label">Titel</div>
            <input id="wTitle" class="input" placeholder="Titel..." />
        </div>
        <div class="field">
            <div class="field__label">Beschreibung</div>
            <textarea id="wDesc" class="textarea" placeholder="Text..."></textarea>
        </div>
        <div class="field">
            <div class="field__label">Priorität</div>
            <select id="wPriority" class="input" style="width: 220px;">
                <option value="low">low</option>
                <option value="normal" selected>normal</option>
                <option value="high">high</option>
            </select>
        </div>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button id="wSave" class="btn btn--primary">Speichern</button>
        </div>
        `
    );

    qs('#wType').value = type;

    const sync = () => {
        const t = qs('#wType').value;
        qs('#wPersonBlock').style.display = t === 'person' ? 'block' : 'none';
        qs('#wPlateBlock').style.display = t === 'vehicle' ? 'block' : 'none';
    };
    qs('#wType').addEventListener('change', sync);
    sync();

    qs('#wSave').addEventListener('click', async () => {
        const t = qs('#wType').value;
        const payload = {
            type: t,
            person_identifier: t === 'person' ? personIdentifier : '',
            person_name: t === 'person' ? personName : '',
            vehicle_plate: t === 'vehicle' ? qs('#wPlate').value.trim() : '',
            title: qs('#wTitle').value.trim(),
            description: qs('#wDesc').value.trim(),
            priority: qs('#wPriority').value,
        };
        if (t === 'person' && !personIdentifier) return;
        const res = await nuiPost('createWarrant', payload);
        if (res && res.success) {
            closeModal();
            await refreshWarrants();
        }
    });
}

function openCaseModal(prefill = {}) {
    const personIdentifier = prefill.person_identifier || '';
    const personName = prefill.person_name || '';
    const plate = prefill.vehicle_plate || '';

    const persons = [];
    if (personIdentifier) {
        persons.push({ identifier: personIdentifier, name: personName || 'Ausgewählt' });
    }
    let personSearchResults = [];

    let suggestions = [];
    const selected = new Set();
    let timer = null;

    openModal(
        'Neuer Fall',
        `
        <div class="field">
            <div class="field__label">Titel</div>
            <input id="cTitle" class="input" placeholder="Titel..." />
        </div>
        <div class="field">
            <div class="field__label">Personen</div>
            <div class="field__row">
                <input id="cPersonQuery" class="input" placeholder="Name / SSN..." />
                <button id="cPersonSearchBtn" class="btn">Suchen</button>
            </div>
            <div id="cPersonResults" style="margin-top:10px;"></div>
            <div class="field" style="margin-top:10px;">
                <div class="field__label">Ausgewählt</div>
                <div id="cPersons"></div>
            </div>
            <div class="muted" id="cPersonMode" style="margin-top:10px;"></div>
        </div>
        <div class="field">
            <div class="field__label">Kennzeichen (optional)</div>
            <input id="cPlate" class="input" value="${escapeHtml(plate)}" placeholder="Kennzeichen..." />
        </div>
        <div class="field">
            <div class="field__label">Sachverhalt</div>
            <textarea id="cDesc" class="textarea" placeholder="Text..."></textarea>
        </div>
        <div class="field">
            <div class="field__label">Paragraphen-Vorschläge</div>
            <div id="cSuggest" class="muted">Tippe im Sachverhalt, dann kommen Vorschläge.</div>
        </div>
        <div class="field">
            <div class="field__label">Gesamthafteinheiten</div>
            <input id="cHeTotal" class="input" placeholder="0" disabled />
        </div>
        <div class="field">
            <div class="field__label">Gesamt-Strafen</div>
            <div class="field__row">
                <input id="cFine" class="input" placeholder="Geld" />
                <input id="cJail" class="input" placeholder="Haft (Min)" />
            </div>
        </div>
        <div class="field">
            <div class="field__label">Sichtbarkeit</div>
            <select id="cSecurity" class="input" style="width: 220px;">
                <option value="intern" selected>intern</option>
                <option value="all">all</option>
            </select>
        </div>
        <div class="field">
            <div class="field__label">Fraktion (nur bei Sammelakte)</div>
            <input id="cFaction" class="input" placeholder="z.B. Ballas / Vagos / ..."/>
        </div>
        <div id="cError" class="muted" style="margin-top:8px; color: rgba(255,120,120,0.9);"></div>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button id="cSave" class="btn btn--primary">Speichern</button>
        </div>
        `
    );

    const renderPersonMode = () => {
        const el = qs('#cPersonMode');
        if (!el) return;
        if (persons.length >= 2) {
            el.textContent = 'Modus: Sammelakte (2+ Personen) – wird unter Gruppenakten gespeichert.';
        } else if (persons.length === 1) {
            el.textContent = 'Modus: Einzelakte (1 Person).';
        } else {
            el.textContent = 'Modus: Ohne Person.';
        }
    };

    const renderPersons = () => {
        const el = qs('#cPersons');
        if (!el) return;
        el.innerHTML = persons.length
            ? persons
                  .map(
                      (p, idx) => `<div class="row" style="cursor: default;">
                        <div class="row__title">${escapeHtml(p.name || '')}</div>
                        <div class="row__meta">${escapeHtml(p.identifier || '')}</div>
                        <div style="margin-top:8px;">
                            <button class="btn btn--danger" data-cp-remove="1" data-idx="${idx}">Entfernen</button>
                        </div>
                      </div>`
                  )
                  .join('')
            : `<div class="muted">Keine Personen ausgewählt.</div>`;

        qsa('#cPersons button[data-cp-remove]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.dataset.idx);
                if (!Number.isFinite(idx)) return;
                persons.splice(idx, 1);
                renderPersons();
                renderPersonMode();
            });
        });
    };

    const renderPersonSearch = () => {
        const el = qs('#cPersonResults');
        if (!el) return;
        el.innerHTML = personSearchResults.length
            ? personSearchResults
                  .map((p) => {
                      const name = `${p.firstname || ''} ${p.lastname || ''}`.trim() || p.ssn || 'Unbekannt';
                      const meta = [p.ssn ? `SSN: ${p.ssn}` : null, p.dateofbirth ? `DOB: ${p.dateofbirth}` : null].filter(Boolean).join(' · ');
                      return `<div class="row" style="cursor: default;">
                            <div class="row__title">${escapeHtml(name)}</div>
                            <div class="row__meta">${escapeHtml(meta)}</div>
                            <div style="margin-top:8px;">
                                <button class="btn" data-cp-add="1" data-identifier="${escapeHtml(p.identifier)}">Hinzufügen</button>
                            </div>
                        </div>`;
                  })
                  .join('')
            : `<div class="muted">Keine Treffer.</div>`;

        qsa('#cPersonResults button[data-cp-add]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const identifier = btn.dataset.identifier;
                const p = personSearchResults.find((x) => x.identifier === identifier);
                if (!p) return;
                if (persons.some((x) => x.identifier === identifier)) return;
                const name = `${p.firstname || ''} ${p.lastname || ''}`.trim() || p.ssn || 'Unbekannt';
                persons.push({ identifier, name });
                renderPersons();
                renderPersonMode();
            });
        });
    };

    const updateJailFromSelected = () => {
        let total = 0;
        for (const idx of selected) {
            const s = suggestions[idx];
            if (s && s.he) total += Number(s.he) || 0;
        }
        qs('#cHeTotal').value = String(total || 0);
        qs('#cJail').value = total ? String(total) : '';
    };

    const renderSuggest = () => {
        const el = qs('#cSuggest');
        if (!suggestions.length) {
            el.innerHTML = `<div class="muted">Keine Vorschläge.</div>`;
            return;
        }
        el.innerHTML = suggestions
            .map((s, idx) => {
                const checked = selected.has(idx) ? 'checked' : '';
                const meta = [s.he !== undefined ? `Haft: ${s.he}` : null, s.paragraph].filter(Boolean).join(' · ');
                return `
                    <label style="display:flex; gap:10px; align-items:flex-start; padding:8px 0;">
                        <input type="checkbox" data-sidx="${idx}" ${checked} />
                        <div>
                            <div style="font-weight:700;">${escapeHtml(s.title || s.paragraph || '')}</div>
                            <div class="muted">${escapeHtml(meta)}</div>
                        </div>
                    </label>
                `;
            })
            .join('');

        qsa('#cSuggest input[type="checkbox"][data-sidx]').forEach((cbx) => {
            cbx.addEventListener('change', () => {
                const idx = Number(cbx.dataset.sidx);
                if (!Number.isFinite(idx)) return;
                if (cbx.checked) selected.add(idx);
                else selected.delete(idx);
                updateJailFromSelected();
            });
        });
    };

    const fetchSuggest = async () => {
        const text = qs('#cDesc').value.trim();
        if (!text) {
            suggestions = [];
            selected.clear();
            renderSuggest();
            updateJailFromSelected();
            return;
        }
        const res = await nuiPost('suggestCasePenalties', { text });
        suggestions = res?.payload?.suggestions || [];
        selected.clear();
        renderSuggest();
        updateJailFromSelected();
    };

    qs('#cDesc').addEventListener('input', () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(fetchSuggest, 450);
    });

    renderPersons();
    renderPersonMode();
    renderPersonSearch();

    qs('#cPersonSearchBtn').addEventListener('click', async () => {
        const q = qs('#cPersonQuery').value.trim();
        const res = await nuiPost('searchPersons', { query: q });
        personSearchResults = res?.payload?.persons || [];
        renderPersonSearch();
    });

    qs('#cPersonQuery').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') qs('#cPersonSearchBtn').click();
    });

    qs('#cSave').addEventListener('click', async () => {
        qs('#cError').textContent = '';
        const paragraphs = Array.from(selected).map((idx) => suggestions[idx]).filter(Boolean);
        const jailTotal = Number(qs('#cJail').value) || 0;

        if (persons.length >= 2) {
            const faction = qs('#cFaction').value.trim();
            if (!faction) {
                qs('#cError').textContent = 'Für eine Sammelakte brauchst du eine Fraktion.';
                return;
            }
            const payload = {
                faction,
                title: qs('#cTitle').value.trim(),
                content: qs('#cDesc').value.trim(),
                persons: persons.map((p) => ({ identifier: p.identifier, name: p.name })),
                paragraphs,
                jail_total: jailTotal,
            };
            const res = await nuiPost('createGroupCase', payload);
            if (res && res.success) {
                closeModal();
                await refreshGroupCases();
                if (res.payload?.id) {
                    await openGroupCaseDetailsModal(res.payload.id);
                }
            }
            return;
        }

        const p0 = persons[0];
        const payload = {
            title: qs('#cTitle').value.trim(),
            description: qs('#cDesc').value.trim(),
            security: qs('#cSecurity').value,
            person_identifier: p0?.identifier || '',
            person_name: p0?.name || '',
            vehicle_plate: qs('#cPlate').value.trim(),
            fine_total: Number(qs('#cFine').value) || 0,
            jail_total: jailTotal,
            paragraphs,
        };
        const res = await nuiPost('createCase', payload);
        if (res && res.success) {
            closeModal();
            await refreshCases();
        }
    });
}

async function openCaseDetailsModal(id) {
    const res = await nuiPost('getCase', { id });
    if (!res || !res.success) return;
    const c = res.payload.case;
    const entries = res.payload.entries || [];
    const sres = await nuiPost('listSeizures', { case_id: id });
    const seizures = sres?.payload?.seizures || [];

    const meta = [
        c.status ? `Status: ${c.status}` : null,
        c.security ? `Sicht: ${c.security}` : null,
        c.person_name ? `Person: ${c.person_name}` : null,
        c.vehicle_plate ? `Fzg: ${c.vehicle_plate}` : null,
        `Geld: ${c.fine_total ?? 0}`,
        `Haft: ${c.jail_total ?? 0}`,
        c.created_by_name ? `Von: ${c.created_by_name}` : null,
        c.created_at ? fmtDate(c.created_at) : null,
    ]
        .filter(Boolean)
        .join(' · ');

    const entriesHtml = entries.length
        ? entries
              .map(
                  (e) => `<div class="row" style="cursor: default;">
                    <div class="row__title">${escapeHtml(e.created_by_name || '')}</div>
                    <div class="row__meta">${escapeHtml(fmtDate(e.created_at))} · ${escapeHtml(e.entry_type || 'note')}</div>
                    <div style="margin-top:8px; white-space: pre-wrap;">${escapeHtml(e.message || '')}</div>
                  </div>`
              )
              .join('')
        : `<div class="muted">Keine Einträge.</div>`;

    const seizuresHtml = seizures.length
        ? seizures
              .map(
                  (s) => `<div class="row" style="cursor: default;">
                    <div class="row__title">${escapeHtml(s.label || s.item || '')} · x${escapeHtml(s.count ?? 1)}</div>
                    <div class="row__meta">${escapeHtml(fmtDate(s.created_at))} · ${escapeHtml(s.taken_by_name || '')}</div>
                  </div>`
              )
              .join('')
        : `<div class="muted">Keine Gegenstände.</div>`;

    const itemOptions = state.items.length
        ? state.items
              .map((it) => {
                  const label = it.label || it.name;
                  const suffix = it.label && it.label !== it.name ? ` (${it.name})` : '';
                  return `<option value="${escapeHtml(it.name)}">${escapeHtml(label + suffix)}</option>`;
              })
              .join('')
        : '';

    const officerOptions = state.officers.length
        ? state.officers
              .map((o) => `<option value="${escapeHtml(o.identifier)}">${escapeHtml(o.name || '')}${o.grade_label ? ` (${escapeHtml(o.grade_label)})` : ''}</option>`)
              .join('')
        : '';

    const rightsBlock =
        c.person_identifier
            ? `
        <div class="field">
            <div class="field__label">Rechte verlesen</div>
            <div class="field__row">
                <select id="caseRrOfficer" class="input" style="width: 280px;">
                    ${officerOptions ? officerOptions : '<option value="">Keine Officers geladen</option>'}
                </select>
                <button id="caseRrSave" class="btn">Speichern</button>
            </div>
        </div>
        `
            : '';

    openModal(
        `Fall #${escapeHtml(c.id)}`,
        `
        <div class="muted" style="margin-bottom: 10px;">${escapeHtml(meta)}</div>
        <div style="display:flex; gap:10px; margin-bottom:12px; flex-wrap: wrap;">
            <button id="caseStatusOpen" class="btn">Offen</button>
            <button id="caseStatusClosed" class="btn btn--danger">Geschlossen</button>
        </div>
        ${rightsBlock}
        <div class="field">
            <div class="field__label">Abgenommene Gegenstände</div>
            <div class="field__row">
                <select id="seizItem" class="input" style="width: 280px;">
                    ${itemOptions ? itemOptions : '<option value="">Keine Items geladen</option>'}
                </select>
                <input id="seizCount" class="input" placeholder="Menge" style="width: 120px;" />
                <button id="seizAdd" class="btn">Hinzufügen</button>
            </div>
            <div style="margin-top:10px;">${seizuresHtml}</div>
        </div>
        <div class="field">
            <div class="field__label">Neuer Eintrag</div>
            <textarea id="caseEntryText" class="textarea" placeholder="Text..."></textarea>
        </div>
        <div style="display:flex; gap:10px; justify-content:flex-end; margin-bottom: 14px;">
            <button id="caseEntrySave" class="btn btn--primary">Speichern</button>
        </div>
        <div>${entriesHtml}</div>
        `
    );

    if (c.person_identifier && qs('#caseRrOfficer')) {
        if (state.officer?.identifier) {
            qs('#caseRrOfficer').value = state.officer.identifier;
        }
        qs('#caseRrSave').addEventListener('click', async () => {
            const officerIdentifier = qs('#caseRrOfficer').value;
            const officer = state.officers.find((o) => o.identifier === officerIdentifier);
            if (!officerIdentifier || !officer) return;
            await nuiPost('addRightsRead', {
                person_identifier: c.person_identifier,
                person_name: c.person_name || '',
                officer_identifier: officerIdentifier,
                officer_name: officer.name || '',
            });
            await openCaseDetailsModal(id);
        });
    }

    qs('#seizAdd').addEventListener('click', async () => {
        const item = qs('#seizItem').value;
        if (!item) return;
        const count = Number(qs('#seizCount').value) || 1;
        const match = state.items.find((it) => it.name === item);
        const label = match?.label || match?.name || item;
        const payload = {
            case_id: id,
            person_identifier: c.person_identifier || '',
            person_name: c.person_name || '',
            item,
            label,
            count,
        };
        const r = await nuiPost('addSeizure', payload);
        if (r && r.success) {
            await openCaseDetailsModal(id);
        }
    });

    qs('#caseEntrySave').addEventListener('click', async () => {
        const message = qs('#caseEntryText').value.trim();
        if (!message) return;
        const r = await nuiPost('addCaseEntry', { id, message });
        if (r && r.success) {
            await openCaseDetailsModal(id);
        }
    });

    qs('#caseStatusOpen').addEventListener('click', async () => {
        await nuiPost('setCaseStatus', { id, status: 'offen' });
        await refreshCases();
        closeModal();
    });

    qs('#caseStatusClosed').addEventListener('click', async () => {
        await nuiPost('setCaseStatus', { id, status: 'geschlossen' });
        await refreshCases();
        closeModal();
    });
}

function openRightsReadModal(prefill = {}) {
    const personIdentifier = prefill.person_identifier || '';
    const personName = prefill.person_name || '';

    const options = state.officers.length
        ? state.officers
              .map((o) => `<option value="${escapeHtml(o.identifier)}">${escapeHtml(o.name || '')}${o.grade_label ? ` (${escapeHtml(o.grade_label)})` : ''}</option>`)
              .join('')
        : '';

    openModal(
        'Rechte verlesen',
        `
        <div class="muted" style="margin-bottom:10px;">Person: ${escapeHtml(personName || '')}</div>
        <div class="field">
            <div class="field__label">Officer</div>
            <select id="rrOfficer" class="input" style="width: 320px;">
                ${options || '<option value="">Keine Officers geladen</option>'}
            </select>
        </div>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button id="rrSave" class="btn btn--primary">Speichern</button>
        </div>
        `
    );

    if (state.officer?.identifier) {
        qs('#rrOfficer').value = state.officer.identifier;
    }

    qs('#rrSave').addEventListener('click', async () => {
        const officerIdentifier = qs('#rrOfficer').value;
        const officer = state.officers.find((o) => o.identifier === officerIdentifier);
        if (!officerIdentifier || !officer) return;
        const payload = {
            person_identifier: personIdentifier,
            person_name: personName,
            officer_identifier: officerIdentifier,
            officer_name: officer.name || '',
        };
        const res = await nuiPost('addRightsRead', payload);
        if (res && res.success) {
            closeModal();
        }
    });
}

function openGroupCaseModal(prefill = {}) {
    const persons = Array.isArray(prefill.persons) ? [...prefill.persons] : [];
    let searchResults = [];
    let suggestions = [];
    const selected = new Set();
    let timer = null;

    const updateJailFromSelected = () => {
        let total = 0;
        for (const idx of selected) {
            const s = suggestions[idx];
            if (s && s.he) total += Number(s.he) || 0;
        }
        qs('#gcHeTotal').value = String(total || 0);
    };

    const renderSuggest = () => {
        const el = qs('#gcSuggest');
        if (!suggestions.length) {
            el.innerHTML = `<div class="muted">Keine Vorschläge.</div>`;
            return;
        }
        el.innerHTML = suggestions
            .map((s, idx) => {
                const checked = selected.has(idx) ? 'checked' : '';
                const meta = [s.he !== undefined ? `Haft: ${s.he}` : null, s.paragraph].filter(Boolean).join(' · ');
                return `
                    <label style="display:flex; gap:10px; align-items:flex-start; padding:8px 0;">
                        <input type="checkbox" data-sidx="${idx}" ${checked} />
                        <div>
                            <div style="font-weight:700;">${escapeHtml(s.title || s.paragraph || '')}</div>
                            <div class="muted">${escapeHtml(meta)}</div>
                        </div>
                    </label>
                `;
            })
            .join('');

        qsa('#gcSuggest input[type="checkbox"][data-sidx]').forEach((cbx) => {
            cbx.addEventListener('change', () => {
                const idx = Number(cbx.dataset.sidx);
                if (!Number.isFinite(idx)) return;
                if (cbx.checked) selected.add(idx);
                else selected.delete(idx);
                updateJailFromSelected();
            });
        });
    };

    const fetchSuggest = async () => {
        const text = qs('#gcContent').value.trim();
        if (!text) {
            suggestions = [];
            selected.clear();
            renderSuggest();
            updateJailFromSelected();
            return;
        }
        const res = await nuiPost('suggestCasePenalties', { text });
        suggestions = res?.payload?.suggestions || [];
        selected.clear();
        renderSuggest();
        updateJailFromSelected();
    };

    const renderPersons = () => {
        const el = qs('#gcPersons');
        el.innerHTML = persons.length
            ? persons
                  .map(
                      (p, idx) => `<div class="row" style="cursor: default;">
                        <div class="row__title">${escapeHtml(p.name || '')}</div>
                        <div class="row__meta">${escapeHtml(p.ssn ? `SSN: ${p.ssn}` : '')}</div>
                        <div style="margin-top:8px;">
                            <button class="btn btn--danger" data-gc-remove="1" data-idx="${idx}">Entfernen</button>
                        </div>
                      </div>`
                  )
                  .join('')
            : `<div class="muted">Keine Personen hinzugefügt.</div>`;

        qsa('#gcPersons button[data-gc-remove]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.dataset.idx);
                if (!Number.isFinite(idx)) return;
                persons.splice(idx, 1);
                renderPersons();
            });
        });
    };

    const renderSearch = () => {
        const el = qs('#gcSearchResults');
        el.innerHTML = searchResults.length
            ? searchResults
                  .map((p) => {
                      const name = `${p.firstname || ''} ${p.lastname || ''}`.trim() || p.ssn || 'Unbekannt';
                      const meta = [p.ssn ? `SSN: ${p.ssn}` : null, p.dateofbirth ? `DOB: ${p.dateofbirth}` : null].filter(Boolean).join(' · ');
                      return `<div class="row" style="cursor: default;">
                            <div class="row__title">${escapeHtml(name)}</div>
                            <div class="row__meta">${escapeHtml(meta)}</div>
                            <div style="margin-top:8px;">
                                <button class="btn" data-gc-add="1" data-identifier="${escapeHtml(p.identifier)}">Hinzufügen</button>
                            </div>
                        </div>`;
                  })
                  .join('')
            : `<div class="muted">Keine Treffer.</div>`;

        qsa('#gcSearchResults button[data-gc-add]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const identifier = btn.dataset.identifier;
                const p = searchResults.find((x) => x.identifier === identifier);
                if (!p) return;
                const name = `${p.firstname || ''} ${p.lastname || ''}`.trim() || p.ssn || 'Unbekannt';
                if (persons.some((x) => x.identifier === identifier)) return;
                persons.push({ identifier, name, ssn: p.ssn || '' });
                renderPersons();
            });
        });
    };

    openModal(
        'Neue Gruppenakte',
        `
        <div class="field">
            <div class="field__label">Fraktion</div>
            <input id="gcFaction" class="input" placeholder="Fraktion..." />
        </div>
        <div class="field">
            <div class="field__label">Titel</div>
            <input id="gcTitle" class="input" placeholder="Titel..." />
        </div>
        <div class="field">
            <div class="field__label">Inhalt</div>
            <textarea id="gcContent" class="textarea" placeholder="Text..."></textarea>
        </div>
        <div class="field">
            <div class="field__label">Paragraphen-Vorschläge</div>
            <div id="gcSuggest" class="muted">Tippe im Inhalt, dann kommen Vorschläge.</div>
        </div>
        <div class="field">
            <div class="field__label">Gesamthafteinheiten</div>
            <input id="gcHeTotal" class="input" placeholder="0" disabled />
        </div>
        <div class="field">
            <div class="field__label">Personen hinzufügen</div>
            <div class="field__row">
                <input id="gcQuery" class="input" placeholder="Name / SSN..." />
                <button id="gcSearchBtn" class="btn">Suchen</button>
            </div>
            <div id="gcSearchResults" style="margin-top:10px;"></div>
        </div>
        <div class="field">
            <div class="field__label">Genannte Personen</div>
            <div id="gcPersons"></div>
        </div>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button id="gcSave" class="btn btn--primary">Speichern</button>
        </div>
        `
    );

    renderPersons();
    renderSearch();
    renderSuggest();
    updateJailFromSelected();

    qs('#gcContent').addEventListener('input', () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(fetchSuggest, 450);
    });

    qs('#gcSearchBtn').addEventListener('click', async () => {
        const query = qs('#gcQuery').value.trim();
        const res = await nuiPost('searchPersons', { query });
        searchResults = res?.payload?.persons || [];
        renderSearch();
    });

    qs('#gcQuery').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') qs('#gcSearchBtn').click();
    });

    qs('#gcSave').addEventListener('click', async () => {
        const paragraphs = Array.from(selected).map((idx) => suggestions[idx]).filter(Boolean);
        let total = 0;
        for (const p of paragraphs) {
            if (p && p.he) total += Number(p.he) || 0;
        }
        const payload = {
            faction: qs('#gcFaction').value.trim(),
            title: qs('#gcTitle').value.trim(),
            content: qs('#gcContent').value.trim(),
            persons: persons.map((p) => ({ identifier: p.identifier, name: p.name })),
            paragraphs,
            jail_total: total || 0,
        };
        const res = await nuiPost('createGroupCase', payload);
        if (res && res.success) {
            closeModal();
            await refreshGroupCases();
            if (state.selectedPerson?.person?.identifier && persons.some((p) => p.identifier === state.selectedPerson.person.identifier)) {
                await loadPerson(state.selectedPerson.person.identifier);
            }
        }
    });
}

async function openGroupCaseDetailsModal(id) {
    const res = await nuiPost('getGroupCase', { id });
    if (!res || !res.success) return;
    const g = res.payload.group_case;
    const persons = res.payload.persons || [];

    const personsHtml = persons.length
        ? persons
              .map((p) => `<div class="row" style="cursor: default;">
                    <div class="row__title">${escapeHtml(p.person_name || '')}</div>
                  </div>`)
              .join('')
        : `<div class="muted">Keine Personen.</div>`;

    let paragraphList = [];
    try {
        const parsed = JSON.parse(g.paragraphs_json || '[]');
        if (Array.isArray(parsed)) paragraphList = parsed;
    } catch (_) {}
    const paragraphsHtml = paragraphList.length
        ? paragraphList
              .slice(0, 20)
              .map((p) => `<div class="row" style="cursor: default;">
                    <div class="row__title">${escapeHtml(p.title || p.paragraph || '')}</div>
                    <div class="row__meta">${escapeHtml(p.he !== undefined ? `Haft: ${p.he}` : '')}</div>
                  </div>`)
              .join('')
        : `<div class="muted">Keine Paragraphen.</div>`;

    const officerOptions = state.officers.length
        ? state.officers
              .map((o) => `<option value="${escapeHtml(o.identifier)}">${escapeHtml(o.name || '')}${o.grade_label ? ` (${escapeHtml(o.grade_label)})` : ''}</option>`)
              .join('')
        : '';

    const personOptions = persons.length
        ? persons.map((p) => `<option value="${escapeHtml(p.person_identifier)}">${escapeHtml(p.person_name || '')}</option>`).join('')
        : '';

    openModal(
        `Gruppenakte #${escapeHtml(g.id)}`,
        `
        <div class="muted" style="margin-bottom: 10px;">Fraktion: ${escapeHtml(g.faction || '')} · Haft: ${escapeHtml(g.jail_total ?? 0)} · ${escapeHtml(fmtDate(g.created_at))} · ${escapeHtml(g.created_by_name || '')}</div>
        <div style="white-space: pre-wrap; margin-bottom: 14px;">${escapeHtml(g.content || '')}</div>
        <div class="field">
            <div class="field__label">Paragraphen</div>
            <div>${paragraphsHtml}</div>
        </div>
        <div class="field">
            <div class="field__label">Rechte verlesen</div>
            <div class="field__row">
                <select id="gcRrPerson" class="input" style="width: 240px;">
                    ${personOptions ? personOptions : '<option value="">Keine Personen</option>'}
                </select>
                <select id="gcRrOfficer" class="input" style="width: 240px;">
                    ${officerOptions ? officerOptions : '<option value="">Keine Officers geladen</option>'}
                </select>
                <button id="gcRrSave" class="btn">Speichern</button>
            </div>
        </div>
        <div class="field">
            <div class="field__label">Genannte Personen</div>
            <div>${personsHtml}</div>
        </div>
        `
    );

    if (state.officer?.identifier && qs('#gcRrOfficer')) {
        qs('#gcRrOfficer').value = state.officer.identifier;
    }

    qs('#gcRrSave').addEventListener('click', async () => {
        const personIdentifier = qs('#gcRrPerson').value;
        const officerIdentifier = qs('#gcRrOfficer').value;
        const person = persons.find((p) => p.person_identifier === personIdentifier);
        const officer = state.officers.find((o) => o.identifier === officerIdentifier);
        if (!personIdentifier || !officerIdentifier || !person || !officer) return;
        await nuiPost('addRightsRead', {
            person_identifier: personIdentifier,
            person_name: person.person_name || '',
            officer_identifier: officerIdentifier,
            officer_name: officer.name || '',
        });
        await openGroupCaseDetailsModal(id);
    });
}

function openReportModal(prefill = {}) {
    const subject = prefill.subject_identifier || '';
    openModal(
        'Neuer Bericht',
        `
        <div class="field">
            <div class="field__label">Betreff (optional)</div>
            <input id="rSubject" class="input" value="${escapeHtml(subject)}" />
        </div>
        <div class="field">
            <div class="field__label">Titel</div>
            <input id="rTitle" class="input" placeholder="Titel..." />
        </div>
        <div class="field">
            <div class="field__label">Inhalt</div>
            <textarea id="rContent" class="textarea" placeholder="Text..."></textarea>
        </div>
        <div class="field">
            <div class="field__label">Strafen</div>
            <div class="field__row">
                <input id="rFine" class="input" placeholder="Geld" />
                <input id="rJail" class="input" placeholder="Haft (Min)" />
            </div>
        </div>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button id="rSave" class="btn btn--primary">Speichern</button>
        </div>
        `
    );

    qs('#rSave').addEventListener('click', async () => {
        const payload = {
            subject_identifier: qs('#rSubject').value.trim(),
            title: qs('#rTitle').value.trim(),
            content: qs('#rContent').value.trim(),
            fine: Number(qs('#rFine').value) || 0,
            jail: Number(qs('#rJail').value) || 0,
        };
        const res = await nuiPost('createReport', payload);
        if (res && res.success) {
            closeModal();
            await refreshReports();
            if (payload.subject_identifier) {
                await loadPerson(payload.subject_identifier);
            }
        }
    });
}

window.addEventListener('message', async (event) => {
    const data = event.data || {};
    if (data.action === 'open') {
        setOpen(true);
        state.officer = data.payload?.officer || null;
        state.map = data.payload?.map || defaultMapConfig;
        qs('#officerName').textContent = state.officer?.name ? `Angemeldet als ${state.officer.name}` : '';
        setHeaderBadges();
        setTab('overview');
        state.selectedPerson = null;
        state.selectedVehicle = null;
        qs('#personResults').innerHTML = '';
        qs('#personDetails').innerHTML = `<div class="muted">Wähle eine Person aus.</div>`;
        qs('#vehicleResults').innerHTML = '';
        qs('#vehicleDetails').innerHTML = `<div class="muted">Wähle ein Fahrzeug aus.</div>`;
        qs('#personQuery').value = '';
        const personsRes = await nuiPost('searchPersons', { query: '' });
        state.persons = personsRes?.payload?.persons || [];
        renderPersons();
        await refreshUnits();
        await refreshReports();
        await refreshCases();
        await refreshWarrants();
        await refreshTickets();
        await refreshCharges();
        await refreshOfficers();
        await refreshItems();
        await refreshGroupCases();
        await refreshDispatch();
        setHeaderBadges();
        renderDashboard();
    }

    if (data.action === 'close') {
        setOpen(false);
        closeModal();
    }

    if (data.action === 'dispatchSync') {
        const payload = data.payload || {};
        if (payload.type === 'new' && payload.call) {
            state.calls = [payload.call, ...state.calls];
            renderDispatch();
        }
        if (payload.type === 'update' && payload.call) {
            state.calls = state.calls.map((c) => (c.id === payload.call.id ? { ...c, ...payload.call } : c));
            renderDispatch();
        }
    }

    if (data.action === 'unitsSync') {
        const payload = data.payload || {};
        if (payload.units) state.units = payload.units;
        state.myUnitId = payload.myUnitId || null;
        renderUnits();
        renderDispatch();
    }
});

qs('#closeBtn').addEventListener('click', () => nuiPost('close'));
qs('#modalClose').addEventListener('click', closeModal);
qs('#modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
});

qsa('.navbtn').forEach((btn) => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
});

qs('#personSearchBtn').addEventListener('click', async () => {
    const query = qs('#personQuery').value.trim();
    const res = await nuiPost('searchPersons', { query });
    state.persons = res?.payload?.persons || [];
    renderPersons();
});

qs('#personQuery').addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        qs('#personSearchBtn').click();
    }
});

qs('#vehicleSearchBtn').addEventListener('click', async () => {
    const query = qs('#vehicleQuery').value.trim();
    const res = await nuiPost('searchVehicles', { query });
    state.vehicles = res?.payload?.vehicles || [];
    renderVehicles();
});

qs('#vehicleQuery').addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        qs('#vehicleSearchBtn').click();
    }
});

qs('#reportRefreshBtn').addEventListener('click', refreshReports);
qs('#reportNewBtn').addEventListener('click', () => openReportModal({}));
qs('#caseRefreshBtn').addEventListener('click', refreshCases);
qs('#caseNewBtn').addEventListener('click', () => openCaseModal({}));
qs('#warrantRefreshBtn').addEventListener('click', refreshWarrants);
qs('#warrantNewBtn').addEventListener('click', () => openWarrantModal({}));
qs('#ticketRefreshBtn').addEventListener('click', refreshTickets);
qs('#ticketNewBtn').addEventListener('click', () => openTicketModal({}));
qs('#chargeRefreshBtn').addEventListener('click', refreshCharges);
qs('#officerRefreshBtn').addEventListener('click', refreshOfficers);
qs('#groupRefreshBtn').addEventListener('click', refreshGroupCases);
qs('#groupNewBtn').addEventListener('click', () => openGroupCaseModal({}));
qs('#dispatchRefreshBtn').addEventListener('click', refreshDispatch);
qs('#dispatchCalBtn').addEventListener('click', () => openDispatchCalibrationModal());
