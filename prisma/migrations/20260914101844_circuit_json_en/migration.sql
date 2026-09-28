-- AlterTable
ALTER TABLE "public"."circuits" ADD COLUMN     "excluded_en" JSONB,
ADD COLUMN     "highlights_en" JSONB,
ADD COLUMN     "included_en" JSONB,
ADD COLUMN     "itinerary_en" JSONB;

