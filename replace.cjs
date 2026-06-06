const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            if (content.includes('FiDollarSign')) {
                // First, remove FiDollarSign from the react-icons/fi import
                content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-icons\/fi['"];/g, (match, p1) => {
                    const imports = p1.split(',').map(i => i.trim()).filter(i => i !== 'FiDollarSign' && i !== '');
                    if (imports.length === 0) return '';
                    return `import { ${imports.join(', ')} } from 'react-icons/fi';`;
                });

                // Then replace all other occurrences
                content = content.replace(/FiDollarSign/g, 'BsCurrencyRupee');
                
                // Finally, add the import for BsCurrencyRupee
                if (!content.includes('import { BsCurrencyRupee }')) {
                    content = "import { BsCurrencyRupee } from 'react-icons/bs';\n" + content;
                }
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Modified:', fullPath);
            }
        }
    }
}

processDir(path.join(process.cwd(), 'src'));
console.log('Done replacing FiDollarSign');
