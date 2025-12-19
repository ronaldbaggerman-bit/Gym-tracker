let decisions = [];
let currentFilter = 'all';
let editingDecisionId = null;
let projects = ['OneCRM', 'Tranch 4', 'PriceKeys'];
let selectedProject = 'all';

// Load decisions from localStorage
function loadDecisions() {
    try {
        const stored = localStorage.getItem('decisions');
        if (stored) {
            decisions = JSON.parse(stored);
        }
        renderDecisions();
    } catch (e) {
        console.error('Error loading decisions:', e);
        alert('Fout bij laden besluiten. Data mogelijk corrupt.');
    }
}

// Save decisions to localStorage
function saveDecisions() {
    try {
        localStorage.setItem('decisions', JSON.stringify(decisions));
    } catch (e) {
        console.error('Error saving decisions:', e);
        alert('Fout bij opslaan besluiten.');
    }
}

// Render decisions
function renderDecisions() {
    const grid = document.getElementById('decisionsGrid');
    let filtered = decisions;

    if (currentFilter !== 'all') {
        filtered = decisions.filter(d => d.status === currentFilter);
    }

    if (selectedProject !== 'all') {
        filtered = filtered.filter(d => d.project === selectedProject);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚖️</div>
                <h3>Geen besluiten gevonden</h3>
                <p>Maak je eerste besluit om te beginnen.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(decision => `
        <div class="decision-card" title="Klik om te bewerken - ${decision.title}">
            <div class="decision-header">
                <div>
                    <div class="decision-title">${decision.title}</div>
                    <div class="decision-status status-${decision.status}">
                        ${decision.status === 'pending' ? 'In Behandeling' : 'Genomen'}
                    </div>
                </div>
            </div>
            ${decision.description ? `<div class="decision-description">${decision.description}</div>` : ''}
            ${decision.options && decision.options.length > 0 ? `
                <div class="decision-options">
                    <h4>Opties:</h4>
                    ${decision.options.map(option => `<div class="option">${option}</div>`).join('')}
                </div>
            ` : ''}
            ${decision.status === 'decided' && decision.decision ? `
                <div class="decision-decision">
                    <strong>Gekozen:</strong> ${decision.decision}
                </div>
            ` : ''}
            <div class="decision-meta">
                <span>${decision.date ? new Date(decision.date).toLocaleDateString('nl-NL') : 'Geen datum'}</span>
                ${decision.project ? `<span class="badge">📁 ${decision.project}</span>` : ''}
                <div class="decision-actions">
                    <button class="icon-btn" onclick="editDecision('${decision.id}')" title="Bewerk besluit" aria-label="Bewerk besluit">✏️</button>
                    <button class="icon-btn" onclick="deleteDecision('${decision.id}')" title="Verwijder besluit" aria-label="Verwijder besluit">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Update project select options
function updateProjectSelect() {
    const select = document.getElementById('decisionProject');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- Selecteer project --</option>' +
            projects.map(p => `<option value="${p}">${p}</option>`).join('');
        select.value = currentValue;
    }
}

// Render project tabs
function renderProjectTabs() {
    const projectTabs = document.getElementById('projectTabs');

    const projectCounts = {};
    projects.forEach(p => {
        projectCounts[p] = decisions.filter(d => d.project === p).length;
    });
    projectCounts['all'] = decisions.length;

    projectTabs.innerHTML = `
        <div class="project-tab ${selectedProject === 'all' ? 'active' : ''}" onclick="selectProject('all')">
            🌐 Alle Projecten <span class="count">${projectCounts['all']}</span>
        </div>
        ${projects.map(project => `
            <div class="project-tab ${selectedProject === project ? 'active' : ''}" onclick="selectProject('${project}')">
                ${project} <span class="count">${projectCounts[project]}</span>
            </div>
        `).join('')}
    `;
}

// Select project
function selectProject(project) {
    selectedProject = project;
    renderProjectTabs();
    renderDecisions();
}

// Filter decisions
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderDecisions();
    });
});

// Open modal
function openDecisionModal(decisionId = null) {
    editingDecisionId = decisionId;
    const modal = document.getElementById('decisionModal');
    const form = document.getElementById('decisionForm');

    if (decisionId) {
        const decision = decisions.find(d => d.id === decisionId);
        document.getElementById('modalTitle').textContent = 'Besluit Bewerken';
        document.getElementById('decisionTitle').value = decision.title;
        document.getElementById('decisionDescription').value = decision.description || '';
        document.getElementById('decisionStatus').value = decision.status;
        document.getElementById('decisionDecision').value = decision.decision || '';
        document.getElementById('decisionDate').value = decision.date || '';
        document.getElementById('decisionProject').value = decision.project || '';

        // Load options
        const optionsList = document.getElementById('optionsList');
        optionsList.innerHTML = decision.options.map(option => `
            <div class="option-input">
                <input type="text" class="form-input" value="${option}">
                <button type="button" class="icon-btn" onclick="removeOption(this)" aria-label="Verwijder optie">🗑️</button>
            </div>
        `).join('');
    } else {
        document.getElementById('modalTitle').textContent = 'Nieuw Besluit';
        form.reset();
        document.getElementById('optionsList').innerHTML = `
            <div class="option-input">
                <input type="text" class="form-input" placeholder="Optie 1">
                <button type="button" class="icon-btn" onclick="removeOption(this)" aria-label="Verwijder optie">🗑️</button>
            </div>
        `;
    }

    toggleDecisionField();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}

// Close modal
function closeModal() {
    document.getElementById('decisionModal').classList.remove('active');
    document.getElementById('decisionModal').setAttribute('aria-hidden', 'true');
    editingDecisionId = null;
}

// Toggle decision field
function toggleDecisionField() {
    const status = document.getElementById('decisionStatus').value;
    const decisionGroup = document.getElementById('decisionGroup');
    decisionGroup.style.display = status === 'decided' ? 'block' : 'none';
}

document.getElementById('decisionStatus').addEventListener('change', toggleDecisionField);

// Add option
function addOption() {
    const optionsList = document.getElementById('optionsList');
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-input';
    optionDiv.innerHTML = `
        <input type="text" class="form-input" placeholder="Nieuwe optie">
        <button type="button" class="icon-btn" onclick="removeOption(this)" aria-label="Verwijder optie">🗑️</button>
    `;
    optionsList.appendChild(optionDiv);
}

// Remove option
function removeOption(btn) {
    const optionsList = document.getElementById('optionsList');
    if (optionsList.children.length > 1) {
        btn.parentElement.remove();
    }
}

// Save decision
document.getElementById('decisionForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('decisionTitle').value.trim();
    if (!title) {
        alert('Titel is verplicht.');
        return;
    }

    const options = Array.from(document.querySelectorAll('#optionsList input')).map(input => input.value.trim()).filter(val => val);

    const decision = {
        id: editingDecisionId || Date.now().toString(),
        title: title,
        description: document.getElementById('decisionDescription').value.trim(),
        options: options,
        status: document.getElementById('decisionStatus').value,
        decision: document.getElementById('decisionDecision').value.trim(),
        date: document.getElementById('decisionDate').value,
        project: document.getElementById('decisionProject').value,
        createdAt: new Date().toISOString()
    };

    if (editingDecisionId) {
        const index = decisions.findIndex(d => d.id === editingDecisionId);
        decisions[index] = decision;
    } else {
        decisions.push(decision);
    }

    saveDecisions();
    renderDecisions();
    closeModal();
});

// Edit decision
function editDecision(id) {
    openDecisionModal(id);
}

// Delete decision
function deleteDecision(id) {
    if (confirm('Weet je zeker dat je dit besluit wilt verwijderen?')) {
        decisions = decisions.filter(d => d.id !== id);
        saveDecisions();
        renderDecisions();
    }
}

// Export decisions
function exportDecisions() {
    const csv = [
        ['Titel', 'Beschrijving', 'Opties', 'Status', 'Besluit', 'Datum', 'Project'].join(','),
        ...decisions.map(d => [
            `"${d.title}"`,
            `"${d.description || ''}"`,
            `"${d.options ? d.options.join('; ') : ''}"`,
            d.status,
            `"${d.decision || ''}"`,
            d.date || '',
            `"${d.project || ''}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `besluiten-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Initialize
window.addEventListener('load', () => {
    loadDecisions();

    // Load projects from shared storage
    const storedProjects = localStorage.getItem('projects');
    projects = storedProjects ? JSON.parse(storedProjects) : ['OneCRM', 'Tranch 4', 'PriceKeys'];

    updateProjectSelect();
    renderProjectTabs();
});

// Project manager functions
function closeProjectModal() {
    document.getElementById('projectModal').classList.remove('active');
    document.getElementById('projectModal').setAttribute('aria-hidden', 'true');
}

function renderProjectList() {
    const list = document.getElementById('projectList');
    list.innerHTML = projects.map((project, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--dark-lighter); border-radius: 8px; margin-bottom: 0.5rem;">
            <span>${project}</span>
            <button class="icon-btn" onclick="deleteProject(${idx})" title="Verwijderen" aria-label="Verwijder project">🗑️</button>
        </div>
    `).join('');
}