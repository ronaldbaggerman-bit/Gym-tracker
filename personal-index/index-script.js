function navigateTo(page) {
    window.location.href = page;
}

// Global projects array
let projects = JSON.parse(localStorage.getItem('projects') || '["OneCRM", "Tranch 4", "PriceKeys"]');

// Load stats from localStorage
function loadStats() {
    try {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const decisions = JSON.parse(localStorage.getItem('decisions') || '[]');
        projects = JSON.parse(localStorage.getItem('projects') || '["OneCRM", "Tranch 4", "PriceKeys"]');
        
        // Total active tasks
        const activeTasks = tasks.filter(t => !t.completed).length;
        document.getElementById('totalTasks').textContent = activeTasks;

        // Pending decisions
        const pendingDecisions = decisions.filter(d => d.status === 'pending').length;
        document.getElementById('pendingDecisions').textContent = pendingDecisions;

        // Total projects
        document.getElementById('projectCount').textContent = projects.length;

        // Completed today
        const todayStr = new Date().toISOString().split('T')[0];
        const completedToday = tasks.filter(t => t.completed && t.completedDate === todayStr).length;
        document.getElementById('completedToday').textContent = completedToday;
    } catch (e) {
        console.error('Error loading stats:', e);
        alert('Fout bij laden statistieken.');
    }
}

// Import data from JSON
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (confirm('⚠️ Dit overschrijft je huidige data. Doorgaan?')) {
                    // Define relevant keys for the 3 pages
                    const relevantKeys = [
                        'tasks', // Actielijst
                        'decisions', // Besluitenpagina
                        'workplanning_employees', // Werknemerplanning
                        'workplanning_leaves', // Werknemerplanning
                        'projects' // Shared projects
                        // Removed: 'workplanning_lastModified', 'onedrive_backup_pending', 'cloud_sync_enabled', 'cloud_api_key' as cloud features are removed
                    ];
                    
                    // Import only relevant data
                    relevantKeys.forEach(key => {
                        if (data[key] !== undefined) {
                            localStorage.setItem(key, JSON.stringify(data[key]));
                        }
                    });
                    alert('✅ Data geïmporteerd!');
                    loadStats();
                }
            } catch (err) {
                alert('❌ Import mislukt: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Load stats on page load
window.addEventListener('load', loadStats);

// Project management functions
function openProjectManager() {
    const projectList = document.getElementById('projectList');
    projectList.innerHTML = `
        <div class="comments-title">Huidige projecten:</div>
        ${projects.map((p, idx) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--dark-card); border-radius: 8px; margin-bottom: 0.5rem;">
                <span>📁 ${p}</span>
                <button class="icon-btn" onclick="deleteProject(${idx})" style="background: var(--danger);">🗑️</button>
            </div>
        `).join('')}
    `;
    document.getElementById('projectModal').classList.add('active');
    document.getElementById('newProjectName').value = '';
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.remove('active');
}

function addProject() {
    const name = document.getElementById('newProjectName').value.trim();
    if (!name) {
        alert('Voer een projectnaam in');
        return;
    }
    
    if (projects.includes(name)) {
        alert('Dit project bestaat al');
        return;
    }
    
    projects.push(name);
    localStorage.setItem('projects', JSON.stringify(projects));
    loadStats(); // Update stats
    openProjectManager();
}

function deleteProject(idx) {
    if (confirm(`Weet je zeker dat je het project "${projects[idx]}" wilt verwijderen?`)) {
        projects.splice(idx, 1);
        localStorage.setItem('projects', JSON.stringify(projects));
        loadStats(); // Update stats
        openProjectManager();
    }
}

// Export all data
function exportAllData() {
    try {
        const data = {};
        
        // Define relevant keys for the 3 pages
        const relevantKeys = [
            'tasks', // Actielijst
            'decisions', // Besluitenpagina
            'workplanning_employees', // Werknemerplanning
            'workplanning_leaves', // Werknemerplanning
            'projects' // Shared projects
            // Removed: 'workplanning_lastModified', 'onedrive_backup_pending', 'cloud_sync_enabled', 'cloud_api_key' as cloud features are removed
        ];
        
        // Collect only relevant localStorage keys
        relevantKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) {
                try {
                    data[key] = JSON.parse(value);
                } catch {
                    data[key] = value; // If not JSON, keep as string
                }
            }
        });
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `personal-index-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ Data van Werknemersplanning, Besluitenpagina en Actielijst geëxporteerd!');
    } catch (e) {
        console.error('Export error:', e);
        alert('❌ Export mislukt: ' + e.message);
    }
}