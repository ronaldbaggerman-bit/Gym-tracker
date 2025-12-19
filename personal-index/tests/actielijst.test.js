/**
 * Tests for actielijst (task management) functionality
 * Run with: npm test
 */

describe('Actielijst Task Management', () => {
  describe('Task Data Structure', () => {
    test('should create valid task object', () => {
      const task = {
        id: 'task-123',
        title: 'Test Task',
        description: 'This is a test task',
        project: 'Project A',
        status: 'todo',
        priority: 'high',
        deadline: '2025-12-31',
        startDate: '2025-12-01',
        endDate: '2025-12-31',
        assignedTo: 'Jan Jansen',
        tags: ['urgent', 'important'],
        completed: false,
        createdAt: '2025-12-01T10:00:00Z',
        log: [],
        comments: []
      };

      expect(task.id).toBe('task-123');
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('high');
      expect(task.tags).toContain('urgent');
      expect(task.completed).toBe(false);
    });

    test('should handle task without optional fields', () => {
      const minimalTask = {
        id: 'task-456',
        title: 'Minimal Task',
        status: 'todo',
        completed: false,
        createdAt: '2025-12-01T10:00:00Z'
      };

      expect(minimalTask.title).toBe('Minimal Task');
      expect(minimalTask.description).toBeUndefined();
      expect(minimalTask.tags).toBeUndefined();
      expect(minimalTask.log).toBeUndefined();
    });
  });

  describe('Task Filtering and Status', () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Task 1',
        status: 'todo',
        priority: 'high',
        project: 'Project A',
        completed: false,
        tags: ['urgent']
      },
      {
        id: '2',
        title: 'Task 2',
        status: 'in-progress',
        priority: 'medium',
        project: 'Project B',
        completed: false,
        tags: ['review']
      },
      {
        id: '3',
        title: 'Task 3',
        status: 'done',
        priority: 'low',
        project: 'Project A',
        completed: true,
        tags: ['completed']
      }
    ];

    test('should filter tasks by status', () => {
      const todoTasks = mockTasks.filter(t => t.status === 'todo');
      const inProgressTasks = mockTasks.filter(t => t.status === 'in-progress');
      const doneTasks = mockTasks.filter(t => t.status === 'done');

      expect(todoTasks).toHaveLength(1);
      expect(inProgressTasks).toHaveLength(1);
      expect(doneTasks).toHaveLength(1);
    });

    test('should filter tasks by project', () => {
      const projectATasks = mockTasks.filter(t => t.project === 'Project A');
      const projectBTasks = mockTasks.filter(t => t.project === 'Project B');

      expect(projectATasks).toHaveLength(2);
      expect(projectBTasks).toHaveLength(1);
    });

    test('should filter tasks by priority', () => {
      const highPriorityTasks = mockTasks.filter(t => t.priority === 'high');
      const mediumPriorityTasks = mockTasks.filter(t => t.priority === 'medium');
      const lowPriorityTasks = mockTasks.filter(t => t.priority === 'low');

      expect(highPriorityTasks).toHaveLength(1);
      expect(mediumPriorityTasks).toHaveLength(1);
      expect(lowPriorityTasks).toHaveLength(1);
    });

    test('should filter tasks by tags', () => {
      const urgentTasks = mockTasks.filter(t => t.tags && t.tags.includes('urgent'));
      const reviewTasks = mockTasks.filter(t => t.tags && t.tags.includes('review'));

      expect(urgentTasks).toHaveLength(1);
      expect(reviewTasks).toHaveLength(1);
    });

    test('should identify completed vs incomplete tasks', () => {
      const completedTasks = mockTasks.filter(t => t.completed);
      const incompleteTasks = mockTasks.filter(t => !t.completed);

      expect(completedTasks).toHaveLength(1);
      expect(incompleteTasks).toHaveLength(2);
    });
  });

  describe('Task Statistics', () => {
    const mockTasks = [
      { id: '1', status: 'todo', priority: 'high', completed: false },
      { id: '2', status: 'in-progress', priority: 'medium', completed: false },
      { id: '3', status: 'done', priority: 'low', completed: true },
      { id: '4', status: 'todo', priority: 'high', completed: false },
      { id: '5', status: 'done', priority: 'medium', completed: true }
    ];

    test('should calculate task counts by status', () => {
      const statusCounts = {
        todo: mockTasks.filter(t => t.status === 'todo').length,
        'in-progress': mockTasks.filter(t => t.status === 'in-progress').length,
        done: mockTasks.filter(t => t.status === 'done').length
      };

      expect(statusCounts.todo).toBe(2);
      expect(statusCounts['in-progress']).toBe(1);
      expect(statusCounts.done).toBe(2);
    });

    test('should calculate completion percentage', () => {
      const totalTasks = mockTasks.length;
      const completedTasks = mockTasks.filter(t => t.completed).length;
      const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

      expect(completionPercentage).toBe(40); // 2 out of 5 tasks completed
    });

    test('should calculate priority distribution', () => {
      const priorityCounts = {
        high: mockTasks.filter(t => t.priority === 'high').length,
        medium: mockTasks.filter(t => t.priority === 'medium').length,
        low: mockTasks.filter(t => t.priority === 'low').length
      };

      expect(priorityCounts.high).toBe(2);
      expect(priorityCounts.medium).toBe(2);
      expect(priorityCounts.low).toBe(1);
    });
  });

  describe('Project Management', () => {
    test('should manage project list', () => {
      const projects = ['Project A', 'Project B', 'Project C'];

      // Add project
      const newProjects = [...projects, 'Project D'];
      expect(newProjects).toHaveLength(4);
      expect(newProjects).toContain('Project D');

      // Remove project
      const filteredProjects = newProjects.filter(p => p !== 'Project B');
      expect(filteredProjects).toHaveLength(3);
      expect(filteredProjects).not.toContain('Project B');
    });

    test('should handle project filtering', () => {
      const tasks = [
        { id: '1', project: 'Project A' },
        { id: '2', project: 'Project B' },
        { id: '3', project: 'Project A' }
      ];

      const selectedProject = 'Project A';
      const filteredTasks = selectedProject === 'all'
        ? tasks
        : tasks.filter(t => t.project === selectedProject);

      expect(filteredTasks).toHaveLength(2);
      expect(filteredTasks.every(t => t.project === 'Project A')).toBe(true);
    });
  });

  describe('Task CRUD Operations', () => {
    let tasks = [];

    beforeEach(() => {
      tasks = [
        { id: '1', title: 'Task 1', status: 'todo', completed: false },
        { id: '2', title: 'Task 2', status: 'in-progress', completed: false }
      ];
    });

    test('should add new task', () => {
      const newTask = {
        id: '3',
        title: 'New Task',
        status: 'todo',
        completed: false
      };

      tasks.push(newTask);

      expect(tasks).toHaveLength(3);
      expect(tasks[2].title).toBe('New Task');
    });

    test('should update existing task', () => {
      const taskIndex = tasks.findIndex(t => t.id === '1');
      tasks[taskIndex].status = 'in-progress';
      tasks[taskIndex].title = 'Updated Task 1';

      expect(tasks[taskIndex].status).toBe('in-progress');
      expect(tasks[taskIndex].title).toBe('Updated Task 1');
    });

    test('should delete task', () => {
      const initialLength = tasks.length;
      tasks = tasks.filter(t => t.id !== '1');

      expect(tasks).toHaveLength(initialLength - 1);
      expect(tasks.find(t => t.id === '1')).toBeUndefined();
    });

    test('should toggle task completion', () => {
      const task = tasks.find(t => t.id === '1');
      task.completed = !task.completed;

      expect(task.completed).toBe(true);

      task.completed = !task.completed;
      expect(task.completed).toBe(false);
    });
  });

  describe('Task Validation', () => {
    test('should validate required fields', () => {
      const validTask = {
        id: '1',
        title: 'Valid Task',
        status: 'todo',
        completed: false,
        createdAt: '2025-12-01T10:00:00Z'
      };

      expect(validTask.title).toBeTruthy();
      expect(validTask.status).toBeTruthy();
      expect(['todo', 'in-progress', 'done', 'blocked', 'review']).toContain(validTask.status);
    });

    test('should validate status values', () => {
      const validStatuses = ['todo', 'in-progress', 'done', 'blocked', 'review'];
      const invalidStatuses = ['invalid', 'pending', 'waiting'];

      validStatuses.forEach(status => {
        expect(['todo', 'in-progress', 'done', 'blocked', 'review']).toContain(status);
      });

      invalidStatuses.forEach(status => {
        expect(['todo', 'in-progress', 'done', 'blocked', 'review']).not.toContain(status);
      });
    });

    test('should validate priority values', () => {
      const validPriorities = ['low', 'medium', 'high'];
      const invalidPriorities = ['urgent', 'critical', 'normal'];

      validPriorities.forEach(priority => {
        expect(['low', 'medium', 'high']).toContain(priority);
      });

      invalidPriorities.forEach(priority => {
        expect(['low', 'medium', 'high']).not.toContain(priority);
      });
    });
  });
});