import { DataTypes } from "sequelize";
import db from "../../db/connection";

const Device = db.define(
  "Devices",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    device_key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    client_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
    // ===== CAMPOS DE MEMBRESÍA =====
    plan: {
      type: DataTypes.ENUM("basic", "pro", "ultimate"),
      allowNull: false,
      defaultValue: "basic",
      comment: "Plan de membresía del device",
    },
    subscription_status: {
      type: DataTypes.ENUM("inactive", "active", "suspended", "expired"),
      allowNull: false,
      defaultValue: "inactive",
      comment: "Estado actual de la suscripción. 'inactive' = nunca compró un plan",
    },
    subscription_end_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de vencimiento de la suscripción",
    },
    sessions_saved_this_month: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Contador de sesiones guardadas este mes (Plan Pro)",
    },
    last_session_reset: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: "Última vez que se reseteo el contador",
    },
    stripe_customer_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Stripe Customer ID asociado al device",
    },
    stripe_subscription_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Stripe Subscription ID activa del device",
    },
    cancel_at_period_end: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Si true, la suscripción se cancela al vencer el período",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    scopes: {
      withAll: {
        attributes: { include: ["password"] },
      },
    },
    indexes: [
      { fields: ["plan"] },
      { fields: ["subscription_status"] },
      { fields: ["subscription_end_date"] },
    ],
  },
);

export default Device;
