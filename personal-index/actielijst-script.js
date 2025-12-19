let tasks = [];
let currentTaskTags = [];
let editingTaskId = null;
let selectedProject = 'all';
let currentLogTaskId = null;
let projects = ['OneCRM', 'Tranch 4', 'PriceKeys'];

// Load tasks from localStorage
function loadTasks() {
    const stored = localStorage.getItem('tasks');
    tasks = stored ? JSON.parse(stored) : [];
    const storedProjects = localStorage.getItem('projects');
    if (storedProjects) {
        projects = JSON.parse(storedProjects);
    }
    updateProjectSelect();
    renderProjectTabs();
    updateStats();
    renderTasks();
}

// Update project select options
function updateProjectSelect() {
    const select = document.getElementById('taskProject');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- Selecteer project --</option>' +
            projects.map(p => `<option value="${p}">${p}</option>`).join('');
        select.value = currentValue;
    }
    
    // Update template project select too
    const templateSelect = document.getElementById('templateProject');
    if (templateSelect) {
        const currentValue = templateSelect.value;
        templateSelect.innerHTML = '<option value="">Alle projecten</option>' +
            projects.map(p => `<option value="${p}">${p}</option>`).join('');
        templateSelect.value = currentValue;
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('projects', JSON.stringify(projects));
    updateStats();
}

// Render project tabs
function renderProjectTabs() {
    const projectTabs = document.getElementById('projectTabs');
    
    const projectCounts = {};
    projects.forEach(p => {
        projectCounts[p] = tasks.filter(t => t.project === p && !t.completed).length;
    });
    projectCounts['all'] = tasks.filter(t => !t.completed).length;

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
    renderTasks();
    updateStats();
}

