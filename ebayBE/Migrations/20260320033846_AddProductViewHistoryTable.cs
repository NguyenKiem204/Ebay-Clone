using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ebay.Migrations
{
    /// <inheritdoc />
    public partial class AddProductViewHistoryTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "product_view_history",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: true),
                    cookie_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    product_id = table.Column<int>(type: "integer", nullable: false),
                    viewed_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    expires_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("product_view_history_pkey", x => x.id);
                    table.ForeignKey(
                        name: "pvh_product_id_fkey",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "pvh_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_pvh_cookie",
                table: "product_view_history",
                columns: new[] { "cookie_id", "viewed_at" });

            migrationBuilder.CreateIndex(
                name: "idx_pvh_expires",
                table: "product_view_history",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "idx_pvh_user",
                table: "product_view_history",
                columns: new[] { "user_id", "viewed_at" });

            migrationBuilder.CreateIndex(
                name: "IX_product_view_history_product_id",
                table: "product_view_history",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "uq_guest_product",
                table: "product_view_history",
                columns: new[] { "cookie_id", "product_id" },
                unique: true,
                filter: "cookie_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "uq_user_product",
                table: "product_view_history",
                columns: new[] { "user_id", "product_id" },
                unique: true,
                filter: "user_id IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "product_view_history");

        }
    }
}
