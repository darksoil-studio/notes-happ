import { ActionHash, AgentPubKey, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { mdiAlertCircleOutline, mdiDelete } from "@mdi/js";
import { hashProperty, hashState, notifyError, onSubmit, wrapPathInSvg } from "@darksoil-studio/holochain-elements";
import { SignalWatcher, toPromise } from "@darksoil-studio/holochain-signals";
import { EntryRecord } from "@darksoil-studio/holochain-utils";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import "@darksoil-studio/file-storage-zome/dist/elements/upload-files.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.js";

import { appStyles } from "../../../app-styles.js";
import { groupProfileStoreContext } from "../context.js";
import { GroupProfileStore } from "../group-profile-store.js";
import { GroupProfile } from "../types.js";

/**
 * @element edit-group-profile
 * @fires group-profile-updated: detail will contain { originalGroupProfileHash, previousGroupProfileHash, updatedGroupProfileHash }
 */
@localized()
@customElement("edit-group-profile")
export class EditGroupProfile extends SignalWatcher(LitElement) {
  /**
   * REQUIRED. The hash of the original `Create` action for this GroupProfile
   */
  @property(hashProperty("group-profile-hash"))
  groupProfileHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: groupProfileStoreContext })
  groupProfileStore!: GroupProfileStore;

  /**
   * @internal
   */
  @state()
  committing = false;

  async firstUpdated() {
    const currentRecord = await toPromise(
      this.groupProfileStore.groupProfiles.get(this.groupProfileHash).latestVersion,
    );
    setTimeout(() => {
      (this.shadowRoot?.getElementById("form") as HTMLFormElement).reset();
    });
  }

  async updateGroupProfile(currentRecord: EntryRecord<GroupProfile>, fields: Partial<GroupProfile>) {
    const groupProfile: GroupProfile = {
      name: fields.name!,
      avatar_hash: fields.avatar_hash!,
    };

    try {
      this.committing = true;
      const updateRecord = await this.groupProfileStore.client.updateGroupProfile(
        this.groupProfileHash,
        currentRecord.actionHash,
        groupProfile,
      );

      this.dispatchEvent(
        new CustomEvent("group-profile-updated", {
          composed: true,
          bubbles: true,
          detail: {
            originalGroupProfileHash: this.groupProfileHash,
            previousGroupProfileHash: currentRecord.actionHash,
            updatedGroupProfileHash: updateRecord.actionHash,
          },
        }),
      );
    } catch (e: unknown) {
      console.error(e);
      notifyError(msg("Error updating the group profile"));
    }

    this.committing = false;
  }

  renderEditForm(currentRecord: EntryRecord<GroupProfile>) {
    return html`
      <sl-card>
        <form
          id="form"
          class="column"
          style="flex: 1; gap: 16px;"
          ${onSubmit(fields => this.updateGroupProfile(currentRecord, fields))}
        >  
          <span class="title">${msg("Edit Group Profile")}</span>
        <sl-input name="name" .label=${msg("Name")}  required .defaultValue=${currentRecord.entry.name}></sl-input>
        <upload-files name="avatar_hash" one-file accepted-files="image/jpeg,image/png,image/gif" required .defaultValue=${currentRecord.entry.avatar_hash}></upload-files>

          <sl-button
            type="submit"
            variant="primary"
            .loading=${this.committing}
          >${msg("Save")}</sl-button>
        </form>
      </sl-card>`;
  }

  render() {
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
        return this.renderEditForm(groupProfile.value);
    }
  }

  static styles = appStyles;
}
