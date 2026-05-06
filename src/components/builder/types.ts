export type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'file' | 'multifile' | 'rating';


export interface FieldLogicRule {
  id: string;
  condition: 'equals' | 'not_equals' | 'contains';
  value: string;
  action: 'show' | 'hide' | 'jump_to';
  targetId: string;
}

export interface FormField {
  id: string; // Crucial for dnd-kit. Generate via crypto.randomUUID() or a simple counter.
  label: string;
  type: FieldType;
  required: boolean;
  options: string[] | null;
  placeholder: string | null;
  fileMode?: 'upload' | 'link';
  logicRules?: FieldLogicRule[];
  pageIndex: number;
  fieldBg?: string;        // per-field background color override
  fieldTextColor?: string; // per-field text/label color override
}

export interface CustomStyles {
  headerBg: string;
  headerText: string;
  bodyBg: string;
  bodyText: string;
  accentColor: string;
  buttonText: string;
  fontFamily: string;
  inputBorderColor: string;
  inputBg: string;
  labelColor: string;
  containerWidth: number;
  containerPadding: number;
  borderRadius: number;
  boxShadow: string;
  fontSizeBase: number;
  fieldSpacing: number;
  labelWeight: 'normal' | 'semibold' | 'bold';
  fontWeight: 'normal' | 'semibold' | 'bold';
  buttonStyle: 'rounded' | 'pill' | 'square';
  inputVariant: 'outline' | 'filled' | 'underline';
  logoHeight: number;
  logoAlignment: 'left' | 'center' | 'right';
  logoBorderRadius: number;
  coverHeight: number;
  pageBgColor: string;
  pageBgImage: string;
  pageBgBlur: number;
  pageBgOverlayOpacity: number;
  formScale: number;
  headerAlignment: 'left' | 'center' | 'right';
  coverImageFit: 'cover' | 'contain' | 'fill';
  layout: 'centered' | 'split' | 'sidebar';
  layoutSide: 'left' | 'right';
  secondaryImageUrl: string;
  secondaryImageLink: string;
}

export interface FormSettings {
  submitButtonText: string;
  thankYouHeadline: string;
  thankYouMessage: string;
  redirectUrl: string;
  integrations?: {
    googleSheets?: {
      connected: boolean;
      spreadsheetId?: string;
      spreadsheetUrl?: string;
      sheetName?: string;
    };
  };
}

export const DEFAULT_SETTINGS: FormSettings = {
  submitButtonText: 'Submit Form',
  thankYouHeadline: 'Thank You!',
  thankYouMessage: 'Your response has been successfully submitted.',
  redirectUrl: '',
}

export const AVAILABLE_FONTS = [
  'Inter',
  'Roboto',
  'Playfair Display',
  'Outfit',
  'Space Grotesk',
  'DM Sans',
  'Plus Jakarta Sans',
  'Inconsolata'
]

export const DEFAULT_STYLES: CustomStyles = {
  headerBg: '#1e1b4b',
  headerText: '#f8fafc',
  bodyBg: '#ffffff',
  bodyText: '#111827',
  accentColor: '#6366f1',
  buttonText: '#ffffff',
  fontFamily: 'Plus Jakarta Sans',
  inputBorderColor: '#e5e7eb',
  inputBg: '#ffffff',
  labelColor: '#374151',
  containerWidth: 640,
  containerPadding: 40,
  borderRadius: 16,
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  fontSizeBase: 16,
  fieldSpacing: 32,
  labelWeight: 'bold',
  fontWeight: 'normal',
  buttonStyle: 'rounded',
  inputVariant: 'outline',
  logoHeight: 48,
  logoAlignment: 'left',
  logoBorderRadius: 8,
  coverHeight: 240,
  pageBgColor: '#f8fafc',
  pageBgImage: '',
  pageBgBlur: 0,
  pageBgOverlayOpacity: 0,
  formScale: 1,
  headerAlignment: 'left',
  coverImageFit: 'cover',
  layout: 'centered',
  layoutSide: 'left',
  secondaryImageUrl: '',
  secondaryImageLink: '',
};

export const PRESET_THEMES: Record<string, Partial<CustomStyles>> = {
  'midnight-galaxy': {
    ...DEFAULT_STYLES,
    pageBgColor: '#020617',
    bodyBg: '#0f172a',
    headerBg: '#1e1b4b',
    headerText: '#f8fafc',
    bodyText: '#f8fafc',
    labelColor: '#e2e8f0',
    inputBg: '#1e293b',
    inputBorderColor: '#334155',
    accentColor: '#6366f1',
    fontFamily: 'Plus Jakarta Sans',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
  },
  'serene-oasis': {
    ...DEFAULT_STYLES,
    pageBgColor: '#f0fdfa',
    bodyBg: '#ffffff',
    headerBg: '#134e4a',
    headerText: '#f0fdfa',
    bodyText: '#111827',
    labelColor: '#374151',
    inputBg: '#f9fafb',
    inputBorderColor: '#e5e7eb',
    accentColor: '#0d9488',
    fontFamily: 'Outfit',
    boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.1)',
    borderRadius: 24,
  },
  'vibrant-brutalist': {
    ...DEFAULT_STYLES,
    pageBgColor: '#ffffff',
    bodyBg: '#ffffff',
    headerBg: '#000000',
    headerText: '#ffffff',
    bodyText: '#000000',
    labelColor: '#000000',
    inputBg: '#ffffff',
    inputBorderColor: '#000000',
    accentColor: '#2563eb',
    fontFamily: 'Space Grotesk',
    boxShadow: '8px 8px 0px 0px #000000',
    borderRadius: 0,
    fontWeight: 'bold',
    labelWeight: 'bold',
  },
};

