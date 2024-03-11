import { Op } from "sequelize";
import { validationResult } from "express-validator";
import OrderStatus from "../enums/orderStatus.js";
import { models, sequelize } from "../models/index.js";

/**
 * Retrieves the list of available orders.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<void>} The function does not return anything.
 */
export const getAvailableOrders = async (req, res) => {
  const { limit, offset } = req.pagination;

  const options = {
    where: { status: OrderStatus.CREATED },
    include: [
      { model: models.LogisticsPoint, as: "departure" },
      { model: models.LogisticsPoint, as: "destination" },
      { model: models.Person, as: "driver" },
      { model: models.Person, as: "manager" },
      { model: models.Nomenclature, as: "nomenclatures" },
    ],
  };

  try {
    const count = await models.Person.count(options);
    const orders = await models.Order.findAll({ ...options, limit, offset });

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({ totalPages, count, orders });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

/**
 * Retrieves the current order for the authenticated user.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise} A Promise that resolves to the active order for the driver, or an error response.
 */
export const getCurrentOrder = async (req, res) => {
  try {
    const person = await models.Person.findOne({
      where: { user_id: req.user.id },
    });

    if (!person) {
      return res.status(404).send({ message: "Driver not found" });
    }

    const activeOrder = await models.Order.findOne({
      where: {
        driver_id: person.id,
        status: {
          [Op.not]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
        },
      },
      include: [
        { model: models.LogisticsPoint, as: "departure" },
        { model: models.LogisticsPoint, as: "destination" },
        { model: models.Person, as: "driver" },
        { model: models.Person, as: "manager" },
        { model: models.Nomenclature, as: "nomenclatures" },
      ],
    });

    if (!activeOrder) {
      return res
        .status(404)
        .send({ message: "No active order found for the driver" });
    }

    res.json({ order: activeOrder });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export const getOrderById = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await models.Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: models.LogisticsPoint,
          as: "departure",
          include: {
            model: models.Address,
            as: "Address",
          },
          attributes: ["name", "id"],
        },
        {
          model: models.LogisticsPoint,
          as: "destination",
          include: { model: models.Address, as: "Address" },
          attributes: ["name", "id"],
        },
        { model: models.Person, as: "driver" },
        { model: models.Person, as: "manager" },
        { model: models.Nomenclature, as: "nomenclatures" },
      ],
    });

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export const getAll = async (req, res) => {
  const { limit, offset } = req.pagination;
  const { status = "all" } = req.query;

  let _status = [OrderStatus.COMPLETED, OrderStatus.CANCELLED];
  switch (status.toLowerCase()) {
    case "confirmation":
      _status = [OrderStatus.CONFIRMATION];
      break;
    case "inwork":
      _status = [OrderStatus.LOADING, OrderStatus.DEPARTED];
      break;
    case "available":
      _status = [OrderStatus.CREATED];
      break;
  }

  const options = {
    where: { status: { [Op.in]: _status } },
    include: [
      { model: models.LogisticsPoint, as: "departure" },
      { model: models.LogisticsPoint, as: "destination" },
      { model: models.Person, as: "driver" },
      { model: models.Person, as: "manager" },
      { model: models.Nomenclature, as: "nomenclatures" },
    ],
  };

  try {
    const count = await models.Order.count(options);
    const orders = await models.Order.findAll({ ...options, limit, offset });
    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({ totalPages, count, orders });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

/**
 * Creates a new order by the manager.
 *
 * @param {Object} req - The request object, containing the order details.
 * @param {Object} res - The response object to send back the response.
 * @return {Promise} A Promise that resolves to the creation of a new order.
 */
export const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }
  const transaction = await sequelize.transaction();

  try {
    const {
      departureId,
      destinationId,
      grossWeight,
      netWeight,
      plannedLoadingDate,
      plannedDeliveryDate,
      nomenclatureIds,
    } = req.body;

    const person = await models.Person.findByUserId(req.user.id);
    if (!person) {
      return res.status(404).send({ message: "Manager not found" });
    }

    // Retrieve departure and destination instances
    const departure = await models.LogisticsPoint.findByPk(departureId);
    if (!departure) {
      return res.status(404).json({ message: "Departure not found." });
    }

    const destination = await models.LogisticsPoint.findByPk(destinationId);
    if (!destination) {
      return res.status(404).json({ message: "Destination not found." });
    }

    if (!nomenclatureIds || !nomenclatureIds.length) {
      return res.status(400).json({ message: "Nomenclature IDs are required" });
    }

    // console.log("dgyjhdsgjhdjhg");

    // Create new order with the associated departure and destination
    const newOrder = await models.Order.create(
      {
        departure_id: departure.id,
        destination_id: destination.id,
        manager_id: person.id,
        gross_weight: grossWeight,
        net_weight: netWeight,
        departure_date_plan: new Date(plannedLoadingDate),
        delivery_date_plan: new Date(plannedDeliveryDate),
        cost_per_route: req.body?.costPerRoute,
        cost_per_ton: req.body?.costPerTon,
        price_cash: req.body?.priceCash,
        price_non_cash: req.body?.priceNonCash,
      },
      { transaction }
    );

    await newOrder.addNomenclatures(nomenclatureIds, { transaction });
    await transaction.commit();

    const orderWithNomenclatures = await models.Order.findOne(
      {
        where: { id: newOrder.id },
      },
      { transaction }
    );

    return res.status(201).json({ order: orderWithNomenclatures });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while creating the order." });
  }
};

