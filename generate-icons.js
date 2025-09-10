// Node.js script to generate PNG icons from SVG
// This would require sharp or similar library in production
// For now, we'll create a simple HTML page to generate icons

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512];

// Read SVG content
const svgContent = fs.readFileSync('icon.svg', 'utf8');

// Create HTML page for icon generation
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Icon Generator</title>
    <style>
        canvas { border: 1px solid #ccc; margin: 5px; }
        .icon-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 20px; }
        .size-label { text-align: center; font-family: monospace; }
    </style>
</head>
<body>
    <h1>Mouse Jiggler Icons</h1>
    <div class="icon-grid" id="iconGrid"></div>
    
    <script>
        const svgContent = \`${svgContent}\`;
        const sizes = ${JSON.stringify(sizes)};
        
        const iconGrid = document.getElementById('iconGrid');
        
        sizes.forEach(size => {
            const container = document.createElement('div');
            container.innerHTML = \`
                <div class="size-label">\${size}x\${size}</div>
                <canvas id="canvas\${size}" width="\${size}" height="\${size}"></canvas>
                <br>
                <button onclick="downloadIcon(\${size})">Download</button>
            \`;
            iconGrid.appendChild(container);
            
            // Create canvas and draw SVG
            const canvas = document.getElementById(\`canvas\${size}\`);
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            const svgBlob = new Blob([svgContent], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            
            img.onload = function() {
                ctx.drawImage(img, 0, 0, size, size);
                URL.revokeObjectURL(url);
            };
            
            img.src = url;
        });
        
        function downloadIcon(size) {
            const canvas = document.getElementById(\`canvas\${size}\`);
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`icon-\${size}x\${size}.png\`;
                a.click();
                URL.revokeObjectURL(url);
            });
        }
        
        // Auto download all icons
        setTimeout(() => {
            sizes.forEach(size => {
                setTimeout(() => downloadIcon(size), size * 100);
            });
        }, 2000);
    </script>
</body>
</html>
`;

fs.writeFileSync('icon-generator.html', htmlContent);
console.log('Icon generator HTML created. Open icon-generator.html in browser to generate PNG files.');