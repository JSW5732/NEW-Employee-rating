document.addEventListener('DOMContentLoaded', function() {
  // === Char counters ===
  function setupCharCounter(textareaId, counterId) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    if (!textarea || !counter) return;
    const maxLength = textarea.getAttribute('maxlength');
    const updateCounter = () => {
      const currentLength = textarea.value.length;
      counter.textContent = `${currentLength}/${maxLength}`;
      counter.style.color = (maxLength && currentLength >= maxLength * 0.9) ? 'red' : '#a0a0a0';
    };
    textarea.addEventListener('input', updateCounter);
    updateCounter();
  }
  setupCharCounter('comments','comments-counter');

  // === File selection handler ===
  function handleFileSelection(fileInputId, displayDivId) {
    const fileInput = document.getElementById(fileInputId);
    const displayDiv = document.getElementById(displayDivId);
    if (!fileInput || !displayDiv) return;
    fileInput.addEventListener('change', (event) => {
      displayDiv.innerHTML = '';
      const file = event.target.files[0];
      if (file && file.type !== 'application/pdf') {
        alert('Only PDF documents allowed');
        fileInput.value = '';
        return;
      }
      if (file) {
        const fileLink = document.createElement('a');
        fileLink.href = URL.createObjectURL(file);
        fileLink.download = file.name;
        fileLink.textContent = `Attached: ${file.name}`;
        fileLink.classList.add('attached-file-link');
        displayDiv.appendChild(fileLink);
      }
    });
  }

  // === Backend integration ===
  const form = document.getElementById('performanceRatingForm');
  const listEl = document.getElementById('ratings-list');
  const resetBtn = document.getElementById('reset-btn');
  const exportBtn = document.getElementById('export-btn');
  let editingId = null;
  let selectedId = null;

  async function fetchRatings() {
    listEl.innerHTML = 'Loading...';
    const res = await fetch('/api/ratings');
    const data = await res.json();
    renderList(data);
  }

  function renderList(items) {
    if (!items || items.length===0) {
      listEl.innerHTML = '<div>No ratings yet</div>';
      return;
    }
    listEl.innerHTML = items.map(i => `
      <div class="item" data-id="${i.id}">
        <div class="title">${i.employee_name} (${i.employee_id||''})</div>
        <div>${i.position||''} — ${i.department||''}</div>
        <div>Reviewer: ${i.reviewer||''}</div>
        <div>
          <button onclick="select(${i.id})">${selectedId===i.id?'Selected':'Select'}</button>
          <button onclick="edit(${i.id})">Edit</button>
          <button onclick="removeRating(${i.id})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = {};
    for (const [k,v] of fd.entries()) body[k]=v;
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/ratings/${editingId}` : '/api/ratings';
    await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    form.reset();
    editingId=null;
    fetchRatings();
  });

  resetBtn.addEventListener('click',()=>{ form.reset(); editingId=null; });

  window.edit = async function(id) {
    const res = await fetch(`/api/ratings/${id}`);
    const item = await res.json();
    editingId = id;
    Object.keys(item).forEach(k=>{
      if (form.elements[k]) form.elements[k].value=item[k]||'';
    });
    window.scrollTo({top:0,behavior:'smooth'});
  };

  window.removeRating = async function(id) {
    await fetch(`/api/ratings/${id}`,{method:'DELETE'});
    if (selectedId===id) selectedId=null;
    fetchRatings();
  };

  window.select = function(id) { selectedId = (selectedId===id?null:id); fetchRatings(); };

  exportBtn.addEventListener('click', async () => {
    if (!selectedId) { alert('Select a rating first'); return; }
    const template = document.getElementById('template-select').value;
    const res = await fetch(`/api/pdf/${selectedId}?template=${template}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`rating-${selectedId}-${template}.pdf`;
    a.click(); window.URL.revokeObjectURL(url);
  });

  fetchRatings();
});
