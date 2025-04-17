import '@darksoil-studio/file-storage-zome/dist/elements/show-image.js';
import {
	ActionHash,
	EntryHash,
	Record,
	encodeHashToBase64,
} from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import {
	mdiAlertCircleOutline,
	mdiDelete,
	mdiOrderBoolAscendingVariant,
	mdiPencil,
} from '@mdi/js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import {
	hashProperty,
	notifyError,
	wrapPathInSvg,
} from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import { SignalWatcher, toPromise } from '@tnesh-stack/signals';
import { EntryRecord } from '@tnesh-stack/utils';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { appStyles } from '../../../app-styles.js';
import { effect } from '../../../utils.js';
import { notesStoreContext } from '../context.js';
import { NotesStore } from '../notes-store.js';
import { Note } from '../types.js';

/**
 * @element note-detail
 * @fires edit-clicked: fired when the user clicks the edit icon button
 * @fires note-deleted: detail will contain { noteHash }
 */
@localized()
@customElement('note-detail')
export class NoteDetail extends SignalWatcher(LitElement) {
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

	updatingPromise: number | undefined;
	promises: Array<Promise<any>> = [];

	async debouncedUpdateNote(currentRecord: EntryRecord<Note>) {
		if (this.updatingPromise) clearInterval(this.updatingPromise);
		this.updatingPromise = setTimeout(async () => {
			for (const promise of this.promises) {
				await promise;
			}
			const promise = this.updateNote(currentRecord);
			this.promises.push(promise);
		}, 3000);
	}

	async updateNote(currentRecord: EntryRecord<Note>) {
		const titleEl = this.shadowRoot!.getElementById(
			'title',
		)! as HTMLSpanElement;
		const contentEl = this.shadowRoot!.getElementById(
			'content',
		)! as HTMLDivElement;
		const note: Note = {
			title: titleEl.innerHTML,
			content: contentEl.innerHTML,
			images_hashes: currentRecord.entry.images_hashes,
		};

		try {
			const promise = this.notesStore.client.updateNote(
				this.noteHash,
				currentRecord.actionHash,
				note,
			);
			// this.updatingPromises.push(promise);
			// const updateRecord = await promise;

			this.dispatchEvent(
				new CustomEvent('note-updated', {
					composed: true,
					bubbles: true,
					detail: {
						originalNoteHash: this.noteHash,
						previousNoteHash: currentRecord.actionHash,
						updatedNoteHash: updateRecord.actionHash,
					},
				}),
			);
		} catch (e: unknown) {
			console.error(e);
			notifyError(msg('Error updating the note'));
		}
	}

	async deleteNote() {
		try {
			await this.notesStore.client.deleteNote(this.noteHash);

			this.dispatchEvent(
				new CustomEvent('note-deleted', {
					bubbles: true,
					composed: true,
					detail: {
						noteHash: this.noteHash,
					},
				}),
			);
		} catch (e: unknown) {
			console.error(e);
			notifyError(msg('Error deleting the note'));
		}
	}

	async addCheckbox(note: EntryRecord<Note>) {
		const contentEl = this.shadowRoot!.getElementById(
			'content',
		)! as HTMLDivElement;
		const finalContent = `${contentEl.innerHTML}<br><sl-checkbox></sl-checkbox><br>`;
		contentEl.innerHTML = finalContent;
		this.debouncedUpdateNote(note);
		setTimeout(() => {
			document.getSelection()!.selectAllChildren(contentEl);
			document.getSelection()!.collapseToEnd();
		});
	}

	renderDetail(entryRecord: EntryRecord<Note>) {
		return html`
			<sl-card style="flex: 1">
				<div class="column" style="gap: 16px; flex: 1; width: 558px">
					<div class="row" style="align-items: center">
						<span
							id="title"
							style="font-size: 24px; flex: 1; overflow: auto"
							contenteditable
							@input=${() => this.debouncedUpdateNote(entryRecord)}
						></span>
						<sl-icon-button
							.src=${wrapPathInSvg(mdiDelete)}
							@click=${() => this.deleteNote()}
						></sl-icon-button>
					</div>

					<div
						style="flex: 1"
						contenteditable
						id="content"
						@input=${() => this.debouncedUpdateNote(entryRecord)}
					></div>
					<div class="row" style="max-height: 200px">
						<sl-icon-button
							style="font-size: 24px"
							.src=${wrapPathInSvg(mdiOrderBoolAscendingVariant)}
							@click=${() => this.addCheckbox(entryRecord)}
						>
						</sl-icon-button>

						${entryRecord.entry.images_hashes.map(
							imageHash => html`
								<show-image
									style="max-width: 600px;"
									.imageHash=${imageHash}
								></show-image>
							`,
						)}
					</div>
				</div>
			</sl-card>
		`;
	}

	async firstUpdated() {
		const latestVersion = await toPromise(
			this.notesStore.notes.get(this.noteHash).latestVersion,
		);
		setTimeout(() => {
			const titleEl = this.shadowRoot!.getElementById(
				'title',
			)! as HTMLSpanElement;
			const contentEl = this.shadowRoot!.getElementById(
				'content',
			)! as HTMLDivElement;

			titleEl.innerHTML = latestVersion.entry.title;
			contentEl.innerHTML = latestVersion.entry.content;
			titleEl.focus();

			effect(() => {
				const latestVersion = this.notesStore.notes
					.get(this.noteHash)
					.latestVersion.get();
				if (latestVersion.status !== 'completed') return;

				if (
					encodeHashToBase64(latestVersion.value.action.author) !==
					encodeHashToBase64(this.notesStore.client.client.myPubKey)
				) {
					titleEl.innerHTML = latestVersion.value.entry.title;
					contentEl.innerHTML = latestVersion.value.entry.content;
				}
			});
		});
	}

	disconnectedCallback(): void {
		super.disconnectedCallback();
		const titleEl = this.shadowRoot!.getElementById(
			'title',
		)! as HTMLSpanElement;
		const contentEl = this.shadowRoot!.getElementById(
			'content',
		)! as HTMLDivElement;

		if (titleEl.innerText.trim() === '' && contentEl.innerText.trim() === '') {
			this.deleteNote();
		}
	}

	render() {
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
				return this.renderDetail(note.value);
		}
	}

	static styles = [
		appStyles,
		css`
			:host {
				display: flex;
			}
			[contenteditable]:active,
			[contenteditable]:focus {
				border: none;
				outline: none;
			}
			sl-checkbox {
				margin-bottom: 8px;
			}
		`,
	];
}
