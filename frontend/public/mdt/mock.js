/* =========================================================
   PREVIEW-ONLY MOCK LAYER  (nicht im FiveM-Resource verwenden)
   Simuliert GetParentResourceName + NUI-Fetch + open-Message
   ========================================================= */
(function () {
  window.GetParentResourceName = () => 'mdt';

  const PORTRAITS = [
    'https://images.unsplash.com/photo-1506863530036-1efeddceb993?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw0fHxwb3J0cmFpdCUyMGhlYWRzaG90fGVufDB8fHx8MTc4NTYyMDg3MHww&ixlib=rb-4.1.0&q=85&w=200',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMGhlYWRzaG90fGVufDB8fHx8MTc4NTYyMDg3MHww&ixlib=rb-4.1.0&q=85&w=200',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxwb3J0cmFpdCUyMGhlYWRzaG90fGVufDB8fHx8MTc4NTYyMDg3MHww&ixlib=rb-4.1.0&q=85&w=200',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwyfHxwb3J0cmFpdCUyMGhlYWRzaG90fGVufDB8fHx8MTc4NTYyMDg3MHww&ixlib=rb-4.1.0&q=85&w=200',
    'https://images.pexels.com/photos/30124371/pexels-photo-30124371.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=200&w=200',
    'https://images.pexels.com/photos/35721589/pexels-photo-35721589.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=200&w=200',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODh8MHwxfHNlYXJjaHwyfHxwZXJzb258ZW58MHx8fHwxNzg1NjIwODc1fDA&ixlib=rb-4.1.0&q=85&w=200',
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODh8MHwxfHNlYXJjaHwxfHxwZXJzb258ZW58MHx8fHwxNzg1NjIwODc1fDA&ixlib=rb-4.1.0&q=85&w=200',
  ];

  const now = Date.now();
  const ago = (m) => new Date(now - m * 60000).toISOString();

  const db = {
    persons: [
      { identifier: 'char1', firstname: 'Marcus', lastname: 'Hale', ssn: '4471-882', dateofbirth: '14.03.1991', sex: 'M', height: '184cm', phone_number: '555-0193', photo_url: PORTRAITS[1] },
      { identifier: 'char2', firstname: 'Elena', lastname: 'Cruz', ssn: '2210-334', dateofbirth: '02.07.1996', sex: 'W', height: '169cm', phone_number: '555-2246', photo_url: PORTRAITS[0] },
      { identifier: 'char3', firstname: 'Devon', lastname: 'Price', ssn: '9902-118', dateofbirth: '29.11.1988', sex: 'M', height: '178cm', phone_number: '555-7781', photo_url: PORTRAITS[4] },
      { identifier: 'char4', firstname: 'Sara', lastname: 'Nolan', ssn: '3345-901', dateofbirth: '18.09.1999', sex: 'W', height: '172cm', phone_number: '555-6620', photo_url: PORTRAITS[5] },
      { identifier: 'char5', firstname: 'Aiden', lastname: 'Brooks', ssn: '7788-540', dateofbirth: '05.01.1985', sex: 'M', height: '190cm', phone_number: '555-3391', photo_url: PORTRAITS[2] },
      { identifier: 'char6', firstname: 'Mia', lastname: 'Feld', ssn: '1123-667', dateofbirth: '23.06.1994', sex: 'W', height: '165cm', phone_number: '555-8814', photo_url: PORTRAITS[3] },
    ],
    vehicles: [
      { plate: 'LS-4471', firstname: 'Marcus', lastname: 'Hale', owner: 'Marcus Hale', flag: 'gestohlen', note: 'Nachts entwendet, Sandy Shores.' },
      { plate: 'PX-9920', firstname: 'Elena', lastname: 'Cruz', owner: 'Elena Cruz', flag: '', note: '' },
      { plate: 'GT-3310', firstname: 'Aiden', lastname: 'Brooks', owner: 'Aiden Brooks', flag: 'gesucht', note: 'Fahrerflucht Innenstadt.' },
      { plate: 'VN-1180', firstname: 'Mia', lastname: 'Feld', owner: 'Mia Feld', flag: '', note: '' },
    ],
    reports: [
      { id: 1, title: 'Verkehrskontrolle Route 68', subject_name: 'Marcus Hale', fine: 450, jail: 0, created_by_name: 'Off. J. Sterling', created_at: ago(35) },
      { id: 2, title: 'Ruhestörung Vinewood', subject_name: 'Elena Cruz', fine: 120, jail: 0, created_by_name: 'Off. R. Diaz', created_at: ago(120) },
      { id: 3, title: 'Widerstand gegen Vollstreckung', subject_name: 'Aiden Brooks', fine: 0, jail: 25, created_by_name: 'Off. J. Sterling', created_at: ago(240) },
    ],
    cases: [
      { id: 101, title: 'Raubüberfall Fleeca Bank', status: 'offen', security: 'intern', person_name: 'Aiden Brooks', fine_total: 15000, jail_total: 60, created_by_name: 'Det. M. Okafor', created_at: ago(90), person_identifier: 'char5' },
      { id: 102, title: 'Drogenhandel Grove Street', status: 'offen', security: 'all', person_name: 'Devon Price', fine_total: 8000, jail_total: 45, created_by_name: 'Off. R. Diaz', created_at: ago(400), person_identifier: 'char3' },
      { id: 103, title: 'Sachbeschädigung Legion Sq.', status: 'geschlossen', security: 'all', person_name: 'Marcus Hale', fine_total: 900, jail_total: 0, created_by_name: 'Off. J. Sterling', created_at: ago(1440), person_identifier: 'char1' },
    ],
    warrants: [
      { id: 51, title: 'Bewaffneter Raubüberfall', type: 'person', person_name: 'Aiden Brooks', person_identifier: 'char5', status: 'aktiv', priority: 'high', created_by_name: 'Det. M. Okafor', created_at: ago(60) },
      { id: 52, title: 'Fahrzeug zur Fahndung', type: 'vehicle', vehicle_plate: 'GT-3310', status: 'aktiv', priority: 'normal', created_by_name: 'Off. R. Diaz', created_at: ago(200) },
    ],
    tickets: [
      { id: 900, reason: 'Geschwindigkeitsüberschreitung 40 km/h', person_name: 'Marcus Hale', vehicle_plate: 'LS-4471', amount: 450, jail: 0, status: 'offen', created_by_name: 'Off. J. Sterling', created_at: ago(35) },
      { id: 901, reason: 'Parken im Halteverbot', person_name: 'Mia Feld', vehicle_plate: 'VN-1180', amount: 90, jail: 0, status: 'bezahlt', created_by_name: 'Off. R. Diaz', created_at: ago(300) },
    ],
    charges: [
      { id: 1, label: 'Fahren ohne Führerschein', category: 'Verkehr', paragraph: '§ 21 StVG', fine: 500, jail: 0 },
      { id: 2, label: 'Körperverletzung', category: 'Gewalt', paragraph: '§ 223 StGB', fine: 2000, jail: 20 },
      { id: 3, label: 'Raub', category: 'Eigentum', paragraph: '§ 249 StGB', fine: 12000, jail: 60 },
      { id: 4, label: 'Widerstand gegen Vollstreckungsbeamte', category: 'Öffentl. Ordnung', paragraph: '§ 113 StGB', fine: 1500, jail: 15 },
      { id: 5, label: 'Drogenbesitz', category: 'Betäubungsmittel', paragraph: '§ 29 BtMG', fine: 3000, jail: 25 },
    ],
    officers: [
      { identifier: 'off1', name: 'J. Sterling', grade: 4, grade_label: 'Detective', unit_id: 12, photo_url: PORTRAITS[6] },
      { identifier: 'off2', name: 'R. Diaz', grade: 2, grade_label: 'Officer II', unit_id: 12, photo_url: PORTRAITS[7] },
      { identifier: 'off3', name: 'M. Okafor', grade: 5, grade_label: 'Sergeant', unit_id: null, photo_url: PORTRAITS[2] },
    ],
    items: [
      { name: 'weapon_pistol', label: 'Pistole' },
      { name: 'ammo', label: 'Munition' },
      { name: 'lockpick', label: 'Dietrich' },
    ],
    group_cases: [
      { id: 7, title: 'Bandenrazzia Grove Street', faction: 'Families', jail_total: 120, created_by_name: 'Det. M. Okafor', created_at: ago(180), content: 'Koordinierte Razzia gegen die Families-Bande.', paragraphs_json: '[]' },
    ],
    units: [
      { id: 12, callsign: 'ADAM-12', driver_name: 'J. Sterling', partner_name: 'R. Diaz', status: 'im_einsatz', area: 'Vinewood', vehicle_label: 'Police Cruiser', vehicle_plate: 'LSPD-12', current_call_id: 3001 },
      { id: 14, callsign: 'LINCOLN-4', driver_name: 'M. Okafor', partner_name: '', status: 'frei', area: 'Downtown', vehicle_label: 'Police Bike', vehicle_plate: 'LSPD-14', current_call_id: null },
    ],
    myUnitId: 12,
    calls: [
      { id: 3001, message: 'Schießerei gemeldet – Vinewood Blvd', sender: 'Zeuge', status: 'in_bearbeitung', taken_by_name: 'ADAM-12', created_at: ago(8), x: 300, y: 200 },
      { id: 3002, message: 'Fahrzeug entwendet – Sandy Shores', sender: 'Anonym', status: 'offen', taken_by_name: null, created_at: ago(22), x: 1900, y: 3700 },
      { id: 3003, message: 'Ruhestörung – Del Perro Pier', sender: 'Anwohner', status: 'offen', taken_by_name: null, created_at: ago(45), x: -1600, y: -1000 },
    ],
  };

  const ok = (payload = {}) => ({ success: true, payload });

  function personFull(identifier) {
    const person = db.persons.find((p) => p.identifier === identifier) || db.persons[0];
    return ok({
      person,
      notes: [
        { note: 'Kooperativ bei der Kontrolle, keine Auffälligkeiten.', created_by_name: 'Off. J. Sterling', created_at: ago(50) },
      ],
      reports: db.reports.filter((r) => r.subject_name === `${person.firstname} ${person.lastname}`),
    });
  }

  const routes = {
    searchPersons: (b) => {
      const q = (b.query || '').toLowerCase();
      return ok({ persons: !q ? db.persons : db.persons.filter((p) => `${p.firstname} ${p.lastname} ${p.ssn}`.toLowerCase().includes(q)) });
    },
    getPerson: (b) => personFull(b.identifier),
    setPersonPhoto: () => ok(),
    addPersonNote: () => ok(),
    searchVehicles: (b) => {
      const q = (b.query || '').toLowerCase();
      return ok({ vehicles: !q ? db.vehicles : db.vehicles.filter((v) => v.plate.toLowerCase().includes(q)) });
    },
    getVehicle: (b) => ok({ vehicle: db.vehicles.find((v) => v.plate === b.plate) || db.vehicles[0] }),
    setVehicleFlag: () => ok(),
    listReports: () => ok({ reports: db.reports }),
    createReport: () => ok(),
    listCases: () => ok({ cases: db.cases }),
    getCase: (b) => ok({ case: db.cases.find((c) => c.id === Number(b.id)) || db.cases[0], entries: [{ created_by_name: 'Off. J. Sterling', created_at: ago(30), entry_type: 'note', message: 'Erste Befragung durchgeführt.' }] }),
    listSeizures: () => ok({ seizures: [] }),
    addSeizure: () => ok(),
    addCaseEntry: () => ok(),
    setCaseStatus: () => ok(),
    createCase: () => ok({ id: 199 }),
    listWarrants: () => ok({ warrants: db.warrants }),
    createWarrant: () => ok(),
    setWarrantStatus: () => ok(),
    listTickets: () => ok({ tickets: db.tickets }),
    createTicket: () => ok(),
    listCharges: () => ok({ charges: db.charges }),
    listOfficers: () => ok({ officers: db.officers }),
    listItems: () => ok({ items: db.items }),
    listGroupCases: () => ok({ group_cases: db.group_cases }),
    getGroupCase: (b) => ok({ group_case: db.group_cases.find((g) => g.id === Number(b.id)) || db.group_cases[0], persons: [{ person_identifier: 'char3', person_name: 'Devon Price' }, { person_identifier: 'char5', person_name: 'Aiden Brooks' }] }),
    createGroupCase: () => ok({ id: 8 }),
    addRightsRead: () => ok(),
    listDispatch: () => ok({ calls: db.calls }),
    acceptDispatch: () => ok(),
    setDispatchStatus: () => ok(),
    setWaypoint: () => ok(),
    listUnits: () => ok({ units: db.units, myUnitId: db.myUnitId }),
    createUnit: () => { db.myUnitId = 12; return ok(); },
    joinUnit: (b) => { db.myUnitId = Number(b.id); return ok(); },
    leaveUnit: () => { db.myUnitId = null; return ok(); },
    setUnitStatus: () => ok(),
    suggestCasePenalties: () => ok({ suggestions: [
      { title: 'Raub', paragraph: '§ 249 StGB', he: 60 },
      { title: 'Widerstand', paragraph: '§ 113 StGB', he: 15 },
    ] }),
    getPlayerCoords: () => ok({ x: 215, y: -810 }),
    saveMapCalibration: (b) => ok({ bounds: b.bounds }),
    debugLog: () => ok(),
    close: () => ok(),
  };

  const origFetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    try {
      const u = String(url);
      if (u.startsWith('https://mdt/')) {
        const name = u.split('/').pop();
        let body = {};
        try { body = opts && opts.body ? JSON.parse(opts.body) : {}; } catch (_) {}
        const handler = routes[name];
        const res = handler ? handler(body) : ok();
        return Promise.resolve({ json: () => Promise.resolve(res) });
      }
    } catch (_) {}
    return origFetch(url, opts);
  };

  // Feuere die open-Message ab, sobald app.js seine Listener registriert hat.
  // setTimeout(0..) läuft nach der synchronen Ausführung von app.js -> Listener ist bereit.
  window.__MDT_OPEN_PAYLOAD__ = {
    officer: { identifier: 'off1', name: 'J. Sterling', grade: 4, grade_label: 'Detective' },
    map: {
      image: './assets/map.png',
      bounds: { minX: -4000, maxX: 4000, minY: -4000, maxY: 8000 },
      viewport: { left: 0, top: 0, right: 1, bottom: 1 },
    },
  };

  // --- Preview-Demo: neue Notrufe live simulieren (nur im Browser) ---
  var SIM_TEMPLATES = [
    { message: 'Einbruch gemeldet – Vespucci Beach', sender: 'Anwohner' },
    { message: 'Verkehrsunfall – Route 68', sender: 'Zeuge' },
    { message: 'Schlägerei vor Bar – Vinewood', sender: 'Passant' },
    { message: 'Verdächtige Person – Legion Square', sender: 'Anonym' },
    { message: 'Ladendiebstahl – 24/7 Store', sender: 'Angestellter' },
  ];
  var simId = 4000;
  function randCoord() {
    return {
      x: Math.round(-3500 + Math.random() * 7000),
      y: Math.round(-3500 + Math.random() * 11000),
    };
  }
  window.__MDT_SIMULATE_NEW_CALL__ = function () {
    simId += 1;
    var t = SIM_TEMPLATES[Math.floor(Math.random() * SIM_TEMPLATES.length)];
    var c = randCoord();
    var call = {
      id: simId,
      message: t.message,
      sender: t.sender,
      status: 'offen',
      taken_by_name: null,
      created_at: new Date().toISOString(),
      x: c.x,
      y: c.y,
    };
    db.calls = [call, ...db.calls];
    window.dispatchEvent(new MessageEvent('message', {
      data: { action: 'dispatchSync', payload: { type: 'new', call: call } },
    }));
  };
  window.__MDT_START_SIM__ = function () {
    setTimeout(window.__MDT_SIMULATE_NEW_CALL__, 2500);
    setInterval(window.__MDT_SIMULATE_NEW_CALL__, 8000);
  };
})();
