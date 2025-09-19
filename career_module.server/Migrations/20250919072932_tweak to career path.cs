using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace career_module.server.Migrations
{
    /// <inheritdoc />
    public partial class tweaktocareerpath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CareerPath_From_To",
                table: "CareerPaths");

            migrationBuilder.AlterColumn<int>(
                name: "FromPositionId",
                table: "CareerPaths",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateIndex(
                name: "IX_CareerPath_From_To",
                table: "CareerPaths",
                columns: new[] { "FromPositionId", "ToPositionId" },
                unique: true,
                filter: "[FromPositionId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CareerPath_From_To",
                table: "CareerPaths");

            migrationBuilder.AlterColumn<int>(
                name: "FromPositionId",
                table: "CareerPaths",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CareerPath_From_To",
                table: "CareerPaths",
                columns: new[] { "FromPositionId", "ToPositionId" },
                unique: true);
        }
    }
}
