class _MatchList extends _Core {
    async getDb() {
        const db = (await (await this.fetch('/ajax/matches/all', {
            method: 'POST',
        })).json());
        this.data = {
            matches: db
        }
    };

    async deleteMatch() {
        (await this.fetch('/ajax/matches/delete', {
            method: 'DELETE',
            body: JSON.stringify({
                id: this.removal_id
            })
        }));
        const removal = document.querySelector(`[match-id="${this.removal_id}"]`);
        removal.style.animation = 'opacity .35s ease-in-out';
        removal.addEventListener('animationend', () => {
            document.querySelectorAll(`[match-id="${this.removal_id}"]`).forEach(node => node.remove());
        })
    };

    async renderModal(match) {
        if (!this.modal) {
            this.modal = await this.getModule('modals/matches.list.edit-match.ejs');
        }
        document.querySelector('.modal').innerHTML = ejs.render(
            this.modal,
            {
                match: { ...match }
            }
        );
    }

    async renderRatings(ratings) {
        if (!this.ratings_table) {
            this.ratings_table = await this.getModule('page-elements/matches.list.rating-table.ejs');
        }
        const row = document.querySelector(`tr[match-id="${ratings[0].match_id}"]`);
        row.insertAdjacentHTML(
            'afterend',
            ejs.render(
                this.ratings_table,
                {
                    ratings: ratings
                }
            )
        )
    }

    toggleRatings(id) {
        const row = document.querySelector(`.is-rating[match-id="${id}"]`);
        if (row.style.display === 'table-row') {
            document.querySelector(`.is-match[match-id="${id}"] .match-ratings`).setAttribute('src', '/assets/img/angle-down.svg');
            document.querySelectorAll(`.is-rating[match-id="${id}"]`).forEach(node => {
                node.style.display = 'none';
            });
        }
        else {
            document.querySelector(`.is-match[match-id="${id}"] .match-ratings`).setAttribute('src', '/assets/img/angle-up.svg');
            document.querySelectorAll(`.is-rating[match-id="${id}"]`).forEach(node => {
                node.style.display = 'table-row';
            });
        }
    }

    render() {
        document.querySelector('.column.match-tables').innerHTML = ejs.render(
            this.template,
            {
                matches: this.data.matches,
            }
        );
    }

    async renderToast(id) {
        if (!this.toast) {
            this.toast = await this.getModule('modals/matches.list.toast.ejs');
        }

        if (!this.is_rendering) {
            const match = this.data.matches.find(match => match.id === id);
            document.querySelector('.toast').innerHTML = ejs.render(
                this.toast,
                {
                    match: { ...match }
                },
            );
            this.removal_id = match.id;
        }
    }

    addEventListeners() {
        document.body.addEventListener('click', async (event) => {
            const classList = event.target.classList;
            if (classList.contains('match-delete')) {
                await MatchList.renderToast(event.target.closest('tr').getAttribute('match-id'));
                MatchList.showToast();
            }
            else if (classList.contains('match-edit')) {
                await MatchList.renderModal(
                    this.data.matches.find(match => match.id === event.target.closest('tr').getAttribute('match-id'))
                );
                MatchList.toggleModal();
            }
            else if (classList.contains('match-ratings')) {
                const parent = event.target.closest('tr');
                if (parent.getAttribute('has-ratings') === 'true') {
                    MatchList.toggleRatings(parent.getAttribute('match-id'));
                }
                else {
                    const request = await MatchList.fetch('/ajax/ratings/match', {
                        method: 'POST',
                        body: JSON.stringify({ id: parent.getAttribute('match-id') })
                    });
                    const result = await request.json();
                    parent.setAttribute('has-ratings', 'true');
                    await MatchList.renderRatings(result);
                    MatchList.toggleRatings(parent.getAttribute('match-id'));
                }
            }
            else if (classList.contains('toast-delete')) {
                MatchList.hideToast();
                await MatchList.deleteMatch();
            }
            else if (classList.contains('toast-cancel')) {
                MatchList.hideToast();
            }
            else if (classList.contains('modal-delete') || classList.contains('modal-cancel') || classList.contains('modal-background')) {
                MatchList.toggleModal();
            }
            else if (classList.contains('modal-save')) {
                const modal_save = document.querySelector('.modal-save');
                modal_save.classList.add('is-loading');
                MatchList.processMatch();

                await MatchList.fetch('/ajax/matches/update', {
                    method: 'PATCH',
                    body: JSON.stringify({ match: this.data.match })
                });

                MatchList.toggleModal();
                modal_save.classList.remove('is-loading');
                await MatchList.renderDefaultToast('Match data saved to database.', 'is-success')
                MatchList.showToast();
            }
            else if (classList.contains('toast-ok')) {
                MatchList.hideToast();
            }
        });

        document.body.addEventListener('input', (event) => {
            if (!event.target.checkValidity() && event.target.value.length > 0) {
                document.querySelector('.modal-save').setAttribute('disabled', '');
                event.target.classList.add('is-danger');

            }
            else if (event.target.checkValidity() && event.target.value.length > 0) {
                event.target.classList.remove('is-danger');
                document.querySelector('.modal-save').removeAttribute('disabled');
            }
        });
    }

    async init() {
        await this.getDb();
        this.template = await this.getModule('page-elements/matches.list.match-table.ejs');
        this.render();
        this.addEventListeners();
    }
}

const MatchList = new _MatchList();

(async () => {
    await MatchList.init();
})();

