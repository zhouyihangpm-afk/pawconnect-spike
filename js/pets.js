import { supabase, esc } from './supabase.js';

const status = document.getElementById('status');
const list = document.getElementById('pet-list');

const { data, error } = await supabase
  .from('pets')
  .select('pet_id, name, animal_type, age_years, photo_url')
  .eq('availability', 'Available')
  .order('pet_id');

if (error) {
  status.textContent = 'Could not load pets: ' + error.message;
  status.className = 'error';
} else if (data.length === 0) {
  status.textContent = 'No pets are available right now.';
} else {
  status.textContent = `${data.length} pets available.`;
  list.innerHTML = data.map((pet) => `
    <a class="card" href="pet.html?id=${encodeURIComponent(pet.pet_id)}">
      <img src="${esc(pet.photo_url)}" alt="Photo of ${esc(pet.name)}">
      <div>
        <strong>${esc(pet.name)}</strong><br>
        ${esc(pet.animal_type)} · ${esc(pet.age_years)} ${pet.age_years === 1 ? 'year' : 'years'} old
      </div>
    </a>`).join('');
}
