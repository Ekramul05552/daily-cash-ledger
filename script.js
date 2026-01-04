const ledgerBody = document.getElementById('ledgerBody');
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxfB9lqVwec4DdRP54S1yFKwT8yzJAqIa6PvwdRgr4nav5OOV4UPuPeWWp-J6iTmxgw/exec';
let myChart;

// FIXED: This function now prevents the "one day off" time zone bug
function formatDateForInput(dateVal) {
    if (!dateVal) return "";
    
    let d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";

    // Adjust for time zone offset to ensure the date stays on the correct day
    const offset = d.getTimezoneOffset();
    d = new Date(d.getTime() - (offset * 60 * 1000));
    return d.toISOString().split('T')[0];
}

// 1. Functional Search
document.getElementById('searchInput').addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    ledgerBody.querySelectorAll('tr').forEach(row => {
        const text = Array.from(row.querySelectorAll('input')).map(i => i.value).join(" ").toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
});

// 2. Cloud Operations
async function syncToCloud(isAuto = false) {
    const status = document.getElementById('saveStatus');
    const month = document.getElementById('monthPicker')?.value || new Date().toISOString().slice(0, 7);
    const isClient = window.location.pathname.includes('client-ledger.html');
    if(!isAuto) status.innerText = "⏳ Syncing...";

    const rows = Array.from(ledgerBody.querySelectorAll('tr')).map(tr => {
        const ins = tr.querySelectorAll('input');
        return isClient ? {
            name: ins[0].value, address: ins[1].value, date: ins[2].value,
            roadCarrier: ins[3].value, receivedBy: ins[4].value, 
            billAmount: ins[5].value, receive: ins[6].value, travelDate: ins[7].value
        } : {
            date: ins[0].value, particular: ins[1].value, cashIn: ins[2].value,
            cashOut: ins[3].value, balance: tr.cells[4].innerText.replace(/[৳,]/g,''), remark: ins[4].value
        };
    });

    try {
        await fetch(WEB_APP_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ month, rows, type: isClient ? 'client' : 'main' })});
        if(!isAuto) status.innerText = `✅ Saved: ${new Date().toLocaleTimeString()}`;
    } catch (e) { status.innerText = "❌ Sync Failed"; }
}

async function loadFromCloud() {
    const status = document.getElementById('saveStatus');
    const month = document.getElementById('monthPicker')?.value || new Date().toISOString().slice(0, 7);
    const isClient = window.location.pathname.includes('client-ledger.html');
    status.innerText = "📂 Loading...";
    try {
        const res = await fetch(`${WEB_APP_URL}?month=${month}&type=${isClient ? 'client' : 'main'}`);
        const data = await res.json();
        ledgerBody.innerHTML = "";
        if(data.length > 0) {
            data.forEach(r => addRow(r));
            status.innerText = "✅ Data Loaded";
        } else {
            status.innerText = "ℹ️ No data found";
            addRow();
        }
    } catch (e) { status.innerText = "❌ Load failed"; }
}

// 3. UI Logic
function addRow(data = {}) {
    const isClient = window.location.pathname.includes('client-ledger.html');
    const row = document.createElement('tr');
    const today = new Date().toISOString().split('T')[0];
    
    if (isClient) {
        row.innerHTML = `
            <td><input type="text" value="${data.name || ''}"></td>
            <td><input type="text" value="${data.address || ''}"></td>
            <td><input type="date" value="${formatDateForInput(data.date) || today}"></td>
            <td><input type="text" value="${data.roadCarrier || ''}"></td>
            <td><input type="text" value="${data.receivedBy || ''}"></td>
            <td><input type="number" value="${data.billAmount || 0}"></td>
            <td><input type="number" value="${data.receive || 0}"></td>
            <td><input type="date" value="${formatDateForInput(data.travelDate) || ''}"></td>
            <td class="no-print"><button onclick="this.closest('tr').remove(); calculateLedger();">×</button></td>`;
    } else {
        row.innerHTML = `
            <td><input type="date" value="${formatDateForInput(data.date) || today}"></td>
            <td><input type="text" class="p-input" value="${data.particular || ''}"></td>
            <td><input type="number" class="cashIn" value="${data.cashIn || 0}"></td>
            <td><input type="number" class="cashOut" value="${data.cashOut || 0}"></td>
            <td class="balance-col" style="font-weight:700;">৳0</td>
            <td><input type="text" class="remark-input" value="${data.remark || ''}"></td>
            <td class="no-print"><button onclick="printRowInvoice(this)">📄</button>
            <button onclick="this.closest('tr').remove(); calculateLedger();">×</button></td>`;
    }
    row.addEventListener('input', calculateLedger);
    ledgerBody.appendChild(row);
    calculateLedger();
}

function calculateLedger() {
    const isClient = window.location.pathname.includes('client-ledger.html');
    let tIn = 0, tOut = 0, bal = 0;
    ledgerBody.querySelectorAll('tr').forEach(row => {
        const ins = row.querySelectorAll('input');
        if (isClient) {
            const bill = parseFloat(ins[5].value) || 0, rec = parseFloat(ins[6].value) || 0;
            tIn += bill; tOut += rec; bal += (bill - rec);
        } else {
            const cin = parseFloat(ins[2].value) || 0, cout = parseFloat(ins[3].value) || 0;
            tIn += cin; tOut += cout; bal += (cin - cout);
            row.querySelector('.balance-col').innerText = '৳' + bal.toLocaleString();
        }
    });
    document.getElementById('totalIn').innerText = '৳' + tIn.toLocaleString();
    document.getElementById('totalOut').innerText = '৳' + tOut.toLocaleString();
    document.getElementById('netBalance').innerText = '৳' + bal.toLocaleString();
}

// 4. Initialization
document.getElementById('saveLedger').addEventListener('click', () => syncToCloud());
document.getElementById('loadLedger').addEventListener('click', loadFromCloud);
document.addEventListener('DOMContentLoaded', () => { if(ledgerBody.rows.length === 0) addRow(); });