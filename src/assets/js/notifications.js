class Toast_Notification {
    static show(message, context, options = {}) {
        const { autoClose = true, timeout = 3000 } = options;

        const toast = document.createElement('div');
        toast.classList.add('toast', context);
        toast.innerHTML = `
            <span>${message}</span>
            ${!autoClose ? '<button class="close-btn">×</button>' : ''}
        `;

        document.body.appendChild(toast);

        if (autoClose) {
            setTimeout(() => {
                toast.remove();
            }, timeout);
        } else {
            toast.querySelector('.close-btn').addEventListener('click', () => {
                toast.remove();
            });
        }
    }

    static showError(message) {
        this.show(message, 'error', { autoClose: false });
    }

    static showWarning(message) {
        this.show(message, 'warning', { autoClose: false });
    }

    static showInfo(message) {
        this.show(message, 'info');
    }

    static showSuccess(message) {
        this.show(message, 'success');
    }
}

