// Globals
let webSocket = null;
const WEBSOCKET_URL = "ws://192.168.4.1/ws";
let dynoChartInstance = null, liveRpmChartInstance = null;
let dynoChartInitialized = false, liveChartInitialized = false;
let dynoData = { labels: [], rpm: [], torque: [], power: [], peakPower: 0, peakTorque: 0 };
let liveRpmData = { labels: [], data: [] };
const chartOpts = { plugins: { legend: { labels: { color: 'white' } } }, scales: { x: { ticks: { color: 'white' }, grid: { color: '#ffffff20' } }, y: { ticks: { color: 'white' }, grid: { color: '#ffffff20' } } } };

function initDynoUI() {
    loadSettings();
    
    document.getElementById('saveSettingsButton').onclick=()=>{
        rsDb.einstellungen={gearRitzel:document.getElementById('settingGearRitzel').value,gearKranz:document.getElementById('settingGearKranz').value,tireDiameter:document.getElementById('settingTireDiameter').value};
        saveDatabase();alert("Gespeichert");
    };
    
    document.getElementById('cancelDynoSaveButton').addEventListener('click', () => document.getElementById('dynoSaveModal').style.display = 'none');
    
    ['settingGearRitzel','settingGearKranz','settingTireDiameter','manualRollerRpm'].forEach(i=>document.getElementById(i).addEventListener('input',calc));
    calc();

    // WebSocket Connect Button Logic (Placeholder for now, connects to existing HTML)
    const connectButton = document.getElementById('connectButton');
    // ... Rest of WebSocket logic resides here typically ...
}

function loadSettings(){if(rsDb.einstellungen){document.getElementById('settingGearRitzel').value=rsDb.einstellungen.gearRitzel;document.getElementById('settingGearKranz').value=rsDb.einstellungen.gearKranz;document.getElementById('settingTireDiameter').value=rsDb.einstellungen.tireDiameter;}}

function calc() {
    const rpm = parseFloat(document.getElementById('rpmValue').textContent)||0;
    const r = parseFloat(document.getElementById('settingGearRitzel').value);
    const k = parseFloat(document.getElementById('settingGearKranz').value);
    const d = parseFloat(document.getElementById('settingTireDiameter').value);
    const manRpm = parseFloat(document.getElementById('manualRollerRpm').value);
    if(r>0 && k>0 && d>0) document.getElementById('rolloutValue').textContent = ((d * Math.PI) / (k/r)).toFixed(2);
    if(d>0) document.getElementById('calculatedKmhValue').textContent = ((rpm/60)*(d/1000)*Math.PI*3.6).toFixed(1);
    if(r>0 && k>0 && manRpm>0) document.getElementById('calculatedMotorRpm').textContent = (manRpm * (k/r)).toFixed(0);
}

function initDynoChart() { if(dynoChartInitialized)return; const ctx=document.getElementById('dynoChart').getContext('2d'); dynoChartInstance=new Chart(ctx,{type:'line',data:{datasets:[{label:'Power (W)',data:[],borderColor:'#34D399',yAxisID:'yP'},{label:'Torque (mNm)',data:[],borderColor:'#F87171',yAxisID:'yT'}]},options:{...chartOpts,scales:{...chartOpts.scales,yP:{position:'left',ticks:{color:'white'}},yT:{position:'right',grid:{drawOnChartArea:false},ticks:{color:'white'}} } }}); dynoChartInitialized=true; }
function initLiveChart() { if(liveChartInitialized)return; const ctx=document.getElementById('liveRpmChart').getContext('2d'); liveRpmChartInstance=new Chart(ctx,{type:'line',data:{labels:Array(60).fill(''),datasets:[{label:'RPM',data:Array(60).fill(null),borderColor:'#60A5FA',pointRadius:0}]},options:{...chartOpts,scales:{x:{display:false},y:{beginAtZero:true,ticks:{color:'white'}}}}}); liveChartInitialized=true; }