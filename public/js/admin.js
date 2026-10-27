const messageBox = document.getElementById('message');

function showMessage(text, isError) {
  messageBox.textContent = text;
  messageBox.className = isError ? 'error' : 'success';
}

// One helper for all talks with the backend
async function api(url, method = 'GET', body) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  const data = await response.json();
  if (response.status === 401 || response.status === 403) {
    window.location.href = 'index.html';
  }
  return { ok: response.ok, data };
}

// Add a row of text cells to a table
function addRow(tbody, values) {
  const tr = document.createElement('tr');
  values.forEach((value) => {
    const td = document.createElement('td');
    td.textContent = value;
    tr.appendChild(td);
  });
  tbody.appendChild(tr);
}

async function loadUsers() {
  const { data } = await api('/api/admin/users');
  const tbody = document.getElementById('usersBody');
  const select = document.getElementById('ticketUser');
  tbody.innerHTML = '';
  select.innerHTML = '';

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All staff';
  select.appendChild(allOption);

  data.forEach((user) => {
    addRow(tbody, [user.full_name, user.staff_id, user.role]);
    if (user.role === 'staff') {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.full_name + ' (' + user.staff_id + ')';
      select.appendChild(option);
    }
  });
}

async function loadTickets() {
  const date = document.getElementById('viewDate').value;
  const tbody = document.getElementById('ticketsBody');
  tbody.innerHTML = '';
  if (!date) return;

  const { data } = await api('/api/admin/tickets?date=' + date);
  data.forEach((ticket) => {
    addRow(tbody, [
      ticket.full_name,
      ticket.staff_id,
      ticket.status,
      ticket.redeemed_at || '-'
    ]);
  });
}

document.getElementById('userForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const { ok, data } = await api('/api/admin/users', 'POST', {
    full_name: document.getElementById('full_name').value,
    staff_id: document.getElementById('staff_id').value,
    password: document.getElementById('password').value,
    role: document.getElementById('role').value
  });
  showMessage(ok ? data.message : data.error, !ok);
  if (ok) {
    event.target.reset();
    loadUsers();
  }
});

document.getElementById('ticketForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const { ok, data } = await api('/api/admin/tickets', 'POST', {
    user_id: document.getElementById('ticketUser').value,
    meal_date: document.getElementById('ticketDate').value
  });
  showMessage(ok ? data.message : data.error, !ok);
  if (ok) {
    document.getElementById('viewDate').value = document.getElementById('ticketDate').value;
    loadTickets();
  }
});

document.getElementById('viewDate').addEventListener('change', loadTickets);

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api('/api/auth/logout', 'POST');
  window.location.href = 'index.html';
});

// Runs when the page opens
async function init() {
  const me = await api('/api/auth/me');
  if (!me.ok || me.data.role !== 'admin') {
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('welcome').textContent = 'Welcome, ' + me.data.full_name + ' ';

    const today = new Date().toLocaleDateString('en-CA');
  document.getElementById('ticketDate').value = today;
  document.getElementById('viewDate').value = today;

  await loadUsers();
  await loadTickets();
}

init();