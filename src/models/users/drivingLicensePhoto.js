import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class drivingLicensePhotoModel extends Model {
    static associate (models) {
      this.belongsTo(models.DrivingLicence, { foreignKey: 'driving_license_id' })
    }
  }

  drivingLicensePhotoModel.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    driving_license_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'driving_license',
        key: 'id'
      },
      allowNull: false
    },
    photo_url: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'DrivingLicensePhoto',
    tableName: 'driving_license_photos',
    timestamps: true
  })

  return drivingLicensePhotoModel
}
