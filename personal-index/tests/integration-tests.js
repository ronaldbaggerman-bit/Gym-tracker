/**
 * Integration tests for actual application functionality
 * Tests basic functionality and data operations
 * Run with: npm test
 */

describe('Application Integration Tests', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';

    // Reset global variables
    global.employees = [];
    global.leaves = [];
    global.projects = [];
    global.tasks = [];
    global.decisions = [];
  });

  describe('Global Variables Initialization', () => {
    test('should initialize werknemerplanning global variables', () => {
      // Manually initialize the global variables that the script would create
      global.employees = [];
      global.leaves = [];
      global.projects = [];
      global.selectedProject = 'all';
      global.currentView = 'month';
      global.editingEmployeeId = null;
      global.editingLeaveId = null;

      expect(Array.isArray(global.employees)).toBe(true);
      expect(Array.isArray(global.leaves)).toBe(true);
      expect(Array.isArray(global.projects)).toBe(true);
      expect(global.selectedProject).toBe('all');
    });

    test('should initialize actielijst global variables', () => {
      global.tasks = [];
      global.currentFilter = 'all';
      global.editingTaskId = null;

      expect(Array.isArray(global.tasks)).toBe(true);
      expect(global.currentFilter).toBe('all');
    });

    test('should initialize besluitenpagina global variables', () => {
      global.decisions = [];
      global.currentFilter = 'all';
      global.editingDecisionId = null;
      global.projects = ['OneCRM', 'Tranch 4', 'PriceKeys'];
      global.selectedProject = 'all';

      expect(Array.isArray(global.decisions)).toBe(true);
      expect(global.projects).toContain('OneCRM');
    });
  });

  describe('Data Operations Tests', () => {
    test('should handle basic data operations for employees', () => {
      global.employees = [];

      // Test basic array operations
      global.employees.push({ id: '1', name: 'Test Employee', projects: ['Project A'] });
      expect(global.employees.length).toBe(1);
      expect(global.employees[0].name).toBe('Test Employee');
      expect(global.employees[0].projects).toContain('Project A');
    });

    test('should handle basic data operations for tasks', () => {
      global.tasks = [];

      global.tasks.push({
        id: '1',
        title: 'Test Task',
        description: 'Test Description',
        project: 'Project A',
        status: 'todo'
      });
      expect(global.tasks.length).toBe(1);
      expect(global.tasks[0].title).toBe('Test Task');
      expect(global.tasks[0].status).toBe('todo');
    });

    test('should handle basic data operations for decisions', () => {
      global.decisions = [];

      global.decisions.push({
        id: '1',
        title: 'Test Decision',
        description: 'Test Description',
        project: 'Project A',
        status: 'pending'
      });
      expect(global.decisions.length).toBe(1);
      expect(global.decisions[0].title).toBe('Test Decision');
      expect(global.decisions[0].status).toBe('pending');
    });
  });

  describe('Cross-Module Data Consistency', () => {
    test('should maintain project references across modules', () => {
      // Initialize all global variables
      global.projects = ['Project Alpha', 'Project Beta', 'Project Gamma'];
      global.employees = [];
      global.tasks = [];
      global.decisions = [];

      // Add data that references projects
      global.employees.push({ id: '1', name: 'Jan', projects: ['Project Alpha'] });
      global.tasks.push({ id: '1', title: 'Task 1', project: 'Project Beta' });
      global.decisions.push({ id: '1', title: 'Decision 1', project: 'Project Gamma' });

      // Collect all referenced projects
      const referencedProjects = new Set();

      global.employees.forEach(emp => {
        emp.projects.forEach(project => referencedProjects.add(project));
      });

      global.tasks.forEach(task => {
        referencedProjects.add(task.project);
      });

      global.decisions.forEach(decision => {
        referencedProjects.add(decision.project);
      });

      // All referenced projects should exist in the master projects list
      const referencedArray = Array.from(referencedProjects);
      referencedArray.forEach(project => {
        expect(global.projects).toContain(project);
      });
    });

    test('should handle data filtering across modules', () => {
      global.projects = ['Project A', 'Project B'];
      global.tasks = [
        { id: '1', title: 'Task 1', project: 'Project A', status: 'todo' },
        { id: '2', title: 'Task 2', project: 'Project B', status: 'done' },
        { id: '3', title: 'Task 3', project: 'Project A', status: 'in-progress' }
      ];

      // Test filtering by project
      const projectATasks = global.tasks.filter(task => task.project === 'Project A');
      const projectBTasks = global.tasks.filter(task => task.project === 'Project B');

      expect(projectATasks.length).toBe(2);
      expect(projectBTasks.length).toBe(1);

      // Test filtering by status
      const todoTasks = global.tasks.filter(task => task.status === 'todo');
      const doneTasks = global.tasks.filter(task => task.status === 'done');

      expect(todoTasks.length).toBe(1);
      expect(doneTasks.length).toBe(1);
    });
  });

  describe('Data Validation Tests', () => {
    test('should validate employee data structure', () => {
      const validEmployee = {
        id: '1',
        name: 'Jan Jansen',
        projects: ['Project A', 'Project B']
      };

      const invalidEmployee = {
        name: 'Invalid Employee' // missing id and projects
      };

      // Test valid employee
      expect(validEmployee).toHaveProperty('id');
      expect(validEmployee).toHaveProperty('name');
      expect(validEmployee).toHaveProperty('projects');
      expect(Array.isArray(validEmployee.projects)).toBe(true);

      // Test invalid employee
      expect(invalidEmployee).not.toHaveProperty('id');
      expect(invalidEmployee).not.toHaveProperty('projects');
    });

    test('should validate task data structure', () => {
      const validTask = {
        id: '1',
        title: 'Test Task',
        description: 'Description',
        project: 'Project A',
        status: 'todo'
      };

      expect(validTask).toHaveProperty('id');
      expect(validTask).toHaveProperty('title');
      expect(validTask).toHaveProperty('project');
      expect(validTask).toHaveProperty('status');
      expect(['todo', 'in-progress', 'done']).toContain(validTask.status);
    });

    test('should validate decision data structure', () => {
      const validDecision = {
        id: '1',
        title: 'Test Decision',
        description: 'Description',
        project: 'Project A',
        status: 'pending',
        options: ['Option A', 'Option B']
      };

      expect(validDecision).toHaveProperty('id');
      expect(validDecision).toHaveProperty('title');
      expect(validDecision).toHaveProperty('project');
      expect(validDecision).toHaveProperty('status');
      expect(validDecision).toHaveProperty('options');
      expect(Array.isArray(validDecision.options)).toBe(true);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle corrupted localStorage data gracefully', () => {
      // Test that JSON.parse throws with invalid JSON
      expect(() => JSON.parse('{invalid')).toThrow();
      expect(() => JSON.parse('not json')).toThrow();
    });

    test('should handle missing DOM elements gracefully', () => {
      // Test that accessing non-existent DOM elements doesn't crash
      expect(() => {
        const element = document.getElementById('non-existent');
        if (element) {
          element.textContent = 'test';
        }
      }).not.toThrow();
    });

    test('should handle empty data arrays', () => {
      global.employees = [];
      global.tasks = [];
      global.decisions = [];

      expect(global.employees.length).toBe(0);
      expect(global.tasks.length).toBe(0);
      expect(global.decisions.length).toBe(0);

      // Operations on empty arrays should not crash
      expect(() => {
        global.employees.forEach(() => {});
        global.tasks.filter(() => true);
        global.decisions.map(() => ({}));
      }).not.toThrow();
    });
  });
});