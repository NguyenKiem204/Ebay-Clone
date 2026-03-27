using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ebay.Migrations
{
    /// <inheritdoc />
    public partial class ExtendReturnRequestFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "closed_at",
                table: "return_requests",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "order_item_id",
                table: "return_requests",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "reason_code",
                table: "return_requests",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "request_type",
                table: "return_requests",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValueSql: "'return'::character varying");

            migrationBuilder.AddColumn<string>(
                name: "resolution_type",
                table: "return_requests",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValueSql: "'refund'::character varying");

            migrationBuilder.CreateIndex(
                name: "idx_returns_order_item",
                table: "return_requests",
                column: "order_item_id");

            migrationBuilder.AddCheckConstraint(
                name: "chk_return_request_type",
                table: "return_requests",
                sql: "request_type IN ('return', 'snad', 'damaged')");

            migrationBuilder.AddCheckConstraint(
                name: "chk_return_resolution_type",
                table: "return_requests",
                sql: "resolution_type IN ('refund', 'replacement', 'exchange')");

            migrationBuilder.Sql(
                """
                UPDATE return_requests
                SET closed_at = COALESCE(rejected_at, approved_at)
                WHERE closed_at IS NULL
                  AND status IN ('rejected', 'completed');
                """);

            migrationBuilder.AddForeignKey(
                name: "return_requests_order_item_id_fkey",
                table: "return_requests",
                column: "order_item_id",
                principalTable: "order_items",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "return_requests_order_item_id_fkey",
                table: "return_requests");

            migrationBuilder.DropIndex(
                name: "idx_returns_order_item",
                table: "return_requests");

            migrationBuilder.DropCheckConstraint(
                name: "chk_return_request_type",
                table: "return_requests");

            migrationBuilder.DropCheckConstraint(
                name: "chk_return_resolution_type",
                table: "return_requests");

            migrationBuilder.DropColumn(
                name: "closed_at",
                table: "return_requests");

            migrationBuilder.DropColumn(
                name: "order_item_id",
                table: "return_requests");

            migrationBuilder.DropColumn(
                name: "reason_code",
                table: "return_requests");

            migrationBuilder.DropColumn(
                name: "request_type",
                table: "return_requests");

            migrationBuilder.DropColumn(
                name: "resolution_type",
                table: "return_requests");
        }
    }
}
