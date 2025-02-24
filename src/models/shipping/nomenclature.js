import { Model, DataTypes, Op } from 'sequelize'

export default (sequelize) => {
  class Nomenclature extends Model {
    static associate (models) {
      this.belongsTo(models.Measure, { foreignKey: 'measure_id', as: 'measure' })
      this.belongsToMany(models.Order, {
        through: models.OrderNomenclature,
        foreignKey: 'nomenclature_id',
        otherKey: 'order_id',
        as: 'orders'
      })
    }
  }

  Nomenclature.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    measure_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'measures',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Nomenclature',
    tableName: 'nomenclatures',
    timestamps: false
  })

  Nomenclature.searchByName = async (name) => {
    return Nomenclature.findAll({
      where: {
        name: {
          [Op.like]: `%${name}%`
        }
      }
    })
  }

  return Nomenclature
}
