// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Silence known non-actionable React/Router test warnings.
// We keep other warnings/errors visible so real regressions still fail loudly.
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    const first = args[0];
    if (typeof first === 'string' && first.includes('ReactDOMTestUtils.act` is deprecated')) {
      return;
    }
    originalConsoleError(...args);
  });

  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    const first = args[0];
    if (typeof first === 'string' && first.includes('React Router Future Flag Warning')) {
      return;
    }
    originalConsoleWarn(...args);
  });
});

afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});
