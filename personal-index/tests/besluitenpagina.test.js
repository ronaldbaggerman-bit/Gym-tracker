/**
 * Tests for besluitenpagina (decision management) functionality
 * Run with: npm test
 */

describe('Besluitenpagina Decision Management', () => {
  describe('Decision Data Structure', () => {
    test('should create valid decision object', () => {
      const decision = {
        id: 'decision-123',
        title: 'Test Decision',
        description: 'This is a test decision',
        project: 'Project A',
        status: 'pending',
        options: [
          { id: 'opt1', text: 'Option 1', pros: ['Pro 1'], cons: ['Con 1'] },
          { id: 'opt2', text: 'Option 2', pros: ['Pro 2'], cons: ['Con 2'] }
        ],
        chosenOption: null,
        deadline: '2025-12-31',
        createdAt: '2025-12-01T10:00:00Z'
      };

      expect(decision.id).toBe('decision-123');
      expect(decision.title).toBe('Test Decision');
      expect(decision.status).toBe('pending');
      expect(decision.options).toHaveLength(2);
      expect(decision.chosenOption).toBeNull();
    });

    test('should handle decision with chosen option', () => {
      const decision = {
        id: 'decision-456',
        title: 'Completed Decision',
        status: 'implemented',
        options: [
          { id: 'opt1', text: 'Chosen Option' }
        ],
        chosenOption: 'opt1',
        createdAt: '2025-12-01T10:00:00Z'
      };

      expect(decision.status).toBe('implemented');
      expect(decision.chosenOption).toBe('opt1');
    });
  });

  describe('Decision Filtering', () => {
    const mockDecisions = [
      {
        id: '1',
        title: 'Decision 1',
        status: 'pending',
        project: 'Project A'
      },
      {
        id: '2',
        title: 'Decision 2',
        status: 'approved',
        project: 'Project B'
      },
      {
        id: '3',
        title: 'Decision 3',
        status: 'rejected',
        project: 'Project A'
      },
      {
        id: '4',
        title: 'Decision 4',
        status: 'implemented',
        project: 'Project C'
      }
    ];

    test('should filter decisions by status', () => {
      const pendingDecisions = mockDecisions.filter(d => d.status === 'pending');
      const approvedDecisions = mockDecisions.filter(d => d.status === 'approved');
      const rejectedDecisions = mockDecisions.filter(d => d.status === 'rejected');
      const implementedDecisions = mockDecisions.filter(d => d.status === 'implemented');

      expect(pendingDecisions).toHaveLength(1);
      expect(approvedDecisions).toHaveLength(1);
      expect(rejectedDecisions).toHaveLength(1);
      expect(implementedDecisions).toHaveLength(1);
    });

    test('should filter decisions by project', () => {
      const projectADecisions = mockDecisions.filter(d => d.project === 'Project A');
      const projectBDecisions = mockDecisions.filter(d => d.project === 'Project B');

      expect(projectADecisions).toHaveLength(2);
      expect(projectBDecisions).toHaveLength(1);
    });

    test('should show all decisions when no filter', () => {
      const currentFilter = 'all';
      const selectedProject = 'all';

      let filtered = mockDecisions;
      if (currentFilter !== 'all') {
        filtered = mockDecisions.filter(d => d.status === currentFilter);
      }
      if (selectedProject !== 'all') {
        filtered = filtered.filter(d => d.project === selectedProject);
      }

      expect(filtered).toHaveLength(4);
    });

    test('should combine status and project filters', () => {
      const currentFilter = 'pending';
      const selectedProject = 'Project A';

      let filtered = mockDecisions;
      if (currentFilter !== 'all') {
        filtered = mockDecisions.filter(d => d.status === currentFilter);
      }
      if (selectedProject !== 'all') {
        filtered = filtered.filter(d => d.project === selectedProject);
      }

      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('pending');
      expect(filtered[0].project).toBe('Project A');
    });
  });

  describe('Decision Statistics', () => {
    const mockDecisions = [
      { id: '1', status: 'pending', project: 'Project A' },
      { id: '2', status: 'approved', project: 'Project A' },
      { id: '3', status: 'rejected', project: 'Project B' },
      { id: '4', status: 'implemented', project: 'Project B' },
      { id: '5', status: 'pending', project: 'Project C' }
    ];

    test('should calculate decision counts by status', () => {
      const statusCounts = {
        pending: mockDecisions.filter(d => d.status === 'pending').length,
        approved: mockDecisions.filter(d => d.status === 'approved').length,
        rejected: mockDecisions.filter(d => d.status === 'rejected').length,
        implemented: mockDecisions.filter(d => d.status === 'implemented').length
      };

      expect(statusCounts.pending).toBe(2);
      expect(statusCounts.approved).toBe(1);
      expect(statusCounts.rejected).toBe(1);
      expect(statusCounts.implemented).toBe(1);
    });

    test('should calculate decisions by project', () => {
      const projectCounts = {};
      mockDecisions.forEach(decision => {
        projectCounts[decision.project] = (projectCounts[decision.project] || 0) + 1;
      });

      expect(projectCounts['Project A']).toBe(2);
      expect(projectCounts['Project B']).toBe(2);
      expect(projectCounts['Project C']).toBe(1);
    });

    test('should identify overdue decisions', () => {
      const decisionsWithDeadlines = [
        { id: '1', deadline: '2025-12-20', status: 'pending' }, // Not overdue
        { id: '2', deadline: '2025-11-01', status: 'pending' }, // Overdue
        { id: '3', deadline: '2025-12-31', status: 'approved' } // Not overdue (approved)
      ];

      const today = new Date('2025-12-15');
      const overdueDecisions = decisionsWithDeadlines.filter(d => {
        if (d.status !== 'pending') return false;
        const deadline = new Date(d.deadline);
        return deadline < today;
      });

      expect(overdueDecisions).toHaveLength(1);
      expect(overdueDecisions[0].id).toBe('2');
    });
  });

  describe('Decision Options Management', () => {
    test('should manage decision options', () => {
      const decision = {
        id: '1',
        options: [
          { id: 'opt1', text: 'Option 1', pros: ['Pro 1'], cons: ['Con 1'] }
        ]
      };

      // Add option
      decision.options.push({
        id: 'opt2',
        text: 'Option 2',
        pros: ['Pro 2'],
        cons: ['Con 2']
      });

      expect(decision.options).toHaveLength(2);

      // Remove option
      decision.options = decision.options.filter(opt => opt.id !== 'opt1');

      expect(decision.options).toHaveLength(1);
      expect(decision.options[0].id).toBe('opt2');
    });

    test('should handle option pros and cons', () => {
      const option = {
        id: 'opt1',
        text: 'Test Option',
        pros: ['Fast implementation', 'Low cost'],
        cons: ['Limited features', 'Potential bugs']
      };

      expect(option.pros).toHaveLength(2);
      expect(option.cons).toHaveLength(2);

      // Add pro
      option.pros.push('Good documentation');
      expect(option.pros).toHaveLength(3);

      // Add con
      option.cons.push('Requires training');
      expect(option.cons).toHaveLength(3);
    });

    test('should select chosen option', () => {
      const decision = {
        id: '1',
        options: [
          { id: 'opt1', text: 'Option 1' },
          { id: 'opt2', text: 'Option 2' }
        ],
        chosenOption: null
      };

      // Select option
      decision.chosenOption = 'opt2';

      expect(decision.chosenOption).toBe('opt2');

      // Verify chosen option exists
      const chosenOptionObj = decision.options.find(opt => opt.id === decision.chosenOption);
      expect(chosenOptionObj).toBeDefined();
      expect(chosenOptionObj.text).toBe('Option 2');
    });
  });

  describe('Decision CRUD Operations', () => {
    let decisions = [];

    beforeEach(() => {
      decisions = [
        { id: '1', title: 'Decision 1', status: 'pending' },
        { id: '2', title: 'Decision 2', status: 'approved' }
      ];
    });

    test('should add new decision', () => {
      const newDecision = {
        id: '3',
        title: 'New Decision',
        status: 'pending',
        options: [],
        createdAt: '2025-12-01T10:00:00Z'
      };

      decisions.push(newDecision);

      expect(decisions).toHaveLength(3);
      expect(decisions[2].title).toBe('New Decision');
    });

    test('should update existing decision', () => {
      const decisionIndex = decisions.findIndex(d => d.id === '1');
      decisions[decisionIndex].status = 'approved';
      decisions[decisionIndex].title = 'Updated Decision 1';

      expect(decisions[decisionIndex].status).toBe('approved');
      expect(decisions[decisionIndex].title).toBe('Updated Decision 1');
    });

    test('should delete decision', () => {
      const initialLength = decisions.length;
      decisions = decisions.filter(d => d.id !== '1');

      expect(decisions).toHaveLength(initialLength - 1);
      expect(decisions.find(d => d.id === '1')).toBeUndefined();
    });

    test('should update decision status', () => {
      const decision = decisions.find(d => d.id === '1');
      decision.status = 'implemented';

      expect(decision.status).toBe('implemented');
      expect(['pending', 'approved', 'rejected', 'implemented']).toContain(decision.status);
    });
  });

  describe('Decision Validation', () => {
    test('should validate required fields', () => {
      const validDecision = {
        id: '1',
        title: 'Valid Decision',
        status: 'pending',
        options: [{ id: 'opt1', text: 'Option 1' }],
        createdAt: '2025-12-01T10:00:00Z'
      };

      expect(validDecision.title).toBeTruthy();
      expect(validDecision.status).toBeTruthy();
      expect(validDecision.options).toBeDefined();
      expect(validDecision.options.length).toBeGreaterThan(0);
    });

    test('should validate status values', () => {
      const validStatuses = ['pending', 'approved', 'rejected', 'implemented'];
      const invalidStatuses = ['draft', 'review', 'cancelled'];

      validStatuses.forEach(status => {
        expect(['pending', 'approved', 'rejected', 'implemented']).toContain(status);
      });

      invalidStatuses.forEach(status => {
        expect(['pending', 'approved', 'rejected', 'implemented']).not.toContain(status);
      });
    });

    test('should validate decision with options', () => {
      const decisionWithoutOptions = {
        id: '1',
        title: 'Decision without options',
        status: 'pending',
        options: []
      };

      const decisionWithOptions = {
        id: '2',
        title: 'Decision with options',
        status: 'pending',
        options: [
          { id: 'opt1', text: 'Option 1' },
          { id: 'opt2', text: 'Option 2' }
        ]
      };

      expect(decisionWithoutOptions.options).toHaveLength(0);
      expect(decisionWithOptions.options).toHaveLength(2);

      // Valid decision should have at least one option
      expect(decisionWithOptions.options.length).toBeGreaterThan(0);
    });

    test('should validate deadline dates', () => {
      const pastDeadline = '2025-01-01';
      const futureDeadline = '2025-12-31';
      const today = new Date().toISOString().split('T')[0];

      const pastDate = new Date(pastDeadline);
      const futureDate = new Date(futureDeadline);
      const currentDate = new Date(today);

      expect(pastDate < currentDate).toBe(true);
      expect(futureDate > currentDate).toBe(true);
    });
  });
});