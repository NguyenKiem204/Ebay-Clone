using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ebay.Migrations
{
    /// <inheritdoc />
    public partial class SyncUserColumnNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "categories_parent_id_fkey",
                table: "categories");

            migrationBuilder.DropForeignKey(
                name: "coupons_product_id_fkey",
                table: "coupons");

            migrationBuilder.DropIndex(
                name: "idx_coupons_code",
                table: "coupons");

            migrationBuilder.DropIndex(
                name: "IX_coupons_product_id",
                table: "coupons");

            migrationBuilder.DropIndex(
                name: "coupon_usage_coupon_id_order_id_key",
                table: "coupon_usage");

            // Use safe SQL because SyncModelSnapshot migration may have already renamed these columns.
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    BEGIN
                        ALTER TABLE users RENAME COLUMN ""ExternalProviderId"" TO external_provider_id;
                    EXCEPTION WHEN undefined_column THEN
                        NULL;
                    END;
                    BEGIN
                        ALTER TABLE users RENAME COLUMN ""ExternalProvider"" TO external_provider;
                    EXCEPTION WHEN undefined_column THEN
                        NULL;
                    END;
                END $$;");

            migrationBuilder.RenameIndex(
                name: "idx_coupon_usage_user",
                table: "coupon_usage",
                newName: "IX_coupon_usage_user_id");

            migrationBuilder.AlterColumn<string>(
                name: "external_provider_id",
                table: "users",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "external_provider",
                table: "users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "min_order_amount",
                table: "coupons",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,2)",
                oldPrecision: 10,
                oldScale: 2,
                oldNullable: true,
                oldDefaultValueSql: "0");

            migrationBuilder.AddColumn<string>(
                name: "coupon_type",
                table: "coupons",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "max_usage_per_user",
                table: "coupons",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "store_id",
                table: "coupons",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "coupon_products",
                columns: table => new
                {
                    coupon_id = table.Column<int>(type: "integer", nullable: false),
                    product_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("coupon_products_pkey", x => new { x.coupon_id, x.product_id });
                    table.ForeignKey(
                        name: "coupon_products_coupon_id_fkey",
                        column: x => x.coupon_id,
                        principalTable: "coupons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "coupon_products_product_id_fkey",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_coupons_store_id",
                table: "coupons",
                column: "store_id");

            migrationBuilder.CreateIndex(
                name: "IX_coupon_usage_coupon_id",
                table: "coupon_usage",
                column: "coupon_id");

            migrationBuilder.CreateIndex(
                name: "IX_coupon_products_product_id",
                table: "coupon_products",
                column: "product_id");

            migrationBuilder.AddForeignKey(
                name: "FK_categories_categories_parent_id",
                table: "categories",
                column: "parent_id",
                principalTable: "categories",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "coupons_store_id_fkey",
                table: "coupons",
                column: "store_id",
                principalTable: "stores",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_categories_categories_parent_id",
                table: "categories");

            migrationBuilder.DropForeignKey(
                name: "coupons_store_id_fkey",
                table: "coupons");

            migrationBuilder.DropTable(
                name: "coupon_products");

            migrationBuilder.DropIndex(
                name: "IX_coupons_store_id",
                table: "coupons");

            migrationBuilder.DropIndex(
                name: "IX_coupon_usage_coupon_id",
                table: "coupon_usage");

            migrationBuilder.DropColumn(
                name: "coupon_type",
                table: "coupons");

            migrationBuilder.DropColumn(
                name: "max_usage_per_user",
                table: "coupons");

            migrationBuilder.DropColumn(
                name: "store_id",
                table: "coupons");

            migrationBuilder.RenameColumn(
                name: "external_provider_id",
                table: "users",
                newName: "ExternalProviderId");

            migrationBuilder.RenameColumn(
                name: "external_provider",
                table: "users",
                newName: "ExternalProvider");

            migrationBuilder.RenameIndex(
                name: "IX_coupon_usage_user_id",
                table: "coupon_usage",
                newName: "idx_coupon_usage_user");

            migrationBuilder.AlterColumn<string>(
                name: "ExternalProviderId",
                table: "users",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ExternalProvider",
                table: "users",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "min_order_amount",
                table: "coupons",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true,
                defaultValueSql: "0",
                oldClrType: typeof(decimal),
                oldType: "numeric(10,2)",
                oldPrecision: 10,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "idx_coupons_code",
                table: "coupons",
                column: "code");

            migrationBuilder.CreateIndex(
                name: "IX_coupons_product_id",
                table: "coupons",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "coupon_usage_coupon_id_order_id_key",
                table: "coupon_usage",
                columns: new[] { "coupon_id", "order_id" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "categories_parent_id_fkey",
                table: "categories",
                column: "parent_id",
                principalTable: "categories",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "coupons_product_id_fkey",
                table: "coupons",
                column: "product_id",
                principalTable: "products",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
