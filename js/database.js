// DB Init
let rsDb = {}; 
const DB_KEY = 'rsDynoAppDatenV1';
let currentCsvImportType = null;

function initDatabase() {
    let data = localStorage.getItem(DB_KEY);
    rsDb = data ? JSON.parse(data) : { 
        version: 1, 
        einstellungen: { gearRitzel: 10, gearKranz: 40, tireDiameter: 24 }, 
        autos: [], 
        motoren: [], 
        dynoRuns: [], 
        strecken: [], 
        events: [],
        championships: [] // Hier sicherstellen, dass das Array existiert
    };
    ['autos', 'motoren', 'dynoRuns', 'strecken', 'events', 'championships'].forEach(k => { if (!rsDb[k]) rsDb[k] = []; });
    saveDatabase();
}

function saveDatabase() { localStorage.setItem(DB_KEY, JSON.stringify(rsDb)); }

// CSV Export/Import Global
window.exportToCsv = function(type) {
    let h=[], d=[];
    if(type==='events') { h=['datum','klasse','strecke','platz','bestzeit','runden','fahrzeug','motor']; d=rsDb.events.map(e=>({...e,strecke:getStreckeNameById(e.strecke),fahrzeug:getAutoBodyById(e.fahrzeug),motor:getMotorNameById(e.motor)})); }
    else if(type==='motoren') { h=['name','klasse','hersteller','rpm','maxRpm','rennen','status']; d=rsDb.motoren; }
    else if(type==='autos') { h=['klasse','chassis','karosserie','motor']; d=rsDb.autos; }
    else if(type==='strecken') { h=['name','ort','laenge']; d=rsDb.strecken; }
    
    if(!d.length) return alert("Keine Daten");
    let c = h.join(',')+'\n';
    d.forEach(r => { c += h.map(k => `"${r[k]||''}"`).join(',') + '\n'; });
    const b = new Blob(["\uFEFF"+c], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`${type}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

window.importFromCsv = function(type) { 
    if(confirm("CSV Importieren?")) { 
        currentCsvImportType=type;
        document.getElementById('csvImportInput').click(); 
    } 
}

// Helper Functions für DB-Referenzen (werden von Export und UI genutzt)
function getAutoBodyById(id) { if(!id||!id.startsWith('auto_')) return id||'---'; const i=rsDb.autos.find(x=>x.id===id); return i?i.karosserie:'---'; }
function getMotorNameById(id) { if(!id||!id.startsWith('motor_')) return id||'---'; const i=rsDb.motoren.find(x=>x.id===id); return i?i.name:'---'; }
function getStreckeNameById(id) { if(!id||!id.startsWith('strecke_')) return id||'---'; const i=rsDb.strecken.find(x=>x.id===id); return i?i.name:'---'; }