import { Model, DataTypes } from "sequelize";
import OrderStatus from "../../enums/orderStatus.js";
import costType from '../../enums/costType.js'

export default (sequelize) => {
  class Order extends Model {
    static associate(models) {
      this.belongsTo(models.LogisticsPoint, {
        foreignKey: "departure_id",
        as: "departure",
      });
      this.belongsTo(models.LogisticsPoint, {
        foreignKey: "destination_id",
        as: "destination",
      });
      this.belongsTo(models.Person, { foreignKey: "driver_id", as: "driver" });
      this.belongsTo(models.Person, {
        foreignKey: "manager_id",
        as: "manager",
      });
      this.belongsTo(models.Truck, { foreignKey: "truck_id", as: "truck" });
      this.belongsToMany(models.Nomenclature, {
        through: models.OrderNomenclature,
        foreignKey: "order_id",
        otherKey: "nomenclature_id",
        as: "nomenclatures",
      });
    }
  }

  Order.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      departure_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "logistics_points",
          key: "id",
        },
      },
      destination_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "logistics_points",
          key: "id",
        },
      },
      driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "persons",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM,
        values: Object.values(OrderStatus),
        allowNull: false,
        defaultValue: OrderStatus.CREATED,
      },
      manager_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "persons",
          key: "id",
        },
      },
      cost_type: {
        type: DataTypes.ENUM,
        values: Object.values(costType),
        allowNull: true,
      },
      price_cash: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      price_non_cash: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      delivery_date_plan: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      delivery_date_fact: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      departure_date_plan: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      departure_date_fact: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      truck_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "trucks",
          key: "id",
        },
      },
      geo: {
        type: DataTypes.STRING,
        allowNull: true
      },
      last_geo_update: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
      timestamps: true,
    }
  );

  return Order;
};
