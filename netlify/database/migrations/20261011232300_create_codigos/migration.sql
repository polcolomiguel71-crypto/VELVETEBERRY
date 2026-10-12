CREATE TABLE "codigos" (
	"id" serial PRIMARY KEY,
	"codigo" text NOT NULL UNIQUE,
	"producto" text DEFAULT 'zarzamoras' NOT NULL,
	"lote" text DEFAULT '' NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"canjeado_en" timestamp,
	"nombre" text,
	"telefono" text,
	"cupon" text UNIQUE
);
