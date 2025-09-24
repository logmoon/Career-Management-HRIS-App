using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace career_module.server.Migrations
{
    /// <inheritdoc />
    public partial class Initial1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "EmployeeRequests",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.UpdateData(
                table: "EmployeeRequests",
                keyColumn: "Id",
                keyValue: 1,
                column: "RequestType",
                value: "PositionChange");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "EmployeeRequests",
                keyColumn: "Id",
                keyValue: 1,
                column: "RequestType",
                value: "Promotion");

            migrationBuilder.InsertData(
                table: "EmployeeRequests",
                columns: new[] { "Id", "ApprovedByHRId", "ApprovedByManagerId", "EffectiveDate", "HRApprovalDate", "Justification", "ManagerApprovalDate", "NewDepartmentId", "NewManagerId", "NewPositionId", "Notes", "ProcessedDate", "ProposedSalary", "Reason", "RejectionReason", "RequestDate", "RequestType", "RequesterId", "Status", "TargetEmployeeId" },
                values: new object[] { 3, null, null, null, null, null, null, null, null, null, null, null, null, null, "Budget constraints", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Training", 3, "Rejected", null });
        }
    }
}
