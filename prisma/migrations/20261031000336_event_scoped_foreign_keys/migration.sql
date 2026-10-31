-- DropForeignKey
ALTER TABLE "guests" DROP CONSTRAINT "guests_role_id_fkey";

-- DropForeignKey
ALTER TABLE "media" DROP CONSTRAINT "media_guest_id_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "guests_id_event_id_key" ON "guests"("id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_id_event_id_key" ON "roles"("id", "event_id");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_role_id_event_id_fkey" FOREIGN KEY ("role_id", "event_id") REFERENCES "roles"("id", "event_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_guest_id_event_id_fkey" FOREIGN KEY ("guest_id", "event_id") REFERENCES "guests"("id", "event_id") ON DELETE CASCADE ON UPDATE CASCADE;
