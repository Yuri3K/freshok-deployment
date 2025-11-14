/* AUTO-GENERATED FILE — DO NOT EDIT MANUALLY */
/* Generated from: auth\login.schema.json */

export interface LoginRequest {
  /**
   * User email address
   */
  email: string;
  /**
   * User password (plaintext, to be hashed server-side)
   */
  password: string;
}
