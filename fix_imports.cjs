const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Regex to find import and export statements with relative paths
      // Note: only targeting lines that start with import or export, and relative paths starting with .
      // We will only append .js if it does not already end with .js or .css or .ts
      const regex = /(from\s+['"]|import\s*\(?\s*['"])(\.[^'"]*)(['"])/g;
      
      let modified = false;
      content = content.replace(regex, (match, p1, p2, p3) => {
        if (!p2.endsWith('.js') && !p2.endsWith('.ts') && !p2.endsWith('.css') && !p2.endsWith('.json')) {
          modified = true;
          return `${p1}${p2}.js${p3}`;
        }
        return match;
      });

      // Special case for dynamic imports like import('./auth')
      const dynamicRegex = /(import\s*\(\s*['"])(\.[^'"]*)(['"]\s*\))/g;
      content = content.replace(dynamicRegex, (match, p1, p2, p3) => {
        if (!p2.endsWith('.js') && !p2.endsWith('.ts')) {
          modified = true;
          return `${p1}${p2}.js${p3}`;
        }
        return match;
      });

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated imports in ${fullPath}`);
      }
    }
  }
}

const targetDirs = [
  path.join(__dirname, 'api'),
  path.join(__dirname, 'src', 'features', 'ai-api')
];

for (const dir of targetDirs) {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  } else {
    console.warn(`Directory not found: ${dir}`);
  }
}
