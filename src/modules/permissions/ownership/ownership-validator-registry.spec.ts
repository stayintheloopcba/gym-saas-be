import { OwnershipValidator } from './ownership-validator';
import { OwnershipValidatorRegistry } from './ownership-validator-registry';

const stub = (resourceType: string): OwnershipValidator => ({
  resourceType,
  validate: jest.fn().mockResolvedValue({ found: true, owned: true }),
});

describe('OwnershipValidatorRegistry', () => {
  let registry: OwnershipValidatorRegistry;

  beforeEach(() => {
    registry = new OwnershipValidatorRegistry();
  });

  it('returns the validator registered for a resource type', () => {
    const validator = stub('resource');
    registry.register(validator);

    expect(registry.get('resource')).toBe(validator);
  });

  it('falls back to the default validator for an unregistered type', () => {
    const fallback = stub('*');
    registry.setDefault(fallback);

    expect(registry.get('unknown')).toBe(fallback);
  });

  it('returns undefined when there is neither a specific nor a default validator', () => {
    expect(registry.get('unknown')).toBeUndefined();
  });
});
