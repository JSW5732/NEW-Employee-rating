const form = document.getElementById('rating-form');
const listEl = document.getElementById('ratings-list');
const resetBtn = document.getElementById('reset-btn');
const exportBtn = document.getElementById('export-btn');

let editingId = null;
let selectedId = null;

async function fetchRatings(){
  listEl.innerHTML = 'Loading...';
  try {
    const res = await fetch('/api/ratings');
    const data = await res.json();
    renderList(data);
  } catch (e) {
    listEl.innerHTML = `<div class="item">Error loading: ${e.message}</div>`;
  }
}

function renderList(items){
  if (!items || items.length === 0){
    listEl.innerHTML = '<div class="item">No ratings yet</div>';
    return;
  }
  listEl.innerHTML = items.map(i => `
    <div class="item" data-id="${i.id}">
      <div style="display:flex; justify-content:space-between; align-items:center">
        <div>
          <div class="title">${escapeHtml(i.employee_name)} <span class="meta">(${escapeHtml(i.employee_id||'')})</span></div>
          <div class="meta">${escapeHtml(i.position || '')} — ${escapeHtml(i.department || '')} — Reviewed by ${escapeHtml(i.reviewer || '')}</div>
        </div>
        <div>
          <button class="small-btn" onclick="select(${i.id})">${selectedId===i.id ? 'Selected' : 'Select'}</button>
          <button class="small-btn" onclick="edit(${i.id})">Edit</button>
          <button class="small-btn" onclick="remove(${i.id})">Delete</button>
        </div>
      </div>
      <div style="margin-top:8px">${escapeHtml(i.overall_rating || '')}</div>
      <div style="margin-top:8px" class="meta">Created: ${new Date(i.created_at).toLocaleString()}</div>
    </div>
  `).join('');
}

function escapeHtml(s){
  if (!s) return '';
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const body = {};
  for (const [k,v] of fd.entries()) body[k] = v;
  try {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/ratings/${editingId}` : '/api/ratings';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Save failed');
    form.reset();
    editingId = null;
    await fetchRatings();
  } catch (err) {
    alert('Error saving: ' + err.message);
  }
});

resetBtn.addEventListener('click', () => {
  form.reset();
  editingId = null;
});

window.edit = async function(id){
  try {
    const res = await fetch(`/api/ratings/${id}`);
    if (!res.ok) throw new Error('Not found');
    const item = await res.json();
    editingId = id;
    for (const key of ['employee_name','employee_id','position','department','reviewer','review_period_start','review_period_end','overall_rating','strengths','improvements','goals']){
      if (form.elements[key]) form.elements[key].value = item[key] || '';
    }
    window.scrollTo({top:0, behavior:'smooth'});
  } catch (err) {
    alert('Error: ' + err.message);
  }
};

window.remove = async function(id){
  if (!confirm('Delete this rating?')) return;
  try {
    const res = await fetch(`/api/ratings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    if (selectedId === id) selectedId = null;
    await fetchRatings();
  } catch (err) {
    alert('Error deleting: ' + err.message);
  }
};

window.select = function(id){
  if (selectedId === id) selectedId = null;
  else selectedId = id;
  fetchRatings();
};

exportBtn.addEventListener('click', async () => {
  if (!selectedId) { alert('Select a rating first'); return; }
  try {
    const res = await fetch(`/api/pdf/${selectedId}`);
    if (!res.ok) {
      const err = await res.json().catch(()=>({error:'unknown'}));
      throw new Error(err.error || 'Failed to generate PDF');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rating-${selectedId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('PDF export failed: ' + err.message);
  }
});

// initial load
fetchRatings();
