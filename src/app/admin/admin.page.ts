import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AlertController, IonicModule } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { AdminCollection, AdminContentService, AdminRecord } from './admin-content.service';
import { validateAdminRecord } from './admin-record.model';
import { toFriendlyMessage } from '../shared/friendly-error';

interface AdminField {
  key: string;
  label: string;
  multiline?: boolean;
  lineList?: boolean;
}

const COLLECTION_FIELDS: Record<AdminCollection, AdminField[]> = {
  periods: [
    { key: 'name', label: 'Name' },
    { key: 'date', label: 'Date range' },
    { key: 'imgPath', label: 'Image URL or asset path' },
    { key: 'description', label: 'Description', multiline: true },
    { key: 'details', label: 'Details (one per line)', multiline: true, lineList: true },
    { key: 'refs', label: 'References (one per line)', multiline: true, lineList: true }
  ],
  events: [
    { key: 'name', label: 'Name' },
    { key: 'date', label: 'Date' },
    { key: 'imgPath', label: 'Image URL or asset path' },
    { key: 'description', label: 'Description', multiline: true },
    { key: 'details', label: 'Details (one per line)', multiline: true, lineList: true },
    { key: 'refs', label: 'References (one per line)', multiline: true, lineList: true }
  ],
  figures: [
    { key: 'name', label: 'Name' },
    { key: 'birth', label: 'Birth year' },
    { key: 'death', label: 'Death year' },
    { key: 'imgPath', label: 'Image URL or asset path' },
    { key: 'bio', label: 'Biography', multiline: true },
    { key: 'details', label: 'Details (one per line)', multiline: true, lineList: true },
    { key: 'refs', label: 'References (one per line)', multiline: true, lineList: true }
  ],
  places: [
    { key: 'name', label: 'Name' },
    { key: 'imgPath', label: 'Image URL or asset path' },
    { key: 'description', label: 'Description', multiline: true },
    { key: 'details', label: 'Details (one per line)', multiline: true, lineList: true },
    { key: 'refs', label: 'References (one per line)', multiline: true, lineList: true }
  ]
};

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterLink]
})
export class AdminPage implements OnInit {
  private auth = inject(AngularFireAuth);
  private content = inject(AdminContentService);
  private alertController = inject(AlertController);
  private router = inject(Router);

  readonly collections: { key: AdminCollection; label: string }[] = [
    { key: 'periods', label: 'Periods' },
    { key: 'events', label: 'Events' },
    { key: 'figures', label: 'Figures' },
    { key: 'places', label: 'Places' }
  ];

  collection: AdminCollection = 'events';
  records: AdminRecord[] = [];
  fields = COLLECTION_FIELDS.events;
  form: Record<string, string> = {};
  editingRecord: AdminRecord | null = null;
  currentUserEmail = '';
  authUid = '';
  errorMessage = '';
  /** Validation messages grouped by form field, shown under the field they belong to. */
  fieldErrors: Record<string, string[]> = {};
  adminCheckError = '';
  isAuthenticated = false;
  isAdmin = false;
  checkingAccess = true;
  loadingRecords = false;
  saving = false;

  ngOnInit(): void {
    this.auth.authState.pipe(take(1)).subscribe({
      next: user => {
        this.checkingAccess = false;
        this.isAuthenticated = !!user;
        this.currentUserEmail = user?.email ?? '';
        this.authUid = user?.uid ?? '';
        if (user && !user.isAnonymous) {
          void this.verifyAdmin(user.uid);
        }
      },
      error: error => {
        this.checkingAccess = false;
        this.showError('Could not check the signed-in user', error);
      }
    });
  }

  async selectCollection(collection: AdminCollection): Promise<void> {
    this.collection = collection;
    this.fields = COLLECTION_FIELDS[collection];
    this.editingRecord = null;
    this.form = {};
    this.fieldErrors = {};
    await this.loadRecords();
  }

  clearFieldError(key: string): void {
    if (this.fieldErrors[key]) {
      const { [key]: _removed, ...rest } = this.fieldErrors;
      this.fieldErrors = rest;
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
      await this.auth.signInAnonymously();
      await this.router.navigateByUrl('/tabs');
    } catch (error) {
      this.showError('Could not sign out', error);
    }
  }

