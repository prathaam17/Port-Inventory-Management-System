const sequelize = require('../config/db');

// Import models
const Role = require('./Role');
const User = require('./User');
const Cargo = require('./Cargo');
const Warehouse = require('./Warehouse');
const YardLocation = require('./YardLocation');
const Inventory = require('./Inventory');
const CustomsClearance = require('./CustomsClearance');
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');
const VesselCall = require('./VesselCall');
const DischargedInventoryLog = require('./DischargedInventoryLog');
const InventoryAdjustmentLog = require('./InventoryAdjustmentLog');
const InternalMoveLog = require('./InternalMoveLog');
const VesselProfile = require('./VesselProfile');
const VesselFalDeclaration = require('./VesselFalDeclaration');
const StowagePlan = require('./StowagePlan');
const StatementOfFact = require('./StatementOfFact');
const HolidayRegistry = require('./HolidayRegistry');
const SorTariffRule = require('./SorTariffRule');
const PDHold = require('./PDHold');
const Berth = require('./Berth');
const ContainerType = require('./ContainerType');
const ContainerOperationLog = require('./ContainerOperationLog');
const ReeferLog = require('./ReeferLog');
const ShippingAgentRegistration = require('./ShippingAgentRegistration');
const FileStore = require('./FileStore');

// Define associations

// 1. User & Role
Role.hasMany(User, { foreignKey: 'roleId', onDelete: 'RESTRICT' });
User.belongsTo(Role, { foreignKey: 'roleId' });

// 2. Cargo & Warehouse
Warehouse.hasMany(Cargo, { foreignKey: 'warehouseId', onDelete: 'SET NULL' });
Cargo.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

// 3. YardLocation & Warehouse
Warehouse.hasMany(YardLocation, { foreignKey: 'warehouseId', onDelete: 'CASCADE' });
YardLocation.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

// 4. Inventory
Cargo.hasMany(Inventory, { foreignKey: 'cargoId', onDelete: 'CASCADE' });
Inventory.belongsTo(Cargo, { foreignKey: 'cargoId' });

Warehouse.hasMany(Inventory, { foreignKey: 'warehouseId', onDelete: 'CASCADE' });
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

YardLocation.hasMany(Inventory, { foreignKey: 'yardLocationId', onDelete: 'SET NULL' });
Inventory.belongsTo(YardLocation, { foreignKey: 'yardLocationId' });

// 5. CustomsClearance
Cargo.hasOne(CustomsClearance, { foreignKey: 'cargoId', onDelete: 'CASCADE' });
CustomsClearance.belongsTo(Cargo, { foreignKey: 'cargoId' });

User.hasMany(CustomsClearance, { foreignKey: 'officerId', as: 'inspectedCustoms', onDelete: 'SET NULL' });
CustomsClearance.belongsTo(User, { foreignKey: 'officerId', as: 'officer' });



// 7. Invoice & Payment
Cargo.hasMany(Invoice, { foreignKey: 'cargoId', onDelete: 'CASCADE' });
Invoice.belongsTo(Cargo, { foreignKey: 'cargoId' });

Invoice.hasMany(Payment, { foreignKey: 'invoiceId', onDelete: 'CASCADE' });
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId' });

