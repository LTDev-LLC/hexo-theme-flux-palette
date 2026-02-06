document.addEventListener('alpine:init', () => {
    Alpine.data('codeCopy', () => ({
        copied: false,
        async copy() {
            // Find the <code> element within Hexo's table structure
            // Hexo structure: figure.highlight -> table -> td.code -> pre
            const figure = this.$el.closest('.highlight'),
                codeElement = figure ? figure.querySelector('td.code pre') : null;
            if (codeElement)
                try {
                    // writeText is supported in modern secure contexts
                    await navigator.clipboard.writeText(codeElement.innerText);
                    this.copied = true;
                    setTimeout(() => this.copied = false, 2000);
                } catch (err) {
                    console.error('Failed to copy: ', err);
                }
        }
    }));
    Alpine.data('codeImage', () => ({
        async capture() {
            // Find the <code> element within Hexo's table structure
            const figure = this.$el.closest('.highlight'),
                table = figure.querySelector('table');
            if (!table)
                return;

            // Get theme-specific styles
            const styles = window.getComputedStyle(figure),
                root = window.getComputedStyle(document.documentElement),
                padding = 24;

            // Measure the table and add padding
            const width = table.offsetWidth + (padding * 2),
                height = table.offsetHeight + (padding * 2);

            // Map all theme-specific highlighting variables
            const themeStyles = `
            .highlight { color: ${styles.color}; font-family: ${styles.fontFamily}; font-size: ${styles.fontSize}; background: ${styles.backgroundColor}; padding: ${padding}px; border-radius: 8px; }
            .gutter { padding-right: 1.5rem; color: ${root.getPropertyValue('--muted')}; opacity: 0.5; text-align: right; border-right: 1px solid ${root.getPropertyValue('--border-code')}; user-select: none; }
            .code { padding-left: 1.5rem; }
            .comment, .quote, .doctag { color: ${root.getPropertyValue('--hl-comment')}; font-style: italic; }
            .keyword, .selector-tag, .section, .name, .literal { color: ${root.getPropertyValue('--hl-keyword')}; font-weight: 700; }
            .function, .title, .built_in, .class { color: ${root.getPropertyValue('--hl-function')}; }
            .string, .regexp, .symbol, .link { color: ${root.getPropertyValue('--hl-string')}; }
            .number, .bullet, .boolean, .constant { color: ${root.getPropertyValue('--hl-number')}; }
            .tag, .selector-class, .selector-id { color: ${root.getPropertyValue('--hl-tag')}; }
            .attr, .attribute, .variable, .property, .params { color: ${root.getPropertyValue('--hl-attribute')}; }
            .operator, .punctuation, .meta, .delimiter { color: ${root.getPropertyValue('--hl-operator')}; }
            .meta-string, .meta-keyword { color: ${root.getPropertyValue('--hl-meta')}; }
            .addition { color: ${root.getPropertyValue('--accent')}; background: rgba(70, 199, 102, 0.1); }
            .deletion { color: ${root.getPropertyValue('--muted')}; text-decoration: line-through; background: rgba(0, 0, 0, 0.1); }
            pre { margin: 0; white-space: pre-wrap; font-family: inherit; line-height: 1.5; }
            table { border-collapse: collapse; width: 100%; }`;

            // Convert the table HTML to XML (DOM -> XML)
            const contentHtml = new XMLSerializer().serializeToString(table);

            // Generate the SVG, draw to image (XML -> SVG)
            const img = new Image();
            img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent( `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <foreignObject width="100%" height="100%">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="height:100%; width:100%;">
                        <style><![CDATA[
                            * { box-sizing: border-box; }
                            body { margin: 0; padding: 0; background: ${styles.backgroundColor}; }
                            ${themeStyles}
                        ]]></style>
                        <div class="highlight">${contentHtml}</div>
                    </div>
                </foreignObject>
            </svg>`)}`;

            // Create the canvas to write the SVG
            const canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;

            // Wait for the image to load
            img.onload = () => {
                // Draw the SVG to the canvas (SVG -> PNG)
                ctx.drawImage(img, 0, 0);

                // Download the PNG
                const link = document.createElement('a');
                link.download = `code-flux-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            };
        }
    }));
});