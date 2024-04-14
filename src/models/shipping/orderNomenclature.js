import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class OrderNomenclature extends Model {
    static associate (models) {
      this.belongsTo(models.Order, {
        foreignKey: 'order_id', as: 'order'
      })

      this.belongsTo(models.Nomenclature, {
        foreignKey: 'nomenclature_id', as: 'nomenclature'
      })
    }
  }

  OrderNomenclature.init({
    order_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'orders',
        key: 'id'
      },
      primaryKey: true
    },
    nomenclature_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'nomenclatures',
        key: 'id'
      },
      primaryKey: true
    },
    weight: {
      type: DataTypes.FLOAT
    },
  }, {
    sequelize,
    modelName: 'OrderNomenclature',
    tableName: 'order_nomenclatures',
    timestamps: false
  })

  return OrderNomenclature
}
