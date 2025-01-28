import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class Truck extends Model {
    static associate (models) {
      this.hasMany(models.Order, { foreignKey: 'truck_id' })
    }
  }

  Truck.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    vin: {
      type: DataTypes.STRING,
      allowNull: false
    },
    trailer_number: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Truck',
    tableName: 'trucks',
    timestamps: false
  })

  return Truck
}
