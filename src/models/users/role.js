import { Model, DataTypes } from "sequelize";

import rolesEnum from "../../enums/roles.js";

export default (sequelize) => {
  class Role extends Model {
    static associate(models) {
      this.hasMany(models.User, { foreignKey: "role_id" });
    }
  }

  Role.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.ENUM,
        values: [
          rolesEnum.ADMIN,
          rolesEnum.DRIVER,
          rolesEnum.MANAGER,
          rolesEnum.OWNER,
        ],
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Role",
      tableName: "roles",
      timestamps: false,
    }
  );

  return Role;
};
