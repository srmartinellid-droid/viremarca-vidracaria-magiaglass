import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('public');
const navScript = '<script src="/assets/js/navigation.js"></script>';
const analyticsScript = '<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script><script defer src="/_vercel/insights/script.js"></script>';

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'admin') walk(full);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;
    let html = fs.readFileSync(full, 'utf8');
    if (!html.includes('/assets/js/navigation.js')) {
      html = html.replace('</body>', analyticsScript + navScript + '</body>');
      fs.writeFileSync(full, html);
    }
  }
}

walk(root);
