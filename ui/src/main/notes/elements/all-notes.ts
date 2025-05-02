import {
	appClientContext,
	sharedStyles,
	wrapPathInSvg,
} from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { SignalWatcher } from '@darksoil-studio/holochain-signals';
import { HoloHashMap } from '@darksoil-studio/holochain-utils';
import { AppClient, EntryHash } from '@holochain/client';
import { consume, provide } from '@lit/context';
import { msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { notesStoreContext } from '../context.js';
import { Note, NotesStore } from '../notes-store.js';

/**
 * @element all-notes
 */
@customElement('all-notes')
export class AllNotes extends SignalWatcher(LitElement) {
	@consume({ context: notesStoreContext, subscribe: true })
	@property({ type: Object })
	notesStore!: NotesStore;

	renderNote(note: Note) {
		return html`
			<sl-card>
				<div class="column" style="gap: 16px">
					<span class="title">${note.title} </span>
					<span>${note.content} </span>
				</div>
			</sl-card>
		`;
	}

	renderNotes(notes: ReadonlyMap<EntryHash, Note>) {
		const sortedNotes = Array.from(notes.values()).sort(
			(n1, n2) => n2.lastModified - n1.lastModified,
		);
		if (sortedNotes.length === 0) {
			return html` <div
				class="column placeholder center-content"
				style="gap: 8px; flex: 1; margin: 64px"
			>
				<sl-icon
					.src=${wrapPathInSvg(mdiInformationOutline)}
					style="font-size: 64px"
				></sl-icon>
				<span style="text-align: center">${msg('No notes found.')}</span>
			</div>`;
		}
		return html`
			<div class="column" style="gap: 16px">
				${sortedNotes.map(note => this.renderNote(note))}
			</div>
		`;
	}

	render() {
		const notes = this.notesStore.allCurrentNotes.get();

		switch (notes.status) {
			case 'pending':
				return html`<div
					style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
				>
					<sl-spinner style="font-size: 2rem;"></sl-spinner>
				</div>`;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching notes.')}
					.error=${notes.error}
				></display-error>`;
			case 'completed':
				return this.renderNotes(notes.value);
		}
	}
	static styles = [
		sharedStyles,
		css`
			:host {
				display: flex;
			}
		`,
	];
}
