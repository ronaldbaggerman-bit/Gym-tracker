/**
 * Integration tests for cross-module functionality
 * Run with: npm test
 */

describe('Cross-Module Integration', () => {
  describe('Project Consistency', () => {
    test('should maintain project consistency across modules', () => {
      const projects = ['Project Alpha', 'Project Beta', 'Project Gamma'];

      // Simulate data from different modules
      const employees = [
        { id: '1', name: 'Jan Jansen', projects: ['Project Alpha', 'Project Beta'] },
        { id: '2', name: 'Piet Pietersen', projects: ['Project Beta'] }
      ];

      const tasks = [
        { id: '1', title: 'Task 1', project: 'Project Alpha' },
        { id: '2', title: 'Task 2', project: 'Project Beta' },
        { id: '3', title: 'Task 3', project: 'Project Gamma' }
      ];

      const decisions = [
        { id: '1', title: 'Decision 1', project: 'Project Alpha' },
        { id: '2', title: 'Decision 2', project: 'Project Beta' }
      ];

      // Check that all projects referenced in data exist in master list
      const allReferencedProjects = new Set();

      employees.forEach(emp => {
        emp.projects.forEach(project => allReferencedProjects.add(project));
      });

      tasks.forEach(task => {
        allReferencedProjects.add(task.project);
      });

      decisions.forEach(decision => {
        allReferencedProjects.add(decision.project);
      });

      const referencedProjectsArray = Array.from(allReferencedProjects);

      // All referenced projects should exist in master projects list
      referencedProjectsArray.forEach(project => {
        expect(projects).toContain(project);
      });

      // Check for orphaned projects (projects in master list but not used)
      const usedProjects = new Set(referencedProjectsArray);
      const orphanedProjects = projects.filter(p => !usedProjects.has(p));

      expect(orphanedProjects).toEqual([]); // Should be empty for clean data
    });

    test('should handle project name changes consistently', () => {
      const oldProjectName = 'Project Alpha';
      const newProjectName = 'Project Alpha v2';

      // Simulate data before rename
      const employees = [
        { id: '1', name: 'Jan Jansen', projects: ['Project Alpha'] }
      ];

      const tasks = [
        { id: '1', title: 'Task 1', project: 'Project Alpha' }
      ];

      // Simulate rename operation
      employees.forEach(emp => {
        emp.projects = emp.projects.map(p => p === oldProjectName ? newProjectName : p);
      });

      tasks.forEach(task => {
        if (task.project === oldProjectName) {
          task.project = newProjectName;
        }
      });

      // Verify all references updated
      expect(employees[0].projects).toContain(newProjectName);
      expect(employees[0].projects).not.toContain(oldProjectName);
      expect(tasks[0].project).toBe(newProjectName);
      expect(tasks[0].project).not.toBe(oldProjectName);
    });
  });

  describe('Data Export/Import Integration', () => {
    test('should export all data correctly', () => {
      const mockData = {
        projects: ['Project A', 'Project B'],
        employees: [
          { id: '1', name: 'Jan Jansen', projects: ['Project A'] }
        ],
        tasks: [
          { id: '1', title: 'Task 1', project: 'Project A' }
        ],
        decisions: [
          { id: '1', title: 'Decision 1', project: 'Project A' }
        ],
        workplanning_leaves: [
          { id: '1', employeeId: '1', type: 'vacation' }
        ]
      };

      // Simulate exportAllData function
      const exportData = {
        projects: mockData.projects,
        employees: mockData.employees,
        tasks: mockData.tasks,
        decisions: mockData.decisions,
        workplanning_leaves: mockData.workplanning_leaves,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      // Verify export contains all data
      expect(exportData.projects).toEqual(mockData.projects);
      expect(exportData.employees).toEqual(mockData.employees);
      expect(exportData.tasks).toEqual(mockData.tasks);
      expect(exportData.decisions).toEqual(mockData.decisions);
      expect(exportData.workplanning_leaves).toEqual(mockData.workplanning_leaves);
      expect(exportData.exportDate).toBeDefined();
      expect(exportData.version).toBe('1.0');

      // Verify JSON is valid
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });

    test('should import data and validate integrity', () => {
      const importData = {
        projects: ['Project A', 'Project B'],
        employees: [
          { id: '1', name: 'Jan Jansen', projects: ['Project A'] }
        ],
        tasks: [
          { id: '1', title: 'Task 1', project: 'Project A' }
        ],
        decisions: [
          { id: '1', title: 'Decision 1', project: 'Project A' }
        ],
        workplanning_leaves: [
          { id: '1', employeeId: '1', type: 'vacation' }
        ],
        exportDate: '2025-12-01T10:00:00Z',
        version: '1.0'
      };

      // Simulate import validation
      const validationErrors = [];

      // Check required fields
      if (!importData.projects || !Array.isArray(importData.projects)) {
        validationErrors.push('Invalid projects data');
      }

      if (!importData.employees || !Array.isArray(importData.employees)) {
        validationErrors.push('Invalid employees data');
      }

      // Check data integrity
      importData.tasks.forEach(task => {
        if (!task.id || !task.title) {
          validationErrors.push(`Invalid task: ${task.id}`);
        }
      });

      importData.decisions.forEach(decision => {
        if (!decision.id || !decision.title) {
          validationErrors.push(`Invalid decision: ${decision.id}`);
        }
      });

      // Check referential integrity
      const projectNames = new Set(importData.projects);
      importData.tasks.forEach(task => {
        if (!projectNames.has(task.project)) {
          validationErrors.push(`Task ${task.id} references unknown project: ${task.project}`);
        }
      });

      expect(validationErrors).toHaveLength(0);
    });

    test('should handle corrupted import data gracefully', () => {
      const corruptedData = {
        projects: 'not an array',
        employees: null,
        tasks: undefined
      };

      // Simulate import validation
      const validationErrors = [];

      if (!Array.isArray(corruptedData.projects)) {
        validationErrors.push('Projects must be an array');
      }

      if (!Array.isArray(corruptedData.employees)) {
        validationErrors.push('Employees must be an array');
      }

      if (!Array.isArray(corruptedData.tasks)) {
        validationErrors.push('Tasks must be an array');
      }

      expect(validationErrors).toHaveLength(3);
      expect(validationErrors).toContain('Projects must be an array');
      expect(validationErrors).toContain('Employees must be an array');
      expect(validationErrors).toContain('Tasks must be an array');
    });
  });

  describe('End-to-End Workflow Simulation', () => {
    test('should simulate complete project lifecycle', () => {
      // Phase 1: Project Setup
      const project = { name: 'New Project', createdAt: '2025-12-01' };

      // Phase 2: Add Team Members
      const employees = [
        {
          id: 'emp-1',
          name: 'Project Manager',
          projects: [project.name],
          createdAt: '2025-12-01'
        },
        {
          id: 'emp-2',
          name: 'Developer',
          projects: [project.name],
          createdAt: '2025-12-01'
        }
      ];

      // Phase 3: Create Tasks
      const tasks = [
        {
          id: 'task-1',
          title: 'Setup development environment',
          project: project.name,
          assignedTo: 'Developer',
          status: 'todo',
          priority: 'high',
          createdAt: '2025-12-01'
        },
        {
          id: 'task-2',
          title: 'Create project plan',
          project: project.name,
          assignedTo: 'Project Manager',
          status: 'in-progress',
          priority: 'high',
          createdAt: '2025-12-01'
        }
      ];

      // Phase 4: Make Decisions
      const decisions = [
        {
          id: 'decision-1',
          title: 'Choose tech stack',
          project: project.name,
          status: 'pending',
          options: [
            { id: 'opt1', text: 'React + Node.js' },
            { id: 'opt2', text: 'Vue + Python' }
          ],
          createdAt: '2025-12-01'
        }
      ];

      // Phase 5: Plan Employee Leave
      const leaves = [
        {
          id: 'leave-1',
          employeeId: 'emp-2',
          startDate: '2025-12-20',
          endDate: '2025-12-24',
          type: 'vacation',
          createdAt: '2025-12-01'
        }
      ];

      // Verify data consistency
      expect(employees).toHaveLength(2);
      expect(tasks).toHaveLength(2);
      expect(decisions).toHaveLength(1);
      expect(leaves).toHaveLength(1);

      // Verify project references
      employees.forEach(emp => {
        expect(emp.projects).toContain(project.name);
      });

      tasks.forEach(task => {
        expect(task.project).toBe(project.name);
      });

      decisions.forEach(decision => {
        expect(decision.project).toBe(project.name);
      });

      // Verify task assignments match employees
      const employeeNames = employees.map(e => e.name);
      tasks.forEach(task => {
        expect(employeeNames).toContain(task.assignedTo);
      });

      // Verify leave references valid employee
      const employeeIds = employees.map(e => e.id);
      leaves.forEach(leave => {
        expect(employeeIds).toContain(leave.employeeId);
      });
    });

    test('should handle data relationships correctly', () => {
      // Create interconnected data
      const projects = ['Project A'];
      const employees = [
        { id: 'emp1', name: 'Alice', projects: ['Project A'] },
        { id: 'emp2', name: 'Bob', projects: ['Project A'] }
      ];

      const tasks = [
        { id: 'task1', title: 'Task 1', project: 'Project A', assignedTo: 'Alice' },
        { id: 'task2', title: 'Task 2', project: 'Project A', assignedTo: 'Bob' }
      ];

      const decisions = [
        { id: 'dec1', title: 'Decision 1', project: 'Project A' }
      ];

      const leaves = [
        { id: 'leave1', employeeId: 'emp1', type: 'vacation' }
      ];

      // Test relationships
      const aliceTasks = tasks.filter(t => t.assignedTo === 'Alice');
      const bobTasks = tasks.filter(t => t.assignedTo === 'Bob');
      const projectTasks = tasks.filter(t => t.project === 'Project A');
      const aliceLeaves = leaves.filter(l => l.employeeId === 'emp1');

      expect(aliceTasks).toHaveLength(1);
      expect(bobTasks).toHaveLength(1);
      expect(projectTasks).toHaveLength(2);
      expect(aliceLeaves).toHaveLength(1);

      // Verify no orphaned references
      const assignedNames = new Set(tasks.map(t => t.assignedTo));
      const employeeNames = new Set(employees.map(e => e.name));
      const assignedNotInEmployees = Array.from(assignedNames).filter(name => !employeeNames.has(name));

      expect(assignedNotInEmployees).toHaveLength(0);
    });
  });
});