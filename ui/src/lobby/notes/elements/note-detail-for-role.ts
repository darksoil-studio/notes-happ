import '@darksoil-studio/file-storage-zome/dist/elements/show-image.js';
import { wrapPathInSvg } from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { SignalWatcher, toPromise } from '@darksoil-studio/holochain-signals';
import { NotesStore, notesStoreContext } from '@darksoil-studio/notes-zome';
import '@darksoil-studio/notes-zome/dist/elements/note-detail.js';
import '@darksoil-studio/profiles-provider/dist/elements/search-users.js';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiAccountMultiplePlus } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { appStyles } from '../../../app-styles.js';

/**
 * @element note-detail
 * @fires edit-clicked: fired when the user clicks the edit icon button
 * @fires note-deleted: detail will contain { noteHash }
 */
@localized()
@customElement('note-detail-for-role')
export class NoteDetailForRole extends SignalWatcher(LitElement) {
	/**
	 * @internal
	 */
	@consume({ context: notesStoreContext, subscribe: true })
	notesStore!: NotesStore;

	renderCollaborators() {
		return html`
			<sl-icon-button
				.src=${wrapPathInSvg(mdiAccountMultiplePlus)}
				@click=${() => {
					this.shadowRoot!.querySelector('sl-dialog')!.show();
				}}
				style="font-size: 24px"
			>
			</sl-icon-button>
			<sl-dialog .label=${msg('Collaborators')}>
				<search-users .label=${msg('Add Friends')} .defaultValue=${[]}>
				</search-users>
			</sl-dialog>
		`;
	}

	render() {
		const note = this.notesStore.allNotes.get();

		switch (note.status) {
			case 'pending':
				return html`<div
					style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
				>
					<sl-spinner style="font-size: 2rem;"></sl-spinner>
				</div>`;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching the note.')}
					.error=${note.error}
				></display-error>`;
			case 'completed':
				return html`<note-detail .noteHash=${Array.from(note.value.keys())[0]}>
					<div class="row" style="flex: 1" slot="footer">
						<span style="flex: 1"></span>
						${this.renderCollaborators()}
					</div>
				</note-detail> `;
		}
	}

	static styles = [
		appStyles,
		css`
			:host {
				display: flex;
			}
			sl-dialog::part(body) {
				min-height: 300px;
			}
		`,
	];
}
