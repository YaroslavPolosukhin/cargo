import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class Measure extends Model {
    static associate (models) {
      this.hasMany(models.Nomenclature, { foreignKey: 'measure_id', as: 'nomenclatures' })
    }
  }

  Measure.init({
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
    modelName: 'Measure',
    tableName: 'measures',
    timestamps: false
  })

  return Measure
}
