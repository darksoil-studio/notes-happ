import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';
import { wrapPathInSvg } from '@tnesh-stack/elements';
import { SignalWatcher } from '@tnesh-stack/signals';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { appStyles } from './app-styles';
import { groupInvitesStoreContext } from './lobby/group-invites/context';
import { GroupInvitesStore } from './lobby/group-invites/group-invites-store';

@localized()
@customElement('group-detail')
export class GroupDetail extends SignalWatcher(LitElement) {
	@property()
	roleName!: string;

	render() {
		return html`
			<file-storage-context .role=${this.roleName}> </file-storage-context>
		`;
	}

	static styles = appStyles;
}
