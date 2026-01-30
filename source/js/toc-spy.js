document.addEventListener('alpine:init', () => {
    Alpine.data('tocSpy', () => ({
        init() {
            // Select headings within the post content
            const headings = document.querySelectorAll('.post-content h1, .post-content h2, .post-content h3, .post-content h4, .post-content h5, .post-content h6'),
                links = this.$el.querySelectorAll('.toc-link');

            if (headings.length === 0 || links.length === 0)
                return;

            // Use IntersectionObserver to highlight the active section
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        if (id) {
                            links.forEach(l => l.classList.remove('active'));
                            const activeLink = this.$el.querySelector(`.toc-link[href="#${id}"]`);
                            if (activeLink) activeLink.classList.add('active');
                        }
                    }
                });
            }, { rootMargin: '-80px 0px -70% 0px' }); // Trigger when heading is near top of viewport

            headings.forEach(h => observer.observe(h));
        }
    }));
});