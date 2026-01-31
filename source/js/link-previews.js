document.addEventListener('alpine:init', () => {
    Alpine.data('linkPreview', () => ({
        show: false,
        title: '',
        summary: '',
        pos: { x: 0, y: 0 },
        cache: new Map(),
        init() {
            const links = document.querySelectorAll('.post-content a[href^="/"]:not([href^="//"])');
            links.forEach(link => {
                link.addEventListener('mouseenter', (e) => this.handleEnter(e, link.getAttribute('href')));
                link.addEventListener('mouseleave', () => { this.show = false; });
            });
        },
        async handleEnter(e, url) {
            this.pos = { x: e.clientX, y: e.clientY + 20 };
            this.show = true;
            this.title = 'Loading...';
            this.summary = '';
            if (this.cache.has(url)) {
                this.updateContent(this.cache.get(url));
                return;
            }
            try {
                const res = await fetch(url),
                    html = await res.text(),
                    doc = new DOMParser().parseFromString(html, 'text/html'),
                    data = {
                        title: doc.querySelector('title')?.innerText.split('|')[0].trim() || 'Untitled',
                        summary: doc.querySelector('meta[property="og:description"]')?.content ||
                            doc.querySelector('.post-content p')?.innerText.substring(0, 140) + '...'
                    };

                this.cache.set(url, data);
                if (this.show)
                    this.updateContent(data);
            } catch (err) {
                this.show = false;
            }
        },
        updateContent(data) {
            this.title = data.title;
            this.summary = data.summary;
        }
    }));
});