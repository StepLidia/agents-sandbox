const APP_STORAGE_PREFIX = 'growly-';

type LocalStorageBackupItem = {
  key: string;
  value: string;
};

export type LocalStorageBackup = {
  app: 'growly-agent';
  exportedAt: string;
  items: LocalStorageBackupItem[];
  storagePrefix: typeof APP_STORAGE_PREFIX;
  version: 1;
};

export function createLocalStorageBackup(storage: Storage, exportedAt = new Date()): LocalStorageBackup {
  const items = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    .filter((key): key is string => Boolean(key?.startsWith(APP_STORAGE_PREFIX)))
    .sort()
    .map((key) => ({
      key,
      value: storage.getItem(key) ?? '',
    }));

  return {
    app: 'growly-agent',
    exportedAt: exportedAt.toISOString(),
    items,
    storagePrefix: APP_STORAGE_PREFIX,
    version: 1,
  };
}

export function downloadLocalStorageBackup(storage: Storage) {
  const backup = createLocalStorageBackup(storage);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `growly-backup-${formatBackupDate(new Date(backup.exportedAt))}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function importLocalStorageBackup(storage: Storage, backupJson: string) {
  const backup = parseLocalStorageBackup(backupJson);
  const currentAppKeys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
    (key): key is string => Boolean(key?.startsWith(APP_STORAGE_PREFIX)),
  );

  currentAppKeys.forEach((key) => storage.removeItem(key));
  backup.items.forEach(({ key, value }) => storage.setItem(key, value));

  return backup.items.length;
}

function parseLocalStorageBackup(backupJson: string): LocalStorageBackup {
  const parsedBackup: unknown = JSON.parse(backupJson);

  if (!isLocalStorageBackup(parsedBackup)) {
    throw new Error('Invalid Growly backup file.');
  }

  return parsedBackup;
}

function isLocalStorageBackup(value: unknown): value is LocalStorageBackup {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const backup = value as Partial<LocalStorageBackup>;

  return (
    backup.app === 'growly-agent' &&
    backup.version === 1 &&
    backup.storagePrefix === APP_STORAGE_PREFIX &&
    Array.isArray(backup.items) &&
    backup.items.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.key === 'string' &&
        item.key.startsWith(APP_STORAGE_PREFIX) &&
        typeof item.value === 'string',
    )
  );
}

function formatBackupDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
