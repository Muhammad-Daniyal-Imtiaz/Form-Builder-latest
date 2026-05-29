import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(), // Clerk user ID
    email: text("email").notNull(),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
    lastLogin: text("last_login"),
    role: text("role").notNull().default("user"),
    ...timestamps,
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  })
);

export const forms = sqliteTable(
  "forms",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    published: integer("published", { mode: "boolean" }).notNull().default(false),
    theme: text("theme", { mode: "json" }),
    fields: text("fields", { mode: "json" }).notNull().default("[]"),
    settings: text("settings", { mode: "json" }),
    visits: integer("visits").notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    userIdIdx: index("forms_user_id_idx").on(table.userId),
  })
);

export const submissions = sqliteTable(
  "submissions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    formId: text("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),
    data: text("data", { mode: "json" }).notNull(),
    submittedAt: text("submitted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    formIdIdx: index("submissions_form_id_idx").on(table.formId),
  })
);

export const files = sqliteTable(
  "files",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    submissionId: text("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    ...timestamps,
  },
  (table) => ({
    submissionIdIdx: index("files_submission_id_idx").on(table.submissionId),
  })
);
