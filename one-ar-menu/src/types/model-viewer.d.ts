// Tipagem do elemento <model-viewer> para JSX (React 19).
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  'ios-src'?: string;
  poster?: string;
  alt?: string;
  ar?: boolean;
  'ar-modes'?: string;
  'ar-scale'?: 'auto' | 'fixed';
  'ar-placement'?: 'floor' | 'wall';
  'camera-controls'?: boolean;
  'touch-action'?: string;
  'disable-zoom'?: boolean;
  'shadow-intensity'?: string;
  'shadow-softness'?: string;
  exposure?: string;
  'environment-image'?: string;
  'tone-mapping'?: string;
  loading?: 'auto' | 'lazy' | 'eager';
  reveal?: 'auto' | 'manual';
  'interaction-prompt'?: 'auto' | 'none';
  'camera-orbit'?: string;
  'min-camera-orbit'?: string;
  'max-camera-orbit'?: string;
  'field-of-view'?: string;
  'min-field-of-view'?: string;
  'max-field-of-view'?: string;
  'interpolation-decay'?: string;
  'xr-environment'?: boolean;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes;
    }
  }
}
