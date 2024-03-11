const { Op } = require('sequelize')
const cron = require('node-cron')
const models = require('../models').models
const notificationService = require('./notificationsService')
const OrderStatus = require('../enums/orderStatus')

async function checkOrders () {
  const orders = await models.Order.findAll({
    where: {
      status: {
        [Op.not]: OrderStatus.COMPLETED,
        [Op.not]: OrderStatus.CANCELLED,
        [Op.not]: OrderStatus.CREATED
      }
    },
    include: [
      { model: models.User, as: 'user' },
      { model: models.Person, as: 'driver' },
      { model: models.Person, as: 'manager' },
      { model: models.Departure, as: 'departure' },
      { model: models.Destination, as: 'destination' }
    ]
  })

  const currentDate = new Date()
  for (const order of orders) {
    const managerUser = order.user

    if (order.departure_date_plan < currentDate && order.status !== OrderStatus.DEPARTED) {
      notificationService.sendNotificationToUser(managerUser.id, 'Уведомление', 'Плановая дата погрузки прошла, а водитель не вышел в рейс')
    }

    if (order.delivery_date_plan < currentDate) {
      notificationService.sendNotificationToUser(managerUser.id, 'Уведомление', 'Плановая дата прибытия прошла, а водитель не завершил рейс')
    }
  }
}

module.exports.start = () => {
  cron.schedule('*/15 * * * *', () => {
    console.log('Проверка заказов...')
    checkOrders()
  })
}
