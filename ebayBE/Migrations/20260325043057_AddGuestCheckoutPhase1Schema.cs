using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ebay.Migrations
{
    /// <inheritdoc />
    public partial class AddGuestCheckoutPhase1Schema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM pg_trigger
                        WHERE tgname = 'set_order_number'
                    ) THEN
                        DROP TRIGGER set_order_number ON orders;
                    END IF;
                END
                $$;
                """);

            migrationBuilder.Sql("""
                DROP FUNCTION IF EXISTS generate_order_number();
                """);

            migrationBuilder.AlterColumn<int>(
                name: "user_id",
                table: "payments",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "buyer_id",
                table: "orders",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "address_id",
                table: "orders",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "customer_type",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "guest_email",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "guest_full_name",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "guest_phone",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ship_city",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ship_country",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ship_full_name",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ship_phone",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ship_postal_code",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ship_state",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ship_street",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "product_image_snapshot",
                table: "order_items",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "product_title_snapshot",
                table: "order_items",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "seller_display_name_snapshot",
                table: "order_items",
                type: "text",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE orders
                SET customer_type = 'member'
                WHERE customer_type IS NULL OR customer_type = '';
                """);

            migrationBuilder.AlterColumn<string>(
                name: "customer_type",
                table: "orders",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "customer_type",
                table: "orders",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.DropColumn(
                name: "customer_type",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "guest_email",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "guest_full_name",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "guest_phone",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ship_city",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ship_country",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ship_full_name",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ship_phone",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ship_postal_code",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ship_state",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ship_street",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "product_image_snapshot",
                table: "order_items");

            migrationBuilder.DropColumn(
                name: "product_title_snapshot",
                table: "order_items");

            migrationBuilder.DropColumn(
                name: "seller_display_name_snapshot",
                table: "order_items");

            migrationBuilder.AlterColumn<int>(
                name: "user_id",
                table: "payments",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "buyer_id",
                table: "orders",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "address_id",
                table: "orders",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION generate_order_number()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.order_number = 'ORD-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0');
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                """);

            migrationBuilder.Sql("""
                CREATE TRIGGER set_order_number
                BEFORE INSERT ON orders
                FOR EACH ROW EXECUTE FUNCTION generate_order_number();
                """);
        }
    }
}
