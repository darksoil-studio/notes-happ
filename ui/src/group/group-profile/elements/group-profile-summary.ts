import { ActionHash, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { hashProperty } from "@darksoil-studio/holochain-elements";
import { SignalWatcher } from "@darksoil-studio/holochain-signals";
import { EntryRecord } from "@darksoil-studio/holochain-utils";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { localized, msg } from "@lit/localize";

import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";

import "@darksoil-studio/file-storage-zome/dist/elements/show-image.js";
import "@darksoil-studio/holochain-elements/dist/elements/display-error.js";
import { appStyles } from "../../../app-styles.js";
import { groupProfileStoreContext } from "../context.js";
import { GroupProfileStore } from "../group-profile-store.js";
import { GroupProfile } from "../types.js";

/**
 * @element group-profile-summary
 * @fires group-profile-selected: detail will contain { groupProfileHash }
 */
@localized()
@customElement("group-profile-summary")
export class GroupProfileSummary extends SignalWatcher(LitElement) {
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

  renderSummary(entryRecord: EntryRecord<GroupProfile>) {
    return html`
      <div class="column" style="gap: 16px; flex: 1;">

        <div class="column" style="gap: 8px">
          <span><strong>${msg("Name")}</strong></span>
          <span style="white-space: pre-line">${entryRecord.entry.name}</span>
        </div>

        <div class="column" style="gap: 8px">
          <span><strong>${msg("Avatar Hash")}</strong></span>
          <span style="white-space: pre-line"><show-image .imageHash=${entryRecord.entry.avatar_hash} style="width: 300px; height: 200px"></show-image></span>
        </div>

      </div>
    `;
  }

  renderGroupProfile() {
    const groupProfile = this.groupProfileStore.groupProfiles.get(this.groupProfileHash).latestVersion.get();

    switch (groupProfile.status) {
      case "pending":
        return html`<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the group profile")}
          .error=${groupProfile.error}
        ></display-error>`;
      case "completed":
        return this.renderSummary(groupProfile.value);
    }
  }

  render() {
    return html`<sl-card style="flex: 1; cursor: grab;" @click=${() =>
      this.dispatchEvent(
        new CustomEvent("group-profile-selected", {
          composed: true,
          bubbles: true,
          detail: {
            groupProfileHash: this.groupProfileHash,
          },
        }),
      )}>
      ${this.renderGroupProfile()}
    </sl-card>`;
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
