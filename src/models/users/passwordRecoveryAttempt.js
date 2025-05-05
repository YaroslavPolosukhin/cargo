import { DataTypes, Model } from 'sequelize'
import { getCurrentTimeFromDatabase } from '../../utils/getCurrentTimeFromDatabase.js'

export default (sequelize) => {
  class PasswordRecoveryAttempt extends Model {
    static associate (models) {
      this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' })
    }

    static async findByUserId (userId) {
      return await this.findOne({
        where: { user_id: userId }
      })
    }
  }

  PasswordRecoveryAttempt.init({
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
    sms_code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    incorrect_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'PasswordRecoveryAttempt',
    tableName: 'password_recovery_attempts',
    timestamps: true
  })

  PasswordRecoveryAttempt.getOrCreate = async (userId) => {
    const attempt = await PasswordRecoveryAttempt.findOne({ where: { user_id: userId } })
    if (attempt !== null) {
      return attempt
    }

    return await PasswordRecoveryAttempt.create({ user_id: userId })
  }

  PasswordRecoveryAttempt.prototype.getLifetime = async function () {
    const currentTime = await getCurrentTimeFromDatabase()
    return (currentTime.getTime() - this.updatedAt.getTime()) / (1000 * 60)
  }

  return PasswordRecoveryAttempt
}
