using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ebay.Migrations
{
    /// <inheritdoc />
    public partial class ExtendDisputeFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "case_type",
                table: "disputes",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValueSql: "'other'::character varying");

            migrationBuilder.AddColumn<DateTime>(
                name: "closed_at",
                table: "disputes",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "closed_reason",
                table: "disputes",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "escalated_from_return_request_id",
                table: "disputes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "order_item_id",
                table: "disputes",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "idx_disputes_order_item",
                table: "disputes",
                column: "order_item_id");

            migrationBuilder.CreateIndex(
                name: "idx_disputes_return_request",
                table: "disputes",
                column: "escalated_from_return_request_id");

            migrationBuilder.AddCheckConstraint(
                name: "chk_dispute_case_type",
                table: "disputes",
                sql: "case_type IN ('inr', 'snad', 'damaged', 'return_escalation', 'other')");

            migrationBuilder.Sql(
                """
                UPDATE disputes
                SET closed_at = COALESCE(resolved_at, updated_at, created_at)
                WHERE closed_at IS NULL
                  AND status = 'closed';
                """);

            migrationBuilder.AddForeignKey(
                name: "disputes_escalated_from_return_request_id_fkey",
                table: "disputes",
                column: "escalated_from_return_request_id",
                principalTable: "return_requests",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "disputes_order_item_id_fkey",
                table: "disputes",
                column: "order_item_id",
                principalTable: "order_items",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "disputes_escalated_from_return_request_id_fkey",
                table: "disputes");

            migrationBuilder.DropForeignKey(
                name: "disputes_order_item_id_fkey",
                table: "disputes");

            migrationBuilder.DropIndex(
                name: "idx_disputes_order_item",
                table: "disputes");

            migrationBuilder.DropIndex(
                name: "idx_disputes_return_request",
                table: "disputes");

            migrationBuilder.DropCheckConstraint(
                name: "chk_dispute_case_type",
                table: "disputes");

            migrationBuilder.DropColumn(
                name: "case_type",
                table: "disputes");

            migrationBuilder.DropColumn(
                name: "closed_at",
                table: "disputes");

            migrationBuilder.DropColumn(
                name: "closed_reason",
                table: "disputes");

            migrationBuilder.DropColumn(
                name: "escalated_from_return_request_id",
                table: "disputes");

            migrationBuilder.DropColumn(
                name: "order_item_id",
                table: "disputes");
        }
    }
}
