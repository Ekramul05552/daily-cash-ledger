const ledgerBody = document.getElementById('ledgerBody');
// Your updated Web App URL
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxHQafyiMh0qwkWbsW2lijwuJkRfgMMReNHLeS21Fef_zqt1RLRO9NV0HY-ja2mTZTS/exec';
let myChart;

// 1. Functional Search Bar
document.getElementById('searchInput').addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const rows = ledgerBody.querySelectorAll('tr');
    const isClientLedger = window.location.pathname.includes('client-ledger.html');
    
    rows.forEach(row => {
        if (isClientLedger) {
            const name = row.cells[0].querySelector('input').value.toLowerCase();
            const address = row.cells[1].querySelector('input').value.toLowerCase();
            const date = row.cells[2].querySelector('input').value.toLowerCase();
            const roadCarrier = row.cells[3].querySelector('input').value.toLowerCase();
            const receivedBy = row.cells[4].querySelector('input').value.toLowerCase();
            
            const match = name.includes(term) || address.includes(term) || date.includes(term) || roadCarrier.includes(term) || receivedBy.includes(term);
            row.style.display = match ? '' : 'none';
        } else {
            const particularInput = row.querySelector('.p-input');
            const remarkInput = row.querySelector('.remark-input');
            const particular = particularInput ? particularInput.value.toLowerCase() : "";
            const remark = remarkInput ? remarkInput.value.toLowerCase() : "";
            const date = row.cells[0].querySelector('input').value.toLowerCase();
            
            const match = particular.includes(term) || remark.includes(term) || date.includes(term);
            row.style.display = match ? '' : 'none';
        }
    });
});

// 2. Excel Export
function downloadExcel() {
    let csv = [];
    const rows = document.querySelectorAll("table tr");
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].style.display !== 'none') {
            let row = [], cols = rows[i].querySelectorAll("td, th");
            for (let j = 0; j < cols.length; j++) {
                if (j === 8) continue; // Skip actions column
                let data = "";
                const input = cols[j].querySelector("input");
                data = input ? input.value : cols[j].innerText.replace(/৳|,/g, "");
                row.push('"' + data.toString().replace(/"/g, '""') + '"');
            }
            csv.push(row.join(","));
        }
    }
    const csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
    const downloadLink = document.createElement("a");
    downloadLink.download = `EME_AIR_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.click();
}

// 3. Mini Invoice (Money Receipt)
function printRowInvoice(btn) {
    const row = btn.closest('tr');
    const desc = row.querySelector('.p-input').value;
    const cin = row.querySelector('.cashIn').value;
    const date = row.cells[0].querySelector('input').value;
    const remark = row.querySelector('.remark-input').value || "Service Payment";
    const serial = "EI-" + Math.floor(100000 + Math.random() * 900000);

    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>Receipt - EME AIR INTERNATIONAL</title>
        <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; background: #fff; }
            .receipt { border: 2px solid #1e293b; padding: 40px; width: 100%; box-sizing: border-box; border-radius: 8px; min-height: 250mm; position: relative; }
            .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 20px; }
            .header img { height: 80px; margin-bottom: 10px; }
            .title { font-size: 28px; font-weight: 800; text-decoration: underline; margin-top: 10px; }
            .details { margin: 60px 0; font-size: 22px; line-height: 3; }
            .line { border-bottom: 1.5px dotted #64748b; font-weight: 600; padding: 0 10px; min-width: 250px; display: inline-block; }
            .amount-box { border: 3px solid #1e293b; display: inline-block; padding: 15px 40px; font-size: 32px; font-weight: 800; background: #f8fafc; margin-top: 20px; }
            .footer { margin-top: 120px; display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; }
            .sign-area { border-top: 2px solid #000; width: 220px; text-align: center; padding-top: 10px; }
            .no-print-btn { background: #2563eb; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; margin-top: 20px; }
            @media print { .no-print { display: none !important; } }
        </style></head><body>
            <div class="receipt">
                <div class="header">
                    <img src="assets/logo.png" onerror="this.style.display='none'">
                    <div class="title">MONEY RECEIPT</div>
                    <p style="font-size: 18px;">Serial No: <b>${serial}</b></p>
                </div>
                <div class="details">
                    Date: <span class="line" contenteditable="true">${date}</span><br>
                    Received From: <span class="line" contenteditable="true">${desc}</span><br>
                    Client Name: <span class="line" contenteditable="true"></span><br>
                    Client Number: <span class="line" contenteditable="true"></span><br>
                    Purpose of Payment: <span class="line" contenteditable="true">${remark}</span>
                </div>
                <div class="amount-box">TOTAL BDT: ৳<span contenteditable="true">${parseFloat(cin).toLocaleString()}</span></div>
                <div class="footer">
                    <div class="sign-area" contenteditable="true">Customer Signature</div>
                    <div class="sign-area" contenteditable="true">Authorized Seal & Sign</div>
                </div>
            </div>
            <div style="text-align:center;" class="no-print">
                <button class="no-print-btn" onclick="window.print()">Click to Print Receipt</button>
            </div>
        </body></html>
    `);
    win.document.close();
}