export const updateOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }
  const { orderId } = req.params;
  const dataForUpdate = req.body;

  try {
    const order = await models.Order.findByPk(orderId);
    if (order === null) {
      return res.status(404).json({ error: "Order not found" });
    }
    await order.update(dataForUpdate);
    return res.status(200).json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Takes an order and marks it as "Waiting for Confirmation".
 *
 * @param {Object} req - The request object containing the order details.
 * @param {Object} res - The response object to send the result.
 * @return {Promise<void>} A promise that resolves when the order is marked as waiting for confirmation.
 */
export const takeOrder = async (req, res) => {
  const { orderId } = req.body;

  try {
    const person = await models.Person.findByUserId(req.user.id);
    if (!person) {
      return res.status(404).send({ message: "Driver not found" });
    }

    const existingOrder = await models.Order.findOne({
      where: {
        driver_id: person.id,
        status: {
          [Op.not]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
        },
      },
    });

    if (existingOrder) {
      return res
        .status(400)
        .send({ message: "Driver already has an active order" });
    }

    // Mark the order as "Waiting for Confirmation"
    const result = await models.Order.update(
      { status: OrderStatus.CONFIRMATION, driver_id: person.id },
      { where: { id: orderId, status: OrderStatus.CREATED } }
    );

    if (result[0] === 0) {
      return res
        .status(404)
        .send({ message: "Order not found or not available for confirmation" });
    }

    res
      .status(200)
      .send({ message: "Order marked as waiting for confirmation" });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

/**
 * Confirms an order by updating its status to 'loading' if the current status is 'confirmation'.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The response object with a message indicating the order has been confirmed and marked as loading.
 */
export const confirmOrder = async (req, res) => {
  try {
    const { orderId, plannedLoadingDate, plannedArrivalDate, vinCode } =
      req.body;
    const formattedVinCode = vinCode.replace(/\s/g, "");

    const [truck] = await models.Truck.findOrCreate({
      where: { vin: formattedVinCode },
      defaults: { vin: formattedVinCode },
    });

    const [updated] = await models.Order.update(
      {
        status: OrderStatus.LOADING,
        departure_date_plan: new Date(plannedLoadingDate),
        delivery_date_plan: new Date(plannedArrivalDate),
        truck_id: truck.id,
      },
      {
        where: {
          id: orderId,
          status: OrderStatus.CONFIRMATION,
        },
      }
    );

    if (updated === 0) {
      return res
        .status(400)
        .send({ message: "Order not found or not in confirmation status" });
    }

    return res
      .status(200)
      .send({ message: "Order confirmed by manager and marked as loading" });
  } catch (error) {
    console.error(error);
    return res.status(500).send();
  }
};

/**
 * Rejects the confirmation request from a driver by resetting the order status to 'created' and clearing the driver_id.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<Object>} The response object with a message indicating the order has been reset.
 */
export const rejectDriver = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Reset the order status to 'created' and clear the driver_id
    const [updated] = await models.Order.update(
      { status: OrderStatus.CREATED, driver_id: null, truck_id: null },
      {
        where: {
          id: orderId,
          status: OrderStatus.CONFIRMATION,
        },
      }
    );

    if (updated === 0) {
      return res
        .status(400)
        .send({ message: "Order not found or not in confirmation status" });
    }

    return res.status(200).send({
      message:
        "Driver confirmation request rejected, order status reset to created",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send();
  }
};

/**
 * Updates the order status to 'departed' if the current status is 'loading'.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<Object>} The updated order status or an error message.
 */
export const markOrderAsDeparted = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Update the order status to 'departed' if the current status is 'loading'
    const [updated] = await models.Order.update(
      { status: OrderStatus.DEPARTED },
      {
        where: {
          id: orderId,
          status: OrderStatus.LOADING,
        },
      }
    );

    if (updated === 0) {
      return res
        .status(404)
        .send({ message: "Order not found or not in loading status" });
    }

    return res
      .status(200)
      .send({ message: "Driver has departed and order status updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).send();
  }
};

/**
 * Updates the order status to 'completed' if the current status is 'departed'.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @return {Promise} a Promise that resolves to a response object
 */
export const markOrderAsCompleted = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Update the order status to 'completed' if the current status is 'departed'
    const [updated] = await models.Order.update(
      { status: OrderStatus.COMPLETED },
      {
        where: {
          id: orderId,
          status: OrderStatus.DEPARTED,
        },
      }
    );

    if (updated === 0) {
      return res
        .status(404)
        .send({ message: "Order not found or not in departed status" });
    }

    return res
      .status(200)
      .send({ message: "Order has been completed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).send();
  }
};

/**
 * Retrieves the list of drivers who are currently on a trip.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @return {Promise} a Promise that resolves to a response object
 */
export const getDriversOnTrip = async (req, res) => {
  try {
    const departedOrders = await models.Order.findAll({
      where: { status: OrderStatus.DEPARTED },
      include: [
        {
          model: models.Person,
          as: "driver",
          attributes: ["id", "name", "surname"],
        },
      ],
      attributes: ["id", "geo"],
    });

    const departedOrdersWithDrivers = departedOrders.map((order) => ({
      orderId: order.id,
      geo: order.geo,
      driver: {
        id: order.driver.id,
        name: order.driver.name,
        surname: order.driver.surname,
      },
    }));

    return res.status(200).send(departedOrdersWithDrivers);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: "An error occurred while retrieving drivers on trip" });
  }
};

/**
 * Updates the geo location of an order.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @return {Promise} A promise that resolves to the HTTP response.
 */
export const updateGeo = async (req, res) => {
  try {
    const { orderId, latitude, longitude } = req.body;
    const order = await models.Order.findByPk(orderId);
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    await models.MovingHistory.create({
      order_id: orderId,
      time: new Date(),
      geo: { type: "Point", coordinates: [longitude, latitude] },
      latitude,
      longitude,
    });

    order.geo = { type: "Point", coordinates: [longitude, latitude] };
    await order.save();
    return res.status(200).send({ message: "Order geo updated successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: "An error occurred while updating order geo" });
  }
};

export default {
  getAvailableOrders,
  getCurrentOrder,
  getOrderById,
  getAll,
  createOrder,
  takeOrder,
  confirmOrder,
  rejectDriver,
  markOrderAsDeparted,
  markOrderAsCompleted,
  getDriversOnTrip,
  updateGeo,
  updateOrder,
};
