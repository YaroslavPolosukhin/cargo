import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class Region extends Model {
    static associate (models) {
      this.hasMany(models.Address, { foreignKey: 'region_id' })
    }
  }

  Region.init({
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
    modelName: 'Region',
    tableName: 'regions',
    timestamps: false
  })

  return Region
}
