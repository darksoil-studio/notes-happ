import {
	appClientContext,
	hashProperty,
	wrapPathInSvg,
} from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { AsyncComputed } from '@darksoil-studio/holochain-signals';
import '@darksoil-studio/notes-zome/dist/elements/notes-context.js';
import {
	ActionHash,
	AgentPubKey,
	AppClient,
	CellType,
	EntryHash,
	Record,
} from '@holochain/client';
import { Signal, SignalWatcher } from '@lit-labs/signals';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { AsyncComputed as AC } from 'signal-utils/async-computed';

import { appStyles } from '../../../app-styles.js';
import { isMobileContext } from '../../../context.js';
import './note-summary-for-role.js';

/**
 * @element all-notes
 */
@localized()
@customElement('all-notes')
export class AllNotes extends SignalWatcher(LitElement) {
	/**
	 * @internal
	 */
	@consume({ context: appClientContext, subscribe: true })
	client!: AppClient;

	@consume({ context: isMobileContext, subscribe: true })
	isMobile!: boolean;

	renderList(roles: Array<string>) {
		if (roles.length === 0) {
			return html` <div
				class="column placeholder center-content"
				style="gap: 8px; flex: 1"
			>
				<sl-icon
					.src=${wrapPathInSvg(mdiInformationOutline)}
					style="font-size: 64px;"
				></sl-icon>
				<span style="text-align: center">${msg('No notes found.')}</span>
			</div>`;
		}

		return html`
			<div class="flex-scrollable-parent">
				<div class="flex-scrollable-container">
					<div class="flex-scrollable-y">
						<div
							class="row"
							style="gap: 16px; flex: 1; flex-wrap: wrap; margin: 16px"
						>
							${roles.map(
								role =>
									html` <notes-context role="${role}">
										<note-summary-for-role
											style=${styleMap({
												width: this.isMobile ? '100%' : '300px',
												height: '200px',
											})}
											@click=${() =>
												this.dispatchEvent(
													new CustomEvent('note-role-selected', {
														bubbles: true,
														composed: true,
														detail: {
															role,
														},
													}),
												)}
										></note-summary-for-role
									></notes-context>`,
							)}
						</div>
					</div>
				</div>
			</div>
		`;
	}

	clonesChanged() {
		this.s.set(Date.now());
	}

	s = new Signal.State(0);
	notesRoles = new AC(async () => {
		this.s.get();
		const appInfo = await this.client.appInfo();
		return appInfo!.cell_info['note']
			.filter(c => c.type === CellType.Cloned)
			.filter(c => c.value.enabled);
	});

	render() {
		switch (this.notesRoles.status) {
			case 'pending':
				return html`<div
					style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
				>
					<sl-spinner style="font-size: 2rem;"></sl-spinner>
				</div>`;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching the notes')}
					.error=${this.notesRoles.error}
				></display-error>`;
			case 'complete':
				return this.renderList(
					this.notesRoles.value!.map(c => c.value.clone_id!),
				);
		}
	}

	static styles = [
		appStyles,
		css`
			:host {
				display: flex;
			}
		`,
	];
}
// @ts-expect-error This does not exist outside of polyfill which this is doing
if (typeof Promise.withResolvers === 'undefined') {
	if (window)
		// @ts-expect-error This does not exist outside of polyfill which this is doing
		window.Promise.withResolvers = function () {
			let resolve, reject;
			const promise = new Promise((res, rej) => {
				resolve = res;
				reject = rej;
			});
			return { promise, resolve, reject };
		};
}
