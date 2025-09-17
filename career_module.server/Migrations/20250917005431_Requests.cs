using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace career_module.server.Migrations
{
    /// <inheritdoc />
    public partial class Requests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeRequest_Type",
                table: "EmployeeRequests");

            migrationBuilder.AlterColumn<string>(
                name: "RequestType",
                table: "EmployeeRequests",
                type: "nvarchar(21)",
                maxLength: 21,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AddColumn<DateTime>(
                name: "EffectiveDate",
                table: "EmployeeRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Justification",
                table: "EmployeeRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NewDepartmentId",
                table: "EmployeeRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NewManagerId",
                table: "EmployeeRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NewPositionId",
                table: "EmployeeRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProcessedDate",
                table: "EmployeeRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PromotionRequest_EffectiveDate",
                table: "EmployeeRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ProposedSalary",
                table: "EmployeeRequests",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "EmployeeRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeRequests_NewDepartmentId",
                table: "EmployeeRequests",
                column: "NewDepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeRequests_NewManagerId",
                table: "EmployeeRequests",
                column: "NewManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeRequests_NewPositionId",
                table: "EmployeeRequests",
                column: "NewPositionId");

            migrationBuilder.AddForeignKey(
                name: "FK_EmployeeRequests_Departments_NewDepartmentId",
                table: "EmployeeRequests",
                column: "NewDepartmentId",
                principalTable: "Departments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_EmployeeRequests_Employees_NewManagerId",
                table: "EmployeeRequests",
                column: "NewManagerId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_EmployeeRequests_Positions_NewPositionId",
                table: "EmployeeRequests",
                column: "NewPositionId",
                principalTable: "Positions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EmployeeRequests_Departments_NewDepartmentId",
                table: "EmployeeRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_EmployeeRequests_Employees_NewManagerId",
                table: "EmployeeRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_EmployeeRequests_Positions_NewPositionId",
                table: "EmployeeRequests");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeRequests_NewDepartmentId",
                table: "EmployeeRequests");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeRequests_NewManagerId",
                table: "EmployeeRequests");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeRequests_NewPositionId",
                table: "EmployeeRequests");

            migrationBuilder.DropColumn(
                name: "EffectiveDate",
                table: "EmployeeRequests");

            migrationBuilder.DropColumn(
                name: "Justification",
                table: "EmployeeRequests");

            migrationBuilder.DropColumn(
                name: "NewDepartmentId",
                table: "EmployeeRequests");

            migrationBuilder.DropColumn(
                name: "NewManagerId",
                table: "EmployeeRequests");

            migrationBuilder.DropColumn(
                name: "NewPositionId",
                table: "EmployeeRequests");

            migrationBuilder.DropColumn(
                name: "ProcessedDate",
                table: "EmployeeRequests");

            migrationBuilder.DropColumn(
                name: "PromotionRequest_EffectiveDate",
                table: "EmployeeRequests");

            migrationBuilder.DropColumn(
                name: "ProposedSalary",
                table: "EmployeeRequests");

            migrationBuilder.DropColumn(
                name: "Reason",
                table: "EmployeeRequests");

            migrationBuilder.AlterColumn<string>(
                name: "RequestType",
                table: "EmployeeRequests",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(21)",
                oldMaxLength: 21);

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    IsRead = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Message = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    RelatedEntityId = table.Column<int>(type: "int", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeRequest_Type",
                table: "EmployeeRequests",
                column: "RequestType");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_CreatedAt",
                table: "Notifications",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_IsRead",
                table: "Notifications",
                columns: new[] { "UserId", "IsRead" });
        }
    }
}
