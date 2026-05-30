import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex, index, real } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(), // Clerk user ID
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("user"),
    avatarUrl: text("avatar_url"),
    phone: text("phone"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
    lastLogin: text("last_login"),
    ...timestamps,
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
    roleIdx: index("users_role_idx").on(t.role),
  })
);

// ─── USER INTEGRATIONS ────────────────────────────────────────────────────────
export const userIntegrations = sqliteTable(
  "user_integrations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    email: text("email"),
    expiresAt: text("expires_at"),
    ...timestamps,
  },
  (t) => ({
    userProviderIdx: uniqueIndex("user_integrations_user_provider_idx").on(t.userId, t.provider),
  })
);

// ─── FORMS ────────────────────────────────────────────────────────────────────
export const forms = sqliteTable(
  "forms",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    published: integer("published", { mode: "boolean" }).notNull().default(false),
    logoUrl: text("logo_url"),
    coverImageUrl: text("cover_image_url"),
    // Google Sheets
    googleSheetId: text("google_sheet_id"),
    googleSheetName: text("google_sheet_name"),
    googleSheetEnabled: integer("google_sheet_enabled", { mode: "boolean" }).notNull().default(false),
    // Zapier
    zapierWebhookUrl: text("zapier_webhook_url"),
    zapierEnabled: integer("zapier_enabled", { mode: "boolean" }).notNull().default(false),
    // Airtable
    airtableApiKey: text("airtable_api_key"),
    airtableBaseId: text("airtable_base_id"),
    airtableTableName: text("airtable_table_name"),
    airtableEnabled: integer("airtable_enabled", { mode: "boolean" }).notNull().default(false),
    // Slack
    slackBotToken: text("slack_bot_token"),
    slackChannelId: text("slack_channel_id"),
    slackChannelName: text("slack_channel_name"),
    slackEnabled: integer("slack_enabled", { mode: "boolean" }).notNull().default(false),
    // Email
    emailEnabled: integer("email_enabled", { mode: "boolean" }).notNull().default(false),
    notificationEmail: text("notification_email"),
    emailAppPassword: text("email_app_password"),
    emailToList: text("email_to_list"),
    emailHost: text("email_host").default("smtp.gmail.com"),
    emailPort: integer("email_port").default(465),
    emailSecure: integer("email_secure", { mode: "boolean" }).notNull().default(true),
    // Notion
    notionApiKey: text("notion_api_key"),
    notionDatabaseId: text("notion_database_id"),
    notionEnabled: integer("notion_enabled", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => ({
    userIdIdx: index("forms_user_id_idx").on(t.userId),
  })
);

// ─── FORM FIELDS ──────────────────────────────────────────────────────────────
export const formFields = sqliteTable(
  "form_fields",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    formId: text("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    type: text("type").notNull(), // text|email|number|textarea|select|multiselect|radio|checkbox|file|multifile|rating
    required: integer("required", { mode: "boolean" }).notNull().default(false),
    options: text("options", { mode: "json" }),
    placeholder: text("placeholder"),
    order: integer("order").notNull().default(0),
    logicRules: text("logic_rules", { mode: "json" }).default("[]"),
    pageIndex: integer("page_index").notNull().default(0),
    ...timestamps,
  },
  (t) => ({
    formIdIdx: index("form_fields_form_id_idx").on(t.formId),
    orderIdx: index("form_fields_order_idx").on(t.formId, t.order),
  })
);

// ─── SUBMISSIONS ──────────────────────────────────────────────────────────────
export const submissions = sqliteTable(
  "submissions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    formId: text("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),
    data: text("data", { mode: "json" }).notNull(),
    submittedAt: text("submitted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    googleSynced: integer("google_synced", { mode: "boolean" }).notNull().default(false),
    zapierSynced: integer("zapier_synced", { mode: "boolean" }).notNull().default(false),
    airtableSynced: integer("airtable_synced", { mode: "boolean" }).notNull().default(false),
    slackSynced: integer("slack_synced", { mode: "boolean" }).notNull().default(false),
    emailSynced: integer("email_synced", { mode: "boolean" }).notNull().default(false),
    notionSynced: integer("notion_synced", { mode: "boolean" }).notNull().default(false),
  },
  (t) => ({
    formIdIdx: index("submissions_form_id_idx").on(t.formId),
    submittedAtIdx: index("submissions_submitted_at_idx").on(t.submittedAt),
  })
);

// ─── FILES ────────────────────────────────────────────────────────────────────
export const files = sqliteTable(
  "files",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    submissionId: text("submission_id").references(() => submissions.id, { onDelete: "cascade" }),
    fieldId: text("field_id").references(() => formFields.id, { onDelete: "set null" }),
    filePath: text("file_path").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    fileContent: text("file_content"),
    uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    submissionIdIdx: index("files_submission_id_idx").on(t.submissionId),
  })
);

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type Form = typeof forms.$inferSelect;
export type FormField = typeof formFields.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type File = typeof files.$inferSelect;
export type UserIntegration = typeof userIntegrations.$inferSelect;
