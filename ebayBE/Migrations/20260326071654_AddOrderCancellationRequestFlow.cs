using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ebay.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderCancellationRequestFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "order_cancellation_requests",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    order_id = table.Column<int>(type: "integer", nullable: false),
                    requested_by_user_id = table.Column<int>(type: "integer", nullable: false),
                    resolved_by_user_id = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValueSql: "'pending'::character varying"),
                    reason = table.Column<string>(type: "text", nullable: true),
                    seller_response = table.Column<string>(type: "text", nullable: true),
                    responded_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("order_cancellation_requests_pkey", x => x.id);
                    table.CheckConstraint("chk_order_cancellation_request_status", "status IN ('pending', 'approved', 'rejected')");
                    table.ForeignKey(
                        name: "order_cancellation_requests_order_id_fkey",
                        column: x => x.order_id,
                        principalTable: "orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "order_cancellation_requests_requested_by_user_id_fkey",
                        column: x => x.requested_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "order_cancellation_requests_resolved_by_user_id_fkey",
                        column: x => x.resolved_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "idx_order_cancellation_requests_order",
                table: "order_cancellation_requests",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "idx_order_cancellation_requests_requested_by",
                table: "order_cancellation_requests",
                column: "requested_by_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_order_cancellation_requests_resolved_by",
                table: "order_cancellation_requests",
                column: "resolved_by_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_order_cancellation_requests_status",
                table: "order_cancellation_requests",
                column: "status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "order_cancellation_requests");
        }
    }
}
