using ebay.Models;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ebay.Migrations
{
    [DbContext(typeof(EbayDbContext))]
    [Migration("20260325152000_AllowGuestDisputes")]
    public class AllowGuestDisputes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "disputes_raised_by_fkey",
                table: "disputes");

            migrationBuilder.AlterColumn<int>(
                name: "raised_by",
                table: "disputes",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "disputes_raised_by_fkey",
                table: "disputes",
                column: "raised_by",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "disputes_raised_by_fkey",
                table: "disputes");

            migrationBuilder.Sql(
                """
                DELETE FROM case_attachments
                WHERE dispute_id IN (
                    SELECT id FROM disputes WHERE raised_by IS NULL
                );

                DELETE FROM case_events
                WHERE dispute_id IN (
                    SELECT id FROM disputes WHERE raised_by IS NULL
                );

                DELETE FROM disputes
                WHERE raised_by IS NULL;
                """);

            migrationBuilder.AlterColumn<int>(
                name: "raised_by",
                table: "disputes",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "disputes_raised_by_fkey",
                table: "disputes",
                column: "raised_by",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
