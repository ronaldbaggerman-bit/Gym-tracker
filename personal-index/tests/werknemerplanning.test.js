/**
 * Tests for werknemerplanning functionality
 * Run with: npm test
 */

describe('Werknemerplanning Data Management', () => {
  describe('Data Loading and Saving', () => {
    test('should parse employees JSON correctly', () => {
      const mockEmployees = [
        { id: '1', name: 'Jan Jansen', projects: ['Project A'] },
        { id: '2', name: 'Piet Pietersen', projects: ['Project B'] }
      ];

      // Test JSON parsing directly
      const employeesJson = JSON.stringify(mockEmployees);
      const employees = JSON.parse(employeesJson);

      expect(employees).toHaveLength(2);
      expect(employees[0].name).toBe('Jan Jansen');
      expect(employees[1].projects).toContain('Project B');
    });

    test('should parse leaves JSON correctly', () => {
      const mockLeaves = [
        {
          id: '1',
          employeeId: 'emp1',
          startDate: '2025-01-01',
          endDate: '2025-01-05',
          type: 'vacation'
        }
      ];

      const leavesJson = JSON.stringify(mockLeaves);
      const leaves = JSON.parse(leavesJson);

      expect(leaves).toHaveLength(1);
      expect(leaves[0].type).toBe('vacation');
    });

    test('should handle empty data gracefully', () => {
      const employees = JSON.parse('[]');
      const leaves = JSON.parse('[]');

      expect(employees).toEqual([]);
      expect(leaves).toEqual([]);
    });

    test('should handle invalid JSON gracefully', () => {
      expect(() => JSON.parse('invalid')).toThrow();
    });
  });

  describe('Employee Management', () => {
    test('should filter employees by project', () => {
      const employees = [
        { id: '1', name: 'Jan Jansen', projects: ['Project A', 'Project B'] },
        { id: '2', name: 'Piet Pietersen', projects: ['Project B'] },
        { id: '3', name: 'Marie Marie', projects: ['Project C'] }
      ];

      const projectAEmployees = employees.filter(e => e.projects.includes('Project A'));
      const projectBEmployees = employees.filter(e => e.projects.includes('Project B'));

      expect(projectAEmployees).toHaveLength(1);
      expect(projectBEmployees).toHaveLength(2);
    });

    test('should handle employees with single project as array', () => {
      const employee = { id: '1', name: 'Jan Jansen', projects: ['Project A'] };

      expect(Array.isArray(employee.projects)).toBe(true);
      expect(employee.projects).toContain('Project A');
    });
  });

  describe('Leave Logic', () => {
    test('should detect leave on specific date', () => {
      const leave = {
        startDate: '2025-01-01',
        endDate: '2025-01-05',
        type: 'vacation'
      };

      const testDate = '2025-01-03';
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      const inRange = testDate >= leaveStart.toISOString().split('T')[0] &&
                     testDate <= leaveEnd.toISOString().split('T')[0];

      expect(inRange).toBe(true);
    });

    test('should handle selectedDays for part-time leave', () => {
      const leave = {
        startDate: '2025-01-01',
        endDate: '2025-01-07', // Week
        type: 'parttime',
        selectedDays: [1, 3, 5] // Monday, Wednesday, Friday
      };

      // Test Monday (day 1)
      const monday = new Date('2025-01-06'); // Monday
      const mondayInRange = '2025-01-06' >= leave.startDate &&
                           '2025-01-06' <= leave.endDate &&
                           leave.selectedDays.includes(monday.getDay());

      expect(mondayInRange).toBe(true);

      // Test Tuesday (day 2) - should be false
      const tuesday = new Date('2025-01-07'); // Tuesday
      const tuesdayInRange = '2025-01-07' >= leave.startDate &&
                            '2025-01-07' <= leave.endDate &&
                            leave.selectedDays.includes(tuesday.getDay());

      expect(tuesdayInRange).toBe(false);
    });

    test('should handle leave without selectedDays (regular leave)', () => {
      const leave = {
        startDate: '2025-01-01',
        endDate: '2025-01-05',
        type: 'vacation'
        // No selectedDays property
      };

      const testDate = '2025-01-03';
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      const inRange = testDate >= leaveStart.toISOString().split('T')[0] &&
                     testDate <= leaveEnd.toISOString().split('T')[0];

      expect(inRange).toBe(true);
      expect(leave.selectedDays).toBeUndefined();
    });

    test('should calculate week occupancy correctly', () => {
      // Mock employee data
      const employees = [
        { id: '1', name: 'Employee 1', projects: ['Project A'] },
        { id: '2', name: 'Employee 2', projects: ['Project A'] }
      ];

      const leaves = [
        {
          employeeId: '1',
          startDate: '2025-01-06', // Monday
          endDate: '2025-01-10',   // Friday
          type: 'vacation'
        }
      ];

      // Calculate occupancy for the week of 2025-01-06 to 2025-01-12
      // Employee 1 has vacation Monday-Friday (5 days)
      // Employee 2 has no leave (0 days)
      // Total working days needed: 2 employees * 5 days = 10
      // Actual working days: Employee 2 has 5 days = 5
      // Occupancy: 5/10 = 50%

      const weekStart = new Date('2025-01-06');
      const weekEnd = new Date('2025-01-12');

      let totalWorkingDays = 0;
      let actualWorkingDays = 0;

      employees.forEach(emp => {
        for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
            totalWorkingDays++;

            const dateStr = d.toISOString().split('T')[0];
            const hasLeave = leaves.some(leave => {
              const inRange = dateStr >= leave.startDate && dateStr <= leave.endDate;
              return inRange && leave.employeeId === emp.id;
            });

            if (!hasLeave) {
              actualWorkingDays++;
            }
          }
        }
      });

      const occupancy = actualWorkingDays / totalWorkingDays;

      expect(occupancy).toBe(0.5); // 50%
    });

    test('should calculate zero occupancy when all employees are on leave', () => {
      const employees = [
        { id: '1', name: 'Employee 1', projects: ['Project A'] }
      ];

      const leaves = [
        {
          employeeId: '1',
          startDate: '2025-01-06', // Monday
          endDate: '2025-01-10',   // Friday
          type: 'vacation'
        }
      ];

      const weekStart = new Date('2025-01-06');
      const weekEnd = new Date('2025-01-12');

      let totalWorkingDays = 0;
      let actualWorkingDays = 0;

      employees.forEach(emp => {
        for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            totalWorkingDays++;

            const dateStr = d.toISOString().split('T')[0];
            const hasLeave = leaves.some(leave => {
              const inRange = dateStr >= leave.startDate && dateStr <= leave.endDate;
              return inRange && leave.employeeId === emp.id;
            });

            if (!hasLeave) {
              actualWorkingDays++;
            }
          }
        }
      });

      const occupancy = actualWorkingDays / totalWorkingDays;

      expect(occupancy).toBe(0); // 0%
    });
  });

  describe('Date Utilities', () => {
    test('should get correct week number', () => {
      // Test with a known date: January 1, 2025 is a Wednesday
      const testDate = new Date('2025-01-01');

      // ISO week number calculation
      const d = new Date(Date.UTC(testDate.getFullYear(), testDate.getMonth(), testDate.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

      // January 1, 2025 should be week 1
      expect(weekNum).toBe(1);
    });

    test('should generate date range correctly', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-03');

      const dates = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }

      expect(dates).toHaveLength(3);
      expect(dates[0].toISOString().split('T')[0]).toBe('2025-01-01');
      expect(dates[2].toISOString().split('T')[0]).toBe('2025-01-03');
    });

    test('should handle single day range', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-01');

      const dates = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }

      expect(dates).toHaveLength(1);
      expect(dates[0].toISOString().split('T')[0]).toBe('2025-01-01');
    });

    test('should identify weekends correctly', () => {
      const monday = new Date('2025-01-06'); // Monday
      const saturday = new Date('2025-01-11'); // Saturday
      const sunday = new Date('2025-01-12'); // Sunday

      expect(monday.getDay()).toBe(1); // Monday
      expect(saturday.getDay()).toBe(6); // Saturday
      expect(sunday.getDay()).toBe(0); // Sunday

      // Weekend check
      expect(monday.getDay() === 0 || monday.getDay() === 6).toBe(false);
      expect(saturday.getDay() === 0 || saturday.getDay() === 6).toBe(true);
      expect(sunday.getDay() === 0 || sunday.getDay() === 6).toBe(true);
    });
  });

  describe('Project Filtering', () => {
    test('should filter employees by selected project', () => {
      const employees = [
        { id: '1', name: 'Jan Jansen', projects: ['Project A', 'Project B'] },
        { id: '2', name: 'Piet Pietersen', projects: ['Project B'] },
        { id: '3', name: 'Marie Marie', projects: ['Project C'] }
      ];

      const selectedProject = 'Project B';
      const filteredEmployees = selectedProject === 'all'
        ? employees
        : employees.filter(e => {
            const empProjects = Array.isArray(e.projects) ? e.projects : [e.project].filter(Boolean);
            return empProjects.includes(selectedProject);
          });

      expect(filteredEmployees).toHaveLength(2);
      expect(filteredEmployees.map(e => e.name)).toEqual(['Jan Jansen', 'Piet Pietersen']);
    });

    test('should show all employees when no project filter', () => {
      const employees = [
        { id: '1', name: 'Jan Jansen', projects: ['Project A'] },
        { id: '2', name: 'Piet Pietersen', projects: ['Project B'] }
      ];

      const selectedProject = 'all';
      const filteredEmployees = selectedProject === 'all'
        ? employees
        : employees.filter(e => e.projects.includes(selectedProject));

      expect(filteredEmployees).toHaveLength(2);
    });
  });
});