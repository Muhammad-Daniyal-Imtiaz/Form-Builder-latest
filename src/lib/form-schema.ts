import { z } from 'zod';

// Define field validation schemas
const BaseFieldSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(['text', 'email', 'number', 'select', 'checkbox', 'radio', 'textarea']),
  label: z.string().min(1).max(200),
  placeholder: z.string().optional(),
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

const SelectFieldSchema = BaseFieldSchema.extend({
  type: z.literal('select'),
  options: z.array(z.string()).min(1).max(100),
});

const CheckboxFieldSchema = BaseFieldSchema.extend({
  type: z.literal('checkbox'),
});

const RadioFieldSchema = BaseFieldSchema.extend({
  type: z.literal('radio'),
  options: z.array(z.string()).min(1).max(100),
});

const TextareaFieldSchema = BaseFieldSchema.extend({
  type: z.literal('textarea'),
  rows: z.number().optional(),
});

const FieldSchema = z.discriminatedUnion('type', [
  TextFieldSchema,
  EmailFieldSchema,
  NumberFieldSchema,
  SelectFieldSchema,
  CheckboxFieldSchema,
  RadioFieldSchema,
  TextareaFieldSchema,
]);

// Main form schema
export const FormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  fields: z.array(FieldSchema).min(1).max(100),
  settings: z.object({
    submitButtonText: z.string().default('Submit'),
    successMessage: z.string().default('Form submitted successfully!'),
    errorMessage: z.string().default('There was an error submitting the form.'),
  }).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type FormType = z.infer<typeof FormSchema>;
export type FieldType = z.infer<typeof FieldSchema>;
