import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class Passport extends Model {
    static associate (models) {
      this.hasOne(models.Person, { foreignKey: 'passport_id', as: 'passport' })
      this.hasMany(models.PassportPhoto, { foreignKey: 'passport_id', as: 'photos' })
    }
  }

  Passport.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    series: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    authority: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date_of_issue: {
      type: DataTypes.DATE,
      allowNull: false
    },
    department_code: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Passport',
    tableName: 'passports',
    timestamps: true
  })

  return Passport
}
