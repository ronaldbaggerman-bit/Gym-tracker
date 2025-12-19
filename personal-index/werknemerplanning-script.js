// Data
let employees = [];
let leaves = [];
let projects = [];
let selectedProject = 'all';
let currentView = 'month';
let editingEmployeeId = null;
let editingLeaveId = null;

        const PLANNING_START = new Date(2026, 0, 1);
        const PLANNING_END = new Date(2027, 11, 31);
        const OCCUPANCY_THRESHOLD = 0.70;

        // OneDrive Sync Configuration
        const ONEDRIVE_CONFIG = {
            enabled: true,
            autoSync: true,
            syncInterval: 10000, // Check elke 10 seconden
            backupFileName: '.werknemerplanning-backup.json'
        };

        let syncTimer = null;
        let oneDrivePath = null;

        // Open add employee modal
        function openAddEmployeeModal() {
            editingEmployeeId = null;
            document.getElementById('employeeModalTitle').textContent = 'Werknemer Toevoegen';
            document.getElementById('employeeForm').reset();
            updateProjectCheckboxes();
            document.getElementById('employeeLeavesSection').style.display = 'none';
            document.getElementById('employeeModal').classList.add('active');
        }

        // Update project checkboxes
        function updateProjectCheckboxes(selectedProjects = []) {
            const container = document.getElementById('employeeProjectsCheckboxes');
            if (container) {
                container.innerHTML = projects.map(p => `
                    <label style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--dark-card); border: 1px solid ${selectedProjects.includes(p) ? 'var(--primary)' : 'var(--border)'}; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">
                        <input type="checkbox" name="employeeProjects" value="${p}" 
                            ${selectedProjects.includes(p) ? 'checked' : ''}
                            style="cursor: pointer; width: 18px; height: 18px; accent-color: var(--primary);">
                        <span style="font-weight: 500;">${p}</span>
                    </label>
                `).join('');
            }
        }

        // Render project tabs
        function renderProjectTabs() {
            const projectTabs = document.getElementById('projectTabs');
            
            const projectCounts = {};
            projects.forEach(p => {
                projectCounts[p] = employees.filter(e => {
                    const empProjects = Array.isArray(e.projects) ? e.projects : [e.project].filter(Boolean);
                    return empProjects.includes(p);
                }).length;
            });
            projectCounts['all'] = employees.length;

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
            updateView();
        }

        // Toggle alerts visibility
        function toggleAlerts() {
            const content = document.getElementById('alertsContent');
            const toggle = document.getElementById('alertsToggle');
            content.classList.toggle('collapsed');
            toggle.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
        }

        // Edit leave
        function editLeave(leaveId) {
            const leave = leaves.find(l => l.id === leaveId);
            if (!leave) return;

            document.getElementById('leaveEmployee').value = leave.employeeId;
            document.getElementById('leaveStartDate').value = leave.startDate;
            document.getElementById('leaveEndDate').value = leave.endDate;
            document.getElementById('leaveType').value = leave.type;
            document.getElementById('leaveNote').value = leave.note || '';

            // If parttime or has selectedDays, check the box and set checkboxes
            if (leave.type === 'parttime' || leave.selectedDays) {
                document.getElementById('applyWeekdays').checked = true;
                toggleWeekdaySelector();
                if (leave.selectedDays) {
                    document.querySelectorAll('.weekday-checkbox').forEach(cb => {
                        cb.checked = leave.selectedDays.includes(parseInt(cb.value));
                    });
                }
            }

            editingLeaveId = leaveId;
            document.getElementById('leaveModal').classList.add('active');
        }

        // Delete leave
        function deleteLeave(leaveId) {
            if (confirm('Weet je zeker dat je dit verlof wilt verwijderen?')) {
                leaves = leaves.filter(l => l.id !== leaveId);
                saveData();
                updateView();
                // Refresh the modal if open
                if (document.getElementById('employeeModal').classList.contains('active')) {
                    const employeeId = editingEmployeeId;
                    editEmployee(employeeId);
                }
            }
        }

        // Initialize
        window.addEventListener('load', async () => {
            detectOneDrivePath();
            await loadFromOneDrive();
            loadData();
            initializeDateInputs();
            updateView();
            startAutoSync();
        });

        // Sync bij afsluiten browser/tab
        window.addEventListener('beforeunload', (e) => {
            if (ONEDRIVE_CONFIG.enabled) {
                saveToOneDrive();
            }
        });

        // Sync bij visibility change (tab switch)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (ONEDRIVE_CONFIG.enabled) {
                    saveToOneDrive();
                }
            }
        });

        // Load from localStorage
        function loadData() {
            const storedEmployees = localStorage.getItem('workplanning_employees');
            const storedLeaves = localStorage.getItem('workplanning_leaves');
            
            // Load projects from shared storage (same as actielijst)
            const storedProjects = localStorage.getItem('projects');
            
            employees = storedEmployees ? JSON.parse(storedEmployees) : [];
            leaves = storedLeaves ? JSON.parse(storedLeaves) : [];
            projects = storedProjects ? JSON.parse(storedProjects) : ['OneCRM', 'Tranch 4', 'PriceKeys'];
            
            updateStats();
            updateLeaveEmployeeSelect();
            updateProjectCheckboxes();
            renderProjectTabs();
        }

        // Save to localStorage
        function saveData() {
            localStorage.setItem('workplanning_employees', JSON.stringify(employees));
            localStorage.setItem('workplanning_leaves', JSON.stringify(leaves));
            // Save to shared projects storage
            localStorage.setItem('projects', JSON.stringify(projects));
            localStorage.setItem('workplanning_lastModified', new Date().toISOString());
            
            // Auto sync to OneDrive (prioriteit) - blijft actief
            if (ONEDRIVE_CONFIG.enabled && ONEDRIVE_CONFIG.autoSync) {
                saveToOneDrive();
            }
            
            // Cloud sync alleen bij dagelijkse sync of handmatig
            // (Verwijderd: if (CLOUD_CONFIG.enabled && CLOUD_CONFIG.autoSync) { syncToCloud(); })
            
            loadData();
        }

        // Cloud Sync Functions
        async function syncToCloud() {
            if (!CLOUD_CONFIG.enabled) return;

            const data = {
                employees: employees,
                leaves: leaves,
                projects: projects,
                lastSync: new Date().toISOString(),
                version: '1.0'
            };

            try {
                let url = CLOUD_CONFIG.apiUrl;
                let method = 'POST';
                
                // Update existing bin if we have an ID
                if (CLOUD_CONFIG.binId) {
                    url = `${CLOUD_CONFIG.apiUrl}/${CLOUD_CONFIG.binId}`;
                    method = 'PUT';
                }

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': CLOUD_CONFIG.apiKey,
                        'X-Bin-Name': 'werknemerplanning-backup'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const result = await response.json();
                    
                    // Save bin ID for future updates
                    if (result.metadata && result.metadata.id) {
                        CLOUD_CONFIG.binId = result.metadata.id;
                        localStorage.setItem('werknemerplanning_binId', result.metadata.id);
                    }
                    
                    console.log('✅ Data synced to cloud:', new Date().toLocaleTimeString());
                    showSyncStatus('success');
                } else {
                    console.error('❌ Cloud sync failed:', response.status);
                    showSyncStatus('error');
                }
            } catch (error) {
                console.error('❌ Cloud sync error:', error);
                showSyncStatus('error');
            }
        }

        async function loadFromCloud() {
            if (!CLOUD_CONFIG.enabled || !CLOUD_CONFIG.binId) return;

            try {
                const response = await fetch(`${CLOUD_CONFIG.apiUrl}/${CLOUD_CONFIG.binId}/latest`, {
                    method: 'GET',
                    headers: {
                        'X-Master-Key': CLOUD_CONFIG.apiKey
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    const cloudData = result.record;
                    
                    // Check if cloud data is newer than local
                    const localLastModified = localStorage.getItem('workplanning_lastModified') || '1970-01-01';
                    const cloudLastSync = cloudData.lastSync || '1970-01-01';
                    
                    if (new Date(cloudLastSync) > new Date(localLastModified)) {
                        // Cloud data is newer, use it
                        employees = cloudData.employees || [];
                        leaves = cloudData.leaves || [];
                        projects = cloudData.projects || ['OneCRM', 'Tranch 4', 'PriceKeys'];
                        
                        // Save to localStorage
                        localStorage.setItem('workplanning_employees', JSON.stringify(employees));
                        localStorage.setItem('workplanning_leaves', JSON.stringify(leaves));
                        localStorage.setItem('projects', JSON.stringify(projects));
                        localStorage.setItem('workplanning_lastModified', cloudLastSync);
                        
                        console.log('✅ Data loaded from cloud');
                        showSyncStatus('loaded');
                    }
                }
            } catch (error) {
                console.error('⚠️ Could not load from cloud:', error);
            }
        }

        function startAutoSync() {
            // OneDrive sync heeft prioriteit - blijft elke 10s checken
            if (ONEDRIVE_CONFIG.enabled && ONEDRIVE_CONFIG.autoSync) {
                syncTimer = setInterval(() => {
                    loadFromOneDrive(); // Check for updates
                }, ONEDRIVE_CONFIG.syncInterval);
            }
        }

        // Dagelijkse cloud sync om 16:00
        function startDailyCloudSync() {
            // Check elke minuut of het 16:00 is
            setInterval(() => {
                const now = new Date();
                const hours = now.getHours();
                const minutes = now.getMinutes();
                
                // Om 16:00 en alleen als app zichtbaar is
                if (hours === 16 && minutes === 0 && !document.hidden) {
                    console.log('🕓 Automatische dagelijkse cloud sync om 16:00');
                    syncToCloud();
                    
                    // Toon notificatie
                    showNotification('☁️ Data gesynchroniseerd naar cloud', 'success');
                }
            }, 60000); // Check elke minuut
        }

        // Eenvoudige notificatie functie
        function showNotification(message, type = 'info') {
            // Maak een tijdelijke notificatie div
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#10b981' : '#f59e0b'};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                font-weight: 600;
                max-width: 300px;
                animation: slideInRight 0.3s ease;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // Verwijder na 3 seconden
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        // ===== OneDrive Functions =====
        
        function detectOneDrivePath() {
            // Detecteer OneDrive pad op basis van huidige bestandslocatie
            const currentPath = window.location.pathname;
            
            // Check if we're already in OneDrive
            if (currentPath.includes('OneDrive')) {
                const pathParts = currentPath.split('/');
                const oneDriveIndex = pathParts.findIndex(p => p.includes('OneDrive'));
                if (oneDriveIndex >= 0) {
                    oneDrivePath = pathParts.slice(0, oneDriveIndex + 2).join('/');
                    console.log('✅ OneDrive gedetecteerd:', oneDrivePath);
                    return;
                }
            }
            
            console.log('⚠️ Niet in OneDrive map - OneDrive sync uitgeschakeld');
            ONEDRIVE_CONFIG.enabled = false;
        }

        async function saveToOneDrive() {
            if (!ONEDRIVE_CONFIG.enabled) return;

            const data = {
                employees: employees,
                leaves: leaves,
                projects: projects,
                lastModified: new Date().toISOString(),
                version: '1.0',
                device: 'unknown'
            };

            try {
                // Gebruik File System Access API (moderne browsers)
                const jsonString = JSON.stringify(data, null, 2);
                
                // Create a blob
                const blob = new Blob([jsonString], { type: 'application/json' });
                
                // Trigger download naar huidige map (OneDrive)
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = ONEDRIVE_CONFIG.backupFileName;
                a.style.display = 'none';
                
                // Auto-download if in OneDrive folder
                // User needs to save in same folder as HTML file
                document.body.appendChild(a);
                // Don't auto-click to avoid annoying downloads
                // a.click(); 
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);

                console.log('✅ OneDrive backup voorbereid');
                
                // Alternative: Use localStorage as intermediate
                localStorage.setItem('onedrive_backup_pending', jsonString);
                
            } catch (error) {
                console.error('❌ OneDrive save error:', error);
            }
        }

        async function loadFromOneDrive() {
            if (!ONEDRIVE_CONFIG.enabled) return;
            
            try {
                // Try to load backup file from same directory
                const backupPath = `./${ONEDRIVE_CONFIG.backupFileName}`;
                
                const response = await fetch(backupPath);
                if (response.ok) {
                    const backupData = await response.json();
                    
                    // Check if backup is newer than local
                    const localLastModified = localStorage.getItem('workplanning_lastModified') || '1970-01-01';
                    const backupLastModified = backupData.lastModified || '1970-01-01';
                    
                    if (new Date(backupLastModified) > new Date(localLastModified)) {
                        // Backup is newer - import it
                        employees = backupData.employees || [];
                        leaves = backupData.leaves || [];
                        projects = backupData.projects || ['OneCRM', 'Tranch 4', 'PriceKeys'];
                        
                        // Save to localStorage
                        localStorage.setItem('workplanning_employees', JSON.stringify(employees));
                        localStorage.setItem('workplanning_leaves', JSON.stringify(leaves));
                        localStorage.setItem('projects', JSON.stringify(projects));
                        localStorage.setItem('workplanning_lastModified', backupLastModified);
                        
                        console.log('✅ Data geladen van OneDrive backup');
                        showSyncStatus('onedrive-loaded');
                        return true;
                    }
                }
            } catch (error) {
                // Backup file doesn't exist yet - that's okay
                console.log('ℹ️ Geen OneDrive backup gevonden (eerste keer?)');
            }
            
            return false;
        }

        function showOneDriveStatus() {
            if (!ONEDRIVE_CONFIG.enabled) return;
            
            // Show indicator that OneDrive sync is active
            const currentPath = window.location.pathname;
            if (currentPath.includes('OneDrive')) {
                showSyncStatus('onedrive-active');
            }
        }

        function showSyncStatus(status) {
            const statusMap = {
                'success': '☁️ Gesynchroniseerd',
                'error': '⚠️ Sync mislukt',
                'loaded': '📥 Geladen van cloud',
                'onedrive-active': '📁 OneDrive actief',
                'onedrive-loaded': '📁 Geladen van OneDrive',
                'onedrive-saved': '📁 Opgeslagen in OneDrive',
                'onedrive-imported': '📁 Geïmporteerd van OneDrive'
            };
            
            // Create or update status indicator
            let indicator = document.getElementById('syncStatusIndicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'syncStatusIndicator';
                indicator.style.cssText = `
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    padding: 0.75rem 1rem;
                    background: var(--dark-card);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.875rem;
                    z-index: 10000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                `;
                document.body.appendChild(indicator);
            }
            
            indicator.textContent = statusMap[status] || status;
            indicator.style.opacity = '1';
            
            // Fade out after 3 seconds
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 3000);
        }

        // Initialize date inputs
        function initializeDateInputs() {
            // Default to full 2-year range for each employee
            document.getElementById('startDate').valueAsDate = PLANNING_START;
            document.getElementById('endDate').valueAsDate = PLANNING_END;
        }

        // Update leave employee select
        function updateLeaveEmployeeSelect() {
            const select = document.getElementById('leaveEmployee');
            select.innerHTML = '<option value="">-- Selecteer werknemer --</option>' +
                employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
        }

        // Update stats
        function updateStats() {
            document.getElementById('statTotalEmployees').textContent = employees.length;
            
            const plannedDays = leaves.length;
            document.getElementById('statPlannedDays').textContent = plannedDays;

            // Calculate average occupancy
            const weeks = getWeeksInRange(PLANNING_START, PLANNING_END);
            let totalOccupancy = 0;
            let lowWeekCount = 0;

            weeks.forEach(week => {
                const occupancy = calculateWeekOccupancy(week.start, week.end);
                totalOccupancy += occupancy;
                if (occupancy < OCCUPANCY_THRESHOLD) {
                    lowWeekCount++;
                }
            });

            const avgOccupancy = weeks.length > 0 ? Math.round((totalOccupancy / weeks.length) * 100) : 0;
            document.getElementById('statAverageOccupancy').textContent = avgOccupancy + '%';
            document.getElementById('statLowWeeks').textContent = lowWeekCount;
        }

        // Get weeks in range
        function getWeeksInRange(start, end) {
            const weeks = [];
            let current = new Date(start);

            while (current <= end) {
                const weekStart = new Date(current);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 4);

                weeks.push({ start: weekStart, end: weekEnd });
                current.setDate(current.getDate() + 7);
            }

            return weeks;
        }

        // Calculate week occupancy
        function calculateWeekOccupancy(weekStart, weekEnd) {
            if (employees.length === 0) return 100;

            let totalPresent = 0;
            let totalDays = 0;

            // Count working days (Monday-Friday)
            for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
                if (d.getDay() >= 1 && d.getDay() <= 5) { // Monday to Friday
                    totalDays++;
                }
            }

            employees.forEach(emp => {
                const empLeaves = leaves.filter(l => l.employeeId === emp.id);
                
                for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
                    if (d.getDay() >= 1 && d.getDay() <= 5) {
                        const dateStr = d.toISOString().split('T')[0];
                        const hasLeave = empLeaves.some(l => {
                            const start = new Date(l.startDate);
                            const end = new Date(l.endDate);
                            const startStr = start.toISOString().split('T')[0];
                            const endStr = end.toISOString().split('T')[0];
                            return dateStr >= startStr && dateStr <= endStr;
                        });

                        if (!hasLeave) {
                            totalPresent++;
                        }
                    }
                }
            });

            return totalDays > 0 ? totalPresent / (employees.length * totalDays) : 1;
        }

        // Switch view
        function switchView(view) {
            currentView = view;
            document.querySelectorAll('.view-btn').forEach((btn, idx) => {
                btn.classList.toggle('active', 
                    (idx === 0 && view === 'month') ||
                    (idx === 1 && view === 'week') ||
                    (idx === 2 && view === 'custom')
                );
            });

            const today = new Date();
            
            if (view === 'month') {
                // Show current month
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                document.getElementById('startDate').valueAsDate = startOfMonth;
                document.getElementById('endDate').valueAsDate = endOfMonth;
            } else if (view === 'week') {
                // Show current week (Monday to Sunday)
                const dayOfWeek = today.getDay();
                const monday = new Date(today);
                monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                document.getElementById('startDate').valueAsDate = monday;
                document.getElementById('endDate').valueAsDate = sunday;
            } else {
                // Custom - keep current values or reset to full range
                if (!document.getElementById('startDate').value) {
                    document.getElementById('startDate').valueAsDate = PLANNING_START;
                    document.getElementById('endDate').valueAsDate = PLANNING_END;
                }
            }
            
            updateView();
        }

        // Update view
        function updateView() {
            const startDate = document.getElementById('startDate').valueAsDate;
            const endDate = document.getElementById('endDate').valueAsDate;

            if (!startDate || !endDate) return;

            renderPlanning(startDate, endDate);
            renderAlerts(startDate, endDate);
        }

        // Render alerts
        function renderAlerts(start, end) {
            const alertsContainer = document.getElementById('alertsContainer');
            const weeks = getWeeksInRange(start, end);
            const lowOccupancyWeeks = [];

            weeks.forEach(week => {
                const occupancy = calculateWeekOccupancy(week.start, week.end);
                if (occupancy < OCCUPANCY_THRESHOLD) {
                    lowOccupancyWeeks.push({
                        week: week,
                        occupancy: Math.round(occupancy * 100)
                    });
                }
            });

            if (lowOccupancyWeeks.length === 0) {
                alertsContainer.innerHTML = '';
                return;
            }

            alertsContainer.innerHTML = `
                <div class="alerts-header" onclick="toggleAlerts()">
                    <h3>⚠️ Lage Bezetting Waarschuwingen (${lowOccupancyWeeks.length})</h3>
                    <span class="alerts-toggle" id="alertsToggle">▼</span>
                </div>
                <div id="alertsContent" class="alerts-content">
                    ${lowOccupancyWeeks.map(item => `
                        <div class="alert">
                            <div class="alert-icon">⚠️</div>
                            <div class="alert-content">
                                <h3>Lage Bezetting Gedetecteerd</h3>
                                <p>Week ${item.week.start.toLocaleDateString('nl-NL')} - ${item.week.end.toLocaleDateString('nl-NL')}: ${item.occupancy}% (onder 70%)</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Render planning
        function renderPlanning(start, end) {
            const grid = document.getElementById('planningGrid');

            // Filter employees by selected project
            const filteredEmployees = selectedProject === 'all' 
                ? employees 
                : employees.filter(e => {
                    const empProjects = Array.isArray(e.projects) ? e.projects : [e.project].filter(Boolean);
                    return empProjects.includes(selectedProject);
                });

            if (filteredEmployees.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <h3>Geen werknemers gevonden</h3>
                        <p>${selectedProject === 'all' ? 'Voeg werknemers toe om de planning te zien.' : 'Geen werknemers in dit project.'}</p>
                    </div>
                `;
                return;
            }

            // Generate date range
            const dates = [];
            const startDate = new Date(start);
            const endDate = new Date(end);
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                dates.push(new Date(d));
            }

            // Get week number
            function getWeekNumber(date) {
                const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                const dayNum = d.getUTCDay() || 7;
                d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
            }

            // Header rows with week numbers and dates
            let html = `
                <div class="planning-row">
                    <div class="planning-header">Werknemer</div>
                    <div class="planning-cells">
                        ${dates.map((date, idx) => {
                            const isMonday = date.getDay() === 1;
                            const weekNum = isMonday ? `<div class="week-number">W${getWeekNumber(date)}</div>` : '<div class="week-number-spacer"></div>';
                            return weekNum;
                        }).join('')}
                    </div>
                </div>
                <div class="planning-row">
                    <div class="planning-header"></div>
                    <div class="planning-cells">
                        ${dates.map((date, idx) => {
                            const day = date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            return `<div class="planning-header ${isWeekend ? 'weekend' : ''}">${day}</div>`;
                        }).join('')}
                    </div>
                </div>
            `;

            // Employee rows
            filteredEmployees.forEach(emp => {
                const empLeaves = leaves.filter(l => l.employeeId === emp.id);
                
                html += `
                    <div class="planning-row">
                        <div style="font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div onclick="editEmployee('${emp.id}')" style="cursor: pointer;">${emp.name}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${Array.isArray(emp.projects) ? emp.projects.join(', ') : (emp.project || '')}</div>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button onclick="editEmployee('${emp.id}')" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 1rem;" title="Bewerken">✏️</button>
                                <button onclick="deleteEmployee('${emp.id}')" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 1rem;" title="Verwijderen">🗑️</button>
                            </div>
                        </div>
                        <div class="planning-cells">
                            ${dates.map((date, idx) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                const isMonday = date.getDay() === 1;
                                
                                const leave = empLeaves.find(l => {
                                    const leaveStart = new Date(l.startDate);
                                    const leaveEnd = new Date(l.endDate);
                                    const inRange = dateStr >= leaveStart.toISOString().split('T')[0] && dateStr <= leaveEnd.toISOString().split('T')[0];
                                    if (l.selectedDays) {
                                        return inRange && l.selectedDays.includes(date.getDay());
                                    }
                                    return inRange;
                                });

                                let cellClass = 'planning-cell present';
                                let cellText = '✓';
                                let clickAction = `openLeaveModal('${emp.id}', '${dateStr}')`;
                                let title = 'Aanwezig - Klik om verlof toe te voegen';

                                if (leave) {
                                    cellClass = `planning-cell ${leave.type}`;
                                    const typeEmojis = { vacation: '🏖️', sick: '🤒', parttime: '⏱️' };
                                    cellText = typeEmojis[leave.type] || leave.type[0].toUpperCase();
                                    clickAction = `openEditDayModal('${leave.id}', '${emp.id}', '${emp.name}', '${dateStr}', '${leave.type}')`;
                                    title = `${leave.type} - Klik om aan te passen`;
                                }

                                if (isWeekend) {
                                    cellClass += ' weekend';
                                }

                                return `
                                    <div class="${cellClass}" onclick="${clickAction}" title="${title}" style="cursor: pointer;">
                                        ${cellText}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            });

            grid.innerHTML = html;
        }

        // Edit employee
        function editEmployee(employeeId) {
            const employee = employees.find(e => e.id === employeeId);
            if (!employee) return;

            editingEmployeeId = employeeId;
            document.getElementById('employeeModalTitle').textContent = 'Werknemer Bewerken';
            document.getElementById('employeeName').value = employee.name;
            document.getElementById('employeeRole').value = employee.role;
            
            updateProjectCheckboxes(employee.projects || [employee.project].filter(Boolean));
            
            // Show leaves
            const employeeLeaves = leaves.filter(l => l.employeeId === employeeId);
            const leavesList = document.getElementById('employeeLeavesList');
            if (employeeLeaves.length > 0) {
                leavesList.innerHTML = employeeLeaves.map(leave => {
                    let daysInfo = '';
                    if (leave.selectedDays) {
                        const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
                        daysInfo = ' (' + leave.selectedDays.map(d => dayNames[d]).join(', ') + ')';
                    }
                    return `
                    <div style="padding: 0.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${leave.type}</strong>: ${leave.startDate} - ${leave.endDate}${daysInfo}
                            ${leave.note ? `<br><small>${leave.note}</small>` : ''}
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary" onclick="editLeave('${leave.id}')" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;">Bewerk</button>
                            <button class="btn btn-danger" onclick="deleteLeave('${leave.id}')" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;">Verwijder</button>
                        </div>
                    </div>
                    `;
                }).join('');
                document.getElementById('employeeLeavesSection').style.display = 'block';
            } else {
                document.getElementById('employeeLeavesSection').style.display = 'none';
            }
            
            document.getElementById('employeeModal').classList.add('active');
        }

        // Open leave modal
        function openLeaveModal(employeeId = null, clickedDate = null) {
            editingLeaveId = null;
            if (employeeId) {
                document.getElementById('leaveEmployee').value = employeeId;
            }
            
            // Set clicked date as default start and end date
            if (clickedDate) {
                document.getElementById('leaveStartDate').value = clickedDate;
                document.getElementById('leaveEndDate').value = clickedDate;
            }
            
            document.getElementById('leaveModal').classList.add('active');
        }

        // Close modal
        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        // Open project manager
        // Add project
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
            saveData();
            openProjectManager();
        }

        // Save employee
        function saveEmployee(event) {
            event.preventDefault();

            const selectedProjects = Array.from(document.querySelectorAll('input[name="employeeProjects"]:checked'))
                .map(cb => cb.value);

            if (selectedProjects.length === 0) {
                alert('Selecteer minimaal één project');
                return;
            }

            const employee = {
                id: editingEmployeeId || Date.now().toString(),
                name: document.getElementById('employeeName').value,
                role: document.getElementById('employeeRole').value,
                projects: selectedProjects,
                createdAt: editingEmployeeId ? employees.find(e => e.id === editingEmployeeId).createdAt : new Date().toISOString()
            };

            if (editingEmployeeId) {
                const idx = employees.findIndex(e => e.id === editingEmployeeId);
                employees[idx] = { ...employees[idx], ...employee };
            } else {
                employees.push(employee);
            }

            saveData();
            closeModal('employeeModal');
            updateView();
        }

        // Toggle weekday selector
        function toggleWeekdaySelector() {
            const isChecked = document.getElementById('applyWeekdays').checked;
            document.getElementById('weekdaySelector').style.display = isChecked ? 'block' : 'none';
        }

        // On leave type change
        function onLeaveTypeChange() {
            const type = document.getElementById('leaveType').value;
            if (type === 'parttime') {
                document.getElementById('applyWeekdays').checked = true;
                toggleWeekdaySelector();
            } else {
                document.getElementById('applyWeekdays').checked = false;
                toggleWeekdaySelector();
            }
        }

        // Save leave
        function saveLeave(event) {
            event.preventDefault();

            const employeeId = document.getElementById('leaveEmployee').value;
            const startDate = document.getElementById('leaveStartDate').value;
            const endDate = document.getElementById('leaveEndDate').value;
            const type = document.getElementById('leaveType').value;
            const note = document.getElementById('leaveNote').value;
            const applyWeekdays = document.getElementById('applyWeekdays').checked;

            if (new Date(endDate) < new Date(startDate)) {
                alert('Einddatum moet na startdatum zijn!');
                return;
            }

            if (applyWeekdays) {
                // Get selected weekdays
                const selectedDays = Array.from(document.querySelectorAll('.weekday-checkbox:checked'))
                    .map(cb => parseInt(cb.value));
                
                if (selectedDays.length === 0) {
                    alert('Selecteer minimaal één weekdag!');
                    return;
                }

                // Single leave entry for the period with selected days
                const leave = {
                    id: editingLeaveId || Date.now().toString(),
                    employeeId: employeeId,
                    startDate: startDate,
                    endDate: endDate,
                    type: type,
                    note: note,
                    selectedDays: selectedDays
                };
                if (editingLeaveId) {
                    const idx = leaves.findIndex(l => l.id === editingLeaveId);
                    if (idx >= 0) {
                        leaves[idx] = leave;
                    }
                } else {
                    leaves.push(leave);
                }
            } else {
                // Regular single leave entry
                const leave = {
                    id: editingLeaveId || Date.now().toString(),
                    employeeId: employeeId,
                    startDate: startDate,
                    endDate: endDate,
                    type: type,
                    note: note
                };
                if (editingLeaveId) {
                    const idx = leaves.findIndex(l => l.id === editingLeaveId);
                    if (idx >= 0) {
                        leaves[idx] = leave;
                    }
                } else {
                    leaves.push(leave);
                }
            }

            saveData();
            updateView();
            closeModal('leaveModal');
            document.getElementById('leaveForm').reset();
            document.getElementById('weekdaySelector').style.display = 'none';
            document.getElementById('applyWeekdays').checked = false;
            document.querySelectorAll('.weekday-checkbox').forEach(cb => cb.checked = false);
            editingLeaveId = null;
            updateView();
        }

        // Delete employee
        function deleteEmployee(id) {
            if (confirm('Weet je zeker dat je deze werknemer wilt verwijderen?')) {
                employees = employees.filter(e => e.id !== id);
                leaves = leaves.filter(l => l.employeeId !== id);
                saveData();
                updateView();
            }
        }

        // Edit day modal - stores current context
        let editDayContext = {
            leaveId: null,
            employeeId: null,
            employeeName: null,
            dateStr: null,
            currentType: null
        };

        // Open edit day modal
        function openEditDayModal(leaveId, employeeId, employeeName, dateStr, currentType) {
            editDayContext = { leaveId, employeeId, employeeName, dateStr, currentType };
            
            const date = new Date(dateStr);
            const formattedDate = date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            
            document.getElementById('editDayEmployee').textContent = employeeName;
            document.getElementById('editDayDate').textContent = formattedDate;
            
            const statusMap = {
                'vacation': '🏖️ Vakantie',
                'sick': '🤒 Ziek',
                'parttime': '⏱️ Parttime'
            };
            document.getElementById('editDayCurrentStatus').textContent = `Huidige status: ${statusMap[currentType]}`;
            
            document.getElementById('editDayModal').classList.add('active');
        }

        // Change day status
        function changeDayStatus(newStatus) {
            const { leaveId, employeeId, dateStr, currentType } = editDayContext;
            
            if (newStatus === 'work') {
                // Remove leave for this day
                removeLeaveDay(leaveId, dateStr);
            } else if (newStatus !== currentType) {
                // Change leave type for this day
                changeLeaveType(leaveId, dateStr, newStatus, employeeId);
            }
            
            closeModal('editDayModal');
        }

        // Change leave type for specific day
        function changeLeaveType(leaveId, dateStr, newType, employeeId) {
            const leaveIndex = leaves.findIndex(l => l.id === leaveId);
            if (leaveIndex === -1) return;

            const leave = leaves[leaveIndex];
            const targetDate = dateStr;
            const leaveStart = leave.startDate;
            const leaveEnd = leave.endDate;

            // If leave is only one day, just change the type
            if (leaveStart === leaveEnd && leaveStart === targetDate) {
                leaves[leaveIndex].type = newType;
            }
            // If it's the first day, split and change
            else if (leaveStart === targetDate) {
                const dayAfter = new Date(leaveStart);
                dayAfter.setDate(dayAfter.getDate() + 1);
                
                // Move existing leave forward
                leaves[leaveIndex].startDate = dayAfter.toISOString().split('T')[0];
                
                // Create new single-day leave with new type
                leaves.push({
                    id: Date.now().toString(),
                    employeeId: employeeId,
                    startDate: targetDate,
                    endDate: targetDate,
                    type: newType,
                    note: ''
                });
            }
            // If it's the last day
            else if (leaveEnd === targetDate) {
                const dayBefore = new Date(leaveEnd);
                dayBefore.setDate(dayBefore.getDate() - 1);
                
                // Shorten existing leave
                leaves[leaveIndex].endDate = dayBefore.toISOString().split('T')[0];
                
                // Create new single-day leave with new type
                leaves.push({
                    id: Date.now().toString(),
                    employeeId: employeeId,
                    startDate: targetDate,
                    endDate: targetDate,
                    type: newType,
                    note: ''
                });
            }
            // If it's in the middle, split into three periods
            else {
                const dayBefore = new Date(targetDate);
                dayBefore.setDate(dayBefore.getDate() - 1);
                const dayAfter = new Date(targetDate);
                dayAfter.setDate(dayAfter.getDate() + 1);

                // Shorten existing leave to end day before
                leaves[leaveIndex].endDate = dayBefore.toISOString().split('T')[0];

                // Create new leave for target day with new type
                leaves.push({
                    id: Date.now().toString(),
                    employeeId: employeeId,
                    startDate: targetDate,
                    endDate: targetDate,
                    type: newType,
                    note: ''
                });

                // Create new leave for days after
                leaves.push({
                    id: (Date.now() + 1).toString(),
                    employeeId: employeeId,
                    startDate: dayAfter.toISOString().split('T')[0],
                    endDate: leaveEnd,
                    type: leave.type,
                    note: leave.note
                });
            }

            saveData();
            updateView();
            showSyncStatus('onedrive-saved');
        }

        // Remove leave for specific day
        function removeLeaveDay(leaveId, dateStr) {
            const leaveIndex = leaves.findIndex(l => l.id === leaveId);
            if (leaveIndex === -1) return;

            const leave = leaves[leaveIndex];
            const targetDate = dateStr;
            const leaveStart = leave.startDate;
            const leaveEnd = leave.endDate;

            // If leave is only one day, delete entire leave entry
            if (leaveStart === leaveEnd && leaveStart === targetDate) {
                leaves.splice(leaveIndex, 1);
            }
            // If it's the first day of multi-day leave, move start date forward
            else if (leaveStart === targetDate) {
                const newStart = new Date(leaveStart);
                newStart.setDate(newStart.getDate() + 1);
                leaves[leaveIndex].startDate = newStart.toISOString().split('T')[0];
            }
            // If it's the last day, move end date backward
            else if (leaveEnd === targetDate) {
                const newEnd = new Date(leaveEnd);
                newEnd.setDate(newEnd.getDate() - 1);
                leaves[leaveIndex].endDate = newEnd.toISOString().split('T')[0];
            }
            // If it's in the middle, split into two leave periods
            else {
                const dayBefore = new Date(targetDate);
                dayBefore.setDate(dayBefore.getDate() - 1);
                const dayAfter = new Date(targetDate);
                dayAfter.setDate(dayAfter.getDate() + 1);

                // Shorten existing leave to end day before
                leaves[leaveIndex].endDate = dayBefore.toISOString().split('T')[0];

                // Create new leave for days after
                const newLeave = {
                    id: Date.now().toString(),
                    employeeId: leave.employeeId,
                    startDate: dayAfter.toISOString().split('T')[0],
                    endDate: leaveEnd,
                    type: leave.type,
                    note: leave.note
                };
                leaves.push(newLeave);
            }

            saveData();
            updateView();
            showSyncStatus('onedrive-saved');
        }

        // Cloud Sync UI Functions
        // Export planning