// AuditLog holds optional link to User (for reporting only, don't cascade delete)
User.hasMany(AuditLog, { foreignKey: 'userId', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(VesselCall, { foreignKey: 'userId', onDelete: 'SET NULL' });
VesselCall.belongsTo(User, { foreignKey: 'userId' });

// VesselProfile, FAL, Stowage associations
User.hasMany(VesselProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
VesselProfile.belongsTo(User, { foreignKey: 'userId' });

VesselCall.belongsTo(VesselProfile, { foreignKey: 'vesselProfileId', constraints: false });
VesselProfile.hasMany(VesselCall, { foreignKey: 'vesselProfileId', constraints: false });

VesselCall.hasMany(VesselFalDeclaration, { foreignKey: 'vcn', sourceKey: 'vcn', constraints: false });
VesselFalDeclaration.belongsTo(VesselCall, { foreignKey: 'vcn', targetKey: 'vcn', constraints: false });

VesselCall.hasMany(StowagePlan, { foreignKey: 'vcn', sourceKey: 'vcn', constraints: false });
StowagePlan.belongsTo(VesselCall, { foreignKey: 'vcn', targetKey: 'vcn', constraints: false });

VesselCall.hasMany(StatementOfFact, { foreignKey: 'vcn', sourceKey: 'vcn', constraints: false });
StatementOfFact.belongsTo(VesselCall, { foreignKey: 'vcn', targetKey: 'vcn', constraints: false });

// Tally & Adjustment Associations
User.hasMany(DischargedInventoryLog, { foreignKey: 'tallyClerkId' });
DischargedInventoryLog.belongsTo(User, { foreignKey: 'tallyClerkId', as: 'clerk' });

DischargedInventoryLog.hasMany(InventoryAdjustmentLog, { foreignKey: 'dischargedInventoryLogId', onDelete: 'CASCADE' });
InventoryAdjustmentLog.belongsTo(DischargedInventoryLog, { foreignKey: 'dischargedInventoryLogId' });

User.hasMany(InventoryAdjustmentLog, { foreignKey: 'authorizedBySupervisorId' });
InventoryAdjustmentLog.belongsTo(User, { foreignKey: 'authorizedBySupervisorId', as: 'supervisor' });

Cargo.hasMany(DischargedInventoryLog, { foreignKey: 'billOfLading', sourceKey: 'billOfLading', as: 'tallyLogs', constraints: false });
DischargedInventoryLog.belongsTo(Cargo, { foreignKey: 'billOfLading', targetKey: 'billOfLading', as: 'cargo', constraints: false });

// InternalMoveLog Associations
Cargo.hasMany(InternalMoveLog, { foreignKey: 'cargoId', onDelete: 'CASCADE' });
InternalMoveLog.belongsTo(Cargo, { foreignKey: 'cargoId' });

Warehouse.hasMany(InternalMoveLog, { as: 'sourceMoves', foreignKey: 'sourceWarehouseId', onDelete: 'SET NULL' });
InternalMoveLog.belongsTo(Warehouse, { as: 'sourceWarehouse', foreignKey: 'sourceWarehouseId' });

Warehouse.hasMany(InternalMoveLog, { as: 'destinationMoves', foreignKey: 'destinationWarehouseId', onDelete: 'SET NULL' });
InternalMoveLog.belongsTo(Warehouse, { as: 'destinationWarehouse', foreignKey: 'destinationWarehouseId' });

YardLocation.hasMany(InternalMoveLog, { as: 'sourceLocationMoves', foreignKey: 'sourceYardLocationId', onDelete: 'SET NULL' });
InternalMoveLog.belongsTo(YardLocation, { as: 'sourceYardLocation', foreignKey: 'sourceYardLocationId' });

YardLocation.hasMany(InternalMoveLog, { as: 'destinationLocationMoves', foreignKey: 'destinationYardLocationId', onDelete: 'SET NULL' });
InternalMoveLog.belongsTo(YardLocation, { as: 'destinationYardLocation', foreignKey: 'destinationYardLocationId' });

// PDHold & HolidayRegistry Associations
User.hasMany(PDHold, { foreignKey: 'agentId', onDelete: 'CASCADE' });
PDHold.belongsTo(User, { foreignKey: 'agentId', as: 'agent' });

Cargo.hasMany(PDHold, { foreignKey: 'cargoId', onDelete: 'CASCADE' });
PDHold.belongsTo(Cargo, { foreignKey: 'cargoId' });

User.hasMany(Invoice, { foreignKey: 'agentId', onDelete: 'SET NULL' });
Invoice.belongsTo(User, { foreignKey: 'agentId', as: 'agent' });

User.hasMany(Invoice, { foreignKey: 'payerAgentId', onDelete: 'SET NULL' });
Invoice.belongsTo(User, { foreignKey: 'payerAgentId', as: 'payerAgent' });

Cargo.belongsTo(VesselCall, { foreignKey: 'vesselName', targetKey: 'vesselName', as: 'vesselCall', constraints: false });
VesselCall.hasMany(Cargo, { foreignKey: 'vesselName', sourceKey: 'vesselName', as: 'cargoes', constraints: false });

// ContainerOperationLog Associations
Cargo.hasMany(ContainerOperationLog, { foreignKey: 'cargoId', onDelete: 'CASCADE' });
ContainerOperationLog.belongsTo(Cargo, { foreignKey: 'cargoId' });

Warehouse.hasMany(ContainerOperationLog, { foreignKey: 'warehouseId', onDelete: 'CASCADE' });
ContainerOperationLog.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

User.hasMany(ContainerOperationLog, { foreignKey: 'loggedBy', onDelete: 'SET NULL' });
ContainerOperationLog.belongsTo(User, { foreignKey: 'loggedBy', as: 'operator' });

module.exports = {
  sequelize,
  Role,
  User,
  Cargo,
  Warehouse,
  YardLocation,
  Inventory,
  CustomsClearance,
  Invoice,
  Payment,
  Notification,
  AuditLog,
  VesselCall,
  DischargedInventoryLog,
  InventoryAdjustmentLog,
  InternalMoveLog,
  VesselProfile,
  VesselFalDeclaration,
  StowagePlan,
  StatementOfFact,
  HolidayRegistry,
  SorTariffRule,
  PDHold,
  Berth,
  ContainerType,
  ContainerOperationLog,
  ReeferLog,
  ShippingAgentRegistration,
  FileStore
};
