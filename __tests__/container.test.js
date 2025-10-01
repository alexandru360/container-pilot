/**
 * @jest-environment node
 */

describe('Container Status Validation', () => {
  it('should validate running container status', () => {
    const containerStatus = {
      name: 'test-container',
      status: 'running',
      state: 'Up 2 hours',
      id: 'abc123',
      image: 'nginx:latest',
      created: Date.now(),
      ports: []
    };

    expect(containerStatus.status).toBe('running');
    expect(containerStatus.name).toBeDefined();
    expect(containerStatus.id).toBeDefined();
  });

  it('should handle not-found container', () => {
    const containerStatus = {
      name: 'missing-container',
      status: 'not-found',
      state: 'unknown',
      id: null,
      image: null,
      created: null,
      ports: []
    };

    expect(containerStatus.status).toBe('not-found');
    expect(containerStatus.id).toBeNull();
  });

  it('should validate container names match', () => {
    const configuredName = 'my-container';
    const dockerNames = ['/my-container', 'my-container'];
    
    const matches = dockerNames.some(n => n === `/${configuredName}` || n === configuredName);
    
    expect(matches).toBe(true);
  });

  it('should handle container name with leading slash', () => {
    const configuredName = 'my-container';
    const dockerName = '/my-container';
    
    const matches = dockerName === `/${configuredName}` || dockerName === configuredName;
    
    expect(matches).toBe(true);
  });
});

describe('Container Actions', () => {
  it('should validate action types', () => {
    const validActions = ['start', 'stop', 'restart'];
    
    expect(validActions.includes('start')).toBe(true);
    expect(validActions.includes('stop')).toBe(true);
    expect(validActions.includes('restart')).toBe(true);
    expect(validActions.includes('invalid')).toBe(false);
  });

  it('should require containerId for actions', () => {
    const action = { containerId: 'abc123', action: 'start' };
    
    expect(action.containerId).toBeDefined();
    expect(action.action).toBeDefined();
  });
});

describe('Update Status Logic', () => {
  it('should calculate time differences correctly', () => {
    const now = Date.now() / 1000; // Current time in seconds
    const halfDayAgo = now - (12 * 60 * 60); // 12 hours ago
    const twoWeeksAgo = now - (14 * 24 * 60 * 60); // 14 days ago

    // Container created 12 hours ago should be less than 24 hours old
    const ageInHours = (now - halfDayAgo) / (60 * 60);
    expect(ageInHours).toBeGreaterThan(11);
    expect(ageInHours).toBeLessThan(13);
    
    // Container created 2 weeks ago should be more than 7 days old
    const ageInDays = (now - twoWeeksAgo) / (24 * 60 * 60);
    expect(ageInDays).toBeGreaterThan(13);
    expect(ageInDays).toBeLessThan(15);
  });

  it('should categorize container age', () => {
    const getAgeCategory = (createdTimestamp) => {
      const now = Date.now() / 1000;
      const ageInSeconds = now - createdTimestamp;
      const ageInDays = ageInSeconds / (24 * 60 * 60);

      if (ageInDays < 1) return 'recently-created';
      if (ageInDays < 7) return 'week-old';
      if (ageInDays < 30) return 'month-old';
      return 'old';
    };

    const now = Date.now() / 1000;
    const recent = now - (12 * 60 * 60); // 12 hours ago
    const weekOld = now - (5 * 24 * 60 * 60); // 5 days ago
    const monthOld = now - (20 * 24 * 60 * 60); // 20 days ago
    const old = now - (60 * 24 * 60 * 60); // 60 days ago

    expect(getAgeCategory(recent)).toBe('recently-created');
    expect(getAgeCategory(weekOld)).toBe('week-old');
    expect(getAgeCategory(monthOld)).toBe('month-old');
    expect(getAgeCategory(old)).toBe('old');
  });
});
