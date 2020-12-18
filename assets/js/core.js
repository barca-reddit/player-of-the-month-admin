class _Core {
    async fetch(url, options = null) {
        let request;
        try {
            request = await fetch(url, options);
            if (!request.ok) {
                throw request;
            }
            return request;
        } catch (json) {
            try {
                const result = await request.json();
                throw result;
            } catch (error) {
                throw error;
            }
        }
    }

    async getModule(path) {
        return (await (await this.fetch(`/views/${path}`)).text());
    };

    normalize(string) {
        return string.normalize("NFD").replace(/[\u0300-\u036f]/g, '')
    };

    processDate(date) {
        // set all dates to 12:00 UTC to avoid dealing with complicated timezone and date formatting
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0)).getTime();
    }

    processMatch() {
        this.data.match = {
            id: parseInt(document.querySelector('[mongo-key="id"]').value),
            timestamp: this.processDate(new Date(document.querySelector('[mongo-key="timestamp"]').value)),
            home_team_score: parseInt(document.querySelector('[mongo-key="home_team_score"]').value),
            away_team_score: parseInt(document.querySelector('[mongo-key="away_team_score"]').value),
            competition: document.querySelector('[mongo-key="competition"]').value,
            thread: document.querySelector('[mongo-key="thread"]').value,
            home_team_name: document.querySelector('[mongo-key="home_team_name"]').value,
            away_team_name: document.querySelector('[mongo-key="away_team_name"]').value,
        }
    }

    async renderDefaultToast(message, css_class) {
        if (!this.toast) {
            this.toast = await this.getModule('modals/default.toast.ejs');
        }

        if (!this.is_rendering) {
            document.querySelector('.toast').innerHTML = ejs.render(
                this.toast,
                {
                    message: message,
                    css_class: css_class
                },
            );
        }
    }

    toggleModal() {
        const modal = document.querySelector('.modal');
        if (document.querySelector('.modal').style.display === 'flex') {
            modal.style.animation = 'opacity .25s ease-in-out';
            modal.addEventListener('animationend', () => {
                modal.style.animation = '';
                modal.style.display = 'none';
            }, { once: true });
        }
        else {
            modal.style.display = 'flex';
            modal.style.animation = 'opacity .25s ease-in-out reverse';
            modal.addEventListener('animationend', () => {
                modal.style.animation = '';
            }, { once: true });
        }
    }

    showToast() {
        const toast = document.querySelector('.toast');
        this.is_rendering = true;
        toast.style.display = 'flex';
        toast.style.animation = 'toast .35s ease-in-out';
        toast.addEventListener('animationend', () => {
            toast.style.animation = '';
            this.is_rendering = false;
        }, { once: true });
    };

    hideToast() {
        const toast = document.querySelector('.toast');
        toast.style.animation = 'toast .35s ease-in-out reverse';
        toast.addEventListener('animationend', () => {
            toast.style.animation = '';
            toast.style.display = 'none';
        }, { once: true });
    }
}