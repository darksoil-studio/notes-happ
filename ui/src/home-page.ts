import '@darksoil-studio/profiles-provider/dist/elements/profile-list-item.js';
import { AppClient } from '@holochain/client';
import { consume } from '@lit/context';
import { msg } from '@lit/localize';
import { mdiInformationOutline, mdiPlus } from '@mdi/js';
import {
	Router,
	Routes,
	appClientContext,
	sharedStyles,
	wrapPathInSvg,
} from '@tnesh-stack/elements';
import '@tnesh-stack/elements/dist/elements/display-error.js';
import { AsyncResult, SignalWatcher } from '@tnesh-stack/signals';
import { EntryRecord } from '@tnesh-stack/utils';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { appStyles } from './app-styles.js';
import './group-detail.js';
import './group-list.js';
import './my-contacts.js';

@customElement('home-page')
export class HomePage extends SignalWatcher(LitElement) {
	@consume({ context: appClientContext })
	client!: AppClient;

	routes = new Routes(this, [
		{
			path: '',
			render: () => html`
				<div
					class="column placeholder center-content"
					style="gap: 8px; flex: 1"
				>
					<sl-icon
						.src=${wrapPathInSvg(mdiInformationOutline)}
						style="font-size: 64px;"
					></sl-icon>
					<span style="text-align: center">${msg('Select a group.')}</span>
				</div>
			`,
		},
		{
			path: 'group/:networkSeed/*',
			render: params => html`
				<group-detail
					.networkSeed=${params.networkSeed}
					style="flex: 1"
					@leave-group=${() => this.routes.goto('')}
				>
				</group-detail>
			`,
		},
		{
			path: 'contacts',
			render: params => html` <my-contacts style="flex: 1"> </my-contacts> `,
		},
	]);

	renderContent() {
		return html`
			<div class="row" style="flex: 1; margin: 16px; gap: 16px">
				<div class="column" style="flex-basis: 200px; gap: 16px">
					<div class="row">
						<sl-button
							circle
							@click=${() =>
								this.dispatchEvent(
									new CustomEvent('create-group-clicked', {
										bubbles: true,
										composed: true,
									}),
								)}
						>
							<sl-icon .src=${wrapPathInSvg(mdiPlus)}></sl-icon>
						</sl-button>
					</div>
					<group-list
						@group-selected=${(e: CustomEvent) =>
							this.routes.goto(`group/${e.detail.roleName}/`)}
					>
					</group-list>

					<sl-button
						variant="primary"
						@click=${() => this.routes.goto('contacts')}
						>${msg('Contacts')}
					</sl-button>
				</div>

				${this.routes.outlet()}
			</div>
		`;
	}

	render() {
		return html`
			<div class="column" style="flex: 1">
				<div class="row top-bar">
					<span class="title" style="flex: 1">${msg('Notes')}</span>

					<div class="row" style="gap: 16px">
						<profile-list-item
							@click=${() =>
								this.dispatchEvent(
									new CustomEvent('profile-clicked', {
										detail: true,
										composed: true,
									}),
								)}
							.agentPubKey=${this.client.myPubKey}
						></profile-list-item>
					</div>
				</div>

				${this.renderContent()}
			</div>
		`;
	}

	static styles = [
		css`
			:host {
				display: flex;
				flex: 1;
			}
		`,
		...appStyles,
		sharedStyles,
	];
}
