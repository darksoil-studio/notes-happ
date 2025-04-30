import '@darksoil-studio/file-storage-zome/dist/elements/show-image.js';
import { ActionHash, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { hashProperty } from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { SignalWatcher } from '@darksoil-studio/holochain-signals';
import { EntryRecord } from '@darksoil-studio/holochain-utils';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import { appStyles } from '../../../app-styles.js';
import { notesStoreContext } from '../context.js';
import { NotesStore } from '../notes-store.js';
import { Note } from '../types.js';

/**
 * @element note-summary
 * @fires note-selected: detail will contain { noteHash }
 */
@localized()
@customElement('note-summary')
export class NoteSummary extends SignalWatcher(LitElement) {
	/**
	 * REQUIRED. The hash of the Note to show
	 */
	@property(hashProperty('note-hash'))
	noteHash!: ActionHash;

	/**
	 * @internal
	 */
	@consume({ context: notesStoreContext, subscribe: true })
	notesStore!: NotesStore;

	renderSummary(entryRecord: EntryRecord<Note>) {
		return html`
			<div class="row" style="gap: 16px; flex: 1; height: 200px">
				<div class="row" style="height: 200px">
					${entryRecord.entry.images_hashes.map(
						imageHash => html`
							<show-image
								style="max-width: 600px;"
								.imageHash=${imageHash}
							></show-image>
						`,
					)}
				</div>
				<div class="column" style="gap: 16px; flex: 1; margin-left: 20px">
					<span style="white-space: pre-line; font-size: 24px"
						>${entryRecord.entry.title}</span
					>

					<div style="overflow: hidden">
						${unsafeHTML(entryRecord.entry.content)}
					</div>
				</div>
			</div>
		`;
	}

	renderNote() {
		const note = this.notesStore.notes.get(this.noteHash).latestVersion.get();

		switch (note.status) {
			case 'pending':
				return html`<div
					style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
				>
					<sl-spinner style="font-size: 2rem;"></sl-spinner>
				</div>`;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching the note')}
					.error=${note.error}
				></display-error>`;
			case 'completed':
				return this.renderSummary(note.value);
		}
	}

	render() {
		return html`<sl-card
			style="flex: 1; cursor: grab;"
			@click=${() =>
				this.dispatchEvent(
					new CustomEvent('note-selected', {
						composed: true,
						bubbles: true,
						detail: {
							noteHash: this.noteHash,
						},
					}),
				)}
		>
			${this.renderNote()}
		</sl-card>`;
	}

	static styles = [
		appStyles,
		css`
			:host {
				display: flex;
			}
			sl-checkbox {
				margin-bottom: 8px;
			}
		`,
	];
}
