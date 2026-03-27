using System;
using ebay.Models;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ebay.Migrations
{
    [DbContext(typeof(EbayDbContext))]
    [Migration("20260326090000_AddAuctionProxyBiddingFoundation")]
    public partial class AddAuctionProxyBiddingFoundation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "auction_status",
                table: "products",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "buy_it_now_price",
                table: "products",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "current_bid_price",
                table: "products",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ended_at",
                table: "products",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "reserve_price",
                table: "products",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "winning_bidder_id",
                table: "products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_retracted",
                table: "bids",
                type: "boolean",
                nullable: true,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "max_amount",
                table: "bids",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "retracted_at",
                table: "bids",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "idx_products_auction_status",
                table: "products",
                column: "auction_status");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_products_auction_status",
                table: "products");

            migrationBuilder.DropColumn(
                name: "auction_status",
                table: "products");

            migrationBuilder.DropColumn(
                name: "buy_it_now_price",
                table: "products");

            migrationBuilder.DropColumn(
                name: "current_bid_price",
                table: "products");

            migrationBuilder.DropColumn(
                name: "ended_at",
                table: "products");

            migrationBuilder.DropColumn(
                name: "reserve_price",
                table: "products");

            migrationBuilder.DropColumn(
                name: "winning_bidder_id",
                table: "products");

            migrationBuilder.DropColumn(
                name: "is_retracted",
                table: "bids");

            migrationBuilder.DropColumn(
                name: "max_amount",
                table: "bids");

            migrationBuilder.DropColumn(
                name: "retracted_at",
                table: "bids");
        }
    }
}
