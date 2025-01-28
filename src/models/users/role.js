import { Model, DataTypes } from 'sequelize'

import rolesEnum from '../../enums/roles.js'

export default (sequelize) => {
  class Role extends Model {
    static associate (models) {
      this.hasMany(models.User, { foreignKey: 'role_id' })
    }
  }

  Role.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: DataTypes.ENUM,
        values: [
          rolesEnum.ADMIN,
          rolesEnum.DRIVER,
          rolesEnum.MANAGER,
          rolesEnum.OWNER,
          rolesEnum.COMPANY_DRIVER,
          rolesEnum.COMPANY_MANAGER
        ],
        allowNull: false
      },
      show_on_registration: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      transport_company_linked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'Role',
      tableName: 'roles',
      timestamps: false
    }
  )

  return Role
}
