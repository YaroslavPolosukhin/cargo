import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class LogisticsPoint extends Model {
    static associate(models) {
      this.belongsTo(models.Address, { foreignKey: "address_id" });
      this.belongsToMany(models.Contact, {
        through: models.LogisticsPointContacts,
        foreignKey: "logistics_point_id",
        otherKey: "contact_id",
        as: "contacts",
      });
    }
  }

  LogisticsPoint.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "addresses",
          key: "id",
        },
      },
      geo: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "LogisticsPoint",
      tableName: "logistics_points",
      timestamps: false,
    }
  );

  return LogisticsPoint;
};
