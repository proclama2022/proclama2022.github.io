/**
 * Authentication Components Barrel Export
 *
 * Exports all auth UI components for clean imports.
 *
 * Components:
 * - AuthModal: Full-screen sign-in/sign-up modal
 * - EmailAuthForm: Email/password form with validation
 * - OAuthButtons: Google and Apple OAuth buttons
 *
 * Usage:
 *   import { AuthModal } from '@/components/auth';
 *   import { EmailAuthForm, OAuthButtons } from '@/components/auth';
 *
 * @module components/auth
 */

export { AuthModal } from './AuthModal';
export { EmailAuthForm } from './EmailAuthForm';
export { OAuthButtons } from './OAuthButtons';

// Re-export types for convenience
export type { AuthModalProps } from './AuthModal';
export type { EmailAuthFormProps } from './EmailAuthForm';
export type { OAuthButtonsProps } from './OAuthButtons';
