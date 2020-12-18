class _PointSystem {
    constructor(data) {
        this.data = data.sort((a, b) => b.votes - a.votes);
        this.iterator;
        this.current_value;
    }

    * generator() {
        yield { points: 12 };
        yield { points: 9 };
        yield { points: 6 };
        yield { points: 4 };
        yield { points: 2 };
        while (true) {
            yield { points: 0 };
        }
    }

    getValue() {
        return this.current_value;
    }

    goNext() {
        this.current_value = this.iterator.next().value;
        return this.current_value;
    }

    distribute() {
        this.iterator = this.generator();
        return this.data.map((item, index, array) => {
            if (index === 0) {
                return { ...item, ...this.goNext() }
            }
            else if (array[index].votes === array[index - 1].votes) {
                return { ...item, ...this.current_value }
            }
            else if (array[index].votes < array[index - 1].votes) {
                return { ...item, ...this.goNext() }
            }
        });
    }
}

class _MatchEditor extends _Core {
    async getDb(id) {
        const db = (await (await this.fetch('/ajax/players/all', {
            method: 'POST',
        })).json());
        this.data = {
            players: db.map(({ _id, ...rest }) => ({ player_id: _id, match_id: id, ...rest }))
        }
    };

    async getPoll(id) {
        const poll = (await (await this.fetch('/ajax/strawpoll', {
            method: 'POST',
            body: JSON.stringify({
                id: id
            })
        })).json());
        const totalVotes = poll.votes.reduce((accumulator, entry) => {
            return accumulator + entry;
        }, 0);
        this.poll_question = poll.title;
        this.data.poll = poll.options
            .map((option, index) => ({
                name: this.normalize(option).trim(),
                votes: poll.votes[index],
                percent: parseFloat(((poll.votes[index] * 100) / totalVotes).toFixed(2)),
                in_db: false
            }))
            .sort((a, b) => b.votes - a.votes);
    };

    async renderModal(missing) {
        if (!this.modal) {
            this.modal = await this.getModule('modals/matches.edit.missing-player.ejs');
        }
        document.querySelector('.modal').innerHTML = ejs.render(
            this.modal,
            {
                missing: {
                    name: missing
                },
                players: this.data.players
                    .filter(player => !player.in_poll)
                    .sort((a, b) => a.name.localeCompare(b.name))
            }
        );
    }

    render() {
        document.querySelector('.columns.strawpoll-list').innerHTML = ejs.render(
            this.template,
            {
                poll: this.data.poll,
                players: this.data.players.filter(item => item.in_poll),
                question: this.poll_question
            }
        );
    }

    reset() {
        document.querySelector('.strawpoll-list').innerHTML = '';
        document.querySelector('.strawpoll-save').setAttribute('disabled', '');
        document.querySelector('.strawpoll-search').removeAttribute('disabled', '');
        document.querySelectorAll('.strawpoll-controls input').forEach(input => {
            input.value = '';
            if (input.getAttribute('mongo-key') === 'id') {
                input.removeAttribute('disabled');
            }
            else {
                input.setAttribute('disabled', '');
            }
        });
        this.data.poll = {};
        this.poll_question = '';
    }

    processData() {
        this.data.players = this.data.players.map(player => {
            const poll = this.data.poll.find(entry => player.tags.find(tag => tag.toLowerCase() === entry.name.toLowerCase()));
            if (poll) {
                poll.in_db = true;
                return { ...player, in_poll: true, votes: poll.votes, percent: poll.percent }
            }
            else { // do this if you want full list of players
                return { ...player, in_poll: false, votes: 0, percent: 0, points: 0 }
            }
        });
    }

