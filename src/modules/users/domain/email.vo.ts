/**
 * Value object de email.
 *
 * Garantiza una única forma canónica (lowercase + trim) para persistir y
 * comparar. Toda creación/búsqueda de usuario normaliza el email a través de
 * `Email.normalize()` para evitar duplicados por diferencias de capitalización
 * o espacios.
 */
export class Email {
  private constructor(public readonly value: string) {}

  /** Normaliza un string de email: recorta espacios y lo pasa a minúsculas. */
  static normalize(raw: string): string {
    return raw.trim().toLowerCase();
  }

  static create(raw: string): Email {
    return new Email(Email.normalize(raw));
  }

  toString(): string {
    return this.value;
  }
}
