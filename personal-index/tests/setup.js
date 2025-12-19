// Jest setup for testing browser-based code

// Mock localStorage as Jest mocks
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = mockLocalStorage;

// Mock alert, confirm, and other browser APIs
global.alert = jest.fn();
global.confirm = jest.fn();

// Mock URL APIs for date handling
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn(),
};

// Mock performance.now for any timing-related code
global.performance = {
  now: jest.fn(() => Date.now()),
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to debug: warn: jest.fn(),
  // Uncomment to debug: error: jest.fn(),
};

// Helper to reset all mocks between tests
global.resetAllMocks = () => {
  jest.clearAllMocks();
};

// Helper to create mock DOM elements
global.createMockElement = (tagName, attributes = {}) => {
  const element = document.createElement(tagName);
  Object.keys(attributes).forEach(key => {
    if (key === 'textContent') {
      element.textContent = attributes[key];
    } else if (key === 'innerHTML') {
      element.innerHTML = attributes[key];
    } else {
      element.setAttribute(key, attributes[key]);
    }
  });
  return element;
};

// Helper to mock DOM elements that scripts expect to exist
global.setupMockDOM = () => {
  // Common elements that scripts might expect
  const mockElements = [
    { id: 'employeeModal', tag: 'div', class: 'modal' },
    { id: 'taskModal', tag: 'div', class: 'modal' },
    { id: 'decisionModal', tag: 'div', class: 'modal' },
    { id: 'employeesContainer', tag: 'div' },
    { id: 'tasksContainer', tag: 'div' },
    { id: 'decisionsContainer', tag: 'div' },
    { id: 'statsContainer', tag: 'div' },
    { id: 'occupancyOverview', tag: 'div' },
  ];

  mockElements.forEach(({ id, tag, ...attrs }) => {
    if (!document.getElementById(id)) {
      const element = document.createElement(tag);
      element.id = id;
      if (attrs.class) element.className = attrs.class;
      document.body.appendChild(element);
    }
  });
};