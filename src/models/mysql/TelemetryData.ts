import { DataTypes } from "sequelize";
import db from "../../db/connection";

const TelemetryData = db.define(
  "TelemetryData",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "TelemetrySessions",
        key: "id",
      },
    },
    device_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Devices",
        key: "id",
      },
    },
    rpm: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    water_temp: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    oil_temp: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    oil_press: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    fuel_press: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    sonda: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    gear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Timestamp del dato (del device)",
    },
  },
  {
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["session_id"] },
      { fields: ["device_id"] },
      { fields: ["timestamp"] },
      { fields: ["session_id", "timestamp"] },
      { fields: ["device_id", "timestamp"] },
    ],
  },
);

export default TelemetryData;
