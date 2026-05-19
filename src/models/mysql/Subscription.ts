import { DataTypes } from "sequelize";
import db from "../../db/connection";

const Subscription = db.define(
  "Subscriptions",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    device_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Devices",
        key: "id",
      },
    },
    plan: {
      type: DataTypes.ENUM("basic", "pro", "ultimate"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "expired", "cancelled"),
      allowNull: false,
      defaultValue: "active",
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    payment_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "ID de pago (para futura integración con Stripe)",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["device_id"] },
      { fields: ["plan"] },
      { fields: ["status"] },
      { fields: ["end_date"] },
      { fields: ["device_id", "end_date"] },
    ],
  },
);

export default Subscription;
