using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ebay.Migrations
{
    /// <inheritdoc />
    public partial class SyncModelSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.RenameColumn(
            //     name: "ExternalProviderId",
            //     table: "users",
            //     newName: "external_provider_id");

            // migrationBuilder.RenameColumn(
            //     name: "ExternalProvider",
            //     table: "users",
            //     newName: "external_provider");
            
            // Use raw SQL for conditional rename
            migrationBuilder.Sql(@"
                DO $$ 
                BEGIN 
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ExternalProviderId') THEN
                        ALTER TABLE users RENAME COLUMN ""ExternalProviderId"" TO external_provider_id;
                    END IF;
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ExternalProvider') THEN
                        ALTER TABLE users RENAME COLUMN ""ExternalProvider"" TO external_provider;
                    END IF;
                END $$;");

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "external_provider_id",
                table: "users",
                newName: "ExternalProviderId");

            migrationBuilder.RenameColumn(
                name: "external_provider",
                table: "users",
                newName: "ExternalProvider");

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
        }
    }
}
