import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class Street extends Model {
    static associate (models) {
      this.hasMany(models.Address, { foreignKey: 'street_id' })
    }
  }

  Street.init({
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
    modelName: 'Street',
    tableName: 'streets',
    timestamps: false
  })

  return Street
}
