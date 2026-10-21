import { supabase, esc } from './supabase.js';

const petInfo = document.getElementById('pet-info');
const form = document.getElementById('apply-form');
const message = document.getElementById('form-message');
const petId = new URLSearchParams(location.search).get('pet');

const { data: pet, error } = petId
  ? await supabase.from('pets').select('pet_id, name, animal_type, availability').eq('pet_id', petId).maybeSingle()
  : { data: null, error: null };

if (error) {
  petInfo.textContent = 'Could not load pet: ' + error.message;
  petInfo.className = 'error';
} else if (!pet) {
  petInfo.innerHTML = 'No pet selected. Please <a href="pets.html">choose a pet</a> first.';
  petInfo.className = 'error';
} else if (pet.availability !== 'Available') {
  petInfo.textContent = `${pet.name} is not available for adoption (${pet.availability}).`;
  petInfo.className = 'error';
} else {
  petInfo.innerHTML = `You are applying to adopt <strong>${esc(pet.name)}</strong> (${esc(pet.animal_type)}, ID ${esc(pet.pet_id)}).`;
  form.classList.remove('hidden');
}

const labels = { name: 'Your name', email: 'Email', reason: 'Reason for adopting' };

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fields = {
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim(),
    reason: form.elements.reason.value.trim()
  };
  const missing = Object.keys(fields).filter((key) => !fields[key]);

  if (missing.length > 0) {
    message.textContent = 'Please fill in the required fields: ' + missing.map((key) => labels[key]).join(', ') + '.';
    form.elements[missing[0]].focus();
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    message.textContent = 'Please enter a valid email address (e.g. name@example.com).';
    form.elements.email.focus();
    return;
  }

  message.textContent = '';
  const button = form.querySelector('button');
  button.disabled = true;
  const { data: applicationId, error: rpcError } = await supabase.rpc('submit_application', {
    p_pet_id: pet.pet_id,
    p_name: fields.name,
    p_email: fields.email,
    p_reason: fields.reason
  });
  if (rpcError) {
    message.textContent = 'Could not submit application: ' + rpcError.message;
    button.disabled = false;
    return;
  }
  location.href = 'confirm.html?id=' + encodeURIComponent(applicationId);
});
