class LoadingSpinner {
    constructor(parentElement) {
        this.parentElement = parentElement;

        const position = window.getComputedStyle(this.parentElement).position;
        if (position === 'static' || !position) {
            this.parentElement.style.position = 'relative';
        }

        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';

        this.spinner = document.createElement('div');
        this.spinner.className = 'loading-spinner';

        // Append spinner to overlay
        this.overlay.appendChild(this.spinner);
    }

    show() {
        this.parentElement.appendChild(this.overlay);
    }

    hide() {
        if (this.overlay.parentElement) {
            this.overlay.parentElement.removeChild(this.overlay);
        }
    }
}











