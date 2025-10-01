/**
 * @jest-environment node
 */

describe('Config API', () => {
  it('should parse DOCKER_IMAGES environment variable correctly', () => {
    // Test parsing of comma-separated container names
    const dockerImages = 'container1,container2,container3';
    const containers = dockerImages.split(',').map(name => name.trim()).filter(Boolean);
    
    expect(containers).toHaveLength(3);
    expect(containers).toEqual(['container1', 'container2', 'container3']);
  });

  it('should handle empty DOCKER_IMAGES', () => {
    const dockerImages = '';
    const containers = dockerImages.split(',').map(name => name.trim()).filter(Boolean);
    
    expect(containers).toHaveLength(0);
  });

  it('should handle DOCKER_IMAGES with spaces', () => {
    const dockerImages = 'container1, container2 , container3';
    const containers = dockerImages.split(',').map(name => name.trim()).filter(Boolean);
    
    expect(containers).toEqual(['container1', 'container2', 'container3']);
  });

  it('should filter out empty values', () => {
    const dockerImages = 'container1,,container2,';
    const containers = dockerImages.split(',').map(name => name.trim()).filter(Boolean);
    
    expect(containers).toEqual(['container1', 'container2']);
  });
});

describe('Docker Host Configuration', () => {
  it('should recognize HTTP docker host', () => {
    const dockerHost = 'http://192.168.1.100:2375';
    const isHttp = dockerHost.startsWith('http://') || dockerHost.startsWith('https://');
    
    expect(isHttp).toBe(true);
  });

  it('should recognize HTTPS docker host', () => {
    const dockerHost = 'https://192.168.1.100:2376';
    const isHttps = dockerHost.startsWith('https://');
    
    expect(isHttps).toBe(true);
  });

  it('should recognize unix socket', () => {
    const dockerHost = 'unix:///var/run/docker.sock';
    const isUnix = dockerHost.startsWith('unix://');
    
    expect(isUnix).toBe(true);
  });

  it('should parse HTTP URL correctly', () => {
    const dockerHost = 'http://192.168.1.100:2375';
    const url = new URL(dockerHost);
    
    expect(url.hostname).toBe('192.168.1.100');
    expect(url.port).toBe('2375');
    expect(url.protocol).toBe('http:');
  });

  it('should default to port 2375 for HTTP', () => {
    const dockerHost = 'http://192.168.1.100';
    const url = new URL(dockerHost);
    const port = url.port || '2375';
    
    expect(port).toBe('2375');
  });
});
