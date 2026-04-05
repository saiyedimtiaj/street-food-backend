-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "profile_photo" TEXT,
    "profile_photo_public_id" TEXT,
    "bio" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "address" TEXT,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "cover_image" TEXT,
    "cover_image_public_id" TEXT,
    "status" VARCHAR(20) DEFAULT 'active',
    "is_claimed" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_gallery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "image_url" TEXT,
    "is_available" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_replies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "reply_text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_suggestions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "suggested_by" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "status" VARCHAR(20) DEFAULT 'pending',
    "admin_note" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_claims" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID NOT NULL,
    "claimed_by" UUID NOT NULL,
    "message" TEXT,
    "status" VARCHAR(20) DEFAULT 'pending',
    "admin_note" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_store_id_key" ON "reviews"("user_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_claims_store_id_claimed_by_key" ON "store_claims"("store_id", "claimed_by");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_gallery" ADD CONSTRAINT "store_gallery_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foods" ADD CONSTRAINT "foods_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_images" ADD CONSTRAINT "review_images_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_suggestions" ADD CONSTRAINT "store_suggestions_suggested_by_fkey" FOREIGN KEY ("suggested_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_claims" ADD CONSTRAINT "store_claims_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_claims" ADD CONSTRAINT "store_claims_claimed_by_fkey" FOREIGN KEY ("claimed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
