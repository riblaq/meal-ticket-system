const form = document.getElementById('loginForm');
const errorBox = document.getElementById('error');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';

  const staff_id = document.getElementById('staff_id').value;
  const password = document.getElementById('password').value;

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staff_id, password })
  });

  const data = await response.json();

  if (!response.ok) {
    errorBox.textContent = data.error;
    return;
  }

  if (data.role === 'admin') window.location.href = 'admin.html';
  else if (data.role === 'attendant') window.location.href = 'attendant.html';
  else window.location.href = 'staff.html';
});