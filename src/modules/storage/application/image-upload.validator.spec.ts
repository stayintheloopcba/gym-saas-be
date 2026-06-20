import { FileTooLargeError, InvalidFileTypeError, MissingFileError } from '../domain/storage.errors';
import { ImageUploadValidator, MAX_IMAGE_SIZE_BYTES, UploadCandidate } from './image-upload.validator';

const file = (overrides: Partial<UploadCandidate> = {}): UploadCandidate => ({
  mimetype: 'image/png',
  size: 1024,
  buffer: Buffer.from('x'),
  ...overrides,
});

describe('ImageUploadValidator', () => {
  const validator = new ImageUploadValidator();

  it.each(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])('accepts %s within size limit', (mimetype) => {
    expect(() => validator.validate(file({ mimetype }))).not.toThrow();
  });

  it('rejects a missing file', () => {
    expect(() => validator.validate(undefined)).toThrow(MissingFileError);
  });

  it('rejects an unsupported type', () => {
    expect(() => validator.validate(file({ mimetype: 'application/pdf' }))).toThrow(InvalidFileTypeError);
  });

  it('rejects a file over the size limit', () => {
    expect(() => validator.validate(file({ size: MAX_IMAGE_SIZE_BYTES + 1 }))).toThrow(FileTooLargeError);
  });

  it('maps mime types to extensions', () => {
    expect(validator.extensionFor('image/jpeg')).toBe('jpg');
    expect(validator.extensionFor('image/svg+xml')).toBe('svg');
  });
});