  startNewRecord(): void {
    this.fieldErrors = {};
    this.errorMessage = '';
    this.editingRecord = null;
    this.form = { id: '' };
    for (const field of this.fields) {
      this.form[field.key] = '';
    }
  }

  editRecord(record: AdminRecord): void {
    this.fieldErrors = {};
    this.errorMessage = '';
    this.editingRecord = record;
    this.form = { id: record.id };
    for (const field of this.fields) {
      const value = field.key === 'refs'
        ? record['refs'] ?? record['references']
        : field.key === 'details'
          ? record['details'] ?? record['facts']
          : record[field.key];
      this.form[field.key] = this.asText(value);
    }
  }

  async saveRecord(): Promise<void> {
    const id = (this.form['id'] ?? '').trim();

    const value: Record<string, unknown> = { ...(this.editingRecord ?? {}) };
    delete value['id'];
    for (const field of this.fields) {
      const rawValue = (this.form[field.key] ?? '').trim();
      value[field.key] = field.lineList
        ? rawValue.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
        : rawValue;
    }

    // Check the whole record (limits, formats, field combinations) before saving.
    const result = validateAdminRecord(this.collection, id, value);
    const fieldErrors = { ...result.fieldErrors };
    if (!fieldErrors['id'] && this.records.some(record => record.id === id && record.id !== this.editingRecord?.id)) {
      fieldErrors['id'] = [`A record with ID "${id}" already exists in ${this.collection}.`];
    }
    this.fieldErrors = fieldErrors;
    this.errorMessage = '';
    if (Object.keys(fieldErrors).length > 0) {
      this.focusFirstInvalidField();
      return;
    }

    this.saving = true;
    try {
      await this.content.saveRecord(this.collection, id, value);
      this.editingRecord = null;
      this.form = {};
      await this.loadRecords();
    } catch (error) {
      this.showError('Could not save the record', error);
    } finally {
      this.saving = false;
    }
  }

  async confirmDelete(record: AdminRecord): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete record?',
      message: `This permanently deletes "${String(record['name'] ?? record.id)}" from ${this.collection}.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            void this.deleteRecord(record);
          }
        }
      ]
    });
    await alert.present();
  }

  private focusFirstInvalidField(): void {
    setTimeout(() => {
      const target = document.querySelector('.editor-panel .field.has-error input, .editor-panel .field.has-error textarea');
      (target as HTMLElement | null)?.focus();
    });
  }

  private async deleteRecord(record: AdminRecord): Promise<void> {
    this.errorMessage = '';
    try {
      await this.content.deleteRecord(this.collection, record.id);
      if (this.editingRecord?.id === record.id) {
        this.editingRecord = null;
        this.form = {};
      }
      await this.loadRecords();
    } catch (error) {
      this.showError('Could not delete the record', error);
    }
  }

  private async verifyAdmin(uid: string): Promise<void> {
    this.checkingAccess = true;
    this.errorMessage = '';
    try {
      this.isAdmin = await this.content.isAdmin(uid);
      this.isAuthenticated = true;
      if (this.isAdmin) {
        await this.loadRecords();
      }
    } catch (error) {
      this.isAdmin = false;
      this.isAuthenticated = true;
      this.adminCheckError = toFriendlyMessage(error, 'We could not verify your administrator access right now.');
      this.showError('Could not verify administrator access', error);
    } finally {
      this.checkingAccess = false;
    }
  }

  private async loadRecords(): Promise<void> {
    this.loadingRecords = true;
    try {
      this.records = await this.content.getRecords(this.collection);
    } catch (error) {
      this.records = [];
      this.showError(`Could not load ${this.collection}`, error);
    } finally {
      this.loadingRecords = false;
    }
  }

  private asText(value: unknown): string {
    if (Array.isArray(value)) {
      return value.filter(item => item != null).map(String).join('\n');
    }
    if (value && typeof value === 'object') {
      return Object.values(value).filter(item => item != null).map(String).join('\n');
    }
    return value == null ? '' : String(value);
  }

  private showError(action: string, error: unknown): void {
    // Users get a plain message; the technical detail goes to the console only.
    this.errorMessage = `${action}. ${toFriendlyMessage(error)}`;
    console.error(action, error);
  }
}