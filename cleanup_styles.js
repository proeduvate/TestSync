const fs = require('fs');
const path = require('path');

const replacements = [
    // Direct CSS variable replacements
    { from: /var\(--secondary-600\)/g, to: 'var(--primary-700)' },
    { from: /var\(--secondary-500\)/g, to: 'var(--primary-600)' },
    { from: /var\(--secondary-400\)/g, to: 'var(--primary-500)' },
    { from: /var\(--secondary-300\)/g, to: 'var(--primary-400)' },
    { from: /var\(--secondary-200\)/g, to: 'var(--primary-300)' },
    
    // Teal RGBA replacements to Indigo RGBA
    { from: /rgba\(20,\s*184,\s*166,/g, to: 'rgba(99, 102, 241,' },
    { from: /#14b8a6/gi, to: '#6366f1' },
    
    // Flatten specific linear-gradients to solid colors to remove the gamified look
    { from: /linear-gradient\(135deg,\s*var\(--primary-600\),\s*var\(--primary-500\)\)/g, to: 'var(--primary-600)' },
    { from: /linear-gradient\(135deg,\s*var\(--primary-500\),\s*var\(--primary-600\)\)/g, to: 'var(--primary-600)' },
    { from: /linear-gradient\(135deg,\s*var\(--primary-500\),\s*var\(--primary-400\)\)/g, to: 'var(--primary-500)' },
    { from: /linear-gradient\(135deg,\s*var\(--primary-400\),\s*var\(--primary-500\)\)/g, to: 'var(--primary-500)' },
    { from: /linear-gradient\(135deg,\s*var\(--primary-400\),\s*var\(--primary-300\)\)/g, to: 'var(--primary-400)' },
    { from: /linear-gradient\(135deg,\s*#fff\s*0%,\s*#a5b4fc\s*100%\)/g, to: 'var(--primary-50)' },
    { from: /linear-gradient\(135deg,\s*#fff\s*0%,\s*#94a3b8\s*100%\)/g, to: 'var(--slate-50)' },
];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.css') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            for (const { from, to } of replacements) {
                content = content.replace(from, to);
            }
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Cleaned up teal/gradients in: ${fullPath}`);
            }
        }
    }
}

// Start processing from the src directory
console.log('Starting cleanup of gamified styles...');
processDirectory(path.join(__dirname, 'src'));
console.log('Cleanup complete!');
