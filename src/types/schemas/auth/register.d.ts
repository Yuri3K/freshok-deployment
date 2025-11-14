/* AUTO-GENERATED FILE — DO NOT EDIT MANUALLY */
/* Generated from: auth\register.schema.json */

export interface RegisterUserRequest {
  /**
   * User email address
   */
  email: string;
  /**
   * User password (plaintext, to be hashed server-side)
   */
  password: string;
  /**
   * User name or nickname
   */
  displayName: string;
}