// Render tasks
function renderTasks() {
    const taskList = document.getElementById('taskList');
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const filterPriority = document.getElementById('filterPriority').value;
    const filterStatus = document.getElementById('filterStatus').value;

    let filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                            (task.description && task.description.toLowerCase().includes(searchTerm));
        const matchesProject = selectedProject === 'all' || task.project === selectedProject;
        const matchesPriority = !filterPriority || task.priority === filterPriority;
        const matchesStatus = filterStatus === 'all' || 
                             (filterStatus === 'completed' ? task.completed : !task.completed);
        return matchesSearch && matchesProject && matchesPriority && matchesStatus;
    });

    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
        return 0;
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>Geen taken gevonden</h3>
                <p>Voeg een nieuwe taak toe om te beginnen!</p>
            </div>
        `;
        return;
    }

    taskList.innerHTML = filteredTasks.map(task => {
        const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
        const priorityLabels = { high: 'Hoog', medium: 'Gemiddeld', low: 'Laag' };
        const statusLabels = { 
            todo: '📋 Te doen', 
            'in-progress': '⚡ In uitvoering', 
            blocked: '🚫 Geblokkeerd', 
            review: '👀 Review', 
            done: '✅ Klaar' 
        };
        const taskStatus = task.status || 'todo';
        
        return `
            <div class="task-card status-${taskStatus} ${task.completed ? 'completed' : ''}">
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         onclick="toggleTask('${task.id}')"></div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        <div class="task-meta">
                            ${task.project ? `<span class="badge badge-project">📁 ${task.project}</span>` : ''}
                            <span class="badge badge-status ${taskStatus}">${statusLabels[taskStatus]}</span>
                            <span class="badge badge-priority ${task.priority}">
                                ${task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '✓'} 
                                ${priorityLabels[task.priority]}
                            </span>
                            ${task.deadline ? `
                                <span class="badge badge-deadline ${isOverdue ? 'badge-priority' : ''}">
                                    📅 ${new Date(task.deadline).toLocaleDateString('nl-NL')}
                                    ${isOverdue ? ' (Verlopen!)' : ''}
                                </span>
                            ` : ''}
                            ${task.assignedTo ? `<span class="badge badge-assigned">👤 ${task.assignedTo}</span>` : ''}
                            ${task.tags && task.tags.length > 0 ? task.tags.map(tagName => {
                                const tagObj = tags.find(t => t.name === tagName);
                                return tagObj ? `<span class="badge" onclick="applyTagFilter('${tagName}')" style="background: ${tagObj.color}30; border: 1px solid ${tagObj.color}; color: ${tagObj.color}; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='${tagObj.color}50'" onmouseout="this.style.background='${tagObj.color}30'">${tagName}</span>` : '';
                            }).join('') : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="log-btn" onclick="showTaskLog('${task.id}')" title="Activiteiten">📋</button>
                        ${task.comments && task.comments.length > 0 ? `<span class="badge badge-comment" onclick="showTaskLog('${task.id}')">💬 ${task.comments.length}</span>` : ''}
                        <button class="icon-btn" onclick="editTask('${task.id}')" title="Bewerken">✏️</button>
                        <button class="icon-btn" onclick="deleteTask('${task.id}')" title="Verwijderen">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update stats
function updateStats() {
    const projectTasks = selectedProject === 'all' 
        ? tasks 
        : tasks.filter(t => t.project === selectedProject);
    
    const total = projectTasks.length;
    const active = projectTasks.filter(t => !t.completed).length;
    const completed = projectTasks.filter(t => t.completed).length;
    const overdue = projectTasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statOverdue').textContent = overdue;
}

// Open modal
function openModal(taskIdOrModal = null) {
    // Als het een bestaande modal-ID is (bevat 'Modal'), open die
    if (typeof taskIdOrModal === 'string' && taskIdOrModal.includes('Modal')) {
        const modal = document.getElementById(taskIdOrModal);
        if (modal) modal.classList.add('active');
        return;
    }

    // Anders behandel als task ID
    const taskId = taskIdOrModal;
    editingTaskId = taskId;
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    
    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        document.getElementById('modalTitle').textContent = 'Taak Bewerken';
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskProject').value = task.project || '';
        document.getElementById('taskStatus').value = task.status || 'todo';
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskDeadline').value = task.deadline || '';
        document.getElementById('taskStartDate').value = task.startDate || '';
        document.getElementById('taskEndDate').value = task.endDate || '';
        document.getElementById('taskAssignedTo').value = task.assignedTo || '';
        document.getElementById('taskComment').value = task.comment || '';
        
        // Load tags
        currentTaskTags = task.tags || [];
        renderTaskTagsSelector();
    } else {
        document.getElementById('modalTitle').textContent = 'Nieuwe Taak';
        form.reset();
        document.getElementById('taskAssignedTo').value = 'Ronald Baggerman';
        currentTaskTags = [];
        renderTaskTagsSelector();
        if (selectedProject !== 'all') {
            document.getElementById('taskProject').value = selectedProject;
        }
    }
    
    modal.classList.add('active');
}

// Close modal
function closeModal(modalId = 'taskModal') {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
    editingTaskId = null;
    currentTaskTags = [];
}

// Render tags selector in task form
function renderTaskTagsSelector() {
    const container = document.getElementById('taskTagsList');
    if (!tags || tags.length === 0) {
        container.innerHTML = '<small style="color: var(--text-muted);">Geen tags beschikbaar. Maak eerst tags aan in de Tags Manager.</small>';
        return;
    }

    container.innerHTML = tags.map(tag => {
        const isSelected = currentTaskTags.includes(tag.name);
        return `
            <div 
                onclick="toggleTaskTag('${tag.name}')" 
                style="
                    cursor: pointer;
                    padding: 0.35rem 0.75rem;
                    border-radius: 6px;
                    background: ${isSelected ? tag.color : 'rgba(' + parseInt(tag.color.slice(1,3), 16) + ',' + parseInt(tag.color.slice(3,5), 16) + ',' + parseInt(tag.color.slice(5,7), 16) + ', 0.1)'};
                    border: 2px solid ${tag.color};
                    color: ${isSelected ? 'white' : tag.color};
                    font-size: 0.85rem;
                    font-weight: ${isSelected ? '600' : '500'};
                    transition: all 0.2s ease;
                ">
                ${isSelected ? '✓ ' : ''}${tag.name}
            </div>
        `;
    }).join('');
}

// Toggle tag for current task
function toggleTaskTag(tagName) {
    if (currentTaskTags.includes(tagName)) {
        currentTaskTags = currentTaskTags.filter(t => t !== tagName);
    } else {
        currentTaskTags.push(tagName);
    }
    renderTaskTagsSelector();
}

