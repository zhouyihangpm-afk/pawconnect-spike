import { supabase, esc, formatDate } from './supabase.js';

const STATUSES = ['Pending', 'Under Review', 'Approved', 'Rejected'];
const status = document.getElementById('status');
const detail = document.getElementById('detail');
const applicationId = new URLSearchParams(location.search).get('id');

const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  status.innerHTML = 'Please <a href="staff.html">sign in</a> to view applications.';
  status.className = 'error';
} else {
  const { data: app, error } = await supabase
    .from('applications')
    .select('*, pets(pet_id, name, animal_type, breed, availability)')
    .eq('application_id', applicationId)
    .maybeSingle();

  if (error) {
    status.textContent = 'Could not load application: ' + error.message;
    status.className = 'error';
  } else if (!app) {
    status.textContent = 'Application not found.';
    status.className = 'error';
  } else {
    status.textContent = '';
    showDetail(app);
  }
}

function showDetail(app) {
  const pet = app.pets ?? {};
  detail.innerHTML = `
    <h1>Application ${esc(app.application_id)}</h1>
    <table>
      <tr><th>Applicant</th><td>${esc(app.applicant_demo_name)}</td></tr>
      <tr><th>Email</th><td>${esc(app.demo_email)}</td></tr>
      <tr><th>Reason</th><td>${esc(app.reason)}</td></tr>
      <tr><th>Submitted</th><td>${esc(formatDate(app.submitted_at))}</td></tr>
      <tr><th>Pet</th><td>${esc(pet.name)} (${esc(pet.pet_id)}, ${esc(pet.animal_type)}, ${esc(pet.breed)}) – ${esc(pet.availability)}</td></tr>
      <tr><th>Current status</th><td><strong id="current-status">${esc(app.application_status)}</strong></td></tr>
    </table>
    <form id="status-form">
      <label for="new-status">Change status</label>
      <select id="new-status">
        ${STATUSES.map((s) => `<option${s === app.application_status ? ' selected' : ''}>${s}</option>`).join('')}
      </select>
      <button type="submit">Save status</button>
      <p id="save-message" role="status"></p>
    </form>`;

  const saveMessage = document.getElementById('save-message');
  document.getElementById('status-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const newStatus = document.getElementById('new-status').value;
    const { data: updated, error } = await supabase
      .from('applications')
      .update({ application_status: newStatus })
      .eq('application_id', app.application_id)
      .select('application_status');

    if (error || updated.length === 0) {
      saveMessage.textContent = 'Could not save status: ' + (error?.message ?? 'no rows updated');
      saveMessage.className = 'error';
      return;
    }
    document.getElementById('current-status').textContent = updated[0].application_status;
    saveMessage.textContent = `Status saved as "${updated[0].application_status}".`;
    saveMessage.className = 'success';
  });
}
