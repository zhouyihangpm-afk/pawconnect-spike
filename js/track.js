import { supabase, esc, formatDate } from './supabase.js';

const form = document.getElementById('track-form');
const result = document.getElementById('result');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const applicationId = form.elements['app-id'].value.trim();
  if (!applicationId) {
    result.innerHTML = '<p class="error">Please enter your application ID.</p>';
    return;
  }

  result.textContent = 'Searching…';
  const { data, error } = await supabase.rpc('track_application', { p_application_id: applicationId });

  if (error) {
    result.innerHTML = `<p class="error">Could not check status: ${esc(error.message)}</p>`;
  } else if (data.length === 0) {
    result.innerHTML = `<p class="error">No application found with ID "${esc(applicationId)}". Please check the ID and try again.</p>`;
  } else {
    const app = data[0];
    result.innerHTML = `
      <table>
        <tr><th>Application ID</th><td>${esc(app.application_id)}</td></tr>
        <tr><th>Pet</th><td>${esc(app.pet_name)}</td></tr>
        <tr><th>Status</th><td><strong>${esc(app.application_status)}</strong></td></tr>
        <tr><th>Submitted</th><td>${esc(formatDate(app.submitted_at))}</td></tr>
      </table>`;
  }
});
