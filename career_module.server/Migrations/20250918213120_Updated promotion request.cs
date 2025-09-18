using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace career_module.server.Migrations
{
    /// <inheritdoc />
    public partial class Updatedpromotionrequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EmployeeRequests_Positions_NewPositionId",
                table: "EmployeeRequests");

            migrationBuilder.RenameColumn(
                name: "NewPositionId",
                table: "EmployeeRequests",
                newName: "PromotionRequest_NewManagerId");

            migrationBuilder.RenameIndex(
                name: "IX_EmployeeRequests_NewPositionId",
                table: "EmployeeRequests",
                newName: "IX_EmployeeRequests_PromotionRequest_NewManagerId");

            migrationBuilder.AddColumn<int>(
                name: "CareerPathId",
                table: "EmployeeRequests",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeRequests_CareerPathId",
                table: "EmployeeRequests",
                column: "CareerPathId");

            migrationBuilder.AddForeignKey(
                name: "FK_EmployeeRequests_CareerPaths_CareerPathId",
                table: "EmployeeRequests",
                column: "CareerPathId",
                principalTable: "CareerPaths",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_EmployeeRequests_Employees_PromotionRequest_NewManagerId",
                table: "EmployeeRequests",
                column: "PromotionRequest_NewManagerId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EmployeeRequests_CareerPaths_CareerPathId",
                table: "EmployeeRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_EmployeeRequests_Employees_PromotionRequest_NewManagerId",
                table: "EmployeeRequests");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeRequests_CareerPathId",
                table: "EmployeeRequests");

            migrationBuilder.DropColumn(
                name: "CareerPathId",
                table: "EmployeeRequests");

            migrationBuilder.RenameColumn(
                name: "PromotionRequest_NewManagerId",
                table: "EmployeeRequests",
                newName: "NewPositionId");

            migrationBuilder.RenameIndex(
                name: "IX_EmployeeRequests_PromotionRequest_NewManagerId",
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
    }
}
