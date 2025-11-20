const ICON_EDIT = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>`;
const ICON_TRASH = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>`;

let currentSort = { type: null, field: null, dir: 'asc' };

// Helper
function formatDateShort(d) { if(!d) return '---'; const[y,m,day]=d.split('-'); return y?`${day}.${m}.${y.slice(-2)}`:d; }

// Navigation Logic
function showMainTab(tab) {
    ['logbuch', 'dyno', 'championship'].forEach(t => {
        const btn = document.getElementById(`main-tab-${t}`);
        const content = document.getElementById(`main-content-${t}`);
        const subNav = document.getElementById(`sub-nav-${t}`);
        
        if(btn) btn.className = t === tab ? 'main-tab-button active py-3 px-4 font-bold text-lg' : 'main-tab-button inactive py-3 px-4 font-bold text-lg';
        if(content) content.className = t === tab ? 'main-content-area active' : 'main-content-area inactive';
        if(subNav) {
            if(t === tab) subNav.classList.remove('hidden');
            else subNav.classList.add('hidden');
        }
    });
    document.getElementById('connectionControls').className = tab==='dyno'?'flex gap-2':'hidden';
    document.getElementById('statusTextWrapper').className = tab==='dyno'?'mb-6':'hidden';
}

function showSubTab(main, sub) {
    let tabs = [];
    if (main === 'logbuch') tabs = ['events','strecken','autos','motoren'];
    else if (main === 'dyno') tabs = ['live','dyno','settings'];
    else if (main === 'championship') tabs = ['standings','manager'];

    tabs.forEach(t => {
        document.getElementById(`tab-${t}`).className = t===sub ? 'tab-button active py-2 px-2 rounded-md font-semibold text-xs md:text-sm' : 'tab-button inactive py-2 px-2 rounded-md font-semibold text-xs md:text-sm';
        document.getElementById(`content-${t}`).className = t===sub ? 'tab-content active' : 'tab-content inactive';
    });
    if(sub==='live') initLiveChart();
    if(sub==='dyno') initDynoChart();
    if(main==='championship') initChampionship();
}

// Init Listeners
window.onload = () => {
    initDatabase();
    
    // Logbuch Initialisierung (aus logbook.js)
    initLogbookUI();
    
    // Dyno Initialisierung (aus dyno.js)
    initDynoUI();
    
    showMainTab('logbuch');

    // CSV Import Listener
    document.getElementById('csvImportInput').onchange=(e)=>{
        const f=e.target.files[0];
        if(!f)return;
        Papa.parse(f,{header:true,skipEmptyLines:true,complete:(r)=>{
            r.data.forEach((row,i)=>{
                const id=`${currentCsvImportType}_${Date.now()}_${i}`;
                if(currentCsvImportType==='events') rsDb.events.push({id, ...row});
                else rsDb[currentCsvImportType].push({id, ...row});
            });
            saveDatabase(); location.reload();
        }});
    };

    // Backup Import Listener
    document.getElementById('jsonImportButton').onclick=()=>{document.getElementById('jsonImportInput').click();};
    document.getElementById('jsonExportButton').onclick=()=>{const b=new Blob([JSON.stringify(rsDb)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='backup.json';a.click();};
    document.getElementById('jsonImportInput').onchange=(e)=>{const r=new FileReader();r.onload=(ev)=>{rsDb=JSON.parse(ev.target.result);saveDatabase();location.reload();};r.readAsText(e.target.files[0]);};
};