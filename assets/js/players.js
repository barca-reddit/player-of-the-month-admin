class _Players extends _Core {
    async getPlayer(id) {
        const db = (await (await this.fetch('/ajax/players/player', {
            method: 'POST',
            body: JSON.stringify({ id: id })
        })).json());
        this.data = {
            player: { ...db }
        }
    };

    async renderModal() {
        if (!this.modal) {
            this.modal = await this.getModule('modals/players.edit.ejs');
        }
        document.querySelector('.modal').innerHTML = ejs.render(
            this.modal,
            {
                player: this.data.player
            }
        );
    };

    playerData() {
        return ({
            _id: this.data.player._id,
            name: document.querySelector('[mongo-key="name"]').value,
            number: parseInt(document.querySelector('[mongo-key="number"]').value),
            photo: document.querySelector('[mongo-key="photo"]').value,
            tags: [
                ...new Set(
                    Array.from(document.querySelectorAll('.tag.tag-editable')).map(node => {
                        return this.normalize(node.querySelector('span').textContent.trim())
                    })
                )
            ]
        })
    }

    validateModal() {
        const parent = document.querySelector('.modal');
        for (let index = 0; index < parent.querySelectorAll('input').length; index++) {
            if (!parent.querySelectorAll('input')[index].checkValidity()) {
                parent.querySelectorAll('input')[index].focus();
                return false;
            }
        }
        if (parent.querySelectorAll('.tag.tag-editable').length < 1) {
            return false;
        }
        return true;
    }

    addEventListeners() {
        document.body.addEventListener('click', async (event) => {
            const classList = event.target.classList;
            if (event.target.closest('.player-edit')) {
                await Players.getPlayer(event.target.closest('.column').getAttribute('player-id'));
                await Players.renderModal();
                Players.toggleModal();
            }
            else if (event.target.closest('.tag.tag-add')) {
                event.target.closest('.tag.tag-add').insertAdjacentHTML(
                    'beforebegin',
                    `<span class="tag tag-editable is-info" spellcheck="false">
                        <span class="" contenteditable="true">Player name...</span>
                        <button class="delete delete-tag is-small ml-4"></button>
                    </span>`
                )
            }
            else if (classList.contains('delete-tag')) {
                event.target.closest('.tag.tag-editable').remove();
            }
            else if (classList.contains('modal-save')) {
                if (Players.validateModal()) {
                    document.querySelector('.modal-save').classList.add('is-loading');
                    await this.fetch('/ajax/players/update', {
                        method: 'PATCH',
                        body: JSON.stringify(Players.playerData())
                    });
                    Players.toggleModal();
                    document.querySelector('.modal-save').classList.remove('is-loading');
                    await Players.renderDefaultToast('Player data saved to database.', 'is-success');
                    Players.showToast();
                }
            }
            else if (classList.contains('modal-delete') || classList.contains('modal-cancel') || classList.contains('modal-background')) {
                Players.toggleModal();
            }
            else if (event.target.classList.contains('toast-ok')) {
                Players.hideToast();
            }
        });

        document.body.addEventListener('input', (event) => {
            if (event.target.tagName.toLowerCase() === 'input') {
                if (!event.target.checkValidity() && event.target.value.length > 0) {
                    event.target.classList.add('is-danger')

                }
                else if (event.target.checkValidity() && event.target.value.length > 0) {
                    event.target.classList.remove('is-danger');
                }
            }
        });

        new MutationObserver(mutationsList => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.target.classList.contains('tags')) {
                    const parent = mutation.target.closest('.column');
                    if (parent.querySelectorAll('.tag.tag-editable').length < 1) {
                        parent.classList.add('tags-invalid');
                    }
                    else {
                        parent.classList.remove('tags-invalid');
                    }
                }
            }
        }).observe(
            document.querySelector('.modal'),
            { attributes: false, childList: true, subtree: true }
        )
    }

    async init() {
        this.addEventListeners();
    }
}

const Players = new _Players();

(async () => {
    await Players.init();
})();