// 4. Cloud Sync Logic
async function syncToCloud(isAuto = false) {
    const status = document.getElementById('saveStatus');
    const saveBtn = document.getElementById('saveLedger');
    const month = document.getElementById('monthPicker') ? document.getElementById('monthPicker').value : new Date().toISOString().slice(0, 7);
    const isClientLedger = window.location.pathname.includes('client-ledger.html');

    if(!isAuto) {
        status.innerText = "⏳ Syncing to Cloud...";
        status.style.color = "#2563eb";
        saveBtn.innerHTML = "⌛ Saving...";
    }

    const rows = [];
    ledgerBody.querySelectorAll('tr').forEach(tr => {
        if (isClientLedger) {
            rows.push({
                name: tr.cells[0].querySelector('input').value,
                address: tr.cells[1].querySelector('input').value,
                date: tr.cells[2].querySelector('input').value,
                roadCarrier: tr.cells[3].querySelector('input').value,
                receivedBy: tr.cells[4].querySelector('input').value,
                billAmount: tr.cells[5].querySelector('input').value,
                receive: tr.cells[6].querySelector('input').value,
                travelDate: tr.cells[7].querySelector('input').value
            });
        } else {
            rows.push({
                date: tr.cells[0].querySelector('input').value,
                particular: tr.cells[1].querySelector('input').value,
                cashIn: tr.cells[2].querySelector('input').value,
                cashOut: tr.cells[3].querySelector('input').value,
                balance: tr.cells[4].innerText.replace('৳','').replace(/,/g,''),
                remark: tr.cells[5].querySelector('input').value
            });
        }
    });

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ month, rows, type: isClientLedger ? 'client' : 'main' })
        });

        if(!isAuto) {
            const now = new Date().toLocaleTimeString();
            status.innerText = `✅ Last Synced: ${now}`;
            status.style.color = "#059669";
            saveBtn.innerHTML = "💾 Save Cloud";
        }
    } catch (e) {
        console.error(e);
        if(!isAuto) {
            status.innerText = "❌ Sync Failed";
            status.style.color = "#dc2626";
            saveBtn.innerHTML = "💾 Save Cloud";
        }
    }
}

async function loadFromCloud() {
    const status = document.getElementById('saveStatus');
    const month = document.getElementById('monthPicker') ? document.getElementById('monthPicker').value : new Date().toISOString().slice(0, 7);
    const isClientLedger = window.location.pathname.includes('client-ledger.html');
    status.innerText = "📂 Loading...";
    try {
        const res = await fetch(`${WEB_APP_URL}?month=${month}&type=${isClientLedger ? 'client' : 'main'}`);
        const data = await res.json();
        if(data && data.length > 0) {
            ledgerBody.innerHTML = "";
            data.forEach(r => addRow(r));
            status.innerText = "✅ Data Loaded";
        } else {
            status.innerText = "ℹ️ No data for this month";
        }
    } catch (e) {
        status.innerText = "❌ Load failed";
        console.error(e);
    }
}

// 5. Calculation Logic
function calculateLedger() {
    const isClientLedger = window.location.pathname.includes('client-ledger.html');
    if (isClientLedger) {
        let totalBilled = 0, totalReceived = 0, totalDue = 0;
        ledgerBody.querySelectorAll('tr').forEach(row => {
            const billAmount = parseFloat(row.cells[5].querySelector('input').value) || 0;
            const receive = parseFloat(row.cells[6].querySelector('input').value) || 0;
            totalBilled += billAmount;
            totalReceived += receive;
            totalDue += (billAmount - receive);
        });
        document.getElementById('totalIn').innerText = '৳' + totalBilled.toLocaleString();
        document.getElementById('totalOut').innerText = '৳' + totalReceived.toLocaleString();
        document.getElementById('netBalance').innerText = '৳' + totalDue.toLocaleString();
        
        const netCard = document.getElementById('netCard');
        totalDue < 0 ? netCard.classList.add('negative-bal') : netCard.classList.remove('negative-bal');
    } else {
        let tIn = 0, tOut = 0, bal = 0;
        ledgerBody.querySelectorAll('tr').forEach(row => {
            const cin = parseFloat(row.querySelector('.cashIn').value) || 0;
            const cout = parseFloat(row.querySelector('.cashOut').value) || 0;
            tIn += cin; tOut += cout; bal += (cin - cout);
            row.querySelector('.balance-col').innerText = '৳' + bal.toLocaleString();
        });
        document.getElementById('totalIn').innerText = '৳' + tIn.toLocaleString();
        document.getElementById('totalOut').innerText = '৳' + tOut.toLocaleString();
        document.getElementById('netBalance').innerText = '৳' + bal.toLocaleString();
        
        const netCard = document.getElementById('netCard');
        if (netCard) bal < 0 ? netCard.classList.add('negative-bal') : netCard.classList.remove('negative-bal');
        updateChart(tIn, tOut);
    }
}

