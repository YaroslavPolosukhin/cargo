import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class DisabledLocation extends Model {
    static associate (models) {
      this.belongsTo(models.Person, { foreignKey: 'person_id', as: 'person' })
    }
  }

  DisabledLocation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    person_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'persons',
        key: 'id'
      },
    },
    last_connection: {
      type: DataTypes.DATE,
      allowNull: false
    },
  }, {
    sequelize,
    modelName: 'DisabledLocation',
    tableName: 'disabled_location',
    timestamps: false
  })

  return DisabledLocation
}
