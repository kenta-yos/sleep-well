CREATE TABLE "ai_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "computed_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"bedtime_deviation_minutes" real,
	"avg_freshness_7d" real,
	"avg_sleep_duration_7d" real
);
--> statement-breakpoint
CREATE TABLE "daily_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"freshness_score" integer,
	"stress_score" integer,
	"stress_sources" json,
	"alcohol" boolean DEFAULT false,
	"exercise" boolean DEFAULT false,
	"socializing" boolean DEFAULT false,
	"bathing" boolean DEFAULT false,
	"intense_focus" boolean DEFAULT false,
	"reading" boolean DEFAULT false,
	"late_meal" boolean DEFAULT false,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sleep_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"bedtime" timestamp with time zone,
	"wake_time" timestamp with time zone,
	"total_sleep_minutes" integer,
	"deep_minutes" integer,
	"light_minutes" integer,
	"rem_minutes" integer,
	"awake_minutes" integer,
	"avg_heart_rate" integer,
	"min_heart_rate" integer,
	"max_heart_rate" integer,
	"sleep_score" integer,
	"stage_items" json,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "computed_metrics_date_idx" ON "computed_metrics" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_logs_date_idx" ON "daily_logs" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "sleep_records_date_idx" ON "sleep_records" USING btree ("date");