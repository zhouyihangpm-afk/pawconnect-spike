import { supabase, esc } from './supabase.js';

const status = document.getElementById('status');
const container = document.getElementById('pet');
const petId = new URLSearchParams(location.search).get('id');

const { data: pet, error } = petId
  ? await supabase.from('pets').select('*').eq('pet_id', petId).maybeSingle()
  : { data: null, error: null };

if (error) {
  status.textContent = 'Could not load pet: ' + error.message;
  status.className = 'error';
} else if (!pet) {
  status.innerHTML = 'Pet not found. <a href="pets.html">Back to pets</a>';
  status.className = 'error';
} else {
  status.textContent = '';
  document.title = `${pet.name} – PawConnect`;
  const applyLink = pet.availability === 'Available'
    ? `<a class="button" href="apply.html?pet=${encodeURIComponent(pet.pet_id)}">Apply to adopt ${esc(pet.name)}</a>`
    : `<p class="error">${esc(pet.name)} is not available for adoption (${esc(pet.availability)}).</p>`;
  container.innerHTML = `
    <h1>${esc(pet.name)}</h1>
    <img src="${esc(pet.photo_url)}" alt="Photo of ${esc(pet.name)}">
    <ul>
      <li>Pet ID: ${esc(pet.pet_id)}</li>
      <li>Type: ${esc(pet.animal_type)}</li>
      <li>Breed: ${esc(pet.breed)}</li>
      <li>Age: ${esc(pet.age_years)} ${pet.age_years === 1 ? 'year' : 'years'}</li>
      <li>Sex: ${esc(pet.sex)}</li>
      <li>Availability: ${esc(pet.availability)}</li>
    </ul>
    <p>${esc(pet.description)}</p>
    ${applyLink}
    <p><a href="pets.html">&larr; Back to pets</a></p>`;
}
