-- AlterTable
ALTER TABLE "hosts" ADD COLUMN     "failed_logins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_failed_login_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "host_sessions" (
    "id" UUID NOT NULL,
    "host_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "host_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "host_sessions_token_hash_key" ON "host_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "host_sessions_host_id_idx" ON "host_sessions"("host_id");

-- AddForeignKey
ALTER TABLE "host_sessions" ADD CONSTRAINT "host_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "hosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
