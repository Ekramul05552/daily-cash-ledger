/***********************
 * SALARY LEDGER APP SCRIPT
 ***********************/
function doGet() {
  return HtmlService.createTemplateFromFile('Salary')
    .evaluate()
    .setTitle('Salary Ledger System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/***********************
 * HTML INCLUDE HELPER
 ***********************/
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/***********************
 * SAVE SALARY DATA (FAST + SAFE)
 ***********************/
function saveSalaryToCloud(payload) {
  if (!payload || !payload.monthYear || !payload.rows?.length) {
    throw new Error("Invalid payload");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("SalaryDatabase");

    if (!sheet) {
      sheet = ss.insertSheet("SalaryDatabase");
      sheet.appendRow([
        "MonthYear", "Date", "Name", "Advance", "BasicSalary",
        "Incentive", "Insurance", "EntryTime", "ExitTime", "Attendance"
      ]);
    }

    const data = sheet.getDataRange().getValues();
    const header = data.shift();

    // Remove existing records for same Month
    const remaining = data.filter(r => r[0] !== payload.monthYear);

    // Prepare new rows
    const newRows = payload.rows.map(r => ([
      payload.monthYear,
      r.date || "",
      r.name || "",
      Number(r.advance) || 0,
      Number(r.basicSalary) || 0,
      Number(r.incentive) || 0,
      Number(r.insurance) || 0,
      r.entryTime || "",
      r.exitTime || "",
      r.attendance || ""
    ]));

    // Rewrite sheet (VERY FAST)
    sheet.clearContents();
    sheet.getRange(1, 1, 1, header.length).setValues([header]);

    if (remaining.length) {
      sheet.getRange(2, 1, remaining.length, header.length).setValues(remaining);
    }

    sheet.getRange(
      remaining.length + 2,
      1,
      newRows.length,
      header.length
    ).setValues(newRows);

    return "Success";

  } finally {
    lock.releaseLock();
  }
}

/***********************
 * LOAD SALARY DATA
 ***********************/
function loadSalaryFromCloud(monthYear) {
  if (!monthYear) return [];

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("SalaryDatabase");

  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  data.shift();

  return data
    .filter(r => r[0] === monthYear)
    .map(r => ({
      date: r[1],
      name: r[2],
      advance: r[3],
      basicSalary: r[4],
      incentive: r[5],
      insurance: r[6],
      entryTime: r[7],
      exitTime: r[8],
      attendance: r[9]
    }));
}

/***********************
 * SALARY SUMMARY
 ***********************/
function getSalarySummary(monthYear) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("SalaryDatabase");

  if (!sheet) {
    return { totalBasic: 0, totalAdvance: 0, totalRemaining: 0 };
  }

  const data = sheet.getDataRange().getValues();
  data.shift();

  let totalBasic = 0;
  let totalAdvance = 0;

  data.forEach(r => {
    if (r[0] === monthYear) {
      totalAdvance += Number(r[3]) || 0;
      totalBasic += Number(r[4]) || 0;
    }
  });

  return {
    totalBasic,
    totalAdvance,
    totalRemaining: totalBasic - totalAdvance
  };
}
