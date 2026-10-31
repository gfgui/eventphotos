-- CreateEnum
CREATE TYPE "moderation_mode" AS ENUM ('HIDE_AFTER', 'APPROVE_FIRST');

-- CreateEnum
CREATE TYPE "event_status" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "media_type" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "media_source" AS ENUM ('CAMERA', 'GALLERY');

-- CreateEnum
CREATE TYPE "media_status" AS ENUM ('UPLOADING', 'PROCESSING', 'PENDING_APPROVAL', 'PUBLISHED', 'HIDDEN', 'FAILED');

-- CreateTable
CREATE TABLE "hosts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "hosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_hosts" (
    "event_id" UUID NOT NULL,
    "host_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_hosts_pkey" PRIMARY KEY ("event_id","host_id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMPTZ(3) NOT NULL,
    "cover_key" TEXT,
    "appearance" JSONB NOT NULL DEFAULT '{}',
    "likes_ranking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "uploads_ranking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "moderation_mode" "moderation_mode" NOT NULL DEFAULT 'HIDE_AFTER',
    "status" "event_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "guest_id" UUID NOT NULL,
    "type" "media_type" NOT NULL DEFAULT 'PHOTO',
    "source" "media_source" NOT NULL,
    "original_key" TEXT NOT NULL,
    "display_key" TEXT,
    "thumbnail_key" TEXT,
    "filter" TEXT,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sha256" TEXT,
    "captured_at" TIMESTAMPTZ(3),
    "status" "media_status" NOT NULL DEFAULT 'UPLOADING',
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "media_id" UUID NOT NULL,
    "guest_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("media_id","guest_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hosts_email_key" ON "hosts"("email");

-- CreateIndex
CREATE INDEX "event_hosts_host_id_idx" ON "event_hosts"("host_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "roles_event_id_name_key" ON "roles"("event_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "guests_token_hash_key" ON "guests"("token_hash");

-- CreateIndex
CREATE INDEX "guests_event_id_idx" ON "guests"("event_id");

-- CreateIndex
CREATE INDEX "guests_role_id_idx" ON "guests"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_original_key_key" ON "media"("original_key");

-- CreateIndex
CREATE INDEX "media_event_id_status_like_count_idx" ON "media"("event_id", "status", "like_count" DESC);

-- CreateIndex
CREATE INDEX "media_event_id_status_created_at_idx" ON "media"("event_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "media_guest_id_idx" ON "media"("guest_id");

-- CreateIndex
CREATE INDEX "likes_guest_id_idx" ON "likes"("guest_id");

-- AddForeignKey
ALTER TABLE "event_hosts" ADD CONSTRAINT "event_hosts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_hosts" ADD CONSTRAINT "event_hosts_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "hosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
