let projects = [];

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('tab-projects').classList.toggle('hidden', tab !== 'projects');
  document.getElementById('tab-resume').classList.toggle('hidden', tab !== 'resume');
}

function authHeaders() {
  const user = netlifyIdentity.currentUser();
  return user ? { Authorization: 'Bearer ' + user.token.access_token } : {};
}

async function loadAll() {
  const [pRes, rRes] = await Promise.all([
    fetch('/.netlify/functions/projects', { headers: authHeaders() }),
    fetch('/.netlify/functions/resume', { headers: authHeaders() })
  ]);
  projects = pRes.ok ? await pRes.json() : [];
  renderProjects();
  const resume = rRes.ok ? await rRes.text() : '{}';
  document.getElementById('resume-json').value = JSON.stringify(JSON.parse(resume), null, 2);
}

function renderProjects() {
  const el = document.getElementById('project-cards');
  el.innerHTML = projects.map((p, i) => `
    <div class="card">
      <div class="card-row"><span>Project ${i + 1}</span>
        <button class="btn-danger" onclick="removeProject(${i})">Remove</button>
      </div>
      <label>Badge (e.g. "Open source", "Dealership site")</label>
      <input value="${escAttr(p.note)}" oninput="projects[${i}].note=this.value">
      <label>Name</label>
      <input value="${escAttr(p.name)}" oninput="projects[${i}].name=this.value">
      <label>Description</label>
      <input value="${escAttr(p.desc)}" oninput="projects[${i}].desc=this.value">
      <label>Domain (display text)</label>
      <input value="${escAttr(p.domain)}" oninput="projects[${i}].domain=this.value">
      <label>URL</label>
      <input value="${escAttr(p.url)}" oninput="projects[${i}].url=this.value">
    </div>
  `).join('');
}

function addProject() {
  projects.push({ note: '', name: '', desc: '', domain: '', url: 'https://' });
  renderProjects();
}

function removeProject(i) {
  projects.splice(i, 1);
  renderProjects();
}

function escAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

async function saveProjects() {
  const status = document.getElementById('status');
  status.textContent = 'Saving…'; status.className = '';
  try {
    const res = await fetch('/.netlify/functions/projects', {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(projects)
    });
    if (!res.ok) throw new Error(await res.text());
    status.textContent = 'Saved — live in ~30–60s after Netlify rebuilds.'; status.className = 'ok';
  } catch (e) {
    status.textContent = 'Error: ' + e.message; status.className = 'err';
  }
}

async function saveResume() {
  const status = document.getElementById('status-resume');
  status.textContent = 'Saving…'; status.className = '';
  try {
    const parsed = JSON.parse(document.getElementById('resume-json').value);
    const res = await fetch('/.netlify/functions/resume', {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    });
    if (!res.ok) throw new Error(await res.text());
    status.textContent = 'Saved — live in ~30–60s after Netlify rebuilds.'; status.className = 'ok';
  } catch (e) {
    status.textContent = 'Error: ' + e.message; status.className = 'err';
  }
}

window.netlifyIdentity && init();
document.addEventListener('DOMContentLoaded', init);
function init() {
  if (!window.netlifyIdentity) { setTimeout(init, 200); return; }
  netlifyIdentity.on('init', user => { if (user) showApp(user); });
  netlifyIdentity.on('login', user => { showApp(user); netlifyIdentity.close(); });
  netlifyIdentity.on('logout', () => location.reload());
  netlifyIdentity.init();
}

function showApp(user) {
  document.getElementById('gate').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('who').innerHTML =
    user.email + ' — <button class="btn-ghost" onclick="netlifyIdentity.logout()">Log out</button>';
  loadAll();
}
