/**
 * Google Apps Script Backend for Student Savings Management
 * Deploy this as a Web App with "Execute as: Me" and "Who has access: Anyone"
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // User needs to replace this

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Initialize headers if new sheet
    if (name === 'students') {
      sheet.appendRow(['id', 'nis', 'name', 'class', 'parent_name', 'phone', 'photo_url', 'status', 'created_at']);
    } else if (name === 'accounts') {
      sheet.appendRow(['id', 'student_id', 'account_number', 'initial_balance', 'current_balance', 'created_at']);
    } else if (name === 'transactions') {
      sheet.appendRow(['id', 'account_id', 'student_id', 'type', 'amount', 'method', 'note', 'status', 'date', 'created_by']);
    }
  }
  return sheet;
}

function doGet(e) {
  const action = e.parameter.action;
  let result;

  try {
    switch (action) {
      case 'getStudents':
        result = getStudents();
        break;
      case 'getStudent':
        result = getStudent(e.parameter.id);
        break;
      case 'getTransactions':
        result = getTransactions();
        break;
      case 'getBalance':
        result = getBalance(e.parameter.student_id);
        break;
      case 'getDashboardStats':
        result = getDashboardStats();
        break;
      default:
        return createResponse({ success: false, message: 'Invalid action' });
    }
    return createResponse({ success: true, data: result });
  } catch (error) {
    return createResponse({ success: false, message: error.toString() });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let result;

    switch (action) {
      case 'login':
        result = login(data);
        break;
      case 'createStudent':
        result = createStudent(data);
        break;
      case 'updateStudent':
        result = updateStudent(data);
        break;
      case 'deposit':
        result = createTransaction(data, 'deposit');
        break;
      case 'withdraw':
        result = createTransaction(data, 'withdraw');
        break;
      case 'approveTransaction':
        result = approveTransaction(data.id);
        break;
      case 'rejectTransaction':
        result = rejectTransaction(data.id);
        break;
      default:
        return createResponse({ success: false, message: 'Invalid action' });
    }
    return createResponse({ success: true, data: result });
  } catch (error) {
    return createResponse({ success: false, message: error.toString() });
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Logic Functions ---

function login(data) {
  const { username, password } = data;
  
  if (!username || !password) throw new Error('Username dan password harus diisi');
  
  // Admin Login
  if (username === 'admin' && password === 'admin123') {
    return {
      user: {
        id: 'ADMIN',
        username: 'admin',
        name: 'Administrator',
        role: 'admin'
      },
      token: 'admin-token-' + Date.now()
    };
  }
  
  // Student Login
  const students = getStudents();
  const student = students.find(s => String(s.nis) === String(username));
  
  if (student && String(password) === String(student.nis)) { // Simple: password is NIS
    return {
      user: {
        id: student.id,
        username: student.nis,
        name: student.name,
        role: 'student',
        student_id: student.id
      },
      token: 'student-token-' + student.id + '-' + Date.now()
    };
  }
  
  throw new Error('Username atau password salah');
}

function getStudents() {
  const sheet = getSheet('students');
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) return [];
  
  // Remove headers
  data.shift();
  
  // Hardcoded keys to ensure robustness against header changes/errors in Sheet
  const keys = ['id', 'nis', 'name', 'class', 'parent_name', 'phone', 'photo_url', 'status', 'created_at'];
  
  return data.map(row => {
    const obj = {};
    keys.forEach((k, i) => {
      if (i < row.length) {
        obj[k] = row[i];
      }
    });
    return obj;
  });
}

function getStudent(id) {
  const students = getStudents();
  return students.find(s => s.id === id);
}

// ... (createStudent and updateStudent remain unchanged)

function getTransactions() {
  const sheet = getSheet('transactions');
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) return [];
  
  // Remove headers
  data.shift();
  
  // Hardcoded keys to match the appendRow order in createTransaction
  // This fixes issues where Sheet headers might be missing 'status' or be out of order
  const keys = ['id', 'account_id', 'student_id', 'type', 'amount', 'method', 'note', 'status', 'date', 'created_by'];
  
  return data.map(row => {
    const obj = {};
    keys.forEach((k, i) => {
      if (i < row.length) obj[k] = row[i];
    });
    return obj;
  });
}

function getBalance(studentId) {
  const accountSheet = getSheet('accounts');
  const data = accountSheet.getDataRange().getValues();
  data.shift(); // remove headers
  const account = data.find(row => row[1] === studentId);
  return { balance: account ? account[4] : 0 };
}

function createTransaction(data, type) {
  const studentId = data.student_id || data.StudentId;
  const amount = Number(data.amount || data.Amount);
  
  // Robust status handling: Default to 'pending'
  // Only set to 'completed' if explicitly requested
  let status = 'pending';
  const inputStatus = data.status || data.Status;
  if (inputStatus && String(inputStatus).toLowerCase() === 'completed') {
    status = 'completed';
  }
  
  // Get account
  const accountSheet = getSheet('accounts');
  const accData = accountSheet.getDataRange().getValues();
  const headers = accData.shift();
  const accIndex = accData.findIndex(row => row[1] === studentId);
  
  if (accIndex === -1) throw new Error('Account not found');
  
  const accountRow = accData[accIndex];
  const accId = accountRow[0];
  let currentBalance = Number(accountRow[4]);

  // Check balance for withdrawals regardless of status (optional, but good practice)
  if (type === 'withdraw' && currentBalance < amount) {
    throw new Error('Insufficient balance');
  }

  // Update balance ONLY if status is completed
  if (status === 'completed') {
    if (type === 'deposit') currentBalance += amount;
    else currentBalance -= amount;
    accountSheet.getRange(accIndex + 2, 5).setValue(currentBalance);
  }

  // Record transaction
  const transSheet = getSheet('transactions');
  const transId = 'TRX' + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMddHHmmss");
  const date = new Date().toISOString();
  
  transSheet.appendRow([
    transId,
    accId,
    studentId,
    type,
    amount,
    data.method || data.Method || 'cash',
    data.note || data.Note || '',
    status,
    date,
    data.created_by || data.CreatedBy || 'admin'
  ]);

  SpreadsheetApp.flush();
  return { id: transId, balance: currentBalance, status: status };
}

function approveTransaction(id) {
  const transSheet = getSheet('transactions');
  const transData = transSheet.getDataRange().getValues();
  const transHeaders = transData.shift();
  const transIndex = transData.findIndex(row => row[0] === id);
  
  if (transIndex === -1) throw new Error('Transaction not found');
  
  const transRow = transData[transIndex];
  const currentStatus = String(transRow[7]).toLowerCase();
  
  if (currentStatus === 'completed') throw new Error('Transaction already completed');
  
  const studentId = transRow[2];
  const type = transRow[3];
  const amount = Number(transRow[4]);
  
  // Update balance
  const accountSheet = getSheet('accounts');
  const accData = accountSheet.getDataRange().getValues();
  accData.shift();
  const accIndex = accData.findIndex(row => row[1] === studentId);
  
  if (accIndex === -1) throw new Error('Account not found');
  
  let currentBalance = Number(accData[accIndex][4]);
  
  if (type === 'deposit') {
    currentBalance += amount;
  } else {
    if (currentBalance < amount) throw new Error('Insufficient balance');
    currentBalance -= amount;
  }
  
  accountSheet.getRange(accIndex + 2, 5).setValue(currentBalance);
  
  // Update transaction status
  transSheet.getRange(transIndex + 2, 8).setValue('completed');
  
  SpreadsheetApp.flush();
  return { id, balance: currentBalance, status: 'completed' };
}

function rejectTransaction(id) {
  const transSheet = getSheet('transactions');
  const transData = transSheet.getDataRange().getValues();
  const transHeaders = transData.shift();
  const transIndex = transData.findIndex(row => row[0] === id);
  
  if (transIndex === -1) throw new Error('Transaction not found');
  
  const transRow = transData[transIndex];
  const currentStatus = String(transRow[7]).toLowerCase();
  
  if (currentStatus === 'completed') throw new Error('Cannot reject a completed transaction');
  if (currentStatus === 'rejected') throw new Error('Transaction already rejected');
  
  // Update transaction status to rejected
  transSheet.getRange(transIndex + 2, 8).setValue('rejected');
  
  SpreadsheetApp.flush();
  return { id, status: 'rejected' };
}

function getDashboardStats() {
  const students = getStudents();
  const accounts = getSheet('accounts').getDataRange().getValues();
  accounts.shift();
  
  const totalSavings = accounts.reduce((sum, row) => sum + Number(row[4]), 0);
  
  const transactions = getTransactions();
  const today = new Date().toISOString().split('T')[0];
  const todayDeposits = transactions
    .filter(t => t.type === 'deposit' && t.date.startsWith(today))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    totalStudents: students.length,
    totalSavings: totalSavings,
    todayDeposits: todayDeposits
  };
}
