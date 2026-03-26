using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ebay.Migrations
{
    /// <inheritdoc />
    public partial class AddGuestCheckoutIdempotencyPersistence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "guest_checkout_idempotency",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    idempotency_key = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    request_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    order_id = table.Column<int>(type: "integer", nullable: true),
                    response_payload = table.Column<string>(type: "jsonb", nullable: true),
                    processing_expires_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    replay_expires_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("guest_checkout_idempotency_pkey", x => x.id);
                    table.CheckConstraint("chk_guest_checkout_idempotency_status", "status::text = ANY (ARRAY['processing'::character varying, 'completed'::character varying]::text[])");
                    table.ForeignKey(
                        name: "guest_checkout_idempotency_order_id_fkey",
                        column: x => x.order_id,
                        principalTable: "orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "guest_checkout_idempotency_idempotency_key_key",
                table: "guest_checkout_idempotency",
                column: "idempotency_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_guest_checkout_idempotency_order",
                table: "guest_checkout_idempotency",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "idx_guest_checkout_idempotency_processing_expires",
                table: "guest_checkout_idempotency",
                column: "processing_expires_at");

            migrationBuilder.CreateIndex(
                name: "idx_guest_checkout_idempotency_replay_expires",
                table: "guest_checkout_idempotency",
                column: "replay_expires_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "guest_checkout_idempotency");
        }
    }
}
