import { ActionHash, AgentPubKey, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { mdiInformationOutline } from "@mdi/js";
import { hashProperty, wrapPathInSvg } from "@darksoil-studio/holochain-elements";
import { SignalWatcher } from "@darksoil-studio/holochain-signals";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "@darksoil-studio/holochain-elements/dist/elements/display-error.js";
import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";

import { appStyles } from "../../../app-styles.js";
import "./group-profile-summary.js";
import { groupProfileStoreContext } from "../context.js";
import { GroupProfileStore } from "../group-profile-store.js";

/**
 * @element group-profiles
 */
@localized()
@customElement("group-profiles")
export class GroupProfiles extends SignalWatcher(LitElement) {
  /**
   * @internal
   */
  @consume({ context: groupProfileStoreContext, subscribe: true })
  groupProfileStore!: GroupProfileStore;

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) {
      return html` <div class="column placeholder center-content" style="gap: 8px; flex: 1">
        <sl-icon
          .src=${wrapPathInSvg(mdiInformationOutline)}
          style="font-size: 64px;"
          ></sl-icon
        >
        <span style="text-align: center">${msg("No group profiles found.")}</span>
      </div>`;
    }

    return html`
      <div class="column" style="gap: 8px; flex: 1">
        ${hashes.map(hash => html`<group-profile-summary .groupProfileHash=${hash}></group-profile-summary>`)}
      </div>
    `;
  }

  render() {
    const map = this.groupProfileStore.groupProfiles.get();

    switch (map.status) {
      case "pending":
        return html`<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;">
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the group profiles")}
          .error=${map.error}
        ></display-error>`;
      case "completed":
        return this.renderList(Array.from(map.value.keys()));
    }
  }

  static styles = appStyles;
}
