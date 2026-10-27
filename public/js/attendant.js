const messageBox = document.getElementById('message');

function showMessage(text, isError) {
  messageBox.textContent = text;
  messageBox.className = isError ? 'error' : 'success';
}

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

async function search() {
  const q = document.getElementById('search').value.trim();
  const { data } = await api('/api/attendant/search?q=' + encodeURIComponent(q));
  const tbody = document.getElementById('resultsBody');
  tbody.innerHTML = '';

  data.forEach((person) => {
    const tr = document.createElement('tr');

    const nameTd = document.createElement('td');
    nameTd.textContent = person.full_name;
    const idTd = document.createElement('td');
    idTd.textContent = person.staff_id;
    const statusTd = document.createElement('td');
    const actionTd = document.createElement('td');

    if (!person.status) {
      statusTd.textContent = 'No ticket today';
    } else if (person.status === 'redeemed') {
      statusTd.textContent = 'Already collected';
    } else {
      statusTd.textContent = 'Ticket available';
      const button = document.createElement('button');
      button.textContent = 'Give meal';
      button.className = 'small green';
      button.addEventListener('click', () => giveMeal(person));
      actionTd.appendChild(button);
    }

    tr.append(nameTd, idTd, statusTd, actionTd);
    tbody.appendChild(tr);
  });
}

async function giveMeal(person) {
  if (!confirm('Give a meal to ' + person.full_name + '?')) return;

  const { ok, data } = await api('/api/attendant/redeem', 'POST', { user_id: person.id });
  showMessage(ok ? person.full_name + ': ' + data.message : data.error, !ok);
  search();
}

document.getElementById('search').addEventListener('input', search);

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api('/api/auth/logout', 'POST');
  window.location.href = 'index.html';
});

async function init() {
  const me = await api('/api/auth/me');
  if (!me.ok || me.data.role !== 'attendant') {
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('welcome').textContent = 'Welcome, ' + me.data.full_name + ' ';
  search();
}

init();