    addEventListeners() {
        document.querySelector('.strawpoll-search').addEventListener('click', async function () {
            const parent = this.closest('.columns').querySelector('.form-strawpoll-id');
            if (!parent.checkValidity()) {
                parent.focus();
                return;
            };

            this.classList.add('is-loading');
            await MatchEditor.getDb(parent.value);
            await MatchEditor.getPoll(parent.value);
            MatchEditor.processData();
            MatchEditor.data.players = new _PointSystem(MatchEditor.data.players).distribute();
            MatchEditor.render();

            document.querySelector('.strawpoll-save').removeAttribute('disabled');
            document.querySelectorAll('.strawpoll-controls input').forEach(input => input.removeAttribute('disabled'));
            document.querySelector('.form-strawpoll-id').setAttribute('disabled', '');
            document.querySelector('.strawpoll-search').setAttribute('disabled', '');
            this.classList.remove('is-loading');
        });

        document.querySelector('.strawpoll-save').addEventListener('click', async function () {
            const parent = this.closest('.columns');
            for (let index = 0; index < parent.querySelectorAll('input').length; index++) {
                if (!parent.querySelectorAll('input')[index].checkValidity()) {
                    parent.querySelectorAll('input')[index].focus();
                    return;
                }
            }
            if (document.querySelectorAll('.entry-missing').length > 0) {
                await MatchEditor.renderDefaultToast('Match all entries from the poll to their corresponding players from the database.', 'is-danger');
                MatchEditor.showToast();
                return;
            }
            this.classList.add('is-loading');
            MatchEditor.processMatch();
            await MatchEditor.fetch('/ajax/matches/insert', {
                method: 'PUT',
                body: JSON.stringify({ match: MatchEditor.data.match, ratings: MatchEditor.data.players.filter(player => player.in_poll) })
            });
            this.classList.remove('is-loading');
            MatchEditor.reset();
            await MatchEditor.renderDefaultToast('Successfully saved ratings to the database.', 'is-link');
            MatchEditor.showToast();
        });

        document.body.addEventListener('input', (event) => {
            if (event.target.classList.contains('modal-player-select')) {
                if (!event.target.checkValidity()) {
                    document.querySelector('.modal-save').setAttribute('disabled', '')
                }
                else {
                    document.querySelector('.modal-save').removeAttribute('disabled');
                }
            }
            else if (!event.target.checkValidity() && event.target.value.length > 0) {
                event.target.classList.add('is-danger')

            }
            else if (event.target.checkValidity() && event.target.value.length > 0) {
                event.target.classList.remove('is-danger');
            }
        });

        document.querySelector('.strawpoll-reset').addEventListener('click', async function () {
            MatchEditor.reset();
        });

        document.body.addEventListener('click', async (event) => {
            const classList = event.target.classList;
            if (classList.contains('entry-missing')) {
                await MatchEditor.renderModal(event.target.text);
                MatchEditor.toggleModal();
            }
            else if (classList.contains('modal-save')) {
                document.querySelector('.modal-save').classList.add('is-loading');
                const id = document.querySelector('.modal-player-select').value;
                const tag = document.querySelector('.modal-save').getAttribute('modal-player-tag');
                if (document.querySelector('.modal-player-database').checked) {
                    await MatchEditor.fetch('/ajax/players/tags', {
                        method: 'PUT',
                        body: JSON.stringify({ id: id, tag: tag })
                    });
                }
                const poll = MatchEditor.data.poll.find(player => player.name === tag);
                poll.in_db = true;
                const player = MatchEditor.data.players.find(player => player.player_id === id);
                player.in_poll = true;
                player.votes = poll.votes;
                player.percent = poll.percent;
                player.tags.push(tag);
                MatchEditor.data.players = new _PointSystem(MatchEditor.data.players).distribute();
                MatchEditor.render();
                MatchEditor.toggleModal();
                document.querySelector('.modal-save').classList.remove('is-loading');
            }
            else if (classList.contains('modal-delete') || classList.contains('modal-cancel') || classList.contains('modal-background')) {
                MatchEditor.toggleModal();
            }
            else if (classList.contains('toast-ok')) {
                MatchEditor.hideToast();
            }
        });
    }

    async init() {
        this.template = await this.getModule('page-elements/matches.edit.poll-table.ejs');
        this.addEventListeners();
    }
}

const MatchEditor = new _MatchEditor();

(async () => {
    await MatchEditor.init();
})();