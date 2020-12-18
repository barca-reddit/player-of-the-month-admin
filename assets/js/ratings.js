class _Ratings extends _Core {
    constructor() {
        super();
        this.data = {
            ratings: {
            }
        };
    }

    async getRatings(start, end) {
        Ratings.toggleLoader();
        if (!start && !end) { // all
            const db = (await (await this.fetch('/ajax/ratings/all', {
                method: 'POST',
            })).json());
            this.data.ratings = {
                all: db
            }
        }
        else if (start && !end) { // current month
            const db = (await (await this.fetch('/ajax/ratings/dates', {
                method: 'POST',
                body: JSON.stringify({ start: start, end: 32503680000000 })
            })).json());
            this.data.ratings = {
                current_month: db
            }
        }
        else if (start && end) { // date range
            const db = (await (await this.fetch('/ajax/ratings/dates', {
                method: 'POST',
                body: JSON.stringify({ start: start, end: end })
            })).json());
            this.data.ratings = {
                date_range: db
            }
        }
        Ratings.toggleLoader();
    };

    render(data) {
        document.querySelector('.column.rating-table').innerHTML = ejs.render(
            this.template,
            {
                ratings: data,
                dates: {
                    start: data.start,
                    end: data.end
                }
            }
        );
    }

    toggleControls(hide) {
        if (hide) {
            document.querySelector('.date-start').setAttribute('disabled', 'true');
            document.querySelector('.date-end').setAttribute('disabled', 'true');
            document.querySelector('.ratings-search').setAttribute('disabled', 'true');
        }
        else {
            document.querySelector('.date-start').removeAttribute('disabled');
            document.querySelector('.date-end').removeAttribute('disabled');
            document.querySelector('.ratings-search').removeAttribute('disabled');
        }
    }

    toggleLoader() {
        if (document.querySelector('.loader-tab').style.display === 'flex') {
            document.querySelector('.loader-tab').style.display = 'none';
        }
        else {
            document.querySelector('.loader-tab').style.display = 'flex';
        }
    }

    async handleTabSwitch(event) {
        event.target.closest('.tabs').querySelectorAll('ul li').forEach(node => {
            node.classList.remove('is-active');
            event.target.closest('li').classList.add('is-active');
        });

        const rating_type = event.target.closest('li').getAttribute('rating-type');

        if (rating_type === 'current-month') {
            this.toggleControls(true);
            const date = new Date();
            await this.getRatings(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12, 0, 0)).getTime());
            this.render(this.data.ratings.current_month);
        }
        else if (rating_type === 'all') {
            this.toggleControls(true);
            await Ratings.getRatings();
            this.render(this.data.ratings.all);
        }
        else if (rating_type === 'date-range') {
            this.toggleControls(false);
        }
    }

    async generateMarkDown(table) {
        let MARKDOWN = '';
        table.querySelectorAll('thead tr th').forEach((th, index, array) => {
            if (index === 0) {
                MARKDOWN += `${th.textContent.trim()} |`;
            }
            else if (index + 1 === array.length) {
                MARKDOWN += ` ${th.textContent.trim()}\n`;
            }
            else {
                MARKDOWN += ` ${th.textContent.trim()} |`;
            }
        });
        MARKDOWN += `:---:|`.repeat(table.querySelectorAll('thead tr th').length);
        MARKDOWN += `\n`;
        table.querySelectorAll('tbody tr').forEach((tr) => {
            tr.querySelectorAll('td').forEach((td, index, array) => {
                if (index === 0) {
                    MARKDOWN += `${td.textContent.trim()} |`;
                }
                else if (index + 1 === array.length) {
                    MARKDOWN += ` ${td.textContent.trim()}\n`;
                }
                else {
                    MARKDOWN += ` ${td.textContent.trim()} |`;
                }
            })
        });

        await navigator.clipboard.writeText(MARKDOWN);
        await this.renderDefaultToast('Table copied to clipboard.', 'is-success');
        this.showToast();
    }

    addEventListeners() {
        document.body.addEventListener('click', async (event) => {
            if (event.target.closest('.tabs ul li')) {
                if (event.target.closest('.loader-tab')) {
                    return;
                }
                await Ratings.handleTabSwitch(event);
            }

            else if (event.target.classList.contains('ratings-search')) {
                if (!document.querySelector('.date-start').checkValidity()) {
                    document.querySelector('.date-start').focus();
                    return;
                }
                if (!document.querySelector('.date-end').checkValidity()) {
                    document.querySelector('.date-end').focus();
                    return;
                }

                event.target.classList.add('.is-loading');
                const start = new Date(document.querySelector('.date-start').value);
                const end = new Date(document.querySelector('.date-end').value);
                await Ratings.getRatings(this.processDate(start), this.processDate(end));
                this.render(this.data.ratings.date_range);
                event.target.classList.remove('.is-loading');
            }

            else if (event.target.classList.contains('markdown-copy')) {
                await Ratings.generateMarkDown(event.target.closest('table'));
            }

            else if (event.target.classList.contains('toast-ok')) {
                Ratings.hideToast();
            }
        })
    }


    async init() {
        this.template = await this.getModule('page-elements/ratings.rating-table.ejs');
        this.addEventListeners();
        Ratings.toggleLoader();
        const date = new Date();
        await this.getRatings(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12, 0, 0)).getTime());
        Ratings.toggleLoader();
        this.render(this.data.ratings.current_month);
    }
}

const Ratings = new _Ratings();

(async () => {
    await Ratings.init();
})();

