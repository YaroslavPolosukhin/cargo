import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class DrivingLicence extends Model {
    static associate (models) {
      this.hasMany(models.Person, { foreignKey: 'driving_license_id' })
    }
  }

  DrivingLicence.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    serial: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'DrivingLicense',
    tableName: 'driving_license',
    timestamps: false
  })

  return DrivingLicence
}
