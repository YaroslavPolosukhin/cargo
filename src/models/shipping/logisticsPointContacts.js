import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class LogisticsPointContacts extends Model {
    static associate (models) {
      this.belongsTo(models.LogisticsPoint, {
        foreignKey: 'logistics_point_id', as: 'logisticsPoint'
      })

      this.belongsTo(models.Contact, {
        foreignKey: 'contact_id', as: 'contact'
      })
    }
  }

  LogisticsPointContacts.init({
    logistics_point_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'logistics_points',
        key: 'id'
      },
      primaryKey: true
    },
    contact_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'contacts',
        key: 'id'
      },
      primaryKey: true
    }
  }, {
    sequelize,
    modelName: 'LogisticsPointContacts',
    tableName: 'logistics_point_contacts',
    timestamps: false
  })

  return LogisticsPointContacts
}
