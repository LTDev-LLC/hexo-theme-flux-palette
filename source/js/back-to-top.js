document.addEventListener('alpine:init', () => {
    Alpine.data('backToTop', () => ({
        show: false,
        init() {
            document.body.addEventListener('scroll', () => {
                this.show = (document.body.scrollTop || 0) > 300;
            }, { passive: true });
        },
        scrollToTop() {
            document.body.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }));
});