// Save task
function saveTask(event) {
    event.preventDefault();
    
    const task = {
        id: editingTaskId || Date.now().toString(),
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        project: document.getElementById('taskProject').value,
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value,
        deadline: document.getElementById('taskDeadline').value,
        startDate: document.getElementById('taskStartDate').value,
        endDate: document.getElementById('taskEndDate').value,
        assignedTo: document.getElementById('taskAssignedTo').value,
        comment: document.getElementById('taskComment').value,
        tags: currentTaskTags,
        completed: false,
        createdAt: new Date().toISOString(),
        log: [],
        comments: []
    };

    if (editingTaskId) {
        const index = tasks.findIndex(t => t.id === editingTaskId);
        const oldTask = tasks[index];
        task.log = oldTask.log || [];
        task.comments = oldTask.comments || [];
        task.createdAt = oldTask.createdAt;
        task.completed = oldTask.completed;
        
        if (oldTask.assignedTo !== task.assignedTo) {
            addTaskLog(task.id, `Overdragen aan ${task.assignedTo || 'niemand'}`);
            if (task.assignedTo && task.comment) {
                addCommentToTask(task.id, task.comment);
            }
        }
        if (oldTask.status !== task.status) {
            const statuses = { todo: 'Te doen', 'in-progress': 'In uitvoering', blocked: 'Geblokkeerd', review: 'Review', done: 'Klaar' };
            addTaskLog(task.id, `Status gewijzigd naar ${statuses[task.status]}`);
        }
        
        tasks[index] = { ...oldTask, ...task, log: task.log, comments: task.comments };
    } else {
        task.log = [];
        task.comments = [];
        addTaskLog(task.id, `Taak aangemaakt`);
        if (task.assignedTo && task.comment) {
            addCommentToTask(task.id, task.comment);
        }
        tasks.push(task);
    }

    saveTasks();
    renderProjectTabs();
    renderTasks();
    closeModal();
}

// Toggle task completion
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    task.completed = !task.completed;
    task.completedDate = task.completed ? new Date().toISOString().split('T')[0] : null;
    addTaskLog(id, task.completed ? '✅ Voltooid' : '🔄 Heropend');
    saveTasks();
    renderProjectTabs();
    renderTasks();
}

// Edit task
function editTask(id) {
    openModal(id);
}

