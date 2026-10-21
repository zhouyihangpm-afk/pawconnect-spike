import { esc } from './supabase.js';

const container = document.getElementById('confirm');
const applicationId = new URLSearchParams(location.search).get('id');

if (applicationId) {
  container.innerHTML = `
    <p class="success">Thank you! Your application has been received.</p>
    <p>Your application ID is <strong>${esc(applicationId)}</strong>. Please keep it to track your application status.</p>
    <p><a href="track.html">Track your application</a></p>`;
} else {
  container.innerHTML = '<p class="error">No application ID found. <a href="pets.html">Browse pets</a></p>';
}
