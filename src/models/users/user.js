import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class User extends Model {
    static associate (models) {
      this.hasMany(models.Person, { foreignKey: 'user_id', as: 'Person' })
      this.hasOne(models.PasswordRecoveryAttempt, { foreignKey: 'user_id', onDelete: 'CASCADE' })
      this.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' })
      this.belongsTo(this, { foreignKey: 'responsible_user' })
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'roles',
        key: 'id'
      },
      allowNull: false,
      onUpdate: 'CASCADE'
    },
    approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    responsible_user: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id'
      },
      allowNull: true,
      onUpdate: 'CASCADE'
    },
    refresh_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fcm_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    device_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    approved_company: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ['password', 'refresh_token', 'fcm_token', 'device_type'] }
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password', 'refresh_token', 'fcm_token', 'device_type'] }
      },
      withTokens: {
        attributes: { include: ['refresh_token', 'fcm_token', 'device_type'] }
      }
    }
  })

  return User
}
