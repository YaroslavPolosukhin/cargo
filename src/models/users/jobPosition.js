import { Model, DataTypes } from 'sequelize'

export default (sequelize) => {
  class JobPosition extends Model {
    static associate (models) {
      this.hasMany(models.Person, { foreignKey: 'job_position_id' })
    }
  }

  JobPosition.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'JobPosition',
    tableName: 'job_positions',
    timestamps: true
  })

  return JobPosition
}