function updateChart(tIn, tOut) {
    const chartCanvas = document.getElementById('categoryChart');
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['In', 'Out'], datasets: [{ data: [tIn, tOut], backgroundColor: ['#059669', '#dc2626'] }] },
        options: { maintainAspectRatio: false }
    });
}

// 6. Table UI Controls (With Fixed Date Issue)
function addRow(data = {}) {
    const isClientLedger = window.location.pathname.includes('client-ledger.html');
    const row = document.createElement('tr');
    
    // HTML5 date inputs require YYYY-MM-DD string format
    const defaultDate = new Date().toISOString().split('T')[0];
    const rowDate = data.date ? data.date : defaultDate;
    const travelDate = data.travelDate ? data.travelDate : "";

    if (isClientLedger) {
        row.innerHTML = `
            <td><input type="text" value="${data.name || ''}"></td>
            <td><input type="text" value="${data.address || ''}"></td>
            <td><input type="date" value="${rowDate}"></td>
            <td><input type="text" value="${data.roadCarrier || ''}"></td>
            <td><input type="text" value="${data.receivedBy || ''}"></td>
            <td><input type="number" value="${data.billAmount || 0}"></td>
            <td><input type="number" value="${data.receive || 0}"></td>
            <td><input type="date" value="${travelDate}"></td>
            <td class="no-print"><button onclick="this.closest('tr').remove(); calculateLedger();" class="btn-del">×</button></td>
        `;
    } else {
        row.innerHTML = `
            <td><input type="date" value="${rowDate}"></td>
            <td><input type="text" class="p-input" value="${data.particular || ''}"></td>
            <td><input type="number" class="cashIn" value="${data.cashIn || 0}"></td>
            <td><input type="number" class="cashOut" value="${data.cashOut || 0}"></td>
            <td class="balance-col" style="font-weight:700;">৳0</td>
            <td><input type="text" class="remark-input" value="${data.remark || ''}"></td>
            <td class="no-print"><button onclick="printRowInvoice(this)" class="btn-inv">📄</button>
            <button onclick="this.closest('tr').remove(); calculateLedger();" class="btn-del">×</button></td>
        `;
    }
    row.addEventListener('input', calculateLedger);
    ledgerBody.appendChild(row);
    calculateLedger();
}

function toggleDarkMode() {
    const body = document.documentElement;
    const isDark = body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.innerText = newTheme === 'dark' ? '☀️' : '🌙';
}

// 7. Init & Events
const saveBtn = document.getElementById('saveLedger');
if (saveBtn) saveBtn.addEventListener('click', () => syncToCloud());

const loadBtn = document.getElementById('loadLedger');
if (loadBtn) loadBtn.addEventListener('click', loadFromCloud);

const usdInput = document.getElementById('usdInput');
if (usdInput) {
    usdInput.addEventListener('input', () => {
        const rate = parseFloat(document.getElementById('rateInput').value) || 122;
        const res = (parseFloat(usdInput.value) || 0) * rate;
        document.getElementById('bdtResult').innerText = '৳' + res.toLocaleString();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if(ledgerBody.rows.length === 0) addRow();
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('themeToggle');
    if(themeBtn && savedTheme === 'dark') themeBtn.innerText = '☀️';
    
    // Auto-sync every 5 minutes
    setInterval(() => syncToCloud(true), 300000); 
});

function applyTemplate(p, ci, co, r) { addRow({particular: p, cashIn: ci, cashOut: co, remark: r}); }
function ticketSalePrompt() { const air = prompt("Airline:"); if(air) addRow({particular: `Ticket Sale - ${air.toUpperCase()}`, remark: "Booking"}); }