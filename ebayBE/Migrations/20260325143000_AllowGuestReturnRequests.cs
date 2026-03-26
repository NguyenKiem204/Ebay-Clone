using ebay.Models;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ebay.Migrations
{
    [DbContext(typeof(EbayDbContext))]
    [Migration("20260325143000_AllowGuestReturnRequests")]
    public class AllowGuestReturnRequests : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "return_requests_user_id_fkey",
                table: "return_requests");

            migrationBuilder.AlterColumn<int>(
                name: "user_id",
                table: "return_requests",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "return_requests_user_id_fkey",
                table: "return_requests",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "return_requests_user_id_fkey",
                table: "return_requests");

            migrationBuilder.Sql(
                """
                DELETE FROM case_attachments
                WHERE return_request_id IN (
                    SELECT id FROM return_requests WHERE user_id IS NULL
                );

                DELETE FROM case_events
                WHERE return_request_id IN (
                    SELECT id FROM return_requests WHERE user_id IS NULL
                );

                DELETE FROM return_requests
                WHERE user_id IS NULL;
                """);

            migrationBuilder.AlterColumn<int>(
                name: "user_id",
                table: "return_requests",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "return_requests_user_id_fkey",
                table: "return_requests",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
