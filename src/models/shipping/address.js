import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Address extends Model {
    static associate(models) {
      this.hasMany(models.LogisticsPoint, { foreignKey: "address_id" });
      this.belongsTo(models.Country, { foreignKey: "country_id" });
      this.belongsTo(models.City, { foreignKey: "city_id" });
      this.belongsTo(models.Street, { foreignKey: "street_id" });
    }
  }

  Address.init(
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
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      country_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "countries",
          key: "id",
        },
      },
      city_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "cities",
          key: "id",
        },
      },
      street_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "streets",
          key: "id",
        },
      },
      house: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      apartment: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      building: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      floor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      postcode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Address",
      tableName: "addresses",
      timestamps: false,
    }
  );

  return Address;
};
