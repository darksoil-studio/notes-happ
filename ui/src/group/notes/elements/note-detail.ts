import { ActionHash, EntryHash, Record } from "@holochain/client";
import { consume } from "@lit/context";
import { localized, msg } from "@lit/localize";
import { mdiAlertCircleOutline, mdiDelete, mdiPencil } from "@mdi/js";
import { hashProperty, notifyError, wrapPathInSvg } from "@tnesh-stack/elements";
import { SignalWatcher } from "@tnesh-stack/signals";
import { EntryRecord } from "@tnesh-stack/utils";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "@darksoil-studio/file-storage-zome/dist/elements/show-image.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@tnesh-stack/elements/dist/elements/display-error.js";
import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";

import { appStyles } from "../../../app-styles.js";

import { notesStoreContext } from "../context.js";
import { NotesStore } from "../notes-store.js";
import { Note } from "../types.js";

/**
 * @element note-detail
 * @fires edit-clicked: fired when the user clicks the edit icon button
 * @fires note-deleted: detail will contain { noteHash }
 */
@localized()
@customElement("note-detail")
export class NoteDetail extends SignalWatcher(LitElement) {
  /**
   * REQUIRED. The hash of the Note to show
   */
  @property(hashProperty("note-hash"))
  noteHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: notesStoreContext, subscribe: true })
  notesStore!: NotesStore;

  async deleteNote() {
    try {
      await this.notesStore.client.deleteNote(this.noteHash);

      this.dispatchEvent(
        new CustomEvent("note-deleted", {
          bubbles: true,
          composed: true,
          detail: {
            noteHash: this.noteHash,
          },
        }),
      );
    } catch (e: unknown) {
      console.error(e);
      notifyError(msg("Error deleting the note"));
    }
  }

  renderDetail(entryRecord: EntryRecord<Note>) {
    return html`
      <sl-card style="flex: 1">
        <div class="column" style="gap: 16px; flex: 1;">
          <div class="row" style="gap: 8px">
            <span style="font-size: 18px; flex: 1;">${msg("Note")}</span>

            <sl-icon-button .src=${wrapPathInSvg(mdiPencil)} @click=${() =>
      this.dispatchEvent(
        new CustomEvent("edit-clicked", {
          bubbles: true,
          composed: true,
        }),
      )}></sl-icon-button>
            <sl-icon-button .src=${wrapPathInSvg(mdiDelete)} @click=${() => this.deleteNote()}></sl-icon-button>
          </div>

  
          <div class="column" style="gap: 8px;">
	        <span><strong>${msg("Title")}</strong></span>
 	        <span style="white-space: pre-line">${entryRecord.entry.title}</span>
	  </div>

          <div class="column" style="gap: 8px;">
	        <span><strong>${msg("Content")}</strong></span>
 	        <span style="white-space: pre-line">${entryRecord.entry.content}</span>
	  </div>

          <div class="column" style="gap: 8px;">
	        <span><strong>${msg("Image Hash")}</strong></span>
 	        <span style="white-space: pre-line"><show-image .imageHash=${entryRecord.entry.image_hash} style="width: 300px; height: 200px"></show-image></span>
	  </div>

      </div>
      </sl-card>
    `;
  }

  render() {
    const note = this.notesStore.notes.get(this.noteHash).latestVersion.get();

    switch (note.status) {
      case "pending":
        return html`<div
          style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the note")}
          .error=${note.error}
        ></display-error>`;
      case "completed":
        return this.renderDetail(note.value);
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
