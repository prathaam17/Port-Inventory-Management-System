const { Cargo, Warehouse, Invoice, AuditLog, Notification, Role, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Dashboard Overview Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Cargo KPI counts
    const activeCargoCount = await Cargo.count({
      where: { status: { [Op.ne]: 'Dispatched' } }
    });
    
    // 2. Cargo by type
    const cargoTypes = await Cargo.findAll({
      attributes: [
        'cargoType',
        [sequelize.fn('COUNT', sequelize.col('cargo_id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('weight_mats')), 'totalWeight']
      ],
      group: [sequelize.col('cargo_type'), 'cargoType']
    });

    // 3. Warehouse occupancy percentage
    const totalCapacity = await Warehouse.sum('capacity') || 0;
    const totalOccupied = await Warehouse.sum('occupiedSpace') || 0;
    const warehouseUtil = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

    // 4. Invoices total pending revenue vs paid revenue
    const paidRevenue = await Invoice.sum('totalAmount', { where: { status: 'Paid' } }) || 0;
    const pendingRevenue = await Invoice.sum('totalAmount', { where: { status: { [Op.in]: ['Unpaid', 'Pending'] } } }) || 0;

    // 5. Customs pending count
    const pendingCustomsCount = await Cargo.count({ where: { status: ['Unloaded', 'Allocated'] } });

    // 6. Recent activity (Audit logs)
    const recentActivity = await AuditLog.findAll({
      limit: 6,
      order: [['createdAt', 'DESC']]
    });



    return res.json({
      kpis: {
        activeCargoCount,
        warehouseUtil: Math.round(warehouseUtil * 10) / 10,
        paidRevenue,
        pendingRevenue,
        pendingCustomsCount
      },
      cargoTypes,
      recentActivity
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Analytics Reports: Revenue & Turnaround times
exports.getAnalyticsReports = async (req, res) => {
  try {
    // 1. Monthly Revenue
    const revenueByMonth = [
      { month: 'Jan', revenue: 0 },
      { month: 'Feb', revenue: 0 },
      { month: 'Mar', revenue: 0 },
      { month: 'Apr', revenue: 0 },
      { month: 'May', revenue: 0 }
    ];
    
    // Add current seeded invoices
    const paidInvoicesVal = await Invoice.sum('totalAmount', { where: { status: 'Paid' } }) || 0;
    revenueByMonth[4].revenue += paidInvoicesVal;

    // 2. Average turnaround time (From cargo entry to cargo exit for dispatched goods)
    const dispatchedCargoes = await Cargo.findAll({
      where: { status: 'Dispatched', exitTime: { [Op.ne]: null } }
    });

    let totalDurationHrs = 0;
    dispatchedCargoes.forEach(c => {
      const entry = new Date(c.entryTime || c.createdAt);
      const exit = new Date(c.exitTime);
      const diffMs = exit - entry;
      totalDurationHrs += diffMs / (1000 * 60 * 60); // convert to hours
    });

    const avgTurnaroundHrs = dispatchedCargoes.length > 0 ? (totalDurationHrs / dispatchedCargoes.length) : 0.0;

    // 3. Tonnage handled daily (Recent 7 days)
    const dailyTonnage = [
      { day: 'Mon', Container: 0, Bulk: 0, Liquid: 0, BreakBulk: 0 },
      { day: 'Tue', Container: 0, Bulk: 0, Liquid: 0, BreakBulk: 0 },
      { day: 'Wed', Container: 0, Bulk: 0, Liquid: 0, BreakBulk: 0 },
      { day: 'Thu', Container: 0, Bulk: 0, Liquid: 0, BreakBulk: 0 },
      { day: 'Fri', Container: 0, Bulk: 0, Liquid: 0, BreakBulk: 0 },
      { day: 'Sat', Container: 0, Bulk: 0, Liquid: 0, BreakBulk: 0 },
      { day: 'Sun', Container: 0, Bulk: 0, Liquid: 0, BreakBulk: 0 }
    ];

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Only load cargo from the last 7 days to calculate daily tonnage (O(N) in-memory data reduction)
    const cargoesForTonnage = await Cargo.findAll({
      where: {
        [Op.or]: [
          { entryTime: { [Op.gte]: sevenDaysAgo } },
          {
            entryTime: null,
            createdAt: { [Op.gte]: sevenDaysAgo }
          }
        ]
      }
    });
    cargoesForTonnage.forEach(c => {
      const date = new Date(c.entryTime || c.createdAt);
      const dayName = daysOfWeek[date.getDay()];
      const key = c.cargoType === 'Break Bulk' ? 'BreakBulk' : c.cargoType;
      
      const dayObj = dailyTonnage.find(d => d.day === dayName);
      if (dayObj && dayObj[key] !== undefined) {
        dayObj[key] += parseFloat(c.weight || 0);
      }
    });


    // 4. Dynamic operational summary metrics (statsSummary)
    const totalActiveTonnage = await Cargo.sum('weight', {
      where: { status: { [Op.ne]: 'Dispatched' } }
    }) || 0;

    // Use efficient DB counts instead of fetching all active cargo records
    const activeCount = await Cargo.count({
      where: { status: { [Op.ne]: 'Dispatched' } }
    });
    
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const demurrageCount = await Cargo.count({
      where: {
        status: { [Op.ne]: 'Dispatched' },
        [Op.or]: [
          { entryTime: { [Op.lt]: threeDaysAgo } },
          {
            entryTime: null,
            createdAt: { [Op.lt]: threeDaysAgo }
          }
        ]
      }
    });
    const demurrageRatio = activeCount > 0 ? Math.round((demurrageCount / activeCount) * 1000) / 10 : 0.0;

    const shippingAgentRole = await Role.findOne({ where: { name: 'Shipping Agent' } });
    const portAgencyPartners = shippingAgentRole 
      ? await User.count({ where: { roleId: shippingAgentRole.id } }) 
      : 0;

    const statsSummary = {
      avgTurnaroundDays: Math.round((avgTurnaroundHrs / 24) * 10) / 10,
      totalActiveTonnage,
      demurrageRatio,
      portAgencyPartners
    };

    return res.json({
      revenueByMonth,
      avgTurnaroundHrs: Math.round(avgTurnaroundHrs * 10) / 10,
      dailyTonnage,
      statsSummary
    });
  } catch (error) {
    console.error('Get analytics reports error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Get Audit Logs (For Super Admin audit panel)
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.json(logs);
  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Notifications management
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    return res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Mark notifications as read
exports.markNotificationsRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { isRead: false } });
    return res.json({ message: 'Notifications marked as read.' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};
