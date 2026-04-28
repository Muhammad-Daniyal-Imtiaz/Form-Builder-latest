import { z } from 'zod'

const urlField = z.string().url().max(2048).optional().or(z.literal(''))
const colorField = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional()

export const FieldLogicRuleSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  condition: z.enum(['equals', 'not_equals', 'contains']),
  value: z.string().max(500),
  action: z.enum(['show', 'hide', 'jump_to']),
  targetId: z.string().min(1).max(100),
})

const BaseFieldSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  label: z.string().min(1).max(200),
  placeholder: z.string().max(300).nullable().optional(),
  required: z.boolean().default(false),
  pageIndex: z.number().int().min(0).max(100).default(0).nullable().optional(),
  fileMode: z.enum(['upload', 'link']).optional(),
  logicRules: z.array(FieldLogicRuleSchema).max(25).optional(),
  validation: z
    .object({
      minLength: z.number().int().min(0).max(10000).optional(),
      maxLength: z.number().int().min(1).max(10000).optional(),
      pattern: z.string().max(500).optional(),
      requiredMessage: z.string().max(200).optional(),
    })
    .optional(),
})

const TextFieldSchema = BaseFieldSchema.extend({
  type: z.literal('text'),
})

const EmailFieldSchema = BaseFieldSchema.extend({
  type: z.literal('email'),
})

const NumberFieldSchema = BaseFieldSchema.extend({
  type: z.literal('number'),
})

const TextAreaFieldSchema = BaseFieldSchema.extend({
  type: z.literal('textarea'),
  rows: z.number().int().min(1).max(20).nullable().optional(),
})

const OptionSchema = z.string().min(1).max(200)

const SelectFieldSchema = BaseFieldSchema.extend({
  type: z.literal('select'),
  options: z.array(OptionSchema).min(1).max(100),
})

const MultiSelectFieldSchema = BaseFieldSchema.extend({
  type: z.literal('multiselect'),
  options: z.array(OptionSchema).min(1).max(100),
})

const RadioFieldSchema = BaseFieldSchema.extend({
  type: z.literal('radio'),
  options: z.array(OptionSchema).min(1).max(100),
})

const CheckboxFieldSchema = BaseFieldSchema.extend({
  type: z.literal('checkbox'),
  options: z.array(OptionSchema).min(1).max(100).nullable().optional(),
})

const RatingFieldSchema = BaseFieldSchema.extend({
  type: z.literal('rating'),
})

const FileFieldSchema = BaseFieldSchema.extend({
  type: z.enum(['file', 'multifile']),
})

export const FieldSchema = z.discriminatedUnion('type', [
  TextFieldSchema,
  EmailFieldSchema,
  NumberFieldSchema,
  TextAreaFieldSchema,
  SelectFieldSchema,
  MultiSelectFieldSchema,
  RadioFieldSchema,
  CheckboxFieldSchema,
  RatingFieldSchema,
  FileFieldSchema,
])

export const FieldsPayloadSchema = z.array(FieldSchema).max(200)

export const StylesSchema = z.object({
  accentColor: colorField,
  headerBg: colorField,
  headerText: colorField,
  bodyBg: colorField,
  bodyText: colorField,
  labelColor: colorField,
  inputBg: colorField,
  inputBorderColor: colorField,
  pageBgColor: colorField,
  pageBgImage: urlField,
  pageBgBlur: z.number().int().min(0).max(40).optional(),
  pageBgOverlayOpacity: z.number().int().min(0).max(100).optional(),
  layout: z.enum(['centered', 'split', 'sidebar']).optional(),
  layoutSide: z.enum(['left', 'right']).optional(),
  borderRadius: z.number().int().min(0).max(64).optional(),
  containerWidth: z.number().int().min(320).max(1200).optional(),
  containerPadding: z.number().int().min(0).max(120).optional(),
  fontFamily: z.string().max(100).optional(),
  formScale: z.number().min(0.5).max(1.5).optional(),
  boxShadow: z.string().max(300).optional(),
  fontSizeBase: z.number().min(10).max(24).optional(),
  fieldSpacing: z.number().int().min(8).max(64).optional(),
  labelWeight: z.enum(['normal', 'semibold', 'bold']).optional(),
  fontWeight: z.enum(['normal', 'semibold', 'bold']).optional(),
  buttonText: colorField,
  buttonStyle: z.enum(['rounded', 'pill', 'square']).optional(),
  inputVariant: z.enum(['outline', 'filled', 'underline']).optional(),
  logoHeight: z.number().int().min(16).max(240).optional(),
  logoAlignment: z.enum(['left', 'center', 'right']).optional(),
  logoBorderRadius: z.number().int().min(0).max(64).optional(),
  coverHeight: z.number().int().min(80).max(720).optional(),
  headerAlignment: z.enum(['left', 'center', 'right']).optional(),
  coverImageFit: z.enum(['cover', 'contain', 'fill']).optional(),
  secondaryImageUrl: urlField,
  secondaryImageLink: urlField,
})

export const SettingsSchema = z
  .object({
    submitButtonText: z.string().max(100).optional(),
    thankYouHeadline: z.string().max(200).optional(),
    thankYouMessage: z.string().max(1000).optional(),
    successMessage: z.string().max(200).optional(),
    errorMessage: z.string().max(200).optional(),
    redirectUrl: urlField,
  })
  .optional()

export const FormSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  logo_url: urlField,
  cover_image_url: urlField,
  fields: z.array(FieldSchema).min(1).max(100),
  customStyles: StylesSchema.optional(),
  settings: SettingsSchema,
})

export function normalizeFieldForPersistence(
  field: z.infer<typeof FieldSchema>,
  index: number
) {
  return {
    id: field.id,
    label: field.label.trim(),
    type: field.type,
    required: field.required ?? false,
    options: 'options' in field ? field.options ?? null : null,
    placeholder: field.placeholder?.trim() || null,
    logicRules: field.logicRules ?? [],
    pageIndex: field.pageIndex ?? 0,
    order: index,
  }
}

export type FormType = z.infer<typeof FormSchema>
export type FieldType = z.infer<typeof FieldSchema>
