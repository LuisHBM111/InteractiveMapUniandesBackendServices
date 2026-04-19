import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1776584951143 implements MigrationInterface {
    name = 'InitialSchema1776584951143'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "ads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "title" character varying NOT NULL, "imageUrl" character varying, "targetUrl" character varying, "startsAt" TIMESTAMP WITH TIME ZONE, "endsAt" TIMESTAMP WITH TIME ZONE, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_a7af7d1998037a97076f758fc23" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ad_clicks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "clickedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "source" character varying, "ad_id" uuid, "user_id" uuid, CONSTRAINT "PK_ea127bfe2c62aa27e28516268b4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "crash_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "message" character varying NOT NULL, "stackTrace" text, "appVersion" character varying, "deviceInfo" jsonb, "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_1ffc40a6ddfbb62196f3f969284" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "location_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "accuracyMeters" double precision, "recordedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_5d5f49548a71fb50f0a1ac19c5d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "usage_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "eventType" character varying NOT NULL, "feature" character varying, "payload" jsonb, "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_c9f17d50873fab2c46615f542bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "route_nodes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "label" character varying NOT NULL, "latitude" double precision, "longitude" double precision, "sequence" integer, "isCampusGraphNode" boolean NOT NULL DEFAULT true, "route_id" uuid, "place_id" uuid, CONSTRAINT "UQ_6c61935ea624fc36b2fca4b71d0" UNIQUE ("label"), CONSTRAINT "PK_4d407270b16d17b1a0f6148c3b3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."edges_travelmode_enum" AS ENUM('walking', 'accessible', 'mixed')`);
        await queryRunner.query(`CREATE TABLE "edges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "distanceMeters" double precision, "travelTimeSeconds" integer NOT NULL, "estimatedDurationMinutes" double precision, "travelMode" "public"."edges_travelmode_enum" NOT NULL DEFAULT 'walking', "isAccessible" boolean NOT NULL DEFAULT false, "isCampusGraphEdge" boolean NOT NULL DEFAULT true, "route_id" uuid, "from_node_id" uuid, "to_node_id" uuid, CONSTRAINT "PK_46bb3dd9779f5e6d0d2200cc1b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "routes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "label" character varying, "totalDistanceMeters" double precision, "estimatedDurationMinutes" double precision, "user_id" uuid, "origin_place_id" uuid, "destination_place_id" uuid, CONSTRAINT "PK_76100511cdfa1d013c859f01d8b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."places_category_enum" AS ENUM('generic', 'building', 'room', 'restaurant')`);
        await queryRunner.query(`CREATE TABLE "places" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "latitude" double precision, "longitude" double precision, "gridReference" character varying, "category" "public"."places_category_enum" NOT NULL DEFAULT 'generic', "priceLevel" integer, "averageRating" double precision, "foodCategory" character varying, "openingHours" character varying, "code" character varying, "aliases" text, "description" character varying, "roomCode" character varying, "floor" character varying, "place_type" character varying NOT NULL, "building_id" uuid, CONSTRAINT "UQ_a6fe963f6700cb1fe4e68002725" UNIQUE ("code"), CONSTRAINT "PK_1afab86e226b4c3bc9a74465c12" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c6a5cd37ef0f842a3fbd60e956" ON "places" ("place_type") `);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "rating" integer NOT NULL, "comment" text, "user_id" uuid, "restaurant_id" uuid, CONSTRAINT "UQ_review_user_restaurant" UNIQUE ("user_id", "restaurant_id"), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "instructors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fullName" character varying NOT NULL, "email" character varying, "department" character varying, CONSTRAINT "PK_95e3da69ca76176ea4ab8435098" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."recurrence_rules_frequency_enum" AS ENUM('daily', 'weekly', 'monthly')`);
        await queryRunner.query(`CREATE TABLE "recurrence_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "frequency" "public"."recurrence_rules_frequency_enum" NOT NULL DEFAULT 'weekly', "interval" integer NOT NULL DEFAULT '1', "byDay" text, "untilDate" TIMESTAMP WITH TIME ZONE, "timezone" character varying NOT NULL DEFAULT 'America/Bogota', "scheduled_class_id" uuid, CONSTRAINT "REL_29952a59b212308135cc1811a0" UNIQUE ("scheduled_class_id"), CONSTRAINT "PK_6bc19c65df8c43245ba79852966" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "scheduled_classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "title" character varying NOT NULL, "courseCode" character varying, "section" character varying, "nrc" character varying, "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "timezone" character varying NOT NULL DEFAULT 'America/Bogota', "externalUid" character varying, "rawLocation" character varying, "rawDescription" text, "schedule_id" uuid, "room_id" uuid, CONSTRAINT "PK_f0a8e6b9bbea1a2dbee3352208b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."schedules_sourcetype_enum" AS ENUM('ics_upload', 'default_sample', 'manual', 'integration')`);
        await queryRunner.query(`CREATE TABLE "schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "timezone" character varying NOT NULL DEFAULT 'America/Bogota', "sourceType" "public"."schedules_sourcetype_enum" NOT NULL DEFAULT 'ics_upload', "sourceUrl" character varying, "sourceFileName" character varying, "sourceStoragePath" character varying, "sourceStorageProvider" character varying, "sourceStorageBucket" character varying, "isDefaultSample" boolean NOT NULL DEFAULT false, "importedAt" TIMESTAMP WITH TIME ZONE, "lastUpdatedAt" TIMESTAMP WITH TIME ZONE, "user_id" uuid, CONSTRAINT "PK_7e33fc2ea755a5765e3564e66dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "language" character varying NOT NULL DEFAULT 'es-CO', "darkModeEnabled" boolean NOT NULL DEFAULT false, "notificationsEnabled" boolean NOT NULL DEFAULT true, "usesMetricUnits" boolean NOT NULL DEFAULT true, "user_id" uuid, CONSTRAINT "REL_458057fa75b66e68a275647da2" UNIQUE ("user_id"), CONSTRAINT "PK_e8cfb5b31af61cd363a6b6d7c25" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fullName" character varying NOT NULL, "program" character varying, "profileImage" character varying, "user_id" uuid, CONSTRAINT "REL_6ca9503d77ae39b4b5a6cc3ba8" UNIQUE ("user_id"), CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_authprovider_enum" AS ENUM('firebase', 'microsoft', 'google', 'email', 'guest')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying, "firebaseUid" character varying, "authProvider" "public"."users_authprovider_enum" NOT NULL DEFAULT 'firebase', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_e621f267079194e5428e19af2f3" UNIQUE ("firebaseUid"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "scheduled_class_instructors" ("scheduled_class_id" uuid NOT NULL, "instructor_id" uuid NOT NULL, CONSTRAINT "PK_a8563e7d5b6042fb73f5522f860" PRIMARY KEY ("scheduled_class_id", "instructor_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7773aeee4638270988a26def68" ON "scheduled_class_instructors" ("scheduled_class_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2dffc5555ae17d765a59a8a7e9" ON "scheduled_class_instructors" ("instructor_id") `);
        await queryRunner.query(`ALTER TABLE "ad_clicks" ADD CONSTRAINT "FK_a69774d225eba00355761752586" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ad_clicks" ADD CONSTRAINT "FK_5f3f3b3aeef2367a535eed10ab0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "crash_events" ADD CONSTRAINT "FK_b1251f99cc61a9000762fde65fa" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "location_events" ADD CONSTRAINT "FK_dce34706cb7fd5e2cc4e3b56dec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usage_events" ADD CONSTRAINT "FK_d45449360c659b44d775b34b50d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "route_nodes" ADD CONSTRAINT "FK_5a64c327e9c63485c5a6f8d24e7" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "route_nodes" ADD CONSTRAINT "FK_5cd0678d57c6398a725546b3b04" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "edges" ADD CONSTRAINT "FK_23d1b590113035017ac8ac34876" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "edges" ADD CONSTRAINT "FK_339d0398706d3fadc1962701346" FOREIGN KEY ("from_node_id") REFERENCES "route_nodes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "edges" ADD CONSTRAINT "FK_6a743d9fe24b4ae03f859de4f1b" FOREIGN KEY ("to_node_id") REFERENCES "route_nodes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "routes" ADD CONSTRAINT "FK_e75937499deab9df1eba04724f1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "routes" ADD CONSTRAINT "FK_9f6ddcce2d4a898333fe6e89719" FOREIGN KEY ("origin_place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "routes" ADD CONSTRAINT "FK_460b13730f48c67b401bf74d9ca" FOREIGN KEY ("destination_place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "places" ADD CONSTRAINT "FK_6cbd4d1663ff5f9e46d4400ca49" FOREIGN KEY ("building_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_2269110d10df8d494b99e1381d2" FOREIGN KEY ("restaurant_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurrence_rules" ADD CONSTRAINT "FK_29952a59b212308135cc1811a01" FOREIGN KEY ("scheduled_class_id") REFERENCES "scheduled_classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scheduled_classes" ADD CONSTRAINT "FK_e9f17ee88bbbe58af6ae170b4da" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scheduled_classes" ADD CONSTRAINT "FK_b662761bbd7ab05f25c8f358239" FOREIGN KEY ("room_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_55e6651198104efea0b04568a88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_preferences" ADD CONSTRAINT "FK_458057fa75b66e68a275647da2e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scheduled_class_instructors" ADD CONSTRAINT "FK_7773aeee4638270988a26def68d" FOREIGN KEY ("scheduled_class_id") REFERENCES "scheduled_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "scheduled_class_instructors" ADD CONSTRAINT "FK_2dffc5555ae17d765a59a8a7e96" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "scheduled_class_instructors" DROP CONSTRAINT "FK_2dffc5555ae17d765a59a8a7e96"`);
        await queryRunner.query(`ALTER TABLE "scheduled_class_instructors" DROP CONSTRAINT "FK_7773aeee4638270988a26def68d"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88"`);
        await queryRunner.query(`ALTER TABLE "user_preferences" DROP CONSTRAINT "FK_458057fa75b66e68a275647da2e"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_55e6651198104efea0b04568a88"`);
        await queryRunner.query(`ALTER TABLE "scheduled_classes" DROP CONSTRAINT "FK_b662761bbd7ab05f25c8f358239"`);
        await queryRunner.query(`ALTER TABLE "scheduled_classes" DROP CONSTRAINT "FK_e9f17ee88bbbe58af6ae170b4da"`);
        await queryRunner.query(`ALTER TABLE "recurrence_rules" DROP CONSTRAINT "FK_29952a59b212308135cc1811a01"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_2269110d10df8d494b99e1381d2"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`);
        await queryRunner.query(`ALTER TABLE "places" DROP CONSTRAINT "FK_6cbd4d1663ff5f9e46d4400ca49"`);
        await queryRunner.query(`ALTER TABLE "routes" DROP CONSTRAINT "FK_460b13730f48c67b401bf74d9ca"`);
        await queryRunner.query(`ALTER TABLE "routes" DROP CONSTRAINT "FK_9f6ddcce2d4a898333fe6e89719"`);
        await queryRunner.query(`ALTER TABLE "routes" DROP CONSTRAINT "FK_e75937499deab9df1eba04724f1"`);
        await queryRunner.query(`ALTER TABLE "edges" DROP CONSTRAINT "FK_6a743d9fe24b4ae03f859de4f1b"`);
        await queryRunner.query(`ALTER TABLE "edges" DROP CONSTRAINT "FK_339d0398706d3fadc1962701346"`);
        await queryRunner.query(`ALTER TABLE "edges" DROP CONSTRAINT "FK_23d1b590113035017ac8ac34876"`);
        await queryRunner.query(`ALTER TABLE "route_nodes" DROP CONSTRAINT "FK_5cd0678d57c6398a725546b3b04"`);
        await queryRunner.query(`ALTER TABLE "route_nodes" DROP CONSTRAINT "FK_5a64c327e9c63485c5a6f8d24e7"`);
        await queryRunner.query(`ALTER TABLE "usage_events" DROP CONSTRAINT "FK_d45449360c659b44d775b34b50d"`);
        await queryRunner.query(`ALTER TABLE "location_events" DROP CONSTRAINT "FK_dce34706cb7fd5e2cc4e3b56dec"`);
        await queryRunner.query(`ALTER TABLE "crash_events" DROP CONSTRAINT "FK_b1251f99cc61a9000762fde65fa"`);
        await queryRunner.query(`ALTER TABLE "ad_clicks" DROP CONSTRAINT "FK_5f3f3b3aeef2367a535eed10ab0"`);
        await queryRunner.query(`ALTER TABLE "ad_clicks" DROP CONSTRAINT "FK_a69774d225eba00355761752586"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2dffc5555ae17d765a59a8a7e9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7773aeee4638270988a26def68"`);
        await queryRunner.query(`DROP TABLE "scheduled_class_instructors"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_authprovider_enum"`);
        await queryRunner.query(`DROP TABLE "user_profiles"`);
        await queryRunner.query(`DROP TABLE "user_preferences"`);
        await queryRunner.query(`DROP TABLE "schedules"`);
        await queryRunner.query(`DROP TYPE "public"."schedules_sourcetype_enum"`);
        await queryRunner.query(`DROP TABLE "scheduled_classes"`);
        await queryRunner.query(`DROP TABLE "recurrence_rules"`);
        await queryRunner.query(`DROP TYPE "public"."recurrence_rules_frequency_enum"`);
        await queryRunner.query(`DROP TABLE "instructors"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c6a5cd37ef0f842a3fbd60e956"`);
        await queryRunner.query(`DROP TABLE "places"`);
        await queryRunner.query(`DROP TYPE "public"."places_category_enum"`);
        await queryRunner.query(`DROP TABLE "routes"`);
        await queryRunner.query(`DROP TABLE "edges"`);
        await queryRunner.query(`DROP TYPE "public"."edges_travelmode_enum"`);
        await queryRunner.query(`DROP TABLE "route_nodes"`);
        await queryRunner.query(`DROP TABLE "usage_events"`);
        await queryRunner.query(`DROP TABLE "location_events"`);
        await queryRunner.query(`DROP TABLE "crash_events"`);
        await queryRunner.query(`DROP TABLE "ad_clicks"`);
        await queryRunner.query(`DROP TABLE "ads"`);
    }

}
