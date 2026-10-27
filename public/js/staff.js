async function api(url, method = 'GET') {
  const response = await fetch(url, { method });
  const data = await response.json();
  if (response.status === 401 || response.status === 403) {
    window.location.href = 'index.html';
  }
  return { ok: response.ok, data };
}

async function init() {
  const me = await api('/api/auth/me');
  if (!me.ok || me.data.role !== 'staff') {
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('welcome').textContent = 'Welcome, ' + me.data.full_name + ' ';

  const { data } = await api('/api/staff/tickets');
  const today = new Date().toLocaleDateString('en-CA');
  const tbody = document.getElementById('historyBody');
  const todayBox = document.getElementById('todayStatus');

  todayBox.textContent = 'You have no meal ticket for today.';

  data.forEach((ticket) => {
    const tr = document.createElement('tr');
    [ticket.meal_date, ticket.status, ticket.redeemed_at || '-'].forEach((value) => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);

    if (ticket.meal_date === today) {
      todayBox.textContent = ticket.status === 'unused'
        ? 'You have a ticket for today. Show your Staff ID at the canteen.'
        : 'Your ticket for today has been used (collected at ' + ticket.redeemed_at + ').';
    }
  });
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api('/api/auth/logout', 'POST');
  window.location.href = 'index.html';
});

init();