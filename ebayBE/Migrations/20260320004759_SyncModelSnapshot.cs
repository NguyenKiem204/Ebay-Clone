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
            // Safely rename columns using EXCEPTION blocks (idempotent).
            // Handles 3 scenarios:
            // 1. Column is "ExternalProviderId" (PascalCase) - rename it
            // 2. Column is already "external_provider_id" - skip rename, skip AlterColumn (already correct type)
            // 3. Column doesn't exist at all - skip everything
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    -- Rename ExternalProviderId -> external_provider_id
                    BEGIN
                        ALTER TABLE users RENAME COLUMN ""ExternalProviderId"" TO external_provider_id;
                    EXCEPTION WHEN undefined_column THEN
                        NULL; -- Already renamed or doesn't exist
                    END;

                    -- Rename ExternalProvider -> external_provider
                    BEGIN
                        ALTER TABLE users RENAME COLUMN ""ExternalProvider"" TO external_provider;
                    EXCEPTION WHEN undefined_column THEN
                        NULL; -- Already renamed or doesn't exist
                    END;

                    -- Alter column type for external_provider_id (text -> varchar(255))
                    BEGIN
                        ALTER TABLE users ALTER COLUMN external_provider_id TYPE character varying(255);
                    EXCEPTION WHEN undefined_column THEN
                        NULL;
                    END;

                    -- Alter column type for external_provider (text -> varchar(50))
                    BEGIN
                        ALTER TABLE users ALTER COLUMN external_provider TYPE character varying(50);
                    EXCEPTION WHEN undefined_column THEN
                        NULL;
                    END;
                END $$;");
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
