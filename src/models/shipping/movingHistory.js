import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Nomenclature extends Model {
    static associate(models) {}
  }

  Nomenclature.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      // geo: {
      //   type: DataTypes.GEOMETRY('POINT'),
      //   allowNull: false
      // },
      latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Nomenclature",
      tableName: "nomenclatures",
      timestamps: false,
    }
  );

  return Nomenclature;
};
