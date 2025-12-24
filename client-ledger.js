const ledgerBody = document.getElementById('ledgerBody');
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxHQafyiMh0qwkWbsW2lijwuJkRfgMMReNHLeS21Fef_zqt1RLRO9NV0HY-ja2mTZTS/exec';

// 1. Functional Search Bar
document.getElementById('searchInput').addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const rows = ledgerBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
});

// 2. Excel Export
function downloadExcel() {
    let csv = [];
    const rows = document.querySelectorAll("table tr");
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].style.display !== 'none') {
            let row = [], cols = rows[i].querySelectorAll("td, th");
            for (let j = 0; j < cols.length - 1; j++) {
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
    downloadLink.download = `EME_AIR_Client_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.click();
}

// 3. Calculation Logic for Table (Live Updates)
function calculateLedger() {
    let totalBill = 0, totalRec = 0, totalDue = 0;

    ledgerBody.querySelectorAll('tr').forEach(row => {
        const inputs = row.querySelectorAll('input');
        const bill = parseFloat(inputs[5].value) || 0;
        const rec = parseFloat(inputs[6].value) || 0;
        const due = bill - rec;

        row.querySelector('.total-col').innerText = bill.toFixed(2);
        row.querySelector('.due-balance-col').innerText = due.toFixed(2);

        totalBill += bill;
        totalRec += rec;
        totalDue += due;
    });

    document.getElementById('totalIn').innerText = '৳' + totalBill.toLocaleString();
    document.getElementById('totalOut').innerText = '৳' + totalRec.toLocaleString();
    document.getElementById('netBalance').innerText = '৳' + totalDue.toLocaleString();
}

// 4. Top Form Calculation
function calculateTopForm() {
    const bill = parseFloat(document.getElementById('clientBillAmount').value) || 0;
    const rec = parseFloat(document.getElementById('clientReceive').value) || 0;
    document.getElementById('clientTotal').value = bill.toFixed(2);
    document.getElementById('clientDueBalance').value = (bill - rec).toFixed(2);
}

// 5. Add Row Logic
function addRow() {
    const name = document.getElementById('clientName').value;
    const bill = document.getElementById('clientBillAmount').value;
    
    if(!name || !bill) {
        alert("Please enter at least a Name and Bill Amount");
        return;
    }

    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" value="${name}"></td>
        <td><input type="text" value="${document.getElementById('clientAddress').value}"></td>
        <td><input type="date" value="${document.getElementById('clientDate').value}"></td>
        <td><input type="text" value="${document.getElementById('clientRoadCarrier').value}"></td>
        <td><input type="text" value="${document.getElementById('clientReceivedBy').value}"></td>
        <td><input type="number" value="${bill}" oninput="calculateLedger()"></td>
        <td><input type="number" value="${document.getElementById('clientReceive').value || 0}" oninput="calculateLedger()"></td>
        <td class="total-col" style="font-weight:700;">${parseFloat(bill).toFixed(2)}</td>
        <td class="due-balance-col" style="font-weight:700;">${(bill - (document.getElementById('clientReceive').value || 0)).toFixed(2)}</td>
        <td><input type="date" value="${document.getElementById('clientTravelDate').value}"></td>
        <td class="no-print">
            <button onclick="printRowInvoice(this)" class="btn-inv">📄</button>
            <button onclick="this.closest('tr').remove(); calculateLedger();" class="btn-del">×</button>
        </td>
    `;
    
    ledgerBody.appendChild(row);
    calculateLedger();
    
    // Clear top form
    document.querySelectorAll('.client-form-grid input').forEach(input => {
        if(input.id !== 'clientDate') input.value = '';
    });
}

// 6. Cloud Sync
async function syncToCloud() {
    const status = document.getElementById('saveStatus');
    status.innerText = "⏳ Saving...";
    status.style.color = "#2563eb";
    
    const rows = [];
    ledgerBody.querySelectorAll('tr').forEach(tr => {
        const ins = tr.querySelectorAll('input');
        rows.push({
            name: ins[0].value,
            address: ins[1].value,
            date: ins[2].value,
            carrier: ins[3].value,
            receivedBy: ins[4].value,
            bill: ins[5].value,
            receive: ins[6].value,
            total: tr.querySelector('.total-col').innerText,
            due: tr.querySelector('.due-balance-col').innerText,
            travelDate: ins[7].value
        });
    });

    try {
        await fetch(WEB_APP_URL, { 
            method: 'POST', 
            mode: 'no-cors', 
            body: JSON.stringify({ type: 'client_ledger', rows }) 
        });
        status.innerText = "✅ Saved to Cloud";
        status.style.color = "#059669";
    } catch (e) {
        status.innerText = "❌ Sync Failed";
        status.style.color = "#dc2626";
    }
}

// 7. Invoice Printing
function printRowInvoice(btn) {
    const row = btn.closest('tr');
    const inputs = row.querySelectorAll('input');
    const name = inputs[0].value;
    const date = inputs[2].value;
    const amount = inputs[6].value;
    const serial = "EI-" + Math.floor(100000 + Math.random() * 900000);

    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>Receipt - EME AIR</title>
        <style>
            body { font-family: sans-serif; padding: 40px; }
            .box { border: 2px solid #000; padding: 30px; border-radius: 10px; }
            .line { border-bottom: 1px dotted #000; display: inline-block; min-width: 200px; font-weight: bold; }
        </style></head><body>
            <div class="box">
                <h2>EME AIR INTERNATIONAL - MONEY RECEIPT</h2>
                <p>Serial: ${serial} | Date: ${date}</p>
                <p>Received From: <span class="line">${name}</span></p>
                <p>Amount Paid: <span class="line">৳${parseFloat(amount).toLocaleString()}</span></p>
                <div style="margin-top:50px; display:flex; justify-content:space-between;">
                    <p>Signature: ________________</p>
                    <p>Authorized Seal: ________________</p>
                </div>
            </div>
            <script>window.onload = () => { window.print(); window.close(); }</script>
        </body></html>
    `);
    win.document.close();
}

// 8. Dark Mode & Init
function toggleDarkMode() {
    const body = document.documentElement;
    const isDark = body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.getElementById('themeToggle').innerText = newTheme === 'dark' ? '☀️' : '🌙';
}

document.getElementById('usdInput').addEventListener('input', () => {
    const res = (parseFloat(document.getElementById('usdInput').value) || 0) * (parseFloat(document.getElementById('rateInput').value) || 122);
    document.getElementById('bdtResult').innerText = '৳' + res.toLocaleString();
});

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if(savedTheme === 'dark') document.getElementById('themeToggle').innerText = '☀️';
    document.getElementById('clientDate').valueAsDate = new Date();
});