// Delete task
function deleteTask(id) {
    if (confirm('Weet je zeker dat je deze taak wilt verwijderen?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderProjectTabs();
        renderTasks();
    }
}

// Filter tasks
function filterTasks() {
    renderTasks();
}

// Export tasks to CSV
function exportTasks() {
    const statusLabels = { 
        todo: 'Te doen', 
        'in-progress': 'In uitvoering', 
        blocked: 'Geblokkeerd', 
        review: 'Review', 
        done: 'Klaar' 
    };
    
    const csv = [
        ['Titel', 'Beschrijving', 'Project', 'Status', 'Prioriteit', 'Deadline', 'Voltooid', 'Aangemaakt'].join(','),
        ...tasks.map(t => [
            `"${t.title}"`,
            `"${t.description || ''}"`,
            `"${t.project || ''}"`,
            statusLabels[t.status || 'todo'],
            t.priority,
            t.deadline || '',
            t.completed ? 'Ja' : 'Nee',
            new Date(t.createdAt).toLocaleDateString('nl-NL')
        ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `actielijst-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Add log entry to task
function addTaskLog(taskId, message) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        if (!task.log) task.log = [];
        task.log.push({
            timestamp: new Date().toISOString(),
            message: message
        });
    }
}

// Add comment to task
function addCommentToTask(taskId, text, author = null) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        if (!task.comments) task.comments = [];
        const commentAuthor = author || task.assignedTo || 'Ik';
        task.comments.push({
            timestamp: new Date().toISOString(),
            author: commentAuthor,
            text: text
        });
        saveTasks();
    }
}

// Add comment from modal
function addComment() {
    const commentText = document.getElementById('newComment').value;
    if (!commentText.trim()) {
        alert('Voer een opmerking in');
        return;
    }
    
    addCommentToTask(currentLogTaskId, commentText);
    document.getElementById('newComment').value = '';
    showTaskLog(currentLogTaskId);
}

// Show task activity log
function showTaskLog(taskId) {
    currentLogTaskId = taskId;
    const task = tasks.find(t => t.id === taskId);
    const logList = document.getElementById('logList');
    const commentsSection = document.getElementById('commentsSection');
    const commentsList = document.getElementById('commentsList');
    const assignedSection = document.getElementById('assignedSection');
    const closeActionSection = document.getElementById('closeActionSection');
    
    if (task.assignedTo) {
        assignedSection.innerHTML = `
            <div class="assigned-label">Huidige Actiehouder:</div>
            <div class="assigned-value">${task.assignedTo}</div>
            <div class="assigned-edit">
                <input type="text" id="editAssignee" value="${task.assignedTo}" placeholder="Wijzig actiehouder">
                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="cancelEditAssignee()">Annuleren</button>
                    <button class="btn btn-primary" onclick="saveAssignee()">Opslaan</button>
                </div>
            </div>
        `;
    } else {
        assignedSection.innerHTML = '<div class="assigned-label">Geen actiehouder toegewezen</div>';
    }
    
    if (!task.completed && task.assignedTo) {
        closeActionSection.style.display = 'block';
    } else {
        closeActionSection.style.display = 'none';
    }
    
    if (!task.log || task.log.length === 0) {
        logList.innerHTML = '<div class="empty-state"><p>Geen activiteiten geregistreerd</p></div>';
    } else {
        logList.innerHTML = task.log.map(entry => {
            const date = new Date(entry.timestamp);
            const timeStr = date.toLocaleString('nl-NL');
            return `
                <div class="log-entry">
                    <div class="log-entry-time">${timeStr}</div>
                    <div class="log-entry-text">${entry.message}</div>
                </div>
            `;
        }).join('');
    }
    
    if (task.comments && task.comments.length > 0) {
        commentsList.innerHTML = task.comments.map(comment => {
            const date = new Date(comment.timestamp);
            const timeStr = date.toLocaleString('nl-NL');
            return `
                <div class="comment">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-time">${timeStr}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                </div>
            `;
        }).join('');
        commentsSection.style.display = 'block';
    } else {
        commentsSection.style.display = 'block';
        commentsList.innerHTML = '<p style="color: var(--text-muted);">Geen opmerkingen nog</p>';
    }
    
    document.getElementById('logModal').classList.add('active');
}

// Save edited assignee
function saveAssignee() {
    const task = tasks.find(t => t.id === currentLogTaskId);
    const newAssignee = document.getElementById('editAssignee').value.trim();
    
    if (!newAssignee) {
        alert('Voer een actiehouder in');
        return;
    }
    
    if (task.assignedTo !== newAssignee) {
        task.assignedTo = newAssignee;
        addTaskLog(task.id, `Actiehouder gewijzigd naar ${newAssignee}`);
        saveTasks();
        renderTasks();
        showTaskLog(currentLogTaskId);
    }
}

// Cancel edit assignee
function cancelEditAssignee() {
    showTaskLog(currentLogTaskId);
}

// Submit close action
function submitCloseAction() {
    const task = tasks.find(t => t.id === currentLogTaskId);
    const status = document.getElementById('closeStatus').value;
    const comment = document.getElementById('closeComment').value.trim();
    const newAssignee = document.getElementById('newAssignee').value.trim();
    
    if (!status) {
        alert('Selecteer een eindstatus');
        return;
    }
    
    if (!comment) {
        alert('Beschrijf wat je hebt afgehandeld');
        return;
    }
    
    addCommentToTask(task.id, `[AFGEMELD] ${comment}`);
    
    const statuses = { done: 'Afgehandeld', blocked: 'Geblokkeerd', review: 'Needs Review' };
    addTaskLog(task.id, `Actie afgemeld - Status: ${statuses[status]}`);
    
    if (newAssignee) {
        task.assignedTo = newAssignee;
        addTaskLog(task.id, `Nieuwe actie toegewezen aan ${newAssignee}`);
    } else {
        task.status = status;
        if (status === 'done') {
            task.completed = true;
            addTaskLog(task.id, '✅ Taak voltooid');
        }
        task.assignedTo = '';
    }
    
    saveTasks();
    renderProjectTabs();
    renderTasks();
    closeLogModal();
}

// Project manager functions
// Close log modal
function closeLogModal() {
    closeModal('logModal');
}

// Initialize
let templates = [];
let bulkSelected = new Set();
let bulkMode = false;
let tags = [];
let allTasks = [];

// FEATURE 1: Templates/Sjablonen
function saveTemplate() {
    const name = document.getElementById('templateName').value.trim();
    const description = document.getElementById('templateDescription').value.trim();
    const project = document.getElementById('templateProject').value;
    const priority = document.getElementById('templatePriority').value;
    const status = document.getElementById('templateStatus').value;

    if (!name) {
        alert('Voer een sjabloon naam in');
        return;
    }

    const template = {
        id: Date.now().toString(),
        name,
        description,
        project,
        priority,
        status
    };

    templates.push(template);
    localStorage.setItem('templates', JSON.stringify(templates));
    document.getElementById('templateName').value = '';
    document.getElementById('templateDescription').value = '';
    renderTemplatesList();
}

function renderTemplatesList() {
    const list = document.getElementById('templatesList');
    if (templates.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted);">Geen sjablonen beschikbaar</p>';
        return;
    }
    list.innerHTML = templates.map(t => `
        <div style="background: var(--dark-card); padding: 0.75rem; border-radius: 8px; border-left: 3px solid var(--primary);">
            <div style="font-weight: 600;">${t.name}</div>
            ${t.description ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">${t.description}</div>` : ''}
            <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                <button onclick="createFromTemplate('${t.id}')" class="btn btn-primary" style="font-size: 0.8rem;">Gebruiken</button>
                <button onclick="deleteTemplate('${t.id}')" class="btn btn-danger" style="font-size: 0.8rem;">🗑️</button>
            </div>
        </div>
    `).join('');
}

function createFromTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    document.getElementById('modalTitle').textContent = 'Nieuwe Taak van Sjabloon';
    document.getElementById('taskTitle').value = template.name;
    document.getElementById('taskDescription').value = template.description || '';
    document.getElementById('taskProject').value = template.project || '';
    document.getElementById('taskStatus').value = template.status || 'todo';
    document.getElementById('taskPriority').value = template.priority;
    
    document.getElementById('taskModal').classList.add('active');
    closeModal('templatesModal');
}

function deleteTemplate(templateId) {
    if (confirm('Weet je zeker dat je deze sjabloon wilt verwijderen?')) {
        templates = templates.filter(t => t.id !== templateId);
        localStorage.setItem('templates', JSON.stringify(templates));
        renderTemplatesList();
    }
}

// FEATURE 2: Recurring Tasks
function setupRecurringTask(taskId) {
    document.getElementById('recurringModal').dataset.taskId = taskId;
    document.getElementById('recurringType').value = 'none';
    document.getElementById('recurringOptions').style.display = 'none';
    openModal('recurringModal');
}

function updateRecurringUI() {
    const type = document.getElementById('recurringType').value;
    document.getElementById('recurringOptions').style.display = type !== 'none' ? 'block' : 'none';
}

function saveRecurringSettings() {
    const taskId = document.getElementById('recurringModal').dataset.taskId;
    const type = document.getElementById('recurringType').value;
    const interval = parseInt(document.getElementById('recurringInterval').value) || 1;
    const endDate = document.getElementById('recurringEndDate').value;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.recurring = { type, interval, endDate, lastCreated: new Date().toISOString() };
    saveTasks();
    closeModal('recurringModal');

    // Create next instance if needed
    if (type !== 'none') {
        setTimeout(() => createNextRecurringTask(taskId), 100);
    }
}

function createNextRecurringTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.recurring || task.recurring.type === 'none') return;

    const nextDate = getNextRecurringDate(task.recurring);
    if (task.recurring.endDate && nextDate > new Date(task.recurring.endDate)) return;

    const newTask = { ...task, id: Date.now().toString(), completed: false };
    delete newTask.log;
    delete newTask.comments;
    tasks.push(newTask);
    saveTasks();
}

function getNextRecurringDate(recurring) {
    const last = new Date(recurring.lastCreated);
    const next = new Date(last);
    
    switch(recurring.type) {
        case 'daily':
            next.setDate(next.getDate() + recurring.interval);
            break;
        case 'weekly':
            next.setDate(next.getDate() + (7 * recurring.interval));
            break;
        case 'monthly':
            next.setMonth(next.getMonth() + recurring.interval);
            break;
    }
    return next;
}

// FEATURE 3: Task Dependencies
function addTaskDependency(taskId, dependsOnTaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (!task.dependencies) task.dependencies = [];
    if (!task.dependencies.includes(dependsOnTaskId)) {
        task.dependencies.push(dependsOnTaskId);
        saveTasks();
    }
}

function removeTaskDependency(taskId, dependsOnTaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.dependencies) {
        task.dependencies = task.dependencies.filter(d => d !== dependsOnTaskId);
        saveTasks();
    }
}

function canTaskBeStarted(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.dependencies || task.dependencies.length === 0) return true;
    
    return task.dependencies.every(depId => {
        const depTask = tasks.find(t => t.id === depId);
        return depTask && depTask.completed;
    });
}

// FEATURE 4: Advanced Filters
function applyFilter(filterType) {
    let filtered = [];

    switch(filterType) {
        case 'myTasks':
            filtered = tasks.filter(t => !t.completed && !t.assignedTo);
            break;
        case 'assigned':
            filtered = tasks.filter(t => t.assignedTo && !t.completed);
            break;
        case 'overdue':
            filtered = tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date());
            break;
        case 'thisWeek':
            const today = new Date();
            const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            filtered = tasks.filter(t => {
                if (!t.deadline) return false;
                const d = new Date(t.deadline);
                return d >= today && d <= weekEnd && !t.completed;
            });
            break;
        case 'today':
            const todayStr = new Date().toISOString().split('T')[0];
            filtered = tasks.filter(t => t.deadline && t.deadline.startsWith(todayStr) && !t.completed);
            break;
        case 'active':
            filtered = tasks.filter(t => (t.status === 'in-progress' || t.status === 'blocked') && !t.completed);
            break;
        case 'pending':
            filtered = tasks.filter(t => t.status === 'todo' && !t.completed);
            break;
        case 'inReview':
            filtered = tasks.filter(t => t.status === 'review' && !t.completed);
            break;
        case 'done':
            filtered = tasks.filter(t => t.status === 'done' || t.completed);
            break;
        case 'highPriority':
            filtered = tasks.filter(t => t.priority === 'high' && !t.completed);
            break;
        case 'mediumPriority':
            filtered = tasks.filter(t => t.priority === 'medium' && !t.completed);
            break;
        case 'lowPriority':
            filtered = tasks.filter(t => t.priority === 'low' && !t.completed);
            break;
    }

    // Apply filter
    const taskList = document.getElementById('taskList');
    if (filtered.length === 0) {
        taskList.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><h3>Geen taken gevonden</h3></div>`;
        return;
    }

    taskList.innerHTML = filtered.map(task => {
        const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
        const priorityLabels = { high: 'Hoog', medium: 'Gemiddeld', low: 'Laag' };
        const statusLabels = { 
            todo: '📋 Te doen', 
            'in-progress': '⚡ In uitvoering', 
            blocked: '🚫 Geblokkeerd', 
            review: '👀 Review', 
            done: '✅ Klaar' 
        };
        const taskStatus = task.status || 'todo';
        
        return `
            <div class="task-card status-${taskStatus} ${task.completed ? 'completed' : ''}">
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         onclick="toggleTask('${task.id}')"></div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        <div class="task-meta">
                            ${task.project ? `<span class="badge badge-project">📁 ${task.project}</span>` : ''}
                            <span class="badge badge-status ${taskStatus}">${statusLabels[taskStatus]}</span>
                            <span class="badge badge-priority ${task.priority}">
                                ${task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '✓'} 
                                ${priorityLabels[task.priority]}
                            </span>
                            ${task.deadline ? `
                                <span class="badge badge-deadline ${isOverdue ? 'badge-priority' : ''}">
                                    📅 ${new Date(task.deadline).toLocaleDateString('nl-NL')}
                                    ${isOverdue ? ' (Verlopen!)' : ''}
                                </span>
                            ` : ''}
                            ${task.assignedTo ? `<span class="badge badge-assigned">👤 ${task.assignedTo}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="log-btn" onclick="showTaskLog('${task.id}')" title="Activiteiten">📋</button>
                        <button class="icon-btn" onclick="editTask('${task.id}')" title="Bewerken">✏️</button>
                        <button class="icon-btn" onclick="deleteTask('${task.id}')" title="Verwijderen">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    closeModal('filtersModal');
}

// FEATURE 5: Statistics Dashboard
function updateStatistics() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const overdueTasks = tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length;
    
    const today = new Date();
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thisWeekTasks = tasks.filter(t => {
        if (!t.deadline) return false;
        const d = new Date(t.deadline);
        return d >= today && d <= weekEnd && !t.completed;
    }).length;

    document.getElementById('statTotalTasks').textContent = totalTasks;
    document.getElementById('statCompletionRate').textContent = completionRate + '%';
    document.getElementById('statOverdue').textContent = overdueTasks;
    document.getElementById('statThisWeek').textContent = thisWeekTasks;

    // Per person stats
    const tasksByPerson = {};
    tasks.forEach(t => {
        const person = t.assignedTo || 'Niemand';
        if (!tasksByPerson[person]) tasksByPerson[person] = { total: 0, completed: 0 };
        tasksByPerson[person].total++;
        if (t.completed) tasksByPerson[person].completed++;
    });

    const personList = document.getElementById('statsPerPerson');
    personList.innerHTML = Object.entries(tasksByPerson).map(([person, stats]) => `
        <div style="background: var(--dark-card); padding: 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: 600;">${person}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${stats.completed}/${stats.total} voltooid</div>
            </div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">${Math.round((stats.completed/stats.total)*100)}%</div>
        </div>
    `).join('');
}

// FEATURE 6: Bulk Actions
function toggleBulkMode() {
    bulkMode = !bulkMode;
    bulkSelected.clear();
    if (!bulkMode) {
        document.querySelectorAll('.bulk-checkbox').forEach(cb => cb.style.display = 'none');
        document.querySelector('.bulk-actions').style.display = 'none';
    } else {
        document.querySelectorAll('.bulk-checkbox').forEach(cb => cb.style.display = 'block');
        document.querySelector('.bulk-actions').style.display = 'flex';
    }
}

function toggleBulkSelect(taskId) {
    if (bulkSelected.has(taskId)) {
        bulkSelected.delete(taskId);
    } else {
        bulkSelected.add(taskId);
    }
}

function executeBulkUpdate() {
    const newStatus = document.getElementById('bulkStatus').value;
    const newPriority = document.getElementById('bulkPriority').value;

    bulkSelected.forEach(taskId => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            if (newStatus) task.status = newStatus;
            if (newPriority) task.priority = newPriority;
            if (!task.log) task.log = [];
            task.log.push({
                timestamp: new Date().toISOString(),
                message: `Bulk update: Status ${newStatus || 'ongewijzigd'}, Priority ${newPriority || 'ongewijzigd'}`
            });
        }
    });

    saveTasks();
    renderTasks();
    bulkSelected.clear();
    toggleBulkMode();
    alert(`${bulkSelected.size} taken bijgewerkt`);
}

function executeBulkDelete() {
    if (!confirm(`Weet je zeker dat je ${bulkSelected.size} taken wilt verwijderen?`)) return;

    bulkSelected.forEach(taskId => {
        tasks = tasks.filter(t => t.id !== taskId);
    });

    saveTasks();
    renderTasks();
    bulkSelected.clear();
    toggleBulkMode();
}

// FEATURE 7: Browser Notifications
function checkDeadlines() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    tasks.filter(t => !t.completed && t.deadline).forEach(task => {
        const deadline = new Date(task.deadline);
        if (deadline >= today && deadline <= tomorrow) {
            new Notification('Taak Deadline Nabij', {
                body: `${task.title} moet morgen voltooid zijn!`,
                icon: '📋'
            });
        }
    });
}

// Check deadlines every hour
setInterval(checkDeadlines, 60 * 60 * 1000);

// FEATURE 8: Tags System
function addNewTag() {
    const input = document.getElementById('newTagInput');
    let tagName = input.value.trim();
    if (!tagName.startsWith('#')) tagName = '#' + tagName;

    if (tags.some(t => t.name === tagName)) {
        alert('Deze tag bestaat al');
        return;
    }

    tags.push({ name: tagName, color: generateTagColor() });
    localStorage.setItem('tags', JSON.stringify(tags));
    input.value = '';
    renderAvailableTags();
}

function generateTagColor() {
    const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function renderAvailableTags() {
    const list = document.getElementById('availableTagsList');
    list.innerHTML = tags.map(tag => `
        <div class="tag" style="background: ${tag.color}30; border: 2px solid ${tag.color}; color: ${tag.color};">
            ${tag.name}
            <button onclick="deleteTag('${tag.name}')" style="background: none; border: none; color: ${tag.color}; cursor: pointer;">×</button>
        </div>
    `).join('');
}

function deleteTag(tagName) {
    tags = tags.filter(t => t.name !== tagName);
    localStorage.setItem('tags', JSON.stringify(tags));
    renderAvailableTags();
}

function addTagToTask(taskId, tagName) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (!task.tags) task.tags = [];
    if (!task.tags.includes(tagName)) {
        task.tags.push(tagName);
        saveTasks();
    }
}

// Filter tasks by tag
function applyTagFilter(tagName) {
    const filtered = tasks.filter(t => t.tags && t.tags.includes(tagName) && !t.completed);
    
    const taskList = document.getElementById('taskList');
    if (filtered.length === 0) {
        taskList.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏷️</div><h3>Geen taken met tag ${tagName}</h3></div>`;
        return;
    }

    const priorityLabels = { high: 'Hoog', medium: 'Gemiddeld', low: 'Laag' };
    const statusLabels = { 
        todo: '📋 Te doen', 
        'in-progress': '⚡ In uitvoering', 
        blocked: '🚫 Geblokkeerd', 
        review: '👀 Review', 
        done: '✅ Klaar' 
    };

    taskList.innerHTML = filtered.map(task => {
        const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
        const taskStatus = task.status || 'todo';
        
        return `
            <div class="task-card status-${taskStatus} ${task.completed ? 'completed' : ''}">
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         onclick="toggleTask('${task.id}')"></div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        <div class="task-meta">
                            ${task.project ? `<span class="badge badge-project">📁 ${task.project}</span>` : ''}
                            <span class="badge badge-status ${taskStatus}">${statusLabels[taskStatus]}</span>
                            <span class="badge badge-priority ${task.priority}">
                                ${task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '✓'} 
                                ${priorityLabels[task.priority]}
                            </span>
                            ${task.deadline ? `
                                <span class="badge badge-deadline ${isOverdue ? 'badge-priority' : ''}">
                                    📅 ${new Date(task.deadline).toLocaleDateString('nl-NL')}
                                    ${isOverdue ? ' (Verlopen!)' : ''}
                                </span>
                            ` : ''}
                            ${task.assignedTo ? `<span class="badge badge-assigned">👤 ${task.assignedTo}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="log-btn" onclick="showTaskLog('${task.id}')" title="Activiteiten">📋</button>
                        <button class="icon-btn" onclick="editTask('${task.id}')" title="Bewerken">✏️</button>
                        <button class="icon-btn" onclick="deleteTask('${task.id}')" title="Verwijderen">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Load from localStorage
window.addEventListener('load', () => {
    loadTasks();
    const storedTemplates = localStorage.getItem('templates');
    if (storedTemplates) templates = JSON.parse(storedTemplates);
    const storedTags = localStorage.getItem('tags');
    if (storedTags) tags = JSON.parse(storedTags);
    
    // Load projects from shared storage
    const storedProjects = localStorage.getItem('projects');
    if (storedProjects) projects = JSON.parse(storedProjects);
    
    renderTemplatesList();
    renderAvailableTags();
    updateProjectSelect();
    renderProjectTabs();
    updateStats();
    updateStatistics();
    renderTasks();
});