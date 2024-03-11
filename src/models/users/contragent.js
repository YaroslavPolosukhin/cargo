import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class Contragent extends Model {
    static associate (models) {
      this.hasMany(models.Person, { foreignKey: 'contragent_id' })
    }
  }

  Contragent.init({
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
    inn: {
      type: DataTypes.STRING,
      allowNull: false
    },
    kpp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    supplier: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    buyer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    transport_company: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Contragent',
    tableName: 'contragents',
    timestamps: true
  })

  return Contragent
}
