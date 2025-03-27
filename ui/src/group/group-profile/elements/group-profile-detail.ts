import { ActionHash, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { mdiAlertCircleOutline, mdiDelete, mdiPencil } from "@mdi/js";
import { hashProperty, notifyError, wrapPathInSvg } from "@tnesh-stack/elements";
import { SignalWatcher } from "@tnesh-stack/signals";
import { EntryRecord } from "@tnesh-stack/utils";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@darksoil-studio/file-storage-zome/dist/elements/show-image.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@tnesh-stack/elements/dist/elements/display-error.js";

import { appStyles } from "../../../app-styles.js";

import { groupProfileStoreContext } from "../context.js";
import { GroupProfileStore } from "../group-profile-store.js";
import { GroupProfile } from "../types.js";

/**
 * @element group-profile-detail
 * @fires edit-clicked: fired when the user clicks the edit icon button
 * @fires group-profile-deleted: detail will contain { groupProfileHash }
 */
@localized()
@customElement("group-profile-detail")
export class GroupProfileDetail extends SignalWatcher(LitElement) {
  /**
   * REQUIRED. The hash of the GroupProfile to show
   */
  @property(hashProperty("group-profile-hash"))
  groupProfileHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: groupProfileStoreContext, subscribe: true })
  groupProfileStore!: GroupProfileStore;

  async deleteGroupProfile() {
    try {
      await this.groupProfileStore.client.deleteGroupProfile(this.groupProfileHash);

      this.dispatchEvent(
        new CustomEvent("group-profile-deleted", {
          bubbles: true,
          composed: true,
          detail: {
            groupProfileHash: this.groupProfileHash,
          },
        }),
      );
    } catch (e: unknown) {
      console.error(e);
      notifyError(msg("Error deleting the group profile"));
    }
  }

  renderDetail(entryRecord: EntryRecord<GroupProfile>) {
    return html`
      <sl-card style="flex: 1">
        <div class="column" style="gap: 16px; flex: 1;">
          <div class="row" style="gap: 8px">
            <span style="font-size: 18px; flex: 1;">${msg("Group Profile")}</span>

            <sl-icon-button .src=${wrapPathInSvg(mdiPencil)} @click=${() =>
      this.dispatchEvent(
        new CustomEvent("edit-clicked", {
          bubbles: true,
          composed: true,
        }),
      )}></sl-icon-button>
            <sl-icon-button .src=${wrapPathInSvg(mdiDelete)} @click=${() => this.deleteGroupProfile()}></sl-icon-button>
          </div>

  
          <div class="column" style="gap: 8px;">
	        <span><strong>${msg("Name")}</strong></span>
 	        <span style="white-space: pre-line">${entryRecord.entry.name}</span>
	  </div>

          <div class="column" style="gap: 8px;">
	        <span><strong>${msg("Avatar Hash")}</strong></span>
 	        <span style="white-space: pre-line"><show-image .imageHash=${entryRecord.entry.avatar_hash} style="width: 300px; height: 200px"></show-image></span>
	  </div>

      </div>
      </sl-card>
    `;
  }

  render() {
    const groupProfile = this.groupProfileStore.groupProfiles.get(this.groupProfileHash).latestVersion.get();

    switch (groupProfile.status) {
      case "pending":
        return html`<div
          style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the group profile")}
          .error=${groupProfile.error}
        ></display-error>`;
      case "completed":
        return this.renderDetail(groupProfile.value);
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
