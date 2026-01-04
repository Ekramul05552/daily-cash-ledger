const ledgerBody = document.getElementById('ledgerBody');
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz8wlf-Q4-x3Lm5Wb2a3ZpX8hgOUQgdTioxgzEyJcg3QegkCzIGoIQPjGfxisI-35X1/exec';

// --- 1. THEME & CONVERTER LOGIC ---

// Persistent Dark Mode
function initTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerText = '☀️';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('themeToggle').innerText = isDark ? '☀️' : '🌙';
}

// Mini Currency Converter
const usdIn = document.getElementById('usdInput');
const rateIn = document.getElementById('rateInput');
const bdtRes = document.getElementById('bdtResult');

function convertCurrency() {
    const val = (parseFloat(usdIn.value) || 0) * (parseFloat(rateIn.value) || 0);
    bdtRes.innerText = '৳' + val.toLocaleString();
}
usdIn.addEventListener('input', convertCurrency);
rateIn.addEventListener('input', convertCurrency);


// --- 2. LEDGER CORE LOGIC ---

function calculateLedger() {
    let tBill = 0, tRec = 0;
    ledgerBody.querySelectorAll('tr').forEach(row => {
        const ins = row.querySelectorAll('input');
        const bill = parseFloat(ins[5].value) || 0; // 6th input: Bill Amount
        const rec = parseFloat(ins[6].value) || 0;  // 7th input: Receive
        tBill += bill; tRec += rec;
    });

    document.getElementById('totalIn').innerText = '৳' + tBill.toLocaleString();
    document.getElementById('totalOut').innerText = '৳' + tRec.toLocaleString();
    const balance = tBill - tRec;
    document.getElementById('netBalance').innerText = '৳' + balance.toLocaleString();

    // Style the Balance Card
    const netCard = document.getElementById('netCard');
    if (balance > 0) {
        netCard.style.borderLeft = "5px solid #ef4444";
        netCard.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
    } else {
        netCard.style.borderLeft = "5px solid #10b981";
        netCard.style.backgroundColor = "rgba(16, 185, 129, 0.1)";
    }
}

function addRow(data = {}) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" value="${data.name || ''}" placeholder="Client Name"></td>
        <td><input type="text" value="${data.address || ''}" placeholder="Address"></td>
        <td><input type="date" value="${data.date || ''}"></td>
        <td><input type="text" value="${data.carrier || ''}" placeholder="Road/Carrier"></td>
        <td><input type="text" value="${data.receivedBy || ''}" placeholder="Received By"></td>
        <td><input type="number" value="${data.bill || 0}" oninput="calculateLedger()"></td>
        <td><input type="number" value="${data.receive || 0}" oninput="calculateLedger()"></td>
        <td><input type="date" value="${data.travelDate || ''}"></td>
        <td class="no-print">
            <button onclick="this.closest('tr').remove(); calculateLedger();" class="btn-del" style="background:none; border:none; cursor:pointer; font-size:18px;">❌</button>
        </td>
    `;
    ledgerBody.appendChild(row);
    calculateLedger();
}

// --- 3. CLOUD SYNC LOGIC ---

async function syncToCloud() {
    // We use the Name from the first row as the Sheet Title
    const firstRowName = ledgerBody.querySelector('tr input')?.value;
    const month = document.getElementById('monthPicker').value;

    if (!firstRowName) return alert("Please enter a Client Name in the first row.");

    const status = document.getElementById('saveStatus');
    status.innerText = "⏳ Saving to Cloud...";

    const rows = Array.from(ledgerBody.querySelectorAll('tr')).map(tr => {
        const ins = tr.querySelectorAll('input');
        return {
            name: ins[0].value,
            address: ins[1].value,
            date: ins[2].value,
            carrier: ins[3].value,
            receivedBy: ins[4].value,
            bill: ins[5].value,
            receive: ins[6].value,
            travelDate: ins[7].value
        };
    });

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ type: 'save', client: firstRowName, monthYear: month, rows })
        });
        status.innerText = "✅ Successfully Saved: " + firstRowName;
    } catch (e) {
        status.innerText = "❌ Connection Error";
        console.error(e);
    }
}

async function loadFromCloud() {
    const name = prompt("Enter Client Name to Load:");
    const month = document.getElementById('monthPicker').value;
    if (!name) return;

    const status = document.getElementById('saveStatus');
    status.innerText = "📂 Searching Cloud...";

    try {
        const res = await fetch(`${WEB_APP_URL}?client=${encodeURIComponent(name)}&monthYear=${month}`);
        const data = await res.json();
        
        ledgerBody.innerHTML = "";
        if (data && data.length > 0) {
            data.forEach(r => addRow(r));
            status.innerText = "✅ Data Loaded for " + name;
        } else {
            status.innerText = "ℹ️ No records found for " + name + " this month.";
        }
    } catch (e) {
        status.innerText = "❌ Load Failed.";
    }
}

// Initialize on load
initTheme();