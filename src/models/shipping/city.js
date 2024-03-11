import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class City extends Model {
    static associate (models) {
      this.hasMany(models.Address, { foreignKey: 'city_id' })
    }
  }

  City.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'City',
    tableName: 'cities',
    timestamps: false
  })

  return City
}
