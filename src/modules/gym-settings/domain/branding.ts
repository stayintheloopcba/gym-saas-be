/**
 * Branding configurable de una organización (colores y tipografía).
 *
 * La fuente se valida contra una **whitelist cerrada** para evitar inyección de
 * CSS/URLs arbitrarias; los colores se validan con un regex hex `#RRGGBB`. Estas
 * constantes son la fuente de verdad compartida por el DTO de actualización y la
 * documentación OpenAPI.
 */
export const GYM_FONTS = ['system', 'Inter', 'Roboto', 'Poppins', 'Montserrat', 'Lora'] as const;

export type GymFont = (typeof GYM_FONTS)[number];

/** Color hexadecimal de 6 dígitos, p. ej. `#0F62FE`. */
export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
