const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const ROOT = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const { execFile } = require('child_process');
const os = require('os');

function findPython() {
  const venvPy = path.join(os.homedir(), '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(venvPy)) return venvPy;
  const localVenv = path.join(ROOT, '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(localVenv)) return localVenv;
  return 'python';
}

const server = http.createServer((req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-requested-with'
    });
    res.end();
    return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);

  // Handle Official EU CBAM Excel Report generation via Python backend
  if (req.method === 'POST' && reqPath === '/api/generate-report') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const pythonExe = findPython();
        const cliScript = path.join(ROOT, 'server', 'generate_cbam_report_cli.py');
        const tempInput = path.join(os.tmpdir(), `cbam_in_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
        const tempOutput = path.join(os.tmpdir(), `cbam_out_${Date.now()}_${Math.random().toString(36).slice(2)}.xlsx`);

        fs.writeFileSync(tempInput, JSON.stringify(payload), 'utf8');

        execFile(pythonExe, [cliScript, tempInput, tempOutput], { cwd: ROOT }, (err, stdout, stderr) => {
          try { if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput); } catch (e) {}
          if (err || !fs.existsSync(tempOutput)) {
            console.error('CBAM Generator Error:', err, stderr);
            res.writeHead(500, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ error: 'Failed to generate official CBAM report: ' + (stderr || err.message) }));
            return;
          }

          const fileData = fs.readFileSync(tempOutput);
          try { if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput); } catch (e) {}

          const sector = (payload.sector || 'EU').toUpperCase();
          const year = payload.year || 2026;
          const downloadName = `CBAM_Communication_Report_${sector}_${year}_Official_EU.xlsx`;

          res.writeHead(200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${downloadName}"`,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Private-Network': 'true'
          });
          res.end(fileData);
        });
      } catch (parseErr) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(ROOT, reqPath);

  // If path doesn't have an extension, try appending .html
  if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  // Handle legacy /js, /images, /libs mappings
  if (reqPath.startsWith('/js/')) {
    filePath = path.join(ROOT, 'assets', 'js', reqPath.replace('/js/', ''));
  } else if (reqPath.startsWith('/images/') || reqPath.startsWith('/Images/')) {
    filePath = path.join(ROOT, 'assets', 'images', reqPath.replace(/^\/(images|Images)\//, ''));
  } else if (reqPath.startsWith('/libs/')) {
    filePath = path.join(ROOT, 'assets', 'vendor', reqPath.replace('/libs/', ''));
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`GreenShift Node Server running at http://127.0.0.1:${PORT}`);
});
