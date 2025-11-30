/**
 * Executes JavaScript code in a somewhat isolated manner.
 * Note: Truly safe sandboxing requires a backend or strict iframe/worker isolation.
 * For this demo, we capture console.log and return the result.
 */
export const executeCode = async (code: string): Promise<{ output: string, error?: string }> => {
  return new Promise((resolve) => {
    try {
      let logs: string[] = [];
      
      // Mock console to capture outputs
      const mockConsole = {
        log: (...args: any[]) => {
          logs.push(args.map(a => 
            typeof a === 'object' ? JSON.stringify(a) : String(a)
          ).join(' '));
        },
        warn: (...args: any[]) => logs.push(`WARN: ${args.join(' ')}`),
        error: (...args: any[]) => logs.push(`ERROR: ${args.join(' ')}`),
        info: (...args: any[]) => logs.push(`INFO: ${args.join(' ')}`),
      };

      // We use a cleaner function construction to avoid "use strict" + rest parameter conflicts.
      // We pass 'console' explicitly.
      // We wrap user code in a try-catch block INSIDE the execution to capture runtime errors (like ReferenceError)
      // as part of the "output" rather than a system error.
      const wrappedCode = `
        try {
          // Inner IIFE to allow top-level returns if user writes them, though mostly they use console.log
          (function() {
            ${code}
          })();
        } catch(e) {
          // Capture the error message as output, because "Predict the output" often involves predicting errors.
          console.error(e.name + ': ' + e.message);
        }
      `;

      // Create function with explicit parameters instead of ...args to avoid ES6 strict mode issues
      // eslint-disable-next-line no-new-func
      const func = new Function('console', wrappedCode);
      
      func(mockConsole);

      resolve({ output: logs.join('\n') });
    } catch (e: any) {
      // This catch block handles syntax errors in the code construction itself, not user code runtime errors
      resolve({ output: '', error: 'Syntax Error: ' + (e.message || 'Invalid Code') });
    }
  });
};