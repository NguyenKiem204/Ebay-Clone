using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ebay.Migrations
{
    /// <inheritdoc />
    public partial class AddCaseAttachmentEvidenceFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "case_attachments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    return_request_id = table.Column<int>(type: "integer", nullable: true),
                    dispute_id = table.Column<int>(type: "integer", nullable: true),
                    file_path = table.Column<string>(type: "text", nullable: false),
                    original_file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    file_size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    label = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    evidence_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    uploaded_by_user_id = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("case_attachments_pkey", x => x.id);
                    table.CheckConstraint("chk_case_attachment_scope", "(return_request_id IS NOT NULL AND dispute_id IS NULL) OR (return_request_id IS NULL AND dispute_id IS NOT NULL)");
                    table.ForeignKey(
                        name: "case_attachments_dispute_id_fkey",
                        column: x => x.dispute_id,
                        principalTable: "disputes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "case_attachments_return_request_id_fkey",
                        column: x => x.return_request_id,
                        principalTable: "return_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "case_attachments_uploaded_by_user_id_fkey",
                        column: x => x.uploaded_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "idx_case_attachments_created",
                table: "case_attachments",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_case_attachments_dispute",
                table: "case_attachments",
                column: "dispute_id");

            migrationBuilder.CreateIndex(
                name: "idx_case_attachments_return_request",
                table: "case_attachments",
                column: "return_request_id");

            migrationBuilder.CreateIndex(
                name: "idx_case_attachments_uploaded_by",
                table: "case_attachments",
                column: "uploaded_by_user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "case_attachments");
        }
    }
}
