const fs = require('fs');
const path = require('path');

function createEsmWrappers() {
  const distPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(distPath)) return;

  const files = fs.readdirSync(distPath);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const baseName = file.replace('.js', '');
      const wrapperContent = `export * from './${file}';`;
      fs.writeFileSync(path.join(distPath, `${baseName}.mjs`), wrapperContent);
    }
  }
}

createEsmWrappers();
