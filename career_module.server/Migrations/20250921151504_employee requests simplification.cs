using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace career_module.server.Migrations
{
    /// <inheritdoc />
    public partial class employeerequestssimplification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EmployeeRequests_Employees_PromotionRequest_NewManagerId",
                table: "EmployeeRequests");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeRequests_PromotionRequest_NewManagerId",
                table: "EmployeeRequests");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeRequests_TargetEmployeeId",
                table: "EmployeeRequests");

            migrationBuilder.DropColumn(
                name: "PromotionRequest_EffectiveDate",
                table: "EmployeeRequests");

            migrationBuilder.DropColumn(
                name: "PromotionRequest_NewManagerId",
                table: "EmployeeRequests");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "EmployeeRequests",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Pending",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "RequestType",
                table: "EmployeeRequests",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(21)",
                oldMaxLength: 21);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeRequest_RequestDate",
                table: "EmployeeRequests",
                column: "RequestDate");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeRequest_RequestType",
                table: "EmployeeRequests",
                column: "RequestType");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeRequest_Target_Status",
                table: "EmployeeRequests",
                columns: new[] { "TargetEmployeeId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmployeeRequest_RequestDate",
                table: "EmployeeRequests");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeRequest_RequestType",
                table: "EmployeeRequests");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeRequest_Target_Status",
                table: "EmployeeRequests");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "EmployeeRequests",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldDefaultValue: "Pending");

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
                name: "PromotionRequest_EffectiveDate",
                table: "EmployeeRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PromotionRequest_NewManagerId",
                table: "EmployeeRequests",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeRequests_PromotionRequest_NewManagerId",
                table: "EmployeeRequests",
                column: "PromotionRequest_NewManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeRequests_TargetEmployeeId",
                table: "EmployeeRequests",
                column: "TargetEmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_EmployeeRequests_Employees_PromotionRequest_NewManagerId",
                table: "EmployeeRequests",
                column: "PromotionRequest_NewManagerId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
