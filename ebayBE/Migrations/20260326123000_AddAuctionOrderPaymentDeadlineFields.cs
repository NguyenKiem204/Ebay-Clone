using System;
using ebay.Models;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ebay.Migrations
{
    [DbContext(typeof(EbayDbContext))]
    [Migration("20260326123000_AddAuctionOrderPaymentDeadlineFields")]
    public partial class AddAuctionOrderPaymentDeadlineFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_auction_order",
                table: "orders",
                type: "boolean",
                nullable: true,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "payment_due_at",
                table: "orders",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "payment_reminder_sent_at",
                table: "orders",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "idx_orders_payment_due_at",
                table: "orders",
                column: "payment_due_at");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_orders_payment_due_at",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "is_auction_order",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "payment_due_at",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "payment_reminder_sent_at",
                table: "orders");
        }
    }
}
