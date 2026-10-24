import type { AdminCollection } from './admin-content.service';

/* ------------------------------------------------------------------ */
/* Data models                                                         */
/* ------------------------------------------------------------------ */

/** Fields every historical record has. */
export interface ContentRecordBase {
  name: string;
  imgPath: string;
  details: string[];
  refs: string[];
}

export interface PeriodRecord extends ContentRecordBase {
  date: string;
  description: string;
}

export interface EventRecord extends ContentRecordBase {
  date: string;
  description: string;
}

export interface FigureRecord extends ContentRecordBase {
  birth: string;
  death: string;
  bio: string;
}

export interface PlaceRecord extends ContentRecordBase {
  description: string;
}

export interface CollectionRecordMap {
  periods: PeriodRecord;
  events: EventRecord;
  figures: FigureRecord;
  places: PlaceRecord;
}

/* ------------------------------------------------------------------ */
/* Limits and formats (single place to change them)                    */
/* ------------------------------------------------------------------ */

export const LIMITS = {
  idMin: 1,
  idMax: 60,
  nameMin: 1,
  nameMax: 100,
  dateMax: 60,
  imgPathMax: 500,
  textMax: 3000,
  lineMax: 500,
  maxLines: 30,
  yearMin: 1,
  yearMax: 2100
} as const;

export const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const YEAR_PATTERN = /^\d{1,4}$/;
/** App asset paths such as `assets/images/rizal.jpg` or `/assets/rizal.webp`. */
export const ASSET_PATH_PATTERN = /^\/?assets\/[\w\-./]+\.(jpe?g|png|webp|gif|svg)$/i;
/** Characters that could break out of the CSS `url(...)` the image is placed in. */
const UNSAFE_URL_CHARS = /[\s'"()<>\\]/;
const MARKUP_CHARS = /[<>]/;

export interface ValidationResult {
  valid: boolean;
  /** Plain-language messages that are safe to show to the user. */
  errors: string[];
  /** The same messages grouped by the form field they belong to (keys: id, name, imgPath, ...). */
  fieldErrors: Record<string, string[]>;
}

/* ------------------------------------------------------------------ */
/* Field-level checks                                                  */
/* ------------------------------------------------------------------ */

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function checkImagePath(value: string, add: (message: string) => void): void {
  if (!value) {
    return; // optional
  }
  if (value.length > LIMITS.imgPathMax) {
    add(`Image URL or path must be ${LIMITS.imgPathMax} characters or fewer.`);
    return;
  }
  if (UNSAFE_URL_CHARS.test(value)) {
    add('Image URL or path cannot contain spaces, quotes, brackets, or backslashes.');
    return;
  }
  if (!ASSET_PATH_PATTERN.test(value) && !(isHttpUrl(value) && value.toLowerCase().startsWith('https://'))) {
    add('Image must be an https:// link or an app asset path such as assets/images/photo.jpg.');
  }
}

function checkText(label: string, value: string, add: (message: string) => void, max: number = LIMITS.textMax): void {
  if (value.length > max) {
    add(`${label} must be ${max} characters or fewer.`);
  }
  if (MARKUP_CHARS.test(value)) {
    add(`${label} cannot contain < or > characters.`);
  }
}

function checkLines(label: string, lines: string[], add: (message: string) => void, urlsMustBeValid = false): void {
  if (lines.length > LIMITS.maxLines) {
    add(`${label} can have at most ${LIMITS.maxLines} lines.`);
  }
  if (lines.some(line => line.length > LIMITS.lineMax)) {
    add(`Each line in ${label} must be ${LIMITS.lineMax} characters or fewer.`);
  }
  if (lines.some(line => MARKUP_CHARS.test(line))) {
    add(`${label} cannot contain < or > characters.`);
  }
  if (urlsMustBeValid && lines.some(line => /^https?:/i.test(line) && !isHttpUrl(line))) {
    add(`${label} contains a link that is not a valid web address.`);
  }
}

function checkYear(label: string, value: string, add: (message: string) => void): number | null {
  if (!value) {
    return null; // optional
  }
  if (!YEAR_PATTERN.test(value)) {
    add(`${label} must be a whole year using digits only, for example 1861.`);
    return null;
  }
  const year = Number(value);
  if (year < LIMITS.yearMin || year > LIMITS.yearMax) {
    add(`${label} must be between ${LIMITS.yearMin} and ${LIMITS.yearMax}.`);
    return null;
  }
  return year;
}

/* ------------------------------------------------------------------ */
/* Whole-object validation                                             */
/* ------------------------------------------------------------------ */

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asLines(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((line): line is string => typeof line === 'string').map(line => line.trim()).filter(Boolean)
    : [];
}

/**
 * Checks a whole record (id, each field, and rules that combine fields)
 * before it is saved. Returns every problem found so the admin can fix them in one go.
 */
export function validateAdminRecord(
  collection: AdminCollection,
  id: string,
  value: Record<string, unknown>
): ValidationResult {
  const fieldErrors: Record<string, string[]> = {};
  const on = (field: string) => (message: string): void => {
    if (!fieldErrors[field]) {
      fieldErrors[field] = [];
    }
    fieldErrors[field].push(message);
  };

  // --- ID ---
  const trimmedId = (id ?? '').trim();
  if (trimmedId.length < LIMITS.idMin || trimmedId.length > LIMITS.idMax) {
    on('id')(`Record ID must be ${LIMITS.idMin}-${LIMITS.idMax} characters.`);
  } else if (!ID_PATTERN.test(trimmedId)) {
    on('id')('Record ID can only contain letters, numbers, hyphens, or underscores.');
  }

  // --- Name ---
  const name = asString(value['name']);
  if (name.length < LIMITS.nameMin) {
    on('name')('A name is required.');
  } else if (name.length > LIMITS.nameMax) {
    on('name')(`Name must be ${LIMITS.nameMax} characters or fewer.`);
  } else if (MARKUP_CHARS.test(name)) {
    on('name')('Name cannot contain < or > characters.');
  }

  // --- Shared fields ---
  checkImagePath(asString(value['imgPath']), on('imgPath'));
  const details = asLines(value['details']);
  const refs = asLines(value['refs']);
  checkLines('Details', details, on('details'));
  checkLines('References', refs, on('refs'), true);

  // --- Collection-specific fields and cross-field rules ---
  const mainField = collection === 'figures' ? 'bio' : 'description';
  const mainText = asString(value[mainField]);
  checkText(collection === 'figures' ? 'Biography' : 'Description', mainText, on(mainField));

  if (collection === 'figures') {
    const birth = checkYear('Birth year', asString(value['birth']), on('birth'));
    const death = checkYear('Death year', asString(value['death']), on('death'));
    if (birth !== null && death !== null && death < birth) {
      on('death')('Death year cannot be earlier than the birth year.');
    }
  } else if (collection === 'periods' || collection === 'events') {
    checkText('Date', asString(value['date']), on('date'), LIMITS.dateMax);
  }

  // A record with nothing to show is not useful to readers.
  if (!mainText && details.length === 0) {
    on(mainField)(collection === 'figures'
      ? 'Add a biography or at least one detail line.'
      : 'Add a description or at least one detail line.');
  }

  const errors = Object.keys(fieldErrors).reduce<string[]>((all, key) => all.concat(fieldErrors[key]), []);
  return { valid: errors.length === 0, errors, fieldErrors };
}