import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class PassportPhoto extends Model {
    static associate (models) {
      this.belongsTo(models.Passport, { foreignKey: 'passport_id' })
    }
  }

  PassportPhoto.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    passport_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'passports',
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
    modelName: 'PassportPhoto',
    tableName: 'passport_photos',
    timestamps: true
  })

  return PassportPhoto
}
