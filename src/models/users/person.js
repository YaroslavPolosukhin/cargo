import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class Person extends Model {
    static associate (models) {
      this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' })
      this.belongsTo(models.JobPosition, { foreignKey: 'job_position_id', as: 'jobPosition' })
      this.belongsTo(models.Passport, { foreignKey: 'passport_id', as: 'passport' })
      this.belongsTo(models.Contragent, { foreignKey: 'contragent_id', as: 'contragent' })
      this.belongsTo(models.DrivingLicence, { foreignKey: 'driving_license_id', as: 'driving_license' })
    }

    static async findByUserId (userId) {
      return await this.findOne({
        where: { user_id: userId }
      })
    }
  }

  Person.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    surname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    patronymic: {
      type: DataTypes.STRING,
      allowNull: true
    },
    job_position_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'job_positions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true
    },
    inn: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passport_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'passports',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true
    },
    self_employed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    individual: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    contragent_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'contragents',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    telegram: {
      type: DataTypes.STRING,
      allowNull: true
    },
    driving_license_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'driving_license',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Person',
    tableName: 'persons',
    timestamps: true
  })

  return Person
}
