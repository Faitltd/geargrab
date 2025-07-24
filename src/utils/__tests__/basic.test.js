describe('Basic Jest Setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  it('should work with DOM', () => {
    document.body.innerHTML = '<div id="test">Hello World</div>';
    const element = document.getElementById('test');
    expect(element.textContent).toBe('Hello World');
  });
});
