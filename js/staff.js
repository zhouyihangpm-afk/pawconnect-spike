import { supabase, esc, formatDate } from './supabase.js';

const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const appSection = document.getElementById('app-section');
const status = document.getElementById('status');
const rows = document.getElementById('app-rows');

async function showApplications(user) {
  loginForm.classList.add('hidden');
  appSection.classList.remove('hidden');
  document.getElementById('staff-email').textContent = user.email;
  status.textContent = 'Loading applications…';

  const { data, error } = await supabase
    .from('applications')
    .select('application_id, applicant_demo_name, application_status, submitted_at, pets(name)')
    .order('submitted_at', { ascending: false });

  if (error) {
    status.textContent = 'Could not load applications: ' + error.message;
    status.className = 'error';
    return;
  }
  status.textContent = `${data.length} applications. Click an ID to view details.`;
  rows.innerHTML = data.map((app) => `
    <tr>
      <td><a href="staff-app.html?id=${encodeURIComponent(app.application_id)}">${esc(app.application_id)}</a></td>
      <td>${esc(app.pets?.name)}</td>
      <td>${esc(app.applicant_demo_name)}</td>
      <td>${esc(app.application_status)}</td>
      <td>${esc(formatDate(app.submitted_at))}</td>
    </tr>`).join('');
}

const { data: { session } } = await supabase.auth.getSession();
if (session) {
  showApplications(session.user);
} else {
  loginForm.classList.remove('hidden');
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = loginForm.elements.email.value.trim();
  const password = loginForm.elements.password.value;
  if (!email || !password) {
    loginMessage.textContent = 'Please enter your email and password.';
    return;
  }
  loginMessage.textContent = '';
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginMessage.textContent = 'Sign in failed: ' + error.message;
    return;
  }
  showApplications(data.user);
});

document.getElementById('sign-out').addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.reload();
});
