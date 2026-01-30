document.addEventListener('alpine:init', () => {
    Alpine.data('lightbox', () => ({
        isOpen: false,
        isLoading: false,
        imgSrc: '',
        imgAlt: '',
        init() {
            document.body.addEventListener('click', (e) => {
                const img = e.target.closest('img');
                if (img && (img.closest('.post-content') || img.closest('.gallery-grid'))) {
                    const link = img.closest('a');

                    // Prevent non-image links from opening
                    if (link && !/\.(jpe?g|png|gif|webp|svg)$/i.test(link.href))
                        return;

                    // Prevent link from opening if it's an image link
                    if (link)
                        e.preventDefault();

                    // Use the high-res original if available, otherwise fallback to current src
                    this.isLoading = true;
                    this.imgSrc = img.dataset.originalSrc || img.src;
                    this.imgAlt = img.alt || '';
                    this.isOpen = true;
                }
            });
        },
        close() {
            this.isOpen = false;
            // Clear source after animation to prevent flash of old image next open
            setTimeout(() => {
                this.imgSrc = '';
                this.isLoading = false;
            }, 300);
        }
    }));
});