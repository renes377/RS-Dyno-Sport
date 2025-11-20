/**
 * js/championship.js
 * Enthält: Verwaltung der Meisterschaften, Tabelle, Export UND Renn-Manager
 */

let activeChampId = null;

function initChampionship() {
    renderChampList();
}

// ==========================================
// 1. ÜBERSICHT & LISTEN
// ==========================================

function renderChampList() {
    const activeContainer = document.getElementById('champListActive');
    const archiveContainer = document.getElementById('champListArchive');
    if (!activeContainer || !archiveContainer) return;

    activeContainer.innerHTML = ''; 
    archiveContainer.innerHTML = '';

    if (!rsDb.championships || rsDb.championships.length === 0) {
        activeContainer.innerHTML = '<p class="text-gray-500 italic col-span-2">Keine Meisterschaften vorhanden.</p>';
        return;
    }

    rsDb.championships.forEach(champ => {
        const raceCount = champ.races ? champ.races.length : 0;
        const isArchived = champ.isArchived === true;
        const div = document.createElement('div');
        div.className = `bg-gray-800 p-4 rounded-lg border ${isArchived ? 'border-gray-800 bg-opacity-50' : 'border-gray-600 hover:border-blue-500'} cursor-pointer transition-all shadow-lg relative group`;
        
        // Klick öffnet Details
        div.onclick = () => openChampDetail(champ.id);
        
        // Buttons für Bearbeiten/Löschen (nur sichtbar bei Hover)
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <h4 class="text-lg font-bold ${isArchived ? 'text-gray-400' : 'text-white'}">${champ.name}</h4>
                ${isArchived ? '<span class="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">Archiviert</span>' : ''}
            </div>
            <p class="text-gray-500 text-sm mt-1">${raceCount} Rennen • ${champ.config?.useDrops ? 'Mit Streichern' : 'Alles zählt'}</p>
            <div class="absolute bottom-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onclick="event.stopPropagation(); editChamp('${champ.id}')" class="text-blue-400 hover:text-blue-300 text-xs font-bold bg-gray-900 px-2 py-1 rounded">Bearbeiten</button>
                 <button onclick="event.stopPropagation(); deleteChamp('${champ.id}')" class="text-red-500 hover:text-red-400 text-xs bg-gray-900 px-2 py-1 rounded">Löschen</button>
            </div>
        `;
        if (isArchived) archiveContainer.appendChild(div); else activeContainer.appendChild(div);
    });
}

// ==========================================
// 2. CHAMPIONSHIP CRUD (Erstellen/Bearbeiten)
// ==========================================

function openCreateChampModal() {
    document.getElementById('createChampForm').reset();
    if(document.getElementById('editChampId')) document.getElementById('editChampId').value = ''; 
    document.querySelector('#createChampModal h2').textContent = "Neue Meisterschaftsserie";
    document.getElementById('createChampModal').style.display = 'flex';
}

function editChamp(id) {
    const champ = rsDb.championships.find(c => c.id === id);
    if(!champ) return;
    
    document.getElementById('newChampName').value = champ.name;
    document.getElementById('newChampPoints').value = champ.pointsScheme;
    document.getElementById('newChampBonusPole').value = champ.config.bonusPole;
    document.getElementById('newChampBonusFastest').value = champ.config.bonusFastest;
    document.getElementById('useDropRaces').checked = champ.config.useDrops;
    
    // ID in Hidden Input (falls vorhanden) setzen
    const hiddenInput = document.getElementById('editChampId');
    if(hiddenInput) hiddenInput.value = champ.id;
    
    document.querySelector('#createChampModal h2').textContent = "Serie bearbeiten";
    document.getElementById('createChampModal').style.display = 'flex';
}

document.getElementById('createChampForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const editIdInput = document.getElementById('editChampId');
    const editId = editIdInput ? editIdInput.value : null;
    
    const champData = {
        name: document.getElementById('newChampName').value,
        pointsScheme: document.getElementById('newChampPoints').value,
        config: {
            bonusPole: parseInt(document.getElementById('newChampBonusPole').value) || 0,
            bonusFastest: parseInt(document.getElementById('newChampBonusFastest').value) || 0,
            useDrops: document.getElementById('useDropRaces').checked
        }
    };

    if(editId) {
        // Update
        const index = rsDb.championships.findIndex(c => c.id === editId);
        if(index > -1) {
            rsDb.championships[index] = { ...rsDb.championships[index], ...champData };
        }
    } else {
        // Neu
        rsDb.championships.push({
            id: 'champ_' + Date.now(),
            ...champData,
            races: [],
            sheetUrl: ""
        });
    }
    
    saveDatabase();
    document.getElementById('createChampModal').style.display = 'none';
    renderChampList();
    if(activeChampId && activeChampId === editId) openChampDetail(activeChampId);
});

function deleteChamp(id) {
    if(confirm('Meisterschaft und alle zugehörigen Rennen unwiderruflich löschen?')) {
        rsDb.championships = rsDb.championships.filter(c => c.id !== id);
        saveDatabase();
        renderChampList();
        if(activeChampId === id) closeChampDetail();
    }
}

function toggleChampArchive(id) {
    const champ = rsDb.championships.find(c => c.id === id);
    if(!champ) return;
    champ.isArchived = !champ.isArchived;
    saveDatabase();
    closeChampDetail();
}

// ==========================================
// 3. DETAIL ANSICHT & TABELLE
// ==========================================

function openChampDetail(id) {
    activeChampId = id;
    const champ = rsDb.championships.find(c => c.id === id);
    if(!champ) return;

    document.getElementById('champOverview').classList.add('hidden');
    document.getElementById('champDetail').classList.remove('hidden');
    document.getElementById('champTitle').textContent = champ.name;
    
    const btnArchive = document.getElementById('btnArchive');
    if(btnArchive) {
        if (champ.isArchived) {
            btnArchive.innerHTML = "📂 Reaktivieren";
            btnArchive.className = "bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-sm border border-green-500";
        } else {
            btnArchive.innerHTML = "📂 Archivieren";
            btnArchive.className = "bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded text-sm border border-gray-500";
        }
    }

    renderV8ChampTable(id);
}

function closeChampDetail() {
    activeChampId = null;
    document.getElementById('champDetail').classList.add('hidden');
    document.getElementById('champOverview').classList.remove('hidden');
    renderChampList();
}

// ==========================================
// 4. BERECHNUNGS-ENGINE (Wichtig!)
// ==========================================

const getStandardDropCount = (totalRaces) => {
    if (totalRaces >= 9) return 3;
    if (totalRaces >= 5) return 2;
    if (totalRaces >= 3) return 1;
    return 0;
};

function calculateFlexibleStandings(champ) {
    const races = champ.races || [];
    if (races.length === 0) return { standings: [], dropCount: 0 };

    const config = champ.config || { bonusPole: 1, bonusFastest: 1, useDrops: true };
    const pointsArr = champ.pointsScheme.split(',').map(n => parseInt(n.trim()));
    const totalRaces = races.length;

    let dropCount = 0;
    if (config.useDrops) dropCount = getStandardDropCount(totalRaces);

    const driverMap = {};

    races.forEach(race => {
        race.results.forEach(res => {
            const name = res.driver;
            if (!driverMap[name]) driverMap[name] = [];

            let basePoints = 0;
            if (res.pos > 0 && res.pos <= pointsArr.length) {
                basePoints = pointsArr[res.pos - 1] || 0;
            }

            let bonusPoints = 0;
            if (res.bonus && res.bonus.includes('Q')) bonusPoints += config.bonusPole;
            if (res.bonus && res.bonus.includes('R')) bonusPoints += config.bonusFastest;

            driverMap[name].push({
                raceId: race.id,
                date: new Date(race.date),
                points: basePoints + bonusPoints,
                pos: res.pos,
                bonusStr: res.bonus || ''
            });
        });
    });

    const standings = [];
    for (const name in driverMap) {
        let results = driverMap[name];
        let bestSingle = { points: -1, date: new Date('2999-01-01') };
        results.forEach(r => {
            if (r.points > bestSingle.points) {
                bestSingle = { points: r.points, date: r.date };
            } else if (r.points === bestSingle.points && r.date < bestSingle.date) {
                bestSingle = { points: r.points, date: r.date };
            }
        });

        results.sort((a, b) => a.points - b.points); 

        const racesDriven = results.length;
        const racesToCount = Math.max(0, totalRaces - dropCount);
        
        let actualDrops = 0;
        if (racesDriven > racesToCount) {
            actualDrops = Math.min(racesDriven - racesToCount, dropCount);
        }

        for(let i=0; i<actualDrops; i++) results[i].isDropped = true;

        const totalPoints = results.reduce((sum, r) => r.isDropped ? sum : sum + r.points, 0);
        const resultsByRace = {};
        results.forEach(r => { resultsByRace[r.raceId] = r; });

        standings.push({
            name: name,
            totalPoints: totalPoints,
            bestSinglePoints: bestSingle.points,
            bestSingleDate: bestSingle.date,
            resultsByRace: resultsByRace,
            racesDriven: racesDriven
        });
    }

    standings.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.bestSinglePoints !== a.bestSinglePoints) return b.bestSinglePoints - a.bestSinglePoints;
        return a.bestSingleDate - b.bestSingleDate;
    });

    return { standings, dropCount };
}

function renderV8ChampTable(champId) {
    const champ = rsDb.championships.find(c => c.id === champId);
    if (!champ) return;

    const { standings, dropCount } = calculateFlexibleStandings(champ);
    const dropText = champ.config?.useDrops ? `(Streicher: ${dropCount})` : '(Alles zählt)';
    document.getElementById('champPointsInfo').textContent = `Punkteschema: ${champ.pointsScheme.substring(0,20)}... ${dropText}`;

    const table = document.getElementById('champTable');
    const sortedRaces = [...(champ.races || [])].sort((a,b) => a.date.localeCompare(b.date));

    let html = `
    <thead>
    <tr class="bg-gray-700 text-white text-xs uppercase">
        <th class="p-3 border border-gray-600 sticky left-0 bg-gray-700 z-10">Pos</th>
        <th class="p-3 border border-gray-600 sticky left-10 bg-gray-700 z-10 text-left">Fahrer</th>
        <th class="p-3 border border-gray-600 text-center font-bold text-yellow-400">Punkte</th>
        <th class="p-3 border border-gray-600 text-center">Starts</th>
    `;

    sortedRaces.forEach(r => {
        const d = r.date.split('-');
        const shortDate = d.length===3 ? `${d[2]}.${d[1]}.` : r.date;
        html += `<th class="p-2 border border-gray-600 text-center min-w-[80px]">
            <div class="font-bold">${shortDate}</div>
            <div class="text-gray-400 text-[10px] truncate w-20 mx-auto" title="${r.track}">${r.track}</div>
        </th>`;
    });
    html += `</tr></thead><tbody class="divide-y divide-gray-700">`;

    standings.forEach((driver, index) => {
        html += `<tr class="hover:bg-gray-800 transition">
            <td class="p-3 border border-gray-700 text-center text-gray-400 sticky left-0 bg-gray-800">${index+1}</td>
            <td class="p-3 border border-gray-700 font-bold text-white sticky left-10 bg-gray-800">${driver.name}</td>
            <td class="p-3 border border-gray-700 text-center font-bold text-xl text-blue-400">${driver.totalPoints}</td>
            <td class="p-3 border border-gray-700 text-center text-gray-500 text-sm">${driver.racesDriven}</td>`;

        sortedRaces.forEach(race => {
            const res = driver.resultsByRace[race.id];
            if (res) {
                let icon = "";
                let styleClass = "font-bold text-white";
                let cellClass = "";
                if (!res.isDropped) {
                    if (res.pos === 1) { icon = "🥇"; styleClass = "text-yellow-400"; }
                    else if (res.pos === 2) { icon = "🥈"; styleClass = "text-gray-300"; }
                    else if (res.pos === 3) { icon = "🥉"; styleClass = "text-orange-400"; }
                } else {
                    cellClass = "opacity-50 grayscale";
                }
                let pts = res.isDropped ? `<span class="text-gray-500 line-through decoration-gray-600">${res.points}</span>` : res.points;
                let bonusHtml = res.bonusStr ? `<sup class="text-[10px] ml-1 ${res.isDropped ? 'text-gray-600' : 'text-green-400'}">${res.bonusStr}</sup>` : '';
                html += `<td class="p-2 border border-gray-700 text-center ${cellClass}"><div class="${styleClass} text-sm flex justify-center items-center gap-1">${icon} ${pts}${bonusHtml}</div><div class="text-[10px] text-gray-600">P${res.pos}</div></td>`;
            } else {
                html += `<td class="p-2 border border-gray-700 text-center text-gray-600">-</td>`;
            }
        });
        html += `</tr>`;
    });
    html += `</tbody>`;
    table.innerHTML = html;
    renderRaceHistory(champ);
}

function renderRaceHistory(champ) {
    const container = document.getElementById('champRacesHistory');
    container.innerHTML = '';
    if(!champ.races) return;
    
    // Neueste zuerst
    const sortedRaces = [...champ.races].sort((a,b) => b.date.localeCompare(a.date));

    sortedRaces.forEach(race => {
        const div = document.createElement('div');
        div.className = "bg-gray-800 p-2 rounded border border-gray-700 flex justify-between items-center text-sm";
        
        // Anzeige: Datum - Strecke (X Fahrer) [Bearbeiten] [Löschen]
        // Hier sind die Bearbeiten Buttons!
        div.innerHTML = `
            <span class="flex-grow">📅 <b>${formatDateShort(race.date)}</b> @ ${race.track} (${race.results.length} Fahrer)</span>
            <div class="flex gap-3">
                <button onclick="editRace('${champ.id}', '${race.id}')" class="text-blue-400 hover:text-blue-300 font-bold text-xs bg-gray-900 px-2 py-1 rounded">Bearbeiten</button>
                <button onclick="deleteRace('${champ.id}', '${race.id}')" class="text-red-500 hover:text-red-400 text-xs bg-gray-900 px-2 py-1 rounded">Löschen</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function deleteRace(champId, raceId) {
    if(!confirm("Rennen wirklich löschen?")) return;
    const champ = rsDb.championships.find(c => c.id === champId);
    if(champ) {
        champ.races = champ.races.filter(r => r.id !== raceId);
        saveDatabase();
        openChampDetail(champId);
    }
}

// ==========================================
// 5. RACE CRUD (Hinzufügen & Bearbeiten)
// ==========================================

function openAddRaceModal() {
    document.getElementById('addRaceForm').reset();
    if(document.getElementById('editRaceId')) document.getElementById('editRaceId').value = ''; 
    document.getElementById('raceDateInput').valueAsDate = new Date();
    document.querySelector('#addRaceModal h2').textContent = "Rennergebnis eintragen";
    
    setupRaceInputs();
    document.getElementById('addRaceModal').style.display = 'flex';
}

function editRace(champId, raceId) {
    const champ = rsDb.championships.find(c => c.id === champId);
    if(!champ) return;
    const race = champ.races.find(r => r.id === raceId);
    if(!race) return;

    setupRaceInputs(); 

    document.getElementById('raceDateInput').value = race.date;
    document.getElementById('raceTrackInput').value = race.track;
    
    const hiddenInput = document.getElementById('editRaceId');
    if(hiddenInput) hiddenInput.value = race.id;

    let poleDriver = "";
    let fastDriver = "";

    race.results.forEach(res => {
        const input = document.querySelector(`input[name="p${res.pos}"]`);
        if(input) input.value = res.driver;
        if(res.bonus && res.bonus.includes('Q')) poleDriver = res.driver;
        if(res.bonus && res.bonus.includes('R')) fastDriver = res.driver;
    });

    document.getElementById('poleInput').value = poleDriver;
    document.getElementById('fastestInput').value = fastDriver;

    document.querySelector('#addRaceModal h2').textContent = "Rennergebnis bearbeiten";
    document.getElementById('addRaceModal').style.display = 'flex';
}

function setupRaceInputs() {
    const container = document.getElementById('placementInputsContainer');
    container.innerHTML = '';
    const driverList = document.getElementById('driverList');
    driverList.innerHTML = '';
    
    const drivers = new Set();
    if(rsDb.championships) rsDb.championships.forEach(c => { if(c.races) c.races.forEach(r => r.results.forEach(res => drivers.add(res.driver))); });
    drivers.forEach(d => { const opt = document.createElement('option'); opt.value = d; driverList.appendChild(opt); });

    for (let i = 1; i <= 20; i++) {
        container.innerHTML += `
            <div class="flex items-center gap-2">
                <span class="text-gray-500 font-mono w-6 text-right">${i}.</span>
                <input type="text" name="p${i}" list="driverList" class="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 focus:border-blue-500" placeholder="Fahrer Name">
            </div>`;
    }
}

document.getElementById('addRaceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const poleDriver = document.getElementById('poleInput').value.trim();
    const fastestDriver = document.getElementById('fastestInput').value.trim();
    
    const editRaceIdInput = document.getElementById('editRaceId');
    const editRaceId = editRaceIdInput ? editRaceIdInput.value : null;
    
    const results = [];
    for (let i = 1; i <= 20; i++) {
        const name = document.querySelector(`input[name="p${i}"]`).value.trim();
        if (name) {
            let bonusCode = "";
            if (poleDriver && name === poleDriver) bonusCode += "Q";
            if (fastestDriver && name === fastestDriver) bonusCode += "R";
            results.push({ pos: i, driver: name, bonus: bonusCode });
        }
    }

    if (results.length === 0) return alert("Bitte Fahrer eintragen.");
    
    const champIndex = rsDb.championships.findIndex(c => c.id === activeChampId);
    if (champIndex > -1) {
        const champ = rsDb.championships[champIndex];
        if (!champ.races) champ.races = [];

        const raceData = {
            date: document.getElementById('raceDateInput').value,
            track: document.getElementById('raceTrackInput').value || 'Unbekannt',
            results: results
        };

        if(editRaceId) {
            const raceIndex = champ.races.findIndex(r => r.id === editRaceId);
            if(raceIndex > -1) {
                champ.races[raceIndex] = { ...champ.races[raceIndex], ...raceData };
            }
        } else {
            champ.races.push({
                id: 'race_' + Date.now(),
                ...raceData
            });
        }

        saveDatabase();
        document.getElementById('addRaceModal').style.display = 'none';
        renderV8ChampTable(activeChampId);
    }
});

// ==========================================
// 6. HELPER & EXPORT
// ==========================================

function setPreset(type) { const input = document.getElementById('newChampPoints'); if (type === 'dtsw') input.value = "20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0,0,0,0"; if (type === 'f1') input.value = "25,18,15,12,10,8,6,4,2,1,0,0,0,0"; }
function openExportModal() { const champ = rsDb.championships.find(c => c.id === activeChampId); if(!champ) return; document.getElementById('exportChampName').textContent = champ.name; document.getElementById('modalSheetUrl').value = champ.sheetUrl || ""; document.getElementById('exportModal').style.display = 'flex'; }
function generateChampHtmlContent() { const champ = rsDb.championships.find(c => c.id === activeChampId); const tableHtml = document.getElementById('champTable').innerHTML; if (!champ || !tableHtml) return null; return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>${champ.name}</title><script src="https://cdn.tailwindcss.com"></script><style>.rs-scroll::-webkit-scrollbar{width:8px;height:8px}.rs-scroll::-webkit-scrollbar-track{background:#1f2937}.rs-scroll::-webkit-scrollbar-thumb{background:#4b5563;border-radius:4px}th{position:sticky;top:0;background-color:#374151;z-index:10}</style></head><body class="bg-gray-900 text-white p-4"><div class="max-w-5xl mx-auto"><div class="flex justify-between items-end mb-6 border-b border-gray-700 pb-4"><div><h1 class="text-2xl font-bold mb-1">${champ.name}</h1><p class="text-sm text-gray-400">Stand: ${new Date().toLocaleDateString('de-DE')}</p></div></div><div class="rs-scroll overflow-x-auto rounded-lg border border-gray-700 shadow-2xl bg-gray-900"><table class="w-full text-left border-collapse whitespace-nowrap">${tableHtml}</table></div></div></body></html>`; }
function downloadChampHtml() { const content = generateChampHtmlContent(); if (!content) return; const blob = new Blob([content], { type: 'text/html' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tabelle.html`; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
function copyChampHtmlToClipboard() { const content = generateChampHtmlContent(); if (content) navigator.clipboard.writeText(content).then(() => alert("✅ HTML-Code kopiert!")); }
function sendChampToSheetFromModal() { const urlVal = document.getElementById('modalSheetUrl').value.trim(); const champ = rsDb.championships.find(c => c.id === activeChampId); if(champ && urlVal) { champ.sheetUrl = urlVal; saveDatabase(); } alert("URL gespeichert."); }
function formatDateShort(d) { if(!d) return '---'; const[y,m,day]=d.split('-'); return y?`${day}.${m}.${y.slice(-2)}`:d; }

// ==========================================
// TEIL B: RENN-MANAGER (WIZARD)
// ==========================================

const raceMgr = {
    config: { drivers: 6, lanes: 4, totalMinutes: 180, changeTime: 2, avgLapTime: 12 },
    session: { active: false, mode: null, step: 0, drivers: [], resultsTemp: {}, sprintResults: [], calculatedSettings: {} },

    showView: function(viewId) { ['rmGeneralSetup', 'rmSelectMode', 'rmSetup', 'rmActive'].forEach(id => document.getElementById(id).classList.add('hidden')); document.getElementById(viewId).classList.remove('hidden'); },
    processGeneralSetup: function() { this.config.drivers = parseInt(document.getElementById('setupDrivers').value) || 6; this.config.lanes = parseInt(document.getElementById('setupLanes').value) || 4; this.config.totalMinutes = parseInt(document.getElementById('setupTimeRange').value) || 180; this.config.avgLapTime = parseFloat(document.getElementById('setupAvgLap').value) || 10; this.calculateSuggestions(); this.showView('rmSelectMode'); },
    calculateSuggestions: function() {
        const c = this.config; const netTimeMinutes = c.totalMinutes; const lapTimeInMin = c.avgLapTime / 60;
        const numHeatsClassic = Math.ceil(c.drivers / c.lanes) * c.lanes; const changeTimeClassic = numHeatsClassic * c.changeTime; const availableRaceTimeClassic = netTimeMinutes - changeTimeClassic - 15; const timePerHeatClassic = Math.max(1, Math.floor(availableRaceTimeClassic / numHeatsClassic)); const lapsClassic = Math.floor(timePerHeatClassic / lapTimeInMin);
        document.getElementById('sugg_classic').innerHTML = `💡 Vorschlag: <b>${Math.max(10, lapsClassic)} Runden</b><br>(${numHeatsClassic} Läufe à ~${timePerHeatClassic} min)`;
        const timeQuali = 15; const racesSprint = 6; const racesMain = Math.ceil(c.drivers / c.lanes); const totalChangesProfi = (racesSprint + racesMain) * c.changeTime; const availableRunTimeProfi = netTimeMinutes - timeQuali - totalChangesProfi - 10; const timeForSprints = availableRunTimeProfi * 0.5; const timeForMain = availableRunTimeProfi * 0.5; const timePerSprint = Math.max(1, Math.floor(timeForSprints / racesSprint)); const lapsSprint = Math.floor(timePerSprint / lapTimeInMin); const timePerMain = Math.max(5, Math.floor(timeForMain / racesMain));
        document.getElementById('sugg_profi').innerHTML = `💡 Vorschlag: Sprint <b>${Math.max(5, lapsSprint)} Runden</b><br>Hauptrennen: <b>${timePerMain} min</b>`;
        const numDuels = c.drivers - 1; const changeTimeKO = numDuels * c.changeTime; const availKO = netTimeMinutes - 15 - changeTimeKO; const timePerDuel = Math.max(1, availKO / numDuels); const lapsKO = Math.floor(timePerDuel / lapTimeInMin);
        document.getElementById('sugg_ko').innerHTML = `💡 Vorschlag: <b>${Math.max(5, lapsKO)} Runden</b><br>Quali + ${numDuels} Duelle`;
        const availEndurance = netTimeMinutes - 15;
        document.getElementById('sugg_endurance').innerHTML = `💡 Vorschlag: <b>${availEndurance} min</b><br>Team-Rennen`;
        this.session.calculatedSettings = { classicLaps: Math.max(10, lapsClassic), sprintLaps: Math.max(5, lapsSprint), mainTime: timePerMain, koLaps: Math.max(5, lapsKO), enduranceTime: availEndurance };
    },
    selectMode: function(mode) { this.session.mode = mode; const titles = { 'classic': 'Classic Cup', 'profi': 'Profi GT124', 'ko': 'K.O. Turnier', 'endurance': 'Endurance' }; document.getElementById('rmSetupTitle').textContent = titles[mode]; const s = this.session.calculatedSettings; let summary = ""; if(mode === 'classic') summary = `Fahren auf Runden: ${s.classicLaps} Runden pro Lauf.`; if(mode === 'profi') summary = `Quali (15m) -> Sprint (${s.sprintLaps} Rd.) -> Main (${s.mainTime} min).`; if(mode === 'ko') summary = `Quali -> K.O. Duelle über ${s.koLaps} Runden.`; if(mode === 'endurance') summary = `Langstrecke über ${s.enduranceTime} Minuten.`; document.getElementById('rmSetupSummary').textContent = summary; this.renderDriverSelection(); this.showView('rmSetup'); },
    renderDriverSelection: function() { const container = document.getElementById('rmDriverSelection'); container.innerHTML = ''; document.getElementById('driverCountLabel').textContent = this.config.drivers; for(let i=1; i<=this.config.drivers; i++) { const div = document.createElement('div'); div.className = "flex items-center gap-2 bg-gray-800 p-2 rounded hover:bg-gray-700"; div.innerHTML = `<input type="checkbox" value="Fahrer ${i}" checked class="w-4 h-4 rounded border-gray-500 text-green-600 focus:ring-green-500"><span class="text-sm text-gray-200">Fahrer ${i}</span>`; container.appendChild(div); } },
    addGuestDriver: function() { const input = document.getElementById('rmNewDriverName'); const name = input.value.trim(); if(!name) return; const container = document.getElementById('rmDriverSelection'); const div = document.createElement('div'); div.className = "flex items-center gap-2 bg-gray-800 p-2 rounded"; div.innerHTML = `<input type="checkbox" value="${name}" checked class="w-4 h-4 text-green-600 rounded"><span class="text-sm">${name}</span>`; container.appendChild(div); input.value = ''; },
    startSession: function() { const checkboxes = document.querySelectorAll('#rmDriverSelection input[type="checkbox"]:checked'); const selectedDrivers = Array.from(checkboxes).map(cb => cb.value); if(selectedDrivers.length < 2) return alert("Zu wenig Fahrer!"); this.session.active = true; this.session.drivers = selectedDrivers; this.session.step = 1; this.showView('rmActive'); this.runStep(); },
    abortSession: function() { if(confirm("Wirklich abbrechen?")) { this.session.active = false; this.showView('rmSelectMode'); } },
    runStep: function() {
        const mode = this.session.mode; const step = this.session.step; const s = this.session.calculatedSettings;
        const content = document.getElementById('rmDynamicContent'); const title = document.getElementById('rmPhaseTitle'); const sub = document.getElementById('rmPhaseSubtitle'); const status = document.getElementById('rmStatusMsg'); content.innerHTML = '';

        if (mode === 'profi') {
            if (step === 1) {
                title.textContent = "Phase 1: Qualifikation"; sub.textContent = `15 min Zeit. Jeder fährt Bestzeit.`; status.textContent = "Bestzeiten eintragen für Startaufstellung.";
                let html = `<div class="grid grid-cols-1 gap-2">`;
                this.session.drivers.forEach((d,i) => { html += `<div class="flex justify-between items-center bg-gray-800 p-3 rounded border border-gray-700"><span class="font-bold text-white w-1/3">${d}</span><input type="number" step="0.001" id="time_${i}" placeholder="0.000" class="bg-gray-900 text-yellow-400 font-mono p-2 rounded border border-gray-600 w-32 text-right"></div>`; });
                html += `</div>`; content.innerHTML = html;
            } else if (step >= 2 && step <= 7) {
                const sprintNum = step - 1; title.textContent = `Phase 2: Sprint ${sprintNum}/6`; sub.textContent = `Zieldistanz: ${s.sprintLaps} Runden.`; status.textContent = "Ergebnis eintragen (Reihenfolge).";
                const rotation = (sprintNum - 1) % this.session.drivers.length; const currentGrid = [...this.session.drivers]; for(let k=0; k<rotation; k++) currentGrid.push(currentGrid.shift());
                let html = `<div class="mb-6 p-3 bg-blue-900/20 border border-blue-800 rounded text-center"><h4 class="text-xs uppercase text-blue-400 font-bold mb-2">Startaufstellung (Rotation)</h4><div class="flex flex-wrap justify-center gap-2">${currentGrid.map((d,i)=>`<span class="bg-gray-800 px-2 py-1 rounded text-sm"><span class="text-gray-500 text-xs">${i+1}.</span> ${d}</span>`).join('')}</div></div>`;
                html += `<h4 class="text-white mb-2 font-bold">Zieleinlauf eingeben:</h4><div class="grid grid-cols-1 gap-2">`;
                for(let i=1; i<=this.session.drivers.length; i++) { html += `<div class="flex items-center gap-2"><span class="text-gray-500 w-6 text-right font-mono">${i}.</span><select class="w-full bg-gray-700 text-white p-2 rounded"><option>-- Wähle Fahrer --</option>${this.session.drivers.map(d=>`<option>${d}</option>`).join('')}</select></div>`; }
                html += `</div>`; content.innerHTML = html;
            } else if (step === 8) {
                title.textContent = "Phase 3: Hauptrennen"; sub.textContent = `Dauer: ${s.mainTime} Minuten pro Gruppe.`; status.textContent = "Zeit-Rennen starten und Runden zählen.";
                content.innerHTML = `<div class="text-center p-8 bg-gray-800 rounded border border-gray-600"><div class="text-6xl mb-4">🏁</div><p class="text-xl text-white mb-2">Finale Phase!</p><p class="text-gray-400">Fahre nun die Gruppenrennen nach Zeit.<br>Vergiss nicht die <b>2 min Wechselzeit</b> zwischen den Gruppen.</p></div>`;
                document.getElementById('rmNextBtn').textContent = "Abend abschließen";
            }
        } else if (mode === 'classic') {
            const totalHeats = this.session.drivers.length;
             if (step <= totalHeats) {
                title.textContent = `Lauf ${step} von ${totalHeats}`; sub.textContent = `Distanz: ${s.classicLaps} Runden.`; status.textContent = "Fahren und Ergebnis notieren.";
                content.innerHTML = `<div class="text-center text-gray-400 py-10">Lauf ${step} aktiv.<br>Zieleinlauf-Maske hier...</div>`;
            } else {
                title.textContent = "Ergebnis"; content.innerHTML = `<div class="text-center text-green-400 font-bold text-2xl">Rennabend beendet!</div>`; document.getElementById('rmNextBtn').textContent = "Beenden";
            }
        }
    },
    nextStep: function() {
        this.session.step++;
        if (this.session.mode === 'profi' && this.session.step > 8) { this.session.active = false; this.showView('rmSelectMode'); alert("Rennabend beendet!"); } else { this.runStep(); }
    }
};
window.raceMgr = raceMgr;