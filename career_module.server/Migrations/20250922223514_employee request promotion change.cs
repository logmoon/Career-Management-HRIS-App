using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace career_module.server.Migrations
{
    /// <inheritdoc />
    public partial class employeerequestpromotionchange : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EmployeeRequests_CareerPaths_CareerPathId",
                table: "EmployeeRequests");

            migrationBuilder.RenameColumn(
                name: "CareerPathId",
                table: "EmployeeRequests",
                newName: "NewPositionId");

            migrationBuilder.RenameIndex(
                name: "IX_EmployeeRequests_CareerPathId",
                table: "EmployeeRequests",
                newName: "IX_EmployeeRequests_NewPositionId");

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
                name: "FK_EmployeeRequests_Positions_NewPositionId",
                table: "EmployeeRequests");

            migrationBuilder.RenameColumn(
                name: "NewPositionId",
                table: "EmployeeRequests",
                newName: "CareerPathId");

            migrationBuilder.RenameIndex(
                name: "IX_EmployeeRequests_NewPositionId",
                table: "EmployeeRequests",
                newName: "IX_EmployeeRequests_CareerPathId");

            migrationBuilder.AddForeignKey(
                name: "FK_EmployeeRequests_CareerPaths_CareerPathId",
                table: "EmployeeRequests",
                column: "CareerPathId",
                principalTable: "CareerPaths",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
