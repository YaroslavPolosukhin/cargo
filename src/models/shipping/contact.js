import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Contact extends Model {
    static associate(models) {
      this.belongsToMany(models.LogisticsPoint, {
        through: models.LogisticsPointContacts,
        foreignKey: "contact_id",
        otherKey: "logistics_point_id",
        as: "logisticsPoints",
      });
    }
  }

  Contact.init(
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
      surname: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      patronymic: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      jobTitle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      telegram: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Contact",
      tableName: "contacts",
      timestamps: true,
    }
  );

  return Contact;
};
