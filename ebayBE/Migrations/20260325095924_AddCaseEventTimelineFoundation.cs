using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ebay.Migrations
{
    /// <inheritdoc />
    public partial class AddCaseEventTimelineFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "case_events",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    return_request_id = table.Column<int>(type: "integer", nullable: true),
                    dispute_id = table.Column<int>(type: "integer", nullable: true),
                    event_type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    actor_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    actor_user_id = table.Column<int>(type: "integer", nullable: true),
                    message = table.Column<string>(type: "text", nullable: false),
                    metadata_json = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("case_events_pkey", x => x.id);
                    table.CheckConstraint("chk_case_event_actor_type", "actor_type IN ('buyer', 'seller', 'admin', 'system')");
                    table.CheckConstraint("chk_case_event_event_type", "event_type IN ('created', 'status_changed', 'comment_added', 'evidence_added', 'escalated', 'resolution_proposed', 'resolved', 'closed', 'system_note')");
                    table.CheckConstraint("chk_case_event_scope", "return_request_id IS NOT NULL OR dispute_id IS NOT NULL");
                    table.ForeignKey(
                        name: "case_events_actor_user_id_fkey",
                        column: x => x.actor_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "case_events_dispute_id_fkey",
                        column: x => x.dispute_id,
                        principalTable: "disputes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "case_events_return_request_id_fkey",
                        column: x => x.return_request_id,
                        principalTable: "return_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_case_events_actor_user",
                table: "case_events",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_case_events_created",
                table: "case_events",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_case_events_dispute",
                table: "case_events",
                column: "dispute_id");

            migrationBuilder.CreateIndex(
                name: "idx_case_events_return_request",
                table: "case_events",
                column: "return_request_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "case_events");
        }
    }
}
