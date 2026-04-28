import { z } from 'zod';

// Define field validation schemas
const BaseFieldSchema = z.object({
  id: z.string().min(1).max(100).optional(), // Optional as it might be generated server-side
  label: z.string().min(1).max(200),
  placeholder: z.string().max(300).optional(),
  required: z.boolean().default(false),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    requiredMessage: z.string().optional(),
  }).optional(),
});

const TextFieldSchema = BaseFieldSchema.extend({
  type: z.literal('text'),
});

const EmailFieldSchema = BaseFieldSchema.extend({
  type: z.literal('email'),
});

const NumberFieldSchema = BaseFieldSchema.extend({
  type: z.literal('number'),
});

const TextAreaFieldSchema = BaseFieldSchema.extend({
  type: z.literal('textarea'),
  rows: z.number().min(1).max(20).optional(),
});

const OptionSchema = z.string().min(1).max(200);

const SelectionFieldSchema = BaseFieldSchema.extend({
  type: z.enum(['select', 'multiselect', 'radio']),
  options: z.array(OptionSchema).min(1).max(50),
});

const CheckboxFieldSchema = BaseFieldSchema.extend({
  type: z.literal('checkbox'),
});

const RatingFieldSchema = BaseFieldSchema.extend({
  type: z.literal('rating'),
});

const FileFieldSchema = BaseFieldSchema.extend({
  type: z.enum(['file', 'multifile']),
});

const FieldSchema = z.discriminatedUnion('type', [
  TextFieldSchema,
  EmailFieldSchema,
  NumberFieldSchema,
  TextAreaFieldSchema,
  SelectionFieldSchema.extend({ type: z.literal('select') }),
  SelectionFieldSchema.extend({ type: z.literal('multiselect') }),
  SelectionFieldSchema.extend({ type: z.literal('radio') }),
  CheckboxFieldSchema,
  RatingFieldSchema,
  FileFieldSchema.extend({ type: z.literal('file') }),
  FileFieldSchema.extend({ type: z.literal('multifile') }),
]);

// Style validation
const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional();
const urlField = z.string().url().max(2048).optional().or(z.literal(''));

export const StylesSchema = z.object({
  accentColor: hexColor,
  headerBg: hexColor,
  headerText: hexColor,
  bodyBg: hexColor,
  bodyText: hexColor,
  labelColor: hexColor,
  inputBg: hexColor,
  inputBorderColor: hexColor,
  pageBgColor: hexColor,
  pageBgImage: urlField,
  pageBgBlur: z.number().int().min(0).max(40).optional(),
  pageBgOverlayOpacity: z.number().int().min(0).max(100).optional(),
  layout: z.enum(['centered', 'split', 'sidebar']).optional(),
  layoutSide: z.enum(['left', 'right']).optional(),
  borderRadius: z.number().int().min(0).max(64).optional(),
  containerWidth: z.number().int().min(320).max(1200).optional(),
  fontFamily: z.string().optional(),
  formScale: z.number().min(0.5).max(1.5).optional(),
});

// Settings validation
export const SettingsSchema = z.object({
  submitButtonText: z.string().max(100).optional(),
  thankYouHeadline: z.string().max(200).optional(),
  thankYouMessage: z.string().max(1000).optional(),
  successMessage: z.string().max(200).optional(),
  errorMessage: z.string().max(200).optional(),
}).optional();

// Main form schema
export const FormSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  logo_url: urlField,
  cover_image_url: urlField,
  fields: z.array(FieldSchema).min(1).max(100),
  customStyles: StylesSchema.optional(),
  settings: SettingsSchema,
});

export type FormType = z.infer<typeof FormSchema>;
export type FieldType = z.infer<typeof FieldSchema>;
