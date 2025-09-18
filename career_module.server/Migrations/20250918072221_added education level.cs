using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace career_module.server.Migrations
{
    /// <inheritdoc />
    public partial class addededucationlevel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Level",
                table: "EmployeeEducations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Level",
                table: "EmployeeEducations");
        }
    }
}
