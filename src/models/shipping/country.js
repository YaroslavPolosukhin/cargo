import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class Country extends Model {
    static associate (models) {
      this.hasMany(models.Address, { foreignKey: 'country_id' })
    }
  }

  Country.init({
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
    modelName: 'Country',
    tableName: 'countries',
    timestamps: false
  })

  return Country
}
