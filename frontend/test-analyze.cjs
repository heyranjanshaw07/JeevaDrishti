const { spawn } = require('child_process');
const http = require('http');

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const tempDir = "C:\\Users\\user\\AppData\\Local\\Temp\\edge-test-analyze";

const proc = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9555',
  `--user-data-dir=${tempDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1280,900',
  'http://localhost:5173/analyze'
]);

setTimeout(() => {
  http.get('http://localhost:9555/json', (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', async () => {
      const tabs = JSON.parse(d);
      const pageTab = tabs.find(t => t.url.includes('5173'));
      if (!pageTab) {
        console.error('No page tab found!');
        proc.kill();
        process.exit(1);
      }

      const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
      let msgId = 1;
      const send = (method, params = {}) => {
        return new Promise((resolve) => {
          const id = msgId++;
          const handler = (event) => {
            const data = JSON.parse(event.data);
            if (data.id === id) {
              ws.removeEventListener('message', handler);
              resolve(data.result);
            }
          };
          ws.addEventListener('message', handler);
          ws.send(JSON.stringify({ id, method, params }));
        });
      };

      // Log browser console
      ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER CONSOLE]', data.params.type, data.params.args.map(a => a.value));
        }
        if (data.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]', data.params.exceptionDetails?.text, data.params.exceptionDetails?.exception?.description);
        }
      });

      ws.onopen = async () => {
        await send('Runtime.enable');
        await send('Log.enable');
        await new Promise(r => setTimeout(r, 2000));

        const evalScript = async (expr) => {
          const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
          return res?.result?.value;
        };

        // Check if there is an image preloaded or if we need to select one
        const buttons = await evalScript(`
          Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim())
        `);
        console.log('Buttons on analyze page:', buttons);

        // Find "Run Inference" or "Run Analysis" or sample image button
        const runBtn = await evalScript(`
          (() => {
            const b = Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.includes('RUN') || btn.innerText.includes('ANALYSIS') || btn.innerText.includes('Inference'));
            return b ? { text: b.innerText, disabled: b.disabled } : null;
          })()
        `);
        console.log('Run button:', runBtn);

        // Click a sample image if available
        const sampleClicked = await evalScript(`
          (() => {
            const sample = document.querySelector('img[alt*="Sample"], [class*="sample"], button[class*="sample"]');
            if (sample) {
              sample.click();
              return 'clicked sample';
            }
            return 'no sample found';
          })()
        `);
        console.log('Sample click:', sampleClicked);

        // Now click run button
        const clickedRun = await evalScript(`
          (() => {
            const b = Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.includes('RUN') || btn.innerText.includes('EXECUTE') || btn.innerText.includes('START'));
            if (b) {
              b.click();
              return b.innerText;
            }
            return null;
          })()
        `);
        console.log('Clicked run:', clickedRun);

        // Wait 4 seconds to observe inference
        await new Promise(r => setTimeout(r, 4000));

        const status = await evalScript(`
          (() => {
            const errorEl = document.querySelector('[class*="error"], [class*="failed"]');
            const metrics = Array.from(document.querySelectorAll('[class*="metric"]')).map(m => m.innerText);
            return {
              errorText: errorEl ? errorEl.innerText : null,
              pageText: document.body.innerText.slice(0, 500)
            };
          })()
        `);
        console.log('After run status:', status.errorText);

        ws.close();
        proc.kill();
        process.exit(0);
      };
    });
  });
}, 2500);
